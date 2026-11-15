import assert from 'node:assert/strict';
import sharp from 'sharp';
// Exercise the patched native image dependency on the actual CI platform.
const png = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="orange"/></svg>')).png().toBuffer();
const metadata = await sharp(png).metadata();
assert.equal(metadata.width, 8); assert.equal(metadata.height, 8);
console.log(JSON.stringify({sharp:sharp.versions.sharp,librsvg:sharp.versions.rsvg,nativeConversion:'passed'}));
