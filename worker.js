const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
});

const COOKIE = "fumo_session";
const encoder = new TextEncoder();

function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''); }
function unb64(value) { const s=value.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(value.length/4)*4,'='); return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); }
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
async function safeEqual(a,b) { if(a.length!==b.length) return false; let diff=0; for(let i=0;i<a.length;i++) diff|=a[i]^b[i]; return diff===0; }
async function makeSession(email, secret) { const payload=b64(encoder.encode(JSON.stringify({email,exp:Date.now()+8*60*60*1000}))); return `${payload}.${b64(await hmac(payload,secret))}`; }
async function readSession(request, secret) {
  const raw=request.headers.get('Cookie')||''; const match=raw.match(new RegExp(`${COOKIE}=([^;]+)`)); if(!match) return null;
  const [payload,signature]=match[1].split('.'); if(!payload||!signature) return null;
  const expected=b64(await hmac(payload,secret)); if(!(await safeEqual(encoder.encode(signature),encoder.encode(expected)))) return null;
  try { const data=JSON.parse(new TextDecoder().decode(unb64(payload))); return data.exp>Date.now()?data:null; } catch { return null; }
}
function sessionCookie(value,maxAge=8*60*60) { return `${COOKIE}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`; }
async function requireSession(request, env) { if(!env.FUMO_SESSION_SECRET) return null; return readSession(request, env.FUMO_SESSION_SECRET); }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ ok:true, service:"fumo-knowledge-desk", runtime:"cloudflare-workers", storage:env.DB?"d1-ready":"local-first" });
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (!env.FUMO_LOGIN_PASSWORD || !env.FUMO_SESSION_SECRET) return json({ error:"Login secrets are not configured" }, {status:503});
      let body; try { body=await request.json(); } catch { return json({error:"Invalid JSON"},{status:400}); }
      const email=String(body.email||'').trim().toLowerCase(); const password=String(body.password||''); const expectedEmail=(env.FUMO_LOGIN_EMAIL||'fumo@damcurryrice.com').toLowerCase();
      if(email!==expectedEmail || password!==env.FUMO_LOGIN_PASSWORD) return json({error:"帳號或密碼錯誤"},{status:401});
      const token=await makeSession(expectedEmail,env.FUMO_SESSION_SECRET);
      return json({ok:true,user:{email:expectedEmail}}, {headers:{'Set-Cookie':sessionCookie(token)}});
    }
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const session=await requireSession(request,env); return session?json({ok:true,user:{email:session.email}}):json({error:"Unauthorized"},{status:401});
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") return json({ok:true},{headers:{'Set-Cookie':sessionCookie('',0)}});
    if (url.pathname === "/api/documents" && request.method === "GET") {
      if(!(await requireSession(request,env))) return json({error:"Unauthorized"},{status:401});
      if(!env.DB) return json({ documents:[], storage:"local-first" });
      const { results }=await env.DB.prepare("SELECT id, title, description, privacy, updated_at FROM documents ORDER BY updated_at DESC LIMIT 100").all(); return json({documents:results});
    }
    if (url.pathname.startsWith('/api/')) return json({error:'Not found'},{status:404});
    return env.ASSETS.fetch(request);
  }
};
