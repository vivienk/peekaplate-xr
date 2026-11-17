import fs from 'node:fs/promises';
import ts from 'typescript';
import {chromium} from 'playwright';
await fs.mkdir('artifacts',{recursive:true});
const source=await fs.readFile('src/glimmer/storefront.ts','utf8');
const js=ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}).replaceAll('export ','');
const styles=['ramen','cafe','thai','pearl','ember','tide','kaigan'];
const names=['Ramen / noodles','Café / bakery','Thai / wok','Tea / dim sum','Grill / hearth','Seafood','Sushi / Japanese'];
const specs=[[112,128,8,-38,0,-96],[128,144,24,-48,0,-112],[112,112,-2,-38,26,-80],[112,128,4,-38,0,-96],[112,112,8,-40,0,-80],[128,112,-8,-20,0,-60],[112,112,2,-24,0,-64]];
const assets={};
for(const style of styles)for(const part of ['back','front','sign','chef']){
 const path=part==='chef'?`public/glimmer/assets/characters/chef-${style}.png`:`public/glimmer/assets/world/buildings/${style}-${part}.png`;
 assets[`${style}-${part}`]='data:image/png;base64,'+(await fs.readFile(path)).toString('base64');
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1848,height:890},deviceScaleFactor:1});
 await page.setContent('<body style="margin:0;background:#111625"><canvas width="1848" height="890"></canvas></body>');
 await page.addScriptTag({content:js});
 await page.evaluate(async({styles,names,specs,assets})=>{
 const c=document.querySelector('canvas').getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#111625';c.fillRect(0,0,1848,890);
 const label=(s,x,y,size=18,color='#f4e8c8')=>{c.fillStyle=color;c.font=`${size}px monospace`;c.fillText(s,x,y);};
 label('STOREFRONT STYLE COMPARISON',24,34,24);
 label('Top: generated cuisine variants   |   Bottom: original supplied restaurant sprites',24,65,17,'#a9b7cd');
 const images={};await Promise.all(Object.entries(assets).map(async([key,src])=>{const im=new Image();im.src=src;await im.decode();images[key]=im;}));
 for(let i=0;i<7;i++){
  const left=16+i*262,style=styles[i],[w,h,cx,cy,sx,sy]=specs[i];
  label(names[i],left+6,105,16);
  c.fillStyle='#1c2539';c.fillRect(left,120,252,320);c.fillRect(left,510,252,320);
  c.save();c.translate(left+126,424);c.scale(2,2);
  drawStorefront(c,style==='ember'?'diner-demo:ember-stone':`comparison:${style}`,style==='ember'?'Ember & Stone':`${style.toUpperCase()} KITCHEN`,0,0,w,h,1.25,style,images[`${style}-back`],images[`${style}-front`],images[`${style}-sign`],images[`${style}-chef`]);
  c.restore();
  label('GENERATED',left+6,467,15,'#77e2d2');
  c.save();c.translate(left+126,814);c.scale(2,2);
  for(const part of ['back','chef','front','sign']){
   const im=images[`${style}-${part}`];
   if(part==='chef')c.drawImage(im,0,0,24,24,cx-12,cy-24,24,24);
   else if(part==='sign')c.drawImage(im,0,0,48,32,sx-24,sy-32,48,32);
   else c.drawImage(im,-im.width/2,-im.height);
  }c.restore();label('ORIGINAL',left+6,853,15,'#edba7c');
 }
 label('2× nearest-neighbor scale • static frame • local neon glow included; world rain/reflections omitted',24,880,14,'#9aa7bb');
 },{styles,names,specs,assets});
 await page.screenshot({path:'artifacts/storefront-cuisine-comparison-v6.png'});
 const checks=await page.evaluate(()=>{
  const plans=Array.from({length:64},(_,i)=>storefrontPlan(`venue-${i}`,'ramen',112,128));
  return {structuralVariants:new Set(plans.map(p=>JSON.stringify([p.side,p.bay,p.center,p.windowY,p.doorX,p.doorRise,p.variant]))).size,expected:64};
 });
 if(checks.structuralVariants!==64)throw new Error('Duplicate structural layouts in the review sample');
 await fs.writeFile('artifacts/storefront-review.json',JSON.stringify({...checks,humanVisualReviewRequired:true,comparison:'storefront-cuisine-comparison-v6.png'},null,2));
 console.log('Rendered artifacts/storefront-cuisine-comparison-v6.png; 64 structural variants verified. Inspect the image before publishing.');
}finally{await browser.close();}
