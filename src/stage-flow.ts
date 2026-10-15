import {
  AssetManager,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  TextureLoader,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  createSystem,
  UIKitMLAsset,
} from '@iwsdk/core';
import { loadMenu, type MenuDish } from './menu.js';

type Restaurant = {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  priceLevel: number;
  mapPosition: { x: number; z: number };
  hasMenu: boolean;
};

type Stage = 'welcome' | 'profile' | 'map' | 'menu' | 'dish' | 'compare' | 'order';
type WaiterState = 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike } }

const stages: Stage[] = ['welcome', 'profile', 'map', 'menu', 'dish', 'compare', 'order'];

export class StageFlowSystem extends createSystem({}) {
  private panel: UIKitMLAsset | null = null;
  private root: ReturnType<UIKitMLAsset['getElementById']> | null = null;
  private active: Stage = 'welcome';
  private transitioning = false;
  private profile = { allergies: ['sesame'], diets: ['high-protein'], spice: 1, budget: 2 };
  private dinerId: string | undefined;
  private restaurants: Restaurant[] = [];
  private selectedRestaurant: Restaurant | null = null;
  private selectedDish: MenuDish | null = null;
  private mapGroup: Group | null = null;
  private menuRoot: Object3D | null = null;
  private menuDishEntities: Array<{ dispose: () => void }> = [];
  private menuDishes: MenuDish[] = [];
  private menuFit = new Map<string, { fit: 'great' | 'ok' | 'avoid'; reason: string }>();
  private menuFilter = 'all';
  private dishRoot: Object3D | null = null;
  private dishModel: Object3D | null = null;
  private dishDragging = false;
  private dishLifeSize = false;
  private compareLeft: MenuDish | null = null;
  private compareRight: MenuDish | null = null;
  private replaceSide: 'left' | 'right' | null = null;
  private compareRoot: Object3D | null = null;
  private compareEntities: Array<{ dispose: () => void }> = [];
  private cartRestaurantId = 'dumpling-home';
  private cart: { lines: Array<{ dishId: string; name: string; quantity: number; unitPriceCents: number }>; total: number } = { lines: [], total: 0 };
  private messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private waiterBusy = false;
  private waiterState: WaiterState = 'ready';
  private hearReplies = false;
  private recognition: SpeechRecognitionLike | null = null;
  private avatarSprite: Object3D | null = null;
  private avatarTexture: ReturnType<TextureLoader['load']> | null = null;
  private orderPlaced = false;
  private orderRequestId = '';
  private selectedTakeHomeOptionRefs: string[] = [];
  private takeHomeOptions: Array<{ optionRef: string; title: string; sellerName: string; priceCents: number; frozen?: boolean; local?: boolean }> = [];
  private checkouts: Array<{ sellerName: string; continueUrl?: string; totals?: Array<{ type?: string; amount?: number; currency?: string }> }> = [];

  init(): void {
    this.panel = this.world.getSceneObject<UIKitMLAsset>('stage-flow-panel') ?? null;
    this.root = this.panel?.getElementById('flow-panel') ?? null;
    if (this.panel == null || this.root == null) return;

    const forward: Record<Stage, string> = {
      welcome: 'welcome-next', profile: 'profile-next', map: 'map-next', menu: 'menu-next',
      dish: 'dish-next', compare: 'compare-next', order: 'order-submit',
    };
    const back: Record<Exclude<Stage, 'welcome'>, string> = {
      profile: 'profile-back', map: 'map-back', menu: 'menu-back', dish: 'dish-back',
      compare: 'compare-back', order: 'order-back',
    };

    for (const stage of stages) {
      const next = this.panel.getElementById(forward[stage]);
      if (next != null) {
        const listener = () => { if (stage === 'profile') this.saveProfile(); this.goTo(stages[Math.min(stages.indexOf(stage) + 1, stages.length - 1)]); };
        next.addEventListener('click', listener);
        this.cleanupFuncs.push(() => next.removeEventListener('click', listener));
      }
      if (stage !== 'welcome') {
        const previous = this.panel.getElementById(back[stage]);
        if (previous != null) {
          const listener = () => this.goTo(stage === 'profile' ? 'map' : stages[stages.indexOf(stage) - 1]);
          previous.addEventListener('click', listener);
          this.cleanupFuncs.push(() => previous.removeEventListener('click', listener));
        }
      }
    }

    void this.loadSavedProfile();
    this.bindProfileChips();
    this.bindProfileReturn();
    this.bindDishControls();
    this.bindCompareControls();
    this.bindOrderControls();
    this.bindWaiterVoice();
    this.buildWaiterAvatarSprite();
    void this.loadRestaurants();
    void this.loadMenuStage();
    this.showStage('map');
    this.active = 'map';
  }

