"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class BinanceService {
    constructor(creds) {
        this.apiKey = creds.apiKey;
        this.apiSecret = creds.apiSecret;
        this.baseUrl = creds.isSandbox ? 'https://testnet.binance.vision' : 'https://api.binance.com';
        this.client = axios_1.default.create({ baseURL: this.baseUrl, timeout: 10000, headers: { 'X-MBX-APIKEY': this.apiKey } });
    }
    sign(params) {
        const query = new URLSearchParams(params).toString();
        const signature = crypto_1.default.createHmac('sha256', this.apiSecret).update(query).digest('hex');
        return `${query}&signature=${signature}`;
    }
    async ping() {
        const res = await this.client.get('/api/v3/ping');
        return res.status === 200;
    }
    async accountInfo() {
        const timestamp = Date.now();
        const query = this.sign({ timestamp });
        const res = await this.client.get(`/api/v3/account?${query}`);
        return res.data;
    }
    async getBalances() {
        const info = await this.accountInfo();
        return (info.balances || []).map((b) => ({ asset: b.asset, free: parseFloat(b.free), locked: parseFloat(b.locked) }));
    }
    async placeOrder(symbol, side, type, quantity, price) {
        const endpoint = '/api/v3/order';
        const timestamp = Date.now();
        const body = { symbol, side, type, quantity, timestamp };
        if (type === 'LIMIT') {
            body.price = price;
            body.timeInForce = 'GTC';
        }
        const query = this.sign(body);
        const res = await this.client.post(`${endpoint}?${query}`);
        return res.data;
    }
}
exports.BinanceService = BinanceService;
//# sourceMappingURL=binance.service.js.map