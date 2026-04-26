"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { plantenDb } from "@/lib/plants";

type Point = { x: number; y: number };
type Mode = "teken" | "zon" | "plant" | "select";
type ZoneType = "zon" | "halfschaduw" | "schaduw";

interface Shape {
  id?: string;
  type: "boundary" | "zone";
  zone_type?: ZoneType;
  points: Point[];
}

interface Placement {
  id: string;
  plant_id: number;
  x: number;
  y: number;
  in_pot: boolean;
}

const ZONE_COLORS: Record<ZoneType, { fill: string; opacity: number; stroke: string }> = {
  zon:         { fill: "#FFD700", opacity: 0.30, stroke: "#E6B800" },
  halfschaduw: { fill: "#FFA040", opacity: 0.25, stroke: "#D4782A" },
  schaduw:     { fill: "#7BAFD4", opacity: 0.25, stroke: "#4A80A8" },
};

function pts(points: Point[]) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
}

const SCHAAL = 100;

function AfmetingLabel({ a, b, preview = false }: { a: Point; b: Point; preview?: boolean }) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  if (dist < 10) return null;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const meter = (dist / SCHAAL).toFixed(1);
  const label = `${meter} m`;
  let hoek = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  if (hoek > 90 || hoek < -90) hoek += 180;
  const bw = label.length * 5.5 + 10;
  const bh = 14;
  return (
    <g transform={`rotate(${hoek},${mx},${my})`} pointerEvents="none">
      <rect x={mx - bw / 2} y={my - bh / 2} width={bw} height={bh} rx={4}
        fill={preview ? "rgba(77,122,66,0.15)" : "rgba(255,255,255,0.92)"}
        stroke="#4D7A42" strokeWidth="0.8" />
      <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
        fontSize="9.5" fontWeight="700" fill="#4D7A42"
        style={{ userSelect: "none" }}>
        {label}
      </text>
    </g>
  );
}

