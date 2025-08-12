"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iaRouter = void 0;
const express_1 = require("express");
const jwt_1 = require("../../utils/jwt");
const ia_service_1 = require("./ia.service");
exports.iaRouter = (0, express_1.Router)();
function auth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new Error('Missing auth');
    const [, token] = authHeader.split(' ');
    return (0, jwt_1.verifyJwt)(token);
}
exports.iaRouter.get('/suggestions', async (req, res) => {
    try {
        const { userId } = auth(req);
        const suggestion = await (0, ia_service_1.suggestStrategyForUser)(userId);
        res.json(suggestion);
    }
    catch (e) {
        res.status(401).json({ message: e.message });
    }
});
//# sourceMappingURL=ia.controller.js.map