export type Tier = 'free' | 'premium' | 'featured' | 'corner';
export type PlotStatus = 'available' | 'reserved';
export interface Plot { id: string; district: string; category: string; tier: Tier; price: number; x: number; z: number; rot: number; w: number; d: number; status: PlotStatus; region?: string; landmark?: boolean }
/** kind 'seg': centre line (x0,z0)->(x1,z1). kind 'ring': circle centred (x0,z0) with radius x1 (z1 unused). */
export interface Road { id: string; kind?: 'seg' | 'ring'; x0: number; z0: number; x1: number; z1: number; w: number; region?: string }
export interface Region { id: string; name: string; direction: string; params?: any; created_at?: string }
export interface Place { ox: number; oz: number; rot: number }
export type ModKind = 'wall' | 'glass' | 'window' | 'door' | 'roof' | 'sign' | 'decor';
export interface Mod { id: string; kind: ModKind; gx: number; gz: number; level: number; rot: number }
export interface StoreConfig {
  name: string; tagline: string; website: string; logoUrl: string; theme: string;
  template: string; mode: 'template' | 'modular';
  facade: string; tint: string; glass: string; windows: string; door: string;
  roof: string; awning: string; sign: string; lights: boolean;
  floors: number; balcony: boolean; planters: boolean; trim: boolean;
  modules: Mod[]; place?: Place;
}
export interface Store { plotId: string; ownerId: string | null; createdAt?: string; config: StoreConfig; visits: number; clicks: number }
export interface User { id: string; email: string }
