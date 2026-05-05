const sharp = require('sharp');
const svg = `<svg width="96" height="96"><path d="M48,12 L84,48 L48,84 L12,48 Z" fill="white"/></svg>`;
sharp({
  create: {width: 96, height: 96, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}
})
.composite([{input: Buffer.from(svg), gravity: 'center'}])
.png()
.toFile('./assets/notification-icon.png')
.then(() => console.log('Done'))
.catch(console.error);
