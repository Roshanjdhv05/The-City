"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLayout = exports.bandHit = exports.overlap = exports.roadRect = exports.plotRect = exports.roadDir = exports.roadLen = exports.isRing = exports.baseLayout = void 0;
exports.makeLayout = makeLayout;
exports.layoutBounds = layoutBounds;
exports.roadEdgeDist = roadEdgeDist;
exports.nearestRoad = nearestRoad;
exports.intersections = intersections;
exports.roadPieces = roadPieces;
exports.sidewalkPieces = sidewalkPieces;
exports.validateNetwork = validateNetwork;
exports.checkPlot = checkPlot;
exports.checkRoad = checkRoad;
exports.snapPlotToRoad = snapPlotToRoad;
const zustand_1 = require("zustand");
const plots_1 = require("./plots");
const city_1 = require("./city");
const geom_1 = require("./geom");
let ver = 0;
function makeLayout(plots, roads, regions, source) {
    return { plots, roads, regions, byId: new Map(plots.map(p => [p.id, p])), source, version: ++ver };
}
const baseLayout = () => makeLayout(plots_1.BASE_PLOTS, plots_1.BASE_ROADS, [], 'base');
exports.baseLayout = baseLayout;
const isRing = (r) => r.kind === 'ring';
exports.isRing = isRing;
const roadLen = (r) => Math.hypot(r.x1 - r.x0, r.z1 - r.z0);
exports.roadLen = roadLen;
const roadDir = (r) => { const L = (0, exports.roadLen)(r) || 1; return [(r.x1 - r.x0) / L, (r.z1 - r.z0) / L]; };
exports.roadDir = roadDir;
/** Axis-aligned bounding boxes (broad phase / bounds). */
const plotRect = (p) => (0, geom_1.polyRect)((0, geom_1.plotPoly)(p));
exports.plotRect = plotRect;
const roadRect = (r) => (0, exports.isRing)(r) ? { x0: r.x0 - r.x1 - r.w / 2, x1: r.x0 + r.x1 + r.w / 2, z0: r.z0 - r.x1 - r.w / 2, z1: r.z0 + r.x1 + r.w / 2 } : (0, geom_1.polyRect)((0, city_1.roadPoly)(r));
exports.roadRect = roadRect;
exports.overlap = geom_1.rectOverlap;
function layoutBounds(l, pad = 30) {
    const rs = [...l.plots.map(exports.plotRect), ...l.roads.map(exports.roadRect), ...plots_1.OBSTACLES.map(o => ({ x0: o.cx - o.r, x1: o.cx + o.r, z0: o.cz - o.r, z1: o.cz + o.r }))];
    return { x0: Math.min(...rs.map(r => r.x0)) - pad, x1: Math.max(...rs.map(r => r.x1)) + pad, z0: Math.min(...rs.map(r => r.z0)) - pad, z1: Math.max(...rs.map(r => r.z1)) + pad };
}
/** Distance from a point to a road's lane edge (<= 0 means inside the carriageway). */
function roadEdgeDist(r, x, z) {
    return (0, exports.isRing)(r) ? Math.abs(Math.hypot(x - r.x0, z - r.z0) - r.x1) - r.w / 2 : (0, geom_1.distPointSeg)(x, z, r.x0, r.z0, r.x1, r.z1) - r.w / 2;
}
function nearestRoad(roads, x, z) {
    let best = null;
    for (const r of roads) {
        const d = roadEdgeDist(r, x, z);
        if (!best || d < best.d)
            best = { road: r, d };
    }
    return best;
}
const bandHit = (roads, x, z, margin = 0, except = '') => roads.some(r => r.id !== except && roadEdgeDist(r, x, z) < margin);
exports.bandHit = bandHit;
/** All crossings / T-junctions between roads (segment x segment and ring x segment). */
function intersections(roads) {
    const out = [], segs = roads.filter(r => !(0, exports.isRing)(r)), rings = roads.filter(exports.isRing), tol = 0.6;
    for (let i = 0; i < segs.length; i++)
        for (let j = i + 1; j < segs.length; j++) {
            const a = segs[i], b = segs[j], da = (0, exports.roadDir)(a), db = (0, exports.roadDir)(b), cr = da[0] * db[1] - da[1] * db[0];
            if (Math.abs(cr) < 1e-6)
                continue;
            const qx = b.x0 - a.x0, qz = b.z0 - a.z0, t = (qx * db[1] - qz * db[0]) / cr, s = (qx * da[1] - qz * da[0]) / cr;
            if (t >= -tol && t <= (0, exports.roadLen)(a) + tol && s >= -tol && s <= (0, exports.roadLen)(b) + tol)
                out.push({ x: a.x0 + t * da[0], z: a.z0 + t * da[1], a, b, ea: da, eb: db });
        }
    for (const rg of rings)
        for (const s of segs) {
            const d = (0, exports.roadDir)(s), L = (0, exports.roadLen)(s);
            for (const t of (0, geom_1.lineCircle)([s.x0, s.z0], d, rg.x0, rg.z0, rg.x1))
                if (t >= -tol && t <= L + tol) {
                    const x = s.x0 + t * d[0], z = s.z0 + t * d[1], rx = x - rg.x0, rz = z - rg.z0, R = Math.hypot(rx, rz) || 1;
                    out.push({ x, z, a: rg, b: s, ea: [-rz / R, rx / R], eb: d });
                }
        }
    return out;
}
const yaw = (d) => Math.atan2(-d[1], d[0]);
function roadPieces(roads) {
    return { strips: roads.filter(r => !(0, exports.isRing)(r)).map(r => ({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, len: (0, exports.roadLen)(r), w: r.w, rot: yaw((0, exports.roadDir)(r)) })), rings: roads.filter(exports.isRing) };
}
/** 3 m sidewalks on both sides of every road, trimmed wherever another road crosses. */
function sidewalkPieces(roads) {
    const segs = roads.filter(r => !(0, exports.isRing)(r)), rings = roads.filter(exports.isRing), strips = [], arcs = [];
    for (const r of segs) {
        const d = (0, exports.roadDir)(r), n = [-d[1], d[0]], L = (0, exports.roadLen)(r);
        for (const sd of [-1, 1]) {
            const o = sd * (r.w / 2 + 1.5), p0 = [r.x0 + n[0] * o, r.z0 + n[1] * o], cuts = [];
            for (const q of roads) {
                if (q === r)
                    continue;
                if ((0, exports.isRing)(q)) {
                    (0, geom_1.lineAnnulus)(p0, d, q.x0, q.z0, q.x1 - q.w / 2 - 3, q.x1 + q.w / 2 + 3).forEach(iv => cuts.push(iv));
                    continue;
                }
                const dq = (0, exports.roadDir)(q), cr = d[0] * dq[1] - d[1] * dq[0];
                if (Math.abs(cr) < 1e-6)
                    continue;
                const qx = q.x0 - p0[0], qz = q.z0 - p0[1], t = (qx * dq[1] - qz * dq[0]) / cr, s = (qx * d[1] - qz * d[0]) / cr;
                if (s < -1e-3 || s > (0, exports.roadLen)(q) + 1e-3)
                    continue;
                const hw = (q.w / 2 + (r.id > q.id ? 3 : 0)) / Math.abs(cr);
                cuts.push([t - hw, t + hw]);
            }
            for (const [a, b] of (0, geom_1.subtractIntervals)(0, L, cuts))
                strips.push({ x: p0[0] + d[0] * (a + b) / 2, z: p0[1] + d[1] * (a + b) / 2, len: b - a, w: 3, rot: yaw(d) });
        }
    }
    for (const rg of rings)
        for (const side of [-1, 1]) {
            const R = rg.x1, rIn = side < 0 ? R - rg.w / 2 - 3 : R + rg.w / 2, rOut = side < 0 ? R - rg.w / 2 : R + rg.w / 2 + 3, TWO = Math.PI * 2, cuts = [];
            for (const s of segs) {
                const d = (0, exports.roadDir)(s), L = (0, exports.roadLen)(s);
                for (const t of (0, geom_1.lineCircle)([s.x0, s.z0], d, rg.x0, rg.z0, R)) {
                    if (t < -0.6 || t > L + 0.6)
                        continue;
                    const x = s.x0 + t * d[0], z = s.z0 + t * d[1], phi = (Math.atan2(z - rg.z0, x - rg.x0) + TWO) % TWO, tan = [-(z - rg.z0) / R, (x - rg.x0) / R], sinA = Math.abs(d[0] * tan[1] - d[1] * tan[0]) || 1e-3, dl = (s.w / 2) / sinA / R;
                    let has = false;
                    for (const dt of [-2, 2]) {
                        const tt = t + dt;
                        if (tt < 0 || tt > L)
                            continue;
                        const rr = Math.hypot(s.x0 + tt * d[0] - rg.x0, s.z0 + tt * d[1] - rg.z0);
                        if (side < 0 ? rr < R : rr > R)
                            has = true;
                    }
                    if (!has)
                        continue;
                    cuts.push([phi - dl, phi + dl], [phi - dl + TWO, phi + dl + TWO], [phi - dl - TWO, phi + dl - TWO]);
                }
            }
            for (const [a, b] of (0, geom_1.subtractIntervals)(0, TWO, cuts, 0.4 / R))
                arcs.push({ cx: rg.x0, cz: rg.z0, rIn, rOut, a0: a, a1: b });
        }
    return { strips, arcs };
}
/** Validates the layout from the actual plot and road geometry (connectivity, frontage access, overlaps). */
function validateNetwork(l) {
    const par = new Map(l.roads.map(r => [r.id, r.id])), find = (x) => { while (par.get(x) !== x) {
        par.set(x, par.get(par.get(x)));
        x = par.get(x);
    } return x; };
    for (const j of intersections(l.roads))
        par.set(find(j.a.id), find(j.b.id));
    const groups = new Map();
    l.roads.forEach(r => { const k = find(r.id); groups.set(k, [...(groups.get(k) || []), r.id]); });
    const components = Array.from(groups.values()).sort((a, b) => b.length - a.length);
    const unreachable = [], overlaps = [], rects = l.plots.map(exports.plotRect), polys = l.plots.map(p => (0, geom_1.plotPoly)(p));
    l.plots.forEach((p, i) => {
        if (!p.landmark) {
            const [fx, fz] = (0, plots_1.toWorld)(p, 0, p.d / 2 + 2), nr = nearestRoad(l.roads, fx, fz);
            if (!nr || nr.d > 3.6)
                unreachable.push(p.id);
        }
        for (let j = i + 1; j < l.plots.length; j++)
            if ((0, geom_1.rectOverlap)(rects[i], rects[j]) && (0, geom_1.polysOverlap)(polys[i], polys[j]))
                overlaps.push(`${p.id} overlaps ${l.plots[j].id}`);
        for (const r of l.roads)
            if ((0, geom_1.rectOverlap)(rects[i], (0, exports.roadRect)(r)) && (0, city_1.plotHitsRoad)(p, r, 0))
                overlaps.push(`${p.id} overlaps road ${r.id}`);
        for (const o of plots_1.OBSTACLES) {
            const [mn] = (0, geom_1.polyRadialRange)(polys[i], o.cx, o.cz);
            if (mn < o.r && !p.landmark)
                overlaps.push(`${p.id} overlaps ${o.name}`);
        }
    });
    return { connected: components.length <= 1, components, unreachable, overlaps, plots: l.plots.length, roads: l.roads.length };
}
exports.useLayout = (0, zustand_1.create)((set) => ({ layout: (0, exports.baseLayout)(), loaded: false, set: (layout) => set({ layout, loaded: true }) }));
/** Validate adding/moving a plot: size, overlaps (plots, roads, plaza) and whether its entrance faces a road. */
function checkPlot(l, p) {
    const errors = [], warnings = [];
    if (![p.x, p.z, p.rot, p.w, p.d].every(Number.isFinite))
        return { errors: ['All plot values must be numbers.'], warnings };
    if (p.w < 12 || p.w > 60 || p.d < 12 || p.d > 60)
        errors.push('Plot width and depth must be between 12 and 60 m.');
    const P = (0, geom_1.plotPoly)(p), R = (0, geom_1.polyRect)(P);
    for (const o of l.plots)
        if (o.id !== p.id && (0, geom_1.rectOverlap)(R, (0, exports.plotRect)(o)) && (0, geom_1.polysOverlap)(P, (0, geom_1.plotPoly)(o))) {
            errors.push(`Overlaps plot ${o.id}.`);
            break;
        }
    for (const r of l.roads)
        if ((0, geom_1.rectOverlap)(R, (0, exports.roadRect)(r)) && (0, city_1.plotHitsRoad)(p, r, 0)) {
            errors.push(`Overlaps road ${r.id}.`);
            break;
        }
    for (const o of plots_1.OBSTACLES)
        if (!p.landmark && (0, geom_1.polyRadialRange)(P, o.cx, o.cz)[0] < o.r)
            errors.push(`Overlaps ${o.name}.`);
    if (!p.landmark) {
        const [fx, fz] = (0, plots_1.toWorld)(p, 0, p.d / 2 + 2), nr = nearestRoad(l.roads, fx, fz);
        if (!nr || nr.d > 3.6)
            errors.push('Entrance does not face a road or sidewalk. Use “Snap entrance to nearest road”.');
    }
    return { errors, warnings };
}
/** Validate adding/editing a road: no overlap with plots or the plaza, and it must join the existing network. */
function checkRoad(l, r) {
    const errors = [], warnings = [];
    if (![r.x0, r.z0, r.x1, r.z1, r.w].every(Number.isFinite))
        return { errors: ['All road values must be numbers.'], warnings };
    if (r.w < 4 || r.w > 24)
        errors.push('Road width must be between 4 and 24 m.');
    if ((0, exports.isRing)(r)) {
        if (r.x1 < 20)
            errors.push('Ring radius must be at least 20 m.');
    }
    else if ((0, exports.roadLen)(r) < 2)
        errors.push('Road must be at least 2 m long.');
    if (!errors.length) {
        const RR = (0, exports.roadRect)(r);
        for (const p of l.plots)
            if ((0, geom_1.rectOverlap)(RR, (0, exports.plotRect)(p)) && (0, city_1.plotHitsRoad)(p, r, 0)) {
                errors.push(`Overlaps plot ${p.id}.`);
                break;
            }
        if (!(0, exports.isRing)(r))
            for (const o of plots_1.OBSTACLES)
                if ((0, geom_1.polyRadialRange)((0, city_1.roadPoly)(r), o.cx, o.cz)[0] < o.r)
                    errors.push(`Overlaps ${o.name}.`);
        const others = l.roads.filter(q => q.id !== r.id);
        if (!intersections([r, ...others]).some(j => j.a === r || j.b === r))
            warnings.push('This road does not touch any other road, so it would be disconnected from the city network.');
    }
    return { errors, warnings };
}
/** Rotate a plot so its entrance (local +z) faces the closest point on the nearest road. */
function snapPlotToRoad(l, p) {
    let best = null;
    for (const r of l.roads) {
        let qx, qz;
        if ((0, exports.isRing)(r)) {
            const dx = p.x - r.x0, dz = p.z - r.z0, L = Math.hypot(dx, dz) || 1;
            qx = r.x0 + (dx / L) * r.x1;
            qz = r.z0 + (dz / L) * r.x1;
        }
        else {
            const d = (0, exports.roadDir)(r), t = Math.max(0, Math.min((0, exports.roadLen)(r), (p.x - r.x0) * d[0] + (p.z - r.z0) * d[1]));
            qx = r.x0 + d[0] * t;
            qz = r.z0 + d[1] * t;
        }
        const dist = Math.hypot(qx - p.x, qz - p.z);
        if (!best || dist < best.d)
            best = { x: qx, z: qz, d: dist };
    }
    return best ? { ...p, rot: Math.round(Math.atan2(best.x - p.x, best.z - p.z) * 1e6) / 1e6 } : p;
}
