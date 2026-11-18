/** Extend PR165's native 36px SVG illustration set. No food facts are inferred. */
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const source=JSON.parse(readFileSync(resolve(root,'scripts/ingredient-artwork-source.json'),'utf8'));
const p=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,color='#000000',width=1.1,opacity=.25)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
const e=(x,y,rx,ry,fill,angle=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${angle} ${x} ${y})"/>`;
const circle=(x,y,r,fill)=>e(x,y,r,r,fill);
const cube=(color,light)=>p('M9 13.5 18 9 27 13.5V23.4L18 27.9 9 23.4Z',color)+p('M9 13.5 18 9 27 13.5 18 18Z',light)+line('M9 13.5 18 18 27 13.5M18 18V27.9');
const drop=(color,light,thick=false)=>p(thick?'M18 8C21 14 28 18 28 24C28 31 8 31 8 24C8 18 15 14 18 8Z':'M18 6.3C23.4 14.4 27 18.9 27 23.4C27 35.4 9 35.4 9 23.4C9 18.9 12.6 14.4 18 6.3Z',color)+p('M18 11C14 17 12 20 12 24C12 27 14 28 16 28C13 23 16 17 18 11Z',light);
const bowl=(color,light)=>p('M6 16H30L27 25Q18 33 9 25Z','#D3C2AC')+p('M18 17H30L27 25Q23 29 18 29Z','#B7A58F')+e(18,16,12,5,light)+e(18,16,10,3.5,color);
const steam=line('M14 10Q11 7 14 4M22 10Q19 7 22 4','#AAB2B2',1.3,.8);
const pile=(color,light)=>p('M6 26 10 21 14 20 18 12 22 17 26 20 30 26Z',color)+p('M6 26 14 20 18 12 19 22 15 26Z',light)+line('M8 27H28');
const grains=(color,round=false)=>[[10,14,-30],[18,10,25],[26,15,-20],[16,18,35],[24,23,10],[10,25,60],[18,28,-20]].map(([x,y,a])=>e(x,y,round?2:3,round?2:1.5,color,a)).join('');
const noodles=(color,flat=false)=>[0,4,8,12].map(i=>line(`M${9+i} 10C${3+i} 17 ${15+i} 18 ${9+i} 25`,color,flat?3:1.8,1)).join('')+line('M8 27Q18 31 28 25','#B79C68',1,.5);
const leaf=(x,y,angle,color='#61984C',long=false)=>`<g transform="translate(${x} ${y}) rotate(${angle})">`+p(long?'M0 0C-6-4-4-13 0-17C4-12 5-5 0 0Z':'M0 0C-9-3-7-12 0-14C7-11 9-4 0 0Z',color)+line('M0 0V-11')+'</g>';
const herb=(color='#61984C',kind='basil')=>line('M16 30 20 10','#7B8E45',1.8,1)+leaf(17,25,-48,color,kind==='thai')+leaf(19,20,50,color,kind==='thai')+leaf(20,15,-15,color,kind==='thai')+(kind==='holy'?circle(21,7,1.3,'#A99A7B')+circle(23,10,1.3,'#A99A7B'):'');
const citrus=(rind,flesh)=>e(18,19,11,10,rind)+e(18,19,8.5,7.5,'#FBF1C8')+e(18,19,7,6,flesh)+line('M18 13V25M12 16 24 22M12 22 24 16','#FFF2D1',1.2,.9);
const bread=(dark=false,bun=false)=>p(bun?'M6 23C5 8 30 7 30 23V27H6Z':'M8 27V16C3 8 10 6 18 7C28 6 33 10 28 16V27Z',dark?'#AC7749':'#C58C54')+p(bun?'M8 22C8 10 28 10 28 22Z':'M11 25V15C7 10 13 10 18 10C25 9 29 11 25 15V25Z','#E8D6AE')+(bun?line('M13 15 12 20M20 14 19 20M26 16 25 20','#B58A50',1.5,.8):circle(15,17,1.2,'#C4AA7C')+circle(22,21,1.4,'#C4AA7C')+circle(15,23,.9,'#C4AA7C'));
const fillet=(color,light,grilled=false)=>p('M8 12Q16 5 28 12L26 25Q18 31 7 24Z',color)+p('M8 12Q16 5 28 12L24 17 10 19Z',light)+(grilled?line('M11 15 18 11M12 21 23 15M18 25 26 20','#684B39',2,.7):line('M10 15 24 20M10 20 23 25','#FBEBDA',1.5,.8));
const nuts=(color,light,walnut=false)=>[[12,17,-24],[23,22,25]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a})">`+e(0,0,walnut?6:4.5,7,color)+p('M0-6Q-5-3-2 0Q-5 4 0 6Z',light)+line(walnut?'M0-5 2-3 0 0 2 3 0 5M-3-3-1-1M-3 3-1 1':'M0-5V5')+'</g>').join('');
const cabbage=(color,light)=>circle(18,19,11,color)+p('M18 30C5 24 8 13 18 8C28 14 31 25 18 30Z',light)+line('M18 29V10M18 23 11 17M18 19 24 14M18 26 25 21');
const powder=(color,light)=>pile(color,light)+circle(10,28,1,color)+circle(27,28,.8,color)+circle(24,18,.7,light);
const definitions={
 'house sauce':drop('#B09873','#D2B78D',true),
 'wheat noodles':noodles('#D9BD7E'),
 'soy broth':bowl('#926348','#C89B6D'),
 'pork':fillet('#C98278','#E8AAA0'),
 'egg':e(18,19,9,12,'#DDD0B8')+p('M18 7C10 7 6 24 15 30C9 23 14 10 18 7Z','#F2EBDD'),
 'scallion':line('M11 28 23 7M15 29 27 10','#5F964B',3.3,1)+line('M11 28 15 21M15 29 19 23','#EBE6CC',3.4,1)+line('M10 30 8 32M13 31 13 33','#BEB59C',.8,.7),
 'miso broth':bowl('#B99062','#D9BC85'),
 'corn':e(18,18,6.5,11,'#E4BC54')+[12,17,22].map(y=>line(`M13 ${y}H23`,'#BD8E32',1,.6)).join('')+line('M18 8V27','#BD8E32',1,.6)+p('M11 17Q8 26 18 31Q13 24 11 17Z','#729A52')+p('M25 16Q28 26 18 31Q24 24 25 16Z','#8BB25B'),
 'butter':cube('#DABD67','#F0DE98'),
 'bean sprouts':[[10,27,14,11],[18,29,21,8],[26,26,27,14]].map(([x,y,a,b])=>line(`M${x} ${y}Q${x-5} ${y-8} ${a} ${b}`,'#E4DCC5',2,1)+e(a,b,2.5,1.5,'#CDB56B',-25)).join(''),
 'sesame paste':drop('#BBA17A','#D9C39D',true),
 'chili oil':drop('#B85B33','#DE9754'),
 'minced pork':[[10,16],[18,12],[25,18],[15,23],[23,27],[8,26]].map(([x,y])=>p(`M${x-3} ${y-2}l4-2 3 4-4 3-3-2Z`,'#C58C82')+line(`M${x-2} ${y}l3 1`,'#E8B5A6',1.2,1)).join(''),
 'bok choy':leaf(14,20,-30,'#4D8551')+leaf(22,20,30,'#659B54')+p('M13 16Q17 20 15 29Q19 31 23 29Q19 21 23 16L19 20Z','#D9E1BC')+line('M19 22V29','#9BAB7D',1,.7),
 'wheat wrappers':e(16,22,11,6,'#CABB99')+e(18,18,11,6,'#E2D6B9')+e(19,14,10,5.5,'#F0E5CA')+line('M10 22Q17 26 25 22'),
 'cabbage':cabbage('#6E9D59','#A9C27C'),
 'garlic':p('M16 6H20L21 13C33 20 27 30 18 30C7 30 4 21 14 14Z','#E8DDC4')+line('M17 12Q11 24 16 29M20 13Q26 24 20 29','#B7A48C',1.2,.8),
 'soy dip':drop('#65473B','#9A765A',true),
 'flour':powder('#D5CBB5','#F0E9D8'),
 'milk':drop('#DEE4DE','#F5F5EB'),
 'cream':drop('#DED4B5','#F6EBD0',true),
 'berries':[[12,18,'#7C688C'],[22,14,'#9A5369'],[22,25,'#746587'],[13,27,'#AA5867']].map(([x,y,c])=>circle(x,y,5,c)+p(`M${x-2} ${y-4}l2 2 2-2-1 3-2 0Z`,'#637C52')).join(''),
 'sourdough':bread(true),
 'lemon':citrus('#D7B84B','#EDD477'),
 'edible flowers':[[13,15,'#B887A9'],[24,23,'#D7B975']].map(([x,y,c])=>[0,72,144,216,288].map(a=>`<g transform="rotate(${a} ${x} ${y})">${e(x,y-3.5,2.1,3.5,c)}</g>`).join('')+circle(x,y,2,'#D4AC50')).join(''),
 'matcha':powder('#78954C','#A4B369'),
 'steamed milk':bowl('#E7E5D8','#F7F3E9')+steam,
 'hot water':drop('#AACBD0','#D6E8E5')+steam,
 'yogurt':bowl('#E3E1D5','#F9F3E4')+line('M12 16Q17 12 22 16Q24 19 17 18','#C8C3B3',1.2,.9),
 'rose syrup':drop('#B56980','#DB9AAB'),
 'granola':[[10,15],[17,11],[25,16],[13,23],[22,26]].map(([x,y])=>p(`M${x-3} ${y}l2-3 4 1 1 4-5 2Z`,'#BC9463')+e(x,y,2,1,'#D8B88A',30)).join(''),
 'rice noodles':noodles('#E8E2CF',true),
 'shrimp':p('M28 12C19 2 7 9 7 19C7 28 20 33 26 24L21 20C15 26 11 19 15 14C18 10 22 12 24 15Z','#DC947A')+p('M26 14 31 15 29 20 24 18Z','#B96E59')+line('M10 13 15 15M9 20 14 19M13 26 16 22M20 28 20 23','#F3C6A3',1.4,1),
 'peanuts':nuts('#B48B5B','#D6B17B'),
 'lime':citrus('#7FA454','#BACB72'),
 'green curry paste':drop('#71834C','#A3AE73',true),
 'coconut milk':drop('#D3DBCD','#F0F0DF',true),
 'chicken':p('M22 8C31 11 30 21 22 24L17 22 11 28 7 25 14 19C10 12 16 5 22 8Z','#D5AA7B')+p('M22 9Q14 10 16 16L21 14 26 16Q28 11 22 9Z','#E8C498')+line('M11 26 7 30','#E4DBBF',4,1)+circle(6,30,2,'#E4DBBF')+circle(9,32,2,'#E4DBBF'),
 'thai basil':herb('#578752','thai')+line('M16 30 20 10','#896877',1.2,1),
 'jasmine rice':grains('#E7DFC5'),
 'mushrooms':p('M14 18H22L24 29H12Z','#D5C4A6')+p('M6 19C7 3 29 3 30 19Z','#A58A72')+p('M18 8C12 8 8 13 8 17H16Z','#C1A98C')+line('M8 19H28','#6D5A49',1.5,.6),
 'lemongrass':line('M10 28 23 6M14 30 27 9M19 29 28 15','#8EAA6A',2.5,1)+line('M10 28 14 21M14 30 18 23M19 29 21 25','#DDD5AC',3.4,1),
 'lime leaf':leaf(14,28,-35,'#5F8B4F')+leaf(21,18,-35,'#739951'),
 'chili':p('M8 28Q22 27 23 10L28 12Q27 30 8 28Z','#C26B51')+line('M24 12Q22 6 27 6','#698450',2,1)+line('M23 16Q22 24 16 26','#E6A078',1.2,.8),
 'holy basil':herb('#789453','holy'),
 'rice':grains('#E1D6BB'),
 'mango':p('M12 9C29 1 34 24 21 29C6 35 1 16 12 9Z','#DAB35D')+p('M14 11C23 5 29 18 23 24C14 34 5 19 14 11Z','#EBCB7B')+line('M18 9 20 5','#71894C',1.7,1),
 'sticky rice':p('M7 25C8 13 27 10 29 25Q18 31 7 25Z','#E0D6BD')+grains('#F1E9D5'),
 'black tea':bowl('#765542','#AB855C')+steam,
 'condensed milk':drop('#DACDA5','#F2E3BE',true)+line('M12 24Q18 28 24 24','#BCAB83',1.1,.7),
 'ice':cube('#A8CDD5','#DEECE9'),
 'sugar':cube('#DADAD0','#F0F0E5'),
 'wheat dough':p('M7 24C5 10 15 7 23 11C31 14 31 27 24 29H13Q7 28 7 24Z','#D1BB91')+p('M9 22C9 11 21 10 26 17L20 19 15 25Z','#E8D4AC'),
 'black pepper':[[11,13],[23,11],[17,20],[9,26],[26,25],[20,29]].map(([x,y])=>circle(x,y,2.5,'#655D50')+circle(x-.5,y-.8,.7,'#9C8B72')).join(''),
 'brown sugar':powder('#AD8756','#C9A874'),
 'tapioca pearls':[[12,13],[23,14],[17,22],[8,24],[26,26]].map(([x,y])=>circle(x,y,3.8,'#6E5144')+circle(x-1,y-1,1,'#9A7760')).join(''),
 'wheat flour':powder('#D9CBAA','#EBDFBE'),
 'oil':drop('#D3AE50','#EDCF7D'),
 'potato starch':powder('#D8DBCF','#F2F3E5'),
 'basil':herb(),
 'pepper salt':grains('#DCD6C6',true)+[[13,10],[25,19],[15,27]].map(([x,y])=>circle(x,y,1.5,'#70685A')).join(''),
 'soy glaze':drop('#79523B','#AE8257',true),
 'bamboo skewer':line('M9 29 27 7','#BCA478',2.2,1)+p('M25 8 28 4 28 9Z','#D5C098'),
 'tofu':cube('#D8D2B7','#F0E8D0'),
 'pickled cabbage':p('M8 13 15 10 21 13 29 11 26 21 29 27 19 25 10 29 7 22Z','#C7B476')+line('M12 15 14 24M20 15 18 22M25 16 23 24','#EEE1AE',2,.9),
 'shaved ice':pile('#B5D5DA','#E0EFEA')+p('M12 21 15 17 20 23 24 19 28 25 10 25Z','#D6E8E6'),
 'mango syrup':drop('#DCAA47','#EBC671'),
 'mint':herb('#689D6F')+line('M12 17 15 19M23 13 21 16','#D7E3B7',1,.8),
 'clams':p('M6 14C7 3 29 3 30 14L20 28H16Z','#B5A696')+p('M18 8 20 28 16 28Z','#DBD0BB')+line('M18 27 10 11M18 27 25 11M18 27V9','#857767',1.1,.7),
 'potato':e(18,19,10,12,'#C6AC7F',30)+p('M13 9C6 12 7 25 15 29L12 21Z','#DDC494')+[[18,12],[23,20],[14,24]].map(([x,y])=>line(`M${x} ${y}h1`,'#8D795D',1.5,.8)).join(''),
 'celery':line('M11 29 14 12M17 30 20 10M23 28 25 13','#A8B97B',3.5,1)+leaf(14,14,-35,'#6F965B')+leaf(23,15,35,'#7CA464'),
 'thyme':line('M12 30 24 8','#9D9768',1.2,1)+[[16,23],[19,17],[23,11]].map(([x,y])=>e(x-2,y-2,3,1.5,'#799466',30)+e(x+2,y,3,1.5,'#8FA979',-30)).join(''),
 'white fish':fillet('#CBCFC0','#ECE8D4'),
 'batter':drop('#CDBC8F','#E7D7AB',true),
 'tartar sauce':drop('#C9C7A0','#E5DEBC',true),
 'crab':e(18,21,8,6,'#C0775C')+line('M11 20 6 15 6 10M25 20 30 15 30 10M11 23 5 24M12 26 7 29M25 23 31 24M24 26 29 29','#B27257',1.8,1)+p('M3 7 6 10 9 7 9 13 3 13Z','#D29370')+p('M27 7 30 10 33 7 33 13 27 13Z','#D29370')+circle(15,18,1,'#5C5042')+circle(21,18,1,'#5C5042'),
 'mayo':drop('#E1D6AB','#F5EDCA',true),
 'lettuce':p('M18 7C23 4 27 9 26 12C33 12 31 21 27 22C29 28 20 30 17 28C10 32 6 26 8 22C2 18 6 10 11 12C10 7 15 5 18 7Z','#94B46C')+line('M17 29 18 12M18 24 10 18M18 21 25 15','#5B874F',1.4,.7),
 'butter bun':bread(false,true),
 'parsley':line('M17 30 18 12','#70954F',1.5,1)+[[-6,0],[6,0],[0,-7]].map(([x,y])=>`<g transform="translate(${x} ${y})">`+p('M18 24 12 20 14 17 10 13 15 13 18 9 21 13 26 13 22 17 24 20Z','#699656')+'</g>').join(''),
 'sea salt':[[10,14],[22,11],[16,22],[26,25]].map(([x,y])=>p(`M${x} ${y-3}l4 3-3 4-4-3Z`,'#D9DDD4')+line(`M${x} ${y-2}v5`,'#A7B1A7',.7,.6)).join(''),
 'aioli':drop('#D7CD9C','#F0E6BE',true),
 'tuna':fillet('#B97D7D','#D4A09B'),
 'tamago':cube('#DFC066','#EED68F')+line('M10 20 18 24 26 20M10 17 18 21 26 17','#BD9744',.9,.6),
 'fish roe':[[11,13],[18,10],[25,14],[14,21],[23,23],[12,28],[20,29]].map(([x,y])=>circle(x,y,2.7,'#CE8D56')+circle(x-.7,y-.7,.7,'#E9BA7C')).join(''),
 'wasabi':p('M7 27C7 23 12 23 11 20C11 17 16 17 16 13C16 11 19 9 20 7C24 12 20 16 25 19C29 21 25 24 29 27Z','#91A85D')+line('M12 24H24M14 19H23','#C3CD88',1.7,1),
 'miso':drop('#A7895A','#CCB383',true),
 'dashi':bowl('#C0A46E','#DED0A6'),
 'wakame':p('M11 30Q5 25 11 21Q16 18 10 14Q6 8 14 6L18 10Q14 14 19 17Q24 22 17 26L17 30Z','#4D7861')+p('M22 29Q18 24 23 20Q28 18 24 12L29 8Q34 16 28 23L28 29Z','#668B68'),
 'glutinous rice':grains('#E6DDC5',true),
 'sweet bean paste':drop('#8A6868','#B18D88',true),
 'watermelon radish':circle(18,19,11,'#96AC6E')+circle(18,19,9,'#E8DDC2')+circle(18,19,7,'#CB8D9E')+line('M18 13V25M13 15 23 23M13 23 23 15','#E7B7BE',.9,.9),
 'greens':leaf(15,28,-30,'#6E9C56')+leaf(23,24,25,'#8AAE67'),
 'steak':fillet('#9C6A5B','#C58B78',true),
 'ramen noodles':noodles('#D7B16C')+line('M8 12Q18 7 28 12','#E4C994',1.7,1),
 'egg yolk':circle(18,19,10,'#DCB14C')+e(15,16,4,2.4,'#EDD384',-30),
 'sourdough bread':bread(true),
 'quinoa':[[10,13],[18,10],[26,15],[16,19],[9,24],[24,24],[17,28]].map(([x,y])=>circle(x,y,2,'#CAB68E')+line(`M${x-1} ${y}q0-2 2-1`,'#F1E1BB',.8,1)).join(''),
 'walnuts':nuts('#9F815E','#C2A47E',true),
 'peanut dressing':drop('#B59768','#D7BC8D'),
 'tofu croutons':[[0,0],[-7,7],[7,8]].map(([x,y])=>`<g transform="translate(${x} ${y}) translate(18 18) scale(.53) translate(-18 -18)">${cube('#BEA36D','#DDC28A')}</g>`).join(''),
};
const dir=resolve(root,'src/glimmer/ingredient-assets');mkdirSync(dir,{recursive:true});
const labels=source.jobs.map(j=>j.ingredient);
if(labels.length!==new Set(labels).size)throw Error('Duplicate labels');
for(const label of labels){
 if(!definitions[label])throw Error(`Missing explicit drawing: ${label}`);
 const key=source.jobs.find(j=>j.ingredient===label).assetKey??label.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const file=resolve(dir,`${key}.svg`);
 const svg=`<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">\n${definitions[label]}\n</svg>\n`;
 if(existsSync(file)&&!process.argv.includes('--update'))throw Error(`Refusing to overwrite ${file}`);
 writeFileSync(file,svg);
}
console.log(`Generated ${labels.length} ingredient SVGs from explicit dish bindings; original PR165 assets unchanged.`);
