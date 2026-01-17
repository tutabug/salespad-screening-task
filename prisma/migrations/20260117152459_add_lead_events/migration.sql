-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('lead_added', 'message_sent', 'reply_received', 'ai_reply_sent', 'status_changed');

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "uuid" DROP DEFAULT;

-- CreateTable
CREATE TABLE "lead_events" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "type" "LeadEventType" NOT NULL,
    "correlation_ids" JSONB NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lead_id" BIGINT NOT NULL,

    CONSTRAINT "lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_events_uuid_key" ON "lead_events"("uuid");

-- CreateIndex
CREATE INDEX "lead_events_lead_id_idx" ON "lead_events"("lead_id");

-- CreateIndex
CREATE INDEX "lead_events_type_idx" ON "lead_events"("type");

-- AddForeignKey
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
