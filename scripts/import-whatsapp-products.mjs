#!/usr/bin/env node
/**
 * Import products from WhatsApp chat export (images + _chat.txt)
 * Usage: node scripts/import-whatsapp-products.mjs /path/to/extracted/folder
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const CHAT_DIR = process.argv[2] || '/tmp/rayma-whatsapp';

function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) throw new Error('.env.local not found');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function parsePrice(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(\d+(?:\.\d{1,2})?)\s*✅?\s*$/);
    if (m) return parseFloat(m[1]);
  }
  const inline = text.match(/(\d+(?:\.\d{1,2})?)\s*✅?(?:\s|$)/);
  return inline ? parseFloat(inline[1]) : null;
}

function parseStock(text) {
  const m = text.match(/(\d+)\s*(?:in\s*stock|instock|available)/i);
  return m ? parseInt(m[1], 10) : 1;
}

function parseName(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\d+(?:\.\d{1,2})?\s*✅?\s*$/.test(l))
    .filter((l) => !/(\d+)\s*(?:in\s*stock|instock|available)/i.test(l))
    .filter((l) => !/^colors?\s+available/i.test(l))
    .filter((l) => !/^(white|grey|green|orange|silver|powder)/i.test(l) || l.length > 20);

  const nameLines = [];
  for (const line of lines) {
    if (/^\d+\s*colors?\s+available/i.test(line)) break;
    if (/^(white|grey|gray|green|orange|orange-red|powder green|silver)/i.test(line) && line.includes(',')) break;
    if (/^\d+\s*cm$/i.test(line)) {
      nameLines.push(line);
      continue;
    }
    if (/^[\d.]+\s*["″']?\s*(?:plate|bowl)/i.test(line) || line.includes('plate') || line.includes('Bowl')) {
      nameLines.push(line);
      continue;
    }
    nameLines.push(line);
  }

  let name = nameLines.join(' ').replace(/\s+/g, ' ').trim();
  name = name.replace(/\s*✅\s*/g, '').trim();
  return name || 'Unnamed Product';
}

function parseDescription(text, name) {
  const extras = [];
  const sizeMatch = text.match(/\b(\d+(?:\.\d+)?\s*cm)\b/i);
  if (sizeMatch && !name.toLowerCase().includes(sizeMatch[1].toLowerCase())) {
    extras.push(`Size: ${sizeMatch[1]}`);
  }
  const capacityMatch = text.match(/\b(\d+(?:\.\d+)?\s*L)\b/i);
  if (capacityMatch) extras.push(`Capacity: ${capacityMatch[1]}`);

  const colorsMatch = text.match(/colors?\s+available\s*\n([\s\S]+?)(?:\n\n|$)/i);
  if (colorsMatch) {
    extras.push(`Colors available: ${colorsMatch[1].replace(/\n/g, ', ').trim()}`);
  } else {
    const colorLine = text.split('\n').find((l) => /^green$/i.test(l.trim()) || /^silver$/i.test(l.trim()));
    if (colorLine) extras.push(`Color: ${colorLine.trim()}`);
  }

  if (/features/i.test(text)) {
    const feat = text.match(/(\d+\s+features?)/i);
    if (feat) extras.push(feat[1]);
  }

  return extras.length ? extras.join('\n') : null;
}

function categorize(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();
  if (/blender|microwave|electric sink|kettle|coal pot|industrial/.test(text)) {
    if (/whistle kettle|plate rack|wooden/.test(text)) {
      if (/rack|basket|dispenser|trash|spice|holder|cutlery|laddle|ladle|oil bottle|flask/.test(text)) {
        return 'storage-racks';
      }
      return 'cooking-ware';
    }
    return /blender|microwave|electric|industrial/.test(text) ? 'kitchen-electronic' : 'appliances';
  }
  if (/plate|bowl|matcha/.test(text)) return 'bowls';
  if (/cutlery|laddle|ladle|silicon set|spice rack/.test(text)) return 'cutlery';
  if (/rack|basket|dispenser|trash|holder|flask|oil bottle|sink|stand/.test(text)) return 'storage-racks';
  if (/pot|pan|cast iron|granite|nonstick|kettle|coal|set of/.test(text)) return 'cooking-ware';
  return 'cooking-ware';
}

