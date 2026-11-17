/** Authored game-only categories and demo prices; never overrides a published menu. */
export const sampleDishDetails:Record<string,{category:string;price:number}>={
 'r1-1':{category:'Noodles',price:16},'r1-2':{category:'Noodles',price:17},'r1-3':{category:'Noodles',price:18},'r1-4':{category:'Sides',price:8},
 'r2-1':{category:'Breakfast',price:18},'r2-2':{category:'Breakfast',price:14},'r2-3':{category:'Breakfast',price:17},'r2-4':{category:'Drinks',price:6},'r2-5':{category:'Desserts',price:10},
 'r3-1':{category:'Noodles',price:17},'r3-2':{category:'Rice & Curry',price:18},'r3-3':{category:'Soups',price:14},'r3-4':{category:'Rice & Curry',price:17},'r3-5':{category:'Desserts',price:9},'r3-6':{category:'Drinks',price:5},
 'r4-1':{category:'Sides',price:8},'r4-2':{category:'Drinks',price:6},'r4-3':{category:'Sides',price:7},'r4-4':{category:'Sides',price:10},
 'r5-1':{category:'Grill',price:13},'r5-2':{category:'Grill',price:7},'r5-3':{category:'Sides',price:11},'r5-4':{category:'Desserts',price:9},
 'r6-1':{category:'Soups',price:16},'r6-2':{category:'Seafood',price:19},'r6-3':{category:'Seafood',price:22},'r6-4':{category:'Sides',price:7},
 'r7-1':{category:'Sushi',price:24},'r7-2':{category:'Sushi',price:18},'r7-3':{category:'Sushi',price:8},'r7-4':{category:'Soups',price:5},'r7-5':{category:'Desserts',price:7},
};
export const demoPrice=(id:string)=>`USD ${sampleDishDetails[id].price.toFixed(2)} · Demo`;
