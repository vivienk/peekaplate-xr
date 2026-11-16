import { describe, expect, it } from 'vitest';
import { dishes, districts, finds, restaurants } from '../src/glimmer/data';
import { advanceTime, awardStamp, changeQuantity, chooseOutfit, CODE_ALPHABET, collectFind, createState, decodeMarketCode, decodeOrderCode, encodeMarketCode, encodeOrderCode, nextFinale, placeOrder, toggleSavedDish, travel } from '../src/glimmer/state';

describe('authoritative game content', () => {
  it('preserves all district, restaurant, dish and find counts and ordering', () => {
    expect(districts.map(d => [d.width_tiles, d.height_tiles])).toEqual([[44,32],[40,28],[40,28]]);
    expect(restaurants.map(r => r.dishes.length)).toEqual([4,5,6,4,4,4,5]);
    expect(dishes).toHaveLength(32);
    expect(dishes[16].id).toBe('r4-2');
    expect(dishes[27].id).toBe('r7-1');
    expect(finds).toHaveLength(28);
    expect(districts.map(d => finds.filter(f => f.district === d.district).length)).toEqual([12,8,8]);
    expect(new Set(finds.map(f => f.id)).size).toBe(28);
  });
});
describe('GDD code compatibility', () => {
  it('matches both published Market code vectors', () => {
    const state = createState();
    expect(encodeMarketCode(state)).toBe('800000-000000-000020');
    state.stamps = ['r1-ramen', 'r2-cafe'];
    state.finds = ['cat-1', 'cat-2', 'cat-3'];
    state.tastingList = ['r1-2', 'r2-4'];
    state.colour = 2; state.headwear = 1; state.ordersPlaced = 1; state.visited = ['d2-lantern-steps'];
    expect(encodeMarketCode(state)).toBe('E1R000-021000-00J31T');
    expect(decodeMarketCode('E1R000-021000-00J31T')).toEqual(state);
    expect(decodeMarketCode('elrooo o2looo ooj3lt')).toEqual(state);
  });
  it('matches both published order codes and round trips all dishes and quantities', () => {
    expect(encodeOrderCode([{dish:'r7-1',qty:2},{dish:'r4-2',qty:1}])).toBe('BDG00-00008');
    expect(encodeOrderCode([{dish:'r4-2',qty:1}])).toBe('60000-00006');
    for (const dish of dishes) for (let qty=1;qty<=3;qty++) {
      const lines = [{dish:dish.id,qty}];
      expect(decodeOrderCode(encodeOrderCode(lines))).toEqual(lines);
    }
  });
  it('rejects malformed, bad-checksum and unsupported-version codes', () => {
    for (const code of ['', 'E1R000-021000-00J31Z', '800000-000000-00002!', '000000-000000-000000']) expect(() => decodeMarketCode(code)).toThrow();
    expect(() => encodeOrderCode([{dish:'unknown',qty:1}])).toThrow();
    expect(() => encodeOrderCode([{dish:'r1-1',qty:4}])).toThrow();
    expect(() => decodeOrderCode('BDG00-00009')).toThrow();
  });
  it('round trips saved fields, restores ordered masks, and drops unsaved state', () => {
    const state = createState();
    state.stamps = restaurants.map(r => r.id);
    state.finds = finds.map(f => f.id).reverse();
    state.tastingList = dishes.map(d => d.id).reverse();
    state.colour = 7; state.headwear = 3; state.ordersPlaced = 40;
    state.visited = ['d2-lantern-steps','d3-fogline-pier']; state.grandFinaleShown = true;
    state.district = 'd3-fogline-pier'; state.tray = [{dish:'r1-1',qty:3}];
    const restored = decodeMarketCode(encodeMarketCode(state));
    expect(restored.stamps).toEqual(state.stamps);
    expect(restored.finds).toEqual(finds.map(f => f.id));
    expect(restored.tastingList).toEqual(dishes.map(d => d.id));
    expect([restored.colour,restored.headwear,restored.ordersPlaced]).toEqual([7,3,15]);
    expect(restored.tray).toEqual([]); expect(restored.district).toBe('d1-rain-alley');
    expect(nextFinale(restored)).toBeNull();
  });
  it('records the three undetected single-bit changes inherent in the specified checksum', () => {
    const undetected: string[] = [];
    const code = 'E1R00002100000J31T';
    for(let index=0;index<code.length;index++) for(let bit=0;bit<5;bit++) {
      const altered = code.slice(0,index)+CODE_ALPHABET[CODE_ALPHABET.indexOf(code[index]) ^ (1<<bit)]+code.slice(index+1);
      try { decodeMarketCode(altered); undetected.push(altered); } catch { /* correctly rejected */ }
    }
    expect(undetected).toEqual(['E1R01002100000J31T', 'E1R00002100400J31T', 'E1R00002100800J31T']);
  });
});
describe('progression and reward boundaries', () => {
  it('awards each stamp/find once and unlocks at all six thresholds', () => {
    const state = createState();
    expect(awardStamp(state,'r1-ramen').changed).toBe(true);
    expect(awardStamp(state,'r1-ramen').changed).toBe(false);
    const unlocked: [number, string[]][] = [];
    for (const find of finds) {
      const result=collectFind(state,find.id);
      if(result.unlocks?.length) unlocked.push([state.finds.length,result.unlocks]);
      expect(collectFind(state,find.id).changed).toBe(false);
    }
    expect(unlocked).toEqual([[4,['Mint raincoat']],[8,['Cat beanie']],[12,['Coral raincoat']],[16,["Sou'wester"]],[20,['Midnight raincoat']],[24,['Peach raincoat']]]);
    expect(chooseOutfit(state,'colour',7).changed).toBe(true);
  });
  it('rejects locked outfits without changing them and saves in selection order', () => {
    const state = createState();
    expect(chooseOutfit(state,'colour',7)).toEqual({changed:false,message:'Find 24 to unlock Peach'});
    expect(state.colour).toBe(0);
    toggleSavedDish(state,'r7-1'); toggleSavedDish(state,'r1-2');
    expect(state.tastingList).toEqual(['r7-1','r1-2']);
    toggleSavedDish(state,'r7-1'); expect(state.tastingList).toEqual(['r1-2']);
  });
  it('shows district finales once and gives the seventh stamp grand finale priority', () => {
    const state=createState();
    restaurants.slice(0,3).forEach(r=>awardStamp(state,r.id));
    expect(nextFinale(state)).toEqual({kind:'district',district:'d1-rain-alley'});
    expect(nextFinale(state)).toBeNull();
    restaurants.slice(3).forEach(r=>awardStamp(state,r.id));
    expect(nextFinale(state)).toEqual({kind:'grand'});
    expect(nextFinale(state)).toBeNull();
    const restored=decodeMarketCode(encodeMarketCode(state));
    expect(nextFinale(restored)).toBeNull();
  });
});
describe('demo ordering', () => {
  it('enforces six distinct lines and quantities one to three', () => {
    const state=createState();
    dishes.slice(0,6).forEach(d=>changeQuantity(state,d.id,1));
    expect(changeQuantity(state,dishes[6].id,1)).toEqual({changed:false,message:'Your tray is full (6 dishes)'});
    for(let i=0;i<5;i++) changeQuantity(state,dishes[0].id,1);
    expect(state.tray[0].qty).toBe(3);
    changeQuantity(state,dishes[0].id,-3);
    expect(state.tray).toHaveLength(5);
    changeQuantity(state,dishes[6].id,1); expect(state.tray).toHaveLength(6);
  });
  it('places once, waits eight world seconds, and carries pending orders across travel', () => {
    const state=createState();
    dishes.slice(0,5).forEach(d=>changeQuantity(state,d.id,1));
    const ticket=placeOrder(state)!;
    expect(ticket.number).toBe('GP-1'); expect(ticket.lines).toHaveLength(5);
    expect(decodeOrderCode(ticket.code)).toEqual(ticket.lines);
    expect(placeOrder(state)).toBeNull(); expect(state.ordersPlaced).toBe(1);
    advanceTime(state,7); expect(state.holograms).toEqual([]);
    advanceTime(state,10,true); expect(state.holograms).toEqual([]);
    travel(state,'d2-lantern-steps');
    expect(advanceTime(state,1).changed).toBe(true);
    expect(state.holograms).toEqual(ticket.lines.slice(0,3));
    expect(state.district).toBe('d2-lantern-steps');
    travel(state,'d1-rain-alley'); expect(state.holograms).toEqual([]);
  });
});
