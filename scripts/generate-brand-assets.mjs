/**
 * One-shot script to generate every brand asset (logo, favicon, PWA icons,
 * OG image) from a single source PNG.
 *
 * Usage:
 *   node scripts/generate-brand-assets.mjs
 *
 * Source: scripts/source-logo.png  (the full color logo, transparent bg)
 */

import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'source-logo.png');
const PUBLIC = path.join(ROOT, 'public');
const ICONS = path.join(PUBLIC, 'icons');

// Brand background for the OG image (deep charcoal — matches the site theme)
const OG_BG = { r: 5, g: 5, b: 5, alpha: 1 };

// Sizes for square PWA / favicon icons
const ICON_SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function ensureDirs() {
    if (!existsSync(PUBLIC)) await mkdir(PUBLIC, { recursive: true });
    if (!existsSync(ICONS)) await mkdir(ICONS, { recursive: true });
}

/**
 * Auto-detect the symbol portion of the logo by walking pixels from the left
 * and finding the gap (column of fully transparent pixels) that separates the
 * symbol from the wordmark. Crops everything left of that gap, then pads to a
 * square canvas with a small margin so the symbol sits comfortably centered.
 *
 * This is robust to small variations in logo layout — no hardcoded pixel widths.
 */
async function squareSymbol(sourceBuffer, meta) {
    const { width, height } = meta;
    const { data, info } = await sharp(sourceBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const ch = info.channels; // 4 (RGBA)
    const isOpaqueAt = (x, y) => data[(y * info.width + x) * ch + 3] > 8;

    // Find the rightmost x where the symbol still has visible content,
    // by scanning columns left → right. Stop at the first sustained gap
    // (consecutive transparent columns wider than ~3% of the image width).
    const gapMin = Math.max(6, Math.round(width * 0.03));
    let symbolRight = 0;
    let consecutiveBlankCols = 0;
    let seenAnyContent = false;

    for (let x = 0; x < width; x++) {
        let hasInk = false;
        for (let y = 0; y < height; y++) {
            if (isOpaqueAt(x, y)) { hasInk = true; break; }
        }
        if (hasInk) {
            symbolRight = x;
            consecutiveBlankCols = 0;
            seenAnyContent = true;
        } else if (seenAnyContent) {
            consecutiveBlankCols++;
            if (consecutiveBlankCols >= gapMin) break; // gap found — stop
        }
    }

    // Crop from x=0 → x=symbolRight (inclusive)
    const symbolWidth = Math.min(width, symbolRight + 2);
    const cropped = await sharp(sourceBuffer)
        .extract({ left: 0, top: 0, width: symbolWidth, height })
        .toBuffer();

    // Pad to square with a 6% breathing margin so the symbol isn't flush with the edges
    const side = Math.max(symbolWidth, height);
    const margin = Math.round(side * 0.06);
    const canvas = side + margin * 2;
    return sharp({
        create: {
            width: canvas, height: canvas, channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{
            input: cropped,
            left: Math.round((canvas - symbolWidth) / 2),
            top: Math.round((canvas - height) / 2),
        }])
        .png()
        .toBuffer();
}

/**
 * Resize a square buffer to N×N. Padded transparent so nothing is cropped.
 */
function squareResized(buffer, size) {
    return sharp(buffer)
        .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
}

/**
 * Maskable icons need ~10% safe-area padding (PWA spec).
 */
async function maskableResized(buffer, size) {
    const inner = Math.round(size * 0.78);
    const pad = Math.round((size - inner) / 2);
    const innerBuffer = await sharp(buffer)
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
    return sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 5, g: 5, b: 5, alpha: 1 },
        },
    })
        .composite([{ input: innerBuffer, top: pad, left: pad }])
        .png()
        .toBuffer();
}

/**
 * White silhouette of the source (for footer / dark backgrounds), preserving alpha.
 */
