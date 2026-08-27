-- AlterTable
ALTER TABLE "products" ADD COLUMN     "quantity_num" DOUBLE PRECISION DEFAULT 100,
ADD COLUMN     "quantity_unit" VARCHAR(10) DEFAULT 'g';
