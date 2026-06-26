const sharp = require('sharp');
const fs = require('fs');

const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/uploaded_media_1782267983121.png';

async function extractLogo() {
  // Option 1 is on the left side of the image. 
  // Let's crop the left 25% of the image.
  const info = await sharp(imgPath).metadata();
  const cropWidth = Math.floor(info.width / 4);
  const cropHeight = Math.floor(info.height * 0.5); // logo is in the middle
  const cropTop = Math.floor(info.height * 0.15); // skip "OPCION 1" text

  const buffer = await sharp(imgPath)
    .extract({ left: 10, top: cropTop, width: cropWidth, height: cropHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const data = buffer.data;
  // We want to isolate the orange line and make everything else transparent
  let minX = cropWidth, maxX = 0, minY = cropHeight, maxY = 0;
  let hasPixels = false;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Orange is roughly high R, medium G, low B
    if (r > 150 && g > 60 && g < 180 && b < 100) {
      data[i] = 255;   // R
      data[i+1] = 107; // G
      data[i+2] = 43;  // B
      data[i+3] = 255; // Alpha
      
      const px = (i / 4) % cropWidth;
      const py = Math.floor((i / 4) / cropWidth);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      hasPixels = true;
    } else {
      data[i+3] = 0; // Make non-orange pixels transparent
    }
  }

  if (!hasPixels) {
    console.log("No orange pixels found!");
    return;
  }

  // Crop to bounding box
  const boundWidth = maxX - minX + 1;
  const boundHeight = maxY - minY + 1;

  const croppedBuffer = await sharp(data, {
    raw: { width: cropWidth, height: cropHeight, channels: 4 }
  })
    .extract({ left: minX, top: minY, width: boundWidth, height: boundHeight })
    .png()
    .toBuffer();

  // Save the PNG for inspection
  fs.writeFileSync('public/logo-transparent.png', croppedBuffer);

  // Now trace this transparent PNG
  const potrace = require('potrace');
  potrace.trace(croppedBuffer, { color: '#ff6b2b', optTolerance: 0.2 }, async function(err, svg) {
    if (err) throw err;
    fs.writeFileSync('public/favicon.svg', svg);
    
    // Regenerate icons
    await sharp(croppedBuffer).resize(192, 192, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toFile('public/icon-192x192.png');
    await sharp(croppedBuffer).resize(512, 512, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toFile('public/icon-512x512.png');
    await sharp(croppedBuffer).resize(180, 180, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toFile('public/apple-touch-icon.png');
    
    console.log("SUCCESS! SVG and PNGs generated from bounding box:", minX, minY, boundWidth, boundHeight);
  });
}

extractLogo();
