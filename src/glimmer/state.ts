import { colours, colourThresholds, dishes, districts, finds, headwear as hats, headwearThresholds, restaurants, type DistrictId } from './data';

export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export interface TrayLine { dish: string; qty: number }
export interface Ticket { number: string; lines: TrayLine[]; code: string }
export interface GameState {
  stamps: string[];
  finds: string[];
  tastingList: string[];
  colour: number;
  headwear: number;
  grandFinaleShown: boolean;
  ordersPlaced: number;
  visited: string[];
  districtFinales: string[];
  district: DistrictId;
  tray: TrayLine[];
  ticket: Ticket | null;
  pendingOrder: { lines: TrayLine[]; remaining: number } | null;
  holograms: TrayLine[];
}
export interface RuleResult { changed: boolean; message: string; unlocks?: string[] }
export function createState(): GameState {
  return { stamps: [], finds: [], tastingList: [], colour: 0, headwear: 0,
    grandFinaleShown: false, ordersPlaced: 0, visited: [], districtFinales: [],
    district: 'd1-rain-alley', tray: [], ticket: null, pendingOrder: null, holograms: [] };
}
function requireIndex(id: string, list: { id: string }[]): number {
  const index = list.findIndex(item => item.id === id);
  if (index < 0) throw new Error(`Unknown content: ${id}`);
  return index;
}
function bits(value: number, width: number): string {
  if (!Number.isInteger(value) || value < 0 || value >= 2 ** width) throw new Error('Value outside code range');
  return value.toString(2).padStart(width, '0');
}
function encodeBits(value: string): string {
  if (value.length % 5 !== 0) throw new Error('Invalid bit length');
  return value.match(/.{5}/g)!.map(chunk => CODE_ALPHABET[parseInt(chunk, 2)]).join('');
}
export function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/[IL]/g, '1').replace(/O/g, '0').replace(/U/g, 'V').replace(/[-\s]/g, '');
}
function decodeBits(code: string, length: number): string {
  const normalized = normalizeCode(code);
  if (normalized.length !== length || [...normalized].some(char => !CODE_ALPHABET.includes(char))) throw new Error("That code doesn't match. Check each character and try again.");
  return [...normalized].map(char => bits(CODE_ALPHABET.indexOf(char), 5)).join('');
}
function marketChecksum(payload: string): number {
  const padded = payload + '0000000';
  return padded.match(/.{8}/g)!.reduce((sum, byte, index) => sum + parseInt(byte, 2) * (index + 1), 0) % 512;
}
function mask(ids: string[], records: {id: string}[]): string {
  for (const id of ids) requireIndex(id, records);
  return records.map(record => ids.includes(record.id) ? '1' : '0').join('');
}
export function encodeMarketCode(state: GameState): string {
  const payload = '01' + mask(state.stamps, restaurants) + mask(state.finds, finds) + mask(state.tastingList, dishes)
    + bits(state.colour, 3) + bits(state.headwear, 2) + (state.grandFinaleShown ? '1' : '0')
    + bits(Math.min(15, state.ordersPlaced), 4)
    + (state.visited.includes('d2-lantern-steps') ? '1' : '0') + (state.visited.includes('d3-fogline-pier') ? '1' : '0');
  return encodeBits(payload + bits(marketChecksum(payload), 9)).match(/.{6}/g)!.join('-');
}
export function decodeMarketCode(code: string): GameState {
  const value = decodeBits(code, 18);
  const payload = value.slice(0, 81);
  if (payload.slice(0, 2) !== '01' || marketChecksum(payload) !== parseInt(value.slice(81), 2)) throw new Error("That code doesn't match. Check each character and try again.");
  const state = createState();
  const readMask = (start: number, records: {id: string}[]) => records.filter((_, index) => value[start + index] === '1').map(record => record.id);
  state.stamps = readMask(2, restaurants);
  state.finds = readMask(9, finds);
  state.tastingList = readMask(37, dishes);
  state.colour = parseInt(value.slice(69, 72), 2);
  state.headwear = parseInt(value.slice(72, 74), 2);
  state.grandFinaleShown = value[74] === '1';
  state.ordersPlaced = parseInt(value.slice(75, 79), 2);
  state.visited = districts.slice(1).filter((_, index) => value[79 + index] === '1').map(district => district.district);
  // Completed district finales and the grand finale must not replay on restore.
  state.districtFinales = districts.filter(district => restaurants.filter(r => r.district === district.district).every(r => state.stamps.includes(r.id))).map(district => district.district);
  if (state.stamps.length === restaurants.length) state.grandFinaleShown = true;
  return state;
}
function validateTray(lines: TrayLine[]): void {
  if (lines.length > 6 || new Set(lines.map(line => line.dish)).size !== lines.length) throw new Error('Order must contain at most 6 distinct dishes');
  for (const line of lines) {
    requireIndex(line.dish, dishes);
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 3) throw new Error('Quantity must be between 1 and 3');
  }
}
export function encodeOrderCode(lines: TrayLine[]): string {
  validateTray(lines);
  const payload = (bits(lines.length, 3) + lines.map(line => bits(requireIndex(line.dish, dishes), 5) + bits(line.qty - 1, 2)).join('')).padEnd(45, '0');
  const checksum = payload.match(/.{5}/g)!.reduce((sum, chunk) => sum + parseInt(chunk, 2), 0) % 32;
  return encodeBits(payload + bits(checksum, 5)).match(/.{5}/g)!.join('-');
}
export function decodeOrderCode(code: string): TrayLine[] {
  const value = decodeBits(code, 10);
  const count = parseInt(value.slice(0, 3), 2);
  const sum = value.slice(0, 45).match(/.{5}/g)!.reduce((total, part) => total + parseInt(part, 2), 0) % 32;
  if (count > 6 || sum !== parseInt(value.slice(45), 2) || /1/.test(value.slice(3 + count * 7, 45))) throw new Error('Invalid order code');
  const lines = Array.from({ length: count }, (_, index) => ({ dish: dishes[parseInt(value.slice(3 + index * 7, 8 + index * 7), 2)].id, qty: 1 + parseInt(value.slice(8 + index * 7, 10 + index * 7), 2) }));
  validateTray(lines);
  return lines;
}
export function awardStamp(state: GameState, restaurantId: string): RuleResult {
  const restaurant = restaurants[requireIndex(restaurantId, restaurants)];
  if (state.stamps.includes(restaurantId)) return { changed: false, message: '' };
  state.stamps.push(restaurantId);
  return { changed: true, message: `Stamp ${state.stamps.length}/7: ${restaurant.name}` };
}
export function collectFind(state: GameState, findId: string): RuleResult {
  const find = finds[requireIndex(findId, finds)];
  if (state.finds.includes(findId)) return { changed: false, message: '' };
  state.finds.push(findId);
  const count = state.finds.length;
  const unlocks = colours.filter((_, i) => colourThresholds[i] === count).map(name => `${name} raincoat`)
    .concat(hats.filter((_, i) => headwearThresholds[i] === count));
  return { changed: true, message: `Find ${count}/28: ${find.label}`, unlocks };
}
export function toggleSavedDish(state: GameState, dishId: string): RuleResult {
  requireIndex(dishId, dishes);
  const index = state.tastingList.indexOf(dishId);
  if (index < 0) state.tastingList.push(dishId); else state.tastingList.splice(index, 1);
  return { changed: true, message: index < 0 ? 'Dish saved to your Tasting List' : 'Dish removed from your Tasting List' };
}
export function changeQuantity(state: GameState, dishId: string, delta: number): RuleResult {
  requireIndex(dishId, dishes);
  if (!Number.isInteger(delta)) throw new Error('Quantity delta must be an integer');
  const line = state.tray.find(item => item.dish === dishId);
  if (!line) {
    if (delta <= 0) return { changed: false, message: '' };
    if (state.tray.length >= 6) return { changed: false, message: 'Your tray is full (6 dishes)' };
    state.tray.push({ dish: dishId, qty: 1 });
    return { changed: true, message: 'Added to your order' };
  }
  const qty = Math.min(3, line.qty + delta);
  if (qty === line.qty) return { changed: false, message: '' };
  if (qty <= 0) {
    state.tray.splice(state.tray.indexOf(line), 1);
    return { changed: true, message: 'Removed from your order' };
  }
  line.qty = qty;
  return { changed: true, message: `In order ×${qty}` };
}
export function chooseOutfit(state: GameState, kind: 'colour' | 'headwear', index: number): RuleResult {
  const names = kind === 'colour' ? colours : hats;
  const thresholds = kind === 'colour' ? colourThresholds : headwearThresholds;
  if (!Number.isInteger(index) || index < 0 || index >= names.length) throw new Error('Unknown wardrobe item');
  if (state.finds.length < thresholds[index]) return { changed: false, message: `Find ${thresholds[index]} to unlock ${names[index]}` };
  if (state[kind] === index) return { changed: false, message: '' };
  state[kind] = index;
  return { changed: true, message: `New look: ${colours[state.colour]} + ${hats[state.headwear]}` };
}
/** Call only from the confirmed order action, never from rendering or animation. */
export function placeOrder(state: GameState): Ticket | null {
  if (!state.tray.length) return null;
  const lines = state.tray.map(line => ({ ...line }));
  const code = encodeOrderCode(lines);
  state.ordersPlaced++;
  state.ticket = { number: `GP-${state.ordersPlaced}`, lines, code };
  state.pendingOrder = { lines, remaining: 8 };
  state.tray = [];
  state.holograms = [];
  return state.ticket;
}
/** Caller supplies world time; pass paused=true only for Pause/focus pause. */
export function advanceTime(state: GameState, deltaSeconds: number, paused = false): RuleResult {
  if (paused || !state.pendingOrder) return { changed: false, message: '' };
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new Error('Invalid world time');
  state.pendingOrder.remaining -= deltaSeconds;
  if (state.pendingOrder.remaining > 0) return { changed: false, message: '' };
  state.holograms = state.pendingOrder.lines.slice(0, 3);
  state.pendingOrder = null;
  return { changed: true, message: 'Your order is ready at the portal table' };
}
export function travel(state: GameState, districtId: DistrictId): RuleResult {
  const district = districts.find(item => item.district === districtId);
  if (!district) throw new Error('Unknown district');
  const first = districtId !== 'd1-rain-alley' && !state.visited.includes(districtId);
  if (first) state.visited.push(districtId);
  state.district = districtId;
  state.holograms = [];
  return { changed: true, message: first ? `New district: ${district.name}` : '' };
}
/** Consume on return to Explore, after closing the restaurant overlay. */
export function nextFinale(state: GameState): { kind: 'district' | 'grand'; district?: DistrictId } | null {
  if (state.stamps.length === restaurants.length && !state.grandFinaleShown) {
    state.grandFinaleShown = true;
    state.districtFinales = districts.map(d => d.district);
    return { kind: 'grand' };
  }
  const district = districts.find(d => !state.districtFinales.includes(d.district) && restaurants.filter(r => r.district === d.district).every(r => state.stamps.includes(r.id)));
  if (!district) return null;
  state.districtFinales.push(district.district);
  return { kind: 'district', district: district.district };
}
