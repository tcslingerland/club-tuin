import type { Plant } from "@/lib/plants/types";

export interface BiodivScores {
  insecten: number;   // 0–25
  vogels: number;     // 0–25
  bloei: number;      // 0–20
  structuur: number;  // 0–15
  winter: number;     // 0–15
  totaal: number;     // 0–100
}

export function berekenBiodiversiteit(planten: Plant[]): BiodivScores {
  if (planten.length === 0) {
    return { insecten: 0, vogels: 0, bloei: 0, structuur: 0, winter: 0, totaal: 0 };
  }

  // Insecten (0–25): gemiddelde eco.ins (0–3) geschaald
  const insGem = planten.reduce((s, p) => s + p.eco.ins, 0) / planten.length;
  const insecten = Math.round((insGem / 3) * 25);

  // Vogels (0–25): planten met eco.vog >= 2, bonus voor bessen
  const vogelPlanten = planten.filter(p => p.eco.vog >= 2).length;
  const heeftBessen = planten.some(p => p.eco.bes === 1);
  const vogels = Math.min(25, Math.round((vogelPlanten / planten.length) * 20) + (heeftBessen ? 5 : 0));

  // Bloeidekking (0–20): unieke bloeimaanden
  const bloeiMaanden = new Set<number>();
  for (const plant of planten) {
    for (const maand of Object.keys(plant.v).map(Number)) {
      bloeiMaanden.add(maand);
    }
  }
  const bloei = Math.round((bloeiMaanden.size / 12) * 20);

  // Structuur (0–15): diversiteit in hoogtelagen
  const lagen = new Set<number>();
  for (const p of planten) {
    if (p.h < 0.3) lagen.add(0);
    else if (p.h < 1) lagen.add(1);
    else if (p.h < 3) lagen.add(2);
    else lagen.add(3);
  }
  const structuur = Math.round((lagen.size / 4) * 15);

  // Winterhabitat (0–15): wintergroen + winterbessen
  const heeftWintergroen = planten.some(p => p.wg === "wintergroen" || p.wg === "halfwintergroen");
  const heeftWinterbessen = planten.some(p => p.eco.bes === 1);
  let winter = 0;
  if (heeftWintergroen && heeftWinterbessen) winter = 15;
  else if (heeftWintergroen || heeftWinterbessen) winter = planten.length >= 3 ? 10 : 7;

  const totaal = insecten + vogels + bloei + structuur + winter;

  return { insecten, vogels, bloei, structuur, winter, totaal };
}

export function biodivKleur(totaal: number): string {
  if (totaal >= 70) return "#4A7C59";
  if (totaal >= 40) return "#C8973A";
  return "#B05050";
}
