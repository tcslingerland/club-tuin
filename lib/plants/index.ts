import { bloemen } from "./categories/bloemen";
import { bollen } from "./categories/bollen";
import { struiken } from "./categories/struiken";
import { klimplanten } from "./categories/klimplanten";
import { bomen } from "./categories/bomen";
import { kruiden } from "./categories/kruiden";
import { vasteplanten } from "./categories/vasteplanten";
import { fruit } from "./categories/fruit";
import { grassen } from "./categories/grassen";
import { varens } from "./categories/varens";
import { bodembedekkers } from "./categories/bodembedekkers";
import type { Plant, PlantCategory } from "./types";

export type { Plant, PlantCategory };
export type { ZonType, WaterType, WintergroenType, EcoScore, CareSchedule } from "./types";

export const plantenDb: Plant[] = [
  ...bloemen,
  ...bollen,
  ...struiken,
  ...klimplanten,
  ...bomen,
  ...kruiden,
  ...vasteplanten,
  ...fruit,
  ...grassen,
  ...varens,
  ...bodembedekkers,
].sort((a, b) => a.id - b.id);

export function getPlantById(id: number): Plant | undefined {
  return plantenDb.find((p) => p.id === id);
}

export function getPlantsByCategory(cat: PlantCategory): Plant[] {
  return plantenDb.filter((p) => p.cat === cat);
}

export function getPlantCategories(): PlantCategory[] {
  return [...new Set(plantenDb.map((p) => p.cat))];
}

export function searchPlanten(query: string): Plant[] {
  const q = query.toLowerCase();
  return plantenDb.filter(
    (p) =>
      p.naam.toLowerCase().includes(q) ||
      p.latijn.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q)
  );
}
