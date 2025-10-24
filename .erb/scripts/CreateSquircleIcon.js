// this script generates rounded icon from any existing squared icon
// source and destination can be controlled from variables below
// run the script using - node ./.erb/scripts/CreateSquircleIcon.js

import sharp from 'sharp';

const source = 'assets/icons/icon.png';
const dest = 'assets/icons/icon-squircle.png';
const size = 1024;
const margin = Math.round(size * 0.08); // margin in pixels
const radius = 180; // corner radius

const squircleMask = Buffer.from(`
<svg width="${size}" height="${size}">
  <rect x="${margin}" y="${margin}" width="${size - 2 * margin}" height="${size - 2 * margin}" rx="${radius}" ry="${radius}"/>
</svg>
`);

sharp(source)
  .resize(size, size, { fit: 'cover' })
  .composite([{ input: squircleMask, blend: 'dest-in' }])
  .png()
  .toFile(dest)
  .then(() => console.log('✅ Squircle PNG with margin created:', dest))
  .catch(console.error);
