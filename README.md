# LinkedIn Post Studio

A minimal, fast, Next.js single‑page app to compose, stylize, and export LinkedIn posts. It converts plain text into LinkedIn‑friendly Unicode bold/italic styles and exports image posts at the optimal aspect ratios. Built with Tailwind, shadcn/ui, framer‑motion, and html‑to‑image.

## ✨ Features at a glance

- **Text enrichment**: smart quotes, em‑dashes, bullet normalization, whitespace tidy.
- **Unicode styling**: Copy post text in **𝐛𝐨𝐥𝐝**, *𝑖𝑡𝑎𝑙𝑖𝑐*, ***𝒃𝒐𝒍𝒅 𝒊𝒕𝒂𝒍𝒊𝒄***, and `𝙢𝙤𝙣𝙤` — formats LinkedIn preserves.
- **Visual Post Builder**: export PNG/JPG images sized for LinkedIn.
- **Aspect ratio presets**: 4:5, 1:1, 16:9 + 1.91:1, 2:3, 9:16.
- **Typography controls**: font, size, line height, alignment.
- **Theme controls**: presets + custom colors, gradient on/off.
- **Layout controls**: padding, corner radius, safe‑margin guides.
- **Watermark**: optional handle/brand tag.
- **Persistence**: auto‑saves settings and content to localStorage.
- **(Optional extension)** Image background + text overlay with dimming, background box, and free positioning.
- **Privacy**: All authoring and styling happen client‑side. No servers, no analytics, no tracking.

## 🧰 Technology

- Next.js 14+ (App Router) & TypeScript
- Tailwind CSS + shadcn/ui components
- framer‑motion for subtle UI motion
- html‑to‑image for browser‑side PNG/JPG export

## 🚀 Quick start

### 1) Scaffold the app
```bash
npx create-next-app@latest linkedin-post-studio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd linkedin-post-studio
```

### 2) Install dependencies
```bash
npm install @radix-ui/react-icons @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch class-variance-authority clsx framer-motion html-to-image lucide-react tailwind-merge tailwindcss-animate
```

### 3) Create the page
Create/replace `app/page.tsx` and paste the component from this repo/canvas. Add at the very top:

### 4) Dev
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployments

### Vercel (recommended)
1. Push to GitHub.
2. In Vercel: New Project → Import your repo.
3. Framework: Next.js (auto).
4. Build: `next build` · Output: `.next` (defaults).
5. Click Deploy. (Add a custom domain in Project → Domains.)

### GitHub Pages (static export)
This is a client‑only app, so `next export` works.

Add `next.config.ts`:
```typescript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/linkedin-post-studio' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/linkedin-post-studio/' : '',
}
export default nextConfig
```

Install gh‑pages and add scripts:
```bash
npm install --save-dev gh-pages
```

Ship it:
```bash
npm run deploy
```

Repo → Settings → Pages → Branch: gh-pages.

## 🧭 How to use (workflow)

1. Write your draft in **Text Composer**.
2. Click **Enrich once** (or enable **Auto‑enrich**) to tidy quotes, dashes, bullets.
3. Pick **Copy style** (e.g., Bold) and press **Copy formatted for LinkedIn**.
4. In **Visual Post Builder**, choose an aspect ratio, tune font, line height, alignment, padding.
5. Pick a theme (or set brand colors), toggle gradient if desired, and show safe margins when you want crop guidance.
6. Optionally add a watermark.
7. **Export as PNG or JPG**.

### (Optional extension) Add an image with text overlay
If you're using the extended page variant:

1. Upload a background image (JPG/PNG).
2. Choose **Cover** (fill + crop) or **Contain** (no crop).
3. Increase **Dim background** to boost text contrast.
4. Toggle **Free position** and adjust **Text box width**, X/Y offsets.
5. Toggle **Text background box** and tune color, opacity, padding, radius.
6. Export as usual; the overlay is baked into the PNG/JPG.

The "extension" variant persists settings under localStorage key `lps_v2` (base variant uses `lps_v1`).

