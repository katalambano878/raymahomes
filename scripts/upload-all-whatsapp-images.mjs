#!/usr/bin/env node
/**
 * Upload every WhatsApp JPG (original filename) and sync product_images from chat order.
 * Photo-only messages attach to the NEXT product that has a price.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const CHAT_DIR = process.argv[2] || '/tmp/rayma-whatsapp';

function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) throw new Error('.env.local not found');
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function parsePrice(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(\d+(?:\.\d{1,2})?)\s*✅?\s*$/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function parseName(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\d+(?:\.\d{1,2})?\s*✅?\s*$/.test(l))
    .filter((l) => !/(\d+)\s*(?:in\s*stock|instock|available)/i.test(l))
    .filter((l) => !/^colors?\s+available/i.test(l));

  const nameLines = [];
  for (const line of lines) {
    if (/^\d+\s*colors?\s+available/i.test(line)) break;
    if (/^(white|grey|gray|green|orange|orange-red|powder green|silver)/i.test(line) && line.includes(',')) break;
    nameLines.push(line);
  }
  return nameLines.join(' ').replace(/\s+/g, ' ').replace(/\s*✅\s*/g, '').trim();
}

function parseChatEntries(chatPath, imageDir) {
  const raw = readFileSync(chatPath, 'utf8').replace(/\u200e/g, '');
  const chunks = raw.split(/(?=\[\d{2}\/\d{2}\/\d{4},)/).filter(Boolean);

  const entries = [];
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

    const price = parsePrice(body);
    const isProduct = price !== null && body.replace(/image omitted/i, '').trim().length > 0;

    if (isProduct) {
      const images = [];
      for (const filename of pendingImages) images.push(filename);
      pendingImages = [];
      if (attachment) images.push(attachment);

      const entry = {
        name: parseName(body),
        price,
        images,
        sourceAttachment: attachment,
      };
      entries.push(entry);
      lastProduct = entry;
      lastProductTime = messageTime;
    } else if (attachment) {
      const gapMinutes =
        lastProductTime && messageTime ? minutesBetween(lastProductTime, messageTime) : Infinity;

      if (gapMinutes > 10) {
        pendingImages.push(attachment);
      } else if (lastProduct) {
        lastProduct.images.push(attachment);
      } else {
        pendingImages.push(attachment);
      }
    }
  }

  if (pendingImages.length && lastProduct) {
    lastProduct.images.push(...pendingImages);
  }

  return entries;
}

async function uploadFile(supabase, localPath, storagePath) {
  const buffer = readFileSync(localPath);
  const ext = extname(localPath).slice(1) || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error } = await supabase.storage.from('products').upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload ${storagePath}: ${error.message}`);

  const { data } = supabase.storage.from('products').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env vars');

  const chatPath = join(CHAT_DIR, '_chat.txt');
  if (!existsSync(chatPath)) throw new Error(`Missing ${chatPath}`);

  const supabase = createClient(supabaseUrl, serviceKey);
  const jpgFiles = readdirSync(CHAT_DIR).filter((f) => f.toLowerCase().endsWith('.jpg')).sort();

  console.log(`Uploading ${jpgFiles.length} images with original WhatsApp filenames...`);
  const urlByFilename = {};

  for (const filename of jpgFiles) {
    const localPath = join(CHAT_DIR, filename);
    const storagePath = `whatsapp-import/original/${filename}`;
    urlByFilename[filename] = await uploadFile(supabase, localPath, storagePath);
    console.log(`  ✓ ${filename}`);
  }

  const chatEntries = parseChatEntries(chatPath, CHAT_DIR);
  console.log(`\nSyncing product_images for ${chatEntries.length} products from chat order...`);

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, slug, price, metadata')
    .contains('tags', ['whatsapp-import']);
  if (prodErr) throw prodErr;

  const bySourceAttachment = new Map();
  for (const p of products || []) {
    const src = p.metadata?.source_attachment;
    if (src) bySourceAttachment.set(src, p);
  }

  let synced = 0;
  let imageRows = 0;

  for (const entry of chatEntries) {
    const primaryFile = entry.images[entry.images.length - 1];
    let product =
      (entry.sourceAttachment && bySourceAttachment.get(entry.sourceAttachment)) ||
      products.find((p) => p.name === entry.name && Number(p.price) === entry.price);

    if (!product) {
      console.warn(`  ⚠ No DB product for "${entry.name}" — skipping image sync`);
      continue;
    }

    const { error: delErr } = await supabase.from('product_images').delete().eq('product_id', product.id);
    if (delErr) throw delErr;

    const inserts = entry.images.map((filename, idx) => ({
      product_id: product.id,
      url: urlByFilename[filename],
      position: idx,
      alt_text: entry.name,
    }));

    const { error: insErr } = await supabase.from('product_images').insert(inserts);
    if (insErr) throw insErr;

    synced++;
    imageRows += inserts.length;
    console.log(`  ✓ ${entry.name}: ${inserts.length} image(s)`);
  }

  console.log(`\nDone.`);
  console.log(`  Uploaded to storage: ${jpgFiles.length}`);
  console.log(`  Products synced: ${synced}`);
  console.log(`  product_images rows: ${imageRows}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
