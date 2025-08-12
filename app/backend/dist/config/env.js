"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing env var ${name}`);
    }
    return value;
}
exports.env = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    DATABASE_URL: requireEnv('DATABASE_URL'),
    REDIS_URL: requireEnv('REDIS_URL'),
    ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
};
//# sourceMappingURL=env.js.map