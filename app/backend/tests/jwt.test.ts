import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt } from '../src/utils/jwt';

describe('jwt utils', () => {
  it('signs and verifies', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = signJwt({ userId: '123' }, '1h');
    const payload = verifyJwt<{ userId: string }>(token);
    expect(payload.userId).toEqual('123');
  });
});