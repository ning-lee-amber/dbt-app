# DBT 技巧 APP

依《DBT 技巧訓練講義及作業單》（Marsha M. Linehan 著，張老師文化，2015）製作的手機網頁 APP（PWA）。

- 所有使用者紀錄只存在各自手機的瀏覽器（localStorage），沒有帳號、沒有伺服器資料。
- 純靜態網站，部署在 Cloudflare Pages。

## 開發

```
node scripts/serve.mjs      # http://localhost:8790
node scripts/make-icons.mjs # 重新產生圖示
```

## 結構

- `public/js/content.js`：講義內容（全部 126 份的目錄，第一階段含痛苦耐受危機生存技巧講義 1–9a）
- `public/js/crisis.js`：危機模式（STOP、TIP、衝動卡、轉移注意力、再撐五分鐘、引導練習）
- `public/js/forms.js`：危機紀錄（作業單 1）、衝動卡（作業單 3）
- `public/js/pages.js`：今天、工具、講義、我的、工具箱、備份
- `docs/mockup.html`：介面草稿
