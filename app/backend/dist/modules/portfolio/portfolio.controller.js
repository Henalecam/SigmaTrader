"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const jwt_1 = require("../../utils/jwt");
exports.portfolioRouter = (0, express_1.Router)();
function auth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new Error('Missing auth');
    const [, token] = authHeader.split(' ');
    return (0, jwt_1.verifyJwt)(token);
}
exports.portfolioRouter.get('/summary', async (req, res) => {
    try {
        const { userId } = auth(req);
        const trades = await client_1.prisma.trade.findMany({ where: { userId } });
        const pnl = trades.reduce((acc, t) => acc + (t.side === 'SELL' ? (t.price * t.quantity) : -(t.price * t.quantity)), 0);
        res.json({ totalTrades: trades.length, pnl });
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
exports.portfolioRouter.get('/trades', async (req, res) => {
    try {
        const { userId } = auth(req);
        const trades = await client_1.prisma.trade.findMany({ where: { userId }, orderBy: { executedAt: 'desc' }, take: 200 });
        res.json(trades);
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
//# sourceMappingURL=portfolio.controller.js.map