# Welcome to DressDrop

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
Change build number

---

# Project Overview

DressDrop (I-TOY) is an apparel discovery and saving app developed using React Native and Expo. Its core concept is to provide a Tinder-like card swiping experience, allowing users to easily discover, filter, and save their favorite clothing brands and items.

## Key Features

- **Swipeable Cards**: On the "Discover" page, users can intuitively swipe left or right to like or skip items, with support for double-tap and zoom gestures.
- **Category & Filtering**: Provides a comprehensive brand list and gender categorization (Men's/Women's), allowing users to quickly find items they are interested in.
- **Saved Items**: Add favorite items to your collection and browse them through a Grid view.
- **Seamless Detail View**: Clicking on an item smoothly expands it to a full-screen view, supporting rich gestures like pinch-to-zoom, swipe-down to close, and left-right navigation.
- **Global State Management**: Uniformly manages backend data fetching, user preferences, and saved lists via the React Context API.

## Architecture & Data Flow

This project uses Expo Router for routing management and strictly separates the "Routing Layer" and "UI Logic Layer" to ensure clean and highly reusable code.

### `app/` (Expo Routing Directory - Responsible for page navigation)
Defined using `.tsx` files, based on File-based Routing:
- **`_layout.tsx`**: Root layout, containing the global Context Provider (`AppProvider`) and stack navigation.
- **`modal.tsx`**: A simple modal component.
- **`(tabs)/`**: Bottom Tabs layout, containing:
  - **`index.tsx`**: Entry for the Discover tab (loads `Discover.js`)
  - **`category.tsx`**: Entry for the Category tab (loads `Category.js`)
  - **`saved.tsx`**: Entry for the Saved tab (loads `Saved.js`)

### `src/` (Core Source Code Directory - Responsible for UI and logic)
Uses `.js` files to implement actual screens and interaction logic:
- **`context/AppContext.js`**: Global state management. Responsible for fetching data from the backend (API), managing user's saved items (`savedItems`), brand preferences (`selectedBrands`), and full-screen view state.
- **`components/GlobalUIWrapper.js`**: Global UI decorators and overlays. Provides a global gradient background and is responsible for rendering the `OpenSaved` full-screen detail view.
- **`screens/`**: Core screen implementations.
  - **`Discover.js`**: Implements card swiping functionality (`react-native-deck-swiper`).
  - **`Category.js`**: Displays brand logos and filter conditions.
  - **`Saved.js`**: Presents saved items in a grid.
  - **`OpenSaved.js`**: Full-screen item detail view, supporting rich gestures and animations.

### Overall Data Flow

1. **[Initialization] `AppContext.js`**: When the app starts, it fetches item category data from the backend and reads user preferences and saved items locally.
2. **[Page Entry]**: Expo Router enters `app/(tabs)/index.tsx`, retrieves data from `AppContext`, and passes it to `src/screens/Discover.js`.
3. **[User Interaction]**: Swiping a card in `Discover.js` triggers a save event, calling `handleSave` in `AppContext` and updating the global `savedItems`.
4. **[State Synchronization]**: After the state updates, `Saved.js` re-renders immediately to show the latest saved items.
5. **[Global Detail View]**: Clicking a saved card triggers `handleOpenItem`, and `<GlobalUIWrapper>` immediately renders `OpenSaved.js` on top, displaying a seamless zoom animation.

## Tech Stack

- **Framework**: React Native, Expo
- **Routing**: Expo Router
- **State Management**: React Context API
- **Animations & Gestures**: `react-native-reanimated`, `react-native-gesture-handler`
- **Swiping Library**: `react-native-deck-swiper`
- **Backend Communication**: Fetch API
