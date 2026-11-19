import type { StoreConfig } from './types';

export const THEMES = ['#BD705A', '#E99B78', '#D58B78', '#EACB75', '#86B4C7', '#86A879', '#38bdf8', '#E8CBA5', '#0284c7', '#16a34a', '#9333ea', '#ea580c', '#e11d48'];
export const TINTS = ['#E99B78', '#BD705A', '#E8CBA5', '#F2E5C9', '#EACB75', '#86B4C7', '#D58B78', '#86A879', '#ffffff', '#f8fafc', '#e2e8f0', '#262930', '#1e293b'];
export const FACADES = ['concrete', 'brick', 'stone', 'wood', 'metal'];
export const GLASS = ['clear', 'tinted', 'blue', 'frosted'];
export const WINDOWS = ['grid', 'ribbon', 'tall'];
export const DOORS = ['glass', 'wood', 'steel'];
export const ROOFS = ['flat', 'cornice', 'gabled', 'sloped'];
export const AWNINGS = ['none', 'striped', 'solid', 'canopy'];
export const SIGNS = ['panel', 'neon', 'box', 'blade'];

export interface BuildingCategory {
  id: string;
  label: string;
  description: string;
  templates: string[];
}

export const BUILDING_CATEGORIES: BuildingCategory[] = [
  {
    id: 'commercial',
    label: 'Commercial Buildings',
    description: 'Modern 2-4 storey commercial buildings, creative studios, health clinics, and solar hubs',
    templates: ['comm_creative', 'comm_health', 'comm_logistics', 'comm_solar'],
  },
  {
    id: 'retail',
    label: 'Retail Buildings',
    description: 'Glass-fronted shops, retail storefronts, bistros, banks, and shopping rotunda malls',
    templates: ['retail_mart', 'retail_cafe', 'retail_bank', 'retail_mall'],
  },
  {
    id: 'office',
    label: 'Office Buildings',
    description: 'Digital agencies, education campuses, boutique hotels, and terraced balcony offices',
    templates: ['office_agency', 'office_learn', 'office_hotel', 'office_terrace'],
  },
  {
    id: 'corporate',
    label: 'Corporate Towers',
    description: 'High-rise headquarters, cylindrical rotunda towers, portal arch towers, and monoliths',
    templates: ['corp_skycore', 'corp_prime', 'corp_portal', 'corp_monolith'],
  },
  {
    id: 'landmark',
    label: 'Landmark Towers',
    description: 'Art-deco stepped skyscrapers, modular cantilevered cubes, sail arc towers, and apex pinnacles',
    templates: ['land_stepped', 'land_cubes', 'land_arc', 'land_apex'],
  },
  {
    id: 'glass',
    label: 'Modern Glass Towers',
    description: 'Slanted roofline towers, geometric apex crowns, wrap-frame towers, and cyber towers',
    templates: ['glass_slanted', 'glass_zenith', 'glass_wrap', 'glass_neon'],
  },
  {
    id: 'classic',
    label: 'Classic & Residential',
    description: 'Traditional retail stores, wood boutiques, cafes, residential homes, and central buildings',
    templates: ['tech', 'fashion', 'gaming', 'cafe', 'office', 'boutique', 'grocery', 'house', 'bungalow', 'central'],
  },
];

const base: StoreConfig = {
  name: 'Your Store', tagline: '', website: '', logoUrl: '', theme: '#86B4C7', template: 'tech', mode: 'template',
  facade: 'concrete', tint: '#F2E5C9', glass: 'blue', windows: 'grid', door: 'glass', roof: 'flat', awning: 'none',
  sign: 'panel', lights: true, floors: 2, balcony: false, planters: true, trim: true, modules: [],
};

