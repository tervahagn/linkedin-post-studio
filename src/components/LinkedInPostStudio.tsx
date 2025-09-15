"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Copy, Sparkles, Wand2, Image as ImageIcon, Eraser, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import * as htmlToImage from "html-to-image";

// --- Utilities ---------------------------------------------------------------

// Convert ASCII to styled Unicode variants (LinkedIn-safe fancy text)
// Styles: bold, italic, boldItalic, monospace, serifBold
function toFancy(str: string, style = "bold") {
  const ranges: Record<string, { A?: number; a?: number; d?: number }> = {
    bold: { A: 0x1d400, a: 0x1d41a, d: 0x1d7ce },
    italic: { A: 0x1d434, a: 0x1d44e },
    boldItalic: { A: 0x1d468, a: 0x1d482 },
    monospace: { A: 0x1d670, a: 0x1d68a, d: 0x1d7f6 },
    serifBold: { A: 0x1d400, a: 0x1d41a, d: 0x1d7ce }, // alias to bold (serif by default)
  };
  const r = ranges[style] || ranges.bold;

  return Array.from(str)
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      // A-Z
      if (code >= 65 && code <= 90 && r.A) return String.fromCodePoint(r.A + (code - 65));
      // a-z
      if (code >= 97 && code <= 122 && r.a) return String.fromCodePoint(r.a + (code - 97));
      // 0-9
      if (code >= 48 && code <= 57 && r.d) return String.fromCodePoint(r.d + (code - 48));
      return ch;
    })
    .join("");
}

