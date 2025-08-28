// ❌ remove this line
// import { TextEncoder } from 'util';

interface JWTPayload {
  adminId: string;
  email: string;
  role: string;
  exp: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string | string[];
  iss?: string;
}

class JWTVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWTVerificationError";
  }
}

class TokenExpiredError extends Error {
  expiredAt: Date;
  constructor(message: string, expiredAt: Date) {
    super(message);
    this.name = "TokenExpiredError";
    this.expiredAt = expiredAt;
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder(); // ✅ global TextEncoder (DOM)
  const keyData = encoder.encode(secret); // Uint8Array
  return await crypto.subtle.importKey(
    "raw",
    keyData, // or keyData.buffer if your TS setup prefers ArrayBuffer
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function verifySignature(
  token: string,
  secret: string
): Promise<JWTPayload> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");

    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new JWTVerificationError("Invalid token format");
    }

    // Decode payload
    const decodedPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as JWTPayload;

    // Check token expiration
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      throw new TokenExpiredError(
        "Token expired",
        new Date(decodedPayload.exp * 1000)
      );
    }

    // Verify signature
    const key = await importKey(secret);
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`); // Uint8Array

    // Convert Buffer -> Uint8Array for Web Crypto
    const signature = new Uint8Array(Buffer.from(signatureB64, "base64url"));

    const isValid = await crypto.subtle.verify(
      { name: "HMAC" },
      key,
      signature, // BufferSource
      data // BufferSource
    );

    if (!isValid) {
      throw new JWTVerificationError("Invalid signature");
    }

    return decodedPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) throw error;
    if (error instanceof JWTVerificationError) throw error;
    throw new JWTVerificationError("Token verification failed");
  }
}

export { verifySignature, TokenExpiredError, JWTVerificationError };
