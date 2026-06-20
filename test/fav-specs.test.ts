import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildBot } from "../src/bot.js";
import { runSpecs, parseBotSpec } from "../src/toolkit/index.js";

describe("fav specs", () => {
  const specFiles = ["E2T1.json", "E3T1.json", "fix-6fb9894c3d8c8189.json"];
  for (const specFile of specFiles) {
    it(`${specFile} passes all specs`, async () => {
      const raw = JSON.parse(
        readFileSync(new URL(`../tests/specs/${specFile}`, import.meta.url), "utf8"),
      ) as unknown[];
      const specs = raw.map(parseBotSpec);
      const suite = await runSpecs(() => buildBot("test-token"), specs);
      for (const r of suite.results) {
        if (!r.ok) {
          const failures = r.steps
            .filter((s) => !s.ok)
            .map((s) => s.failures.join("; "))
            .join("\n");
          console.log(`FAIL: ${r.name}\n${failures}`);
        }
      }
      expect(suite.failed).toBe(0);
    });
  }
});
