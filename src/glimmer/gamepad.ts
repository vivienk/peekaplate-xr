import type { GlimmerApp } from './app';

/** W3C standard mapping covers Xbox and browser-mapped DualShock/DualSense pads. */
export class BrowserGamepad {
  private index = -1;
  private id = '';
  private previous = 0;
  private armed = false;
  private moving = false;
  private direction = 0;
  private repeat = 0;
  private screen = '';

  constructor(private app: GlimmerApp) {}

  update(dt: number, pads: readonly (Gamepad | null)[], active: boolean): void {
    let pad: Gamepad | null = null;
    if (active) {
      for (const candidate of pads) {
        if (!candidate?.connected || candidate.mapping !== 'standard') continue;
        if (!pad || candidate.index === this.index) pad = candidate;
        if (candidate.index === this.index) break;
      }
    }
    if (!pad) {
      if (this.moving) this.app.market.setInput(0, 0);
      this.moving = false;
      if (this.index !== -1) this.app.setGamepadConnected(false);
      this.index = -1; this.armed = false; this.previous = 0; this.direction = 0;
      return;
    }
    let buttons = 0;
    for (let i = 0; i < Math.min(pad.buttons.length, 17); i++) {
      if (pad.buttons[i].pressed || pad.buttons[i].value > .5) buttons |= 1 << i;
    }
    const x = deadzone(pad.axes[0] ?? 0), y = deadzone(pad.axes[1] ?? 0);
    const rx = deadzone(pad.axes[2] ?? 0), ry = deadzone(pad.axes[3] ?? 0);
    if (pad.index !== this.index || pad.id !== this.id) {
      this.index = pad.index; this.id = pad.id; this.armed = false;
      this.app.setGamepadConnected(true);
    }
    // Require release after connection/focus recovery: held buttons cannot submit orders.
    if (!this.armed) {
      this.previous = buttons;
      this.armed = buttons === 0 && x === 0 && y === 0 && rx === 0 && ry === 0;
      return;
    }
    const pressed = buttons & ~this.previous;
    this.previous = buttons;
    if (pressed) this.app.unlockAudio();
    if (this.screen !== this.app.screen) {
      this.screen = this.app.screen; this.direction = 0; this.repeat = .35;
    }
    if (pressed & (1 << 9)) { this.app.gamepadPause(); return; }
    if (pressed & (1 << 1)) { this.app.close(); return; }
    if (this.app.screen === 'explore') {
      const mx = x || Number(!!(buttons & (1 << 15))) - Number(!!(buttons & (1 << 14)));
      const my = y || Number(!!(buttons & (1 << 13))) - Number(!!(buttons & (1 << 12)));
      if (mx || my || this.moving) this.app.market.setInput(mx, my);
      this.moving = !!(mx || my);
      if (pressed & 1) this.app.market.interact();
      else if (pressed & (1 << 2)) this.app.setScreen('tray');
      else if (pressed & (1 << 3)) this.app.setScreen('passport');
      else if (pressed & (1 << 8)) this.app.setScreen('map');
      return;
    }
    if (this.moving) { this.app.market.setInput(0, 0); this.moving = false; }
    if (this.app.screen === 'ar') {
      if (rx || ry) this.app.rotate(rx * dt * 2, ry * dt);
      const zoom = (pad.buttons[6]?.value ?? 0) - (pad.buttons[7]?.value ?? 0);
      if (Math.abs(zoom) > .1) this.app.zoom(zoom * dt * .6);
      if (pressed & (1 << 4)) this.app.nextDish(-1);
      if (pressed & (1 << 5)) this.app.nextDish(1);
      if (pressed & (1 << 3)) this.app.resetPortal();
    }
    if (pressed & (1 << 2) && this.app.screen === 'codeEntry') this.app.gamepadDelete();
    const nx = Number(!!(buttons & (1 << 15))) - Number(!!(buttons & (1 << 14))) || (Math.abs(x) > .5 ? Math.sign(x) : 0);
    const ny = Number(!!(buttons & (1 << 13))) - Number(!!(buttons & (1 << 12))) || (Math.abs(y) > .5 ? Math.sign(y) : 0);
    const direction = ny ? (ny < 0 ? 1 : 2) : nx ? (nx < 0 ? 3 : 4) : 0;
    this.repeat -= dt;
    if (direction && (direction !== this.direction || this.repeat <= 0)) {
      this.app.gamepadFocus(direction === 3 ? -1 : direction === 4 ? 1 : 0, direction === 1 ? -1 : direction === 2 ? 1 : 0);
      this.repeat = direction !== this.direction ? .35 : .14;
    }
    this.direction = direction;
    if (pressed & 1) this.app.gamepadSelect();
  }
}

export function deadzone(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) <= .2) return 0;
  return Math.sign(value) * Math.min(1, (Math.abs(value) - .2) / .8);
}

export interface FocusTarget { x: number; y: number; w: number; h: number; disabled: boolean; label: string }
export function defaultFocus(buttons: readonly FocusTarget[]): number {
  const primary = buttons.findIndex(b => !b.disabled && b.label !== 'Back');
  return primary >= 0 ? primary : buttons.findIndex(b => !b.disabled);
}
export function directionalFocus(buttons: readonly FocusTarget[], current: number, dx: number, dy: number): number {
  const from = buttons[current];
  if (!from || from.disabled) return defaultFocus(buttons);
  let best = current, score = Infinity;
  for (let i = 0; i < buttons.length; i++) {
    const to = buttons[i]; if (i === current || to.disabled) continue;
    const x = to.x + to.w / 2 - from.x - from.w / 2;
    const y = to.y + to.h / 2 - from.y - from.h / 2;
    const forward = x * dx + y * dy;
    if (forward <= 0) continue;
    const distance = forward + Math.abs(x * dy - y * dx) * 3;
    if (distance < score) { score = distance; best = i; }
  }
  return best;
}
