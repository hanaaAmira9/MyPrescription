import jwt from "jsonwebtoken";

export const generateRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, process.env.REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};
