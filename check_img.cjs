const sharp = require('sharp');
const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/uploaded_media_1782267983121.png';
sharp(imgPath).metadata().then(metadata => {
  console.log(metadata);
}).catch(err => console.error(err));
