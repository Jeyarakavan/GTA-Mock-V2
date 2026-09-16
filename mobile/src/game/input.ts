/**
 * Touch-first input for React Native. Same poll/consume API as the web game so
 * Simulation, Player and CameraRig stay unchanged.
 */

export interface InputState {
  forward: number;
  strafe: number;
  sprint: boolean;
  jump: boolean;
  mouseDX: number;
  mouseDY: number;
  /** On mobile, treated as "camera look enabled" while playing. */
  pointerLocked: boolean;
}

const state: InputState = {
  forward: 0,
  strafe: 0,
  sprint: false,
  jump: false,
  mouseDX: 0,
  mouseDY: 0,
  pointerLocked: true,
};

const pressed = {
  interact: false,
  recover: false,
  pause: false,
  map: false,
  help: false,
};

type PressKey = keyof typeof pressed;

export function setPointerLocked(locked: boolean) {
  state.pointerLocked = locked;
  if (!locked) {
    state.mouseDX = 0;
    state.mouseDY = 0;
  }
}

export function setMove(forward: number, strafe: number) {
  state.forward = Math.max(-1, Math.min(1, forward));
  state.strafe = Math.max(-1, Math.min(1, strafe));
}

export function setSprint(on: boolean) {
  state.sprint = on;
}

export function setJump(on: boolean) {
  state.jump = on;
}

/** Accumulate camera delta from a touch pan (pixels → same scale as web mouse). */
export function addLookDelta(dx: number, dy: number) {
  if (!state.pointerLocked) return;
  state.mouseDX += dx * 0.004;
  state.mouseDY += dy * 0.004;
}

export function tapPress(key: PressKey) {
  pressed[key] = true;
}

export function getInput(): Readonly<InputState> {
  return state;
}

export function consumeMouse(out: { x: number; y: number }) {
  out.x = state.mouseDX;
  out.y = state.mouseDY;
  state.mouseDX = 0;
  state.mouseDY = 0;
}

export function consumePress(key: PressKey): boolean {
  if (!pressed[key]) return false;
  pressed[key] = false;
  return true;
}

export function peekPress(key: PressKey): boolean {
  return pressed[key];
}

export function injectPress(key: PressKey) {
  pressed[key] = true;
}

export function clearAllPresses() {
  for (const k of Object.keys(pressed) as PressKey[]) pressed[k] = false;
}

export function clearInput() {
  state.forward = 0;
  state.strafe = 0;
  state.sprint = false;
  state.jump = false;
  state.mouseDX = 0;
  state.mouseDY = 0;
}

/** No-op on mobile — kept for API compatibility with web Simulation. */
export function attachInput(_canvas: unknown): () => void {
  return () => {};
}

export function onPointerLockChanged(_cb: (locked: boolean) => void): () => void {
  return () => {};
}

export function requestPointerLock() {
  state.pointerLocked = true;
}

export function exitPointerLock() {
  state.pointerLocked = false;
  clearInput();
}

export function isPointerLocked(): boolean {
  return state.pointerLocked;
}
