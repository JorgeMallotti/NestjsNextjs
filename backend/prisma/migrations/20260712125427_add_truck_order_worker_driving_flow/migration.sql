/*
  Migration: add truck/order/worker driving flow
  - New Truck fields: availableCapacity, currentDestination, currentOrderId, driverId
  - New Truck statuses: loading, shipping, returning (replaces in_use)
  - New Worker status: driving
  - Truck ↔ Order one-to-one relation
  - Truck ↔ Worker one-to-many relation
*/

-- AlterTable: Add new columns to Truck
ALTER TABLE "Truck" ADD COLUMN     "availableCapacity" DOUBLE PRECISION,
ADD COLUMN     "currentDestination" TEXT,
ADD COLUMN     "currentOrderId" TEXT,
ADD COLUMN     "driverId" TEXT;

-- Migrate existing statuses: in_use → shipping
UPDATE "Truck" SET "status" = 'shipping' WHERE "status" = 'in_use';

-- CreateIndex
CREATE UNIQUE INDEX "Truck_currentOrderId_key" ON "Truck"("currentOrderId");

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_currentOrderId_fkey" FOREIGN KEY ("currentOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
