# Welcome to your Expo app 👋

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

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


# NPM Download
https://nodejs.org/

# Upload to Apple
eas login
eas build --platform ios
eas submit --platform ios
更改build Number

# 各個檔案的內容

## `app/` (Expo 路由目錄)
- **`_layout.tsx`**: 根目錄佈局設定。包含全域 Context Provider (`AppProvider`)、主題設定、以及堆疊導航 (Stack Navigation)。
- **`modal.tsx`**: 簡單的 Modal 視窗元件。
- **`(tabs)/_layout.tsx`**: 底部標籤導覽列 (Bottom Tabs) 的佈局設定，定義了「探索」、「收藏」與「分類」三個分頁。
- **`(tabs)/index.tsx`**: 「探索」分頁入口，負責載入並顯示 `src/screens/Discover.js`。
- **`(tabs)/category.tsx`**: 「分類」分頁入口，負責載入並顯示 `src/screens/Category.js`。
- **`(tabs)/saved.tsx`**: 「收藏」分頁入口，負責載入並顯示 `src/screens/Saved.js`。
- **`(tabs)/explore.tsx`**: Expo 預設的範例頁面，包含一些基本功能的展示。

## `src/` (核心原始碼目錄)
- **`context/AppContext.js`**: 全域狀態管理 (Context API)。處理 Firebase 資料抓取、使用者的收藏清單 (`savedItems`)、選擇的品牌 (`selectedBrands`)，以及控制全螢幕商品檢視的狀態。
- **`components/GlobalUIWrapper.js`**: 全域 UI 裝飾與覆蓋層。提供全域的漸層背景，並且在使用者點擊商品時，全域渲染 `OpenSaved` 元件顯示商品細節。
- **`screens/Discover.js`**: 「探索」核心畫面。實作類似 Tinder 的商品卡片滑動功能 (`react-native-deck-swiper`)，支援左右滑動挑選、雙擊按鈕，以及縮放手勢。
- **`screens/Category.js`**: 「分類」核心畫面。展示各品牌的標誌，可依照分類 (男裝/女裝) 篩選，並允許使用者選擇/取消選擇偏好的品牌。
- **`screens/OpenSaved.js`**: 商品詳細檢視畫面。當點開單一商品時顯示的全螢幕視窗，支援豐富的動畫與手勢操作，例如雙指縮放、向下滑動關閉，以及左右滑動切換上/下一個商品。
- **`screens/Saved.js`**: 「收藏」核心畫面。以網格 (Grid) 方式呈現使用者收藏的所有商品卡片，點擊後會展開該商品的詳細檢視。

## 檔案架構與資料流 (Data Flow)

### `.tsx` 與 `.js` 的差異 (為什麼要拆開？)
- **`.tsx` (放在 `app/`)**: 這些是 **路由與導覽入口**。此專案使用 Expo Router，它會根據 `app/` 下的檔案名稱自動產生畫面跳轉邏輯 (File-based Routing)。`.tsx` 本來代表 TypeScript + JSX 的檔案，但在這裡它們主要的工作非常輕量——只負責「決定這個網址/分頁要顯示哪個畫面元件」，並把需要用到的資料準備好傳遞下去。
- **`.js` (放在 `src/`)**: 這些是 **真正的核心畫面邏輯與 UI 實作**。包含所有畫面排版、動畫手勢 (`react-native-reanimated`, `react-native-gesture-handler`) 以及跟使用者的互動。
> **總結來說**：`app/` 裡的檔案負責「負責切換頁面 (Routing)」，而 `src/` 裡的檔案負責「畫面到底長怎樣以及怎麼互動 (UI & Logic)」。這樣拆分可以讓路由層很乾淨，核心 UI 也能重複使用。

### 整體資料運作流程

1. **[初始化與狀態管理] `src/context/AppContext.js`**
   - App 啟動時，位於 `app/_layout.tsx` 最外層的 `<AppProvider>` 會被建立。
   - `AppContext.js` 負責在幕後向 Firebase 後端拉取「商品分類 (`categories`)」，並從本機讀取使用者的「品牌偏好 (`selectedBrands`)」與「收藏清單 (`savedItems`)」。
   - 全域的資料與操作行為（如 `handleSave`, `handleOpenItem` 等），都會統一在這裡管理。

2. **[進入分頁與畫面] 以「探索 (Discover)」為例**
   - 當使用者點擊底部標籤的「探索」時，Expo 會進入路由 `app/(tabs)/index.tsx`。
   - `app/(tabs)/index.tsx` 向 `AppContext` 拿到了拉取回來的商品資料卡 (`cards`) 與目前滑動的進度 (`currentIndex`)。
   - 接著，它立刻將這些資料當作 Props，傳遞並渲染真正的畫面元件 `src/screens/Discover.js`。

3. **[使用者互動] `src/screens/` 的操作**
   - 到了 `src/screens/Discover.js`，畫面開始繪製出一張張可滑動的 Tinder 樣式卡片。
   - 當使用者把某張卡片向右滑 (或是點擊愛心)，會觸發 `onSave`。
   - 這個動作會呼叫到 `AppContext.js` 的 `handleSave` 函式，並更新全域的 `savedItems`。
   - 因為狀態被更新了，位於「收藏」分頁 (`app/(tabs)/saved.tsx` -> `src/screens/Saved.js`) 的畫面也會即時重新渲染，顯示剛剛收藏的商品。

4. **[全域彈出詳細視窗] `src/components/GlobalUIWrapper.js`**
   - 如果使用者在「收藏頁面 (`Saved.js`)」點擊某一張卡片，會呼叫 `AppContext` 的 `handleOpenItem`，將點擊的商品記錄到全域狀態 `openedItem` 中。
   - 包覆在整個 App 最外層的 `<GlobalUIWrapper>` 一旦發現 `openedItem` 裡面有東西，就會在所有畫面的**最上層**渲染 `src/screens/OpenSaved.js`。
   - `OpenSaved.js` 會讀取原本卡片在螢幕上的座標位置 (`originLayout`)，並執行一個無縫放大的轉場動畫，呈現商品的詳細資訊。當使用者向下滑動關閉時，再呼叫 `handleCloseItem` 清空狀態。
