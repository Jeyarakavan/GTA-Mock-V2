# Mobile architecture — Neon District: Street Run

## Summary

The mobile app reuses the browser game’s **pure gameplay modules** (world generation, navigation, missions, wanted logic, vehicle physics, traffic/pedestrian/police systems, Zustand store shape) and replaces **platform-specific** layers: rendering context, input, persistence, audio, and UI.

## Technology choices

| Area | Web | Mobile decision | Rationale |
|------|-----|-----------------|-----------|
| Rendering | Three.js + R3F (DOM canvas) | Three.js + `@react-three/fiber/native` + `expo-gl` | Same scene graph and shaders; Expo provides a stable OpenGL ES context on Android. |
| Physics | `@react-three/rapier` | **Reuse** | Rapier runs as WASM; Metro is configured to bundle `.wasm`. |
| State | Zustand | **Reuse** | No DOM dependency; HUD still uses selective subscriptions. |
| Input | Keyboard/mouse | Mutable `input.ts` + touch overlay | Same poll/consume API as web so `Simulation`, `Player`, `CameraRig` stay aligned. |
| Persistence | `localStorage` | `@react-native-async-storage/async-storage` | Async hydrate on launch; in-memory cache for synchronous reads during play. |
| Audio | Web Audio API | **Stub** (`audio.ts`) | No procedural engine on RN yet; settings persist for a future native implementation. |
| Verification | Playwright | Manual/emulator checklist (`docs/TESTING_REPORT.md`) | No browser automation on device; unit tests remain on the web package. |

## Project layout

```
mobile/
  App.tsx                 RN shell, lifecycle, save hydrate
  src/game/               Ported game logic (shared behaviour with web)
  src/ui/                 Touch HUD, menus, minimap (SVG), controls
  docs/                   Architecture + testing notes
```

Game loop rules match the web README: transforms, physics, AI, and camera run in R3F `useFrame` / Rapier steps; React state is not updated every frame.

## Browser-only APIs removed or stubbed

- `document` / `canvas` pointer lock → touch look zone + virtual joystick
- `localStorage` → AsyncStorage
- `window` WebGL probe / context-loss UI → not applicable on native GL
- Web Audio → silent stub with compatible method signatures

## Known limitations

1. **Audio** — gameplay is silent until a native or third-party audio engine is wired.
2. **Expo Go** — Rapier WASM and native GL often require a **development build** (`expo run:android`), not Expo Go alone.
3. **Default quality** — use **Low** on older phones; traffic/pedestrian budgets follow `config.ts` like the web game.
4. **Police LOS** — same sampled footprint test as web (not physics raycasts).

## Performance notes

- Minimap redraws at ~20 Hz via SVG, not every frame.
- HUD fields (`speed`, health, etc.) are still throttled from `Simulation` as on web.
- Prefer measuring FPS on a **physical Android device**; emulators misreport GPU load.

Fill device model, OS version, and measured FPS in `docs/TESTING_REPORT.md` after on-device play.
