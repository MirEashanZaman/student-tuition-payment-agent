CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) UNIQUE NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  daily_limit NUMERIC(14, 2) NOT NULL DEFAULT 1000000.00,
  daily_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  annual_limit NUMERIC(14, 2) NOT NULL DEFAULT 1500000.00,
  annual_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'STUDENT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rates (
  id VARCHAR(64) PRIMARY KEY,
  provider_name VARCHAR(255) NOT NULL,
  source_currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  target_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(12, 6) NOT NULL,
  inverse_rate NUMERIC(12, 4) NOT NULL,
  transfer_fee_flat_bdt NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  transfer_fee_percent NUMERIC(6, 4) NOT NULL DEFAULT 0.00,
  speed_hours INTEGER NOT NULL,
  speed_description VARCHAR(255) NOT NULL,
  reliability_score NUMERIC(4, 2) NOT NULL DEFAULT 0.95,
  compliance_rating VARCHAR(100) NOT NULL DEFAULT 'A+',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  recipient_university VARCHAR(255) NOT NULL,
  student_reg_number VARCHAR(100),
  source_currency VARCHAR(10) DEFAULT 'BDT',
  target_currency VARCHAR(10) DEFAULT 'USD',
  target_amount_usd NUMERIC(12, 2) NOT NULL,
  source_amount_bdt NUMERIC(14, 2) NOT NULL,
  fee_total_bdt NUMERIC(10, 2) NOT NULL,
  fx_rate_applied NUMERIC(12, 4) NOT NULL,
  rate_id VARCHAR(64) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  tuition_deadline TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  deadline_warning BOOLEAN DEFAULT FALSE,
  confirmation_token VARCHAR(128),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  why_recommended TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  permission_tier VARCHAR(30) NOT NULL,
  account_id VARCHAR(64),
  transfer_id VARCHAR(64),
  action_summary VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(30) NOT NULL,
  ip_address VARCHAR(64) DEFAULT '127.0.0.1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfers_account ON transfers(account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_student ON transfers(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tier ON audit_log(permission_tier);
