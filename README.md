# Intercom Test

這是測試對講機功能的網頁

## 使用步驟

### Step1

clone this repo

### Step2

到 `config.json` 資料夾更改資料

### Step3

終端機執行：

`npm install`

`npm start`

### Step4

網頁會部署在：
http://localhost:3000

## 注意事項

1. 小心防火牆阻擋 WebSocket 的傳輸

2. 要記得讓瀏覽器允許 WebSocket Server

3. 因為這個是 http 網頁不是 https 網頁，所以只能在 http://localhost:3000 或 http://127.0.0.1:3000 在本機測試。
   無法用內網的網址如： http://10.0.0.100:3000 ，否則瀏覽器會強制不允許開啟麥克風。
