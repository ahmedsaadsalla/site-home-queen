-- Monitoramento, versão e metadados de backup
CREATE TABLE IF NOT EXISTS "system_errors" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "source" TEXT NOT NULL DEFAULT 'api',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "url" TEXT,
    "user" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    CONSTRAINT "system_errors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_errors_createdAt_idx" ON "system_errors"("createdAt");
CREATE INDEX IF NOT EXISTS "system_errors_severity_idx" ON "system_errors"("severity");
CREATE INDEX IF NOT EXISTS "system_errors_source_idx" ON "system_errors"("source");

CREATE TABLE IF NOT EXISTS "system_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT 'Sistema',
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "system_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_versions_releasedAt_idx" ON "system_versions"("releasedAt");
CREATE INDEX IF NOT EXISTS "system_versions_isCurrent_idx" ON "system_versions"("isCurrent");

CREATE TABLE IF NOT EXISTS "backup_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastDailyAt" TIMESTAMP(3),
    "lastWeeklyAt" TIMESTAMP(3),
    "lastMonthlyAt" TIMESTAMP(3),
    "lastManualAt" TIMESTAMP(3),
    "nextDailyAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backup_meta_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_versions" ("id", "version", "description", "author", "releasedAt", "isCurrent")
SELECT 'ver_1_0_0', '1.0.0', 'Primeira versão em produção.', 'Sistema', CURRENT_TIMESTAMP, true
WHERE NOT EXISTS (SELECT 1 FROM "system_versions" WHERE "version" = '1.0.0');

INSERT INTO "backup_meta" ("id", "installedAt", "updatedAt")
SELECT 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "backup_meta" WHERE "id" = 1);

INSERT INTO "site_settings" ("key", "value", "updatedAt")
SELECT 'maintenance', '{"enabled":false,"message":"Estamos realizando melhorias em nosso site.\n\nVoltaremos em breve.\n\nObrigado pela compreensão.","eta":"","phone":"","whatsapp":"","email":""}'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "site_settings" WHERE "key" = 'maintenance');
