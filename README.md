# FUMO Knowledge Desk

FUMO Knowledge Desk 是 FUMO 企業內部使用的 Markdown 協作知識工作台。

## 固定帳號登入

登入帳號固定為 FUMO 管理員帳號，登入驗證由 Cloudflare Worker 伺服器端處理。密碼不會寫入前端、GitHub 或 `wrangler.jsonc`。

需要設定兩個 Cloudflare Worker Secret：

```bash
npx wrangler secret put FUMO_LOGIN_PASSWORD --env production
npx wrangler secret put FUMO_SESSION_SECRET --env production
```

`FUMO_LOGIN_EMAIL` 可以用 Worker variable 設定；目前預設為 `fumo@damcurryrice.com`。建議正式環境仍把它一併放入 secret 或 variable 管理。請不要把真實密碼填入公開 repository。

本機測試可複製 `.dev.vars.example` 為 `.dev.vars`，再填入本機密碼與一組隨機 session secret；`.dev.vars` 已被 Git 忽略。

## 目前已完成

- FUMO 企業專用工作區
- 固定 Email 帳號登入介面
- `/api/auth/login`、`/api/auth/me`、`/api/auth/logout`
- HttpOnly、Secure、SameSite session cookie
- 未登入的正式環境使用者會導向 `/login/`
- 文件 API 需要有效登入 session
- Cloudflare Workers + Static Assets 架構
- D1 schema 已預留文件與版本資料

## Cloudflare 部署

登入 Cloudflare 後執行：

```bash
npx wrangler login
npx wrangler d1 create fumo-notedock-db
npx wrangler secret put FUMO_LOGIN_PASSWORD --env production
npx wrangler secret put FUMO_SESSION_SECRET --env production
npx wrangler deploy --env production
```

正式環境建議把 Worker 綁到 `micronationfumo.org` 的受保護路徑或子網域，並先在 Cloudflare Access 設定 default-deny。不要把 `workers.dev` 當成唯一正式入口。

## 本機啟動

```bash
npm run dev
```

登入頁：`http://127.0.0.1:5173/login/`
Cloudflare 本機 Worker：`npx wrangler dev`

## 安全注意

GitHub repository 是公開的，因此只能公開程式碼、設定範例與文件。真實密碼、session secret、API token 與 Cloudflare credentials 必須使用 Secret 管理。若剛才在聊天或其他公開位置貼過真實密碼，正式啟用前請先更換密碼。
