'use client';
import { create } from 'zustand';
import { supabase } from './supabase';
import { DISTRICTS, CITY } from './city';
import { D2R, polar } from './geom';

export const BILLBOARD_STORAGE_KEY = 'thecity.billboards.v2';

export interface Billboard {
  id: string;
  name: string;
  market: string;
  location: string;
  plotId?: string;
  wallSide: 'back_wall' | 'side_wall_left' | 'side_wall_right' | 'corner' | 'freestanding';
  format: 'landscape' | 'portrait';
  size: 'monument' | 'large' | 'medium' | 'portrait';
  width: number;
  height: number;
  elevation: number;
  x: number;
  y: number;
  z: number;
  rot: number;
  status: 'active' | 'inactive' | 'empty';
  adTitle: string;
  adDescription?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  targetUrl?: string;
  lighting: boolean;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample Ads for Initial Realistic City Appearance
// ─────────────────────────────────────────────────────────────────────────────
interface SampleAd {
  title: string;
  desc: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  targetUrl: string;
}

const SAMPLE_ADS_BY_MARKET: Record<string, SampleAd[]> = {
  SAAS: [
    {
      title: 'CloudScale Pro · Global Multi-Cloud Mesh',
      desc: 'Deploy resilient cloud microservices in 40+ regions with automated failover and zero-downtime migrations.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://cloudscale.example.com',
    },
    {
      title: 'Datapipe Analytics · Real-time Stream Engine',
      desc: 'Enterprise ETL pipeline ingesting 100M events/sec with sub-second OLAP querying.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://datapipe.example.com',
    },
    {
      title: 'SaaS Pulse · Executive Revenue Analytics',
      desc: 'Unified billing and subscription telemetry with real-time churn forecasting.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://saaspulse.example.com',
    },
  ],
  AI: [
    {
      title: 'Synapse Core · 70B Autonomous Reasoning Agent',
      desc: 'Fine-tuned enterprise foundation models executing multi-step business workflows natively.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://synapsecore.example.com',
    },
    {
      title: 'NeuralVision 4K · Real-Time Edge Video AI',
      desc: 'Sub-millisecond object classification and tracking designed for robotic and drone platforms.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://neuralvision.example.com',
    },
    {
      title: 'Cognitive Cloud · GPU Cluster Compute',
      desc: 'Instant-provisioning H100 GPU clusters with distributed PyTorch orchestration.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://cognitivecloud.example.com',
    },
  ],
  DEVELOPMENT: [
    {
      title: 'StackFlow IDE · Collaborative Cloud Workspace',
      desc: 'Instant dev containers with live multiplayer pairing and integrated terminal sandboxes.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://stackflow.example.com',
    },
    {
      title: 'Nexus API Gateway · Sub-millisecond Routing',
      desc: 'High-throughput edge proxy with built-in token rate-limiting and OAuth2 mTLS verification.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://nexusapi.example.com',
    },
    {
      title: 'Kubex Engine · Autoscaling Cluster Runtime',
      desc: 'Zero-configuration serverless Kubernetes deployment with predictive spot instance scaling.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://kubex.example.com',
    },
  ],
  'WINDOWS APPS': [
    {
      title: 'WinStudio Pro 11 · Next-Gen Fluent Desktop Suite',
      desc: 'High-performance native x64 and ARM64 desktop productivity suite crafted with WinUI 3.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://winstudio.example.com',
    },
    {
      title: 'DirectX Accelerator 12X · Ultra GPU Engine',
      desc: 'Hardware-accelerated rendering toolkit delivering silky 240fps desktop compositing.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://dxaccelerator.example.com',
    },
    {
      title: 'HyperTerminal Windows · Modern Shell Environment',
      desc: 'GPU-accelerated terminal emulator with split panes, tabs, and cross-platform SSH vaults.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://hyperterminal.example.com',
    },
  ],
  'MAC APPS': [
    {
      title: 'Aura Studio for Mac · Apple Silicon Native',
      desc: 'Engineered from the ground up for M3 Max with Metal 3 hardware raytracing and Neural Engine.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://auramac.example.com',
    },
    {
      title: 'SwiftCraft IDE · Native iOS & macOS Studio',
      desc: 'Pure Swift 6 development environment with visual SwiftUI previews and live Instruments profiling.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://swiftcraft.example.com',
    },
    {
      title: 'OmniDesk Mac · Professional Window Workspace',
      desc: 'Hyper-responsive tiling window manager with universal gestures and custom keyboard workflows.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://omnidesk.example.com',
    },
  ],
  'MOBILE APPS': [
    {
      title: 'Mobius Flutter Suite · Unified Cross-Platform SDK',
      desc: 'Single codebase targeting iOS, Android and Web at native 120Hz with pixel-perfect widgets.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://mobiusmobile.example.com',
    },
    {
      title: 'AppRocket CI · 4-Minute Mobile Cloud Builds',
      desc: 'Parallel iOS and Android signing, testing on 200+ physical device racks, and instant Store rollout.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://approcket.example.com',
    },
    {
      title: 'Veloce Mobile Wallet · Biometric Crypto Gateway',
      desc: 'Secure enclave multi-chain Web3 wallet with zero-gas smart account abstraction.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://veloce.example.com',
    },
  ],
  GAMING: [
    {
      title: 'Vortex Unreal 5 · Next-Gen Photoreal MMO',
      desc: 'Experience persistent virtual worlds powered by Nanite geometry and Lumen dynamic illumination.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://vortexgame.example.com',
    },
    {
      title: 'Apex Esports Arena · Global Tournament Finals',
      desc: '16 Championship teams competing for $2.5M live in the Virtual City Metaverse Stadium.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://apexarena.example.com',
    },
    {
      title: 'HyperRig Pro · Liquid-Cooled 8K Battle Stations',
      desc: 'Custom-built esports rigs featuring RTX 4090 OC and direct-die liquid cooling loops.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://hyperrig.example.com',
    },
  ],
  DESIGN: [
    {
      title: 'VectorCraft 3D · Procedural Spatial Studio',
      desc: 'Collaborative real-time 3D modelling, UV baking, and PBR material synthesis directly in the browser.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://vectorcraft.example.com',
    },
    {
      title: 'Chroma Design Systems · Enterprise Component Kit',
      desc: '12,000+ accessible Figma and React components with synchronized token synchronization.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://chromadesign.example.com',
    },
    {
      title: 'FontMatrix Type Foundry · Variable Typography Collection',
      desc: 'Award-winning variable fonts engineered for high-density OLED and retina display rendering.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://fontmatrix.example.com',
    },
  ],
  MARKETING: [
    {
      title: 'OmniAds Global · Contextual 3D Virtual Ad Exchange',
      desc: 'Programmatic billboard auction reaching 5M+ walking metaverse visitors with verified analytics.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://omniads.example.com',
    },
    {
      title: 'ViralLoop Media · Influencer Performance Engine',
      desc: 'AI attribution tracking across 40 social channels with instant creator revenue-share smart contracts.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://viralloop.example.com',
    },
    {
      title: 'BrandPulse 360 · Autonomous Brand Sentiment Radar',
      desc: 'Continuous real-time reputation analysis monitoring social conversations, reviews and news mentions.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://brandpulse.example.com',
    },
  ],
  'Civic Plaza': [
    {
      title: 'THE CITY MASTER NETWORK · Prime Digital Advertising',
      desc: 'Claim high-impact billboard locations across all 9 commercial districts. Direct ad placement via Admin Portal.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1508873696983-2df570464756?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://thecity.market',
    },
    {
      title: 'J Enterprise Global Headquarters · Official City Landmark',
      desc: 'The focal architectural landmark of The City. Premium commercial leasing and enterprise flagship headquarters.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://jenterprise.example.com',
    },
    {
      title: 'Civic Plaza Innovation Hub · Claim Free Storefronts',
      desc: 'Join 450+ verified businesses in the premier virtual marketplace. Register your building plot today.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
      targetUrl: 'https://thecity.market/buy',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Generates the 30 Physical Billboard Placements throughout every Market Area
// ─────────────────────────────────────────────────────────────────────────────
export function generateDefaultBillboards(): Billboard[] {
  const billboards: Billboard[] = [];
  const now = new Date().toISOString();

  // ── 1. Central Civic Plaza Mega-Billboards (3 Prime Installations) ──
  const centralPlacements = [
    {
      id: 'BB-CTR-01',
      name: 'Civic Plaza North Megascreen',
      market: 'Civic Plaza',
      location: 'Plaza North Gateway overlooking Central Promenade',
      wallSide: 'freestanding' as const,
      format: 'landscape' as const,
      size: 'monument' as const,
      width: 10.5,
      height: 5.8,
      elevation: 7.2,
      x: 0,
      y: 7.2,
      z: -52,
      rot: 0, // facing south (+Z) towards Plaza center
    },
    {
      id: 'BB-CTR-02',
      name: 'Civic Plaza East High Display',
      market: 'Civic Plaza',
      location: 'Central Plaza East Promenade facing J Enterprise',
      wallSide: 'freestanding' as const,
      format: 'landscape' as const,
      size: 'large' as const,
      width: 8.4,
      height: 4.8,
      elevation: 6.5,
      x: 48,
      y: 6.5,
      z: 14,
      rot: -Math.PI / 2, // facing west (-X) towards Plaza center
    },
    {
      id: 'BB-CTR-03',
      name: 'Civic Plaza West Digital Wall',
      market: 'Civic Plaza',
      location: 'Central Plaza West Approach opposite Landmark',
      wallSide: 'freestanding' as const,
      format: 'portrait' as const,
      size: 'portrait' as const,
      width: 4.0,
      height: 6.8,
      elevation: 6.8,
      x: -48,
      y: 6.8,
      z: 14,
      rot: Math.PI / 2, // facing east (+X) towards Plaza center
    },
  ];

  centralPlacements.forEach((cp, idx) => {
    const ad = SAMPLE_ADS_BY_MARKET['Civic Plaza'][idx % 3];
    billboards.push({
      ...cp,
      status: 'active',
      adTitle: ad.title,
      adDescription: ad.desc,
      mediaType: ad.mediaType,
      mediaUrl: ad.mediaUrl,
      targetUrl: ad.targetUrl,
      lighting: true,
      updatedAt: now,
    });
  });

  // ── 2. Three Physical Billboards for Each of the 9 Market Districts (27 Total) ──
  DISTRICTS.forEach((d, k) => {
    const spineAngleDeg = 20 + 40 * k;
    const ads = SAMPLE_ADS_BY_MARKET[d.name] || SAMPLE_ADS_BY_MARKET.SAAS;

    // Spot 1: Back Wall of Inner Commercial Row facing Cross Street 1 / Ring 1
    // (Large blank wall at rear of building facing the avenue)
    const r1 = 120.6 - 12; // back wall radius
    const angle1 = spineAngleDeg - 8;
    const [x1, z1] = polar(r1, angle1);
    const rot1 = (angle1 + 180) * D2R; // facing back outward

    billboards.push({
      id: `BB-${d.code}-01`,
      name: `${d.name} Avenue Back Wall Display`,
      market: d.name,
      location: `${d.name} Ring 1 Gateway & Building Rear Wall`,
      plotId: `${d.code}-004`,
      wallSide: 'back_wall',
      format: 'landscape',
      size: 'large',
      width: 7.8,
      height: 4.4,
      elevation: 5.6,
      x: x1,
      y: 5.6,
      z: z1,
      rot: rot1,
      status: 'active',
      adTitle: ads[0].title,
      adDescription: ads[0].desc,
      mediaType: ads[0].mediaType,
      mediaUrl: ads[0].mediaUrl,
      targetUrl: ads[0].targetUrl,
      lighting: true,
      updatedAt: now,
    });

    // Spot 2: High-Impact Side Wall Facing the Main Spine Promenade
    // (Visible to walking players walking along the central avenue of the market)
    const r2 = 164.6 + 6;
    const angle2 = spineAngleDeg + 4.5;
    const [x2, z2] = polar(r2, angle2);
    const rot2 = (spineAngleDeg + 90) * D2R; // facing perpendicular to spine

    billboards.push({
      id: `BB-${d.code}-02`,
      name: `${d.name} Spine Promenade Digital Billboard`,
      market: d.name,
      location: `${d.name} Main Spine Road & Cross Street Junction`,
      plotId: `${d.code}-012`,
      wallSide: 'side_wall_left',
      format: 'landscape',
      size: 'large',
      width: 8.2,
      height: 4.6,
      elevation: 6.2,
      x: x2,
      y: 6.2,
      z: z2,
      rot: rot2,
      status: 'active',
      adTitle: ads[1].title,
      adDescription: ads[1].desc,
      mediaType: ads[1].mediaType,
      mediaUrl: ads[1].mediaUrl,
      targetUrl: ads[1].targetUrl,
      lighting: true,
      updatedAt: now,
    });

    // Spot 3: Elevated Corner Gantry / Side Wall at Outer Market Intersection
    // (Portrait or monument orientation facing inbound street traffic)
    const r3 = 238.6 - 10;
    const angle3 = spineAngleDeg - 5.5;
    const [x3, z3] = polar(r3, angle3);
    const rot3 = (spineAngleDeg - 75) * D2R;

    billboards.push({
      id: `BB-${d.code}-03`,
      name: `${d.name} Outer Crossway Totem Display`,
      market: d.name,
      location: `${d.name} Outer Ring Intersection & Commercial Corner`,
      plotId: `${d.code}-026`,
      wallSide: 'corner',
      format: 'portrait',
      size: 'portrait',
      width: 3.8,
      height: 6.2,
      elevation: 5.8,
      x: x3,
      y: 5.8,
      z: z3,
      rot: rot3,
      status: 'active',
      adTitle: ads[2].title,
      adDescription: ads[2].desc,
      mediaType: ads[2].mediaType,
      mediaUrl: ads[2].mediaUrl,
      targetUrl: ads[2].targetUrl,
      lighting: true,
      updatedAt: now,
    });
  });

  return billboards;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage & Synchronization Layer (Supabase + LocalStorage fallback)
// ─────────────────────────────────────────────────────────────────────────────
export async function loadBillboardsFromStorage(): Promise<Billboard[]> {
  const defaults = generateDefaultBillboards();

  // 1. Try Supabase Cloud Database first if connected
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('billboards')
        .select('*')
        .order('id', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          name: row.name,
          market: row.market,
          location: row.location,
          plotId: row.plot_id,
          wallSide: row.wall_side || 'back_wall',
          format: row.format || 'landscape',
          size: row.size || 'large',
          width: Number(row.width) || 7.5,
          height: Number(row.height) || 4.2,
          elevation: Number(row.elevation) || 5.5,
          x: Number(row.x),
          y: Number(row.y) || 5.5,
          z: Number(row.z),
          rot: Number(row.rot) || 0,
          status: row.status || 'active',
          adTitle: row.ad_title || '',
          adDescription: row.ad_description || '',
          mediaType: row.media_type || 'image',
          mediaUrl: row.media_url || '',
          targetUrl: row.target_url || '',
          lighting: row.lighting ?? true,
          updatedAt: row.updated_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('[Billboards] Supabase fetch failed, falling back to LocalStorage:', err);
    }
  }

  // 2. LocalStorage Persistence
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(BILLBOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Billboards] LocalStorage read failed:', e);
    }
  }

  // 3. Fallback to pre-seeded city billboards and save
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(defaults));
    } catch {}
  }

  return defaults;
}