function inPolygon(pt: Point, poly: Point[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const { x: xi, y: yi } = poly[i], { x: xj, y: yj } = poly[j];
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

export function GardenCanvas({
  gardenId,
  initialShapes,
  initialPlacements,
}: {
  gardenId: string;
  initialShapes: Shape[];
  initialPlacements: Placement[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const supabase = createClient();

  const initBoundary = initialShapes.find(s => s.type === "boundary");
  const [boundaryId, setBoundaryId] = useState(initBoundary?.id);
  const [boundaryPts, setBoundaryPts] = useState<Point[]>(initBoundary?.points ?? []);
  const [closed, setClosed] = useState(!!initBoundary);
  const [zones, setZones] = useState<Shape[]>(initialShapes.filter(s => s.type === "zone"));
  const [placements, setPlacements] = useState<Placement[]>(initialPlacements);

  const [mode, setMode] = useState<Mode>(initBoundary ? "select" : "teken");
  const [zoneType, setZoneType] = useState<ZoneType>("zon");
  const [zonePts, setZonePts] = useState<Point[]>([]);
  const [mouse, setMouse] = useState<Point | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const [plantSearch, setPlantSearch] = useState("");
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; lx: number; ly: number; moved: boolean } | null>(null);
  const boundaryDrag = useRef<{ index: number; sx: number; sy: number } | null>(null);

  // ── Coordinate helpers ──────────────────────────────────────────────────────

  function clientToSvg(clientX: number, clientY: number): Point {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const t = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.round(t.x), y: Math.round(t.y) };
  }

  function svgCoords(e: React.MouseEvent) { return clientToSvg(e.clientX, e.clientY); }
  function touchCoords(e: React.TouchEvent) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return clientToSvg(t.clientX, t.clientY);
  }

  // ── Supabase ────────────────────────────────────────────────────────────────

  async function saveBoundary(points: Point[], id?: string) {
    const path = JSON.stringify(points);
    if (id) {
      await supabase.from("garden_shapes").update({ svg_path: path }).eq("id", id);
    } else {
      const { data } = await supabase.from("garden_shapes")
        .insert({ garden_id: gardenId, type: "boundary", svg_path: path })
        .select().single();
      if (data) setBoundaryId(data.id);
    }
  }

  async function deleteZone(id: string) {
    await supabase.from("garden_shapes").delete().eq("id", id);
    setZones(prev => prev.filter(z => z.id !== id));
  }

  async function clearBoundary() {
    if (!confirm("Tuingrens verwijderen? Alle zones blijven bewaard.")) return;
    if (boundaryId) await supabase.from("garden_shapes").delete().eq("id", boundaryId);
    setBoundaryPts([]); setClosed(false); setBoundaryId(undefined); setMode("teken");
  }

  async function removePlacement(id: string) {
    await supabase.from("plant_placements").delete().eq("id", id);
    setPlacements(prev => prev.filter(p => p.id !== id));
    setSelectedPlacementId(null);
  }

  async function toggleInPot(id: string) {
    const p = placements.find(pl => pl.id === id);
    if (!p) return;
    const newVal = !p.in_pot;
    setPlacements(prev => prev.map(pl => pl.id === id ? { ...pl, in_pot: newVal } : pl));
    await supabase.from("plant_placements").update({ in_pot: newVal }).eq("id", id);
  }

  async function saveAll() {
    setSaving(true);
    await Promise.all([
      ...placements.map(p =>
        supabase.from("plant_placements").update({ x: p.x, y: p.y, in_pot: p.in_pot }).eq("id", p.id)
      ),
      ...(boundaryId && boundaryPts.length > 0
        ? [supabase.from("garden_shapes").update({ svg_path: JSON.stringify(boundaryPts) }).eq("id", boundaryId)]
        : []),
      ...zones.filter(z => z.id).map(z =>
        supabase.from("garden_shapes").update({ svg_path: JSON.stringify(z.points) }).eq("id", z.id!)
      ),
    ]);
    setSaving(false);
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 2500);
  }
  }

  // ── Shared move/up logic ────────────────────────────────────────────────────

  function applyMove(c: Point) {
    if (boundaryDrag.current) {
      const { index } = boundaryDrag.current;
      setBoundaryPts(prev => prev.map((p, i) => i === index ? { x: c.x, y: c.y } : p));
      return;
    }
    if (!drag.current) return;
    const d = drag.current;
    const dx = c.x - d.sx, dy = c.y - d.sy;
    if (Math.hypot(dx, dy) > 3) d.moved = true;
    if (d.moved) {
      d.lx = c.x; d.ly = c.y;
      setPlacements(prev => prev.map(p => p.id === d.id ? { ...p, x: d.ox + dx, y: d.oy + dy } : p));
    }
  }

  function applyUp() {
    if (boundaryDrag.current) {
      saveBoundary(boundaryPts, boundaryId);
      boundaryDrag.current = null;
      return;
    }
    if (drag.current?.moved) {
      const d = drag.current;
      const finalX = d.ox + (d.lx - d.sx);
      const finalY = d.oy + (d.ly - d.sy);
      supabase.from("plant_placements").update({ x: finalX, y: finalY }).eq("id", d.id);
    }
    drag.current = null;
  }

  // ── Canvas click logic ──────────────────────────────────────────────────────

  function handleCanvasClick(c: Point) {
    setSelectedPlacementId(null);

    if (mode === "teken" && !closed) {
      if (boundaryPts.length >= 3 && Math.hypot(c.x - boundaryPts[0].x, c.y - boundaryPts[0].y) < 15) {
        setClosed(true); setMode("select");
        saveBoundary(boundaryPts, boundaryId);
        return;
      }
      setBoundaryPts(prev => [...prev, c]);
    }

    if (mode === "zon") {
      if (zonePts.length >= 3 && Math.hypot(c.x - zonePts[0].x, c.y - zonePts[0].y) < 15) {
        const z: Shape = { type: "zone", zone_type: zoneType, points: zonePts };
        const path = JSON.stringify(zonePts);
        supabase.from("garden_shapes")
          .insert({ garden_id: gardenId, type: "zone", zone_type: zoneType, svg_path: path })
          .select().single()
          .then(({ data }) => { setZones(prev => [...prev, { ...z, id: data?.id }]); });
        setZonePts([]);
        return;
      }
      setZonePts(prev => [...prev, c]);
    }

    if (mode === "plant" && selectedPlant !== null && closed && inPolygon(c, boundaryPts)) {
      supabase.from("plant_placements")
        .insert({ garden_id: gardenId, plant_id: selectedPlant, x: c.x, y: c.y, in_pot: false })
        .select().single()
        .then(({ data }) => {
          if (data) setPlacements(prev => [...prev, { id: data.id, plant_id: selectedPlant, x: c.x, y: c.y, in_pot: false }]);
        });
    }
  }

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  function handleClick(e: React.MouseEvent) {
    if (drag.current?.moved) return;
    handleCanvasClick(svgCoords(e));
  }

  function handleMouseMove(e: React.MouseEvent) {
    const c = svgCoords(e);
    setMouse(c);
    applyMove(c);
  }

  function handleMouseUp() { applyUp(); }

  function handlePlantMouseDown(e: React.MouseEvent, p: Placement) {
    e.stopPropagation();
    const c = svgCoords(e);
    drag.current = { id: p.id, ox: p.x, oy: p.y, sx: c.x, sy: c.y, lx: c.x, ly: c.y, moved: false };
  }

  function handlePlantClick(e: React.MouseEvent, p: Placement) {
    e.stopPropagation();
    if (drag.current?.moved) return;
    setSelectedPlacementId(prev => prev === p.id ? null : p.id);
  }

  function handleBoundaryPointMouseDown(e: React.MouseEvent, index: number) {
    if (mode !== "teken") return;
    e.stopPropagation();
    const c = svgCoords(e);
    boundaryDrag.current = { index, sx: c.x, sy: c.y };
  }

  // ── Touch handlers ──────────────────────────────────────────────────────────

  function handleSvgTouchMove(e: React.TouchEvent) {
    if (drag.current || boundaryDrag.current) e.preventDefault();
    applyMove(touchCoords(e));
  }

  function handleSvgTouchEnd(e: React.TouchEvent) {
    const wasDragging = drag.current?.moved || !!boundaryDrag.current;
    applyUp();
    if (!wasDragging) handleCanvasClick(clientToSvg(e.changedTouches[0].clientX, e.changedTouches[0].clientY));
  }

  function handlePlantTouchStart(e: React.TouchEvent, p: Placement) {
    e.stopPropagation();
    const c = touchCoords(e);
    drag.current = { id: p.id, ox: p.x, oy: p.y, sx: c.x, sy: c.y, lx: c.x, ly: c.y, moved: false };
  }

  function handlePlantTouchEnd(e: React.TouchEvent, p: Placement) {
    e.stopPropagation();
    if (!drag.current?.moved) {
      applyUp();
      setSelectedPlacementId(prev => prev === p.id ? null : p.id);
    } else {
      applyUp();
    }
  }

  function handleBoundaryTouchStart(e: React.TouchEvent, index: number) {
    if (mode !== "teken") return;
    e.stopPropagation();
    e.preventDefault();
    const c = touchCoords(e);
    boundaryDrag.current = { index, sx: c.x, sy: c.y };
  }

  // ── Misc ────────────────────────────────────────────────────────────────────

  function undo() {
    if (mode === "teken" && !closed) setBoundaryPts(prev => prev.slice(0, -1));
    if (mode === "zon") setZonePts(prev => prev.slice(0, -1));
  }

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedPlacementId) {
        removePlacement(selectedPlacementId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPlacementId]);
  const filteredPlants = plantenDb
    .filter(p => p.naam.toLowerCase().includes(plantSearch.toLowerCase()))
    .slice(0, 60);

  const { viewBox, vbMinX, vbMinY, vbW, vbH } = (() => {
    const allPts = [
      ...boundaryPts,
      ...zones.flatMap(z => z.points),
      ...placements.map(p => ({ x: p.x, y: p.y })),
    ];
    if (allPts.length === 0) return { viewBox: "0 0 600 420", vbMinX: 0, vbMinY: 0, vbW: 600, vbH: 420 };
    const pad = 50;
    const minX = Math.min(...allPts.map(p => p.x)) - pad;
    const minY = Math.min(...allPts.map(p => p.y)) - pad;
    const maxX = Math.max(...allPts.map(p => p.x)) + pad;
    const maxY = Math.max(...allPts.map(p => p.y)) + pad;
    const w = maxX - minX, h = maxY - minY;
    return { viewBox: `${minX} ${minY} ${w} ${h}`, vbMinX: minX, vbMinY: minY, vbW: w, vbH: h };
  })();

  const hint =
    mode === "teken" && !closed && boundaryPts.length === 0 ? "Tik om de tuingrens te tekenen" :
    mode === "teken" && !closed && boundaryPts.length < 3 ? "Voeg meer punten toe" :
    mode === "teken" && !closed ? "Tik op het startpunt ● om te sluiten" :
    mode === "teken" && closed ? "Grens gesloten — kies een andere modus" :
    mode === "zon" && zonePts.length === 0 ? "Tik om een zonzone te tekenen" :
    mode === "zon" && zonePts.length < 3 ? "Voeg meer punten toe" :
    mode === "zon" ? "Tik op het startpunt ● om te sluiten" :
    mode === "plant" && !selectedPlant ? "Selecteer een plant hieronder" :
    mode === "plant" && !closed ? "Teken eerst de tuingrens" :
    mode === "plant" ? "Tik in de tuin om te plaatsen · tik op plant voor opties" :
    "Tik op een plant voor pot-toggle of verwijderen";

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border";
  const btnActive = "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]";
  const btnIdle = "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-[#b0b8a8] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)]";

  return (
    <div className="space-y-2 min-w-0 w-full">
      {/* Toolbar — twee rijen op mobiel */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className={`${btnBase} ${mode === "teken" ? btnActive : btnIdle}`} onClick={() => setMode("teken")}>✎ Tekenen</button>
        {(mode === "teken" || mode === "zon") && (["zon", "halfschaduw", "schaduw"] as ZoneType[]).map(zt => (
          <button
            key={zt}
            onClick={() => { setMode("zon"); setZoneType(zt); }}
            className={`${btnBase} ${mode === "zon" && zoneType === zt ? "ring-2 ring-[var(--color-accent-primary)]" : ""}`}
            style={{ backgroundColor: ZONE_COLORS[zt].fill + "44", borderColor: ZONE_COLORS[zt].stroke }}
          >
            {zt === "zon" ? "☀ Zon" : zt === "halfschaduw" ? "⛅ Half" : "☁ Schaduw"}
          </button>
        ))}
        <button className={`${btnBase} ${mode === "plant" ? btnActive : btnIdle}`} onClick={() => setMode("plant")}>✿ Plant</button>
        <button className={`${btnBase} ${showGrid ? "bg-[var(--color-accent-primary)]/15 border-[var(--color-accent-primary)]/40" : btnIdle}`} onClick={() => setShowGrid(g => !g)}>⊞</button>
        {(mode === "teken" || mode === "zon") && (
          <button className={`${btnBase} ${btnIdle}`} onClick={undo}>↩</button>
        )}
        {(mode === "teken" || mode === "zon") && closed && (
          <button className={`${btnBase} text-red-500 border-red-200 dark:border-red-900`} onClick={clearBoundary}>✕ Grens</button>
        )}
        <button
          className={`${btnBase} ml-auto ${justSaved ? "bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400" : btnIdle}`}
          onClick={saveAll}
          disabled={saving}
        >
          {saving ? "…" : justSaved ? "✓ Opgeslagen" : "↑ Opslaan"}
        </button>
      </div>

      {/* Zone delete buttons */}
      {zones.length > 0 && mode === "zon" && (
        <div className="flex flex-wrap gap-1">
          {zones.map((z, i) => (
            <button
              key={z.id ?? i}
              onClick={() => z.id && deleteZone(z.id)}
              className="text-xs px-2 py-0.5 rounded border"
              style={{ borderColor: ZONE_COLORS[z.zone_type!].stroke, color: ZONE_COLORS[z.zone_type!].stroke }}
            >
              {z.zone_type} ✕
            </button>
          ))}
        </div>
      )}

      {/* Canvas + plant picker */}
      <div className="flex flex-col-reverse md:flex-row gap-3 md:items-start">
        {/* Plant picker — links op desktop, onderaan op mobiel */}
        {mode === "plant" && (
          <div className="w-full md:w-48 shrink-0 space-y-2 min-w-0 overflow-hidden">
            <input
              type="text" placeholder="Zoek plant…" value={plantSearch}
              onChange={e => setPlantSearch(e.target.value)}
              className="w-full max-w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] outline-none focus:border-[var(--color-accent-primary)]"
            />
            <div className="overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[384px]">
              <div className="flex flex-row md:flex-col gap-2 pb-1 md:pb-0 w-max md:w-full">
                {filteredPlants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedPlant(plant.id)}
                    title={plant.naam}
                    className={`flex-shrink-0 md:flex-shrink flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-1.5 rounded-lg border text-xs transition-colors md:w-full ${
                      selectedPlant === plant.id
                        ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10"
                        : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]"
                    }`}
                  >
                    <span className="text-lg">{plant.emoji}</span>
                    <span className="max-w-[56px] md:max-w-none truncate text-[var(--color-text-muted)]">{plant.naam}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <div
          className="flex-1 min-w-0 w-full rounded-xl overflow-hidden border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[#eef5e8] dark:bg-[#1a2a15]"
          style={{ height: 420 }}
      >
        <svg
          ref={svgRef}
          width="100%" height="100%"
          viewBox={closed ? viewBox : undefined}
          style={{ cursor: (mode === "teken" || mode === "zon" || (mode === "plant" && selectedPlant)) ? "crosshair" : "default", touchAction: "none" }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleSvgTouchMove}
          onTouchEnd={handleSvgTouchEnd}
        >
          <defs>
            <filter id="pshadow"><feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.2" /></filter>
            {showGrid && (
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#C0CABD" strokeWidth="0.5" />
              </pattern>
            )}
          </defs>

          {showGrid && <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />}

          {/* Zones */}
          {zones.map((z, i) => (
            <polygon key={z.id ?? i} points={pts(z.points)}
              fill={ZONE_COLORS[z.zone_type!].fill} fillOpacity={ZONE_COLORS[z.zone_type!].opacity}
              stroke={ZONE_COLORS[z.zone_type!].stroke} strokeWidth="1.5" pointerEvents="none" />
          ))}

          {/* Zone preview */}
          {zonePts.length > 0 && (
            <polygon
              points={pts(mouse ? [...zonePts, mouse] : zonePts)}
              fill={ZONE_COLORS[zoneType].fill} fillOpacity={ZONE_COLORS[zoneType].opacity}
              stroke={ZONE_COLORS[zoneType].stroke} strokeWidth="1.5" strokeDasharray="6,4" pointerEvents="none"
            />
          )}
          {mode === "zon" && zonePts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 7 : 4}
              fill={i === 0 ? ZONE_COLORS[zoneType].stroke : "white"}
              stroke={ZONE_COLORS[zoneType].stroke} strokeWidth="2" pointerEvents="none" />
          ))}

          {/* Garden boundary */}
          {closed && (
            <>
              <polygon points={pts(boundaryPts)} fill="#c8e89a" fillOpacity="0.45"
                stroke="#5a9a30" strokeWidth="2.5" pointerEvents="none" />
              {boundaryPts.map((p, i) => {
                const next = boundaryPts[(i + 1) % boundaryPts.length];
                return <AfmetingLabel key={i} a={p} b={next} />;
              })}
              {/* Draggable vertex handles */}
              {boundaryPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={7}
                  fill="white" stroke="#5a9a30" strokeWidth="2"
                  style={{ cursor: mode === "teken" ? "move" : "default" }}
                  onMouseDown={e => handleBoundaryPointMouseDown(e, i)}
                  onTouchStart={e => handleBoundaryTouchStart(e, i)}
                />
              ))}
            </>
          )}

          {/* Boundary drawing preview */}
          {!closed && boundaryPts.length > 0 && (
            <>
              <polyline
                points={pts(mouse ? [...boundaryPts, mouse] : boundaryPts)}
                fill="none" stroke="#5a9a30" strokeWidth="2" strokeDasharray="6,4" pointerEvents="none"
              />
              {boundaryPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 8 : 4}
                  fill={i === 0 ? "#5a9a30" : "white"} stroke="#5a9a30" strokeWidth="2" pointerEvents="none" />
              ))}
              {boundaryPts.map((p, i) => {
                const next = i < boundaryPts.length - 1 ? boundaryPts[i + 1] : mouse;
                if (!next) return null;
                return <AfmetingLabel key={i} a={p} b={next} preview={i === boundaryPts.length - 1} />;
              })}
            </>
          )}

          {/* Plants */}
          {placements.map(p => {
            const plant = plantenDb.find(pl => pl.id === p.plant_id);
            if (!plant) return null;
            const hasTask = (plant.v[currentMonth as keyof typeof plant.v]?.length ?? 0) > 0;
            const selected = selectedPlacementId === p.id;
            const popupOffsetX = (p.x - vbMinX > vbW - 140) ? -120 : 20;
            const popupOffsetY = (p.y - vbMinY < 60) ? 15 : -55;
            return (
              <g key={p.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "grab" }}
                onMouseDown={e => handlePlantMouseDown(e, p)}
                onClick={e => handlePlantClick(e, p)}
                onTouchStart={e => handlePlantTouchStart(e, p)}
                onTouchEnd={e => handlePlantTouchEnd(e, p)}
              >
                <circle r={17} fill={p.in_pot ? "#FDF0EA" : "white"}
                  stroke={selected ? "#2563eb" : p.in_pot ? "#D4784A" : "#5a9a30"}
                  strokeWidth={selected ? 3 : 2} filter="url(#pshadow)" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="13"
                  style={{ userSelect: "none", pointerEvents: "none" }}>{plant.emoji}</text>
                {hasTask && <circle cx={12} cy={-12} r={5} fill="#e85d04" pointerEvents="none" />}
                {p.in_pot && <text x={-17} y={17} fontSize="9" style={{ userSelect: "none", pointerEvents: "none" }}>🪴</text>}

                {/* Popover */}
                {selected && (
                  <g transform={`translate(${popupOffsetX},${popupOffsetY})`} style={{ pointerEvents: "auto" }}>
                    <rect x={0} y={0} width={110} height={52} rx={8}
                      fill="white" stroke="#e5e7eb" strokeWidth="1"
                      filter="url(#pshadow)" />
                    <text x={8} y={16} fontSize="10" fontWeight="600" fill="#111"
                      style={{ userSelect: "none", pointerEvents: "none" }}>
                      {plant.naam}
                    </text>
                    <g onClick={e => { e.stopPropagation(); toggleInPot(p.id); }} style={{ cursor: "pointer" }}>
                      <rect x={6} y={22} width={46} height={22} rx={5}
                        fill={p.in_pot ? "#FDF0EA" : "#f0fdf4"} stroke={p.in_pot ? "#D4784A" : "#5a9a30"} strokeWidth="1" />
                      <text x={29} y={37} textAnchor="middle" fontSize="10" fill={p.in_pot ? "#D4784A" : "#5a9a30"}
                        style={{ userSelect: "none", pointerEvents: "none" }}>
                        {p.in_pot ? "🪴 Pot" : "🌍 Grond"}
                      </text>
                    </g>
                    <g onClick={e => { e.stopPropagation(); removePlacement(p.id); }} style={{ cursor: "pointer" }}>
                      <rect x={58} y={22} width={46} height={22} rx={5}
                        fill="#fff5f5" stroke="#fca5a5" strokeWidth="1" />
                      <text x={81} y={37} textAnchor="middle" fontSize="10" fill="#dc2626"
                        style={{ userSelect: "none", pointerEvents: "none" }}>
                        ✕ Weg
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-[var(--color-text-muted)]">{hint}</p>
    </div>
  );
}
