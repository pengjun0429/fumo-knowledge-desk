# FUMO Knowledge Desk

FUMO Knowledge Desk 是 FUMO 企業內部使用的 Markdown 協作知識工作台，預設不提供公開空間與匿名分享。

## 目前已完成

- FUMO 企業專用工作區介面
- 移除公開空間切換與公開連結選項
- 文件預設為「FUMO 企業私有」
- FUMO 登入介面：註冊 ID／密碼、Google 登入、註冊入口
- 登入介面路徑：`/login/`
- Cloudflare Workers + Static Assets 架構
- D1 schema 已預留工作區、文件、權限與版本索引

## 登入現況

目前完成的是登入介面原型，尚未連接 FUMO 現有帳號的驗證 API，因此提交按鈕不會建立真正的登入 session。要完成正式登入，需要取得 FUMO 現有登入系統的 API、OAuth／OIDC 或 session/JWT 驗證介面。

現有 FUMO 公開登入頁為：

```text
https://www.micronationfumo.org/login
```

它支援註冊 ID／密碼與已註冊 Email 的 Google 登入。NoteDock 不應自行再建立另一套密碼資料庫。

## 本機啟動

```bash
npm run dev
```

開啟：

```text
http://127.0.0.1:5173/login/
```

## Cloudflare 架構

- **Workers + Static Assets**：提供 FUMO 前端與 `/api/*` API。
- **Cloudflare Access**：正式入口的企業登入與 default-deny 邊界，可作為外層保護。
- **D1**：儲存 FUMO 工作區、文件、權限與版本索引。
- **R2**：下一階段儲存附件與圖片。
- **Durable Objects**：下一階段處理多人即時編輯的房間狀態與 WebSocket 協調。

## 建立 D1（登入 Cloudflare 後執行）

```bash
npx wrangler login
npx wrangler d1 create fumo-notedock-db
```

把回傳的 `database_id` 加到 `wrangler.jsonc`，再執行：

```bash
npx wrangler d1 execute fumo-notedock-db --local --file=./schema.sql
npx wrangler d1 execute fumo-notedock-db --remote --file=./schema.sql
```

目前尚未登入 Cloudflare、建立 D1／R2 或正式部署。