  private setWaiterState(state: WaiterState): void {
    this.waiterState = state;
    const label = state === 'ready' ? 'Ready' : state === 'listening' ? 'Listening' : state === 'thinking' ? 'Thinking' : state === 'speaking' ? 'Speaking' : 'Error - typed ordering still available';
    this.panel?.getElementById('waiter-state')?.setProperties({ text: `${label} - Peeka` });
    if (this.avatarSprite) { this.avatarSprite.position.x = state === 'listening' ? -0.02 : 0; this.avatarSprite.position.y = state === 'thinking' ? 1.2 : state === 'speaking' ? 1.24 : 1.22; this.avatarSprite.scale.setScalar(state === 'speaking' ? 1.04 : 1); }
  }

  private buildWaiterAvatarSprite(): void {
    const entity = this.world.createTransformEntity();
    const sprite = entity.object3D!;
    sprite.position.set(-0.72, 1.22, -1.08);
    const texture = new TextureLoader().load(`${import.meta.env.BASE_URL}assets/ordering-avatar.png`);
    this.avatarTexture = texture;
    const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    const mesh = new Mesh(new PlaneGeometry(0.32, 0.32), material);
    mesh.position.z = 0.02;
    sprite.add(mesh);
    this.avatarSprite = sprite;
  }

  private bindWaiterVoice(): void {
    const mic = this.panel?.getElementById('waiter-mic');
    const hear = this.panel?.getElementById('waiter-hear');
    const stop = this.panel?.getElementById('waiter-stop');
    const onMic = () => this.toggleListening();
    const onHear = () => { this.hearReplies = !this.hearReplies; hear?.setProperties({ backgroundColor: this.hearReplies ? '#ff5f1f' : '#35312e' }); };
    const onStop = () => this.stopVoice();
    mic?.addEventListener('click', onMic);
    hear?.addEventListener('click', onHear);
    stop?.addEventListener('click', onStop);
    this.cleanupFuncs.push(() => { mic?.removeEventListener('click', onMic); hear?.removeEventListener('click', onHear); stop?.removeEventListener('click', onStop); this.stopVoice(); this.avatarTexture?.dispose(); this.avatarSprite?.parent?.remove(this.avatarSprite); });
  }

