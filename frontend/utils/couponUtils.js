/**
 * Utility to standardize data passed to and from QR codes
 */

export const COUPON_QR_VERSION = '1.1';

/**
 * Generates a structured string for the QR code.
 * We only store the ID/Code to ensure the POS always fetches 
 * "Live" data from the database (prevents spoofing and stale data).
 */
export const generateCouponQRPayload = (discount) => {
  if (!discount) return '';

  const payload = {
    v: COUPON_QR_VERSION,
    id: discount._id,
    code: discount.couponCode || '',
  };

  return JSON.stringify(payload);
};

/**
 * Safely parses the scanned QR text
 */
export const parseCouponQRPayload = (scannedText) => {
  try {
    const data = JSON.parse(scannedText);
    // Basic validation that this is one of our coupons
    if (data.v && (data.id || data.code)) {
      return data;
    }
    return { code: scannedText }; // Fallback to raw text
  } catch (e) {
    return { code: scannedText };
  }
};
