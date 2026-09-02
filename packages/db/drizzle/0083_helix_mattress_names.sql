-- Custom data migration (owner ask 2026-09-01): Helix mattresses came in
-- from the Shopify sync as one product per Shopify variant, named
-- "<title> — <size> / <cover> / <support>". The register only needs the
-- size, the mattress and its firmness, size first:
--
--   Helix Twilight 11.5" Firm Hybrid Mattress — Twin / Breeathe Knit Cover / ErgoAlign Support
--   → Twin Helix Twilight 11.5" Firm Hybrid Mattress
--
-- Scope: products whose name starts with "Helix", contains "Mattress" and
-- still carries the " — <variant>" tail. Non-mattress Helix items
-- (bases, pillows) and already-short names are untouched, so the
-- statement is idempotent. SKUs, prices and stock are not touched;
-- historical order/sale lines keep the description they were sold under.
-- search_tsv is a generated column and follows the new name on its own.
UPDATE "products"
SET "name" = btrim(regexp_replace("name", '^(Helix .*Mattress) — ([^/]+?)\s*(/.*)?$', '\2 \1')),
    "updated_at" = now()
WHERE "name" ~ '^Helix .*Mattress — [^/]+';
