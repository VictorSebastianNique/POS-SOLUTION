const sharp = require('sharp');
const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/uploaded_media_1782267983121.png';

async function testCrop() {
  // Option 1 main logo
  await sharp(imgPath)
    .extract({ left: 30, top: 120, width: 220, height: 200 })
    .toFile('crop_main.png');
    
  // App icon bottom left
  await sharp(imgPath)
    .extract({ left: 20, top: 430, width: 120, height: 120 })
    .toFile('crop_icon.png');
    
  console.log('Cropped');
}
testCrop();
