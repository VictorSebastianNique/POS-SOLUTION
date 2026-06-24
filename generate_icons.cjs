const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  try {
    const svgFile = path.join(__dirname, 'public', 'favicon.svg');
    const svgBuffer = fs.readFileSync(svgFile);

    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-192x192.png'));
    console.log('icon-192x192.png created');

    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-512x512.png'));
    console.log('icon-512x512.png created');

    // Also an apple-touch-icon
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
    console.log('apple-touch-icon.png created');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
