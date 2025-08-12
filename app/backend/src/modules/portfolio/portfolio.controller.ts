import { Router } from 'express';
import { prisma } from '../../prisma/client';
import { verifyJwt } from '../../utils/jwt';

export const portfolioRouter = Router();

function auth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing auth');
  const [, token] = authHeader.split(' ');
  return verifyJwt<{ userId: string }>(token);
}

portfolioRouter.get('/summary', async (req, res) => {
  try {
    const { userId } = auth(req);
    const trades = await prisma.trade.findMany({ where: { userId } });
    const pnl = trades.reduce((acc, t) => acc + (t.side === 'SELL' ? (t.price * t.quantity) : -(t.price * t.quantity)), 0);
    res.json({ totalTrades: trades.length, pnl });
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});

portfolioRouter.get('/trades', async (req, res) => {
  try {
    const { userId } = auth(req);
    const trades = await prisma.trade.findMany({ where: { userId }, orderBy: { executedAt: 'desc' }, take: 200 });
    res.json(trades);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});