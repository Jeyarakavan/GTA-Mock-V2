import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGame, missionById } from '../game/store';
import { WANTED } from '../game/config';
import { toKmh } from '../game/vehiclePhysics';
import { Minimap } from './Minimap';
import { theme } from './theme';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function WantedStars({ stars }: { stars: number }) {
  return (
    <View style={styles.wantedRow}>
      {Array.from({ length: WANTED.maxStars }, (_, i) => (
        <Text
          key={i}
          style={[styles.star, i < stars ? styles.starOn : styles.starOff]}
        >
          ★
        </Text>
      ))}
      <Text style={styles.wantedLabel}>
        {stars > 0 ? `WANTED ${stars}/${WANTED.maxStars}` : 'CLEAR'}
      </Text>
    </View>
  );
}

function Bar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export const MOBILE_CONTROLS: Array<[string, string]> = [
  ['Left joystick', 'Move on foot / throttle, brake and steer while driving'],
  ['Right side drag', 'Look around'],
  ['SPRINT', 'Sprint on foot (hidden while driving)'],
  ['JUMP / HB', 'Jump on foot / handbrake while driving'],
  ['USE', 'Enter or exit a vehicle, start a mission (when prompted)'],
  ['FIX', 'Recover a stuck or flipped vehicle while driving'],
  ['MAP', 'Full city map'],
  ['?', 'This controls list'],
  ['II', 'Pause'],
];

export function Hud() {
  const control = useGame((s) => s.control);
  const health = useGame((s) => s.health);
  const cash = useGame((s) => s.cash);
  const wantedStars = useGame((s) => s.wantedStars);
  const speed = useGame((s) => s.speed);
  const vehicleHealth = useGame((s) => s.vehicleHealth);
  const promptText = useGame((s) => s.promptText);
  const notifications = useGame((s) => s.notifications);
  const activeMission = useGame((s) => s.activeMission);
  const objectiveText = useGame((s) => s.objectiveText);
  const missionTime = useGame((s) => s.missionTime);
  const currentVehicleId = useGame((s) => s.currentVehicleId);
  const showHelp = useGame((s) => s.showHelp);

  const playing = control === 'onfoot' || control === 'driving';
  if (!playing) return null;

  const driving = control === 'driving';
  const kmh = Math.round(toKmh(speed));
  const mission = activeMission ? missionById(activeMission) : null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={[styles.panel, styles.topLeft]} pointerEvents="none">
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>HEALTH</Text>
          <Bar value={health} color={theme.success} />
          <Text style={styles.statValue}>{Math.round(health)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>CASH</Text>
          <Text style={styles.cash}>${cash.toLocaleString()}</Text>
        </View>
        <WantedStars stars={wantedStars} />
      </View>

      {mission && (
        <View style={[styles.panel, styles.topRight]} pointerEvents="none">
          <Text style={styles.missionTitle}>{mission.title}</Text>
          <Text style={styles.missionObjective}>{objectiveText}</Text>
          {missionTime !== null && (
            <View style={styles.timerRow}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text
                style={[
                  styles.timerValue,
                  missionTime < 15 && styles.timerUrgent,
                ]}
              >
                {formatTime(missionTime)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.panel, styles.bottomLeft]} pointerEvents="none">
        <Minimap size={140} viewRange={180} />
        <Text style={styles.minimapCaption}>NEON DISTRICT</Text>
      </View>

      {driving && currentVehicleId && (
        <View style={[styles.panel, styles.bottomRight]} pointerEvents="none">
          <View style={styles.speedo}>
            <Text style={styles.speedoValue}>{kmh}</Text>
            <Text style={styles.speedoUnit}>km/h</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>CONDITION</Text>
            <Bar
              value={vehicleHealth}
              color={vehicleHealth < 30 ? theme.danger : theme.orange}
            />
            <Text style={styles.statValue}>{Math.round(vehicleHealth)}%</Text>
          </View>
        </View>
      )}

      {promptText && (
        <View style={styles.prompt} pointerEvents="none">
          <Text style={styles.promptText}>{promptText}</Text>
        </View>
      )}

      <View style={styles.notifications} pointerEvents="none">
        {notifications.map((n) => (
          <View
            key={n.id}
            style={[
              styles.notification,
              n.tone === 'success' && styles.notifSuccess,
              n.tone === 'danger' && styles.notifDanger,
            ]}
          >
            <Text style={styles.notifText}>{n.text}</Text>
          </View>
        ))}
      </View>

      {showHelp && <ControlsOverlay />}
    </View>
  );
}

function ControlsOverlay() {
  return (
    <View style={styles.helpOverlay} pointerEvents="box-none">
      <View style={styles.helpPanel}>
        <Text style={styles.helpTitle}>Controls</Text>
        <ScrollView style={styles.helpScroll}>
          {MOBILE_CONTROLS.map(([key, desc]) => (
            <View style={styles.controlRow} key={key}>
              <Text style={styles.controlKey}>{key}</Text>
              <Text style={styles.controlDesc}>{desc}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.helpHint}>Tap ? again to close</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 15,
  },
  panel: {
    position: 'absolute',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 10,
  },
  topLeft: {
    top: 12,
    left: 12,
    minWidth: 180,
  },
  topRight: {
    top: 12,
    right: 140,
    maxWidth: 240,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    padding: 8,
  },
  bottomRight: {
    bottom: 12,
    right: 120,
    minWidth: 140,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '700',
    width: 62,
  },
  statValue: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1a2030',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  cash: {
    color: theme.amber,
    fontSize: 14,
    fontWeight: '700',
  },
  wantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  star: { fontSize: 16 },
  starOn: { color: theme.amber },
  starOff: { color: '#3a4250' },
  wantedLabel: {
    color: theme.textDim,
    fontSize: 10,
    marginLeft: 4,
  },
  missionTitle: {
    color: theme.teal,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  missionObjective: {
    color: theme.text,
    fontSize: 12,
    lineHeight: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timerValue: {
    color: theme.text,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
  },
  timerUrgent: { color: theme.danger },
  minimapCaption: {
    color: theme.textDim,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  speedo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  speedoValue: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  speedoUnit: {
    color: theme.textDim,
    fontSize: 11,
  },
  prompt: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.teal,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promptText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  notifications: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    gap: 6,
  },
  notification: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notifSuccess: { borderColor: theme.success },
  notifDanger: { borderColor: theme.danger },
  notifText: { color: theme.text, fontSize: 13 },
  helpOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  helpPanel: {
    backgroundColor: theme.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    maxWidth: 420,
    maxHeight: '80%',
    width: '100%',
  },
  helpTitle: {
    color: theme.teal,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  helpScroll: { maxHeight: 320 },
  controlRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  controlKey: {
    color: theme.amber,
    fontWeight: '700',
    fontSize: 12,
    width: 100,
  },
  controlDesc: {
    color: theme.text,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  helpHint: {
    color: theme.textDim,
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
});
