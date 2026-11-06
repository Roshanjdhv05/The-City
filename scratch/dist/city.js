"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadPoly = exports.PRICE = exports.DISTRICTS = exports.CITY = void 0;
exports.plotHitsRoad = plotHitsRoad;
exports.generateCity = generateCity;
const geom_1 = require("./geom");
/* ═══════════ THE CITY – circular master plan ═══════════
   J Enterprise hub + plaza -> inner ring road -> ring of buildings -> ring road -> two market bands -> outer ring road.
   Nine radial boundary roads split the city into nine market districts; each district has a spine road,
   cross streets and rows of plots on both sides of every street. Generated from actual geometry, then validated. */
/* Radii are derived, not guessed: a band holds two cross streets, each with a row of plots (13.6 m) on both sides.
   A ring's inner edge must clear 1/cos(20°) x the far radius of the last row, because rings curve in at the sides of a sector. */
exports.CITY = { plazaR: 40, R0: 52, R1: 90, R2: 208, Ro: 334, ringW: [10, 12, 12, 14], radialW: 12, crossW: 10, sw: 3, crossU: [120.6, 164.6, 238.6, 282.6], rowD: 13.6, innerR: 71 };
exports.DISTRICTS = [
    { code: 'FIN', name: 'Finance District', cat: 'Finance' }, { code: 'RET', name: 'Retail District', cat: 'Retail' }, { code: 'FNB', name: 'Food & Beverage District', cat: 'Food & Beverage' },
    { code: 'CRE', name: 'Creative District', cat: 'Creative' }, { code: 'EDU', name: 'Education District', cat: 'Education' }, { code: 'HLT', name: 'Health & Wellness District', cat: 'Health & Wellness' },
    { code: 'AIM', name: 'AI District', cat: 'AI' }, { code: 'REA', name: 'Real Estate District', cat: 'Real Estate' }, { code: 'TEC', name: 'Technology District', cat: 'Technology' },
];
exports.PRICE = { free: 0, premium: 299, featured: 499, corner: 799 };
const r2 = (n) => Math.round(n * 100) / 100;
const WS = [12, 14, 12, 16, 12, 14];
const roadPoly = (r, m = 0) => { const L = Math.hypot(r.x1 - r.x0, r.z1 - r.z0) || 1, e1 = [(r.x1 - r.x0) / L, (r.z1 - r.z0) / L], e2 = [-e1[1], e1[0]]; return (0, geom_1.box)((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, e1, e2, L / 2 + m, r.w / 2 + m); };
exports.roadPoly = roadPoly;
/** Does a plot (grown by margin m) touch a road? Rings use an annulus test, segments an oriented-box test. */
function plotHitsRoad(p, r, m = 0) {
    const P = (0, geom_1.plotPoly)(p);
    if (r.kind === 'ring') {
        const [mn, mx] = (0, geom_1.polyRadialRange)(P, r.x0, r.z0);
        return mx >= r.x1 - r.w / 2 - m && mn <= r.x1 + r.w / 2 + m;
    }
    return (0, geom_1.polysOverlap)(P, (0, exports.roadPoly)(r, m));
}
function generateCity() {
    const roads = [], plots = [];
    exports.CITY.ringW.forEach((w, i) => roads.push({ id: `RING-${i}`, kind: 'ring', x0: 0, z0: 0, x1: [exports.CITY.R0, exports.CITY.R1, exports.CITY.R2, exports.CITY.Ro][i], z1: 0, w }));
    const seg = (id, a, b, w) => roads.push({ id, kind: 'seg', x0: r2(a[0]), z0: r2(a[1]), x1: r2(b[0]), z1: r2(b[1]), w });
    const tan20 = Math.tan(20 * geom_1.D2R);
    exports.DISTRICTS.forEach((D, k) => {
        seg(`RAD-${k}`, (0, geom_1.polar)(exports.CITY.R0, 40 * k), (0, geom_1.polar)(exports.CITY.Ro, 40 * k), exports.CITY.radialW); // boundary road (main-road spoke)
        const c = 20 + 40 * k, U = (0, geom_1.bearingDir)(c), V = [Math.cos(c * geom_1.D2R), Math.sin(c * geom_1.D2R)], P = (u, v) => [u * U[0] + v * V[0], u * U[1] + v * V[1]];
        seg(`SPN-${D.code}`, (0, geom_1.polar)(exports.CITY.R1, c), (0, geom_1.polar)(exports.CITY.Ro, c), exports.CITY.radialW); // district spine: entrance on the ring road
        exports.CITY.crossU.forEach((u, j) => seg(`X-${D.code}-${j + 1}`, P(u, -u * tan20), P(u, u * tan20), exports.CITY.crossW)); // cross streets reach both boundary roads
    });
    // hub
    plots.push({ id: 'J01', district: 'Civic Plaza', category: 'Enterprise', tier: 'featured', price: 0, x: 0, z: 0, rot: 0, w: 36, d: 26, status: 'reserved', landmark: true });
    exports.DISTRICTS.forEach((D, k) => { const c = 20 + 40 * k, [x, z] = (0, geom_1.polar)(exports.CITY.innerR, c); plots.push({ id: 'C0' + (k + 1), district: 'Central District', category: 'Central', tier: 'featured', price: exports.PRICE.featured, x: r2(x), z: r2(z), rot: r2(-c * geom_1.D2R * 1e4) / 1e4, w: 24, d: 18, status: 'reserved' }); });
    const tierOf = (i, row, ri, corner = false) => (corner || (i === 0 && ri === 0) ? 'corner' : (i + row) % 5 === 4 ? 'featured' : (i + row) % 3 === 2 ? 'free' : 'premium');
    const ok = (cand, m = 1.5) => !roads.some(r => plotHitsRoad(cand, r, m)) && !plots.some(o => (0, geom_1.polysOverlap)((0, geom_1.plotPoly)(cand, 0.2), (0, geom_1.plotPoly)(o))) && Math.hypot(cand.x, cand.z) > exports.CITY.plazaR + 16;
    exports.DISTRICTS.forEach((D, k) => {
        const c = 20 + 40 * k, U = (0, geom_1.bearingDir)(c), V = [Math.cos(c * geom_1.D2R), Math.sin(c * geom_1.D2R)], d = exports.CITY.rowD;
        let n = 1;
        exports.CITY.crossU.forEach((u, j) => ([{ side: -1, face: 1 }, { side: 1, face: -1 }]).forEach(({ side, face }, ri) => {
            const uc = u + side * (exports.CITY.crossW / 2 + exports.CITY.sw + d / 2), rot = face > 0 ? Math.PI - c * geom_1.D2R : -c * geom_1.D2R; // inner row faces outward (+U), outer row faces inward
            for (const s of [-1, 1]) {
                let off = exports.CITY.radialW / 2 + exports.CITY.sw + 1, i = 0;
                for (let guard = 0; guard < 20; guard++) {
                    // Try preferred width first; fall back to smaller widths to fill corner gaps next to boundary roads
                    const prefW = WS[(i + j + ri) % WS.length];
                    const widths = [prefW, 14, 12, 10].filter((w, idx, arr) => arr.indexOf(w) === idx);
                    let placed = null;
                    for (const w of widths) {
                        const v = s * (off + w / 2), cand = { id: '', district: D.name, category: D.cat, tier: 'premium', price: 0, x: r2(uc * U[0] + v * V[0]), z: r2(uc * U[1] + v * V[1]), rot: Math.round(rot * 1e6) / 1e6, w, d, status: 'available' };
                        if (ok(cand)) {
                            placed = cand;
                            break;
                        }
                    }
                    if (!placed)
                        break;
                    const isCorner = placed.w <= 10;
                    placed.id = `${D.code}-${String(n++).padStart(3, '0')}`;
                    placed.tier = tierOf(i, j * 2 + ri, ri, isCorner);
                    placed.price = exports.PRICE[placed.tier];
                    plots.push(placed);
                    off += placed.w + 1.5;
                    i++;
                }
            }
        }));
    });
    return { plots, roads };
}
