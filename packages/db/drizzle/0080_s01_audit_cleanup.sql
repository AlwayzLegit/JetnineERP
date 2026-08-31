-- S01 browser-audit cleanup (owner decision 2026-08-31).
-- The audit session left test records in production: customer
-- "ZZTEST Audit S01 1" (9d058b82-4a7a-41fc-aaee-f51d7df40f99), orders
-- SO-2026-000050/-000051/-000052, and a phantom $1,254.50 cash payment
-- on -000052 that pollutes the drawer and revenue reports. This
-- removes them completely: reserved units are handed back to stock,
-- then the orders (cascading lines, payments, deliveries) and the
-- customer are deleted. Idempotent — a rerun finds nothing to do.
DO $$
DECLARE
  cust uuid := '9d058b82-4a7a-41fc-aaee-f51d7df40f99';
  biz uuid;
  removed_orders int := 0;
  removed_payment_cents bigint := 0;
BEGIN
  SELECT business_id INTO biz FROM customers WHERE id = cust;
  IF biz IS NULL THEN
    RETURN; -- already cleaned up
  END IF;

  -- Hand any still-reserved units back to the shelf before the lines go.
  UPDATE inventory_levels il
     SET reserved = GREATEST(0, il.reserved - x.qty)
    FROM (
      SELECT ol.variant_id,
             COALESCE(ol.source_location_id, o.stock_location_id, o.location_id) AS loc,
             SUM(ol.qty_reserved) AS qty
        FROM order_lines ol
        JOIN orders o ON o.id = ol.order_id
       WHERE o.customer_id = cust
         AND ol.qty_reserved > 0
         AND ol.variant_id IS NOT NULL
       GROUP BY 1, 2
    ) x
   WHERE il.variant_id = x.variant_id
     AND il.location_id = x.loc;

  SELECT COALESCE(SUM(p.amount_cents), 0) INTO removed_payment_cents
    FROM payments p
    JOIN orders o ON o.id = p.order_id
   WHERE o.customer_id = cust;

  SELECT COUNT(*) INTO removed_orders FROM orders WHERE customer_id = cust;

  -- Cascades take order_lines, payments, deliveries and delivery_lines.
  DELETE FROM orders WHERE customer_id = cust;
  DELETE FROM customers WHERE id = cust;

  INSERT INTO audit_logs (business_id, actor_type, action, target_type, target_id, changes_json)
  VALUES (biz, 'system', 'data.repair.s01_audit_cleanup', 'customer', cust::text,
          jsonb_build_object('after', jsonb_build_object(
            'removedOrders', removed_orders,
            'removedPaymentCents', removed_payment_cents,
            'reason', 'S01 browser-audit test records removed (owner decision 2026-08-31)')));
END $$;
