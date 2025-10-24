// this script generates iconset and icon.icns for macOS
// source and destination can be controlled from variables below
// run the script using - node ./.erb/scripts/CreateIconSet.js

import fs from 'fs';
import sharp from 'sharp';
import * as os from 'os';
import { execSync } from 'child_process';

const source = 'assets/icons/icon-squircle.png';
const dest = 'assets/icons/icon.iconset';

const sizes = [
  { name: 'icon_16x16.png', size: 16 },
  { name: 'icon_16x16@2x.png', size: 32 },
  { name: 'icon_32x32.png', size: 32 },
  { name: 'icon_32x32@2x.png', size: 64 },
  { name: 'icon_128x128.png', size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png', size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png', size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 },
];

if (!fs.existsSync(dest)) fs.mkdirSync(dest);

async function generateIcons() {
  if (!fs.existsSync(source)) {
    console.error(`❌ Source file "${source}" not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(dest)) fs.mkdirSync(dest);

  console.log('🔧 Generating iconset...');

  for (const { name, size } of sizes) {
    await sharp(source)
      .resize(size, size)
      .toFile(`${dest}/${name}`);
    console.log(`✅ ${name} (${size}x${size})`);
  }

  console.log('\n🎉 Iconset created successfully:', dest);

  // macOS only: convert to .icns
  if (os.platform() === 'darwin') {
    try {
      console.log('\n🧩 Converting to .icns...');
      execSync(`iconutil --convert icns ${dest}`, { stdio: 'inherit' });
      console.log('✅ icon.icns created successfully!\n');
    } catch (err) {
      console.error('⚠️ Failed to convert to .icns:', err.message);
    }
  } else {
    console.log('\nℹ️ Skipping .icns conversion (not macOS).');
  }
}

generateIcons().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
