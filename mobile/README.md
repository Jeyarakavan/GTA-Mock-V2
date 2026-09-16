# Neon District: Street Run — Mobile (React Native)

React Native port of the browser game in the repo root. Same seeded city, missions, wanted system, and physics-backed driving — with **touch-first** controls and **AsyncStorage** saves.

## Requirements

- Node.js 20+
- Android Studio + SDK (for emulator or USB device)
- JDK 17 (Android builds)

Rapier WASM and native OpenGL typically need a **development build**, not Expo Go alone.

## Install and run (Android)

**Do not use Expo Go.** This game needs native OpenGL (`expo-gl`) and Rapier WASM, so you must install a development build on an emulator or USB device.

### 1. One-time native build

```bash
cd mobile
npm install
npx expo run:android
```

Requirements before this works:

- Android Studio installed
- An emulator running **or** a phone with USB debugging enabled
- JDK 17

First run generates `android/`, compiles the native app, installs it, and starts Metro. That can take several minutes.

### 2. Later sessions

After the app is installed once:

```bash
npm start -- --dev-client
```

Then open **Neon District** on the device/emulator (not Expo Go). It will connect to Metro.

Other commands:

```bash
npm run android        # rebuild + install + start
npm run typecheck      # TypeScript
```

### Common mistakes

| What you did | What happens |
|--------------|--------------|
| `npm start` + Expo Go QR | Manifest may load; 3D/physics usually crash or fail |
| Press `s` for “development build” without `expo run:android` | “Unable to determine URI scheme / install expo-dev-client” |
| `npm audit fix --force` | Can downgrade Expo — **do not** run it |

## Controls (touch)

| Control | Action |
|---------|--------|
| Left joystick | Move on foot; throttle, brake, and steer in vehicles |
| Right-side drag | Look / camera |
| SPRINT | Sprint on foot |
| JUMP / HB | Jump on foot; handbrake while driving |
| USE | Enter/exit vehicle, start missions (when prompted) |
| FIX | Recover flipped/stuck vehicle |
| MAP | Full-screen map |
| ? | Controls help |
| II | Pause |

Orientation is **landscape**, locked while playing.

## Major dependencies

| Package | Purpose |
|---------|---------|
| `expo` / `expo-gl` | App shell and OpenGL context for Three.js |
| `three` + `@react-three/fiber` | 3D scene (native Canvas entry) |
| `@react-three/rapier` | Physics (WASM) |
| `zustand` | Game state (same pattern as web) |
| `@react-native-async-storage/async-storage` | Save data |
| `react-native-svg` | Minimap |
| `react-native-gesture-handler` | Touch stack |
| `expo-screen-orientation` | Landscape lock |

See [docs/MOBILE_ARCHITECTURE.md](./docs/MOBILE_ARCHITECTURE.md) for decisions and limitations.

## Shared game logic

Gameplay modules under `src/game/` mirror the web `src/game/` tree (world, missions, wanted, systems, etc.). Platform swaps:

- `input.ts` — touch API instead of keyboard/mouse
- `save.ts` — AsyncStorage instead of `localStorage`
- `audio.ts` — stub (web uses Web Audio synthesis)

## Testing

- Fill in [docs/TESTING_REPORT.md](./docs/TESTING_REPORT.md) after device testing.
- Web unit tests (`npm test` in repo root) still validate pure mission/wanted/save logic on the desktop package.

## Known limitations

- No synthesized audio on mobile yet (settings still save).
- Bundle size and FPS depend on device GPU; start with **Low** quality in the menu if needed.
- Desktop Playwright verification (`scripts/verify.mjs`) does not apply to this target.

