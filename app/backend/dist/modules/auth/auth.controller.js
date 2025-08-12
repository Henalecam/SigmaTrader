"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Missing email or password' });
    const existing = await client_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ message: 'Email in use' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await client_1.prisma.user.create({ data: { email, passwordHash } });
    const token = (0, jwt_1.signJwt)({ userId: user.id });
    res.json({ token, user: { id: user.id, email: user.email } });
});
exports.authRouter.post('/login', async (req, res) => {
    const { email, password, twoFactorToken } = req.body;
    const user = await client_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });
    if (user.twoFactorSecret) {
        if (!twoFactorToken)
            return res.status(401).json({ message: '2FA required' });
        const verified = speakeasy_1.default.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: twoFactorToken });
        if (!verified)
            return res.status(401).json({ message: 'Invalid 2FA token' });
    }
    const token = (0, jwt_1.signJwt)({ userId: user.id });
    res.json({ token, user: { id: user.id, email: user.email } });
});
exports.authRouter.post('/2fa/setup', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'Missing auth' });
    const [, token] = authHeader.split(' ');
    const payload = (0, jwt_1.verifyJwt)(token);
    const user = await client_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const secret = speakeasy_1.default.generateSecret({ name: 'NOME_DA_PLATAFORMA' });
    const otpauth = secret.otpauth_url || '';
    const qr = await qrcode_1.default.toDataURL(otpauth);
    // store temp secret; require verification
    await client_1.prisma.user.update({ where: { id: user.id }, data: { twoFactorTempSecret: secret.base32 } });
    res.json({ otpauth, qr, base32: secret.base32 });
});
exports.authRouter.post('/2fa/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'Missing auth' });
    const [, token] = authHeader.split(' ');
    const payload = (0, jwt_1.verifyJwt)(token);
    const { code } = req.body;
    const user = await client_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.twoFactorTempSecret)
        return res.status(400).json({ message: 'No 2FA setup pending' });
    const ok = speakeasy_1.default.totp.verify({ secret: user.twoFactorTempSecret, token: code, encoding: 'base32' });
    if (!ok)
        return res.status(400).json({ message: 'Invalid code' });
    await client_1.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: user.twoFactorTempSecret, twoFactorTempSecret: null } });
    res.json({ success: true });
});
//# sourceMappingURL=auth.controller.js.map