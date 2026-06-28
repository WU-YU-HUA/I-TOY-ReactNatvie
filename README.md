# Welcome to DressDrop (I-TOY) 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start --tunnel --clear
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

# NPM Download
https://nodejs.org/

# Upload to Apple
eas login
eas build --platform ios
eas submit --platform ios
更改build Number

---

# 專案介紹 (Project Overview)

DressDrop (I-TOY) 是一個使用 React Native 與 Expo 開發的服飾探索與收藏 APP。其核心概念為提供使用者如同 Tinder 般的卡片滑動體驗，讓使用者能夠輕鬆地探索、篩選及收藏自己喜愛的服飾品牌與單品。

## 🌟 核心功能 (Key Features)

- **Tinder 式卡片滑動 (Swipeable Cards)**：在「探索」頁面中，使用者可以透過直覺的左右滑動來喜歡或跳過商品，並支援雙擊與縮放手勢。
- **品牌分類與篩選 (Category & Filtering)**：提供完整的品牌清單與性別分類（男裝/女裝），讓使用者能快速找到感興趣的商品。
- **個人收藏庫 (Saved Items)**：將喜歡的商品加入收藏，並透過網格 (Grid) 視圖進行瀏覽。
- **無縫全螢幕檢視 (Seamless Detail View)**：點擊商品後，可流暢地展開全螢幕檢視，支援雙指縮放、下滑關閉及左右切換等豐富手勢。
- **全域狀態管理 (Global State Management)**：透過 React Context API 統一管理後端資料獲取、使用者偏好設定及收藏清單。

## 📂 檔案架構與資料流 (Architecture & Data Flow)

本專案採用 Expo Router 進行路由管理，並嚴格區分「路由層」與「UI 邏輯層」，以確保程式碼的乾淨與高重用性。

### `app/` (Expo 路由目錄 - 負責頁面切換)
使用 `.tsx` 檔案定義，基於檔案系統的路由 (File-based Routing)：
- **`_layout.tsx`**: 根目錄佈局，包含全域 Context Provider (`AppProvider`) 及堆疊導航。
- **`modal.tsx`**: 簡單的彈出視窗元件。
- **`(tabs)/`**: 底部標籤導覽列 (Bottom Tabs) 佈局，包含：
  - **`index.tsx`**: 探索分頁入口 (載入 `Discover.js`)
  - **`category.tsx`**: 分類分頁入口 (載入 `Category.js`)
  - **`saved.tsx`**: 收藏分頁入口 (載入 `Saved.js`)

### `src/` (核心原始碼目錄 - 負責 UI 與邏輯)
使用 `.js` 檔案實作真正的畫面與互動邏輯：
- **`context/AppContext.js`**: 全域狀態管理。負責向後端 (API) 抓取資料，管理使用者的收藏 (`savedItems`)、品牌偏好 (`selectedBrands`) 及全螢幕檢視狀態。
- **`components/GlobalUIWrapper.js`**: 全域 UI 裝飾與覆蓋層。提供全域漸層背景，並負責渲染 `OpenSaved` 全螢幕細節畫面。
- **`screens/`**: 核心畫面實作。
  - **`Discover.js`**: 實作卡片滑動功能 (`react-native-deck-swiper`)。
  - **`Category.js`**: 展示品牌標誌與篩選條件。
  - **`Saved.js`**: 網格呈現收藏商品。
  - **`OpenSaved.js`**: 全螢幕商品細節檢視，支援豐富手勢與動畫。

### 🔄 整體資料運作流程

1. **[初始化] `AppContext.js`**：App 啟動時向後端拉取商品分類資料，並從本機讀取使用者偏好與收藏。
2. **[進入頁面]**：Expo 路由進入 `app/(tabs)/index.tsx`，並從 `AppContext` 取得資料，傳遞給 `src/screens/Discover.js`。
3. **[使用者互動]**：在 `Discover.js` 滑動卡片觸發收藏事件，呼叫 `AppContext` 的 `handleSave`，更新全域 `savedItems`。
4. **[狀態同步]**：狀態更新後，`Saved.js` 即時重新渲染，顯示最新收藏。
5. **[全域細節檢視]**：點擊收藏卡片會觸發 `handleOpenItem`，`<GlobalUIWrapper>` 隨即在最上層渲染 `OpenSaved.js`，展示無縫放大動畫。

## 🛠 技術堆疊 (Tech Stack)

- **框架**: React Native, Expo
- **路由**: Expo Router
- **狀態管理**: React Context API
- **動畫與手勢**: `react-native-reanimated`, `react-native-gesture-handler`
- **滑動套件**: `react-native-deck-swiper`
- **後端通訊**: Fetch API
