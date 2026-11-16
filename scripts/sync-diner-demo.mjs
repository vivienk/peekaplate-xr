// Import the user-selected demo from a trusted local PeekaPlate checkout.
// This runs repository code at development time, never in the game browser.
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {transform} from 'esbuild';
const root=path.resolve(process.argv[2]??'../market-directory-api');
const source=path.join(root,'frontend/diner/src/menu');
let text=await readFile(path.join(source,'fixtures.ts'),'utf8');
text=text.slice(0,text.indexOf('export const edgeCaseBundle'));
const declarations=[];
await mkdir('public/diner-demo',{recursive:true});
for(const match of text.matchAll(/import (\w+) from '\.\/fixture-assets\/([^']+)';/g)){
 const [,name,file]=match;
 if(!/\.(png|webp)$/.test(file))continue;
 await copyFile(path.join(source,'fixture-assets',file),path.join('public/diner-demo',file));
 declarations.push(`const ${name}=${JSON.stringify('/diner-demo/'+file)};`);
}
text=text.replace(/^import .*;\n/gm,'').replace(/export /g,'');
const compiled=await transform(declarations.join('\n')+'\n'+text+'\nreturn demoBundle;',{loader:'ts',target:'es2022'});
const bundle=new Function(compiled.code)();
delete bundle.restaurant.internal_code;
if(bundle.restaurant.name!=='Ember & Stone')throw new Error('Unexpected diner demo');
await writeFile('public/diner-demo/menu.json',JSON.stringify(bundle,null,2)+'\n');
console.log(`Imported ${bundle.restaurant.name}: ${bundle.categories.flatMap(c=>c.dishes).length} dishes`);
