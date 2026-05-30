import sharp from 'sharp'

const svg = Buffer.from(`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#0e0e0c"/>
  <text x="224" y="352" font-family="Georgia, serif" font-size="288" font-style="italic" font-weight="400" fill="#f0ede4" text-anchor="middle">f</text>
  <circle cx="352" cy="352" r="48" fill="#c8f03a"/>
</svg>`)

await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
console.log('Icons generated successfully')
