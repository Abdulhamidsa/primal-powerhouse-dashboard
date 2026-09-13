ALTER TABLE "training_plan_days" ADD COLUMN "weekday" INTEGER;

CREATE INDEX "training_plan_days_planId_weekday_idx" ON "training_plan_days"("planId", "weekday");

WITH ranked_days AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "planId", (EXTRACT(ISODOW FROM "date")::INTEGER - 1)
      ORDER BY "date" DESC, "updatedAt" DESC
    ) AS row_number,
    (EXTRACT(ISODOW FROM "date")::INTEGER - 1) AS inferred_weekday
  FROM "training_plan_days"
)
UPDATE "training_plan_days" day
SET "weekday" = ranked_days.inferred_weekday
FROM ranked_days
WHERE day."id" = ranked_days."id"
  AND ranked_days.row_number = 1;

INSERT INTO "training_plan_days" (
  "id",
  "date",
  "weekday",
  "type",
  "status",
  "planId",
  "createdAt",
  "updatedAt"
)
SELECT
  'weekly_' || plan."id" || '_' || weekdays.weekday,
  (date_trunc('day', plan."startDate") + (weekdays.weekday || ' days')::interval),
  weekdays.weekday,
  'REST'::"TrainingDayType",
  'PENDING'::"PlanDayStatus",
  plan."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "client_training_plans" plan
CROSS JOIN generate_series(0, 6) AS weekdays(weekday)
WHERE NOT EXISTS (
  SELECT 1
  FROM "training_plan_days" day
  WHERE day."planId" = plan."id"
    AND day."weekday" = weekdays.weekday
);
