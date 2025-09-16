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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Copy, Wand2, Image as ImageIcon, Eraser, AlignLeft, AlignCenter, AlignRight, Upload, X, Move, List, ListOrdered, Type, AlignVerticalSpaceAround, ArrowUp, ArrowDown, Smile, Hash, Underline as UnderlineIcon, Strikethrough } from "lucide-react";
import * as htmlToImage from "html-to-image";

// --- Popular LinkedIn Emojis -------------------------------------------------
const POPULAR_EMOJIS = [
  "📼", "🚀", "💡", "🎯", "📈", "⭐", "🔥", "💪", "👏", "🙌",
  "✨", "🎉", "💯", "🌟", "🏆", "📊", "💎", "🔑", "⚡", "🎨",
  "📱", "💻", "🌐", "📺", "🎥", "📸", "🖼️", "🎭", "🎪", "🎨",
  "❤️", "😍", "🤝", "👍", "👋", "😊", "💙", "🧡", "💚", "💜",
  "🌍", "🌎", "🌏", "🌱", "🔗", "📢", "📣", "🎁", "🎈", "🎊"
] as const;

// --- Utilities ---------------------------------------------------------------

// Clamp utility function for value constraints
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

// Convert styled Unicode characters back to normal ASCII
function toNormal(str: string): string {
  return Array.from(str)
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      
      // Bold (Mathematical Alphanumeric Symbols)
      // A-Z: 0x1D400-0x1D419
      if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(65 + (code - 0x1D400));
      // a-z: 0x1D41A-0x1D433
      if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(97 + (code - 0x1D41A));
      // 0-9: 0x1D7CE-0x1D7D7
      if (code >= 0x1D7CE && code <= 0x1D7D7) return String.fromCharCode(48 + (code - 0x1D7CE));
      
      // Italic (Mathematical Alphanumeric Symbols)
      // A-Z: 0x1D434-0x1D44D
      if (code >= 0x1D434 && code <= 0x1D44D) return String.fromCharCode(65 + (code - 0x1D434));
      // a-z: 0x1D44E-0x1D467
      if (code >= 0x1D44E && code <= 0x1D467) return String.fromCharCode(97 + (code - 0x1D44E));
      
      // Bold Italic (Mathematical Alphanumeric Symbols)
      // A-Z: 0x1D468-0x1D481
      if (code >= 0x1D468 && code <= 0x1D481) return String.fromCharCode(65 + (code - 0x1D468));
      // a-z: 0x1D482-0x1D49B
      if (code >= 0x1D482 && code <= 0x1D49B) return String.fromCharCode(97 + (code - 0x1D482));
      
      // Monospace (Mathematical Alphanumeric Symbols)
      // A-Z: 0x1D670-0x1D689
      if (code >= 0x1D670 && code <= 0x1D689) return String.fromCharCode(65 + (code - 0x1D670));
      // a-z: 0x1D68A-0x1D6A3
      if (code >= 0x1D68A && code <= 0x1D6A3) return String.fromCharCode(97 + (code - 0x1D68A));
      // 0-9: 0x1D7F6-0x1D7FF
      if (code >= 0x1D7F6 && code <= 0x1D7FF) return String.fromCharCode(48 + (code - 0x1D7F6));
      
      // Return unchanged if not a styled Unicode character
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
  { key: "4:5", w: 1080, h: 1350, label: "Portrait 4:5" },
  { key: "1:1", w: 1080, h: 1080, label: "Square 1:1" },
  { key: "16:9", w: 1920, h: 1080, label: "Landscape 16:9" },
  { key: "1.91:1", w: 1200, h: 628, label: "Landscape 1.91:1" },
  { key: "2:3", w: 1080, h: 1620, label: "Tall 2:3" },
  { key: "9:16", w: 1080, h: 1920, label: "Vertical 9:16" },
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
  { name: "Dark Charcoal", bg1: "#0b0f19", bg2: "#1e293b", gradient: true, fg: "#eef2ff", accent: "#60a5fa" },
  { name: "Midnight", bg1: "#111827", bg2: "#374151", gradient: true, fg: "#f9fafb", accent: "#6ee7b7" },
  { name: "Violet Fade", bg1: "#8b5cf6", bg2: "#6d28d9", gradient: true, fg: "#ffffff", accent: "#ffffff" },
  { name: "Mint", bg1: "#34d399", bg2: "#10b981", gradient: true, fg: "#052e2b", accent: "#052e2b" },
] as const;


