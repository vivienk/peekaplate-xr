/** Tiny code-drawn sprites, cached at native 16px resolution. Labels carry the menu's exact meaning. */
const cache=new Map<string,HTMLCanvasElement>();
export function foodIcon(ctx:CanvasRenderingContext2D,label:string,x:number,y:number,size=32){
 const name=label.toLowerCase();let canvas=cache.get(name);
 if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=16;const c=canvas.getContext('2d')!;
  const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const leaf=()=>{r(3,5,9,6,'#39794b');r(5,3,8,6,'#6bb855');r(5,10,2,4,'#dfb95f');r(7,5,2,5,'#aad76c');};
  if(/egg/.test(name)){r(4,2,7,2,'#fff6d8');r(2,4,11,8,'#fff6d8');r(4,12,7,2,'#e4d4ad');r(6,6,5,5,'#ffb52e');r(7,6,2,2,'#ffe36d');}
  else if(/avocado/.test(name)){r(5,1,6,3,'#487744');r(3,4,10,10,'#487744');r(5,4,6,9,'#b7d776');r(6,8,5,5,'#9a5639');r(7,9,2,2,'#d18c4e');}
  else if(/fish|salmon|tuna|nori/.test(name)){r(3,5,9,6,'#5cbaaf');r(5,4,6,8,'#80d2be');r(12,6,3,5,'#5487aa');r(3,6,1,1,'#241e33');r(5,8,5,2,'#f68b67');}
  else if(/shrimp|prawn|shellfish|crab|lobster|clam|seafood/.test(name)){r(4,3,8,3,'#ef9871');r(2,6,5,5,'#df6b57');r(5,10,7,3,'#ef9871');r(11,8,3,4,'#f5b985');r(7,4,1,2,'#6e3444');r(4,7,5,1,'#ffc695');}
  else if(/milk|cream|yogurt|cheese|butter/.test(name)){r(5,1,5,3,'#9ed5dd');r(3,4,9,10,'#fff3d5');r(4,5,3,7,'#d9f4ee');r(3,7,9,3,'#5fa4b1');}
  else if(/wheat|bread|toast|muffin|flour|gluten/.test(name)){r(3,3,9,10,'#ba773d');r(2,4,11,4,'#c88e4b');r(4,4,7,8,'#f0c977');r(5,5,2,2,'#ffe3a0');r(9,9,1,2,'#b9803e');}
  else if(/peanut|nuts|almond|walnut|cashew/.test(name)){r(5,2,6,6,'#b37b49');r(4,8,7,6,'#d19d62');r(6,3,2,4,'#e6b878');r(6,9,1,3,'#8b5837');}
  else if(/sesame|seed|quinoa|rice/.test(name)){r(2,9,12,3,'#507b9a');r(4,12,8,2,'#314f71');for(const [a,b]of [[4,5],[8,4],[11,6],[6,7],[9,8]]){r(a,b,2,2,'#f5d68f');r(a,b,1,1,'#fff0c0');}}
  else if(/soy|bean|edamame|pea|lentil/.test(name)){r(2,6,12,5,'#4c8d51');r(4,4,9,4,'#77b75f');for(let i=0;i<3;i++)r(4+i*3,6,2,3,'#c5df85');}
  else if(/beef|pork|ham|chicken|duck|meat|sausage|bacon/.test(name)){r(3,4,9,8,'#aa4e4f');r(2,6,12,5,'#d06f63');r(4,5,6,2,'#f1ab8a');r(6,9,5,1,'#773746');r(11,4,3,3,'#f5dab4');}
  else if(/chili|pepper|paprika/.test(name)){r(9,1,3,3,'#51945d');r(7,4,5,6,'#e75743');r(5,9,5,3,'#c74039');r(3,11,4,2,'#e75743');r(9,5,1,3,'#ffb45b');}
  else if(/tomato|berry|berries|strawberry|cherry/.test(name)){r(4,4,8,9,'#df5149');r(2,6,12,5,'#df5149');r(6,2,5,3,'#588852');r(4,6,2,3,'#ff9277');}
  else if(/noodle|pasta|spaghetti/.test(name)){r(2,8,12,5,'#cf5d49');r(4,13,8,1,'#8a4041');for(let i=0;i<4;i++){r(3+i*3,4,1,5,'#ffe09a');r(3+i*3,4,2,1,'#ffe09a');}r(2,1,11,1,'#a27449');}
  else if(/broth|soup|sauce|oil|dressing|honey|vinegar|miso/.test(name)){r(3,7,10,5,'#b96842');r(2,6,12,3,'#e9b663');r(4,7,8,1,'#ffd18b');r(5,12,6,2,'#d79b54');r(5,2,1,3,'#9ca2ae');r(9,1,1,4,'#d4cad2');}
  else if(/carrot|pumpkin|squash|sweet potato/.test(name)){r(6,1,2,4,'#74a652');r(9,2,2,3,'#4c7944');r(5,5,7,3,'#f3aa4f');r(6,8,5,3,'#e37d35');r(7,11,2,3,'#e37d35');}
  else if(/onion|garlic|shallot/.test(name)){r(7,1,2,4,'#699350');r(4,5,8,8,'#d3a7ba');r(3,7,10,4,'#e7c6ce');r(6,5,2,8,'#f8e6d4');}
  else if(/potato|mushroom/.test(name)){r(4,3,8,5,'#a98764');r(2,5,12,4,'#c3a07c');r(6,9,4,5,'#efcfa4');r(4,5,2,2,'#edd4af');}
  else if(/lime|lemon|orange|citrus|pineapple/.test(name)){r(3,3,10,10,'#e8ba3f');r(5,2,6,12,'#f6d969');r(2,5,12,6,'#f6d969');r(7,4,1,8,'#fff0aa');r(4,7,8,1,'#fff0aa');}
  else if(/green|leaf|herb|basil|mint|cilantro|coriander|spinach|lettuce|cabbage|bok|scallion|chive|cucumber|broccoli|celery|parsley|vegan|vegetarian/.test(name)){leaf();}
  else if(/sugar|salt|tofu/.test(name)){r(3,4,9,9,'#d6cabc');r(3,3,8,8,'#fff0d8');r(5,5,2,1,'#e8d5b5');r(8,8,1,2,'#e8d5b5');}
  else if(/tea|coffee|water|coconut|juice/.test(name)){r(3,4,8,9,'#f2d3a4');r(11,6,3,5,'#c88b64');r(3,4,8,2,'#966345');r(6,1,1,2,'#c5c0bb');}
  else {r(3,3,10,11,'#b89363');r(4,4,8,9,'#edcf98');r(6,6,4,1,'#705645');r(6,8,4,1,'#705645');r(6,10,3,1,'#705645');}
  cache.set(name,canvas);
 }
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,x,y,size,size);ctx.restore();
}
