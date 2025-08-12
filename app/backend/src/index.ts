import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.controller';
import { usersRouter } from './modules/users/users.controller';
import { botsRouter } from './modules/bots/bots.controller';
import { tradingRouter } from './modules/trading/trading.controller';
import { iaRouter } from './modules/ia/ia.controller';
import { portfolioRouter } from './modules/portfolio/portfolio.controller';

const app = express();
const logger = pino({ transport: { target: 'pino-pretty' } });

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/bots', botsRouter);
app.use('/trading', tradingRouter);
app.use('/ia', iaRouter);
app.use('/portfolio', portfolioRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err);
  res.status(500).json({ message: 'Internal error' });
});

app.listen(env.PORT, () => {
  logger.info(`API listening on :${env.PORT}`);
});