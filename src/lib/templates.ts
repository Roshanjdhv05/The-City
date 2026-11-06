import type { StoreConfig } from './types';

export const THEMES = ['#3d9bbf', '#4f6fcf', '#d9803f', '#5f9f63', '#c2607f', '#d6a93d'];
export const TINTS = ['#ffffff', '#f0d9bf', '#e8c9c9', '#cfe0cf', '#c9d6e4', '#d8cfe6'];
export const FACADES = ['concrete', 'brick', 'stone', 'wood', 'metal'];
export const GLASS = ['clear', 'tinted', 'blue', 'frosted'];
export const WINDOWS = ['grid', 'ribbon', 'tall'];
export const DOORS = ['glass', 'wood', 'steel'];
export const ROOFS = ['flat', 'cornice', 'gabled', 'sloped'];
export const AWNINGS = ['none', 'striped', 'solid', 'canopy'];
export const SIGNS = ['panel', 'neon', 'box', 'blade'];

const base: StoreConfig = {
  name: 'Your Store', tagline: '', website: '', logoUrl: '', theme: '#22d3ee', template: 'tech', mode: 'template',
  facade: 'concrete', tint: '#e8e6e1', glass: 'clear', windows: 'grid', door: 'glass', roof: 'flat', awning: 'none',
  sign: 'panel', lights: true, floors: 2, balcony: false, planters: true, trim: true, modules: [],
};

export const TEMPLATES: Record<string, { label: string; patch: Partial<StoreConfig> }> = {
  tech:     { label: 'Tech Store',       patch: { theme: '#4f6fcf', facade: 'concrete', tint: '#c9d6e4', glass: 'clear', roof: 'flat', awning: 'none', sign: 'panel', floors: 3, door: 'glass' } },
  fashion:  { label: 'Fashion Boutique', patch: { theme: '#c2607f', facade: 'stone', tint: '#e8c9c9', glass: 'clear', roof: 'cornice', awning: 'solid', sign: 'blade', floors: 3, balcony: true, door: 'wood', windows: 'tall' } },
  gaming:   { label: 'Gaming Store',     patch: { theme: '#7565c2', facade: 'metal', tint: '#d8cfe6', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'neon', floors: 2, door: 'steel', windows: 'ribbon' } },
  cafe:     { label: 'Café',             patch: { theme: '#c8584a', facade: 'brick', tint: '#ffffff', glass: 'clear', roof: 'gabled', awning: 'striped', sign: 'box', floors: 2, door: 'wood' } },
  office:   { label: 'Office Building',  patch: { theme: '#3d9bbf', facade: 'concrete', tint: '#f0d9bf', glass: 'blue', roof: 'cornice', awning: 'canopy', sign: 'panel', floors: 4, windows: 'ribbon', door: 'glass' } },
  boutique: { label: 'Wood Boutique',    patch: { theme: '#5f9f63', facade: 'wood', tint: '#ffffff', glass: 'clear', roof: 'sloped', awning: 'solid', sign: 'box', floors: 3, door: 'wood', balcony: true } },
  grocery:  { label: 'Grocery',          patch: { theme: '#5f9f63', facade: 'stone', tint: '#cfe0cf', glass: 'clear', roof: 'flat', awning: 'striped', sign: 'panel', floors: 2, door: 'glass' } },
  house:    { label: 'Family House',     patch: { theme: '#c2607f', facade: 'stone', tint: '#f2e2c8', glass: 'clear', roof: 'gabled', awning: 'solid', sign: 'box', floors: 2, door: 'wood', windows: 'grid', balcony: false } },
  bungalow: { label: 'Bungalow',         patch: { theme: '#3f6b4a', facade: 'stone', tint: '#ffffff', glass: 'clear', roof: 'gabled', awning: 'none', sign: 'box', floors: 1, door: 'wood', planters: true, trim: true } },
  central:  { label: 'Central District', patch: { theme: '#2f5d8a', facade: 'concrete', tint: '#d6ccb8', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 5, door: 'glass', lights: true, trim: true } },
};

export function defaultConfig(template = 'tech', over: Partial<StoreConfig> = {}): StoreConfig {
  return { ...base, template, ...(TEMPLATES[template]?.patch || {}), ...over, modules: over.modules || [] };
}