export async function saveBillboardToStorage(bb: Billboard): Promise<void> {
  // Update LocalStorage immediately
  if (typeof window !== 'undefined') {
    try {
      const current = await loadBillboardsFromStorage();
      const idx = current.findIndex(b => b.id === bb.id);
      if (idx >= 0) {
        current[idx] = bb;
      } else {
        current.push(bb);
      }
      localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('[Billboards] LocalStorage write failed:', e);
    }
  }

  // Sync to Supabase Cloud Database if connected
  if (supabase) {
    try {
      const row = {
        id: bb.id,
        name: bb.name,
        market: bb.market,
        location: bb.location,
        plot_id: bb.plotId || null,
        wall_side: bb.wallSide,
        format: bb.format,
        size: bb.size,
        width: bb.width,
        height: bb.height,
        elevation: bb.elevation,
        x: bb.x,
        y: bb.y,
        z: bb.z,
        rot: bb.rot,
        status: bb.status,
        ad_title: bb.adTitle,
        ad_description: bb.adDescription || null,
        media_type: bb.mediaType,
        media_url: bb.mediaUrl,
        target_url: bb.targetUrl || null,
        lighting: bb.lighting,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('billboards').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Billboards] Supabase upsert error:', error.message);
    } catch (err) {
      console.warn('[Billboards] Supabase sync error:', err);
    }
  }
}