export const TEMPLATES: Record<string, { label: string; category?: string; patch: Partial<StoreConfig> }> = {
  // ── Original / Classic Templates (100% Preserved) ─────────────────────────
  tech: { label: 'Tech Store', category: 'classic', patch: { theme: '#86B4C7', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 3, door: 'glass' } },
  fashion: { label: 'Fashion Boutique', category: 'classic', patch: { theme: '#BD705A', facade: 'stone', tint: '#E99B78', glass: 'clear', roof: 'cornice', awning: 'solid', sign: 'blade', floors: 3, balcony: true, door: 'wood', windows: 'tall' } },
  gaming: { label: 'Gaming Store', category: 'classic', patch: { theme: '#EACB75', facade: 'metal', tint: '#86B4C7', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'neon', floors: 2, door: 'steel', windows: 'ribbon' } },
  cafe: { label: 'Café', category: 'classic', patch: { theme: '#BD705A', facade: 'brick', tint: '#E8CBA5', glass: 'clear', roof: 'gabled', awning: 'striped', sign: 'box', floors: 2, door: 'wood' } },
  office: { label: 'Office Building', category: 'classic', patch: { theme: '#86B4C7', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'cornice', awning: 'canopy', sign: 'panel', floors: 4, windows: 'ribbon', door: 'glass' } },
  boutique: { label: 'Wood Boutique', category: 'classic', patch: { theme: '#86A879', facade: 'wood', tint: '#E8CBA5', glass: 'clear', roof: 'sloped', awning: 'solid', sign: 'box', floors: 3, door: 'wood', balcony: true } },
  grocery: { label: 'Grocery', category: 'classic', patch: { theme: '#86A879', facade: 'stone', tint: '#EACB75', glass: 'clear', roof: 'flat', awning: 'striped', sign: 'panel', floors: 2, door: 'glass' } },
  house: { label: 'Family House', category: 'classic', patch: { theme: '#D58B78', facade: 'stone', tint: '#F2E5C9', glass: 'clear', roof: 'gabled', awning: 'solid', sign: 'box', floors: 2, door: 'wood', windows: 'grid', balcony: false } },
  bungalow: { label: 'Bungalow', category: 'classic', patch: { theme: '#86A879', facade: 'stone', tint: '#E8CBA5', glass: 'clear', roof: 'gabled', awning: 'none', sign: 'box', floors: 1, door: 'wood', planters: true, trim: true } },
  central: { label: 'Central District', category: 'classic', patch: { theme: '#BD705A', facade: 'concrete', tint: '#F2E5C9', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 5, door: 'glass', lights: true, trim: true } },

  // ── Reference Image 1: Commercial Buildings ────────────────────────────────
  comm_creative: {
    label: 'Creative Studio',
    category: 'commercial',
    patch: { theme: '#d97706', facade: 'concrete', tint: '#262930', glass: 'clear', roof: 'flat', awning: 'none', sign: 'panel', floors: 2, door: 'glass' },
  },
  comm_health: {
    label: 'HealthPlus Clinic',
    category: 'commercial',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#f8fafc', glass: 'blue', roof: 'flat', awning: 'solid', sign: 'box', floors: 2, door: 'glass' },
  },
  comm_logistics: {
    label: 'FastShip Logistics',
    category: 'commercial',
    patch: { theme: '#ea580c', facade: 'metal', tint: '#64748b', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'panel', floors: 1, door: 'steel' },
  },
  comm_solar: {
    label: 'GreenVolt Clean Energy',
    category: 'commercial',
    patch: { theme: '#16a34a', facade: 'concrete', tint: '#f1f5f9', glass: 'blue', roof: 'flat', awning: 'solid', sign: 'panel', floors: 2, door: 'glass' },
  },

  // ── Reference Image 1 & 3: Retail Buildings ────────────────────────────────
  retail_mart: {
    label: 'GlobalMart Store',
    category: 'retail',
    patch: { theme: '#d97706', facade: 'stone', tint: '#e8cba5', glass: 'clear', roof: 'flat', awning: 'striped', sign: 'box', floors: 2, door: 'glass', balcony: true },
  },
  retail_cafe: {
    label: 'UrbanBite Bistro & Cafe',
    category: 'retail',
    patch: { theme: '#ca8a04', facade: 'wood', tint: '#262930', glass: 'clear', roof: 'flat', awning: 'striped', sign: 'neon', floors: 2, door: 'wood' },
  },
  retail_bank: {
    label: 'PrimeBank Financial',
    category: 'retail',
    patch: { theme: '#1e40af', facade: 'stone', tint: '#e2e8f0', glass: 'tinted', roof: 'cornice', awning: 'none', sign: 'panel', floors: 2, door: 'glass' },
  },
  retail_mall: {
    label: 'Mega Mall Rotunda',
    category: 'retail',
    patch: { theme: '#2563eb', facade: 'concrete', tint: '#f8fafc', glass: 'blue', roof: 'cornice', awning: 'canopy', sign: 'box', floors: 3, door: 'glass' },
  },

  // ── Reference Image 1 & 3: Office Buildings ────────────────────────────────
  office_agency: {
    label: 'PixelForge Studio',
    category: 'office',
    patch: { theme: '#9333ea', facade: 'concrete', tint: '#1e1b4b', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'neon', floors: 3, door: 'glass' },
  },
  office_learn: {
    label: 'LearnPro Campus',
    category: 'office',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'flat', awning: 'canopy', sign: 'box', floors: 2, door: 'glass' },
  },
  office_hotel: {
    label: 'Grand Hotel & Suites',
    category: 'office',
    patch: { theme: '#e11d48', facade: 'wood', tint: '#334155', glass: 'clear', roof: 'cornice', awning: 'canopy', sign: 'blade', floors: 4, door: 'glass', balcony: true },
  },
  office_terrace: {
    label: 'Terraced Balcony Tower',
    category: 'office',
    patch: { theme: '#059669', facade: 'concrete', tint: '#f8fafc', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 5, door: 'glass', balcony: true },
  },

  // ── Reference Image 2 & 3: Corporate Towers ────────────────────────────────
  corp_skycore: {
    label: 'SkyCore Cylindrical Tower',
    category: 'corporate',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'flat', awning: 'none', sign: 'panel', floors: 6, door: 'glass' },
  },
  corp_prime: {
    label: 'PrimeHub Corporate HQ',
    category: 'corporate',
    patch: { theme: '#6366f1', facade: 'concrete', tint: '#f8fafc', glass: 'blue', roof: 'flat', awning: 'canopy', sign: 'panel', floors: 7, door: 'glass' },
  },
  corp_portal: {
    label: 'FusionTech Portal Tower',
    category: 'corporate',
    patch: { theme: '#0d9488', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'flat', awning: 'canopy', sign: 'box', floors: 7, door: 'glass' },
  },
  corp_monolith: {
    label: 'Global Bank Monolith',
    category: 'corporate',
    patch: { theme: '#1e3a8a', facade: 'stone', tint: '#f1f5f9', glass: 'blue', roof: 'cornice', awning: 'none', sign: 'box', floors: 7, door: 'glass' },
  },

  // ── Reference Image 2: Landmark Towers ─────────────────────────────────────
  land_stepped: {
    label: 'MetroCorp Stepped Skyscraper',
    category: 'landmark',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'sloped', awning: 'none', sign: 'panel', floors: 8, door: 'glass' },
  },
  land_cubes: {
    label: 'InnoPark Modular Cubes',
    category: 'landmark',
    patch: { theme: '#eab308', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'flat', awning: 'none', sign: 'box', floors: 7, door: 'glass' },
  },
  land_arc: {
    label: 'NovaVista Sail Arc Tower',
    category: 'landmark',
    patch: { theme: '#06b6d4', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'sloped', awning: 'none', sign: 'panel', floors: 7, door: 'glass' },
  },
  land_apex: {
    label: 'Vertex Pyramid Tower',
    category: 'landmark',
    patch: { theme: '#2563eb', facade: 'concrete', tint: '#f8fafc', glass: 'blue', roof: 'gabled', awning: 'none', sign: 'box', floors: 7, door: 'glass' },
  },

  // ── Reference Image 2 & 3: Modern Glass Towers ─────────────────────────────
  glass_slanted: {
    label: 'GlobalTech Slanted Tower',
    category: 'glass',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'sloped', awning: 'canopy', sign: 'panel', floors: 7, door: 'glass' },
  },
  glass_zenith: {
    label: 'Zenith Geometric Crown',
    category: 'glass',
    patch: { theme: '#0f766e', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'sloped', awning: 'none', sign: 'box', floors: 7, door: 'glass' },
  },
  glass_wrap: {
    label: 'TechNova Wrap-Frame',
    category: 'glass',
    patch: { theme: '#0284c7', facade: 'concrete', tint: '#ffffff', glass: 'blue', roof: 'flat', awning: 'canopy', sign: 'panel', floors: 7, door: 'glass' },
  },
  glass_neon: {
    label: 'MediaHub Cyber Tower',
    category: 'glass',
    patch: { theme: '#a855f7', facade: 'concrete', tint: '#1e293b', glass: 'tinted', roof: 'flat', awning: 'none', sign: 'box', floors: 7, door: 'glass' },
  },
};

export const EXPANDED_TEMPLATES = new Set([
  'comm_creative', 'comm_health', 'comm_logistics', 'comm_solar',
  'retail_mart', 'retail_cafe', 'retail_bank', 'retail_mall',
  'office_agency', 'office_learn', 'office_hotel', 'office_terrace',
  'corp_skycore', 'corp_prime', 'corp_portal', 'corp_monolith',
  'land_stepped', 'land_cubes', 'land_arc', 'land_apex',
  'glass_slanted', 'glass_zenith', 'glass_wrap', 'glass_neon',
]);

export function isExpandedTemplate(template: string): boolean {
  return EXPANDED_TEMPLATES.has(template);
}

export function defaultConfig(template = 'tech', over: Partial<StoreConfig> = {}): StoreConfig {
  return { ...base, template, ...(TEMPLATES[template]?.patch || {}), ...over, modules: over.modules || [] };
}
