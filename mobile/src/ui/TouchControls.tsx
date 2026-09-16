import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Pressable,
  Text,
  type LayoutChangeEvent,
} from 'react-native';
import { useGame } from '../game/store';
import {
  addLookDelta,
  setJump,
  setMove,
  setSprint,
  tapPress,
} from '../game/input';
import { theme } from './theme';

const JOY_RADIUS = 52;
const KNOB_RADIUS = 26;
const MAX_THROW = 48;

function VirtualJoystick() {
  const origin = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        origin.current = { x: locationX, y: locationY };
        setKnob({ x: 0, y: 0 });
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        let dx = locationX - origin.current.x;
        let dy = locationY - origin.current.y;
        const len = Math.hypot(dx, dy);
        if (len > MAX_THROW) {
          dx = (dx / len) * MAX_THROW;
          dy = (dy / len) * MAX_THROW;
        }
        setKnob({ x: dx, y: dy });
        const forward = -dy / MAX_THROW;
        const strafe = dx / MAX_THROW;
        setMove(forward, strafe);
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
        setMove(0, 0);
      },
      onPanResponderTerminate: () => {
        setKnob({ x: 0, y: 0 });
        setMove(0, 0);
      },
    }),
  ).current;

  return (
    <View style={styles.joyBase} {...pan.panHandlers}>
      <View
        style={[
          styles.joyKnob,
          {
            transform: [
              { translateX: knob.x },
              { translateY: knob.y },
            ],
          },
        ]}
      />
    </View>
  );
}

function LookZone() {
  const last = useRef({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        last.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onPanResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const dx = pageX - last.current.x;
        const dy = pageY - last.current.y;
        last.current = { x: pageX, y: pageY };
        addLookDelta(dx, dy);
      },
    }),
  ).current;

  return <View style={styles.lookZone} {...pan.panHandlers} />;
}

function ActionButton({
  label,
  onPress,
  onPressIn,
  onPressOut,
  accent,
  visible = true,
}: {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  accent?: boolean;
  visible?: boolean;
}) {
  if (!visible) return null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        accent && styles.actionAccent,
        pressed && styles.actionPressed,
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function IconButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.iconBtn, pressed && styles.actionPressed]}
      onPress={onPress}
    >
      <Text style={styles.iconLabel}>{label}</Text>
    </Pressable>
  );
}

export function TouchControls() {
  const control = useGame((s) => s.control);
  const promptText = useGame((s) => s.promptText);
  const promptVehicleId = useGame((s) => s.promptVehicleId);

  const playing = control === 'onfoot' || control === 'driving';
  if (!playing) return null;

  const driving = control === 'driving';
  const canInteract = !!(promptText || promptVehicleId);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.topBar} pointerEvents="box-none">
        <IconButton label="II" onPress={() => tapPress('pause')} />
        <IconButton label="MAP" onPress={() => tapPress('map')} />
        <IconButton label="?" onPress={() => tapPress('help')} />
      </View>

      <View style={styles.leftPad} pointerEvents="box-none">
        <VirtualJoystick />
      </View>

      <LookZone />

      <View style={styles.rightActions} pointerEvents="box-none">
        {!driving && (
          <ActionButton
            label="SPRINT"
            onPressIn={() => setSprint(true)}
            onPressOut={() => setSprint(false)}
          />
        )}
        <ActionButton
          label={driving ? 'HB' : 'JUMP'}
          onPressIn={() => setJump(true)}
          onPressOut={() => setJump(false)}
        />
        <ActionButton
          label="USE"
          accent={canInteract}
          visible={canInteract}
          onPress={() => tapPress('interact')}
        />
        {driving && (
          <ActionButton
            label="FIX"
            onPress={() => tapPress('recover')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  topBar: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  leftPad: {
    position: 'absolute',
    left: 24,
    bottom: 28,
  },
  joyBase: {
    width: JOY_RADIUS * 2,
    height: JOY_RADIUS * 2,
    borderRadius: JOY_RADIUS,
    backgroundColor: 'rgba(16, 21, 31, 0.55)',
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joyKnob: {
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
    backgroundColor: 'rgba(46, 230, 200, 0.35)',
    borderWidth: 1,
    borderColor: theme.teal,
  },
  lookZone: {
    position: 'absolute',
    right: 0,
    top: 56,
    bottom: 24,
    width: '42%',
  },
  rightActions: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    gap: 10,
    alignItems: 'flex-end',
  },
  actionBtn: {
    minWidth: 64,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionAccent: {
    borderColor: theme.teal,
    backgroundColor: 'rgba(46, 230, 200, 0.15)',
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
