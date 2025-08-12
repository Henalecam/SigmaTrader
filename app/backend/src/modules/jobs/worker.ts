import { Worker, Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../../prisma/client';
import { decryptSecret } from '../../utils/crypto';
import { BinanceService } from '../trading/binance.service';
import { env } from '../../config/env';

const connection = new IORedis(env.REDIS_URL);
export const botQueue = new Queue('bot-exec', { connection });

export type BotJobData = { botId: string };

async function executeBot(botId: string) {
  const bot = await prisma.bot.findUnique({ where: { id: botId }, include: { user: true, exchangeAccount: true } as any });
  if (!bot || !bot.isActive) return;
  const { baseAsset, quoteAsset } = bot;
  const symbol = `${baseAsset}${quoteAsset}`;
  const account = bot.exchangeAccount as any;
  if (account.exchange !== 'BINANCE') return;
  const svc = new BinanceService({
    apiKey: decryptSecret(account.apiKey),
    apiSecret: decryptSecret(account.apiSecret),
    isSandbox: account.isSandbox,
  });
  await svc.ping();
}

export const worker = new Worker<BotJobData>(
  'bot-exec',
  async (job) => {
    await executeBot(job.data.botId);
  },
  { connection }
);

export async function enqueueActiveBots() {
  const active = await prisma.bot.findMany({ where: { isActive: true } });
  const opts: JobsOptions = { removeOnComplete: 1000, removeOnFail: 1000, attempts: 1 };
  for (const b of active) {
    await botQueue.add('run', { botId: b.id }, opts);
  }
}

setInterval(() => {
  enqueueActiveBots().catch(() => {});
}, 15000);