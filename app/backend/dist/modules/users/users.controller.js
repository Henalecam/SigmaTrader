"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const jwt_1 = require("../../utils/jwt");
const crypto_1 = require("../../utils/crypto");
const audit_1 = require("../../utils/audit");
const binance_service_1 = require("../trading/binance.service");
exports.usersRouter = (0, express_1.Router)();
function auth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new Error('Missing auth');
    const [, token] = authHeader.split(' ');
    return (0, jwt_1.verifyJwt)(token);
}
exports.usersRouter.get('/me', async (req, res) => {
    try {
        const { userId } = auth(req);
        const user = await client_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, createdAt: true } });
        res.json(user);
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
exports.usersRouter.get('/accounts', async (req, res) => {
    try {
        const { userId } = auth(req);
        const accounts = await client_1.prisma.exchangeAccount.findMany({ where: { userId }, select: { id: true, exchange: true, label: true, isSandbox: true, createdAt: true } });
        res.json(accounts);
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
exports.usersRouter.post('/accounts', async (req, res) => {
    try {
        const { userId } = auth(req);
        const { exchange, label, apiKey, apiSecret, passphrase, isSandbox } = req.body;
        const account = await client_1.prisma.exchangeAccount.create({
            data: {
                userId,
                exchange,
                label,
                apiKey: (0, crypto_1.encryptSecret)(apiKey),
                apiSecret: (0, crypto_1.encryptSecret)(apiSecret),
                passphrase: passphrase ? (0, crypto_1.encryptSecret)(passphrase) : null,
                isSandbox: !!isSandbox,
            },
        });
        await (0, audit_1.audit)('account.create', userId, { accountId: account.id, exchange });
        res.json({ id: account.id });
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
// Test new credentials without saving
exports.usersRouter.post('/accounts/test', async (req, res) => {
    try {
        const { userId } = auth(req);
        const { exchange, apiKey, apiSecret, isSandbox } = req.body;
        if (exchange !== 'BINANCE')
            return res.status(400).json({ ok: false, message: 'Unsupported exchange' });
        const svc = new binance_service_1.BinanceService({ apiKey, apiSecret, isSandbox: !!isSandbox });
        const ok = await svc.ping();
        await (0, audit_1.audit)('account.test', userId, { exchange, ok });
        res.json({ ok });
    }
    catch (e) {
        res.status(400).json({ ok: false, message: e.message });
    }
});
// Test an existing account by id
exports.usersRouter.post('/accounts/:id/test', async (req, res) => {
    try {
        const { userId } = auth(req);
        const { id } = req.params;
        const account = await client_1.prisma.exchangeAccount.findFirst({ where: { id, userId } });
        if (!account)
            return res.status(404).json({ ok: false, message: 'Account not found' });
        if (account.exchange !== 'BINANCE')
            return res.status(400).json({ ok: false, message: 'Unsupported exchange' });
        const svc = new binance_service_1.BinanceService({ apiKey: (0, crypto_1.decryptSecret)(account.apiKey), apiSecret: (0, crypto_1.decryptSecret)(account.apiSecret), isSandbox: account.isSandbox });
        const ok = await svc.ping();
        await (0, audit_1.audit)('account.test', userId, { accountId: id, ok });
        res.json({ ok });
    }
    catch (e) {
        res.status(400).json({ ok: false, message: e.message });
    }
});
//# sourceMappingURL=users.controller.js.map