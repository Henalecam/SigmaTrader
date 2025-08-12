import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = { userId: string } & Record<string, unknown>;

export function signJwt(payload: JwtPayload, expiresIn: string | number = '7d'): string {
  const options: SignOptions = expiresIn ? ({ expiresIn } as unknown as SignOptions) : {};
  return jwt.sign(payload as any, env.JWT_SECRET as unknown as jwt.Secret, options);
}

export function verifyJwt<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET as unknown as jwt.Secret) as unknown as T;
}