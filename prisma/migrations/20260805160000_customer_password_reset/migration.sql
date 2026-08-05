-- Tokens de redefinição de senha do cliente
CREATE TABLE IF NOT EXISTS "customer_password_resets" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_password_resets_tokenHash_key" ON "customer_password_resets"("tokenHash");
CREATE INDEX IF NOT EXISTS "customer_password_resets_customerId_idx" ON "customer_password_resets"("customerId");
CREATE INDEX IF NOT EXISTS "customer_password_resets_expiresAt_idx" ON "customer_password_resets"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "customer_password_resets"
    ADD CONSTRAINT "customer_password_resets_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
