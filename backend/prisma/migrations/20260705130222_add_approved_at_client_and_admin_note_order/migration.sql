-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvedAt" TIMESTAMP(3);
