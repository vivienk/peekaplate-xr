import { drawStorefront } from './storefront';
import { liveRestaurants } from '../published/market';
import { districtIconNames, drawDistrictIcon } from './district-icons';
import rainAlley from './fixtures/market-map.json';
import lanternSteps from './fixtures/district-lantern-steps.json';
import foglinePier from './fixtures/district-fogline-pier.json';
import manifest from './fixtures/manifest.json';
import restaurants from './fixtures/restaurants.json';

type Point = [number, number];
type Rect = [number, number, number, number];
export interface MarketObject {
  id: string; kind: string; asset: string; pivot: number[]; sprite_file?: string;
  sittable?: boolean; label?: string; drift_px_s?: number; alpha?: number;
}
interface District {
  district: string; name: string; rows: string[]; width_tiles: number; height_tiles: number;
  player_spawn: number[]; objects: MarketObject[]; walker_paths: Record<string, number[][]>;
  tilesets: { ground: string; facade: string; water?: string };
  ground_tiles?: number[][]; facade_tiles?: number[][];
  exits: { rect_tiles: number[]; to: string; arrive_at: number[]; facing: string }[];
}
export interface MarketCallbacks {
  onInteract: (objectId: string) => void;
  onTravel: (districtId: string) => void;
  onSound?: (assetId: string) => void;
}
interface Walker { x: number; y: number; path: number[][]; target: number; direction: number; wait: number; blocked: number; facing: number; sprite: number; loop: boolean }
interface Particle { x: number; y: number; age: number; live: boolean }
interface DrawItem { y: number; object?: MarketObject; walker?: Walker; player?: boolean }
interface MarketLight { x:number; y:number; groundY:number; tint:keyof typeof tintColors; scale:number; alpha:number }
const districts = [rainAlley, lanternSteps, foglinePier] as District[];
const colors = ['yellow', 'cherry', 'teal', 'lavender', 'mint', 'coral', 'midnight', 'peach'];
const hats = ['hood', 'buckethat', 'catbeanie', 'souwester'];
const kinds = ['published-restaurant', 'restaurant', 'order-portal', 'kiosk', 'find-person', 'find-holo', 'find-wish', 'find-bottle', 'find-cat', 'find-puddle', 'bench', 'vending', 'signpost', 'gate'];
const building = {
  ramen: { w: 112, h: 128, chef: [8, -38], sign: [0, -96], period: .18, zone: [-32, 0, 64, 20] },
  cafe: { w: 128, h: 144, chef: [24, -48], sign: [0, -112], period: .20, zone: [-8, 0, 64, 20] },
  thai: { w: 112, h: 112, chef: [-2, -38], sign: [26, -80], period: .12, zone: [-28, 0, 56, 20] },
  pearl: { w: 112, h: 128, chef: [4, -38], sign: [0, -96], period: .18, zone: [-32, 0, 64, 20] },
  ember: { w: 112, h: 112, chef: [8, -40], sign: [0, -80], period: .14, zone: [-32, 0, 64, 20] },
  tide: { w: 128, h: 112, chef: [-8, -20], sign: [0, -60], period: .20, zone: [-40, 0, 72, 20] },
  kaigan: { w: 112, h: 112, chef: [2, -24], sign: [0, -64], period: .16, zone: [-32, 0, 64, 20] },
} as const;
const steamPoints: Record<keyof typeof building, readonly Point[]> = {
  ramen: [[28,-51],[-9,-47]], cafe: [[39,-64],[7,-56]], thai: [[-21,-54],[6,-49]],
  pearl: [[-39,-46],[-19,-53]], ember: [[-24,-51],[-8,-51]], tide: [[-30,-38],[-14,-31]], kaigan: [[31,-28]],
};
const tintColors = { cyan: '#9ff6ff', magenta: '#ff9be0', smoke: '#b9a7c9', gold: '#ffb347', violet: '#a98be6', red: '#ff4a3a' };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const pointIn = (x: number, y: number, r: Rect) => x >= r[0] && y >= r[1] && x <= r[0] + r[2] && y <= r[1] + r[3];

