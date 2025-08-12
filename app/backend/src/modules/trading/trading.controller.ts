import { Router } from 'express';
import { prisma } from '../../prisma/client';
import { verifyJwt } from '../../utils/jwt';
import { decryptSecret } from '../../utils/crypto';
import { BinanceService } from './binance.service';

export const tradingRouter = Router();

function auth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing auth');
  const [, token] = authHeader.split(' ');
  return verifyJwt<{ userId: string }>(token);
}

tradingRouter.get('/balances/:accountId', async (req, res) => {
  try {
    const { userId } = auth(req);
    const { accountId } = req.params;
    const account = await prisma.exchangeAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.exchange !== 'BINANCE') return res.status(400).json({ message: 'Unsupported exchange' });
    const svc = new BinanceService({ apiKey: decryptSecret(account.apiKey), apiSecret: decryptSecret(account.apiSecret), isSandbox: account.isSandbox });
    const balances = await svc.getBalances();
    res.json(balances);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});