async function whiteSilhouette(sourceBuffer) {
    // Multiply alpha against a white tile.
    const meta = await sharp(sourceBuffer).metadata();
    const { width, height } = meta;
    const white = await sharp({
        create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    // Use the source's alpha channel as the mask: ensure source has alpha first.
    const sourceWithAlpha = await sharp(sourceBuffer).ensureAlpha().toBuffer();
    return sharp(white)
        .composite([{ input: sourceWithAlpha, blend: 'dest-in' }])
        .png()
        .toBuffer();
}

/**
 * Compose a 1200x630 Open Graph image with the logo centered on a dark bg.
 */
async function buildOg(whiteLogoBuffer) {
    const W = 1200, H = 630;
    // Resize the logo to fit ~70% of the canvas width while preserving aspect.
    const resized = await sharp(whiteLogoBuffer)
        .resize({ width: Math.round(W * 0.7), fit: 'inside' })
        .toBuffer();
    const meta = await sharp(resized).metadata();
    const left = Math.round((W - meta.width) / 2);
    const top = Math.round((H - meta.height) / 2);
    return sharp({
        create: { width: W, height: H, channels: 4, background: OG_BG },
    })
        .composite([{ input: resized, left, top }])
        .png({ quality: 90 })
        .toBuffer();
}

async function main() {
    if (!existsSync(SRC)) {
        console.error(`Source not found: ${SRC}`);
        process.exit(1);
    }
    await ensureDirs();

    const source = sharp(SRC);
    const meta = await source.metadata();
    console.log(`Source: ${meta.width}x${meta.height} ${meta.format} (alpha: ${meta.hasAlpha})`);

    const sourceBuffer = await source.png().toBuffer();

    // 1. Full-color logo for header (preserves aspect ratio + transparency)
    await sharp(sourceBuffer).png({ quality: 95 }).toFile(path.join(PUBLIC, 'logo.png'));
    console.log('✓ public/logo.png');

    // 2. White silhouette for footer / dark backgrounds
    const whiteBuffer = await whiteSilhouette(sourceBuffer);
    await sharp(whiteBuffer).png({ quality: 95 }).toFile(path.join(PUBLIC, 'logo-white.png'));
    console.log('✓ public/logo-white.png');

    // 3. Symbol-only square crop, used for all favicons and PWA icons
    const symbolSquare = await squareSymbol(sourceBuffer, meta);

    // 4. Standard square icons
    for (const size of ICON_SIZES) {
        const buf = await squareResized(symbolSquare, size);
        await sharp(buf).toFile(path.join(ICONS, `icon-${size}x${size}.png`));
        console.log(`✓ public/icons/icon-${size}x${size}.png`);
    }

    // 5. Favicons (root)
    const favBuf = await squareResized(symbolSquare, 32);
    await sharp(favBuf).toFile(path.join(PUBLIC, 'favicon.png'));
    // .ico fallback (modern browsers happily accept a PNG with .ico extension,
    // and sharp doesn't write the legacy .ico format).
    await copyFile(path.join(PUBLIC, 'favicon.png'), path.join(PUBLIC, 'favicon.ico'));
    console.log('✓ public/favicon.png');
    console.log('✓ public/favicon.ico (PNG-as-ICO fallback)');

    // 6. Maskable icons (with ~10% safe-area padding on a dark bg)
    for (const size of MASKABLE_SIZES) {
        const buf = await maskableResized(symbolSquare, size);
        await sharp(buf).toFile(path.join(ICONS, `icon-maskable-${size}x${size}.png`));
        console.log(`✓ public/icons/icon-maskable-${size}x${size}.png`);
    }

    // 7. Open Graph image (1200x630)
    const ogBuf = await buildOg(whiteBuffer);
    await sharp(ogBuf).toFile(path.join(PUBLIC, 'og-image.png'));
    console.log('✓ public/og-image.png (1200x630)');

    console.log('\nAll brand assets regenerated.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
