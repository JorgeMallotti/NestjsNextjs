/*
  Rename worker status "active" → "available" and add "driving".
  Update existing workers with status "active" to "available".
*/
-- Update existing rows
UPDATE "Worker" SET "status" = 'available' WHERE "status" = 'active';

-- Change default
ALTER TABLE "Worker" ALTER COLUMN "status" SET DEFAULT 'available';
