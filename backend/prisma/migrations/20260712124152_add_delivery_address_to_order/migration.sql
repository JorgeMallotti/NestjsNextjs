/*
  Add deliveryAddress to Order — required for all orders.
  Existing rows get the client's location as default.
*/
-- Step 1: Add column as nullable
ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;

-- Step 2: Fill existing rows with the client's location
UPDATE "Order"
SET "deliveryAddress" = COALESCE(
  (SELECT "location" FROM "User" WHERE "User".id = "Order"."clientId"),
  'Address pending'
);

-- Step 3: Make it NOT NULL
ALTER TABLE "Order" ALTER COLUMN "deliveryAddress" SET NOT NULL;
