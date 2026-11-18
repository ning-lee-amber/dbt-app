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

- `public/js/content.js`：講義目錄與痛苦耐受講義 1–9a；`content-er.js`：情緒調節講義 1–25；`emotions.js`：十種情緒資料（講義 6、8a、11、13）
- `public/js/emotion.js`：情緒紀錄（作業單 2、4a）、每日打卡（作業單 14）、改變情緒流程（作業單 1、5–8）
- `public/js/content-mf.js`：了了分明講義；`phase3.js`：了了分明練習紀錄、中庸之道、正向活動、價值觀目標、ABC
- `public/js/crisis.js`：危機模式（STOP、TIP、衝動卡、轉移注意力、再撐五分鐘、引導練習）
- `public/js/forms.js`：危機紀錄（作業單 1）、衝動卡（作業單 3）
- `public/js/pages.js`：今天、工具、講義、我的、工具箱、備份
- `docs/mockup.html`：介面草稿
