-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL DEFAULT 1920,
    "heightPx" INTEGER NOT NULL DEFAULT 1080,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallpaper" (
    "id" TEXT NOT NULL,
    "comarcaName" TEXT NOT NULL,
    "wifiSsid" TEXT NOT NULL,
    "wifiPassword" TEXT NOT NULL,
    "wifiSecurity" TEXT NOT NULL DEFAULT 'WPA',
    "qrContent" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallpaper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wallpaper_templateId_idx" ON "Wallpaper"("templateId");

-- CreateIndex
CREATE INDEX "Wallpaper_createdAt_idx" ON "Wallpaper"("createdAt");

-- AddForeignKey
ALTER TABLE "Wallpaper" ADD CONSTRAINT "Wallpaper_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
