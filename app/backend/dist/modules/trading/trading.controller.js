"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradingRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const jwt_1 = require("../../utils/jwt");
const crypto_1 = require("../../utils/crypto");
const binance_service_1 = require("./binance.service");
exports.tradingRouter = (0, express_1.Router)();
function auth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new Error('Missing auth');
    const [, token] = authHeader.split(' ');
    return (0, jwt_1.verifyJwt)(token);
}
exports.tradingRouter.get('/balances/:accountId', async (req, res) => {
    try {
        const { userId } = auth(req);
        const { accountId } = req.params;
        const account = await client_1.prisma.exchangeAccount.findFirst({ where: { id: accountId, userId } });
        if (!account)
            return res.status(404).json({ message: 'Account not found' });
        if (account.exchange !== 'BINANCE')
            return res.status(400).json({ message: 'Unsupported exchange' });
        const svc = new binance_service_1.BinanceService({ apiKey: (0, crypto_1.decryptSecret)(account.apiKey), apiSecret: (0, crypto_1.decryptSecret)(account.apiSecret), isSandbox: account.isSandbox });
        const balances = await svc.getBalances();
        res.json(balances);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
//# sourceMappingURL=trading.controller.js.map