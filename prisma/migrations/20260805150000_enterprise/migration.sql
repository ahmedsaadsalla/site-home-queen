-- Enterprise: sessões, alertas, analytics, integridade
ALTER TABLE "admin_sessions" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

CREATE TABLE IF NOT EXISTS "system_alerts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_alerts_code_active_idx" ON "system_alerts"("code", "active");
CREATE INDEX IF NOT EXISTS "system_alerts_active_createdAt_idx" ON "system_alerts"("active", "createdAt");
CREATE INDEX IF NOT EXISTS "system_alerts_severity_idx" ON "system_alerts"("severity");

CREATE TABLE IF NOT EXISTS "site_views" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "productId" TEXT,
    "sessionId" TEXT,
    "ip" TEXT,
    CONSTRAINT "site_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "site_views_createdAt_idx" ON "site_views"("createdAt");
CREATE INDEX IF NOT EXISTS "site_views_path_idx" ON "site_views"("path");
CREATE INDEX IF NOT EXISTS "site_views_productId_idx" ON "site_views"("productId");

CREATE TABLE IF NOT EXISTS "integrity_reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "summary" TEXT NOT NULL DEFAULT '',
    "issues" JSONB NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integrity_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "integrity_reports_createdAt_idx" ON "integrity_reports"("createdAt");

INSERT INTO "site_settings" ("key", "value", "updatedAt")
SELECT 'backup_external', '{"provider":"none","enabled":false,"bucket":"","region":"","endpoint":"","accessKeyId":"","secretAccessKey":"","prefix":"homequeen/","emailAlerts":true,"alertEmail":""}'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "site_settings" WHERE "key" = 'backup_external');

INSERT INTO "site_settings" ("key", "value", "updatedAt")
SELECT 'alert_settings', '{"emailEnabled":false,"emailTo":""}'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "site_settings" WHERE "key" = 'alert_settings');
