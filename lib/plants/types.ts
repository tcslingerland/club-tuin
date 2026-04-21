export type ZonType = "zon" | "halfschaduw" | "schaduw" | "beide";
export type WaterType = "weinig" | "matig" | "veel";
export type WintergroenType = "wintergroen" | "halfwintergroen" | "bladverliezen";
export type PlantCategory =
  | "bloem"
  | "bol"
  | "struik"
  | "klimplant"
  | "boom"
  | "groente"
  | "kruid"
  | "vaste plant"
  | "vaste planten"
  | "fruit"
  | "gras"
  | "siergras"
  | "varen"
  | "bodembedekker";

export interface EcoScore {
  /** insecten aantrekkelijkheid 0–3 */
  ins: number;
  /** vogelwaarde 0–3 */
  vog: number;
  /** bestuiverswaarde 0–1 */
  bes: number;
}

/** Monthly care tasks: key = month number (1–12), value = task strings */
export type CareSchedule = Partial<Record<number, string[]>>;

export interface Plant {
  id: number;
  naam: string;
  latijn: string;
  cat: PlantCategory;
  emoji: string;
  zon: ZonType;
  water: WaterType;
  /** wintergroenstatus */
  wg: WintergroenType;
  /** hoogte in meters */
  h: number;
  eco: EcoScore;
  /** verzorgingskalender per maand */
  v: CareSchedule;
}
