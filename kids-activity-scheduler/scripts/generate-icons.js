// Script to generate PWA icons
// This creates simple placeholder icons for the PWA
// In production, replace with actual designed icons

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon template
function generateSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" fill="white" text-anchor="middle" dominant-baseline="middle">KAS</text>
</svg>`;
}

// Generate icons for each size
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  
  // Save SVG version (can be converted to PNG using external tools)
  fs.writeFileSync(path.join(iconsDir, svgFilename), svg);
  console.log(`Generated ${svgFilename}`);
});

console.log('\nIcon generation complete!');
console.log('Note: SVG files created. For production, convert to PNG or use proper icon design.');
