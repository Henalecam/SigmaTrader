"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = audit;
const client_1 = require("../prisma/client");
async function audit(action, userId, meta = {}) {
    try {
        await client_1.prisma.auditLog.create({ data: { action, userId: userId || null, meta } });
    }
    catch {
        // swallow
    }
}
//# sourceMappingURL=audit.js.map