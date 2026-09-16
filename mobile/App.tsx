import { useEffect } from 'react';
import { View, StyleSheet, AppState, type AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameCanvas } from './src/game/GameCanvas';
import { Hud } from './src/ui/Hud';
import { StartMenu, PauseMenu, MapOverlay } from './src/ui/Menus';
import { TouchControls } from './src/ui/TouchControls';
import { useGame } from './src/game/store';
import { hydrateSave } from './src/game/save';
import { audio } from './src/game/audio';
import {
  consumePress,
  clearInput,
  setPointerLocked,
} from './src/game/input';

function useUiInputPump() {
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const { control, actions } = useGame.getState();

      if (consumePress('pause')) {
        if (control === 'menu') {
          /* title screen */
        } else if (useGame.getState().showMap) {
          actions.toggleMap();
        } else {
          actions.togglePause();
        }
      }

      if (control === 'onfoot' || control === 'driving' || control === 'paused') {
        if (consumePress('map')) actions.toggleMap();
        if (consumePress('help')) actions.toggleHelp();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

function useAppLifecycle() {
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const { control, actions } = useGame.getState();
      if (next === 'background' || next === 'inactive') {
        audio.setSuspended(true);
        if (control === 'onfoot' || control === 'driving') {
          clearInput();
          actions.pause();
        }
      } else if (control !== 'paused' && control !== 'menu') {
        audio.setSuspended(false);
        setPointerLocked(true);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
}

function useSaveHydration() {
  useEffect(() => {
    void hydrateSave().then(() => {
      useGame.getState().actions.hydrateFromDisk();
    });
  }, []);
}

function useAudioSettings() {
  const volume = useGame((s) => s.volume);
  const muted = useGame((s) => s.muted);
  useEffect(() => {
    audio.setVolume(volume);
    audio.setMuted(muted);
  }, [volume, muted]);
}

function useLandscapeLock() {
  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, []);
}

export default function App() {
  useLandscapeLock();
  useSaveHydration();
  useUiInputPump();
  useAppLifecycle();
  useAudioSettings();

  useEffect(() => () => audio.dispose(), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar hidden />
          <GameCanvas />
          <Hud />
          <TouchControls />
          <MapOverlay />
          <PauseMenu />
          <StartMenu />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#10141c',
  },
});
