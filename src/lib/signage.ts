'use client';
import * as THREE from 'three';
import { useEffect, useMemo } from 'react';

export function shade(hex: string, f: number) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }

export function drawSign(c: HTMLCanvasElement, o: { name: string; theme: string; style: string; img?: HTMLImageElement | null }) {
  const g = c.getContext('2d')!, w = c.width, h = c.height; g.clearRect(0, 0, w, h);
  const open = o.style === 'neon' || o.style === 'blade';
  if (!open) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a4a7e'); gr.addColorStop(1, '#27335c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = o.theme; g.fillRect(0, h - 14, w, 14);
  }
  const ms = h * 0.62, mx = 48, my = (h - ms) / 2;
  if (o.img) { g.save(); g.beginPath(); g.roundRect(mx, my, ms, ms, 18); g.clip(); g.drawImage(o.img, mx, my, ms, ms); g.restore(); }
  else {
    g.lineWidth = 9; g.strokeStyle = shade(o.theme, 1.5); g.beginPath(); g.roundRect(mx, my, ms, ms, 18); g.stroke();
    g.fillStyle = '#fff'; g.font = `800 ${ms * 0.6}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((o.name[0] || 'S').toUpperCase(), mx + ms / 2, my + ms / 2 + 4);
  }
  const text = (o.name || 'YOUR STORE').toUpperCase(), tx = mx + ms + 50, maxW = w - tx - 50;
  let fs = h * 0.56; g.font = `800 ${fs}px Arial, sans-serif`;
  while (g.measureText(text).width > maxW && fs > 24) { fs -= 4; g.font = `800 ${fs}px Arial, sans-serif`; }
  g.textAlign = 'left'; g.textBaseline = 'middle';
  if (open) { g.shadowColor = shade(o.theme, 1.6); g.shadowBlur = 28; }
  g.fillStyle = '#ffffff'; g.fillText(text, tx, h / 2 + 4); g.shadowBlur = 0;
}

const signTexCache = new Map<string, { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }>();

export function useSignTexture(name: string, theme: string, style: string, logoUrl: string) {
  const key = `${name || 'STORE'}|${theme}|${style}`;
  const entry = useMemo(() => {
    let item = signTexCache.get(key);
    if (!item) {
      const canvas = document.createElement('canvas');
      canvas.width = 1536;
      canvas.height = 256;
      drawSign(canvas, { name, theme, style });
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      item = { canvas, tex };
      signTexCache.set(key, item);
    }
    return item;
  }, [key, name, theme, style]);

  useEffect(() => {
    if (!logoUrl) return;
    let dead = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (dead) return;
      drawSign(entry.canvas, { name, theme, style, img });
      entry.tex.needsUpdate = true;
    };
    img.src = logoUrl;
    return () => { dead = true; };
  }, [name, theme, style, logoUrl, entry]);

  return entry.tex;
}

/** Small cached text-card texture (for-sale boards etc). */
const cardCache = new Map<string, THREE.CanvasTexture>();
export function cardTex(l1: string, l2: string, color = '#0e2a5c') {
  const k = l1 + l2 + color; let t = cardCache.get(k); if (t) return t;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = color; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#22d3ee'; g.lineWidth = 8; g.strokeRect(8, 8, 496, 240);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 72px Arial'; g.fillText(l1, 256, 120); g.fillStyle = '#22d3ee'; g.font = '700 48px Arial'; g.fillText(l2, 256, 200);
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cardCache.set(k, t); return t;
}
