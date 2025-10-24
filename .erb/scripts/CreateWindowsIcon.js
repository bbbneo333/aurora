// this creates windows icon (.ico) based on input png image
// run the script using - node ./.erb/scripts/CreateWindowsIcon.js

import sharp from 'sharp';
import fs from 'fs';
import pngToIco from 'png-to-ico';

const source = 'assets/icons/icon.png'; // 1024x1024 PNG
const outputIco = 'assets/icons/icon.ico';

// define standard Windows icon sizes
const sizes = [16, 24, 32, 48, 64, 128, 256];

(async () => {
  try {
    // resize source PNG to all required sizes
    const resizedBuffers = await Promise.all(
      sizes.map(async (size) => sharp(source)
        .resize(size, size, {
          fit: 'contain',
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        })
        .png()
        .toBuffer()),
    );

    // generate ICO
    const icoBuffer = await pngToIco(resizedBuffers);
    fs.writeFileSync(outputIco, icoBuffer);

    console.log('✅ Windows .ico created:', outputIco);
  } catch (err) {
    console.error(err);
  }
})();
