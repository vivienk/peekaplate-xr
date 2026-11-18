import{chromium}from'playwright';import assert from'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 for(const [path,label] of [['/xr','Meta IWSDK'],['/xr/1','Spectacles']]){
  const page=await browser.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.PREVIEW_URL||'https://peekaplate-ar.vercel.app')+path);
  const click=async name=>{const b=page.getByRole('button',{name,exact:true}).first();await b.waitFor({state:'attached'});await b.evaluate(el=>el.click());};
  await click('Start');await click('Market Map');await click('Travel there');await page.waitForTimeout(1000);await page.keyboard.press('e');await click('Flaming Steak Ramen');await click('View Portion');
  await page.getByRole('button',{name:label,exact:true}).waitFor({state:'attached'});
  assert.equal(await page.getByRole('button',{name:label==='Spectacles'?'Meta IWSDK':'Spectacles',exact:true}).count(),0);
  assert.deepEqual(errors,[]);console.log('PASS',path,label);await page.close();
 }
}finally{await browser.close();}
