import { Router } from 'express';
import { prisma } from '../../prisma/client';
import { verifyJwt } from '../../utils/jwt';
import { audit } from '../../utils/audit';

export const botsRouter = Router();

function auth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing auth');
  const [, token] = authHeader.split(' ');
  return verifyJwt<{ userId: string }>(token);
}

botsRouter.get('/', async (req, res) => {
  try {
    const { userId } = auth(req);
    const bots = await prisma.bot.findMany({ where: { userId } });
    res.json(bots);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});

botsRouter.post('/', async (req, res) => {
  try {
    const { userId } = auth(req);
    const data = req.body as any;
    const bot = await prisma.bot.create({ data: { ...data, userId } });
    await audit('bot.create', userId, { botId: bot.id });
    res.json(bot);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

botsRouter.post('/:id/toggle', async (req, res) => {
  try {
    const { userId } = auth(req);
    const { id } = req.params;
    const bot = await prisma.bot.findFirst({ where: { id, userId } });
    if (!bot) return res.status(404).json({ message: 'Bot not found' });
    const updated = await prisma.bot.update({ where: { id }, data: { isActive: !bot.isActive } });
    await audit('bot.toggle', userId, { botId: id, isActive: updated.isActive });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});