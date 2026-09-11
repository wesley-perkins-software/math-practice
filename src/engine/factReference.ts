export interface FactReferenceEntry {
  display: string;
}

export function getMultiplicationFacts(base: number): FactReferenceEntry[] {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { display: `${base} × ${n} = ${base * n}` };
  });
}

export function getDivisionFacts(base: number): FactReferenceEntry[] {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { display: `${base * n} ÷ ${base} = ${n}` };
  });
}
