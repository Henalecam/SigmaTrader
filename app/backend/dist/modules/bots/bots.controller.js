"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botsRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const jwt_1 = require("../../utils/jwt");
const audit_1 = require("../../utils/audit");
exports.botsRouter = (0, express_1.Router)();
function auth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new Error('Missing auth');
    const [, token] = authHeader.split(' ');
    return (0, jwt_1.verifyJwt)(token);
}
exports.botsRouter.get('/', async (req, res) => {
    try {
        const { userId } = auth(req);
        const bots = await client_1.prisma.bot.findMany({ where: { userId } });
        res.json(bots);
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
exports.botsRouter.post('/', async (req, res) => {
    try {
        const { userId } = auth(req);
        const data = req.body;
        const bot = await client_1.prisma.bot.create({ data: { ...data, userId } });
        await (0, audit_1.audit)('bot.create', userId, { botId: bot.id });
        res.json(bot);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.botsRouter.post('/:id/toggle', async (req, res) => {
    try {
        const { userId } = auth(req);
        const { id } = req.params;
        const bot = await client_1.prisma.bot.findFirst({ where: { id, userId } });
        if (!bot)
            return res.status(404).json({ message: 'Bot not found' });
        const updated = await client_1.prisma.bot.update({ where: { id }, data: { isActive: !bot.isActive } });
        await (0, audit_1.audit)('bot.toggle', userId, { botId: id, isActive: updated.isActive });
        res.json(updated);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
//# sourceMappingURL=bots.controller.js.map