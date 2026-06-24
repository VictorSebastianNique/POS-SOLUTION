const sharp = require('sharp');
const potrace = require('potrace');
const fs = require('fs');

const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/uploaded_media_1782267983121.png';

async function processImage() {
  // Extract Option 1 app icon, upscale, threshold to isolate the line-art
  await sharp(imgPath)
    .extract({ left: 30, top: 435, width: 95, height: 95 })
    .resize(800, 800, { kernel: sharp.kernel.lanczos3 }) 
    .greyscale()
    .normalize()
    .threshold(128) // Threshold to separate orange from dark blue
    .negate() // Potrace traces black pixels. We want the orange lines to be black.
    .toFile('temp.png');

  potrace.trace('temp.png', { color: '#ff6b2b', optTolerance: 0.2 }, function(err, svg) {
    if (err) throw err;
    // Make sure it looks clean and has a viewBox
    fs.writeFileSync('public/favicon.svg', svg);
    console.log('SVG traced and saved!');
  });
}

processImage();