export async function deleteBillboardFromStorage(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const current = await loadBillboardsFromStorage();
      const updated = current.filter(b => b.id !== id);
      localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[Billboards] LocalStorage delete failed:', e);
    }
  }

  if (supabase) {
    try {
      await supabase.from('billboards').delete().eq('id', id);
    } catch (err) {
      console.warn('[Billboards] Supabase delete error:', err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Media Upload Helper (Image & Video)
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadBillboardMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

  // 1. If Supabase Storage is connected, upload to 'billboard_media' bucket
  if (supabase) {
    try {
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const filename = `bb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const path = `uploads/${filename}`;

      const { error } = await supabase.storage.from('billboard_media').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

      if (!error) {
        const { data } = supabase.storage.from('billboard_media').getPublicUrl(path);
        if (data?.publicUrl) {
          return { url: data.publicUrl, mediaType };
        }
      }
    } catch (e) {
      console.warn('[Billboards] Supabase media upload failed, falling back to data URL:', e);
    }
  }

  // 2. Demo / Local fallback: FileReader Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string, mediaType });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reactive Billboard Store (Zustand)
// Synchronizes 3D Scene and Admin UI in Real-Time
// ─────────────────────────────────────────────────────────────────────────────
interface BillboardState {
  billboards: Billboard[];
  loading: boolean;
  initialized: boolean;
  selectedId: string | null;
  q: string;
  filterMarket: string;
  filterStatus: string;
  filterMediaType: string;

  init: () => Promise<void>;
  setSelectedId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFilterMarket: (market: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterMediaType: (mediaType: string) => void;
  saveBillboard: (bb: Billboard) => Promise<void>;
  deleteBillboard: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export const useBillboardStore = create<BillboardState>((set, get) => ({
  billboards: [],
  loading: false,
  initialized: false,
  selectedId: null,
  q: '',
  filterMarket: 'all',
  filterStatus: 'all',
  filterMediaType: 'all',

  init: async () => {
    if (get().initialized && get().billboards.length > 0) return;
    set({ loading: true });
    const list = await loadBillboardsFromStorage();
    set({ billboards: list, loading: false, initialized: true });
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setSearchQuery: (q) => set({ q }),
  setFilterMarket: (filterMarket) => set({ filterMarket }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterMediaType: (filterMediaType) => set({ filterMediaType }),

  saveBillboard: async (bb: Billboard) => {
    const updated = { ...bb, updatedAt: new Date().toISOString() };
    await saveBillboardToStorage(updated);
    set((state) => {
      const idx = state.billboards.findIndex((b) => b.id === updated.id);
      if (idx >= 0) {
        const copy = [...state.billboards];
        copy[idx] = updated;
        return { billboards: copy };
      }
      return { billboards: [...state.billboards, updated] };
    });
  },

  deleteBillboard: async (id: string) => {
    await deleteBillboardFromStorage(id);
    set((state) => ({
      billboards: state.billboards.filter((b) => b.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  resetToDefaults: async () => {
    const defaults = generateDefaultBillboards();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(defaults));
      } catch {}
    }
    set({ billboards: defaults });
  },
}));
