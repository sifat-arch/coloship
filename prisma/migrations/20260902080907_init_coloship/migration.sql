-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'BICYCLE', 'MOTORCYCLE', 'VAN', 'TRUCK');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'PAYMENT_PENDING', 'PAID', 'PICKUP_REQUESTED', 'COURIER_ASSIGNED', 'PICKED_UP', 'AT_ORIGIN_HUB', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('STANDARD', 'EXPRESS');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHIPMENT', 'PAYMENT', 'SYSTEM', 'DELIVERY');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_assignments" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_earnings" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nidNumber" TEXT,
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleNumber" TEXT,
    "licenseNumber" TEXT,
    "profileImageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "currentHubId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "transactionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "method" "PaymentMethod" NOT NULL DEFAULT 'BKASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentUrl" TEXT,
    "transactionReference" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pickupAddressId" TEXT NOT NULL,
    "deliveryAddressId" TEXT NOT NULL,
    "originHubId" TEXT,
    "destinationHubId" TEXT,
    "currentHubId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'STANDARD',
    "weight" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "parcelDescription" TEXT,
    "estimatedDeliveryAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "hubId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "courier_assignments_shipmentId_idx" ON "courier_assignments"("shipmentId");

-- CreateIndex
CREATE INDEX "courier_assignments_courierId_idx" ON "courier_assignments"("courierId");

-- CreateIndex
CREATE INDEX "courier_assignments_status_idx" ON "courier_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "courier_assignments_shipmentId_courierId_key" ON "courier_assignments"("shipmentId", "courierId");

-- CreateIndex
CREATE INDEX "courier_earnings_courierId_idx" ON "courier_earnings"("courierId");

-- CreateIndex
CREATE INDEX "courier_earnings_status_idx" ON "courier_earnings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "courier_earnings_courierId_shipmentId_key" ON "courier_earnings"("courierId", "shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "courier_profiles_userId_key" ON "courier_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "courier_profiles_nidNumber_key" ON "courier_profiles"("nidNumber");

-- CreateIndex
CREATE INDEX "courier_profiles_currentHubId_idx" ON "courier_profiles"("currentHubId");

-- CreateIndex
CREATE INDEX "courier_profiles_isAvailable_idx" ON "courier_profiles"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "hubs_code_key" ON "hubs"("code");

-- CreateIndex
CREATE INDEX "hubs_city_idx" ON "hubs"("city");

-- CreateIndex
CREATE INDEX "hubs_isActive_idx" ON "hubs"("isActive");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_shipmentId_key" ON "payments"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoiceNumber_key" ON "payments"("invoiceNumber");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_trackingNumber_key" ON "shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "shipments_customerId_idx" ON "shipments"("customerId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_currentHubId_idx" ON "shipments"("currentHubId");

-- CreateIndex
CREATE INDEX "shipments_originHubId_idx" ON "shipments"("originHubId");

-- CreateIndex
CREATE INDEX "shipments_destinationHubId_idx" ON "shipments"("destinationHubId");

-- CreateIndex
CREATE INDEX "shipments_createdAt_idx" ON "shipments"("createdAt");

-- CreateIndex
CREATE INDEX "shipment_tracking_events_shipmentId_createdAt_idx" ON "shipment_tracking_events"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "shipment_tracking_events_status_idx" ON "shipment_tracking_events"("status");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_assignments" ADD CONSTRAINT "courier_assignments_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_assignments" ADD CONSTRAINT "courier_assignments_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "courier_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_earnings" ADD CONSTRAINT "courier_earnings_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "courier_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_earnings" ADD CONSTRAINT "courier_earnings_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_profiles" ADD CONSTRAINT "courier_profiles_currentHubId_fkey" FOREIGN KEY ("currentHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pickupAddressId_fkey" FOREIGN KEY ("pickupAddressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_originHubId_fkey" FOREIGN KEY ("originHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destinationHubId_fkey" FOREIGN KEY ("destinationHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_currentHubId_fkey" FOREIGN KEY ("currentHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
