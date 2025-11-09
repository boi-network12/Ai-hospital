import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!;
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;

// Explicitly define token expirations
const ACCESS_EXPIRES: jwt.SignOptions["expiresIn"] = (process.env.ACCESS_TOKEN_EXPIRES || "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRES: jwt.SignOptions["expiresIn"] = (process.env.REFRESH_TOKEN_EXPIRES || "30d") as jwt.SignOptions["expiresIn"];

export const signAccess = (payload: object, options: SignOptions = {}): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    ...options,
  });
};

export const signRefresh = (payload: object, options: SignOptions = {}): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    ...options,
  });
};

export const verifyAccess = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefresh = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};
