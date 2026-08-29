import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "SUPER_SECRET_STRONG_KEY_AVICENNA_2026"
);

export interface UserSessionPayload {
  id: number;
  personnelCode: string;
  fullName: string;
  role: string;
  department: string;
  hardwareKeyAttestation?: boolean;
}

export async function createSecureSessionToken(
  payload: UserSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}
