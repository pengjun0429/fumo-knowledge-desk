const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "notedock", runtime: "cloudflare-workers", storage: env.DB ? "d1-ready" : "local-first" });
    }
    if (url.pathname === "/api/documents" && request.method === "GET") {
      if (!env.DB) return json({ documents: [], storage: "local-first" });
      const { results } = await env.DB.prepare("SELECT id, title, description, privacy, updated_at FROM documents ORDER BY updated_at DESC LIMIT 100").all();
      return json({ documents: results });
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
