-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "NutrientTarget" AS ENUM ('SUGAR', 'SODIUM', 'SATURATED_FAT');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "brand" VARCHAR(100),
    "imageUrl" VARCHAR(500),
    "ingredients" TEXT,
    "isLocal" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritional_data" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "energy_kcal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbohydrates" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugars" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saturated_fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "traffic_light_sugar" "AlertLevel" NOT NULL DEFAULT 'BAJO',
    "traffic_light_sodium" "AlertLevel" NOT NULL DEFAULT 'BAJO',
    "traffic_light_saturated_fat" "AlertLevel" NOT NULL DEFAULT 'BAJO',

    CONSTRAINT "nutritional_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_templates" (
    "id" UUID NOT NULL,
    "nutrient_target" "NutrientTarget" NOT NULL,
    "alert_level" "AlertLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educational_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_logs" (
    "id" UUID NOT NULL,
    "barcode" VARCHAR(50),
    "raw_text" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "nutritional_data_product_id_key" ON "nutritional_data"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "educational_templates_nutrient_target_alert_level_key" ON "educational_templates"("nutrient_target", "alert_level");

-- AddForeignKey
ALTER TABLE "nutritional_data" ADD CONSTRAINT "nutritional_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
