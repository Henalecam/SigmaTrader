"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./config/env");
const auth_controller_1 = require("./modules/auth/auth.controller");
const users_controller_1 = require("./modules/users/users.controller");
const bots_controller_1 = require("./modules/bots/bots.controller");
const trading_controller_1 = require("./modules/trading/trading.controller");
const ia_controller_1 = require("./modules/ia/ia.controller");
const portfolio_controller_1 = require("./modules/portfolio/portfolio.controller");
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ transport: { target: 'pino-pretty' } });
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', auth_controller_1.authRouter);
app.use('/users', users_controller_1.usersRouter);
app.use('/bots', bots_controller_1.botsRouter);
app.use('/trading', trading_controller_1.tradingRouter);
app.use('/ia', ia_controller_1.iaRouter);
app.use('/portfolio', portfolio_controller_1.portfolioRouter);
app.use((err, _req, res, _next) => {
    logger.error(err);
    res.status(500).json({ message: 'Internal error' });
});
app.listen(env_1.env.PORT, () => {
    logger.info(`API listening on :${env_1.env.PORT}`);
});
//# sourceMappingURL=index.js.map