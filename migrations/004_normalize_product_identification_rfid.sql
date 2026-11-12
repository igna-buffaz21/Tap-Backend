BEGIN;

-- Prevent writes while existing identifiers are converted to the new format.
LOCK TABLE product_identification IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM product_identification
        WHERE type = 'RFID_UHF'
          AND btrim(value) !~* '^([0-9a-f]{8}|[0-9a-f]{24})$'
    ) THEN
        RAISE EXCEPTION 'RFID_UHF identifiers must contain 8 or 24 hexadecimal characters. Correct invalid values before retrying migration 004.';
    END IF;
END;
$$;

-- The existing UNIQUE (business_id, type, value) constraint rejects collisions.
-- If serials collapse to the same product code, the migration rolls back;
-- resolve those assignments explicitly rather than discarding rows here.
UPDATE product_identification
SET value = upper(
    CASE
        WHEN length(btrim(value)) = 24 THEN substring(btrim(value) FROM 5 FOR 8)
        ELSE btrim(value)
    END
)
WHERE type = 'RFID_UHF';

COMMIT;
