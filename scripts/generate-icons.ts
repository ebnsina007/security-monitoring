import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateAllIcons() {
  const publicDir = path.join(process.cwd(), "public");
  const iconsDir = path.join(publicDir, "icons");

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // طراحی نشان برداری با وکتور باکیفیت: سپر حفاظتی طلایی و فیروزه‌ای، نشان پزشکی، و ستاره پدافند
  const svgShield = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#091428"/>
        <stop offset="50%" stop-color="#0A2540"/>
        <stop offset="100%" stop-color="#004B87"/>
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00A896"/>
        <stop offset="50%" stop-color="#028090"/>
        <stop offset="100%" stop-color="#005A9E"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFE082"/>
        <stop offset="50%" stop-color="#FFB300"/>
        <stop offset="100%" stop-color="#FF8F00"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#00A896" flood-opacity="0.4"/>
      </filter>
    </defs>

    <!-- پس‌زمینه با گوشه‌های نرم مدرن -->
    <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

    <!-- حلقه نورانی حفاظتی بیرونی -->
    <circle cx="256" cy="256" r="218" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="8 6" opacity="0.6"/>

    <!-- سپر اصلی حفاظتی مرکز درمانی ابن‌سینا -->
    <path d="M 256,76 
             L 380,126 
             C 380,270 330,370 256,436 
             C 182,370 132,270 132,126 
             Z" 
          fill="url(#shieldGrad)" 
          stroke="url(#goldGrad)" 
          stroke-width="12" 
          filter="url(#glow)"/>

    <!-- نماد صلیب و هلال امدادی و پزشکی مرکزی -->
    <g transform="translate(256, 240)">
      <!-- بازوی عمودی صلیب -->
      <rect x="-18" y="-72" width="36" height="144" rx="8" fill="#FFFFFF" opacity="0.95"/>
      <!-- بازوی افقی صلیب -->
      <rect x="-72" y="-18" width="144" height="36" rx="8" fill="#FFFFFF" opacity="0.95"/>
      <!-- نگین طلایی مرکز -->
      <circle cx="0" cy="0" r="14" fill="url(#goldGrad)"/>
    </g>

    <!-- ستاره‌های چهارگوشه اقتدار و پدافند هوشمند -->
    <polygon points="256,310 262,328 280,328 266,338 271,356 256,345 241,356 246,338 232,328 250,328" fill="url(#goldGrad)"/>
    
    <!-- متن برندینگ تحتانی -->
    <text x="256" y="474" text-anchor="middle" fill="#E2E8F0" font-family="sans-serif" font-size="22" font-weight="bold" letter-spacing="4">
      AVICENNA SECURITY
    </text>
  </svg>
  `;

  // نسخه مخصوص Maskable (با حاشیه امن بیشتر جهت برش استاندارد در لانچرهای مختلف اندروید)
  const svgMaskable = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#091428"/>
        <stop offset="50%" stop-color="#0A2540"/>
        <stop offset="100%" stop-color="#004B87"/>
      </linearGradient>
      <linearGradient id="shieldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00A896"/>
        <stop offset="50%" stop-color="#028090"/>
        <stop offset="100%" stop-color="#005A9E"/>
      </linearGradient>
      <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFE082"/>
        <stop offset="50%" stop-color="#FFB300"/>
        <stop offset="100%" stop-color="#FF8F00"/>
      </linearGradient>
    </defs>

    <rect width="512" height="512" fill="url(#bgGrad2)"/>

    <g transform="translate(256, 256) scale(0.72) translate(-256, -256)">
      <circle cx="256" cy="256" r="218" fill="none" stroke="url(#goldGrad2)" stroke-width="4" stroke-dasharray="8 6" opacity="0.6"/>
      <path d="M 256,76 L 380,126 C 380,270 330,370 256,436 C 182,370 132,270 132,126 Z" 
            fill="url(#shieldGrad2)" 
            stroke="url(#goldGrad2)" 
            stroke-width="14"/>

      <g transform="translate(256, 240)">
        <rect x="-18" y="-72" width="36" height="144" rx="8" fill="#FFFFFF"/>
        <rect x="-72" y="-18" width="144" height="36" rx="8" fill="#FFFFFF"/>
        <circle cx="0" cy="0" r="14" fill="url(#goldGrad2)"/>
      </g>
    </g>
  </svg>
  `;

  console.log("Generating Apple Touch Icon & Android PWA icons with Sharp...");

  const baseBuffer = Buffer.from(svgShield);
  const maskableBuffer = Buffer.from(svgMaskable);

  // ۱. Apple Touch Icon رسمی (180x180) برای iOS
  await sharp(baseBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await sharp(baseBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // ۲. آیکون‌های استاندارد PWA و اندروید
  await sharp(baseBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, "icon-192.png"));

  await sharp(baseBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, "icon-512.png"));

  // ۳. آیکون‌های تطبیقی Maskable
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, "icon-maskable-192.png"));

  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));

  // ۴. Favicon باکیفیت بالا
  await sharp(baseBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, "favicon.png"));

  // ساخت کپی به عنوان favicon.ico
  await sharp(baseBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, "favicon.ico"));

  console.log("All Apple and Android icons generated successfully!");
}

generateAllIcons().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
