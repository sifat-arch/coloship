/**
 * Generates a unique tracking number format: CLS-YYYYMMDD-XXXX (e.g., CLS-20260904-A89F)
 */
export const generateTrackingNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `CLS-${dateStr}-${randomHex}`;
};

/**
 * Delivery fee calculation:
 * - Base Fee: Standard = 70 BDT, Express = 120 BDT
 * - Weight Charge: Extra 20 BDT per kg for weight > 1 kg
 */
export const calculateDeliveryFee = (
  weight: number,
  deliveryType: "STANDARD" | "EXPRESS",
): number => {
  const baseFee = deliveryType === "EXPRESS" ? 120 : 70;

  if (weight > 1) {
    const extraWeight = Math.ceil(weight - 1);
    return baseFee + extraWeight * 20;
  }

  return baseFee;
};
