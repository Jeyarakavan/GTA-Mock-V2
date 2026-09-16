import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useGame, missionDefs } from '../game/store';
import { clearSave, loadSave } from '../game/save';
import { audio } from '../game/audio';
import { setPointerLocked, clearInput } from '../game/input';
import { Minimap } from './Minimap';
import { MOBILE_CONTROLS } from './Hud';
import { theme } from './theme';
import type { Quality } from '../game/types';

function QualityToggle({
  value,
  onChange,
}: {
  value: Quality;
  onChange: (q: Quality) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>Quality</Text>
      <View style={styles.segmented}>
        {(['low', 'high'] as const).map((q) => (
          <Pressable
            key={q}
            style={[styles.seg, value === q && styles.segActive]}
            onPress={() => onChange(q)}
          >
            <Text style={styles.segText}>{q === 'low' ? 'Low' : 'High'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AudioSettings() {
  const volume = useGame((s) => s.volume);
  const muted = useGame((s) => s.muted);
  const actions = useGame((s) => s.actions);

  const steps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Volume</Text>
        <View style={styles.segmented}>
          {steps.map((v) => (
            <Pressable
              key={v}
              style={[styles.seg, Math.abs(volume - v) < 0.01 && styles.segActive]}
              onPress={() => {
                actions.setVolume(v);
                audio.setVolume(v);
              }}
            >
              <Text style={styles.segText}>{Math.round(v * 100)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Sound</Text>
        <Pressable
          style={[styles.seg, !muted && styles.segActive]}
          onPress={() => {
            const next = !muted;
            actions.setMuted(next);
            audio.setMuted(next);
          }}
        >
          <Text style={styles.segText}>{muted ? 'Muted' : 'On'}</Text>
        </Pressable>
      </View>
    </>
  );
}

export function StartMenu() {
  const control = useGame((s) => s.control);
  const hasSave = useGame((s) => s.hasSave);
  const quality = useGame((s) => s.quality);
  const actions = useGame((s) => s.actions);

  const [showControls, setShowControls] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (control === 'menu') actions.refreshHasSave();
  }, [control, actions]);

  if (control !== 'menu') return null;

  const save = hasSave ? loadSave() : null;

  const begin = (fromSave: boolean) => {
    audio.init();
    audio.setVolume(useGame.getState().volume);
    audio.setMuted(useGame.getState().muted);
    audio.setSuspended(false);
    audio.startAmbient();
    setPointerLocked(true);
    actions.startGame(fromSave);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backdrop} />
      <ScrollView contentContainerStyle={styles.menuContent}>
        <Text style={styles.kicker}>Welcome to</Text>
        <Text style={styles.gameTitle}>Neon District</Text>
        <Text style={styles.subtitle}>Street Run</Text>
        <Text style={styles.tagline}>
          A coastal city at dusk. A courier with a car and no patience.
        </Text>

        {!showControls ? (
          <>
            <Pressable
              style={[styles.btn, styles.btnPrimary, styles.btnLarge]}
              onPress={() => {
                if (hasSave && !confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                clearSave();
                setConfirmReset(false);
                begin(false);
              }}
            >
              <Text style={styles.btnTextPrimary}>
                {confirmReset ? 'Confirm — erase saved progress' : 'New Game'}
              </Text>
            </Pressable>
            {confirmReset && (
              <Pressable style={styles.btnGhost} onPress={() => setConfirmReset(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            )}

            {hasSave && !confirmReset && (
              <Pressable
                style={[styles.btn, styles.btnLarge]}
                onPress={() => begin(true)}
              >
                <Text style={styles.btnText}>Continue</Text>
                {save && (
                  <Text style={styles.btnSub}>
                    ${save.cash.toLocaleString()} ·{' '}
                    {save.completedMissions.length}/{missionDefs.length} jobs
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable style={styles.btnGhost} onPress={() => setShowControls(true)}>
              <Text style={styles.btnText}>Controls</Text>
            </Pressable>

            <View style={styles.menuSettings}>
              <QualityToggle value={quality} onChange={actions.setQuality} />
              <AudioSettings />
            </View>

            <Text style={styles.disclaimer}>
              An original game. Not affiliated with any existing game franchise.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Controls</Text>
            {MOBILE_CONTROLS.map(([key, desc]) => (
              <View style={styles.controlRow} key={key}>
                <Text style={styles.controlKey}>{key}</Text>
                <Text style={styles.controlDesc}>{desc}</Text>
              </View>
            ))}
            <Pressable style={styles.btn} onPress={() => setShowControls(false)}>
              <Text style={styles.btnText}>Back</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function PauseMenu() {
  const control = useGame((s) => s.control);
  const quality = useGame((s) => s.quality);
  const cash = useGame((s) => s.cash);
  const missionStatus = useGame((s) => s.missionStatus);
  const activeMission = useGame((s) => s.activeMission);
  const actions = useGame((s) => s.actions);
  const [confirmMenu, setConfirmMenu] = useState(false);

  const paused = control === 'paused';

  useEffect(() => {
    if (!paused) return;
    clearInput();
    setPointerLocked(false);
    audio.setSuspended(true);
    return () => {
      audio.setSuspended(false);
    };
  }, [paused]);

  if (!paused) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.backdrop} />
      <ScrollView contentContainerStyle={[styles.menuContent, styles.narrow]}>
        <Text style={styles.sectionTitle}>Paused</Text>

        <View style={styles.pauseStats}>
          <View>
            <Text style={styles.statLabel}>Cash</Text>
            <Text style={styles.statStrong}>${cash.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Jobs done</Text>
            <Text style={styles.statStrong}>
              {Object.values(missionStatus).filter((s) => s === 'completed').length}
              /{missionDefs.length}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => {
            setPointerLocked(true);
            actions.resume();
            audio.setSuspended(false);
          }}
        >
          <Text style={styles.btnTextPrimary}>Resume</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, !activeMission && styles.btnDisabled]}
          disabled={!activeMission}
          onPress={() => {
            setPointerLocked(true);
            actions.restartMission();
            audio.setSuspended(false);
          }}
        >
          <Text style={styles.btnText}>Restart mission</Text>
        </Pressable>

        {!confirmMenu ? (
          <Pressable style={styles.btnGhost} onPress={() => setConfirmMenu(true)}>
            <Text style={styles.btnText}>Return to menu</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.btn, styles.btnDanger]}
              onPress={() => {
                actions.saveProgress();
                actions.returnToMenu();
              }}
            >
              <Text style={styles.btnTextPrimary}>Save and quit to menu</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => setConfirmMenu(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
          </>
        )}

        <View style={styles.menuSettings}>
          <QualityToggle value={quality} onChange={actions.setQuality} />
          <AudioSettings />
        </View>

        <Text style={styles.sectionTitle}>Jobs</Text>
        {missionDefs.map((m) => (
          <View key={m.id} style={styles.logRow}>
            <Text style={styles.logTitle}>{m.title}</Text>
            <Text style={styles.logStatus}>
              {missionStatus[m.id] === 'completed'
                ? '✓ Done'
                : missionStatus[m.id] === 'active'
                  ? '● Active'
                  : missionStatus[m.id] === 'failed'
                    ? '× Failed — retry'
                    : 'Available'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function MapOverlay() {
  const showMap = useGame((s) => s.showMap);
  const control = useGame((s) => s.control);
  const actions = useGame((s) => s.actions);
  const { width, height } = useWindowDimensions();

  const playing = control === 'onfoot' || control === 'driving';
  if (!showMap || !playing) return null;

  const size = Math.min(520, Math.min(width, height) - 80);

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backdrop} onPress={() => actions.toggleMap()} />
      <View style={styles.mapPanel}>
        <Text style={styles.sectionTitle}>Neon District</Text>
        <Minimap size={size} viewRange={0} />
        <View style={styles.legend}>
          <Text style={styles.legendItem}>▲ Safehouse</Text>
          <Text style={styles.legendItem}>■ Garage</Text>
          <Text style={styles.legendItem}>● Job / Objective / Police</Text>
        </View>
        <Pressable style={styles.btnGhost} onPress={() => actions.toggleMap()}>
          <Text style={styles.btnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 16, 0.92)',
  },
  menuContent: {
    padding: 24,
    maxWidth: 480,
    width: '100%',
    zIndex: 1,
  },
  narrow: { maxWidth: 400 },
  kicker: {
    color: theme.textDim,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  gameTitle: {
    color: theme.teal,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.pink,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    color: theme.textDim,
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.teal,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#1e2636',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: 'rgba(46, 230, 200, 0.2)',
    borderColor: theme.teal,
  },
  btnDanger: {
    backgroundColor: 'rgba(255, 93, 93, 0.2)',
    borderColor: theme.danger,
  },
  btnLarge: { paddingVertical: 16 },
  btnDisabled: { opacity: 0.45 },
  btnGhost: {
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnText: { color: theme.text, fontSize: 15, fontWeight: '600' },
  btnTextPrimary: { color: theme.teal, fontSize: 15, fontWeight: '700' },
  btnSub: { color: theme.textDim, fontSize: 12, marginTop: 4 },
  menuSettings: {
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  settingLabel: {
    color: theme.textDim,
    width: 72,
    fontSize: 13,
  },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seg: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#1a2030',
  },
  segActive: {
    borderColor: theme.teal,
    backgroundColor: 'rgba(46, 230, 200, 0.12)',
  },
  segText: { color: theme.text, fontSize: 12, fontWeight: '600' },
  disclaimer: {
    color: theme.textDim,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  controlRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  controlKey: {
    color: theme.amber,
    fontWeight: '700',
    width: 100,
    fontSize: 12,
  },
  controlDesc: { color: theme.text, fontSize: 12, flex: 1 },
  pauseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statLabel: { color: theme.textDim, fontSize: 11 },
  statStrong: { color: theme.text, fontSize: 18, fontWeight: '700' },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  logTitle: { color: theme.text, fontSize: 13, flex: 1 },
  logStatus: { color: theme.textDim, fontSize: 12 },
  mapPanel: {
    backgroundColor: theme.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    alignItems: 'center',
    maxWidth: '95%',
  },
  legend: { marginTop: 12, marginBottom: 12, gap: 4 },
  legendItem: { color: theme.textDim, fontSize: 12 },
});
