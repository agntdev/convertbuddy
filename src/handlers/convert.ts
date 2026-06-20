import { Composer } from "grammy";
import type { Ctx } from "../bot.js";

type Category = "length" | "weight" | "temperature" | "volume";

interface UnitDef {
  category: Category;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export const UNITS: Record<string, UnitDef> = {
  m: { category: "length", toBase: (v) => v, fromBase: (v) => v },
  km: { category: "length", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  cm: { category: "length", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
  mm: { category: "length", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  mi: { category: "length", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  mile: { category: "length", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  miles: { category: "length", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  ft: { category: "length", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  foot: { category: "length", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  feet: { category: "length", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  in: { category: "length", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  inch: { category: "length", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  inches: { category: "length", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  yd: { category: "length", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  yard: { category: "length", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  yards: { category: "length", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },

  g: { category: "weight", toBase: (v) => v, fromBase: (v) => v },
  gram: { category: "weight", toBase: (v) => v, fromBase: (v) => v },
  grams: { category: "weight", toBase: (v) => v, fromBase: (v) => v },
  kg: { category: "weight", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  kilogram: { category: "weight", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  kilograms: { category: "weight", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  mg: { category: "weight", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  milligram: { category: "weight", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  milligrams: { category: "weight", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  lb: { category: "weight", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  lbs: { category: "weight", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  pound: { category: "weight", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  pounds: { category: "weight", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  oz: { category: "weight", toBase: (v) => v * 28.349523125, fromBase: (v) => v / 28.349523125 },
  ounce: { category: "weight", toBase: (v) => v * 28.349523125, fromBase: (v) => v / 28.349523125 },
  ounces: { category: "weight", toBase: (v) => v * 28.349523125, fromBase: (v) => v / 28.349523125 },

  c: { category: "temperature", toBase: (v) => v, fromBase: (v) => v },
  celsius: { category: "temperature", toBase: (v) => v, fromBase: (v) => v },
  f: { category: "temperature", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  fahrenheit: { category: "temperature", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  k: { category: "temperature", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  kelvin: { category: "temperature", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },

  l: { category: "volume", toBase: (v) => v, fromBase: (v) => v },
  liter: { category: "volume", toBase: (v) => v, fromBase: (v) => v },
  liters: { category: "volume", toBase: (v) => v, fromBase: (v) => v },
  litre: { category: "volume", toBase: (v) => v, fromBase: (v) => v },
  litres: { category: "volume", toBase: (v) => v, fromBase: (v) => v },
  ml: { category: "volume", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  milliliter: { category: "volume", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  milliliters: { category: "volume", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  gal: { category: "volume", toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
  gallon: { category: "volume", toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
  gallons: { category: "volume", toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
  qt: { category: "volume", toBase: (v) => v * 0.946352946, fromBase: (v) => v / 0.946352946 },
  quart: { category: "volume", toBase: (v) => v * 0.946352946, fromBase: (v) => v / 0.946352946 },
  quarts: { category: "volume", toBase: (v) => v * 0.946352946, fromBase: (v) => v / 0.946352946 },
  pt: { category: "volume", toBase: (v) => v * 0.473176473, fromBase: (v) => v / 0.473176473 },
  pint: { category: "volume", toBase: (v) => v * 0.473176473, fromBase: (v) => v / 0.473176473 },
  pints: { category: "volume", toBase: (v) => v * 0.473176473, fromBase: (v) => v / 0.473176473 },
  cup: { category: "volume", toBase: (v) => v * 0.2365882365, fromBase: (v) => v / 0.2365882365 },
  cups: { category: "volume", toBase: (v) => v * 0.2365882365, fromBase: (v) => v / 0.2365882365 },
  floz: { category: "volume", toBase: (v) => v * 0.0295735295625, fromBase: (v) => v / 0.0295735295625 },
  "fl oz": { category: "volume", toBase: (v) => v * 0.0295735295625, fromBase: (v) => v / 0.0295735295625 },
};

function toSigDigits(n: number, digits: number): number {
  if (n === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(n)));
  const shift = digits - d;
  const factor = Math.pow(10, shift);
  return Math.round(n * factor) / factor;
}

const USAGE = "Usage: /convert <value> <from_unit> to <to_unit>\nExample: /convert 100 km to miles";

const composer = new Composer<Ctx>();

composer.command("convert", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const parts = text.trim().split(/\s+/);

  if (parts.length < 5 || !parts[0].startsWith("/convert")) {
    await ctx.reply("Invalid format. " + USAGE);
    return;
  }

  const valueStr = parts[1];
  const fromIdx = 2;

  const toIdx = parts.indexOf("to", fromIdx);
  if (toIdx === -1 || toIdx + 1 >= parts.length) {
    await ctx.reply("Missing 'to' keyword or target unit. " + USAGE);
    return;
  }

  const fromWords = parts.slice(fromIdx, toIdx);
  const toWords = parts.slice(toIdx + 1);

  const fromUnit = fromWords.join(" ").toLowerCase();
  const toUnit = toWords.join(" ").toLowerCase();

  const value = Number(valueStr);
  if (isNaN(value) || valueStr.trim() === "") {
    await ctx.reply(`"${valueStr}" is not a valid number.`);
    return;
  }

  const fromDef = UNITS[fromUnit];
  const toDef = UNITS[toUnit];

  if (!fromDef) {
    await ctx.reply(`Unknown unit: "${fromUnit}". Try /convert 100 km to miles`);
    return;
  }
  if (!toDef) {
    await ctx.reply(`Unknown unit: "${toUnit}". Try /convert 100 km to miles`);
    return;
  }
  if (fromDef.category !== toDef.category) {
    await ctx.reply(
      `Cannot convert "${fromUnit}" (${fromDef.category}) to "${toUnit}" (${toDef.category}). Units must be of the same type.`,
    );
    return;
  }

  const baseVal = fromDef.toBase(value);
  const result = toDef.fromBase(baseVal);
  const rounded = toSigDigits(result, 6);

  await ctx.reply(`${value} ${fromUnit} = ${rounded} ${toUnit}`);
});

export default composer;
