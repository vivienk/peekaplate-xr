import restaurantFixture from './fixtures/restaurants.json';
import rainFixture from './fixtures/market-map.json';
import stepsFixture from './fixtures/district-lantern-steps.json';
import pierFixture from './fixtures/district-fogline-pier.json';

export type DistrictId = 'd1-rain-alley' | 'd2-lantern-steps' | 'd3-fogline-pier';
export interface MapObject { id: string; kind: string; asset: string; pivot: number[]; sprite?: string; sprite_file?: string; [key: string]: unknown }
export interface Exit { id: string; rect_tiles: number[]; to: string; arrive_at: number[]; facing: string }
export interface District { district: DistrictId; name: string; width_tiles: number; height_tiles: number; tile_size_px: number; rows: string[]; player_spawn: number[]; player_entry_walk_to?: number[]; objects: MapObject[]; exits: Exit[]; walker_paths: unknown; [key: string]: unknown }
const venueNames:Record<string,string>={'r1-ramen':'Noka Ramen','r2-cafe':'Sons and Garden','r3-thai':'Farm House Thai'};
export const restaurants = restaurantFixture.map(r=>({...r,name:venueNames[r.id]??r.name}));
export type Restaurant = typeof restaurants[number];
export const dishes = restaurants.flatMap(restaurant => restaurant.dishes.map(dish => ({ ...dish, restaurantId: restaurant.id })) ).map((dish, index) => ({ ...dish, index }));
export type Dish = typeof dishes[number];
export const districts = [rainFixture, stepsFixture, pierFixture] as unknown as District[];
export interface Find { coupon?: boolean; id: string; district: DistrictId; label: string; lines: string[]; pivot: number[]; kind: string }
export const finds: Find[] = [
  {
    "id": "cat-1",
    "district": "d1-rain-alley",
    "label": "Black cat",
    "lines": [
      "Mrrrp. The cat leans into your hand and purrs."
    ],
    "pivot": [
      14.5,
      11.0
    ],
    "kind": "find-cat"
  },
  {
    "id": "cat-2",
    "district": "d1-rain-alley",
    "label": "Black cat",
    "lines": [
      "Mrrrp. The cat leans into your hand and purrs."
    ],
    "pivot": [
      20.5,
      4.0
    ],
    "kind": "find-cat"
  },
  {
    "id": "cat-3",
    "district": "d1-rain-alley",
    "label": "Black cat",
    "lines": [
      "Mrrrp. The cat leans into your hand and purrs."
    ],
    "pivot": [
      4.6,
      16.2
    ],
    "kind": "find-cat"
  },
  {
    "id": "charm-koi",
    "district": "d1-rain-alley",
    "label": "Koi charm",
    "lines": [
      "Koi charm"
    ],
    "pivot": [
      25.0,
      12.5
    ],
    "kind": "find-puddle"
  },
  {
    "id": "charm-moon",
    "district": "d1-rain-alley",
    "label": "Crescent moon charm",
    "lines": [
      "Crescent moon charm"
    ],
    "pivot": [
      13.5,
      25.5
    ],
    "kind": "find-puddle"
  },
  {
    "id": "charm-star",
    "district": "d1-rain-alley",
    "label": "Star lantern charm",
    "lines": [
      "Star lantern charm"
    ],
    "pivot": [
      20.5,
      7.0
    ],
    "kind": "find-puddle"
  },
  {
    "id": "npc-suzu",
    "district": "d1-rain-alley",
    "label": "Chat with Grandma Suzu",
    "lines": [
      "Rain like this brings out the best smells. Try the ramen counter on the corner, dear.",
      "I've walked this lane for fifty years. The cats know me better than the shopkeepers.",
      "Save a dish or two for later. Your passport will thank you."
    ],
    "pivot": [
      37.0,
      11.3
    ],
    "kind": "find-person"
  },
  {
    "id": "npc-kenta",
    "district": "d1-rain-alley",
    "label": "Chat with Kenta",
    "lines": [
      "Umbrellas! Umbrellas! …Oh, you've got a raincoat. Never mind.",
      "The puddles here show more than your face. Look closer."
    ],
    "pivot": [
      25.5,
      26.0
    ],
    "kind": "find-person"
  },
  {
    "id": "npc-rin",
    "district": "d1-rain-alley",
    "label": "Chat with Rin",
    "lines": [
      "This song is about soup. Every song is about soup, really.",
      "If you find all three stamps, the lanterns go up. Worth seeing."
    ],
    "pivot": [
      23.5,
      18.0
    ],
    "kind": "find-person"
  },
  {
    "id": "ad-1",
    "district": "d1-rain-alley",
    "label": "Holo ad scanned",
    "lines": [
      "ZAPPU COLA! Now with 40% more lightning. Do not drink during storms."
    ],
    "pivot": [
      20.0,
      16.0
    ],
    "kind": "find-holo"
  },
  {
    "id": "ad-2",
    "district": "d1-rain-alley",
    "label": "Holo ad scanned",
    "lines": [
      "HYPER NOODLE 9000: Slurp the future. Results may vary."
    ],
    "pivot": [
      22.0,
      5.0
    ],
    "kind": "find-holo"
  },
  {
    "id": "ad-3",
    "district": "d1-rain-alley",
    "label": "Holo ad scanned",
    "lines": [
      "NEKO-NET: Fast internet for cats. Humans, please wait."
    ],
    "pivot": [
      39.5,
      23.0
    ],
    "kind": "find-holo"
  },
  {
    "id": "cat-4",
    "district": "d2-lantern-steps",
    "label": "Calico cat",
    "lines": [
      "Mrrp? The calico blinks slowly, then headbutts your knee."
    ],
    "pivot": [
      3.8,
      10.4
    ],
    "kind": "find-cat"
  },
  {
    "id": "cat-5",
    "district": "d2-lantern-steps",
    "label": "Black cat",
    "lines": [
      "The cat stretches one white paw toward the warm stall lights."
    ],
    "pivot": [
      9.5,
      26.5
    ],
    "kind": "find-cat"
  },
  {
    "id": "charm-jade",
    "district": "d2-lantern-steps",
    "label": "Jade coin charm",
    "lines": [
      "Jade coin charm"
    ],
    "pivot": [
      5.0,
      16.5
    ],
    "kind": "find-puddle"
  },
  {
    "id": "charm-blossom",
    "district": "d2-lantern-steps",
    "label": "Peach blossom charm",
    "lines": [
      "Peach blossom charm"
    ],
    "pivot": [
      23.5,
      6.5
    ],
    "kind": "find-puddle"
  },
  {
    "id": "npc-mei",
    "district": "d2-lantern-steps",
    "label": "Chat with Auntie Mei",
    "lines": [
      "Auntie Mei: Sit, sit. Tea tastes better when it rains.",
      "Auntie Mei: The pepper buns sell out by midnight. Don't tell anyone I said so."
    ],
    "pivot": [
      20.0,
      10.3
    ],
    "kind": "find-person"
  },
  {
    "id": "npc-jun",
    "district": "d2-lantern-steps",
    "label": "Chat with Jun",
    "lines": [
      "Jun: I paint a new lantern every night. This one's for you, maybe.",
      "Jun: Red for luck, gold for good food. Easy rule."
    ],
    "pivot": [
      24.5,
      4.4
    ],
    "kind": "find-person"
  },
  {
    "id": "ad-4",
    "district": "d2-lantern-steps",
    "label": "Holo ad scanned",
    "lines": [
      "BOBA-BOT 3000: Now with 40% more pearls! Bounce responsibly."
    ],
    "pivot": [
      33.3,
      17.0
    ],
    "kind": "find-holo"
  },
  {
    "id": "wish-board",
    "district": "d2-lantern-steps",
    "label": "Wish hung on the lantern board",
    "lines": [
      "You hang a little red tag: 'More noodles for everyone.'"
    ],
    "pivot": [
      35.0,
      10.0
    ],
    "kind": "find-wish"
  },
  {
    "id": "cat-6",
    "district": "d3-fogline-pier",
    "label": "Ginger cat",
    "lines": [
      "The ginger cat purrs like a tiny boat motor."
    ],
    "pivot": [
      35.0,
      3.0
    ],
    "kind": "find-cat"
  },
  {
    "id": "cat-7",
    "district": "d3-fogline-pier",
    "label": "Smoky cat",
    "lines": [
      "The smoky cat watches the fog roll in, then you. Mostly the fog."
    ],
    "pivot": [
      1.6,
      25.0
    ],
    "kind": "find-cat"
  },
  {
    "id": "charm-shell",
    "district": "d3-fogline-pier",
    "label": "Seashell charm",
    "lines": [
      "Seashell charm"
    ],
    "pivot": [
      14.0,
      24.0
    ],
    "kind": "find-puddle"
  },
  {
    "id": "charm-anchor",
    "district": "d3-fogline-pier",
    "label": "Anchor charm",
    "lines": [
      "Anchor charm"
    ],
    "pivot": [
      36.5,
      21.5
    ],
    "kind": "find-puddle"
  },
  {
    "id": "npc-ola",
    "district": "d3-fogline-pier",
    "label": "Chat with Captain Ola",
    "lines": [
      "Captain Ola: Forty years on this bay and the fog still surprises me.",
      "Captain Ola: Fish aren't biting. The chowder truck is, though."
    ],
    "pivot": [
      6.5,
      23.4
    ],
    "kind": "find-person"
  },
  {
    "id": "npc-pip",
    "district": "d3-fogline-pier",
    "label": "Chat with Pip",
    "lines": [
      "Pip: I'm chalking a giant sushi on the planks. The rain keeps editing it.",
      "Pip: Art tip: if it washes away, you get to draw it again!"
    ],
    "pivot": [
      32.5,
      21.0
    ],
    "kind": "find-person"
  },
  {
    "id": "ad-5",
    "district": "d3-fogline-pier",
    "label": "Holo ad scanned",
    "lines": [
      "FOGWAVE RADIO: All fog, all night, all smooth. Tune in, drift off."
    ],
    "pivot": [
      33.5,
      5.0
    ],
    "kind": "find-holo"
  },
  {
    "id": "bottle",
    "district": "d3-fogline-pier",
    "label": "Note from the bottle read",
    "lines": [
      "A note: 'To whoever finds this: try everything once, and dessert twice.'"
    ],
    "pivot": [
      24.5,
      26.0
    ],
    "kind": "find-bottle"
  }
];
export const colours = ['Yellow', 'Cherry', 'Teal', 'Lavender', 'Mint', 'Coral', 'Midnight', 'Peach'] as const;
export const headwear = ['Hood', 'Bucket hat', 'Cat beanie', "Sou'wester"] as const;
export const colourThresholds = [0, 0, 0, 0, 4, 12, 20, 24] as const;
export const headwearThresholds = [0, 0, 8, 16] as const;
export const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}glimmer/${path}`;

// PeekaPlate market offers retain original discovery IDs and save-code ordering.
const specialVendors = [[0],[1],[2],[3,4],[5,6]];
finds.filter(f=>f.kind==='find-holo').forEach((f,i)=>{
  f.label='Vendor special';
  f.lines=specialVendors[i].map(index=>{const r=restaurants[index];return `${r.name} · Tonight’s special: ${r.dishes[0].name}. Visit the counter to explore the menu!`;});
});
const couponVendors=[0,1,2,3,4,5];
finds.filter(f=>f.kind==='find-puddle').forEach((f,i)=>{
  if(i>=couponVendors.length)return;
  const r=restaurants[couponVendors[i]];
  f.coupon=true;f.label=`${r.name} coupon`;
  f.lines=[`${r.name}: a rain-night coupon for ${r.dishes[0].name}!`, 'Demo collectible — not redeemable for a real purchase. Keep it in your Passport and visit the restaurant to view the dish.'];
});
