-- Data repair (handoff 2026-08-30): split-order money integrity.
--
-- 1) Recycling fees are never taxable (owner rule). Zero the rate and tax
--    on fee lines of orders still in flight, then rebuild those orders'
--    headers from their lines and refresh their deposit-required figure.
-- 2) For already-split families (child.notes = 'Split from <parent number>')
--    where the parent holds more collected money than its own total while a
--    child still shows a balance, move the excess to the child — newest
--    payment rows first, splitting a straddling row so both halves keep the
--    same method and processor reference — and refresh both pieces'
--    deposit-required. This is the SO-2026-000018 / -A repair.
--
-- Idempotent: a second run finds no taxed fee lines and no overpaid split
-- parents, so it changes nothing.
DO $$
DECLARE
  fee_orders uuid[];
  pair RECORD;
  pay RECORD;
  parent_paid integer;
  child_paid integer;
  move_cents integer;
  remaining integer;
BEGIN
  -- ---- (1) untax in-flight recycling-fee lines --------------------------
  SELECT array_agg(DISTINCT l.order_id) INTO fee_orders
  FROM order_lines l
  JOIN orders o ON o.id = l.order_id
  WHERE o.status IN ('draft', 'quote', 'open')
    AND l.description ILIKE '%recycling fee%'
    AND (l.tax_rate_bps <> 0 OR l.tax_cents <> 0);

  IF fee_orders IS NOT NULL THEN
    UPDATE order_lines
    SET tax_rate_bps = 0, tax_cents = 0
    WHERE order_id = ANY (fee_orders)
      AND description ILIKE '%recycling fee%'
      AND (tax_rate_bps <> 0 OR tax_cents <> 0);

    -- Header money is always a function of the lines (recomputeTotals
    -- invariant): tax = sum of line tax, total = subtotal - discount + tax
    -- + the untaxed step-3 fees.
    UPDATE orders o
    SET tax_cents = agg.tax,
        total_cents = o.subtotal_cents - o.discount_cents + agg.tax
          + o.delivery_fee_cents + o.install_fee_cents + o.other_fee_cents,
        updated_at = now()
    FROM (
      SELECT order_id, COALESCE(SUM(tax_cents), 0) AS tax
      FROM order_lines
      WHERE order_id = ANY (fee_orders)
      GROUP BY order_id
    ) agg
    WHERE o.id = agg.order_id;

    -- 25% policy deposit on the corrected total, rounded up, capped at it.
    UPDATE orders
    SET deposit_required_cents =
          LEAST(total_cents, (total_cents * 2500 + 9999) / 10000),
        updated_at = now()
    WHERE id = ANY (fee_orders);

    INSERT INTO audit_logs (business_id, actor_type, action, target_type, target_id, changes_json)
    SELECT o.business_id, 'system', 'order.repair.untax_recycling_fee', 'order', o.id::text,
           jsonb_build_object('after', jsonb_build_object(
             'taxCents', o.tax_cents,
             'totalCents', o.total_cents,
             'reason', 'recycling fees are not taxable (repair 2026-08-30)'))
    FROM orders o
    WHERE o.id = ANY (fee_orders);
  END IF;

  -- ---- (2) reallocate split-family payments -----------------------------
  FOR pair IN
    SELECT child.id       AS child_id,
           child.number   AS child_number,
           child.total_cents AS child_total,
           parent.id      AS parent_id,
           parent.number  AS parent_number,
           parent.total_cents AS parent_total,
           parent.business_id AS business_id
    FROM orders child
    JOIN orders parent
      ON parent.business_id = child.business_id
     AND parent.number = substring(child.notes FROM 12)
    WHERE child.notes LIKE 'Split from %'
      AND child.status IN ('draft', 'quote', 'open')
      AND parent.status IN ('draft', 'quote', 'open')
    ORDER BY child.number
  LOOP
    SELECT COALESCE(SUM(amount_cents), 0) INTO parent_paid
    FROM payments WHERE order_id = pair.parent_id AND status = 'succeeded';
    SELECT COALESCE(SUM(amount_cents), 0) INTO child_paid
    FROM payments WHERE order_id = pair.child_id AND status = 'succeeded';

    move_cents := LEAST(parent_paid - pair.parent_total, pair.child_total - child_paid);
    IF move_cents > 0 THEN
      remaining := move_cents;
      FOR pay IN
        SELECT * FROM payments
        WHERE order_id = pair.parent_id AND status = 'succeeded'
        ORDER BY created_at DESC
      LOOP
        EXIT WHEN remaining <= 0;
        IF pay.amount_cents <= remaining THEN
          UPDATE payments SET order_id = pair.child_id WHERE id = pay.id;
          remaining := remaining - pay.amount_cents;
        ELSE
          UPDATE payments SET amount_cents = pay.amount_cents - remaining WHERE id = pay.id;
          INSERT INTO payments (business_id, sale_id, order_id, kind, method, amount_cents,
                                processor, processor_ref, financing_provider, financing_ref,
                                status, created_at)
          VALUES (pay.business_id, NULL, pair.child_id, pay.kind, pay.method, remaining,
                  pay.processor, pay.processor_ref, pay.financing_provider, pay.financing_ref,
                  'succeeded', pay.created_at);
          remaining := 0;
        END IF;
      END LOOP;

      INSERT INTO audit_logs (business_id, actor_type, action, target_type, target_id, changes_json)
      VALUES
        (pair.business_id, 'system', 'order.payment.reallocate', 'order', pair.parent_id::text,
         jsonb_build_object('after', jsonb_build_object(
           'toOrderId', pair.child_id, 'toNumber', pair.child_number,
           'amountCents', move_cents - remaining,
           'reason', 'payment reallocated on split (repair 2026-08-30)'))),
        (pair.business_id, 'system', 'order.payment.reallocate', 'order', pair.child_id::text,
         jsonb_build_object('after', jsonb_build_object(
           'fromOrderId', pair.parent_id, 'fromNumber', pair.parent_number,
           'amountCents', move_cents - remaining,
           'reason', 'payment reallocated on split (repair 2026-08-30)')));

      UPDATE orders
      SET deposit_required_cents =
            LEAST(total_cents, (total_cents * 2500 + 9999) / 10000),
          updated_at = now()
      WHERE id IN (pair.parent_id, pair.child_id);
    END IF;
  END LOOP;
END $$;
