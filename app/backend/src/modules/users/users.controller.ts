import { Router } from 'express';
import { prisma } from '../../prisma/client';
import { verifyJwt } from '../../utils/jwt';
import { encryptSecret, decryptSecret } from '../../utils/crypto';
import { audit } from '../../utils/audit';
import { BinanceService } from '../trading/binance.service';

export const usersRouter = Router();

function auth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing auth');
  const [, token] = authHeader.split(' ');
  return verifyJwt<{ userId: string }>(token);
}

usersRouter.get('/me', async (req, res) => {
  try {
    const { userId } = auth(req);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, createdAt: true } });
    res.json(user);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});

usersRouter.get('/accounts', async (req, res) => {
  try {
    const { userId } = auth(req);
    const accounts = await prisma.exchangeAccount.findMany({ where: { userId }, select: { id: true, exchange: true, label: true, isSandbox: true, createdAt: true } });
    res.json(accounts);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});

usersRouter.post('/accounts', async (req, res) => {
  try {
    const { userId } = auth(req);
    const { exchange, label, apiKey, apiSecret, passphrase, isSandbox } = req.body as any;
    const account = await prisma.exchangeAccount.create({
      data: {
        userId,
        exchange,
        label,
        apiKey: encryptSecret(apiKey),
        apiSecret: encryptSecret(apiSecret),
        passphrase: passphrase ? encryptSecret(passphrase) : null,
        isSandbox: !!isSandbox,
      },
    });
    await audit('account.create', userId, { accountId: account.id, exchange });
    res.json({ id: account.id });
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});

// Test new credentials without saving
usersRouter.post('/accounts/test', async (req, res) => {
  try {
    const { userId } = auth(req);
    const { exchange, apiKey, apiSecret, isSandbox } = req.body as any;
    if (exchange !== 'BINANCE') return res.status(400).json({ ok: false, message: 'Unsupported exchange' });
    const svc = new BinanceService({ apiKey, apiSecret, isSandbox: !!isSandbox });
    const ok = await svc.ping();
    await audit('account.test', userId, { exchange, ok });
    res.json({ ok });
  } catch (e: any) {
    res.status(400).json({ ok: false, message: e.message });
  }
});

// Test an existing account by id
usersRouter.post('/accounts/:id/test', async (req, res) => {
  try {
    const { userId } = auth(req);
    const { id } = req.params;
    const account = await prisma.exchangeAccount.findFirst({ where: { id, userId } });
    if (!account) return res.status(404).json({ ok: false, message: 'Account not found' });
    if (account.exchange !== 'BINANCE') return res.status(400).json({ ok: false, message: 'Unsupported exchange' });
    const svc = new BinanceService({ apiKey: decryptSecret(account.apiKey), apiSecret: decryptSecret(account.apiSecret), isSandbox: account.isSandbox });
    const ok = await svc.ping();
    await audit('account.test', userId, { accountId: id, ok });
    res.json({ ok });
  } catch (e: any) {
    res.status(400).json({ ok: false, message: e.message });
  }
});