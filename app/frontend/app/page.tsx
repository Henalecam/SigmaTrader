"use client";
import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twofa, setTwofa] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setMessage(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorToken: twofa || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro');
      setToken(data.token);
      setMessage('Autenticado!');
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">NOME_DA_PLATAFORMA</h1>
      <div className="w-full max-w-sm border rounded-lg p-4 space-y-3">
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded ${mode==='login'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('login')}>Login</button>
          <button className={`px-3 py-1 rounded ${mode==='register'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('register')}>Cadastro</button>
        </div>
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full border p-2 rounded" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        {mode==='login' && <input className="w-full border p-2 rounded" placeholder="2FA (se habilitado)" value={twofa} onChange={e=>setTwofa(e.target.value)} />}
        <button onClick={submit} className="w-full bg-blue-600 text-white rounded p-2">{mode==='login'?'Entrar':'Criar conta'}</button>
        {message && <p className="text-sm text-center text-gray-700">{message}</p>}
      </div>
      {token && (
        <div className="mt-6 w-full max-w-2xl">
          <h2 className="font-semibold mb-2">Acesso rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a className="border rounded p-3" href="#" onClick={async(e)=>{e.preventDefault(); const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000'}/users/me`,{headers:{Authorization:`Bearer ${token}`}}); alert(await r.text());}}>Perfil</a>
            <a className="border rounded p-3" href="#" onClick={async(e)=>{e.preventDefault(); const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000'}/users/accounts`,{headers:{Authorization:`Bearer ${token}`}}); alert(await r.text());}}>Contas</a>
            <a className="border rounded p-3" href="#" onClick={async(e)=>{e.preventDefault(); const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000'}/ia/suggestions`,{headers:{Authorization:`Bearer ${token}`}}); alert(await r.text());}}>Sugestões IA</a>
          </div>
          <p className="text-xs text-gray-500 mt-3">Defina NEXT_PUBLIC_API_URL nas variáveis de ambiente do frontend para apontar para a API.</p>
        </div>
      )}
    </div>
  );
}
