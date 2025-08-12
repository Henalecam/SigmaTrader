import { prisma } from '../prisma/client';

export async function audit(action: string, userId?: string, meta: Record<string, any> = {}) {
  try {
    await prisma.auditLog.create({ data: { action, userId: userId || null, meta } });
  } catch {
    // swallow
  }
}