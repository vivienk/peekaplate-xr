/** Package approved image-generation outputs, retaining photo provenance and hashed 2.5D layers. */
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inputs=JSON.parse(await readFile(process.argv[2],'utf8'));
const portions=JSON.parse(await readFile('src/glimmer/restaurant-portions.json','utf8'));
const photos=JSON.parse(await readFile('src/glimmer/restaurant-photos.json','utf8'));
const provenance=[];
for(const item of inputs){
 const {id,icon,cutout,photo,name}=item,raw=await readFile(cutout),original=await readFile(photo);
 const folder=`public/restaurant-portions/${id}`;await mkdir(folder,{recursive:true});
 const fg=await sharp(raw).resize({width:640,height:640,fit:'inside'}).webp({quality:88}).toBuffer();
 const meta=await sharp(fg).metadata(),stats=await sharp(fg).stats();
 if(!meta.hasAlpha||stats.channels[3].min!==0||fg.length>180000)throw Error(`Invalid cutout ${id}`);
 const bg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}"></svg>`);
 await writeFile(`${folder}/foreground.webp`,fg);await writeFile(`${folder}/background.svg`,bg);
 await sharp(icon).resize(24,24,{fit:'contain',background:'#00000000',kernel:'nearest'}).png().toFile(`public/supplied-dishes/${id}-pixel.png`);
 await sharp(original).resize({width:1200,height:1200,fit:'inside'}).jpeg({quality:88}).toFile(`public/supplied-dishes/${id}-photo.jpg`);
 const uuid=h=>`${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
 portions[id]={portion:{schema_version:1,dish_id:uuid(sha(id)),dish_revision_id:uuid(sha(raw)),width:meta.width,height:meta.height,motion:{max_yaw_degrees:3,max_pitch_degrees:3},layers:[['background.svg',bg,0],['foreground.webp',fg,1]].map(([file,bytes,depth])=>({url:`https://restaurant-portions.invalid/${id}/${file}`,sha256:sha(bytes),size_bytes:bytes.length,depth}))},segmentation:{engine:'imagegen',operation:'user-photo-background-extraction',source_sha256:sha(original),cutout_sha256:sha(raw)}};
 photos[id]={photo:`supplied-dishes/${id}-photo.jpg`,sourceDish:name,source:'',sha256:sha(await readFile(`public/supplied-dishes/${id}-photo.jpg`)),note:'User-supplied photo; AI-edited cutout. Ingredients are descriptive, not restaurant-verified.'};
 provenance.push({...item,icon:undefined,cutout:undefined,photo:undefined,source_filename:photo.split('/').pop(),photo_sha256:sha(original),generated_cutout_sha256:sha(raw),generated_icon_sha256:sha(await readFile(icon)),size:'27 cm reference; estimated, not measured'});
}
await writeFile('src/glimmer/restaurant-portions.json',JSON.stringify(portions,null,2)+'\n');
await writeFile('src/glimmer/restaurant-photos.json',JSON.stringify(photos,null,2)+'\n');
await writeFile('docs/supplied-dishes-provenance.json',JSON.stringify(provenance,null,2)+'\n');
