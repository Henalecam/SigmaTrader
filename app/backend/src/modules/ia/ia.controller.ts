import { Router } from 'express';
import { verifyJwt } from '../../utils/jwt';
import { suggestStrategyForUser } from './ia.service';

export const iaRouter = Router();

function auth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing auth');
  const [, token] = authHeader.split(' ');
  return verifyJwt<{ userId: string }>(token);
}

iaRouter.get('/suggestions', async (req, res) => {
  try {
    const { userId } = auth(req);
    const suggestion = await suggestStrategyForUser(userId);
    res.json(suggestion);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
});