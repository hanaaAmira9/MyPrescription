export type UserRole = "ADMIN" | "DOCTOR" | "ASSISTANT";

export interface User {
  id: string;
  firstname: string;
  lastName: string;
  password: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
