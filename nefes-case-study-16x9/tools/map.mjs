#!/usr/bin/env node
// One-off: extract Turkey's outline from Natural Earth (the npm package `world-atlas`, countries-50m.json, public
// domain) and write it, projected and normalised, to build/turkey-outline.json. tools/build.mjs reads only that
// file, so a rebuild needs no install and no network.
//
//   npm pack world-atlas@2.0.2 && tar xzf world-atlas-2.0.2.tgz
//   node tools/map.mjs package/countries-50m.json
//
// Projection: equirectangular about latitude 39°N (x = lon·cos 39°, y = -lat). Good to a percent or so across a
// country this size; this is a diagram of "country-wide", not a map to measure from.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = process.argv[2];
if (!src) throw new Error("usage: node tools/map.mjs <countries-50m.json>");
const topo = JSON.parse(fs.readFileSync(src, "utf8"));
const geo = topo.objects.countries.geometries.find((g) => g.id === "792"); // ISO 3166-1 numeric: Türkiye
if (!geo) throw new Error("country 792 not found");

// decode the TopoJSON arcs (delta-encoded, quantised)
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]);
});
const ring = (ids) => {
  const pts = [];
  for (const id of ids) {
    const a = id < 0 ? arcs[~id].slice().reverse() : arcs[id];
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  return pts;
};
const polys = geo.type === "Polygon" ? [geo.arcs] : geo.arcs;
const K = Math.cos((39 * Math.PI) / 180);
let rings = polys.map((p) => ring(p[0]).map(([lon, lat]) => [lon * K, -lat])); // outer rings only

// keep the two mainland parts (Anatolia and Thrace); drop islands too small to read at this size
const area = (r) => Math.abs(r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0) / 2);
rings = rings.filter((r) => area(r) > 0.5).sort((a, b) => area(b) - area(a));

const xs = rings.flat().map((p) => p[0]), ys = rings.flat().map((p) => p[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
const w = x1 - x0;
const r5 = (v) => Math.round(v * 1e5) / 1e5;
// normalise: x in 0..1 across the country, y in the same unit, origin at the bounding box's top left
const out = {
  source: "Natural Earth 1:50m admin-0 countries, via npm world-atlas@2.0.2 (countries-50m.json), id 792. Public domain.",
  projection: "equirectangular about 39°N; x = 0..1 across the country's width, y in the same unit",
  aspect: r5((y1 - y0) / w),
  rings: rings.map((r) => r.map(([x, y]) => [r5((x - x0) / w), r5((y - y0) / w)])),
};
fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "build/turkey-outline.json"), JSON.stringify(out) + "\n");
console.log(`rings ${out.rings.length} (${out.rings.map((r) => r.length).join(", ")} points) · height/width ${out.aspect}`);
