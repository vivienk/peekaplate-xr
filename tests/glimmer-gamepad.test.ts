import { describe, expect, it, vi } from 'vitest';
import { BrowserGamepad, deadzone, directionalFocus, defaultFocus } from '../src/glimmer/gamepad';
import type { GlimmerApp } from '../src/glimmer/app';

function fixture(id = 'Xbox Wireless Controller') {
  const app = {
    screen: 'explore', market: { setInput: vi.fn(), interact: vi.fn() },
    setGamepadConnected: vi.fn(), unlockAudio: vi.fn(), close: vi.fn(), gamepadPause: vi.fn(),
    gamepadFocus: vi.fn(), gamepadSelect: vi.fn(), gamepadDelete: vi.fn(),
    rotate: vi.fn(), zoom: vi.fn(), nextDish: vi.fn(), resetPortal: vi.fn(),
    setScreen: vi.fn((screen: string) => { app.screen = screen; }),
  };
  const pad = { index: 0, id, connected: true, mapping: 'standard', axes: [0,0,0,0],
    buttons: Array.from({length:17}, () => ({pressed:false,value:0,touched:false})) } as unknown as Gamepad;
  const input = new BrowserGamepad(app as unknown as GlimmerApp);
  const tick = (dt = 1 / 60, active = true) => input.update(dt, [pad], active);
  const press = (index: number, value = 1) => { Object.assign(pad.buttons[index], {pressed:value > .5,value}); };
  tick();
  return {app,pad,input,tick,press};
}

describe('browser controller gameplay', () => {
  it.each(['Xbox Wireless Controller', 'DualSense Wireless Controller'])('%s moves and interacts with standard mapping', id => {
    const {app,pad,tick,press} = fixture(id);
    (pad.axes as number[])[0] = 1; tick(); expect(app.market.setInput).toHaveBeenLastCalledWith(1,0);
    press(0); tick(); tick(); expect(app.market.interact).toHaveBeenCalledTimes(1);
    press(0,0); tick(); press(0); tick(); expect(app.market.interact).toHaveBeenCalledTimes(2);
  });
  it('ignores stick drift and supports D-pad walking', () => {
    const {app,pad,tick,press} = fixture();
    (pad.axes as number[])[0] = .15; tick(); expect(app.market.setInput).not.toHaveBeenCalled();
    press(12); tick(); expect(app.market.setInput).toHaveBeenLastCalledWith(0,-1);
    press(12,0); tick(); expect(app.market.setInput).toHaveBeenLastCalledWith(0,0);
    expect(deadzone(NaN)).toBe(0);
  });
  it('opens tray, passport and map without keyboard', () => {
    for (const [button,screen] of [[2,'tray'],[3,'passport'],[8,'map']] as const) {
      const {app,tick,press} = fixture(); press(button); tick(); expect(app.setScreen).toHaveBeenCalledWith(screen);
    }
  });
  it('pauses and goes back once per press', () => {
    const {app,tick,press} = fixture(); press(9); tick(); tick(); expect(app.gamepadPause).toHaveBeenCalledTimes(1);
    press(9,0); press(1); tick(); tick(); expect(app.close).toHaveBeenCalledTimes(1);
  });
  it('navigates menus with delayed repeat and confirms only once', () => {
    const {app,tick,press} = fixture(); app.screen='menu'; press(13); tick(); tick(.2);
    expect(app.gamepadFocus).toHaveBeenCalledTimes(1);
    tick(.2); expect(app.gamepadFocus).toHaveBeenCalledTimes(2);
    press(0); tick(); tick(); expect(app.gamepadSelect).toHaveBeenCalledTimes(1);
  });
  it('can select code keypad buttons and delete characters', () => {
    const {app,tick,press} = fixture(); app.screen='codeEntry'; press(0); tick();
    expect(app.gamepadSelect).toHaveBeenCalledOnce(); press(0,0); press(2); tick();
    expect(app.gamepadDelete).toHaveBeenCalledOnce();
  });
  it('rotates, zooms, changes dishes and resets the portal', () => {
    const {app,pad,tick,press} = fixture(); app.screen='ar'; (pad.axes as number[])[2]=1;
    press(7); press(5); tick(.1); expect(app.rotate).toHaveBeenCalledWith(.2,0);
    expect(app.zoom).toHaveBeenCalledWith(-.06); expect(app.nextDish).toHaveBeenCalledWith(1);
    press(3); tick(); expect(app.resetPortal).toHaveBeenCalledOnce();
  });
  it('stops on disconnect and requires neutral controls on reconnect', () => {
    const {app,pad,input,tick,press} = fixture(); (pad.axes as number[])[0]=1; tick();
    input.update(.1,[],true); expect(app.market.setInput).toHaveBeenLastCalledWith(0,0);
    press(0); tick(); expect(app.market.interact).not.toHaveBeenCalled();
    (pad.axes as number[])[0]=0; press(0,0); tick(); press(0); tick(); expect(app.market.interact).toHaveBeenCalledOnce();
  });
  it('does not act while unfocused or in XR and does not replay held buttons on return', () => {
    const {app,tick,press} = fixture(); press(0); tick(.1,false); tick();
    expect(app.market.interact).not.toHaveBeenCalled(); press(0,0); tick(); press(0); tick();
    expect(app.market.interact).toHaveBeenCalledOnce();
  });
  it('does not guess mappings for unsupported controllers', () => {
    const {app,pad,input} = fixture(); Object.assign(pad,{mapping:''});
    input.update(.1,[pad],true); expect(app.setGamepadConnected).toHaveBeenLastCalledWith(false);
  });
});

describe('spatial menu focus', () => {
  const buttons = [
    {label:'Back',x:100,y:0,w:40,h:20,disabled:false},
    {label:'First',x:0,y:40,w:40,h:20,disabled:false},
    {label:'Unavailable',x:50,y:40,w:40,h:20,disabled:true},
    {label:'Next',x:100,y:40,w:40,h:20,disabled:false},
    {label:'Below',x:0,y:80,w:40,h:20,disabled:false},
  ];
  it('starts on content, skips disabled buttons and follows the layout', () => {
    expect(defaultFocus(buttons)).toBe(1);
    expect(directionalFocus(buttons,1,1,0)).toBe(3);
    expect(directionalFocus(buttons,1,0,1)).toBe(4);
    expect(directionalFocus(buttons,3,0,-1)).toBe(0);
    expect(directionalFocus(buttons,4,0,1)).toBe(4);
  });
});
