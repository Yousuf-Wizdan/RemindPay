import crypto from "crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret)
      throw new Error("Razorpay keys are not configured");
    client = new Razorpay({ key_id: keyId, key_secret: secret });
  }
  return client;
}

export function getPlanId(): string {
  const id = process.env.RAZORPAY_PLAN_ID;
  if (!id) throw new Error("RAZORPAY_PLAN_ID is not configured");
  return id;
}

/** Verify Razorpay webhook signature (HMAC-SHA256 of raw body). */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

/** Verify Razorpay payment signature for checkout (order_id|payment_id). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}
