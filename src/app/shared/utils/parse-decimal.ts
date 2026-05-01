/**
 * Converte uma string decimal (aceita vírgula ou ponto) para number.
 * Ex: "1,70" → 1.7   |   "1.000" → 1   |   "150" → 150
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  // Troca vírgula por ponto e remove separadores de milhar (pontos antes de 3 dígitos)
  const normalized = String(value).trim().replace(/\./g, ',').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/** Formata number para string BR (ex: 1.7 → "1,70" | 150 → "150") */
export function formatDecimal(value: number, decimais = 2): string {
  if (!value) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : decimais,
    maximumFractionDigits: decimais,
  });
}
