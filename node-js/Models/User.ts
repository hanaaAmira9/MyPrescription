export type UserRole = "ADMIN" | "DOCTOR" | "ASSISTANT";

export interface User {
  id: string;
  firstname: string;
  lastName: string;
  password: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  two_factor_secret?: string | null;
  two_factor_enabled?: boolean;
  otp_code?: string | null;
  otp_expires_at?: Date | null;
}
