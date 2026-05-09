# React 專案

這是一個基於 Vite + React + TypeScript 構建的現代化專案。

## 快速開始

### 1. 安裝依賴套件

請確保您已經安裝了 Node.js，然後在專案根目錄下執行：

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 專案打包

```bash
npm run build
```

## GitHub Actions 自動部署

專案已經配置了 GitHub Actions (`.github/workflows/deploy.yml`)，當推送到 `main` 分支時，會自動將打包後的 `dist` 目錄部署到 GitHub Pages。

### 部署注意事項

1. 請至您的 GitHub Repository 的 **Settings** -> **Pages**。
2. 在 **Build and deployment** 區塊，將 **Source** 設定為 `GitHub Actions`。
3. 若您要部署至 GitHub Pages 的子路徑（例如 `https://<username>.github.io/<repo>/`），請至 `vite.config.ts` 中設定 `base` 屬性為您的專案名稱，例如：
   ```ts
   export default defineConfig({
     base: '/您的倉庫名稱/',
     // ...
   })
   ```

## .gitignore 設定說明

專案已經設定了完善的 `.gitignore` 來避免提交不必要的檔案，包含：
- `node_modules/`: 依賴套件資料夾。
- `dist/`, `dist-ssr/`: 打包後的建置產物。
- `*.log`: 各類日誌檔（如 `npm-debug.log`）。
- `.env`, `.env.local`: 環境變數與機密資訊（已保留 `.env.example` 供參考）。
- `.DS_Store` 等系統暫存與編輯器產生的隱藏檔案。
