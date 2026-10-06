CREATE TABLE IF NOT EXISTS medical_services (
  code_nomenclature  VARCHAR(20)  NOT NULL,
  code_mis           VARCHAR(20)  NOT NULL,
  service_name       TEXT         NOT NULL,
  service_type       VARCHAR(20)  NOT NULL,
  duration_text      VARCHAR(50),
  duration_min       INT,
  price_rub          NUMERIC(12, 2),
  price_category_i   NUMERIC(12, 2),
  price_category_ii  NUMERIC(12, 2),
  price_category_iii NUMERIC(12, 2),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (code_nomenclature, code_mis)
);

ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS service_type      VARCHAR(20) NOT NULL DEFAULT 'consultation';
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS duration_text     VARCHAR(50);
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS duration_min      INT;
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS price_rub         NUMERIC(12, 2);
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS price_category_i  NUMERIC(12, 2);
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS price_category_ii NUMERIC(12, 2);
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS price_category_iii NUMERIC(12, 2);
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE medical_services ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE medical_services DROP CONSTRAINT IF EXISTS medical_services_type_check;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM medical_services WHERE service_type NOT IN ('consultation', 'surgery')) THEN
    RAISE EXCEPTION 'В medical_services есть строки с недопустимым service_type — исправьте их перед добавлением CHECK';
  END IF;

  ALTER TABLE medical_services
    ADD CONSTRAINT medical_services_type_check CHECK (service_type IN ('consultation', 'surgery'));
END;
$$;

CREATE INDEX IF NOT EXISTS medical_services_type_idx ON medical_services (service_type);
CREATE INDEX IF NOT EXISTS medical_services_code_mis_idx ON medical_services (code_mis);

CREATE OR REPLACE FUNCTION medical_services_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'medical_services_updated_at' AND tgrelid = 'medical_services'::regclass
  ) THEN
    CREATE TRIGGER medical_services_updated_at
    BEFORE UPDATE ON medical_services
    FOR EACH ROW EXECUTE FUNCTION medical_services_set_updated_at();
  END IF;
END;
$$;

COMMENT ON COLUMN medical_services.service_type IS 'consultation или surgery';
COMMENT ON COLUMN medical_services.duration_text IS 'длительность консультации текстом: «до 40»';
COMMENT ON COLUMN medical_services.duration_min IS 'длительность операции в минутах';