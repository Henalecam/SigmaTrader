"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.worker = exports.botQueue = void 0;
exports.enqueueActiveBots = enqueueActiveBots;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const client_1 = require("../../prisma/client");
const crypto_1 = require("../../utils/crypto");
const binance_service_1 = require("../trading/binance.service");
const env_1 = require("../../config/env");
const connection = new ioredis_1.default(env_1.env.REDIS_URL);
exports.botQueue = new bullmq_1.Queue('bot-exec', { connection });
async function executeBot(botId) {
    const bot = await client_1.prisma.bot.findUnique({ where: { id: botId }, include: { user: true, exchangeAccount: true } });
    if (!bot || !bot.isActive)
        return;
    const { baseAsset, quoteAsset } = bot;
    const symbol = `${baseAsset}${quoteAsset}`;
    const account = bot.exchangeAccount;
    if (account.exchange !== 'BINANCE')
        return;
    const svc = new binance_service_1.BinanceService({
        apiKey: (0, crypto_1.decryptSecret)(account.apiKey),
        apiSecret: (0, crypto_1.decryptSecret)(account.apiSecret),
        isSandbox: account.isSandbox,
    });
    await svc.ping();
}
exports.worker = new bullmq_1.Worker('bot-exec', async (job) => {
    await executeBot(job.data.botId);
}, { connection });
async function enqueueActiveBots() {
    const active = await client_1.prisma.bot.findMany({ where: { isActive: true } });
    const opts = { removeOnComplete: 1000, removeOnFail: 1000, attempts: 1 };
    for (const b of active) {
        await exports.botQueue.add('run', { botId: b.id }, opts);
    }
}
setInterval(() => {
    enqueueActiveBots().catch(() => { });
}, 15000);
//# sourceMappingURL=worker.js.map