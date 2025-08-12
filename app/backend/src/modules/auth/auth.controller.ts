import { Router } from 'express';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcryptjs';
import { signJwt, verifyJwt } from '../../utils/jwt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const token = signJwt({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post('/login', async (req, res) => {
  const { email, password, twoFactorToken } = req.body as { email: string; password: string; twoFactorToken?: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.twoFactorSecret) {
    if (!twoFactorToken) return res.status(401).json({ message: '2FA required' });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: twoFactorToken });
    if (!verified) return res.status(401).json({ message: 'Invalid 2FA token' });
  }
  const token = signJwt({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post('/2fa/setup', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing auth' });
  const [, token] = authHeader.split(' ');
  const payload = verifyJwt<{ userId: string }>(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const secret = speakeasy.generateSecret({ name: 'NOME_DA_PLATAFORMA' });
  const otpauth = secret.otpauth_url || '';
  const qr = await QRCode.toDataURL(otpauth);
  // store temp secret; require verification
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorTempSecret: secret.base32 } });
  res.json({ otpauth, qr, base32: secret.base32 });
});

authRouter.post('/2fa/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing auth' });
  const [, token] = authHeader.split(' ');
  const payload = verifyJwt<{ userId: string }>(token);
  const { code } = req.body as { code: string };
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.twoFactorTempSecret) return res.status(400).json({ message: 'No 2FA setup pending' });
  const ok = speakeasy.totp.verify({ secret: user.twoFactorTempSecret, token: code, encoding: 'base32' });
  if (!ok) return res.status(400).json({ message: 'Invalid code' });
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: user.twoFactorTempSecret, twoFactorTempSecret: null } });
  res.json({ success: true });
});