// Light-touch text enrichment – punctuation niceties, bullets, spacing
function enrichText(input: string) {
  let s = input;
  s = s.replace(/\.{3}/g, "…"); // ellipsis
  s = s.replace(/ ?-- ?/g, " — "); // em dash
  // smart quotes (simple heuristic)
  s = s.replace(/\"(.*?)\"/g, "“$1”");
  s = s.replace(/\'(.*?)\'/g, "‘$1’");
  // turn lines starting with * or - into bullets
  s = s.replace(/^(?:\*|-)\s+/gm, "• ");
  // fix double spaces
  s = s.replace(/ {2,}/g, " ");
  return s.trim();
}

// Build a filename from content
const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "linkedin-post";

// --- Aspect Ratios + Presets -------------------------------------------------
const RATIO_PRESETS = [
  { key: "4:5", w: 1080, h: 1350, label: "Portrait 4:5 (1080×1350) – recommended" },
  { key: "1:1", w: 1080, h: 1080, label: "Square 1:1 (1080×1080) – recommended" },
  { key: "16:9", w: 1920, h: 1080, label: "Landscape 16:9 (1920×1080) – common" },
  // Additional popular LinkedIn-friendly formats
  { key: "1.91:1", w: 1200, h: 628, label: "Landscape 1.91:1 (1200×628) – link format" },
  { key: "2:3", w: 1080, h: 1620, label: "Tall 2:3 (1080×1620) – carousel alt" },
  { key: "9:16", w: 1080, h: 1920, label: "Vertical 9:16 (1080×1920) – mobile-first" },
] as const;

const FONT_FAMILIES = [
  { v: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", label: "System Sans" },
  { v: "Georgia, 'Times New Roman', Times, serif", label: "Serif" },
  { v: "'Inter', ui-sans-serif, system-ui", label: "Inter" },
  { v: "'IBM Plex Sans', ui-sans-serif, system-ui", label: "IBM Plex Sans" },
  { v: "'Poppins', ui-sans-serif, system-ui", label: "Poppins" },
] as const;

const THEME_PRESETS = [
  { name: "Clean Light", bg1: "#ffffff", bg2: "#ffffff", gradient: false, fg: "#0f172a", accent: "#2563eb" },
  { name: "Classic Blue", bg1: "#0ea5e9", bg2: "#0369a1", gradient: true, fg: "#ffffff", accent: "#ffffff" },
  { name: "Charcoal", bg1: "#0b0f19", bg2: "#0b0f19", gradient: false, fg: "#eef2ff", accent: "#60a5fa" },
  { name: "Violet Fade", bg1: "#8b5cf6", bg2: "#6d28d9", gradient: true, fg: "#ffffff", accent: "#ffffff" },
  { name: "Mint", bg1: "#34d399", bg2: "#10b981", gradient: true, fg: "#052e2b", accent: "#052e2b" },
] as const;

const TEMPLATES: Record<string, (t: string) => string> = {
  blank: (t) => t,
  quote: (t) => `“${t || "Make it simple, but significant."}”\n\n— Your Name`,
  tip: (t) => `Pro Tip: ${t || "Start by sharing a concrete win before the lesson."}\n\n• Context\n• Action\n• Results`,
  announcement: (t) => `We’re live! 🚀\n\n${t || "Just shipped a feature that cuts reporting time by 40%."}\n\n🔗 Read more in the first comment.`,
};

// --- Main Component ----------------------------------------------------------
export default function LinkedInPostStudio() {
  // Authoring
  const [raw, setRaw] = useState("");
  const [style, setStyle] = useState("bold");
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [template, setTemplate] = useState("blank");

  // Visuals
  type RatioPreset = (typeof RATIO_PRESETS)[number];
  type ThemePreset = (typeof THEME_PRESETS)[number];

  const [ratio, setRatio] = useState<RatioPreset>(RATIO_PRESETS[0]);
  const [font, setFont] = useState<string>(FONT_FAMILIES[0].v);
  const [fontSize, setFontSize] = useState<number>(48);
  const [lineHeight, setLineHeight] = useState<number>(1.2);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [padding, setPadding] = useState<number>(64);
  const [radius, setRadius] = useState<number>(32);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [watermark, setWatermark] = useState("@yourhandle");
  const [showSafe, setShowSafe] = useState<boolean>(false);

  // Theme
  const [theme, setTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [bg1, setBg1] = useState<string>(theme.bg1);
  const [bg2, setBg2] = useState<string>(theme.bg2);
  const [fg, setFg] = useState<string>(theme.fg);
  const [accent, setAccent] = useState<string>(theme.accent);
  const [useGradient, setUseGradient] = useState<boolean>(theme.gradient);

  // Derived text
  const composed = useMemo(() => {
    const base = TEMPLATES[template](raw);
    const enriched = autoEnrich ? enrichText(base) : base;
    const withAffixes = [prefix, enriched, suffix].filter(Boolean).join("\n");
    return withAffixes;
  }, [raw, autoEnrich, prefix, suffix, template]);

  const styledForCopy = useMemo(() => toFancy(composed, style), [composed, style]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("lps_v1");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setRaw(s.raw || "");
        setStyle(s.style || "bold");
        setAutoEnrich(!!s.autoEnrich);
        setPrefix(s.prefix || "");
        setSuffix(s.suffix || "");
        const rp = RATIO_PRESETS.find((r) => r.key === s.ratioKey) || RATIO_PRESETS[0];
        setRatio(rp);
        setFont(s.font || FONT_FAMILIES[0].v);
        setFontSize(s.fontSize || 48);
        setLineHeight(s.lineHeight || 1.2);
        setAlign(s.align || "left");
        setPadding(s.padding || 64);
        setRadius(s.radius || 32);
        setShowWatermark(!!s.showWatermark);
        setWatermark(s.watermark || "@yourhandle");
        setShowSafe(!!s.showSafe);
        const t = THEME_PRESETS[s.themeIndex ?? 0] || THEME_PRESETS[0];
        setTheme(t);
        setBg1(s.bg1 || t.bg1);
        setBg2(s.bg2 || t.bg2);
        setFg(s.fg || t.fg);
        setAccent(s.accent || t.accent);
        setUseGradient(s.useGradient ?? t.gradient);
        setTemplate(s.template || "blank");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const payload = {
      raw,
      style,
      autoEnrich,
      prefix,
      suffix,
      ratioKey: ratio.key,
      font,
      fontSize,
      lineHeight,
      align,
      padding,
      radius,
      showWatermark,
      watermark,
      showSafe,
      themeIndex: THEME_PRESETS.findIndex((t) => t.name === theme.name),
      bg1,
      bg2,
      fg,
      accent,
      useGradient,
      template,
    };
    localStorage.setItem("lps_v1", JSON.stringify(payload));
  }, [
    raw,
    style,
    autoEnrich,
    prefix,
    suffix,
    ratio,
    font,
    fontSize,
    lineHeight,
    align,
    padding,
    radius,
    showWatermark,
    watermark,
    showSafe,
    theme,
    bg1,
    bg2,
    fg,
    accent,
    useGradient,
    template,
  ]);

  // Export
  const stageRef = useRef<HTMLDivElement | null>(null);

  async function exportAs(type: "png" | "jpg" = "png") {
    const node = stageRef.current;
    if (!node) return;

    const scale = 2; // retina crispness
    const width = ratio.w;
    const height = ratio.h;

    const opts = {
      backgroundColor: bg1,
      width,
      height,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        width: `${width / scale}px`,
        height: `${height / scale}px`,
      },
      pixelRatio: scale,
      quality: 0.98,
    } as const;

    const fileBase = kebab(styledForCopy.replace(/\n+/g, " ")) + `-${ratio.key}`;

    if (type === "png") {
      const dataUrl = await htmlToImage.toPng(node, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileBase}.png`;
      a.click();
    } else {
      const dataUrl = await htmlToImage.toJpeg(node, { ...opts, quality: 0.92 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileBase}.jpg`;
      a.click();
    }
  }

  function applyTemplate(name: string) {
    setTemplate(name);
  }

  function applyTheme(p: ThemePreset) {
    setTheme(p);
    setBg1(p.bg1);
    setBg2(p.bg2);
    setFg(p.fg);
    setAccent(p.accent);
    setUseGradient(p.gradient);
  }

  // Stage styles
  const stageStyle = useMemo(
    () => ({
      width: `${ratio.w}px`,
      height: `${ratio.h}px`,
      color: fg,
      fontFamily: font,
      display: "flex",
      alignItems: "center",
      justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
      background: useGradient ? `linear-gradient(135deg, ${bg1}, ${bg2})` : (bg1 as string),
      borderRadius: radius,
      position: "relative" as const,
      overflow: "hidden" as const,
      padding: padding,
      boxShadow: "0 20px 60px rgba(0,0,0,.14)",
    }),
    [ratio, fg, font, align, useGradient, bg1, bg2, radius, padding]
  );

  const textBlockStyle = useMemo(
    () => ({
      width: "100%",
      whiteSpace: "pre-wrap" as const,
      fontSize: fontSize,
      lineHeight: lineHeight,
      textAlign: align,
    }),
    [fontSize, lineHeight, align]
  );

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5" /> Text Composer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prefix">Prefix (optional)</Label>
                  <Input id="prefix" placeholder="Hook / emoji / context" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="suffix">Suffix (optional)</Label>
                  <Input id="suffix" placeholder="CTA, hashtags, etc." value={suffix} onChange={(e) => setSuffix(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Main text</Label>
                <Textarea rows={10} placeholder={"Write your LinkedIn post draft here…"} value={raw} onChange={(e) => setRaw(e.target.value)} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary" onClick={() => setRaw(enrichText(raw))}>
                  <Sparkles className="h-4 w-4 mr-2" /> Enrich once
                </Button>
                <div className="flex items-center gap-2">
                  <Switch id="autoenrich" checked={autoEnrich} onCheckedChange={setAutoEnrich} />
                  <Label htmlFor="autoenrich">Auto-enrich while typing</Label>
                </div>
                <Button size="sm" variant="outline" onClick={() => setRaw("")}> <Eraser className="h-4 w-4 mr-2"/> Clear</Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Copy style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bold">𝐁𝐨𝐥𝐝 (LinkedIn-friendly)</SelectItem>
                      <SelectItem value="italic">𝑰𝒕𝒂𝒍𝒊𝒄</SelectItem>
                      <SelectItem value="boldItalic">𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄</SelectItem>
                      <SelectItem value="monospace">𝙈𝙤𝙣𝙤𝙨𝙥𝙖𝙘𝙚</SelectItem>
                      <SelectItem value="serifBold">Serif 𝐁𝐨𝐥𝐝</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-end">
                  <Button className="w-full" onClick={async () => { await navigator.clipboard.writeText(styledForCopy); }}>
                    <Copy className="h-4 w-4 mr-2" /> Copy formatted for LinkedIn
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-500">Note: LinkedIn doesn’t support rich HTML in posts, but it preserves most Unicode styles above. Always preview to ensure readability.</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Visual Exporter */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ImageIcon className="h-5 w-5" /> Visual Post Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Controls */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Aspect ratio</Label>
                  <Select value={ratio.key} onValueChange={(k) => setRatio(RATIO_PRESETS.find((r) => r.key === k) || RATIO_PRESETS[0])}>
                    <SelectTrigger><SelectValue placeholder="Choose ratio" /></SelectTrigger>
                    <SelectContent>
                      {RATIO_PRESETS.map((r) => (
                        <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label className="mt-3">Font family</Label>
                  <Select value={font} onValueChange={setFont}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((f) => (
                        <SelectItem key={f.v} value={f.v}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-4">
                    <Label>Font size: {fontSize}px</Label>
                    <Slider value={[fontSize]} min={24} max={96} step={1} onValueChange={([v]) => setFontSize(v as number)} />
                  </div>
                  <div>
                    <Label>Line height: {lineHeight.toFixed(2)}</Label>
                    <Slider value={[lineHeight]} min={1.0} max={1.8} step={0.05} onValueChange={([v]) => setLineHeight(v as number)} />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Button size="icon" variant={align === "left" ? "default" : "outline"} onClick={() => setAlign("left")}><AlignLeft className="h-4 w-4" /></Button>
                    <Button size="icon" variant={align === "center" ? "default" : "outline"} onClick={() => setAlign("center")}><AlignCenter className="h-4 w-4" /></Button>
                    <Button size="icon" variant={align === "right" ? "default" : "outline"} onClick={() => setAlign("right")}><AlignRight className="h-4 w-4" /></Button>
                  </div>

                  <div className="mt-4">
                    <Label>Padding: {padding}px</Label>
                    <Slider value={[padding]} min={32} max={160} step={4} onValueChange={([v]) => setPadding(v as number)} />
                  </div>

                  <div>
                    <Label>Corner radius: {radius}px</Label>
                    <Slider value={[radius]} min={0} max={64} step={2} onValueChange={([v]) => setRadius(v as number)} />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch id="safe" checked={showSafe} onCheckedChange={setShowSafe} />
                    <Label htmlFor="safe">Show safe margins</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Theme presets</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEME_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => applyTheme(p)} className="rounded-xl overflow-hidden border border-slate-200">
                        <div className="h-12 w-full" style={{ background: p.gradient ? `linear-gradient(135deg, ${p.bg1}, ${p.bg2})` : p.bg1 }} />
                        <div className="text-xs px-2 py-1">{p.name}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label>BG #1</Label>
                      <Input type="color" value={bg1} onChange={(e) => setBg1(e.target.value)} />
                    </div>
                    <div>
                      <Label>BG #2</Label>
                      <Input type="color" value={bg2} onChange={(e) => setBg2(e.target.value)} />
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
                    </div>
                    <div>
                      <Label>Accent</Label>
                      <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch id="grad" checked={useGradient} onCheckedChange={setUseGradient} />
                    <Label htmlFor="grad">Use gradient background</Label>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Template</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(TEMPLATES).map((t) => (
                        <Button key={t} variant={template === t ? "default" : "outline"} onClick={() => applyTemplate(t)}>{t}</Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch id="wm" checked={showWatermark} onCheckedChange={setShowWatermark} />
                      <Label htmlFor="wm">Watermark</Label>
                    </div>
                    {showWatermark && (
                      <Input placeholder="@yourhandle or brand" value={watermark} onChange={(e) => setWatermark(e.target.value)} />
                    )}
                  </div>
                </div>
              </div>

              {/* Stage */}
              <div className="w-full overflow-auto rounded-2xl border bg-white p-4">
                <div className="mx-auto" style={{ width: ratio.w }}>
                  <div ref={stageRef} style={stageStyle}>
                    {/* Safe margins overlay (for visually centering & crop awareness) */}
                    {showSafe && (
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          border: "2px dashed rgba(255,255,255,.25)",
                          margin: 24,
                          borderRadius: Math.max(0, radius - 24),
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    {/* Accent bar */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 6,
                        height: "100%",
                        background: accent,
                        opacity: 0.5,
                      }}
                    />

                    {/* Text */}
                    <div style={textBlockStyle}>
                      {styledForCopy}
                    </div>

                    {/* Watermark */}
                    {showWatermark && (
                      <div style={{ position: "absolute", right: 16, bottom: 12, opacity: 0.8, fontSize: Math.max(14, fontSize * 0.33) }}>
                        {watermark}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => exportAs("png")}> 
                  <Download className="h-4 w-4 mr-2" /> Export PNG
                </Button>
                <Button variant="secondary" onClick={() => exportAs("jpg")}>
                  <Download className="h-4 w-4 mr-2" /> Export JPG
                </Button>
              </div>

              <div className="text-xs text-slate-500">
                Tip: For crisp text on upload, we render at native pixel dimensions with 2× pixel ratio. LinkedIn typically preserves 1080px or 1200px widths well.
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer helper */}
        <div className="lg:col-span-2 text-center text-xs text-slate-500 pt-2">
          Built for faster LinkedIn posting: enrich → copy → image export. Save your favorite theme as defaults (auto-saved locally).
        </div>
      </div>
    </div>
  );
}
