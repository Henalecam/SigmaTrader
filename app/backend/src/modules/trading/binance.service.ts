import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export type BinanceCreds = { apiKey: string; apiSecret: string; isSandbox?: boolean };

export class BinanceService {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(creds: BinanceCreds) {
    this.apiKey = creds.apiKey;
    this.apiSecret = creds.apiSecret;
    this.baseUrl = creds.isSandbox ? 'https://testnet.binance.vision' : 'https://api.binance.com';
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 10000, headers: { 'X-MBX-APIKEY': this.apiKey } });
  }

  private sign(params: Record<string, any>): string {
    const query = new URLSearchParams(params as any).toString();
    const signature = crypto.createHmac('sha256', this.apiSecret).update(query).digest('hex');
    return `${query}&signature=${signature}`;
  }

  async ping(): Promise<boolean> {
    const res = await this.client.get('/api/v3/ping');
    return res.status === 200;
  }

  async accountInfo(): Promise<any> {
    const timestamp = Date.now();
    const query = this.sign({ timestamp });
    const res = await this.client.get(`/api/v3/account?${query}`);
    return res.data;
  }

  async getBalances(): Promise<{ asset: string; free: number; locked: number }[]> {
    const info = await this.accountInfo();
    return (info.balances || []).map((b: any) => ({ asset: b.asset, free: parseFloat(b.free), locked: parseFloat(b.locked) }));
  }

  async placeOrder(symbol: string, side: 'BUY' | 'SELL', type: 'MARKET' | 'LIMIT', quantity: number, price?: number): Promise<any> {
    const endpoint = '/api/v3/order';
    const timestamp = Date.now();
    const body: any = { symbol, side, type, quantity, timestamp };
    if (type === 'LIMIT') {
      body.price = price;
      body.timeInForce = 'GTC';
    }
    const query = this.sign(body);
    const res = await this.client.post(`${endpoint}?${query}`);
    return res.data;
  }
}