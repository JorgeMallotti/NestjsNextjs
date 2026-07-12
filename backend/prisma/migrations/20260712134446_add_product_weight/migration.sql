/*
  Add weight (kg) to Product for truck capacity calculations.
  Assign realistic weights to all existing products.
*/
-- Add column with default
ALTER TABLE "Product" ADD COLUMN "weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Assign realistic weights to existing products
-- Power supplies
UPDATE "Product" SET "weight" = 3.5 WHERE "name" ILIKE '%RM850x%' OR "name" ILIKE '%power%' OR "name" ILIKE '%psu%';
-- CPUs (boxed with cooler)
UPDATE "Product" SET "weight" = 0.5 WHERE ("name" ILIKE '%i9%' OR "name" ILIKE '%i7%' OR "name" ILIKE '%i5%' OR "name" ILIKE '%ryzen%' OR "name" ILIKE '%cpu%') AND "weight" = 0;
-- GPUs
UPDATE "Product" SET "weight" = 2.5 WHERE ("name" ILIKE '%rtx%' OR "name" ILIKE '%gpu%' OR "name" ILIKE '%nvidia%' OR "name" ILIKE '%radeon%') AND "weight" = 0;
-- SSDs / Storage
UPDATE "Product" SET "weight" = 0.2 WHERE ("name" ILIKE '%ssd%' OR "name" ILIKE '%nvme%' OR "name" ILIKE '%990 pro%' OR "name" ILIKE '%storage%' OR "name" ILIKE '%hd%') AND "weight" = 0;
-- RAM
UPDATE "Product" SET "weight" = 0.1 WHERE ("name" ILIKE '%ddr%' OR "name" ILIKE '%ram%' OR "name" ILIKE '%memory%') AND "weight" = 0;
-- Any remaining products: default to 1.0 kg as generic
UPDATE "Product" SET "weight" = 1.0 WHERE "weight" = 0;
