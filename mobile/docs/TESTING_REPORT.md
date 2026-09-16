# Mobile testing report

Use this checklist for internship submission. Mark each item after testing on **Android** (device preferred).

**Device under test:** _fill in model_  
**Android version:** _fill in_  
**Build command:** `cd mobile && npm install && npx expo run:android`  
**Date:** _fill in_

## Test cases

| # | Scenario | Expected | Pass? | Notes |
|---|----------|----------|-------|-------|
| 1 | Fresh install → launch → New Game | Title menu, then 3D city loads | | |
| 2 | Walk with left joystick | Smooth movement all directions | | |
| 3 | Right-side drag | Camera rotates | | |
| 4 | SPRINT + JUMP on foot | Sprint and jump with ground rules | | |
| 5 | Approach car → USE | Enter vehicle | | |
| 6 | Drive with joystick + HB | Accelerate, brake, steer, handbrake | | |
| 7 | FIX while flipped/stuck | Vehicle recovers | | |
| 8 | Exit vehicle (USE) | Back on foot | | |
| 9 | Steal car / police chase | Wanted stars, pursuit, decay | | |
| 10 | First Delivery mission | Start, complete, reward once | | |
| 11 | Checkpoint Run | All gates, timer | | |
| 12 | Lose the Heat | Two stars → evade → home | | |
| 13 | Pause (II) → Resume | Timer frozen, state intact | | |
| 14 | MAP overlay | Full map opens/closes | | |
| 15 | Continue after save | Cash/jobs restored | | |
| 16 | Background app | Pauses; no corrupt state on return | | |
| 17 | 10–15 min session | No crashes, playable FPS | | |

## Performance (device)

| Quality | Approx. FPS (5 s sample) | Notes |
|---------|--------------------------|-------|
| Low | | |
| High | | |

## Issues found

_List bugs, frame drops, or blocked missions here._