// --- Main Component ----------------------------------------------------------
export default function LinkedInPostStudio() {
  // Authoring
  const [raw, setRaw] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [style, setStyle] = useState("bold");
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Text styling states
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Visuals
  type RatioPreset = (typeof RATIO_PRESETS)[number];
  type ThemePreset = (typeof THEME_PRESETS)[number];

  const [ratio, setRatio] = useState<RatioPreset>(RATIO_PRESETS[0]);
  const [font, setFont] = useState<string>(FONT_FAMILIES[0].v);
  const [fontSize, setFontSize] = useState<number>(48);
  const [lineHeight, setLineHeight] = useState<number>(1.2);
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [verticalAlign, setVerticalAlign] = useState<"top" | "center" | "bottom">("center");
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
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [gradientAngle, setGradientAngle] = useState<number>(135);

  // Image background
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [imageDim, setImageDim] = useState<number>(0.3);

  // Text box overlay
  const [textBoxBg, setTextBoxBg] = useState<string>("#ffffff");
  const [textBoxOpacity, setTextBoxOpacity] = useState<number>(0.9);
  const [textBoxPadding, setTextBoxPadding] = useState<number>(32);
  const [textBoxRadius, setTextBoxRadius] = useState<number>(16);
  const [enableFreePositioning, setEnableFreePositioning] = useState<boolean>(false);
  const [textBoxX, setTextBoxX] = useState<number>(50); // percentage
  const [textBoxY, setTextBoxY] = useState<number>(50); // percentage
  const [textBoxWidth, setTextBoxWidth] = useState<number>(80); // percentage

  // UI preview states
  const [textPreviewExpanded, setTextPreviewExpanded] = useState<boolean>(false);
  const [exportPreviewScale, setExportPreviewScale] = useState<number>(0.45);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  const fitExportToWidth = React.useCallback(() => {
    const el = exportContainerRef.current;
    if (!el) return;
    const available = el.clientWidth - 8; // account for inner padding/scrollbar
    const next = Math.min(1, available / ratio.w);
    setExportPreviewScale(parseFloat(next.toFixed(2)) || 1);
  }, [ratio.w]);

  const fitExportToHeight = React.useCallback(() => {
    const el = exportContainerRef.current;
    if (!el) return;
    const available = el.clientHeight - 8; // account for inner padding/scrollbar
    const next = Math.min(1, available / ratio.h);
    setExportPreviewScale(parseFloat(next.toFixed(2)) || 1);
  }, [ratio.h]);

  // Derived text
  const composed = useMemo(() => {
    const enriched = autoEnrich ? enrichText(raw) : raw;
    // Add hashtags if they exist, with proper spacing
    if (hashtags.trim()) {
      const cleanHashtags = hashtags.trim();
      // Ensure hashtags start with # if not already present
      const formattedHashtags = cleanHashtags
        .split(/\s+/)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .join(' ');
      return enriched + (enriched ? '\n\n' : '') + formattedHashtags;
    }
    return enriched;
  }, [raw, autoEnrich, hashtags]);

  const styledForCopy = useMemo(() => toFancy(composed, style), [composed, style]);

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setBackgroundImage("");
  };

  // Emoji picker functions
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = raw.substring(0, start) + emoji + raw.substring(end);
    
    setRaw(newText);
    setShowEmojiPicker(false);
    
    // Focus back to textarea and position cursor after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // List and text transformation functions
  const insertBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = raw.substring(start, end);
    
    let newText;
    if (selectedText) {
      // Convert selected lines to bullet points
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
      newText = raw.substring(0, start) + bulletLines + raw.substring(end);
    } else {
      // Insert bullet point at cursor
      newText = raw.substring(0, start) + '• ' + raw.substring(end);
    }
    
    setRaw(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  };

  const insertNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = raw.substring(start, end);
    
    let newText;
    if (selectedText) {
      // Convert selected lines to numbered list
      const lines = selectedText.split('\n');
      const numberedLines = lines.map((line, index) => {
        return line.trim() ? `${index + 1}. ${line.trim()}` : line;
      }).join('\n');
      newText = raw.substring(0, start) + numberedLines + raw.substring(end);
    } else {
      // Insert numbered point at cursor
      newText = raw.substring(0, start) + '1. ' + raw.substring(end);
    }
    
    setRaw(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 3, start + 3);
    }, 0);
  };

  const transformCase = (caseType: 'upper' | 'lower' | 'sentence') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return; // No selection

    const selectedText = raw.substring(start, end);
    let transformedText;
    
    switch (caseType) {
      case 'upper':
        transformedText = selectedText.toUpperCase();
        break;
      case 'lower':
        transformedText = selectedText.toLowerCase();
        break;
      case 'sentence':
        transformedText = selectedText.toLowerCase().replace(/(^\w|\.\s+\w)/g, (letter) => letter.toUpperCase());
        break;
      default:
        transformedText = selectedText;
    }
    
    const newText = raw.substring(0, start) + transformedText + raw.substring(end);
    
    setRaw(newText);
    setTimeout(() => {
      textarea.setSelectionRange(start, start + transformedText.length);
      textarea.focus();
    }, 0);
  };

  // Text styling functions
  const toggleStyle = (styleKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Toggle the active style state
    setActiveStyles(prev => 
      prev.includes(styleKey) 
        ? prev.filter(s => s !== styleKey)
        : [...prev, styleKey]
    );
    
    if (start === end) {
      // No selection, just toggle the style for future typing
      return;
    }

    // Get selected text
    const selectedText = raw.substring(start, end);
    
    // Check if we're turning the style on or off
    const isActivating = !activeStyles.includes(styleKey);
    
    let newText;
    if (styleKey === 'underline' || styleKey === 'strike') {
      const mark = styleKey === 'underline' ? '\u0332' : '\u0336';
      if (isActivating) {
        const styledText = Array.from(selectedText).map(ch => ch === '\n' ? ch : ch + mark).join('');
        newText = raw.substring(0, start) + styledText + raw.substring(end);
      } else {
        // remove combining mark from the range
        const cleaned = selectedText.replace(new RegExp(mark, 'g'), '');
        newText = raw.substring(0, start) + cleaned + raw.substring(end);
      }
    } else {
      if (isActivating) {
        // Apply the style transformation
        const styledText = toFancy(selectedText, styleKey);
        newText = raw.substring(0, start) + styledText + raw.substring(end);
      } else {
        // Remove the style by converting back to normal text
        const unstyledText = toNormal(selectedText);
        newText = raw.substring(0, start) + unstyledText + raw.substring(end);
      }
    }
    
    setRaw(newText);
    
    // Restore selection
    setTimeout(() => {
      let newLength = selectedText.length;
      if (styleKey === 'underline' || styleKey === 'strike') {
        if (isActivating) newLength = Array.from(selectedText).map(ch => ch === '\n' ? ch : ch + 'X').join('').length; // +1 per non-newline
        else newLength = selectedText.replace(/\u0332|\u0336/g, '').length;
      } else {
        newLength = isActivating ? toFancy(selectedText, styleKey).length : selectedText.length;
      }
      textarea.setSelectionRange(start, start + newLength);
      textarea.focus();
    }, 0);
  };

  // Persistence
  useEffect(() => {
    // Try v2 first, then fallback to v1
    let saved = localStorage.getItem("lps_v2");
    let isV1Fallback = false;
    
    if (!saved) {
      saved = localStorage.getItem("lps_v1");
      isV1Fallback = true;
    }

    if (saved) {
      try {
        const s = JSON.parse(saved);
        setRaw(s.raw || "");
        setHashtags(s.hashtags || "");
        setStyle(s.style || "bold");
        setAutoEnrich(!!s.autoEnrich);
        const rp = RATIO_PRESETS.find((r) => r.key === s.ratioKey) || RATIO_PRESETS[0];
        setRatio(rp);
        setFont(s.font || FONT_FAMILIES[0].v);
        setFontSize(s.fontSize || 48);
        setLineHeight(s.lineHeight || 1.2);
        setLetterSpacing(s.letterSpacing ?? 0);
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
        setVerticalAlign(s.verticalAlign || "center");
        setGradientType(s.gradientType || "linear");
        setGradientAngle(s.gradientAngle ?? 135);
        
        // v2 features (only if not fallback from v1)
        if (!isV1Fallback) {
          setBackgroundImage(s.backgroundImage || "");
          setImageFit(s.imageFit || "cover");
          setImageDim(s.imageDim ?? 0.3);
          setTextBoxBg(s.textBoxBg || "#ffffff");
          setTextBoxOpacity(s.textBoxOpacity ?? 0.9);
          setTextBoxPadding(s.textBoxPadding ?? 32);
          setTextBoxRadius(s.textBoxRadius ?? 16);
          setEnableFreePositioning(!!s.enableFreePositioning);
          setTextBoxX(s.textBoxX ?? 50);
          setTextBoxY(s.textBoxY ?? 50);
          setTextBoxWidth(s.textBoxWidth ?? 80);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const payload = {
      raw,
      hashtags,
      style,
      autoEnrich,
      ratioKey: ratio.key,
      font,
      fontSize,
      lineHeight,
      letterSpacing,
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
      verticalAlign,
      gradientType,
      gradientAngle,
      // v2 features
      imageFit,
      imageDim,
      textBoxBg,
      textBoxOpacity,
      textBoxPadding,
      textBoxRadius,
      enableFreePositioning,
      textBoxX,
      textBoxY,
      textBoxWidth,
    };
    try {
      localStorage.setItem("lps_v2", JSON.stringify(payload));
    } catch (err) {
      // Avoid crashing the UI if storage quota is exceeded (e.g., Safari private mode or large previous items)
      try {
        // Attempt to remove old large key and retry once
        // Older versions may have stored a large backgroundImage data URL
        localStorage.removeItem("lps_v2");
        localStorage.setItem("lps_v2", JSON.stringify(payload));
      } catch {
        // Give up silently; settings just won't persist this session
        console.warn("LocalStorage quota exceeded — settings not persisted.");
      }
    }
  }, [
    raw,
    hashtags,
    style,
    autoEnrich,
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
    verticalAlign,
    gradientType,
    gradientAngle,
    backgroundImage,
    imageFit,
    imageDim,
    textBoxBg,
    textBoxOpacity,
    textBoxPadding,
    textBoxRadius,
    enableFreePositioning,
    textBoxX,
    textBoxY,
    textBoxWidth,
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
      backgroundColor: backgroundImage ? "transparent" : bg1,
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
      // Ensure background images are captured
      allowTaint: true,
      useCORS: true,
    } as const;

    const fileBase = kebab(composed.replace(/\n+/g, " ")) + `-${ratio.key}`;

    try {
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
    } catch (error) {
      console.error("Export failed:", error);
      // Fallback: try without CORS options
      const fallbackOpts = { ...opts };
      delete (fallbackOpts as Record<string, unknown>).allowTaint;
      delete (fallbackOpts as Record<string, unknown>).useCORS;
      
      try {
        if (type === "png") {
          const dataUrl = await htmlToImage.toPng(node, fallbackOpts);
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${fileBase}.png`;
          a.click();
        } else {
          const dataUrl = await htmlToImage.toJpeg(node, { ...fallbackOpts, quality: 0.92 });
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${fileBase}.jpg`;
          a.click();
        }
      } catch (fallbackError) {
        console.error("Fallback export also failed:", fallbackError);
        alert("Export failed. Please try again or check console for details.");
      }
    }
  }

  // Reset visual setup to defaults
  function resetVisualDefaults() {
    const defTheme = THEME_PRESETS[0];
    setRatio(RATIO_PRESETS[0]);
    setFont(FONT_FAMILIES[0].v);
    setFontSize(48);
    setLineHeight(1.2);
    setLetterSpacing(0);
    setAlign("left");
    setVerticalAlign("center");
    setPadding(64);
    setRadius(32);
    setShowWatermark(false);
    setWatermark("@yourhandle");
    setShowSafe(false);
    applyTheme(defTheme);
    setUseGradient(defTheme.gradient);
    setGradientType("linear");
    setGradientAngle(135);
    setBackgroundImage("");
    setImageFit("cover");
    setImageDim(0.3);
    setTextBoxBg("#ffffff");
    setTextBoxOpacity(0.9);
    setTextBoxPadding(32);
    setTextBoxRadius(16);
    setEnableFreePositioning(false);
    setTextBoxX(50);
    setTextBoxY(50);
    setTextBoxWidth(80);
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
    () => {
      const getGradientBackground = () => {
        if (!useGradient) return bg1;
        
        if (gradientType === "radial") {
          return `radial-gradient(circle, ${bg1}, ${bg2})`;
        } else {
          return `linear-gradient(${gradientAngle}deg, ${bg1}, ${bg2})`;
        }
      };
      
      return {
        width: `${ratio.w}px`,
        height: `${ratio.h}px`,
        color: fg,
        fontFamily: font,
        display: "flex",
        alignItems: verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center",
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        background: getGradientBackground(),
        borderRadius: radius,
        position: "relative" as const,
        overflow: "hidden" as const,
        padding: padding,
        boxShadow: "0 20px 60px rgba(0,0,0,.14)",
      };
    },
    [ratio, fg, font, align, verticalAlign, useGradient, gradientType, gradientAngle, bg1, bg2, radius, padding]
  );

  const textBlockStyle = useMemo(() => {
    const baseStyle = {
      whiteSpace: "pre-wrap" as const,
      fontSize: fontSize,
      lineHeight: lineHeight,
      textAlign: align,
      letterSpacing: `${letterSpacing}px`,
      position: "relative" as const,
      zIndex: 20 as const,
    };

    if (enableFreePositioning) {
      return {
        ...baseStyle,
        position: "absolute" as const,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${(textBoxX - 50) * (ratio.w / 100)}px, ${(textBoxY - 50) * (ratio.h / 100)}px)`,
        width: `${textBoxWidth}%`,
        maxWidth: `${ratio.w - 2 * padding}px`,
        backgroundColor: textBoxOpacity > 0 ? hexToRgba(textBoxBg, textBoxOpacity) : "transparent",
        padding: textBoxOpacity > 0 ? textBoxPadding : 0,
        borderRadius: textBoxOpacity > 0 ? textBoxRadius : 0,
      };
    } else {
      return {
        ...baseStyle,
        width: "100%",
        backgroundColor: backgroundImage && textBoxOpacity > 0 ? hexToRgba(textBoxBg, textBoxOpacity) : "transparent",
        padding: backgroundImage && textBoxOpacity > 0 ? textBoxPadding : 0,
        borderRadius: backgroundImage && textBoxOpacity > 0 ? textBoxRadius : 0,
      };
    }
  }, [fontSize, lineHeight, letterSpacing, align, enableFreePositioning, textBoxX, textBoxY, textBoxWidth, ratio, padding, textBoxBg, textBoxOpacity, textBoxPadding, textBoxRadius, backgroundImage]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Top Row: Text Composer + Text Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left: Text Editor */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wand2 className="h-5 w-5" /> Text Composer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">

              <div className="space-y-2">
                <Label>Main text</Label>
                <Textarea 
                  ref={textareaRef}
                  rows={10} 
                  placeholder={"Write your LinkedIn post draft here…"} 
                  value={raw} 
                  onChange={(e) => setRaw(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags (optional)
                </Label>
                <Input 
                  placeholder="marketing socialmedia business" 
                  value={hashtags} 
                  onChange={(e) => setHashtags(e.target.value)}
                  className="text-sm"
                />
                <div className="text-xs text-slate-500">
                  Add hashtags separated by spaces. The # symbol will be added automatically.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="autoenrich" checked={autoEnrich} onCheckedChange={setAutoEnrich} />
                    <Label htmlFor="autoenrich">Auto enrich</Label>
                  </div>
                </div>

                {/* Unified toolbar: style first, then other tools */}
                <div className="flex flex-wrap items-center gap-1 rounded-md border bg-white p-1">
                  {/* Style: Bold, Italic, Underline, Strike */}
                  {[
                    { key: "bold", label: "Bold" as const },
                    { key: "italic", label: "Italic" as const },
                    { key: "underline", label: "Underline" as const },
                    { key: "strike", label: "Strikethrough" as const },
                  ].map((opt) => {
                    const isActive = activeStyles.includes(opt.key);
                    const label = `${opt.label} ${isActive ? "(ON)" : "(OFF)"}`;
                    return (
                      <Tooltip key={opt.key}>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant={isActive ? "default" : "outline"}
                            className={isActive ? "text-gray-800 shadow-sm" : ""}
                            aria-label={label}
                            onClick={() => toggleStyle(opt.key)}
                          >
                            {opt.key === 'bold' && <span className="font-bold">B</span>}
                            {opt.key === 'italic' && <span className="italic">I</span>}
                            {opt.key === 'underline' && <UnderlineIcon className="h-4 w-4" />}
                            {opt.key === 'strike' && <Strikethrough className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{opt.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  {/* Emoji */}
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          aria-label="Insert emoji"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Insert emoji at cursor</p>
                      </TooltipContent>
                    </Tooltip>
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-80"
                      >
                        <div className="text-sm font-medium mb-2 text-slate-700">Popular LinkedIn Emojis</div>
                        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                          {POPULAR_EMOJIS.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => insertEmoji(emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-lg"
                              title={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  {/* Lists */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={insertBulletList} aria-label="Bullet list">
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bullet list</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={insertNumberedList} aria-label="Numbered list">
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Numbered list</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  {/* Case */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={() => transformCase('upper')} aria-label="UPPERCASE">
                        <span className="text-[10px] font-semibold">UP</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>UPPERCASE</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={() => transformCase('lower')} aria-label="lowercase">
                        <span className="text-[10px] font-semibold">lo</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>lowercase</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={() => transformCase('sentence')} aria-label="Sentence case">
                        <span className="text-[10px] font-semibold">Aa</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sentence case</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  {/* Clear / Reset */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={() => {
                        const unstyledText = toNormal(raw);
                        setRaw(unstyledText);
                        setActiveStyles([]);
                      }} aria-label="Clear style">
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear style</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={() => setRaw("")} aria-label="Remove all text">
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove all text</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="text-xs text-slate-500">Note: LinkedIn doesn’t support rich HTML in posts, but it preserves most Unicode styles above. Always preview to ensure readability.</div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Right: LinkedIn-like Text Preview */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ImageIcon className="h-5 w-5" /> Text Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-white p-4">
                  {/* Minimal LinkedIn feel header */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="https://optim.tildacdn.net/tild3464-6264-4361-b935-343563663462/-/cover/320x320/center/center/-/format/webp/noroot.png.webp"
                      alt="Vahagn Ter-Sarkisyan avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="space-y-0.5">
                      <div className="font-semibold leading-tight">Vahagn Ter-Sarkisyan</div>
                      <div className="text-xs text-slate-500">Generalist • Just now</div>
                    </div>
                  </div>
                  {/* Text content with 3-line clamp when collapsed */}
                  {(() => {
                    const text = composed;
                    const showSeeMore = text.length > 160 || text.split("\n").length > 3;
                    const clampStyle = textPreviewExpanded
                      ? {}
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        };
                    return (
                      <>
                        <div
                          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", ...clampStyle }}
                          className="text-[15px] leading-6 text-slate-900"
                        >
                          {text}
                        </div>
                        {showSeeMore && !textPreviewExpanded && (
                          <button
                            className="mt-1 text-sm text-blue-600 hover:underline"
                            onClick={() => setTextPreviewExpanded(true)}
                          >
                            ...see more
                          </button>
                        )}
                        {textPreviewExpanded && (
                          <button
                            className="mt-2 text-xs text-slate-500 hover:underline"
                            onClick={() => setTextPreviewExpanded(false)}
                          >
                            Collapse
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-end mt-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(composed); }}>
                        <Copy className="h-4 w-4 mr-2" /> Copy for LI
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy the current post text to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Visual Setup (hidden here; moved below) */}
          <motion.div className="hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ImageIcon className="h-5 w-5" /> Visual Setup
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={resetVisualDefaults}>
                        <Eraser className="h-4 w-4 mr-2" /> Clear style
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset visual settings to defaults</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <div className="mt-2">
                      <Slider value={[fontSize]} min={24} max={96} step={1} onValueChange={([v]) => setFontSize(v as number)} />
                    </div>
                  </div>
                  <div>
                    <Label>Line height: {lineHeight.toFixed(2)}</Label>
                    <div className="mt-2">
                      <Slider value={[lineHeight]} min={1.0} max={1.8} step={0.05} onValueChange={([v]) => setLineHeight(v as number)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Text alignment</Label>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={align === "left" ? "default" : "outline"} onClick={() => setAlign("left")}><AlignLeft className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Align text to the left</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={align === "center" ? "default" : "outline"} onClick={() => setAlign("center")}><AlignCenter className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Center align text</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={align === "right" ? "default" : "outline"} onClick={() => setAlign("right")}><AlignRight className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Align text to the right</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Vertical alignment</Label>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={verticalAlign === "top" ? "default" : "outline"} onClick={() => setVerticalAlign("top")}><ArrowUp className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Align text to the top</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={verticalAlign === "center" ? "default" : "outline"} onClick={() => setVerticalAlign("center")}><AlignVerticalSpaceAround className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Center align text vertically</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant={verticalAlign === "bottom" ? "default" : "outline"} onClick={() => setVerticalAlign("bottom")}><ArrowDown className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Align text to the bottom</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Padding: {padding}px</Label>
                    <div className="mt-2">
                      <Slider value={[padding]} min={32} max={160} step={4} onValueChange={([v]) => setPadding(v as number)} />
                    </div>
                  </div>

                  <div>
                    <Label>Corner radius: {radius}px</Label>
                    <div className="mt-2">
                      <Slider value={[radius]} min={0} max={64} step={2} onValueChange={([v]) => setRadius(v as number)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch id="safe" checked={showSafe} onCheckedChange={setShowSafe} />
                    <Label htmlFor="safe">Show safe margins</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Theme presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch id="grad" checked={useGradient} onCheckedChange={setUseGradient} />
                      <Label htmlFor="grad">Use gradient background</Label>
                    </div>
                    
                    {useGradient && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <Label>Gradient type</Label>
                          <Select value={gradientType} onValueChange={(v: "linear" | "radial") => setGradientType(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="linear">Linear</SelectItem>
                              <SelectItem value="radial">Radial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {gradientType === "linear" && (
                          <div>
                            <Label>Gradient angle: {gradientAngle}°</Label>
                            <div className="mt-2">
                              <Slider 
                                value={[gradientAngle]} 
                                min={0} 
                                max={360} 
                                step={15} 
                                onValueChange={([v]) => setGradientAngle(v as number)} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

                  {/* Image Background */}
                  <div className="mt-4 space-y-3">
                    <Label>Background Image</Label>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            className="flex-1"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload JPG/PNG
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload a background image for your post (JPG or PNG format)</p>
                        </TooltipContent>
                      </Tooltip>
                      {backgroundImage && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={clearImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove background image</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {backgroundImage && (
                      <>
                        <div>
                          <Label>Image fit</Label>
                          <Select value={imageFit} onValueChange={(v: "cover" | "contain") => setImageFit(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cover">Cover (fill, may crop)</SelectItem>
                              <SelectItem value="contain">Contain (fit entirely)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Dim image: {Math.round(imageDim * 100)}%</Label>
                          <div className="mt-2">
                            <Slider 
                              value={[imageDim]} 
                              min={0} 
                              max={0.8} 
                              step={0.05} 
                              onValueChange={([v]) => setImageDim(v as number)} 
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Text Box Overlay */}
                  {backgroundImage && (
                    <div className="mt-4 space-y-3">
                      <Label>Text Box Overlay</Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Background</Label>
                          <Input type="color" value={textBoxBg} onChange={(e) => setTextBoxBg(e.target.value)} />
                        </div>
                        <div>
                          <Label>Opacity: {Math.round(textBoxOpacity * 100)}%</Label>
                          <div className="mt-2">
                            <Slider 
                              value={[textBoxOpacity]} 
                              min={0} 
                              max={1} 
                              step={0.05} 
                              onValueChange={([v]) => setTextBoxOpacity(v as number)} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Padding: {textBoxPadding}px</Label>
                          <div className="mt-2">
                            <Slider 
                              value={[textBoxPadding]} 
                              min={0} 
                              max={64} 
                              step={4} 
                              onValueChange={([v]) => setTextBoxPadding(v as number)} 
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Radius: {textBoxRadius}px</Label>
                          <div className="mt-2">
                            <Slider 
                              value={[textBoxRadius]} 
                              min={0} 
                              max={32} 
                              step={2} 
                              onValueChange={([v]) => setTextBoxRadius(v as number)} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          id="freepos" 
                          checked={enableFreePositioning} 
                          onCheckedChange={setEnableFreePositioning} 
                        />
                        <Label htmlFor="freepos">Free positioning</Label>
                        <Move className="h-4 w-4 ml-1" />
                      </div>

                      {enableFreePositioning && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>X offset: {textBoxX}%</Label>
                              <Slider 
                                value={[textBoxX]} 
                                min={0} 
                                max={100} 
                                step={1} 
                                onValueChange={([v]) => setTextBoxX(clamp(v as number, 0, 100))} 
                              />
                            </div>
                            <div>
                              <Label>Y offset: {textBoxY}%</Label>
                              <Slider 
                                value={[textBoxY]} 
                                min={0} 
                                max={100} 
                                step={1} 
                                onValueChange={([v]) => setTextBoxY(clamp(v as number, 0, 100))} 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Width: {textBoxWidth}%</Label>
                            <Slider 
                              value={[textBoxWidth]} 
                              min={20} 
                              max={100} 
                              step={5} 
                              onValueChange={([v]) => setTextBoxWidth(clamp(v as number, 20, 100))} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>

        {/* Bottom Row: Visual Setup + Create & Export Image */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Bottom Left: Visual Setup */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ImageIcon className="h-5 w-5" /> Visual Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Aspect</Label>
                    <Select value={ratio.key} onValueChange={(k) => setRatio(RATIO_PRESETS.find((r) => r.key === k) || RATIO_PRESETS[0])}>
                      <SelectTrigger><SelectValue placeholder="Choose ratio" /></SelectTrigger>
                      <SelectContent>
                        {RATIO_PRESETS.map((r) => (
                          <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label className="mt-3">Font</Label>
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
                      <div className="mt-2">
                        <Slider value={[fontSize]} min={24} max={96} step={1} onValueChange={([v]) => setFontSize(v as number)} />
                      </div>
                    </div>
                    <div>
                      <Label>Line height: {lineHeight.toFixed(2)}</Label>
                      <div className="mt-2">
                        <Slider value={[lineHeight]} min={1.0} max={1.8} step={0.05} onValueChange={([v]) => setLineHeight(v as number)} />
                      </div>
                    </div>
                    <div>
                      <Label>Letter spacing: {letterSpacing.toFixed(2)}px</Label>
                      <div className="mt-2">
                        <Slider value={[letterSpacing]} min={-1} max={10} step={0.1} onValueChange={([v]) => setLetterSpacing(v as number)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Align</Label>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={align === "left" ? "default" : "outline"} onClick={() => setAlign("left")}><AlignLeft className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Align text to the left</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={align === "center" ? "default" : "outline"} onClick={() => setAlign("center")}><AlignCenter className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Center align text</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={align === "right" ? "default" : "outline"} onClick={() => setAlign("right")}><AlignRight className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Align text to the right</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={verticalAlign === "top" ? "default" : "outline"} onClick={() => setVerticalAlign("top")}><ArrowUp className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Align top</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={verticalAlign === "center" ? "default" : "outline"} onClick={() => setVerticalAlign("center")}><AlignVerticalSpaceAround className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Align middle</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant={verticalAlign === "bottom" ? "default" : "outline"} onClick={() => setVerticalAlign("bottom")}><ArrowDown className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Align bottom</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch id="safe2" checked={showSafe} onCheckedChange={setShowSafe} />
                        <Label htmlFor="safe2">Show safe margins</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Layout</Label>
                    <div>
                      <Label>Padding: {padding}px</Label>
                      <div className="mt-2">
                        <Slider value={[padding]} min={32} max={160} step={4} onValueChange={([v]) => setPadding(v as number)} />
                      </div>
                    </div>
                    <div>
                      <Label>Corner radius: {radius}px</Label>
                      <div className="mt-2">
                        <Slider value={[radius]} min={0} max={64} step={2} onValueChange={([v]) => setRadius(v as number)} />
                      </div>
                    </div>

                    <Label className="mt-3">Theme</Label>
                    {/* Quick gradients */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        className="h-8 w-20 rounded-md border border-slate-200"
                        title="White"
                        onClick={() => { setUseGradient(false); setBg1('#ffffff'); setBg2('#ffffff'); setFg('#0f172a'); }}
                        style={{ background: '#ffffff' }}
                      />
                      <button
                        className="h-8 w-20 rounded-md border border-slate-200"
                        title="Colorful"
                        onClick={() => { setUseGradient(true); setGradientType('linear'); setGradientAngle(135); setBg1('#8b5cf6'); setBg2('#f59e0b'); setFg('#ffffff'); }}
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#f59e0b)' }}
                      />
                      <button
                        className="h-8 w-20 rounded-md border border-slate-200"
                        title="Dark"
                        onClick={() => { setUseGradient(true); setGradientType('linear'); setGradientAngle(135); setBg1('#0b0f19'); setBg2('#1e293b'); setFg('#eef2ff'); }}
                        style={{ background: 'linear-gradient(135deg,#0b0f19,#1e293b)' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch id="grad2" checked={useGradient} onCheckedChange={setUseGradient} />
                        <Label htmlFor="grad2">Gradient background</Label>
                      </div>
                      
                      {useGradient && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <Label>Gradient type</Label>
                            <Select value={gradientType} onValueChange={(v: "linear" | "radial") => setGradientType(v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="radial">Radial</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {gradientType === "linear" && (
                            <div>
                              <Label>Gradient angle: {gradientAngle}°</Label>
                              <div className="mt-2">
                                <Slider 
                                  value={[gradientAngle]} 
                                  min={0} 
                                  max={360} 
                                  step={15} 
                                  onValueChange={([v]) => setGradientAngle(v as number)} 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>


                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch id="wm2" checked={showWatermark} onCheckedChange={setShowWatermark} />
                        <Label htmlFor="wm2">Watermark</Label>
                      </div>
                      {showWatermark && (
                        <Input placeholder="@yourhandle or brand" value={watermark} onChange={(e) => setWatermark(e.target.value)} />
                      )}
                    </div>

                    {/* Image Background */}
                    <div className="mt-4 space-y-3">
                    <Label>Background</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('image-upload-live')?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload JPG/PNG
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload a background image for your post (JPG or PNG format)</p>
                            </TooltipContent>
                          </Tooltip>
                          {backgroundImage && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={clearImage}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove background image</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <input
                        id="image-upload-live"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {backgroundImage && (
                        <>
                          <div>
                            <Label>Image fit</Label>
                            <Select value={imageFit} onValueChange={(v: "cover" | "contain") => setImageFit(v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cover">Cover (fill, may crop)</SelectItem>
                                <SelectItem value="contain">Contain (fit entirely)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Dim image: {Math.round(imageDim * 100)}%</Label>
                            <div className="mt-2">
                              <Slider 
                                value={[imageDim]} 
                                min={0} 
                                max={0.8} 
                                step={0.05} 
                                onValueChange={([v]) => setImageDim(v as number)} 
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Text Box Overlay */}
                    {backgroundImage && (
                      <div className="mt-4 space-y-3">
                        <Label>Text box</Label>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Background</Label>
                            <Input type="color" value={textBoxBg} onChange={(e) => setTextBoxBg(e.target.value)} />
                          </div>
                          <div>
                            <Label>Opacity: {Math.round(textBoxOpacity * 100)}%</Label>
                            <div className="mt-2">
                              <Slider 
                                value={[textBoxOpacity]} 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                onValueChange={([v]) => setTextBoxOpacity(v as number)} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Padding: {textBoxPadding}px</Label>
                            <div className="mt-2">
                              <Slider 
                                value={[textBoxPadding]} 
                                min={0} 
                                max={64} 
                                step={4} 
                                onValueChange={([v]) => setTextBoxPadding(v as number)} 
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Radius: {textBoxRadius}px</Label>
                            <div className="mt-2">
                              <Slider 
                                value={[textBoxRadius]} 
                                min={0} 
                                max={32} 
                                step={2} 
                                onValueChange={([v]) => setTextBoxRadius(v as number)} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch 
                            id="freepos2" 
                            checked={enableFreePositioning} 
                            onCheckedChange={setEnableFreePositioning} 
                          />
                          <Label htmlFor="freepos2">Free positioning</Label>
                          <Move className="h-4 w-4 ml-1" />
                        </div>

                        {enableFreePositioning && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>X offset: {textBoxX}%</Label>
                                <Slider 
                                  value={[textBoxX]} 
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  onValueChange={([v]) => setTextBoxX(clamp(v as number, 0, 100))} 
                                />
                              </div>
                              <div>
                                <Label>Y offset: {textBoxY}%</Label>
                                <Slider 
                                  value={[textBoxY]} 
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  onValueChange={([v]) => setTextBoxY(clamp(v as number, 0, 100))} 
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>Width: {textBoxWidth}%</Label>
                              <Slider 
                                value={[textBoxWidth]} 
                                min={20} 
                                max={100} 
                                step={5} 
                                onValueChange={([v]) => setTextBoxWidth(clamp(v as number, 20, 100))} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={resetVisualDefaults}>
                        <Eraser className="h-4 w-4 mr-2" /> Reset to defaults
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset visual settings to defaults</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Right: Create & Export Image */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ImageIcon className="h-5 w-5" /> Create & Export Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                {/* Preview Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[220px] max-w-xs">
                    <Label className="text-sm">Scale: {Math.round(exportPreviewScale * 100)}%</Label>
                    <Slider 
                      value={[exportPreviewScale]} 
                      min={0.25} 
                      max={1} 
                      step={0.05} 
                      onValueChange={([v]) => setExportPreviewScale(v as number)} 
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={fitExportToWidth}>Fit width</Button>
                    <Button size="sm" variant="outline" onClick={fitExportToHeight}>Fit height</Button>
                    <div className="text-sm text-slate-600">
                      {ratio.w} × {ratio.h}px
                    </div>
                  </div>
                </div>

                {/* Stage */}
                <div ref={exportContainerRef} className="w-full overflow-auto rounded-2xl border bg-white p-2 sm:p-4 max-h-[420px]">
                  <div
                    className="mx-auto"
                    style={{
                      width: Math.round(ratio.w * exportPreviewScale),
                      height: Math.round(ratio.h * exportPreviewScale),
                    }}
                  >
                    <div style={{ transform: `scale(${exportPreviewScale})`, transformOrigin: 'top left' }}>
                      <div ref={stageRef} style={stageStyle}>
                        {/* Background Image */}
                        {backgroundImage && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundImage: `url("${backgroundImage}")`,
                              backgroundSize: imageFit,
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                              borderRadius: radius,
                              zIndex: 1,
                            }}
                          />
                        )}

                        {/* Image Dim Overlay */}
                        {backgroundImage && imageDim > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: `rgba(0, 0, 0, ${imageDim})`,
                              borderRadius: radius,
                              zIndex: 3,
                            }}
                          />
                        )}

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
                              zIndex: 8,
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
                            zIndex: 5,
                          }}
                        />

                        {/* Text block - using either free positioning or normal flow */}
                        <div style={textBlockStyle}>
                          {composed}
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
                </div>

                {/* Export buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => exportAs("png")}> 
                        <Download className="h-4 w-4 mr-2" /> Export PNG
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download your post as a PNG image (with transparency support)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" onClick={() => exportAs("jpg")}>
                        <Download className="h-4 w-4 mr-2" /> Export JPG
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download your post as a JPG image (smaller file size)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="text-xs text-slate-500 text-center">
                  Tip: For crisp text on upload, we render at native pixel dimensions with 2× pixel ratio. LinkedIn typically preserves 1080px or 1200px widths well.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-2">
          🌴 Vibe-coded in Pasadena, California, by <a href="https://tervahagn.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Vahagn Ter-Sarkisyan</a> and open for free of charge use.
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
