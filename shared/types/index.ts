export type Exchange = 'BINANCE';

export type ExchangeAccountDTO = {
  id: string;
  exchange: Exchange;
  label: string;
  isSandbox: boolean;
  createdAt: string;
};

export type BotDTO = {
  id: string;
  name: string;
  isActive: boolean;
  baseAsset: string;
  quoteAsset: string;
  rsiPeriod: number;
  maFast: number;
  maSlow: number;
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct?: number | null;
};

export type JwtAuth = { token: string };