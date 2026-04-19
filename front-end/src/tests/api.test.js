import { describe, it, expect } from "vitest";
import { resolveMediaUrl } from "../services/api";

describe("resolveMediaUrl", () => {
  it("retourne telle quelle une URL absolue", () => {
    expect(resolveMediaUrl("https://example.com/image.jpg")).toBe(
      "https://example.com/image.jpg"
    );
  });

  it("construit une URL complete a partir d'un chemin relatif", () => {
    expect(resolveMediaUrl("/images/poster.jpg")).toBe(
      "/images/poster.jpg"
    );
  });

  it("retourne une chaine vide si la valeur est absente", () => {
    expect(resolveMediaUrl("")).toBe("");
  });
});
