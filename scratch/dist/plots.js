"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JE_BLOCKS = exports.plotFront = exports.getPlace = exports.plotById = exports.BASE_ROADS = exports.BASE_PLOTS = exports.OBSTACLES = exports.PLAZA = exports.GRID = exports.CELL = exports.LV = exports.FH = exports.GH = exports.BLD_D = exports.BLD_W = exports.PRICE = void 0;
exports.toWorld = toWorld;
exports.footprint = footprint;
exports.defaultPlace = defaultPlace;
exports.placementError = placementError;
exports.buildingOBB = buildingOBB;
exports.storeDoor = storeDoor;
exports.buildColliders = buildColliders;
const city_1 = require("./city");
Object.defineProperty(exports, "PRICE", { enumerable: true, get: function () { return city_1.PRICE; } });
exports.BLD_W = 10, exports.BLD_D = 8, exports.GH = 4.5, exports.FH = 3.4, exports.LV = 3.4, exports.CELL = 2, exports.GRID = 5;
exports.PLAZA = { x: 0, z: 0, r: city_1.CITY.plazaR };
/** Circular features new plots/roads must not overlap. */
exports.OBSTACLES = [{ id: 'Plaza', name: 'Civic Plaza', cx: 0, cz: 0, r: city_1.CITY.plazaR }];
const GEN = (0, city_1.generateCity)();
exports.BASE_PLOTS = GEN.plots;
exports.BASE_ROADS = GEN.roads;
const plotById = (id) => exports.BASE_PLOTS.find(p => p.id === id);
exports.plotById = plotById;
/** local (lx,lz) in plot space -> world. Local +z faces the street. */
function toWorld(p, lx, lz) {
    const c = Math.cos(p.rot), s = Math.sin(p.rot);
    return [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
}
// ---------- building footprint / placement ----------
function footprint(cfg) {
    if (cfg.mode === 'modular')
        return { w: exports.GRID * exports.CELL, d: exports.GRID * exports.CELL, door: (exports.GRID * exports.CELL) / 2 + 0.4 };
    if (cfg.template === 'jenterprise')
        return { w: 24, d: 15, door: 9.5 };
    if (cfg.template === 'bungalow')
        return { w: 20, d: 14, door: 9 };
    if (cfg.template === 'central')
        return { w: 16, d: 12, door: 9.5 };
    return { w: exports.BLD_W, d: exports.BLD_D, door: exports.BLD_D / 2 + 0.4 };
}
function defaultPlace(plot, cfg) {
    const f = footprint(cfg), lim = Math.max(0, plot.d / 2 - f.d / 2);
    return { ox: 0, oz: Math.max(-lim, Math.min(lim, (plot.d - 12) / 2)), rot: 0 };
}
const getPlace = (plot, cfg) => cfg.place || defaultPlace(plot, cfg);
exports.getPlace = getPlace;
/** Returns an error message if the building would leave its plot, else null. */
function placementError(plot, cfg, place = (0, exports.getPlace)(plot, cfg)) {
    const f = footprint(cfg), odd = place.rot % 2 !== 0, hw = (odd ? f.d : f.w) / 2, hd = (odd ? f.w : f.d) / 2;
    if (Math.abs(place.ox) + hw > plot.w / 2 + 1e-6 || Math.abs(place.oz) + hd > plot.d / 2 + 1e-6)
        return `Building (${f.w}×${f.d} m) would extend outside plot ${plot.id} (${plot.w}×${plot.d} m).`;
    return null;
}
/** World-space oriented footprint of a building (plot rotation + building quarter-turns). */
function buildingOBB(plot, cfg) {
    const pl = (0, exports.getPlace)(plot, cfg), f = footprint(cfg), odd = pl.rot % 2 !== 0, [cx, cz] = toWorld(plot, pl.ox, pl.oz);
    return { cx, cz, hw: (odd ? f.d : f.w) / 2, hd: (odd ? f.w : f.d) / 2, a: plot.rot + (pl.rot * Math.PI) / 2 };
}
/** World position of the storefront interaction point. */
function storeDoor(plot, cfg) {
    const pl = (0, exports.getPlace)(plot, cfg), f = footprint(cfg), a = (pl.rot * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a);
    return toWorld(plot, pl.ox + f.door * s, pl.oz + f.door * c);
}
/** Interaction point for an empty plot: just in front of its For Sale board. */
const plotFront = (p) => toWorld(p, 0, p.d / 2 + 1.6);
exports.plotFront = plotFront;
/** Solid decorative blocks of the J Enterprise forecourt, in building-local coordinates. */
exports.JE_BLOCKS = [
    { k: 'sign1', x: -8.5, z: 11, w: 6.4, d: 0.7, h: 2.3 }, { k: 'sign2', x: 9.8, z: 11, w: 2.6, d: 0.6, h: 5.2 },
    { k: 'bed', x: -8.5, z: 12.9, w: 10, d: 1.6, h: 0.55 }, { k: 'bed', x: 9.8, z: 12.9, w: 9, d: 1.6, h: 0.55 },
];
const obb = (cx, cz, hw, hd, a) => ({ t: 'obb', cx, cz, hw, hd, c: Math.cos(a), s: Math.sin(a) });
function buildColliders(plots, stores, extra) {
    const out = [];
    for (const s of stores) {
        const p = plots.get(s.plotId);
        if (!p)
            continue;
        const b = buildingOBB(p, s.config);
        out.push(obb(b.cx, b.cz, b.hw, b.hd, b.a));
        if (s.config.template === 'jenterprise' && s.config.mode !== 'modular') {
            const pl = (0, exports.getPlace)(p, s.config), ba = (pl.rot * Math.PI) / 2, c = Math.cos(ba), sn = Math.sin(ba);
            for (const k of exports.JE_BLOCKS) {
                const lx = k.x * c + k.z * sn, lz = -k.x * sn + k.z * c, [wx, wz] = toWorld(p, pl.ox + lx, pl.oz + lz);
                out.push(obb(wx, wz, k.w / 2, k.d / 2, b.a));
            }
        }
    }
    for (const e of extra)
        out.push({ t: 'circle', ...e });
    return out;
}