## 🔧 Tool / Panel Reference

### 1) Text Composer
- **Prefix / Suffix**: Quick hook/CTA fields automatically added above/below your main text.
- **Main text**: Your draft. Line breaks are preserved.
- **Enrich once**: Runs the formatting pipeline (quotes → " ", dashes → —, bullets → •, whitespace cleanup).
- **Auto‑enrich while typing**: Applies the pipeline reactively.
- **Copy style**: Converts ASCII to Unicode variants.
  - **Bold** → 𝐀‑𝐙 / 𝐚‑𝐳 / 𝟎‑𝟗
  - **Italic, Bold Italic, Monospace, Serif Bold**
- **Copy formatted for LinkedIn**: Writes the Unicode‑styled text to clipboard.

### 2) Visual Post Builder
- **Aspect ratio**: 4:5, 1:1, 16:9, 1.91:1, 2:3, 9:16 (LinkedIn‑friendly presets).
- **Font family / size / line height**: Typography tuning.
- **Align**: Left / Center / Right.
- **Padding**: Inner spacing for non‑free‑position layout.
- **Corner radius**: Poster card rounding.
- **Safe margins**: Dashed overlay to avoid edge crops.
- **Theme presets**: One‑click colorways; you can also set BG #1, BG #2, Text, Accent.
- **Gradient background**: Toggle linear gradient vs solid BG.
- **Watermark**: Toggle + input field; anchors bottom‑right.
- **Export PNG/JPG**: 2× pixel ratio for crisp uploads; filenames are derived from content and ratio.

### 3) (Extension) Image & Overlay Controls
- **Image upload**: Local file only (avoids cross‑origin export issues).
- **Fit**: Cover (fills frame; may crop) or Contain (fits fully; adds letterboxing).
- **Dim background**: Adds translucent black overlay (0–80%).
- **Free position**: Switch to absolutely‑positioned text box.
- **Text box width (%), Offset X/Y (px from center)**.
- **Text background box**: Optional rectangle behind text.
- **Color, Opacity, Padding, Radius**.

## ⚙️ Configuration & Storage

- **Local storage keys**: `lps_v1` (base), `lps_v2` (extension).
- **Stores**: content, style, typography, theme, layout, and extension settings.
- **No external network calls**.

## 🧪 Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
npm run export     # Static export for GitHub Pages
npm run deploy     # Deploy to GitHub Pages
```

## 📁 Suggested structure (minimal)

```
linkedin-post-studio/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── LinkedInPostStudio.tsx
├── public/
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## ♿ Accessibility & content quality

- Keep contrast ≥ 4.5:1 for text (increase dim or use text background box on busy images).
- Avoid very thin fonts and extreme gradients behind small text.
- Use safe margins to prevent edge cropping in feeds.

## ⏱️ Performance notes

- Export renders at 2× pixel ratio (crisp). Very large images can be memory heavy; if exports fail on low‑end devices, reduce image size or ratio.
- Prefer local uploads for images; cross‑origin images can block rendering.

## 🔒 Security & privacy

- All data stays in the browser (localStorage).
- No cookies, no analytics, no third‑party calls.

## 🧩 Roadmap (nice‑to‑haves)

- Multi‑slide carousel export (batch PNGs)
- Drag‑to‑move text box
- Image crop/zoom controls
- Brand presets (lock fonts/colors, 1‑click apply)
- Hashtag/CTA assistant and headline templates
- Export transparent PNG for compositing

## ❓ FAQ / Troubleshooting

- **I see a blank page on GitHub Pages** → Ensure `next.config.ts` has `basePath`/`assetPrefix` set to `/<repo>` and you ran `next export`.
- **Export fails or only shows background** → External images can be blocked by CORS. Use local uploads.
- **Unicode bold looks odd on some devices** → Fallback rendering varies by OS/font. Keep lines short and avoid over‑formatting.
- **Styles missing** → Confirm Tailwind content globs include `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`.

## 📝 License

MIT — feel free to adapt for your workflow. Attribution appreciated but not required.
