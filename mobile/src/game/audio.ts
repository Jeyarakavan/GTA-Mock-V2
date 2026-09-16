/**
 * Mobile audio stub. React Native has no Web Audio API; gameplay is unchanged
 * without sound. Volume/mute settings still persist for a future native engine.
 * See docs/MOBILE_ARCHITECTURE.md.
 */

class AudioManager {
  private volume = 0.7;
  private muted = false;
  private suspended = false;

  init(): boolean {
    return true;
  }

  get ready(): boolean {
    return true;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  setSuspended(s: boolean) {
    this.suspended = s;
  }

  startEngine() {}
  updateEngine(_speed01: number, _throttle: number) {}
  stopEngine() {}
  startSiren() {}
  updateSiren(_proximity01: number) {}
  stopSiren() {}
  startAmbient() {}
  stopAmbient() {}
  collision(_strength = 1) {}
  skid() {}
  jingle(_kind: 'success' | 'fail' | 'blip' = 'blip') {}
  dispose() {}
}

export const audio = new AudioManager();
