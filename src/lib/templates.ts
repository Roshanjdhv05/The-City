import type { StoreConfig } from './types';

export const THEMES = ['#BD705A', '#E99B78', '#D58B78', '#EACB75', '#86B4C7', '#86A879', '#38bdf8', '#E8CBA5'];
export const TINTS = ['#E99B78', '#BD705A', '#E8CBA5', '#F2E5C9', '#EACB75', '#86B4C7', '#D58B78', '#86A879'];
export const FACADES = ['concrete', 'brick', 'stone', 'wood', 'metal'];
export const GLASS = ['clear', 'tinted', 'blue', 'frosted'];
export const WINDOWS = ['grid', 'ribbon', 'tall'];
export const DOORS = ['glass', 'wood', 'steel'];
export const ROOFS = ['flat', 'cornice', 'gabled', 'sloped'];
export const AWNINGS = ['none', 'striped', 'solid', 'canopy'];
export const SIGNS = ['panel', 'neon', 'box', 'blade'];

const base: StoreConfig = {
  name: 'Your Store', tagline: '', website: '', logoUrl: '', theme: '#86B4C7', template: 'tech', mode: 'template',
  facade: 'concrete', tint: '#F2E5C9', glass: 'blue', windows: 'grid', door: 'glass', roof: 'flat', awning: 'none',
  sign: 'panel', lights: true, floors: 2, balcony: false, planters: true, trim: true, modules: [],
};

export const TEMPLATES: Record<string, { label: string; patch: Partial<StoreConfig> }> = {
  tech: { label: 'Tech Store', patch: { theme: '#86B4C7', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 3, door: 'glass' } },
  fashion: { label: 'Fashion Boutique', patch: { theme: '#BD705A', facade: 'stone', tint: '#E99B78', glass: 'clear', roof: 'cornice', awning: 'solid', sign: 'blade', floors: 3, balcony: true, door: 'wood', windows: 'tall' } },
  gaming: { label: 'Gaming Store', patch: { theme: '#EACB75', facade: 'metal', tint: '#86B4C7', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'neon', floors: 2, door: 'steel', windows: 'ribbon' } },
  cafe: { label: 'Café', patch: { theme: '#BD705A', facade: 'brick', tint: '#E8CBA5', glass: 'clear', roof: 'gabled', awning: 'striped', sign: 'box', floors: 2, door: 'wood' } },
  office: { label: 'Office Building', patch: { theme: '#86B4C7', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'cornice', awning: 'canopy', sign: 'panel', floors: 4, windows: 'ribbon', door: 'glass' } },
  boutique: { label: 'Wood Boutique', patch: { theme: '#86A879', facade: 'wood', tint: '#E8CBA5', glass: 'clear', roof: 'sloped', awning: 'solid', sign: 'box', floors: 3, door: 'wood', balcony: true } },
  grocery: { label: 'Grocery', patch: { theme: '#86A879', facade: 'stone', tint: '#EACB75', glass: 'clear', roof: 'flat', awning: 'striped', sign: 'panel', floors: 2, door: 'glass' } },
  house: { label: 'Family House', patch: { theme: '#D58B78', facade: 'stone', tint: '#F2E5C9', glass: 'clear', roof: 'gabled', awning: 'solid', sign: 'box', floors: 2, door: 'wood', windows: 'grid', balcony: false } },
  bungalow: { label: 'Bungalow', patch: { theme: '#86A879', facade: 'stone', tint: '#E8CBA5', glass: 'clear', roof: 'gabled', awning: 'none', sign: 'box', floors: 1, door: 'wood', planters: true, trim: true } },
  central: { label: 'Central District', patch: { theme: '#BD705A', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 5, door: 'glass', lights: true, trim: true } },
};

export function defaultConfig(template = 'tech', over: Partial<StoreConfig> = {}): StoreConfig {
  return { ...base, template, ...(TEMPLATES[template]?.patch || {}), ...over, modules: over.modules || [] };
}
