import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!;
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;

// Explicitly define token expirations
// Allow "never" or very long expiry
const ACCESS_EXPIRES: jwt.SignOptions["expiresIn"] = 
  process.env.ACCESS_TOKEN_EXPIRES 
    ? (process.env.ACCESS_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"])
    : "30d"; // fallback to 30 days

const REFRESH_EXPIRES: jwt.SignOptions["expiresIn"] = 
  process.env.REFRESH_TOKEN_EXPIRES 
    ? (process.env.REFRESH_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"])
    : "365d";

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
