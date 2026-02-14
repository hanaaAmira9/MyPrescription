
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ;


export interface JwtUserPayload {
  id: string;
  role: "ADMIN" | "DOCTOR" | "ASSISTANT" ;
}

export function generateAccessToken(user: JwtUserPayload): string {
  const payload = {
    sub: user.id,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}
