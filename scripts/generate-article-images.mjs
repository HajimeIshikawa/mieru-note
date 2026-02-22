#!/usr/bin/env node

/**
 * 記事バナー画像生成スクリプト
 *
 * Gemini API で背景画像を生成し、sharp でタイトルテキストを合成する。
 * 出力: public/images/articles/{slug}.png (1200x630)
 *
 * 使い方:
 *   npm run generate:images
 *   node scripts/generate-article-images.mjs [slug]
 *
 * .env に GEMINI_API_KEY を設定してください。
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- .env 読み込み ----------
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnv();
const OUTPUT_DIR = path.resolve(__dirname, '../public/images/articles');
const WIDTH = 1200;
const HEIGHT = 630;

// ---------- 記事定義（タイトルは2行以内・短めに） ----------
const articles = [
  {
    slug: 'what-is-icl',
    title: 'ICL手術とは？\nメリット・デメリットを解説',
    category: 'ICL',
    prompt: 'A clean, modern medical illustration of a human eye cross-section with a tiny transparent lens being placed inside, soft teal and cyan gradient background, no text, minimalist style, high quality, professional medical infographic aesthetic',
  },
  {
    slug: 'icl-cost',
    title: 'ICL手術の費用相場は？\n料金比較と安くする方法',
    category: '費用',
    prompt: 'An abstract financial concept illustration with Japanese yen coins and banknotes floating gently, warm amber and gold gradient background, subtle eye/lens icon, no text, minimalist modern style, clean professional look',
  },
  {
    slug: 'icl-vs-lasik',
    title: 'ICL vs レーシック\nどっちが自分に合う？',
    category: '比較',
    prompt: 'A balanced scale or comparison concept illustration, one side showing a contact lens (ICL) and the other a laser beam (LASIK), violet and purple gradient background, no text, modern minimalist style, clean medical aesthetic',
  },
  {
    slug: 'icl-experience',
    title: '【ICL体験記】30代が\n手術を決意するまで',
    category: '体験談',
    prompt: 'A person looking at a clear blue sky through a window with soft morning light, representing clear vision and hope, warm teal and amber tones, no text, photorealistic style with soft bokeh, emotional and personal feel',
  },
  {
    slug: 'icl-clinic-comparison',
    title: 'ICLおすすめクリニック4選\n費用・実績・保証を比較',
    category: 'クリニック比較',
    prompt: 'A modern eye clinic interior with clean white walls and medical equipment, rose and pink soft gradient overlay, multiple clinic buildings in the background, no text, professional healthcare aesthetic, minimalist illustration style',
  },
  {
    slug: 'icl-tokyo',
    title: '東京のICLおすすめ\nクリニック5選',
    category: 'クリニック比較',
    prompt: 'Tokyo skyline with Tokyo Tower and modern buildings, soft rose and pink gradient background, subtle eye care/medical icon overlay, no text, clean modern illustration style, professional and trustworthy feel',
  },
  {
    slug: 'icl-osaka',
    title: '大阪のICLおすすめ\nクリニック5選',
    category: 'クリニック比較',
    prompt: 'Osaka cityscape with Osaka Castle and Dotonbori area, soft rose and pink gradient background, subtle medical/eye care icon overlay, no text, clean modern illustration style, professional and warm feel',
  },
  {
    slug: 'icl-nagoya',
    title: '名古屋のICLおすすめ\nクリニック4選',
    category: 'クリニック比較',
    prompt: 'Nagoya cityscape with Nagoya Castle and TV Tower, soft rose and pink gradient background, subtle medical/eye care icon overlay, no text, clean modern illustration style, professional and welcoming feel',
  },
];

// ---------- カテゴリ色定義 ----------
const categoryColors = {
  'ICL': { bg: '#0d9488', badge: '#14b8a6', label: 'ICL' },
  '費用': { bg: '#d97706', badge: '#f59e0b', label: '費用' },
  '比較': { bg: '#7c3aed', badge: '#8b5cf6', label: '比較' },
  '体験談': { bg: '#0d9488', badge: '#14b8a6', label: '体験談' },
  'クリニック比較': { bg: '#e11d48', badge: '#f43f5e', label: 'クリニック比較' },
};

// ---------- Gemini API ----------
async function generateBackgroundImage(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Generate a background image for an article banner. The image should be 1200x630 pixels, landscape orientation. DO NOT include any text in the image. ${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // 画像パートを探す
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
  }

  throw new Error('No image data in Gemini response');
}

// ---------- SVG テキストオーバーレイ（モバイル可読性重視） ----------
function createTextOverlay(title, category) {
  const colors = categoryColors[category] || categoryColors['ICL'];

  const lines = title.split('\n');

  // フォントサイズ: モバイル（375px幅）で約20px相当になるよう大きめに
  const fontSize = 64;
  const lineHeight = fontSize * 1.35;

  const textBlockHeight = lines.length * lineHeight;

  // テキストを画像の下半分に配置
  const textStartY = HEIGHT - textBlockHeight - 60;

  // カテゴリバッジ（大きめ、タイトル上端から十分な余白を確保）
  // textStartY はタイトル1行目のベースライン。上端は約 fontSize*0.8 上にある。
  const titleTopY = textStartY - fontSize * 0.8;
  const badgeHeight = 38;
  const badgeGap = 16;
  const badgeBottomY = titleTopY - badgeGap;
  const badgeText = colors.label;
  const badgeFontSize = 20;
  const badgeWidth = badgeText.length * 28 + 40;
  // バッジテキストのベースライン（バッジ矩形の中央に配置）
  const badgeRectY = badgeBottomY - badgeHeight;
  const badgeTextY = badgeRectY + badgeHeight * 0.65;

  const titleLines = lines
    .map(
      (line, i) => `
    <text x="70" y="${textStartY + i * lineHeight}"
      font-family="'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif"
      font-size="${fontSize}" font-weight="700" fill="white"
      filter="url(#shadow)">
      ${escapeXml(line)}
    </text>`
    )
    .join('');

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.8)" />
    </filter>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.05)" />
      <stop offset="30%" stop-color="rgba(0,0,0,0.3)" />
      <stop offset="70%" stop-color="rgba(0,0,0,0.6)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.8)" />
    </linearGradient>
  </defs>

  <!-- 濃いめのグラデーションオーバーレイ -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlay)" />

  <!-- カテゴリバッジ -->
  <rect x="66" y="${badgeRectY}" width="${badgeWidth}" height="${badgeHeight}" rx="19"
    fill="${colors.badge}" />
  <text x="${66 + badgeWidth / 2}" y="${badgeTextY}"
    font-family="'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif"
    font-size="${badgeFontSize}" font-weight="700" fill="white" text-anchor="middle">
    ${escapeXml(badgeText)}
  </text>

  <!-- タイトルテキスト -->
  ${titleLines}

  <!-- サイト名 -->
  <text x="${WIDTH - 50}" y="${HEIGHT - 35}"
    font-family="'Shippori Mincho', serif"
    font-size="22" font-weight="500" fill="rgba(255,255,255,0.85)"
    text-anchor="end" filter="url(#shadow)">
    みえるノート
  </text>
</svg>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------- 画像合成 ----------
async function compositeImage(backgroundBuffer, title, category, outputPath) {
  // 背景画像を1200x630にリサイズ
  const bg = await sharp(backgroundBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .toBuffer();

  // SVGオーバーレイ作成
  const svgOverlay = createTextOverlay(title, category);

  // 合成
  await sharp(bg)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 90 })
    .toFile(outputPath);
}

// ---------- フォールバック: グラデーション背景 ----------
async function createGradientBackground(category) {
  const colors = categoryColors[category] || categoryColors['ICL'];
  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.bg}" />
        <stop offset="100%" stop-color="${colors.badge}" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
    <!-- subtle pattern -->
    <circle cx="900" cy="200" r="300" fill="rgba(255,255,255,0.05)" />
    <circle cx="200" cy="500" r="200" fill="rgba(255,255,255,0.03)" />
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ---------- メイン ----------
async function main() {
  console.log('=== 記事バナー画像生成スクリプト ===\n');

  // 出力ディレクトリ作成
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 特定のslugが指定されている場合はそれだけ生成
  const targetSlug = process.argv[2];
  const targets = targetSlug
    ? articles.filter((a) => a.slug === targetSlug)
    : articles;

  if (targets.length === 0) {
    console.error(`slug "${targetSlug}" not found`);
    process.exit(1);
  }

  const hasApiKey = !!process.env.GEMINI_API_KEY;
  if (!hasApiKey) {
    console.log('GEMINI_API_KEY not set. Using gradient fallback backgrounds.\n');
  }

  for (let i = 0; i < targets.length; i++) {
    const article = targets[i];
    const outputPath = path.join(OUTPUT_DIR, `${article.slug}.png`);

    console.log(`[${i + 1}/${targets.length}] ${article.slug}`);
    console.log(`  Title: ${article.title.replace(/\n/g, ' ')}`);

    try {
      let bgBuffer;

      if (hasApiKey) {
        console.log('  Generating background with Gemini API...');
        bgBuffer = await generateBackgroundImage(article.prompt);
      } else {
        console.log('  Using gradient fallback...');
        bgBuffer = await createGradientBackground(article.category);
      }

      console.log('  Compositing text overlay...');
      await compositeImage(bgBuffer, article.title, article.category, outputPath);

      console.log(`  -> ${outputPath}`);
      console.log('  Done!\n');
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      console.log('  Falling back to gradient background...');

      try {
        const fallbackBg = await createGradientBackground(article.category);
        await compositeImage(
          fallbackBg,
          article.title,
          article.category,
          outputPath
        );
        console.log(`  -> ${outputPath} (fallback)`);
        console.log('  Done!\n');
      } catch (fallbackErr) {
        console.error(`  Fallback also failed: ${fallbackErr.message}\n`);
      }
    }

    // レートリミット対策: API使用時は5秒待機
    if (hasApiKey && i < targets.length - 1) {
      console.log('  Waiting 5s (rate limit)...\n');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log('=== Complete! ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