  private toggleListening(): void {
    if (this.recognition) { this.stopVoice(); return; }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) { this.setWaiterState('error'); this.renderOrderState('Speech recognition is not supported here. Use the existing typed/controller controls.'); return; }
    const recognition = new Recognition();
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = (event) => { const text = event.results[0]?.[0]?.transcript?.trim(); if (text) void this.sendToWaiter(text); };
    recognition.onend = () => { this.recognition = null; if (this.waiterState === 'listening') this.setWaiterState('ready'); };
    recognition.onerror = () => { this.recognition = null; this.setWaiterState('error'); };
    this.recognition = recognition; this.setWaiterState('listening');
    try { recognition.start(); } catch { this.recognition = null; this.setWaiterState('error'); }
  }

  private stopVoice(): void {
    this.recognition?.stop(); this.recognition = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.waiterState === 'listening' || this.waiterState === 'speaking') this.setWaiterState('ready');
  }

  private speakReply(text: string): void {
    if (!this.hearReplies || !('speechSynthesis' in window)) return;
    this.stopVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => this.setWaiterState('speaking');
    utterance.onend = () => this.setWaiterState('ready');
    utterance.onerror = () => this.setWaiterState('error');
    window.speechSynthesis.speak(utterance);
  }

  private async loadRestaurants(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}restaurants.json`);
      if (!response.ok) return;
      this.restaurants = await response.json() as Restaurant[];
      this.buildMap();
      this.renderRestaurantCards();
    } catch {
      this.restaurants = [];
    }
  }

  private async loadMenuStage(): Promise<void> {
    try {
      const menu = await loadMenu(this.selectedRestaurant?.id ?? 'dumpling-home');
      this.menuDishes = Array.isArray(menu.dishes) ? menu.dishes : [];
      this.panel?.getElementById('menu-restaurant-label')?.setProperties({ text: `${menu.restaurant.toUpperCase()} / MENU` });
      this.bindMenuControls();
      await this.loadRecommendations();
      this.renderMenuCards();
    } catch {
      this.menuDishes = [];
    }
  }

  private async loadRecommendations(): Promise<void> {
    try {
      const response = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dinerId: this.dinerId, profile: this.profile }) });
      if (!response.ok) return;
      const data = await response.json() as { dishes?: Array<{ id: string; fit: 'great' | 'ok' | 'avoid'; reason: string }> };
      for (const item of data.dishes ?? []) this.menuFit.set(item.id, item);
    } catch { /* deterministic menu labels remain available */ }
  }

  private bindMenuControls(): void {
    const filters: Array<[string, string]> = [['menu-filter-all', 'all'], ['menu-filter-dumplings', 'dumplings'], ['menu-filter-buns', 'buns'], ['menu-filter-noodles', 'noodles'], ['menu-filter-dessert', 'dessert']];
    for (const [id, filter] of filters) {
      const element = this.panel?.getElementById(id);
      if (!element) continue;
      const listener = () => { this.menuFilter = filter; this.renderMenuCards(); for (const [, value] of filters) this.panel?.getElementById(value === filter ? `menu-filter-${value}` : `menu-filter-${value}`)?.setProperties({ backgroundColor: value === filter ? '#ff5f1f' : '#35312e' }); };
      element.addEventListener('click', listener);
      this.cleanupFuncs.push(() => element.removeEventListener('click', listener));
    }
    for (const dish of this.menuDishes) {
      const button = this.panel?.getElementById(`menu-select-${dish.id}`);
      if (!button) continue;
      const listener = () => { this.selectedDish = dish; this.prepareDish(dish); this.goTo('dish'); };
      button.addEventListener('click', listener);
      this.cleanupFuncs.push(() => button.removeEventListener('click', listener));
    }
  }

  private renderMenuCards(): void {
    for (const dish of this.menuDishes) {
      const visible = this.menuFilter === 'all' || dish.category?.toLowerCase().includes(this.menuFilter) || (this.menuFilter === 'buns' && dish.category?.toLowerCase().includes('bao')) || (this.menuFilter === 'dessert' && dish.category?.toLowerCase().includes('dessert'));
      const card = this.panel?.getElementById(`menu-dish-${dish.id}`);
      card?.setProperties({ display: visible ? 'flex' : 'none' });
      this.panel?.getElementById(`menu-name-${dish.id}`)?.setProperties({ text: dish.name });
      this.panel?.getElementById(`menu-price-${dish.id}`)?.setProperties({ text: `$${dish.price}` });
      const fit = this.menuFit.get(dish.id) ?? ((dish.allergens ?? []).some((item) => this.profile.allergies.includes(item)) ? { fit: 'avoid' as const, reason: 'Contains a selected allergen; confirm with staff' } : { fit: 'ok' as const, reason: 'Worth exploring tonight' });
      const label = fit.fit === 'great' ? 'Great for you' : fit.fit === 'avoid' ? 'Contains sesame-style matching-allergen warning' : 'OK';
      this.panel?.getElementById(`menu-fit-${dish.id}`)?.setProperties({ text: `${label} - ${fit.reason}` });
    }
  }

  private buildMenuDiorama(): void {
    if (this.menuRoot != null || this.menuDishes.length === 0) return;
    const entity = this.world.createTransformEntity();
    const root = entity.object3D!;
    root.position.set(0, 1.12, -1.22);
    const pedestal = new Mesh(new BoxGeometry(1.5, 0.06, 0.72), new MeshStandardMaterial({ color: 0x2b2825, roughness: 0.8 }));
    root.add(pedestal);
    this.menuRoot = root;
    const tiers = [0.42, 0.14, -0.14];
    for (const [index, dish] of this.menuDishes.entries()) {
      const dishEntity = this.world.createTransformEntity();
      const dishRoot = dishEntity.object3D!;
      dishRoot.position.set((index % 3 - 1) * 0.45, 0.08 + tiers[Math.floor(index / 3)], -0.08 + Math.floor(index / 3) * 0.06);
      root.add(dishRoot);
      this.menuDishEntities.push(dishEntity);
      void this.loadMiniature(dishRoot, dish, index);
    }
  }

  private async loadMiniature(target: Object3D, dish: MenuDish, index: number): Promise<void> {
    try {
      if (!dish.modelUrl) throw new Error('No model URL');
      const gltf = await AssetManager.loadGLTF(`${import.meta.env.BASE_URL}${dish.modelUrl.replace(/^\//u, '')}`, `menu-${dish.id}`);
      const model = gltf.scene.clone(true);
      model.updateMatrixWorld(true);
      const size = new Box3().setFromObject(model).getSize(new Vector3());
      model.scale.setScalar((dish.modelScale ?? 1) * 0.08 / (Math.max(size.x, size.y, size.z) || 1));
      model.position.y = 0.035;
      target.add(model);
    } catch {
      const plate = new Mesh(new CylinderGeometry(0.105, 0.11, 0.018, 32), new MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.72 }));
      const food = new Mesh(new SphereGeometry(0.055, 16, 12), new MeshStandardMaterial({ color: [0xc86b4a, 0x4f8b8a, 0xd99a42, 0x8a5a9b, 0x6d9b5d, 0xd26f82][index], roughness: 0.8 }));
      food.position.y = 0.055;
      target.add(plate, food);
    }
  }

  private disposeMenuDiorama(): void {
    for (const entity of this.menuDishEntities) entity.dispose();
    this.menuDishEntities = [];
    this.menuRoot?.parent?.remove(this.menuRoot);
    this.menuRoot = null;
  }

  private buildMap(): void {
    if (this.mapGroup != null) return;
    const entity = this.world.createTransformEntity();
    const group = new Group();
    group.position.set(0, 1.08, -1.18);
    group.rotation.x = -0.12;
    const table = new Mesh(new BoxGeometry(1.35, 0.06, 1.05), new MeshStandardMaterial({ color: 0x35312e, roughness: 0.9 }));
    table.position.y = -0.04;
    group.add(table);
    const streetMaterial = new MeshBasicMaterial({ color: 0x625a52 });
    for (const [x, z, width, depth] of [[0, 0, 1.1, 0.025], [0, 0, 0.025, 0.84], [-0.3, 0.18, 0.025, 0.62], [0.35, -0.22, 0.55, 0.025]] as const) {
      const street = new Mesh(new BoxGeometry(width, 0.012, depth), streetMaterial);
      street.position.set(x, 0.01, z);
      group.add(street);
    }
    for (const restaurant of this.restaurants) {
      const pin = new Group();
      pin.position.set(restaurant.mapPosition.x * 0.55, 0.08, restaurant.mapPosition.z * 0.55);
      const recommended = restaurant.id === 'dumpling-home';
      const material = new MeshStandardMaterial({ color: recommended ? 0xff5f1f : 0xf5efe6, emissive: recommended ? 0x8a2108 : 0x000000, emissiveIntensity: recommended ? 1.4 : 0 });
      const head = new Mesh(new SphereGeometry(0.055, 16, 12), material);
      const stem = new Mesh(new BoxGeometry(0.012, 0.1, 0.012), material);
      stem.position.y = -0.06;
      pin.add(head, stem);
      pin.userData.restaurantId = restaurant.id;
      pin.addEventListener('pointerenter', () => pin.scale.setScalar(1.25));
      pin.addEventListener('pointerleave', () => pin.scale.setScalar(1));
      pin.addEventListener('click', () => this.selectRestaurant(restaurant.id));
      group.add(pin);
    }
    entity.object3D?.add(group);
    this.mapGroup = group;
  }

  private renderRestaurantCards(): void {
    for (const restaurant of this.restaurants) {
      const card = this.panel?.getElementById(`restaurant-${restaurant.id}`);
      if (!card) continue;
      card.setProperties({ display: 'flex' });
      const button = this.panel?.getElementById(`restaurant-select-${restaurant.id}`);
      if (button) {
        const listener = () => this.selectRestaurant(restaurant.id);
        button.addEventListener('click', listener);
        this.cleanupFuncs.push(() => button.removeEventListener('click', listener));
      }
    }
  }

  private selectRestaurant(id: string): void {
    const restaurant = this.restaurants.find((item) => item.id === id);
    if (!restaurant) return;
    if (this.cart.lines.length && this.cartRestaurantId !== restaurant.id) { this.cart = { lines: [], total: 0 }; this.messages = []; }
    this.cartRestaurantId = restaurant.id;
    this.selectedRestaurant = restaurant;
    const status = this.panel?.getElementById('map-selection-status');
    status?.setProperties({ text: restaurant.hasMenu ? `${restaurant.name} selected. Opening demo menu.` : `${restaurant.name}: Menu coming soon.` });
    if (restaurant.hasMenu) { void this.loadMenuStage(); this.goTo('menu'); }
  }

  private bindCompareControls(): void {
    const bind = (id: string, handler: () => void) => {
      const element = this.panel?.getElementById(id);
      if (!element) return;
      element.addEventListener('click', handler);
      this.cleanupFuncs.push(() => element.removeEventListener('click', handler));
    };
    bind('compare-back', () => this.goTo('menu'));
    bind('compare-cancel', () => { this.replaceSide = null; this.renderCompare(); });
    bind('compare-left-replace', () => { this.replaceSide = 'left'; this.renderCompare(); });
    bind('compare-right-replace', () => { this.replaceSide = 'right'; this.renderCompare(); });
    bind('compare-left-details', () => { if (this.compareLeft) { this.selectedDish = this.compareLeft; this.prepareDish(this.compareLeft); this.goTo('dish'); } });
    bind('compare-right-details', () => { if (this.compareRight) { this.selectedDish = this.compareRight; this.prepareDish(this.compareRight); this.goTo('dish'); } });
    bind('compare-left-add', () => this.addDishToOrder(this.compareLeft));
    bind('compare-right-add', () => this.addDishToOrder(this.compareRight));
    for (const dish of this.menuDishes) bind(`compare-pick-${dish.id}`, () => this.selectCompareDish(dish));
  }

  private openCompare(): void {
    if (!this.selectedDish) return;
    this.compareLeft = this.compareLeft ?? this.selectedDish;
    this.compareRight = this.compareRight && this.compareRight.id !== this.compareLeft.id ? this.compareRight : null;
    this.replaceSide = null;
    this.renderCompare();
    this.goTo('compare');
  }

  private renderCompare(): void {
    const picker = this.panel?.getElementById('compare-picker');
    const candidates = this.menuDishes.filter((dish) => dish.id !== this.compareLeft?.id && dish.id !== this.compareRight?.id);
    picker?.setProperties({ display: 'flex' });
    for (const dish of this.menuDishes) {
      const button = this.panel?.getElementById(`compare-pick-${dish.id}`);
      button?.setProperties({ display: candidates.some((item) => item.id === dish.id) ? 'flex' : 'none', text: `${dish.name} - $${dish.price}` });
    }
    this.panel?.getElementById('compare-title')?.setProperties({ text: this.replaceSide ? `Choose a dish to compare with ${this.replaceSide === 'left' ? this.compareRight?.name ?? 'the other plate' : this.compareLeft?.name ?? 'the other plate'}` : this.compareRight ? 'Compare portions fairly.' : 'Choose a dish to compare.' });
    this.panel?.getElementById('compare-picker-note')?.setProperties({ text: this.replaceSide ? 'The existing pair stays safe until you choose a replacement. Cancel keeps the original pair.' : 'Select a second dish; the first dish is locked from this picker.' });
    this.panel?.getElementById('compare-cancel')?.setProperties({ display: this.replaceSide ? 'flex' : 'none' });
    const hasPair = this.compareLeft != null && this.compareRight != null;
    this.panel?.getElementById('compare-pair')?.setProperties({ display: hasPair ? 'flex' : 'none' });
    if (hasPair) { this.renderCompareColumn('left', this.compareLeft!); this.renderCompareColumn('right', this.compareRight!); this.buildComparePreview(); }
  }

  private buildComparePreview(): void {
    if (this.compareRoot || !this.compareLeft || !this.compareRight) return;
    const entity = this.world.createTransformEntity();
    const root = entity.object3D!;
    root.position.set(0, 1.08, -1.12);
    this.compareRoot = root;
    for (const [index, dish] of [this.compareLeft, this.compareRight].entries()) {
      const reference = new Mesh(new TorusGeometry(0.135, 0.002, 8, 48), new MeshBasicMaterial({ color: 0xd8a35d }));
      reference.position.set(index === 0 ? -0.2 : 0.2, 0.012, 0);
      root.add(reference);
      const target = new Group();
      target.position.set(index === 0 ? -0.2 : 0.2, 0, 0);
      root.add(target);
      void this.loadCompareModel(target, dish, index);
    }
    this.compareEntities.push(entity);
  }

  private async loadCompareModel(target: Object3D, dish: MenuDish, index: number): Promise<void> {
    try {
      if (!dish.modelUrl) throw new Error('No verified dish model');
      const gltf = await AssetManager.loadGLTF(`${import.meta.env.BASE_URL}${dish.modelUrl.replace(/^\//u, '')}`, `compare-${dish.id}`);
      if (this.compareRoot == null) return;
      const model = gltf.scene.clone(true);
      model.updateMatrixWorld(true);
      model.scale.setScalar(dish.modelScale ?? 1);
      target.add(model);
    } catch {
      const food = new Mesh(new SphereGeometry(0.075, 20, 14), new MeshStandardMaterial({ color: index === 0 ? 0xc86b4a : 0x4f8b8a, roughness: 0.8 }));
      target.add(food);
    }
  }

  private disposeComparePreview(): void {
    for (const entity of this.compareEntities) entity.dispose();
    this.compareEntities = [];
    this.compareRoot = null;
  }

  private renderCompareColumn(side: 'left' | 'right', dish: MenuDish): void {
    const fit = this.menuFit.get(dish.id);
    const allergens = dish.allergens?.join(', ') || 'not listed';
    this.panel?.getElementById(`compare-${side}-name`)?.setProperties({ text: dish.name });
    this.panel?.getElementById(`compare-${side}-price`)?.setProperties({ text: `$${dish.price}` });
    this.panel?.getElementById(`compare-${side}-description`)?.setProperties({ text: dish.description });
    this.panel?.getElementById(`compare-${side}-protein`)?.setProperties({ text: dish.proteinGrams ? `Estimated protein - ${dish.proteinGrams[0]}–${dish.proteinGrams[1]}g` : 'Estimated protein - not provided' });
    this.panel?.getElementById(`compare-${side}-allergens`)?.setProperties({ text: `Allergens - ${allergens}`, color: fit?.fit === 'avoid' ? '#ff5f1f' : '#a99f94' });
    this.panel?.getElementById(`compare-${side}-ingredients`)?.setProperties({ text: `Ingredients - ${(dish.ingredientTags ?? dish.tags).join(' - ') || 'not listed'}` });
  }

  private selectCompareDish(dish: MenuDish): void {
    if (this.replaceSide === 'left') this.compareLeft = dish;
    else if (this.replaceSide === 'right') this.compareRight = dish;
    else if (!this.compareLeft) this.compareLeft = dish;
    else if (!this.compareRight && dish.id !== this.compareLeft.id) this.compareRight = dish;
    this.replaceSide = null;
    this.renderCompare();
  }

  private addDishToOrder(dish: MenuDish | null): void {
    if (!dish) return;
    const match = (dish.allergens ?? []).some((allergen) => this.profile.allergies.includes(allergen));
    if (match) { this.panel?.getElementById('compare-picker-note')?.setProperties({ text: 'This dish may match your profile allergy. Confirm with the restaurant before ordering.' }); return; }
    this.selectedDish = dish;
    void this.sendToWaiter(`Add one ${dish.name}`);
    this.goTo('order');
  }

  private bindOrderControls(): void {
    const submit = this.panel?.getElementById('order-submit');
    if (submit) { const listener = () => void this.placeOrder(); submit.addEventListener('click', listener); this.cleanupFuncs.push(() => submit.removeEventListener('click', listener)); }
    for (let index = 0; index < 3; index += 1) {
      const button = this.panel?.getElementById(`take-home-add-${index}`);
      if (!button) continue;
      const listener = () => { const option = this.takeHomeOptions[index]; if (option) { if (!this.selectedTakeHomeOptionRefs.includes(option.optionRef)) this.selectedTakeHomeOptionRefs.push(option.optionRef); void this.sendToWaiter(`Add one ${option.title}`, option.optionRef); } };
      button.addEventListener('click', listener);
      this.cleanupFuncs.push(() => button.removeEventListener('click', listener));
    }
  }

  private async sendToWaiter(message: string, optionRef?: string): Promise<void> {
    if (this.waiterBusy) return;
    this.waiterBusy = true;
    this.stopVoice();
    this.setWaiterState('thinking');
    this.messages.push({ role: 'user', content: message });
    this.renderOrderState('Thinking…');
    try {
      const response = await fetch('/api/waiter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId: this.selectedRestaurant?.id ?? this.cartRestaurantId, message, messages: this.messages, cart: this.cart.lines.map((line) => ({ dishId: line.dishId, quantity: line.quantity })), profile: this.profile, dinerId: this.dinerId, ...(optionRef ? { optionRef } : {}), ...(optionRef && !this.selectedTakeHomeOptionRefs.includes(optionRef) ? { takeHomeOptionRefs: [...this.selectedTakeHomeOptionRefs, optionRef] } : { takeHomeOptionRefs: this.selectedTakeHomeOptionRefs }), ...(message === "I'm ready to order" ? { idempotencyKey: this.orderRequestId || (this.orderRequestId = crypto.randomUUID()) } : {}) }) });
      if (!response.ok) throw new Error('The waiter is unavailable right now.');
      const data = await response.json() as { reply?: string; cart?: { lines: Array<{ dishId: string; name: string; quantity: number; unitPriceCents: number }>; total: number }; takeHomeOptions?: Array<{ optionRef: string; title: string; sellerName: string; priceCents: number; frozen?: boolean; local?: boolean }>; checkouts?: Array<{ sellerName: string; continueUrl?: string; totals?: Array<{ type?: string; amount?: number; currency?: string }> }>; restaurantOrder?: { totalCents?: number; estimatedMinutes?: number; message?: string } };
      if (data.cart) this.cart = data.cart;
      this.takeHomeOptions = Array.isArray(data.takeHomeOptions) ? data.takeHomeOptions : [];
      this.checkouts = Array.isArray(data.checkouts) ? data.checkouts : [];
      if (data.reply) this.messages.push({ role: 'assistant', content: data.reply });
      if (data.restaurantOrder) this.orderPlaced = true;
      const reply = data.reply ?? 'I’m ready when you are.';
      this.renderOrderState(reply);
      this.speakReply(reply);
    } catch (error) { this.setWaiterState('error'); this.renderOrderState(error instanceof Error ? error.message : 'The waiter is unavailable right now.'); }
    finally { this.waiterBusy = false; if (this.waiterState === 'thinking') this.setWaiterState('ready'); }
  }

  private async placeOrder(): Promise<void> {
    if (this.waiterBusy || this.orderPlaced) return;
    this.orderRequestId = this.orderRequestId || crypto.randomUUID();
    await this.sendToWaiter("I'm ready to order");
  }

  private renderOrderState(reply: string): void {
    this.panel?.getElementById('order-message')?.setProperties({ text: reply });
    this.panel?.getElementById('order-cart')?.setProperties({ text: this.cart.lines.length ? `Cart - ${this.cart.lines.map((line) => `${line.quantity}× ${line.name}`).join(', ')}` : 'Cart is empty' });
    this.panel?.getElementById('order-total')?.setProperties({ text: `Total - $${(Number(this.cart.total ?? 0) / 100).toFixed(2)}` });
    this.panel?.getElementById('order-submit')?.setProperties({ display: this.orderPlaced ? 'none' : 'flex' });
    this.panel?.getElementById('order-confirmation')?.setProperties({ display: this.orderPlaced ? 'flex' : 'none', text: 'Demo order: Dumpling Home doesn’t take online orders here - ~15 min (estimated)' });
    const shelf = this.panel?.getElementById('take-home-shelf');
    shelf?.setProperties({ display: this.takeHomeOptions.length ? 'flex' : 'none' });
    for (let index = 0; index < 3; index += 1) {
      const option = this.takeHomeOptions[index];
      const label = option ? `${option.title} - ${option.sellerName} - $${(option.priceCents / 100).toFixed(2)}${option.frozen === true ? ' - ❄️ Frozen' : ''}${option.local === true ? ' - 📍 Local' : ''}` : '';
      this.panel?.getElementById(`take-home-option-${index}`)?.setProperties({ display: option ? 'flex' : 'none', text: label });
      this.panel?.getElementById(`take-home-add-${index}`)?.setProperties({ display: option ? 'flex' : 'none' });
    }
    const checkoutMessage = this.checkouts.map((checkout) => {
      const total = checkout.totals?.find((item) => item.type === 'total');
      return checkout.continueUrl && total?.amount != null ? `Scan to pay at ${checkout.sellerName} on Shopify - ${(total.amount / 100).toFixed(2)} ${total.currency ?? ''}` : `Shopify checkout unavailable at ${checkout.sellerName}`;
    }).join(' | ');
    this.panel?.getElementById('order-checkout')?.setProperties({ display: checkoutMessage ? 'flex' : 'none', text: checkoutMessage });
  }

  private bindDishControls(): void {
    const compare = this.panel?.getElementById('dish-compare');
    const lifeSize = this.panel?.getElementById('dish-life-size');
    const add = this.panel?.getElementById('dish-add');
    if (compare) { const listener = () => this.openCompare(); compare.addEventListener('click', listener); this.cleanupFuncs.push(() => compare.removeEventListener('click', listener)); }
    if (lifeSize) { const listener = () => { this.dishLifeSize = !this.dishLifeSize; this.setDishScale(); lifeSize.setProperties({ backgroundColor: this.dishLifeSize ? '#ff5f1f' : '#35312e' }); }; lifeSize.addEventListener('click', listener); this.cleanupFuncs.push(() => lifeSize.removeEventListener('click', listener)); }
    if (add) { const listener = () => this.addSelectedDish(); add.addEventListener('click', listener); this.cleanupFuncs.push(() => add.removeEventListener('click', listener)); }
  }

  private prepareDish(dish: MenuDish): void {
    this.panel?.getElementById('dish-title')?.setProperties({ text: dish.name });
    this.panel?.getElementById('dish-price')?.setProperties({ text: `$${dish.price}` });
    this.panel?.getElementById('dish-description')?.setProperties({ text: dish.description });
    this.panel?.getElementById('dish-ingredients')?.setProperties({ text: (dish.ingredientTags ?? dish.tags).join(' - ') || 'Ingredients listed by restaurant' });
    this.panel?.getElementById('dish-protein')?.setProperties({ text: dish.proteinGrams ? `Estimated protein - ${dish.proteinGrams[0]}–${dish.proteinGrams[1]}g` : 'Estimated protein - not provided' });
    const allergensUnknown = dish.allergenStatus === 'unknown' || dish.allergensVerified === false || !dish.allergens?.length;
    this.panel?.getElementById('dish-allergens')?.setProperties({ text: `Allergens - ${allergensUnknown ? 'unknown — confirm with restaurant staff' : dish.allergens!.join(', ')}` });
    this.panel?.getElementById('dish-portion')?.setProperties({ text: dish.portion ? `Estimated portion - ${dish.portion.pieces ?? 'unknown'} pieces - ${dish.portion.weightG == null ? 'weight unknown' : `~${dish.portion.weightG}g`}` : 'Estimated portion - not provided' });
    const match = (dish.allergens ?? []).some((allergen) => this.profile.allergies.includes(allergen));
    this.panel?.getElementById('dish-allergens')?.setProperties({ color: match ? '#ff5f1f' : '#a99f94' });
    this.panel?.getElementById('dish-warning')?.setProperties({ display: match ? 'flex' : 'none' });
    this.dishLifeSize = false;
    this.disposeDishPreview();
    this.buildDishPreview(dish);
  }

  private buildDishPreview(dish: MenuDish): void {
    const entity = this.world.createTransformEntity();
    const root = entity.object3D!;
    root.position.set(0, 1.22, -1.08);
    this.dishRoot = root;
    const reference = new Mesh(new TorusGeometry(0.135, 0.002, 8, 48), new MeshBasicMaterial({ color: 0xd8a35d }));
    reference.position.set(0.2, 0.012, 0);
    root.add(reference);
    const fork = new Group();
    const handle = new Mesh(new BoxGeometry(0.012, 0.19, 0.012), new MeshStandardMaterial({ color: 0xc9c0b5, metalness: 0.65, roughness: 0.28 }));
    handle.position.set(0.22, 0.02, 0);
    fork.add(handle);
    for (let index = -1; index <= 1; index += 1) { const tine = new Mesh(new BoxGeometry(0.006, 0.07, 0.006), handle.material); tine.position.set(0.22 + index * 0.014, 0.13, 0); fork.add(tine); }
    root.add(fork);
    const target = new Group();
    target.position.y = 0.035;
    root.add(target);
    this.dishModel = target;
    const load = async () => {
      try {
        if (!dish.modelUrl) throw new Error('No verified dish model');
        const gltf = await AssetManager.loadGLTF(`${import.meta.env.BASE_URL}${dish.modelUrl.replace(/^\//u, '')}`, `detail-${dish.id}`);
        if (this.dishModel !== target) return;
        const model = gltf.scene.clone(true);
        model.updateMatrixWorld(true);
        model.scale.setScalar(dish.modelScale ?? 1);
        target.add(model);
        this.dishModel = model;
        target.addEventListener('pointerdown', () => { this.dishDragging = true; });
        target.addEventListener('pointerup', () => { this.dishDragging = false; });
      } catch {
        const fallback = new Mesh(new SphereGeometry(0.075, 20, 14), new MeshStandardMaterial({ color: 0xc86b4a, roughness: 0.8 }));
        target.add(fallback);
      }
    };
    void load();
  }

  private setDishScale(): void {
    if (!this.dishRoot) return;
    this.dishRoot.position.set(0, this.dishLifeSize ? 0.82 : 1.22, this.dishLifeSize ? -0.92 : -1.08);
    this.dishRoot.scale.setScalar(1);
  }

  private disposeDishPreview(): void {
    const object = this.dishRoot;
    if (!object) return;
    object.parent?.remove(object);
    object.traverse((child) => { const mesh = child as Mesh; if (mesh.geometry) mesh.geometry.dispose(); const material = mesh.material as MeshStandardMaterial | undefined; material?.dispose?.(); });
    this.dishRoot = null;
    this.dishModel = null;
    this.dishDragging = false;
  }

  private addSelectedDish(): void {
    if (!this.selectedDish) return;
    const match = (this.selectedDish.allergens ?? []).some((allergen) => this.profile.allergies.includes(allergen));
    if (match) { this.panel?.getElementById('dish-warning')?.setProperties({ display: 'flex' }); return; }
    void this.sendToWaiter(`Add one ${this.selectedDish.name}`);
    this.goTo('order');
  }

  update(): void {
    if (this.active === 'dish' && this.dishRoot && !this.dishDragging) this.dishRoot.rotation.y += 0.004;
  }

  private bindProfileChips(): void {
    const groups: Array<[string, 'allergies' | 'diets', string]> = [
      ['profile-sesame', 'allergies', 'sesame'], ['profile-peanut', 'allergies', 'peanut'],
      ['profile-high-protein', 'diets', 'high-protein'], ['profile-vegetarian', 'diets', 'vegetarian'],
    ];
    for (const [id, field, value] of groups) {
      const element = this.panel?.getElementById(id);
      if (!element) continue;
      const listener = () => {
        const values = this.profile[field];
        this.profile[field] = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
        element.setProperties({ backgroundColor: this.profile[field].includes(value) ? '#ff5f1f' : '#35312e' });
      };
      element.addEventListener('click', listener);
      this.cleanupFuncs.push(() => element.removeEventListener('click', listener));
    }
  }

  private async loadSavedProfile(): Promise<void> {
    try {
      const response = await fetch('/api/diner', { cache: 'no-store' });
      if (!response.ok) return;
      const saved = await response.json() as { id?: string; allergies?: string[]; diets?: string[]; spice?: number; budget?: number; persistence?: 'neon' | 'demo' };
      this.dinerId = saved.id;
      if (Array.isArray(saved.allergies) || Array.isArray(saved.diets)) this.profile = { allergies: saved.allergies ?? [], diets: saved.diets ?? [], spice: saved.spice ?? 1, budget: saved.budget ?? 2 };
      if (this.dinerId) await this.loadRecommendations();
      this.renderProfileStatus(saved.persistence === 'demo' ? 'Optional demo profile - edit preferences anytime.' : 'Saved anonymous preferences loaded.');
      this.renderMenuCards();
    } catch { this.renderProfileStatus('Profile unavailable - map remains open with unknown-profile caveats.'); }
  }

  private bindProfileReturn(): void {
    const edit = this.panel?.getElementById('map-edit-profile');
    if (edit) { const listener = () => this.goTo('profile'); edit.addEventListener('click', listener); this.cleanupFuncs.push(() => edit.removeEventListener('click', listener)); }
  }

  private renderProfileStatus(text: string): void {
    this.panel?.getElementById('map-selection-status')?.setProperties({ text });
  }

  private saveProfile(): void {
    void fetch('/api/diner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dinerId: this.dinerId, profile: this.profile }) })
      .then((response) => response.ok ? response.json() : null).then((data) => { if (data?.id) this.dinerId = data.id; }).catch(() => undefined);
    void this.loadRecommendations().then(() => this.renderMenuCards());
  }

  private goTo(stage: Stage): void {
    if (this.transitioning || stage === this.active || this.panel == null) return;
    this.transitioning = true;
    this.root?.setProperties({ opacity: 0 });
    window.setTimeout(() => {
      if (this.active === 'menu' && stage !== 'menu') this.disposeMenuDiorama();
      if (this.active === 'dish' && stage !== 'dish') this.disposeDishPreview();
      if (this.active === 'compare' && stage !== 'compare') this.disposeComparePreview();
      this.showStage(stage);
      if (stage === 'menu') this.buildMenuDiorama();
      this.root?.setProperties({ opacity: 1 });
      this.active = stage;
      this.transitioning = false;
    }, 180);
  }

  private showStage(stage: Stage): void {
    if (stage === 'menu') this.renderMenuCards();
    if (stage === 'order') this.renderOrderState(this.messages.length ? this.messages[this.messages.length - 1].content : 'Tell me what you would like to order.');
    for (const candidate of stages) {
      this.panel?.getElementById(`stage-${candidate}`)?.setProperties({ display: candidate === stage ? 'flex' : 'none' });
    }
  }
}
