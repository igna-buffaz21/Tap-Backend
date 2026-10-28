BEGIN;

CREATE TABLE product_identification (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_identification_product
        FOREIGN KEY (product_id) REFERENCES product(id),

    CONSTRAINT chk_identification_type
        CHECK (type IN ('RFID_UHF', 'EAN_13', 'QR')),

    CONSTRAINT uq_product_identification
        UNIQUE (business_id, type, value)
);

CREATE INDEX idx_product_identification_product
    ON product_identification(product_id);

COMMIT;