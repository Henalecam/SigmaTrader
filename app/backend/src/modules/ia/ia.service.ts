import { prisma } from '../../prisma/client';

export type StrategySuggestion = {
  stopLossPct: number;
  takeProfitPct: number;
  rationale: string;
};

export async function suggestStrategyForUser(userId: string): Promise<StrategySuggestion> {
  const trades = await prisma.trade.findMany({ where: { userId }, orderBy: { executedAt: 'desc' }, take: 200 });
  const pnl = trades.reduce((acc, t) => acc + (t.side === 'SELL' ? (t.price * t.quantity) : -(t.price * t.quantity)), 0);
  // Naive heuristic: if losses dominate, tighten SL; else widen TP slightly
  const baseSL = 2.0;
  const baseTP = 4.0;
  const stopLossPct = pnl < 0 ? baseSL - 0.5 : baseSL;
  const takeProfitPct = pnl > 0 ? baseTP + 0.5 : baseTP;
  return {
    stopLossPct: Math.max(0.5, stopLossPct),
    takeProfitPct: Math.min(10, takeProfitPct),
    rationale: 'Heurística baseada no histórico de PnL agregado do usuário.',
  };
}