function parseChat(chatPath, imageDir) {
  const raw = readFileSync(chatPath, 'utf8').replace(/\u200e/g, '');
  const chunks = raw.split(/(?=\[\d{2}\/\d{2}\/\d{4},)/).filter(Boolean);

  const products = [];
  let lastProduct = null;
  let lastProductTime = null;
  let pendingImages = [];

  const parseMessageTime = (chunk) => {
    const m = chunk.match(/^\[(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, dd, mm, yyyy, hh, min, sec] = m;
    return new Date(`${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}:${sec}`);
  };

  const minutesBetween = (a, b) => (b - a) / 60000;

  for (const chunk of chunks) {
    const headerMatch = chunk.match(/^\[(\d{2}\/\d{2}\/\d{4}),[^\]]+\]\s*Rayma Homes:\s*/);
    if (!headerMatch) continue;

    const messageTime = parseMessageTime(chunk);
    let body = chunk.slice(headerMatch[0].length);
    const attachMatch = body.match(/<attached:\s*(.+?)>/);
    const attachment = attachMatch ? attachMatch[1].trim() : null;
    body = body.replace(/<attached:\s*.+?>/, '').trim();

    if (/end-to-end encrypted/i.test(body)) continue;
    if (/image omitted/i.test(body) && !attachment) continue;

    const imagePath = attachment ? join(imageDir, attachment) : null;
    if (imagePath && !existsSync(imagePath)) {
      console.warn(`Missing image file: ${attachment}`);
    }

    const price = parsePrice(body);
    const isProductMessage = price !== null && body.replace(/image omitted/i, '').trim().length > 0;

    if (isProductMessage) {
      const name = parseName(body);
      const stock = parseStock(body);
      const description = parseDescription(body, name);
      const images = [];

      for (const pending of pendingImages) {
        if (existsSync(pending)) images.push(pending);
      }
      pendingImages = [];

      if (imagePath && existsSync(imagePath)) images.push(imagePath);

      const product = {
        name,
        price,
        quantity: stock,
        description,
        images,
        sourceAttachment: attachment,
      };
      products.push(product);
      lastProduct = product;
      lastProductTime = messageTime;
    } else if (attachment && imagePath && existsSync(imagePath)) {
      const gapMinutes =
        lastProductTime && messageTime ? minutesBetween(lastProductTime, messageTime) : Infinity;

      if (gapMinutes > 10) {
        pendingImages.push(imagePath);
      } else if (lastProduct) {
        lastProduct.images.push(imagePath);
      } else {
        pendingImages.push(imagePath);
      }
    }
  }

  return products;
}

async function uploadImage(supabase, localPath, storagePath) {
  const buffer = readFileSync(localPath);
  const ext = extname(localPath).slice(1) || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error } = await supabase.storage.from('products').upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);

  const { data } = supabase.storage.from('products').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const chatPath = join(CHAT_DIR, '_chat.txt');
  if (!existsSync(chatPath)) throw new Error(`Chat file not found: ${chatPath}`);

  const products = parseChat(chatPath, CHAT_DIR);
  console.log(`Parsed ${products.length} products from WhatsApp export`);

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: categories, error: catError } = await supabase.from('categories').select('id, slug');
  if (catError) throw catError;
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const { data: existingProducts } = await supabase.from('products').select('slug, name');
  const existingSlugs = new Set((existingProducts || []).map((p) => p.slug));

  const results = [];

  for (const product of products) {
    let baseSlug = slugify(product.name);
    let slug = baseSlug;
    let n = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${n++}`;
    }
    existingSlugs.add(slug);

    const categorySlug = categorize(product.name, product.description || '');
    const categoryId = categoryBySlug[categorySlug] || categoryBySlug['cooking-ware'];

    const imageUrls = [];
    for (let i = 0; i < product.images.length; i++) {
      const localPath = product.images[i];
      const storagePath = `whatsapp-import/${slug}-${i}${extname(localPath) || '.jpg'}`;
      const url = await uploadImage(supabase, localPath, storagePath);
      imageUrls.push(url);
      console.log(`  Uploaded image ${i + 1}/${product.images.length} for "${product.name}"`);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert([
        {
          name: product.name,
          slug,
          description: product.description,
          short_description: product.description?.split('\n')[0] || null,
          price: product.price,
          quantity: product.quantity,
          track_quantity: true,
          category_id: categoryId,
          status: 'active',
          featured: false,
          tags: ['whatsapp-import'],
          metadata: { import_source: 'whatsapp', source_attachment: product.sourceAttachment },
        },
      ])
      .select('id, name, slug, price, quantity')
      .single();

    if (insertError) {
      console.error(`FAILED: ${product.name}`, insertError.message);
      results.push({ name: product.name, ok: false, error: insertError.message });
      continue;
    }

    if (imageUrls.length > 0) {
      const { error: imgError } = await supabase.from('product_images').insert(
        imageUrls.map((url, idx) => ({
          product_id: inserted.id,
          url,
          position: idx,
          alt_text: product.name,
        }))
      );
      if (imgError) {
        console.error(`Image link failed for ${product.name}:`, imgError.message);
      }
    }

    console.log(`✓ ${inserted.name} — GHS ${inserted.price} — stock ${inserted.quantity} — ${imageUrls.length} image(s)`);
    results.push({ name: inserted.name, ok: true, slug: inserted.slug, images: imageUrls.length });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone: ${ok}/${products.length} products imported`);
  if (failed.length) {
    console.log('Failures:', failed);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