/** Original source-art renderer. All locations and counts come from the supplied fixtures. */
export class MarketWorld {
  readonly canvas = document.createElement('canvas');
  readonly ready: Promise<void>;
  readonly player = { x: 22, y: 29.6 };
  district = 'd1-rain-alley';
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private ctx: CanvasRenderingContext2D;
  private map = districts[0];
  private images = new Map<string, HTMLImageElement>();
  private assetFiles = new Map(manifest.assets.map(a => [a.id, a.files]));
  private tinted = new Map<string, HTMLCanvasElement>();
  private splashes: Particle[] = Array.from({length: 6}, () => ({x:0,y:0,age:0,live:false}));
  private sparkles: Particle[] = Array.from({length: 20}, () => ({x:0,y:0,age:0,live:false}));
  private splashAccumulator = 0;
  private randomSeed = 4173;
  private lookX = 0;
  private lookY = 0;
  private catAwakeUntil = new Map<string, number>();
  private puddleVisibility = new Map<string, number>();
  private finaleStarted = -100;
  private finaleDuration = 4;
  private finaleCount = 4;
  private background = document.createElement('canvas');
  private loaded = false;
  private clock = 0;
  private enabled = false;
  private paused = false;
  private color = 0;
  private hat = 0;
  private facing = 0;
  private walking = false;
  private entering = false;
  private waterFrame = 0;
  private seated = false;
  private found = new Set<string>();
  private keys = new Set<string>();
  private inputX = 0;
  private inputY = 0;
  private cameraX = 0;
  private cameraY = 0;
  private path: Point[] = [];
  private pathIndex = 0;
  private pendingObject: string | null = null;
  private marker: Point | null = null;
  private markerBadUntil = 0;
  private focusObject: MarketObject | null = null;
  private walkers: Walker[] = [];
  private districtWalkers = new Map<string, Walker[]>();
  private colliders: Rect[] = [];
  private drawItems: DrawItem[] = [];
  private groundObjects: MarketObject[] = [];
  private overheadObjects: MarketObject[] = [];
  private lights: MarketLight[] = [];
  private heldPuddle: string | null = null;
  private puddleTime = 0;
  private travelRemaining = 0;
  private travelTarget: {to: string; arrive: Point} | null = null;
  private footstepTime = 0;
  private footstepVariant = 0;
  private bumpTime = 0;
  private bumpPlayed = false;
  private activeObject: string | null = null;
  private activeUntil = 0;
  private readonly keyDown = (event: KeyboardEvent) => {
    if (!this.enabled || this.paused || this.entering || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName ?? '')) return;
    const key = event.key.toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key)) {
      event.preventDefault();
      if ((key === 'e' || key === ' ') && !event.repeat) this.interact();
      this.keys.add(key);
    }
  };
  private readonly keyUp = (event: KeyboardEvent) => { this.keys.delete(event.key.toLowerCase()); };
  private readonly blur = () => { this.keys.clear(); this.inputX = this.inputY = 0; };

  constructor(private callbacks: MarketCallbacks) {
    // The delivered 1920×1080 world targets use a 480×270 source view at ×4.
    this.canvas.width = 480; this.canvas.height = 270;
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.setAttribute('aria-label', 'PeekaPlate market. Walk with WASD or arrows; E interacts. Click to walk.');
    this.ctx = this.canvas.getContext('2d')!;
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    this.setDistrict(this.district);
    const files = manifest.assets.flatMap(a => a.files).filter(p => p.endsWith('.png'));
    this.ready = Promise.all(files.map(file => new Promise<void>((resolve) => {
      const image = new Image(); this.images.set(file, image);
      image.onload = () => resolve(); image.onerror = () => { this.images.delete(file); resolve(); };
      image.src = `${import.meta.env.BASE_URL}glimmer/${file}`;
    }))).then(() => { this.loaded = true; this.prepareTints(); this.paintBackground(); this.draw(); });
  }

  private talking=false;
  setTalking(value:boolean){this.talking=value;}
  get focusDetails(){const o=this.focusObject;return o?{...o,screenX:(o.pivot[0]*16-this.cameraX)*1280/this.canvas.width,screenY:(o.pivot[1]*16-this.cameraY)*720/this.canvas.height}:null;}
  get focus(): string | null { return this.focusObject?.id ?? null; }
  get objects(): readonly MarketObject[] { return this.map.objects; }
  get isEntering(){return this.entering;}
  get isTravelling(): boolean { return this.travelRemaining > 0; }
  get isSeated(): boolean { return this.seated; }
  get name(): string { return this.map.name; }
  setPaused(value: boolean): void { this.paused = value; if (value) this.blur(); }
  setEnabled(value: boolean): void {
    if (this.enabled === value) return;
    this.enabled = value; this.blur(); this.walking = false;
    // Scripted entry is suspended with a modal and resumes at the same waypoint.
    if (!this.entering) { this.path = []; this.pendingObject = null; }
    else if (value && this.pathIndex >= this.path.length) this.entering = this.moveTo(22,27);
  }
  setOutfit(color: number, hat: number): void { this.color = clamp(color, 0, 7); this.hat = clamp(hat, 0, 3); }
  setFound(found: Set<string>): void {
    for (const id of found) if (!this.found.has(id)) {
      const o = this.map.objects.find(item => item.id === id);
      if (o) for (let i = 0; i < 5; i++) { const particle = this.sparkles.find(p => !p.live); if (!particle) break; particle.x = o.pivot[0] * 16 + this.random() * 16 - 8; particle.y = o.pivot[1] * 16 - this.random() * 16; particle.age = -i * .035; particle.live = true; }
    }
    this.found = new Set(found);
  }
  /** Visual ceremony only; parent owns finale state, card and sound. */
  triggerFinale(grand: boolean): void { this.finaleStarted = this.clock; this.finaleDuration = grand ? 6 : 4; this.finaleCount = grand ? 6 : 4; }
  setInput(x: number, y: number): void { if (this.entering) return; this.inputX = x; this.inputY = y; }
  setSeated(value: boolean): void { this.seated = value; }
  startEntry(): void { this.setDistrict('d1-rain-alley', [22, 29.6]); this.enabled = true; this.entering = this.moveTo(22, 27); }

  setDistrict(id: string, arrive?: Point): void {
    const next = districts.find(d => d.district === id); if (!next) throw new Error(`Unknown district: ${id}`);
    this.district = id; this.map = next;
    this.player.x = arrive?.[0] ?? next.player_spawn[0]; this.player.y = arrive?.[1] ?? next.player_spawn[1];
    this.path = []; this.pendingObject = null; this.marker = null; this.focusObject = null; this.seated = false; this.entering = false;
    this.heldPuddle = null; this.puddleTime = 0; this.colliders = [];
    this.lookX = this.lookY = 0; this.catAwakeUntil.clear(); this.puddleVisibility.clear();
    this.finaleStarted = -100;
    for (const p of this.splashes) p.live = false;
    for (const p of this.sparkles) p.live = false;
    for (const o of next.objects) { if (o.kind === 'find-cat') this.catAwakeUntil.set(o.id,0); if (o.kind === 'find-puddle') this.puddleVisibility.set(o.id,0); }
    for (const object of next.objects) { const rect = this.collider(object); if (rect) this.colliders.push(rect); }
    let walkers = this.districtWalkers.get(id);
    if (!walkers) {
      walkers = Object.values(next.walker_paths).map((path, index) => ({x: path[0][0] * 16, y: path[0][1] * 16, path, target: 1, direction: 1, wait: index * .4, blocked: 0, facing: 3, sprite: index % 3 + 1, loop: id === 'd2-lantern-steps' && index === 2}));
      this.districtWalkers.set(id, walkers);
    }
    this.walkers = walkers;
    this.drawItems = next.objects.filter(o => !['decor-puddle','find-puddle','overhead','fx-fog'].includes(o.kind)).map(object => ({y: object.pivot[1] * 16, object}));
    this.drawItems.push(...walkers.map(walker => ({y: walker.y, walker})), {y: this.player.y * 16, player: true});
    this.groundObjects = next.objects.filter(o => ['decor-puddle','find-puddle'].includes(o.kind));
    this.overheadObjects = next.objects.filter(o => ['overhead','fx-fog'].includes(o.kind));
    this.prepareLights();
    this.cameraX = clamp(this.player.x * 16 - this.canvas.width / 2, 0, Math.max(0, next.width_tiles * 16 - this.canvas.width));
    this.cameraY = clamp(this.player.y * 16 - this.canvas.height / 2, 0, Math.max(0, next.height_tiles * 16 - this.canvas.height));
    if (this.loaded) this.paintBackground();
  }

  interact(): void {
    if (!this.enabled || this.paused || this.entering || this.travelRemaining) return;
    const object = this.findFocus(); if (!object) return;
    this.activeObject = object.id; this.activeUntil = this.clock + 2;
    if (object.kind === 'bench') { this.seated = true; this.player.x = object.pivot[0]; this.player.y = object.pivot[1] + 5 / 16; this.facing = 0; }
    this.path = []; this.pendingObject = null;
    this.callbacks.onInteract(object.id);
  }

  pointer(canvasX: number, canvasY: number): void {
    if (!this.enabled || this.paused || this.entering || this.travelRemaining) return;
    const x = canvasX + Math.round(this.cameraX), y = canvasY + Math.round(this.cameraY);
    let selected: MarketObject | undefined;
    for (const object of this.map.objects) {
      if (!this.interactive(object)) continue;
      const box = this.hitBox(object);
      if (pointIn(x,y,box) || pointIn(x,y,this.zone(object))) selected = object;
    }
    if (selected) {
      const zone = this.zone(selected);
      let best: Point | null = null, distance = Infinity;
      for (let cy = Math.ceil(zone[1] / 4) * 4 + 2; cy <= zone[1] + zone[3] - 1; cy += 4) for (let cx = Math.ceil(zone[0] / 4) * 4 + 2; cx <= zone[0] + zone[2] - 1; cx += 4) {
        if (!this.free(cx,cy)) continue;
        const d = (cx - this.player.x * 16) ** 2 + (cy - this.player.y * 16) ** 2;
        if (d < distance) { distance = d; best = [cx,cy]; }
      }
      if (best && this.moveTo(best[0] / 16,best[1] / 16)) this.pendingObject = selected.id;
      else this.reject(x,y);
    } else this.moveTo(x / 16,y / 16);
  }

  /** A* on a 4px configuration-space grid preserves the narrow source lanes and prop collision. */
  moveTo(tileX: number, tileY: number): boolean {
    const x = tileX * 16, y = tileY * 16;
    this.seated = false; this.pendingObject = null;
    if (!this.free(x,y)) { this.reject(x,y); return false; }
    const step = 4, width = this.map.width_tiles * 4, height = this.map.height_tiles * 4;
    const sx = Math.floor(this.player.x * 4), sy = Math.floor(this.player.y * 4);
    const tx = Math.floor(tileX * 4), ty = Math.floor(tileY * 4), start = sy * width + sx, goal = ty * width + tx;
    const scores = new Float64Array(width * height); scores.fill(Infinity); scores[start] = 0;
    const parents = new Int32Array(width * height); parents.fill(-1);
    const closed = new Uint8Array(width * height), open = [start];
    let reached = false;
    while (open.length) {
      let best = 0, f = Infinity;
      for (let i = 0; i < open.length; i++) { const n = open[i]; const score = scores[n] + Math.hypot(n % width - tx, Math.floor(n / width) - ty); if (score < f) { f = score; best = i; } }
      const current = open.splice(best,1)[0]; if (closed[current]) continue; closed[current] = 1;
      if (current === goal) { reached = true; break; }
      const cx = current % width, cy = Math.floor(current / width);
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = cx + ox, ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx; if (closed[n] || !this.free(nx * step + 2,ny * step + 2)) continue;
        if (ox && oy && (!this.free(cx * step + 2,ny * step + 2) || !this.free(nx * step + 2,cy * step + 2))) continue;
        const score = scores[current] + (ox && oy ? Math.SQRT2 : 1);
        if (score < scores[n]) { scores[n] = score; parents[n] = current; open.push(n); }
      }
    }
    if (!reached) { this.reject(x,y); return false; }
    const route: Point[] = [[x,y]];
    for (let n = goal; n !== start && n !== -1; n = parents[n]) route.push([n % width * step + 2,Math.floor(n / width) * step + 2]);
    this.path = route.reverse(); this.pathIndex = 0; this.marker = [x,y]; return true;
  }

  update(delta: number): void {
    const dt = Math.min(Math.max(delta,0),.05);
    if (!this.paused) {
      this.clock += dt;
      this.updateEffects(dt);
      if (this.district === 'd3-fogline-pier') { const frame = this.reducedMotion ? 0 : Math.floor(this.clock / .6) % 2; if (frame !== this.waterFrame) { this.waterFrame = frame; this.paintBackground(); } }
      for (const walkers of this.districtWalkers.values()) for (const walker of walkers) this.updateWalker(walker,dt);
      if (this.travelRemaining > 0) {
        this.travelRemaining -= dt;
        if (this.travelRemaining <= .2 && this.travelTarget) {
          const next = this.travelTarget; this.travelTarget = null;
          this.setDistrict(next.to,next.arrive); this.callbacks.onTravel(next.to);
        }
      } else if (this.enabled) this.updatePlayer(dt);
    }
    const targetX = clamp(this.player.x * 16 + (this.reducedMotion ? 0 : this.lookX) - this.canvas.width / 2,0,Math.max(0,this.map.width_tiles * 16 - this.canvas.width));
    const targetY = clamp(this.player.y * 16 + (this.reducedMotion ? 0 : this.lookY) - this.canvas.height / 2,0,Math.max(0,this.map.height_tiles * 16 - this.canvas.height));
    this.cameraX += (targetX - this.cameraX) * (1 - Math.exp(-dt / .15));
    this.cameraY += (targetY - this.cameraY) * (1 - Math.exp(-dt / .15));
    this.focusObject = this.findFocus(); this.draw();
  }

  private random(): number { this.randomSeed = (Math.imul(this.randomSeed,1664525) + 1013904223) >>> 0; return this.randomSeed / 4294967296; }
  private updateEffects(dt: number): void {
    for (const p of this.splashes) if (p.live) { p.age += dt; if (p.age >= .18) p.live = false; }
    for (const p of this.sparkles) if (p.live) { p.age += dt; if (p.age >= .32) p.live = false; }
    this.splashAccumulator += dt;
    while (this.splashAccumulator >= .1) {
      this.splashAccumulator -= .1;
      const p = this.splashes.find(particle => !particle.live); if (!p) continue;
      for (let attempt = 0; attempt < 8; attempt++) {
        const x = this.cameraX + this.random() * this.canvas.width, y = this.cameraY + this.random() * this.canvas.height;
        const tile = this.map.rows[Math.floor(y / 16)]?.[Math.floor(x / 16)];
        if (tile === '.' || tile === '=') { p.x = x; p.y = y; p.age = 0; p.live = true; break; }
      }
    }
    for (const o of this.map.objects) {
      const dx = o.pivot[0] * 16 - this.player.x * 16, dy = o.pivot[1] * 16 - this.player.y * 16;
      if (o.kind === 'find-cat' && dx * dx + dy * dy < 40 * 40) this.catAwakeUntil.set(o.id,this.clock + 2);
      if (o.kind === 'find-puddle') {
        const inside = dx * dx / (13 * 13) + dy * dy / (7 * 7) <= 1;
        const alpha = this.puddleVisibility.get(o.id) ?? 0;
        this.puddleVisibility.set(o.id,clamp(alpha + dt * (inside ? 1 / .3 : -1 / .5),0,1));
      }
    }
  }
  private prepareTints(): void {
    for (const id of ['fx-steam-puff','fx-glow-radial','fx-glow-reflection']) {
      const source = this.image(this.file(id)); if (!source) continue;
      for (const [name,color] of Object.entries(tintColors)) {
        const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
        const c = canvas.getContext('2d')!; c.drawImage(source,0,0); c.globalCompositeOperation = 'multiply'; c.fillStyle = color; c.fillRect(0,0,canvas.width,canvas.height); c.globalCompositeOperation = 'destination-in'; c.drawImage(source,0,0);
        this.tinted.set(`${id}:${name}`,canvas);
      }
    }
  }
  private tintSprite(id: string,tint: keyof typeof tintColors,x: number,y: number,w?: number,h?: number,column = 0,center = false): void {
    const image = this.tinted.get(`${id}:${tint}`); if (!image) return;
    w ??= image.width; h ??= image.height;
    this.ctx.drawImage(image,column * w,0,w,h,Math.round(x - w / 2),Math.round(y - (center ? h / 2 : h)),w,h);
  }

  private prepareLights():void {
    this.lights=[];
    for(const o of this.map.objects){
      const x=o.pivot[0]*16,y=o.pivot[1]*16;
      const add=(dx:number,dy:number,tint:MarketLight['tint'],scale=1,alpha=.35)=>this.lights.push({x:x+dx,y:y+dy,groundY:y+22,tint,scale,alpha});
      if(o.kind==='restaurant'||o.kind==='published-restaurant'){
        const key=o.asset.slice(4) as keyof typeof building,b=building[key];
        if(o.kind==='published-restaurant'&&/ember.*stone/i.test(liveRestaurants.get(o.id)?.name??'')){add(0,-b.h+36,'red',1.4,.4);add(-30,-35,'gold',1.3,.4);add(45,-55,'cyan',.7,.25);continue;}
        const tint=key==='ramen'||key==='ember'?'red':key==='cafe'?'magenta':key==='pearl'?'violet':'cyan';
        add(b.sign[0],b.sign[1]-16,tint,1.25);add(b.chef[0],b.chef[1]-12,key==='cafe'?'magenta':'gold',1.5,.28);
      }else if(o.asset==='prop-lamp')add(0,-40,'gold',1.25,.45);
      else if(o.asset.includes('prop-neon-vertical'))add(0,-24,o.asset.includes('cyan')?'cyan':o.asset.includes('violet')?'violet':'magenta');
      else if(o.kind==='find-holo')add(0,-24,o.asset.includes('4')?'cyan':o.asset.includes('5')?'gold':'violet',1,.3);
      else if(o.kind==='order-portal')add(0,-26,'cyan',1.5);
      else if(o.kind==='kiosk'||o.kind==='vending')add(0,-23,'cyan',.75,.3);
      else if(o.kind==='gate'){add(-34,-40,'gold',1,.4);add(34,-40,'gold',1,.4);add(0,-60,'magenta',1,.25);}
      else if(o.asset==='prop-lantern-string'){add(-22,8,'red',.65);add(22,8,'gold',.65);}
      else if(o.asset==='prop-steps-lantern-arch'){add(-25,10,'red',.8);add(25,10,'red',.8);}
    }
  }
  private drawLights(reflections:boolean):void {
    const c=this.ctx;c.save();c.globalCompositeOperation='lighter';
    for(const light of this.lights){
      const image=this.tinted.get(`${reflections?'fx-glow-reflection':'fx-glow-radial'}:${light.tint}`);if(!image)continue;
      const shimmer=this.reducedMotion?0:Math.floor(this.clock/.25)%3-1;
      c.globalAlpha=light.alpha;
      const w=image.width*light.scale,h=image.height*light.scale;
      c.drawImage(image,Math.round(light.x-w/2+(reflections?shimmer:0)),Math.round((reflections?light.groundY:light.y)-h/2),w,h);
      if(reflections){const pool=this.tinted.get(`fx-glow-radial:${light.tint}`);if(pool){c.globalAlpha=light.alpha*.7;c.drawImage(pool,light.x-40,light.groundY-10,80,20);}}
    }
    c.restore();
  }

  private updatePlayer(dt: number): void {
    let dx = this.inputX + Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    let dy = this.inputY + Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
    if (Math.abs(dx) + Math.abs(dy) > .1) { this.path = []; this.pendingObject = null; this.marker = null; this.seated = false; }
    else if (this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex]; dx = target[0] - this.player.x * 16; dy = target[1] - this.player.y * 16;
      if (Math.hypot(dx,dy) <= 72 * dt) { if (this.movementFree(target[0],target[1])) { this.player.x = target[0] / 16; this.player.y = target[1] / 16; this.pathIndex++; dx = dy = 0; } }
      if (this.pathIndex >= this.path.length) {
        this.entering = false;
        this.marker = null; const pending = this.pendingObject; this.pendingObject = null;
        if (pending && this.findFocus()?.id === pending) this.interact();
      }
    }
    const norm = Math.hypot(dx,dy); this.walking = norm > .05;
    if (this.walking) {
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
      this.lookX = dx / norm * 12; this.lookY = dy / norm * 12;
      dx = dx / norm * 72 * dt; dy = dy / norm * 72 * dt;
      const px = this.player.x * 16, py = this.player.y * 16;
      if (this.movementFree(px + dx,py)) this.player.x += dx / 16;
      if (this.movementFree(this.player.x * 16,py + dy)) this.player.y += dy / 16;
      if (Math.hypot(this.player.x * 16 - px,this.player.y * 16 - py) < .05) {
        this.bumpTime += dt;
        if (this.bumpTime > .25 && !this.bumpPlayed) { this.callbacks.onSound?.('sfx-bump'); this.bumpPlayed = true; }
        if (this.bumpTime > .6) { this.path = []; this.marker = null; this.entering = false; }
      } else { this.bumpTime = 0; this.bumpPlayed = false; this.footstepTime += dt; }
      if (this.footstepTime > .25) { this.footstepTime = 0; this.footstepVariant = this.footstepVariant % 3 + 1; this.callbacks.onSound?.(`sfx-step-wet-${this.footstepVariant}`); }
    }
    const focus = this.findFocus();
    if (focus?.kind === 'find-puddle' && !this.found.has(focus.id)) {
      if (this.heldPuddle !== focus.id) { this.heldPuddle = focus.id; this.puddleTime = 0; }
      this.puddleTime += dt;
      if (this.puddleTime > .3 && !this.walking) { this.puddleTime = -100; this.callbacks.onInteract(focus.id); }
    } else { this.heldPuddle = null; this.puddleTime = 0; }
    for (const exit of this.map.exits) if (pointIn(this.player.x,this.player.y,exit.rect_tiles as Rect)) {
      this.path = []; this.blur(); this.travelRemaining = 1.6; this.travelTarget = {to: exit.to,arrive: exit.arrive_at as Point}; this.callbacks.onSound?.('sfx-district-travel'); break;
    }
  }

  private updateWalker(w: Walker,dt: number): void {
    if (w.wait > 0) { w.wait -= dt; return; }
    const target = w.path[w.target]; const dx = target[0] * 16 - w.x, dy = target[1] * 16 - w.y, d = Math.hypot(dx,dy);
    if (d < 28 * dt) { w.x = target[0] * 16; w.y = target[1] * 16; w.target += w.direction; if (w.target >= w.path.length || w.target < 0) { if (w.loop) w.target = w.direction > 0 ? 1 : w.path.length - 2; else { w.direction *= -1; w.target += 2 * w.direction; w.wait = 1 + this.random() * 2; } } }
    else if (!this.walkers.includes(w) || Math.hypot(w.x + dx / d * 10 - this.player.x * 16,w.y + dy / d * 10 - this.player.y * 16) > 10) {
      w.blocked = 0; w.x += dx / d * 28 * dt; w.y += dy / d * 28 * dt; w.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    } else { w.blocked += dt; if (w.blocked > 2) { w.direction *= -1; w.target = clamp(w.target + w.direction,0,w.path.length - 1); w.blocked = 0; } }
  }

  private interactive(o: MarketObject): boolean { return kinds.includes(o.kind) && !(o.kind === 'bench' && (o.sittable === false || o.asset.includes('not sittable'))); }
  private zone(o: MarketObject): Rect {
    const x = o.pivot[0] * 16, y = o.pivot[1] * 16;
    if ((o.kind === 'restaurant' || o.kind === 'published-restaurant')) { const b = building[o.asset.slice(4) as keyof typeof building]; return [x + b.zone[0],y,b.zone[2],b.zone[3]]; }
    if (o.kind === 'gate') return [20 * 16,27 * 16,4 * 16,16];
    if (o.kind === 'find-bottle') return [x - 16,y - 24,32,24];
    if (o.kind === 'find-puddle') return [x - 13,y - 7,26,14];
    if (o.kind === 'find-cat') return [x - 16,y - 4,32,24];
    return [x - (o.kind === 'order-portal' ? 20 : 16),y,o.kind === 'order-portal' ? 40 : 32,o.kind === 'bench' ? 12 : 20];
  }
  private findFocus(): MarketObject | null {
    let best: MarketObject | null = null, score = Infinity;
    for (const o of this.map.objects) {
      if (!this.interactive(o)) continue;
      const r = this.zone(o); if (!pointIn(this.player.x * 16,this.player.y * 16,r)) continue;
      const d = Math.hypot(this.player.x * 16 - r[0] - r[2] / 2,this.player.y * 16 - r[1] - r[3] / 2) + kinds.indexOf(o.kind) * .00001;
      if (d < score) { score = d; best = o; }
    }
    return best;
  }
  private collider(o: MarketObject): Rect | null {
    const x = o.pivot[0] * 16, y = o.pivot[1] * 16;
    if ((o.kind === 'restaurant' || o.kind === 'published-restaurant')) { const b = building[o.asset.slice(4) as keyof typeof building]; return [x - b.w / 2 + 2,y - 60,b.w - 4,60]; }
    if (o.kind === 'kiosk') return [x - 9,y - 6,18,6];
    if (o.kind === 'order-portal') return [x - 16,y - 10,32,10];
    if (o.kind === 'find-person') return [x - 6,y - 6,12,6];
    if (o.kind === 'find-cat') return [x - 6,y - 6,12,6];
    if (o.kind === 'find-holo') return [x - 6,y - 4,12,4];
    if (o.kind === 'bench') return [x - 15,y - 7,30,5];
    if (o.kind === 'find-wish') return [x - 14,y - 4,28,4];
    if (o.kind === 'signpost') return [x - 3,y - 4,6,4];
    if (o.kind === 'vending') return [x - 7,y - 9,14,8];
    if (o.kind !== 'decor') return null;
    if (o.asset.includes('prop-lamp')) return [x - 3,y - 5,6,4];
    if (o.asset.includes('prop-plants')) return [x - 5,y - 6,10,5];
    if (o.asset.includes('prop-crates')) return [x - 7,y - 8,14,7];
    if (o.asset.includes('prop-barrel')) return [x - 6,y - 8,12,7];
    if (o.asset.includes('prop-umbrella-stand')) return [x - 5,y - 5,10,4];
    if (o.asset.includes('prop-pier-props#0')) return [x - 4,y - 6,8,5];
    if (o.asset.includes('prop-pier-props#2')) return [x - 7,y - 9,14,8];
    if (o.asset.includes('prop-pier-props#3')) return [x - 2,y - 3,5,3];
    if (o.asset.includes('rail') || o.asset.includes('prop-pier-props#1')) return [x - 2,y - 3,4,3];
    return [x - 5,y - 5,10,5];
  }
  private movementFree(x: number,y: number): boolean {
    if (!this.free(x,y)) return false;
    for (const w of this.walkers) if (x + 5 > w.x - 6 && x - 5 < w.x + 6 && y > w.y - 6 && y - 6 < w.y) return false;
    return true;
  }
  private free(x: number,y: number): boolean {
    if (x < 5 || y < 6 || x >= this.map.width_tiles * 16 - 5 || y >= this.map.height_tiles * 16) return false;
    for (let cy = Math.floor((y - 5) / 16); cy <= Math.floor(y / 16); cy++) for (let cx = Math.floor((x - 4) / 16); cx <= Math.floor((x + 4) / 16); cx++) {
      const tile = this.map.rows[cy]?.[cx]; if (!tile || tile === '#' || tile === '~') return false;
    }
    for (const r of this.colliders) if (x + 5 > r[0] && x - 5 < r[0] + r[2] && y > r[1] && y - 6 < r[1] + r[3]) return false;
    return true;
  }
  private reject(x: number,y: number): void { this.marker = [x,y]; this.markerBadUntil = this.clock + .3; this.callbacks.onSound?.('sfx-bump'); }
  private image(path: string): HTMLImageElement | undefined { const image = this.images.get(path); return image?.complete && image.naturalWidth ? image : undefined; }
  private file(id: string): string { return this.assetFiles.get(id)?.[0] ?? ''; }
  private sprite(path: string,x: number,y: number,w?: number,h?: number,column = 0,row = 0,center = false,top = false): void {
    const image = this.image(path); if (!image) return;
    w ??= image.width; h ??= image.height;
    this.ctx.drawImage(image,column * w,row * h,w,h,Math.round(x - w / 2),Math.round(top ? y : center ? y - h / 2 : y - h),w,h);
  }
  private paintBackground(): void {
    this.background.width = this.map.width_tiles * 16; this.background.height = this.map.height_tiles * 16;
    const c = this.background.getContext('2d')!; c.imageSmoothingEnabled = false;
    for (let y = 0; y < this.map.height_tiles; y++) for (let x = 0; x < this.map.width_tiles; x++) {
      const tile = this.map.rows[y][x], hash = (x * 13 + y * 29 + x * y * 3) >>> 0;
      let index = 0, file = this.file(this.map.tilesets.ground);
      if (tile === '#') {
        file = this.file(this.map.tilesets.facade); const explicit = this.map.facade_tiles?.[y]?.[x];
        if (explicit != null && explicit >= 0) index = explicit;
        else {
          let south = 1; while (south < 5 && this.map.rows[y + south]?.[x] === '#') south++;
          index = south === 1 ? 19 + hash % 4 : south === 2 ? [12,13,14,25,26,28,29][hash % 7] : south === 3 ? 8 + hash % 4 : south === 4 ? 1 : hash % 9 === 0 ? 4 : 3;
        }
      } else if (tile === '~') { file = this.file('tiles-water'); index = hash % 4 + this.waterFrame * 16; }
      else if (this.map.ground_tiles?.[y]?.[x] != null && this.map.ground_tiles[y][x] >= 0) index = this.map.ground_tiles[y][x];
      else if (this.district === 'd3-fogline-pier') index = tile === '=' ? hash % 8 : [19,20,31][hash % 3];
      else index = hash % 13 === 0 ? 4 + hash % 2 : hash % 4;
      const image = this.image(file); if (image) c.drawImage(image,index % 8 * 16,Math.floor(index / 8) * 16,16,16,x * 16,y * 16,16,16);
      else { c.fillStyle = tile === '#' ? '#11101f' : '#25243c'; c.fillRect(x * 16,y * 16,16,16); }
    }
  }
  private hitBox(o: MarketObject): Rect {
    const x = o.pivot[0] * 16,y = o.pivot[1] * 16;
    if ((o.kind === 'restaurant' || o.kind === 'published-restaurant')) { const b = building[o.asset.slice(4) as keyof typeof building]; return [x - b.w / 2,y - b.h,b.w,b.h]; }
    return [x - 16,y - (o.kind.includes('puddle') ? 8 : 32),32,o.kind.includes('puddle') ? 16 : 32];
  }

  private drawObject(o: MarketObject): void {
    const x = o.pivot[0] * 16,y = o.pivot[1] * 16;
    const t = this.reducedMotion ? 0 : this.clock;
    const active = o.id === this.activeObject && this.clock < this.activeUntil;
    if ((o.kind === 'restaurant' || o.kind === 'published-restaurant')) {
      const key = o.asset.slice(4) as keyof typeof building, b = building[key], folder = 'assets/world/buildings/';
      if(o.kind==='published-restaurant'){
        drawStorefront(this.ctx,o.id,liveRestaurants.get(o.id)?.name??'Restaurant',x,y,b.w,b.h,t,key,this.image(`${folder}${key}-back.png`),this.image(`${folder}${key}-front.png`),this.image(`${folder}${key}-sign.png`),this.image(`assets/characters/chef-${key}.png`));
        {
          const chimney=key==='ember'||/ember.*stone/i.test(liveRestaurants.get(o.id)?.name??'');
          for(let i=0;i<5;i++){
            const age=(t*.45+i*.2)%1;
            this.ctx.globalAlpha=(1-age)*.55;
            this.tintSprite('fx-steam-puff',chimney?'smoke':'cyan',x+(chimney?-b.w/2+10:-25)+Math.sin(age*5+i)*3,y-(chimney?b.h:50)-18*age,16,16,Math.min(3,Math.floor(age*4)));
          }
          this.ctx.globalAlpha=1;
        }
        return;
      }
      this.sprite(`${folder}${key}-back.png`,x,y);
      this.sprite(`assets/characters/chef-${key}.png`,x + b.chef[0],y + b.chef[1],24,24,Math.floor(t / b.period) % 4);
      this.sprite(`${folder}${key}-front.png`,x,y);
      this.sprite(`${folder}${key}-sign.png`,x + b.sign[0],y + b.sign[1],48,32,t % 3.7 > 3.55 ? 1 : 0);
      if (key === 'thai') this.sprite(this.file('fx-wok-flame'),x - 21,y - 47,16,16,Math.floor(t / .08) % 4);
      const rate = key === 'kaigan' ? 1 / .6 : key === 'ember' ? 4 : 3;
      const speed = key === 'ember' ? 14 : 10;
      for (const anchor of steamPoints[key]) for (let i = 0; i < 7; i++) {
        const born = (Math.floor(t * rate) - i) / rate, age = t - born;
        if (born < 0 || age >= 1.6) continue;
        const tint = key === 'ember' ? 'smoke' : key === 'cafe' || key === 'tide' || (key === 'thai' && i % 2 === 0) ? 'magenta' : 'cyan';
        this.ctx.globalAlpha = (age < .96 ? 1 : (1.6 - age) / .64) * (key === 'ember' ? .8 : .7);
        this.tintSprite('fx-steam-puff',tint,x + anchor[0] + Math.sin(born * 3 + age * 2) * 4,y + anchor[1] - age * speed,16,16,Math.min(3,Math.floor(age / .4)));
      }
      this.ctx.globalAlpha = 1; return;
    }
    if (o.kind === 'gate') { this.sprite('assets/world/buildings/gate-back.png',x,y); return; }
    if (o.kind === 'kiosk') { this.sprite(this.file('bld-kiosk'),x,y,32,48,t % 1.35 > 1.2 ? 1 : 0); return; }
    if (o.kind === 'find-cat') {
      const nearby = (this.catAwakeUntil.get(o.id) ?? 0) > this.clock;
      this.sprite(o.sprite_file!,x,y,16,16,active ? 4 + Math.floor(t / .16) % 2 : nearby ? (t % 1.95 < 1.8 ? 2 : 3) : Math.floor(t / .7) % 2);
      if (active && this.activeUntil - this.clock > 1.2) { const age = 2 - this.activeUntil + this.clock; this.ctx.globalAlpha = 1 - age / .8; this.sprite(this.file('fx-heart'),x,y - 20 - (this.reducedMotion ? 0 : age * 12.5)); this.ctx.globalAlpha = 1; }
      return;
    }
    if (o.kind === 'find-person') { const suffix = ({'npc-suzu':'elder','npc-kenta':'seller','npc-rin':'busker'} as Record<string,string>)[o.id] ?? o.id.slice(4); this.sprite(`assets/characters/npc-street-${suffix}.png`,x,y,24,32,(this.talking&&this.activeObject===o.id ? 2 : 0) + Math.floor(t / (this.talking&&this.activeObject===o.id ? .18 : .6)) % 2); return; }
    if (o.kind === 'find-holo') { const id = o.asset.match(/holo-ad-\d/)?.[0]; this.sprite(`assets/world/props/${id}.png`,x,y,32,48,active && this.activeUntil - this.clock > 1.6 ? [4,2,4][Math.min(2,Math.floor((2 - this.activeUntil + this.clock) / .08))] : [0,1,0,3][Math.floor(t / .12) % 4]); return; }
    if (o.kind.includes('puddle')) {
      const index = Number(o.asset.match(/prop-puddles#(\d)/)?.[1] ?? 0);
      this.sprite(`assets/world/props/puddle-${index + 1}.png`,x,y,undefined,undefined,0,0,true);
      const rippleAge = (t + o.pivot[0] * .37) % (1.5 + o.pivot[1] % 1.5);
      if (rippleAge < .48 && !this.reducedMotion) this.sprite('assets/world/fx/puddle-ripple.png',x,y,16,8,Math.floor(rippleAge / .12),0,true);
      if (o.kind === 'find-puddle' && (this.puddleVisibility.get(o.id) ?? 0) > 0) {
        const row = Number(o.asset.match(/find-charms(?:-2)?#(\d)/)?.[1] ?? 0);
        this.ctx.globalAlpha = this.puddleVisibility.get(o.id) ?? 0;
        this.sprite(this.file(o.asset.includes('find-charms-2') ? 'find-charms-2' : 'find-charms'),x,y,16,16,Math.floor(t / .4) % 2,row,true); this.ctx.globalAlpha = 1;
      }
      return;
    }
    if (o.kind === 'fx-fog') { const offset = t * (o.drift_px_s ?? 6) % 128; this.ctx.globalAlpha = o.alpha ?? .6; for (let xx = -128; xx < this.map.width_tiles * 16 + 128; xx += 128) this.sprite(this.file('fx-fog-band'),xx + offset,y,128,32,0,0,true); this.ctx.globalAlpha = 1; return; }
    const id = o.asset.split(/[ #]/)[0], file = this.file(id);
    const variant = Number(o.asset.match(/#(\d)/)?.[1] ?? 0);
    if (id === 'prop-lamp') this.sprite(file,x,y,16,48,t % 3.1 > 3.02 ? 1 : 0);
    else if (id === 'prop-neon-vertical') this.sprite(file,x,y,16,48,t % 2.8 > 2.7 ? 1 : 0,o.asset.includes('cyan') ? 1 : o.asset.includes('violet') ? 2 : 0);
    else if (id === 'prop-order-portal') this.sprite(file,x,y,48,48,t % 1.35 > 1.2 ? 1 : 0);
    else if (id === 'prop-plants') this.sprite(file,x,y,16,24,variant);
    else if (id === 'prop-pier-props') this.sprite(file,x,y,16,32,variant);
    else if (id === 'prop-vending') { this.sprite(file,x,y,16,32,Math.floor(t / .9) % 2); if (active) { const age = 2 - this.activeUntil + this.clock; this.ctx.globalAlpha = age > 1.5 ? (2 - age) * 2 : 1; this.sprite(this.file('fx-soda-can'),x - 1,y - 6 + Math.min(age / .3,1) * 2); this.ctx.globalAlpha = 1; } }
    else if (id === 'prop-wish-board') this.sprite(file,x,y,32,32,active ? Math.floor(t / .15) % 2 : 0);
    else if (id === 'prop-message-bottle') this.sprite(file,x,y,16,16,t % 2.2 > 2 ? 1 : 0);
    else if (id === 'prop-lantern-string') this.sprite(file,x,y,64,16,0,0,false,true);
    else if (id === 'prop-steps-lantern-arch') this.sprite(file,x + (this.reducedMotion ? 0 : Math.sin(t * Math.PI / 1.5)),y,96,32,0,0,false,true);
    else if (id === 'prop-floating-lantern') { for (let i = 0; i < 4; i++) this.sprite(file,x + i * 16,y - i * 3 + (this.reducedMotion ? 0 : Math.sin(t * Math.PI * 2 / 3 + i) * 2),8,12,Math.floor(t / .6) % 2,0,true); }
    else this.sprite(file,x,y);
  }
  private drawPlayer(): void {
    const file = `assets/characters/player-${colors[this.color]}-${hats[this.hat]}.png`;
    const frame = this.seated ? 7 : this.walking ? 2 + Math.floor(this.clock / .125) % 4 : Math.floor(this.clock / .5) % 2;
    const x = Math.round(this.player.x * 16),y = Math.round(this.player.y * 16);
    this.ctx.save(); this.ctx.translate(x,y); this.ctx.scale(1,-.55); this.ctx.globalAlpha = .18; this.sprite(file,0,0,16,24,frame,this.seated ? 0 : this.facing); this.ctx.restore();
    this.sprite(file,x,y,16,24,frame,this.seated ? 0 : this.facing);
  }
  private draw(): void {
    const c = this.ctx; c.imageSmoothingEnabled = false; c.fillStyle = '#05071a'; c.fillRect(0,0,this.canvas.width,this.canvas.height);
    if (!this.loaded) { c.fillStyle = '#f89537'; c.font = '16px monospace'; c.fillText('Lighting the market…',24,40); return; }
    c.save(); c.translate(-Math.round(this.cameraX),-Math.round(this.cameraY)); c.drawImage(this.background,0,0);
    for (const o of this.groundObjects) this.drawObject(o);
    for (const p of this.splashes) if (p.live) this.sprite(this.file('fx-rain-splash'),p.x,p.y,8,4,Math.min(2,Math.floor(p.age / .06)));
    this.drawLights(true);
    for (const item of this.drawItems) { if (item.player) item.y = this.player.y * 16; else if (item.walker) item.y = item.walker.y; }
    this.drawItems.sort((a,b) => a.y - b.y);
    for (const item of this.drawItems) {
      if (item.object) this.drawObject(item.object);
      else if (item.walker) this.sprite(`assets/characters/npc-walker-${item.walker.sprite}.png`,item.walker.x,item.walker.y,24,32,Math.floor(this.clock / .16) % 4,item.walker.facing);
      else this.drawPlayer();
    }
    for (const o of this.overheadObjects) this.drawObject(o);
    for (const p of this.sparkles) if (p.live && p.age >= 0) this.sprite(this.file('fx-sparkle'),p.x,p.y,8,8,Math.min(3,Math.floor(p.age / .08)),0,true);
    const finaleAge = this.clock - this.finaleStarted;
    if (finaleAge >= 0 && finaleAge < this.finaleDuration) {
      c.globalAlpha = Math.min(1,(this.finaleDuration - finaleAge) * 2);
      for (let i = 0; i < this.finaleCount; i++) this.sprite(this.file('prop-floating-lantern'),this.cameraX + this.canvas.width * (i + 1) / (this.finaleCount + 1),this.cameraY + this.canvas.height * .8 - (this.reducedMotion ? 0 : finaleAge * (22 + i * 3)),8,12,this.reducedMotion ? 0 : Math.floor(this.clock / .6) % 2,0,true);
      c.globalAlpha = 1;
    }
    const gate = this.map.objects.find(o => o.kind === 'gate');
    if (gate) { c.globalAlpha = this.player.y > 26 && this.player.x > 19 && this.player.x < 25 ? .55 : 1; this.sprite('assets/world/buildings/gate-top.png',gate.pivot[0] * 16,gate.pivot[1] * 16); c.globalAlpha = 1; }
    this.drawLights(false);
    if (this.marker && (this.pathIndex < this.path.length || this.clock < this.markerBadUntil)) { c.strokeStyle = this.clock < this.markerBadUntil ? '#f89537' : '#ffd27c'; c.beginPath(); c.ellipse(this.marker[0],this.marker[1],7,3,0,0,Math.PI * 2); c.stroke(); }
    c.restore();
    const rainCount = this.reducedMotion ? 30 : window.matchMedia('(pointer: coarse)').matches ? 60 : 90;
    c.globalAlpha = 1;
    for (let i = 0; i < rainCount; i++) {
      const speed = 260 + i % 61, y = (i * 53 + this.clock * speed) % (this.canvas.height + 16) - 8;
      const x = ((i * 83 - this.clock * speed * .176) % (this.canvas.width + 16) + this.canvas.width + 16) % (this.canvas.width + 16) - 8;
      c.save();c.translate(x,y);c.rotate(Math.PI/18);this.sprite(this.file('fx-rain-streak'),0,0);c.restore();
    }
    c.globalAlpha = 1;
    if (this.travelRemaining > 0) {
      const alpha = this.travelRemaining > 1.4 ? (1.6 - this.travelRemaining) / .2 : this.travelRemaining < .2 ? this.travelRemaining / .2 : 1;
      c.globalAlpha = clamp(alpha,0,1); c.fillStyle = '#05071a'; c.fillRect(0,0,this.canvas.width,this.canvas.height); c.fillStyle = '#f89537'; c.font = '24px monospace'; const destination=districts.find(d => d.district === this.travelTarget?.to)??this.map;const left=(this.canvas.width-c.measureText(destination.name).width-32)/2;drawDistrictIcon(c,districtIconNames[destination.district],left,this.canvas.height/2-22,24,'#f89537');c.textAlign='left';c.fillText(destination.name,left+32,this.canvas.height/2);c.textAlign='start'; c.globalAlpha = 1;
    }
  }
  dispose(): void { window.removeEventListener('keydown',this.keyDown); window.removeEventListener('keyup',this.keyUp); window.removeEventListener('blur',this.blur); this.images.clear(); this.tinted.clear(); }
}
