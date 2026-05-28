/**
 * Genera iconos PNG placeholder para la PWA.
 * Requiere sharp (disponible en el contenedor backend_node).
 *
 * Uso desde el contenedor backend:
 *   docker exec backend_node node /tmp/generate-icons.mjs <outputDir>
 *
 * O desde WSL con sharp instalado:
 *   node --experimental-vm-modules scripts/generate-icons.js <outputDir>
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const outputDir = process.argv[2] || '/tmp/pwa-icons';

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

async function buildSvg(size, maskable) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const fontSize = Math.round((size - padding * 2) * 0.38);
  const cy = Math.round(size / 2 + fontSize * 0.35);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#1c7ed6"/>
      <text x="${size / 2}" y="${cy}"
        font-family="Arial,Helvetica,sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        text-anchor="middle">PP</text>
    </svg>`
  );
}

await fs.mkdir(outputDir, { recursive: true });

for (const { name, size, maskable } of sizes) {
  const svg = await buildSvg(size, maskable);
  const outPath = path.join(outputDir, name);
  await sharp(svg).png().toFile(outPath);
  console.log(`Generated: ${outPath}`);
}

console.log('Icons generated successfully.');
