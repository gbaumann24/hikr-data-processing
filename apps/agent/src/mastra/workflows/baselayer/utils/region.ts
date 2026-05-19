import { decodeHtmlEntities } from './normalization';

export type RegionParseResult = {
  tokens: string[];
  canton: string | null;
  region: string | null;
};

const CANTON_ALIASES = new Map<string, string>();

for (const [canonical, aliases] of Object.entries({
  Aargau: ['AG'],
  Appenzell: [
    'AP',
    'AR',
    'AI',
    'Appenzell Ausserrhoden',
    'Appenzell Innerrhoden',
    'Appenzell AR',
    'Appenzell AI',
    'Appenzell A.Rh.',
    'Appenzell I.Rh.',
  ],
  'Basel Land': ['BL', 'Basel-Landschaft', 'Basel Landschaft', 'Baselland', 'Basel-Land'],
  'Basel Stadt': ['BS', 'Basel-Stadt'],
  Bern: ['BE', 'Berne'],
  Freiburg: ['FR', 'Fribourg'],
  Genf: ['GE', 'Geneva', 'Geneve', 'Genève'],
  Glarus: ['GL'],
  Graubünden: ['GR', 'Graubuenden', 'Grisons', 'Grigioni'],
  Jura: ['JU'],
  Luzern: ['LU', 'Lucerne'],
  Neuenburg: ['NE', 'Neuchatel', 'Neuchâtel'],
  Nidwalden: ['NW'],
  Obwalden: ['OW'],
  Schaffhausen: ['SH'],
  Schwyz: ['SZ'],
  Solothurn: ['SO'],
  'St.Gallen': ['SG', 'St. Gallen', 'Sankt Gallen', 'Saint Gallen'],
  Tessin: ['TI', 'Ticino'],
  Thurgau: ['TG'],
  Uri: ['UR'],
  Waadt: ['VD', 'Vaud'],
  Wallis: ['VS', 'Valais'],
  Zug: ['ZG'],
  Zürich: ['ZH', 'Zuerich', 'Zurich'],
})) {
  CANTON_ALIASES.set(normalizeCantonLookupKey(canonical), canonical);
  for (const alias of aliases) {
    CANTON_ALIASES.set(normalizeCantonLookupKey(alias), canonical);
  }
}

export function parseRegionPath(regionPathCsv: string | null | undefined): RegionParseResult {
  const tokens = parseCsvLine(regionPathCsv ?? '');
  const cantonIndex = tokens.findIndex((token) => lookupCanton(token) !== null);
  const canton = cantonIndex >= 0 ? lookupCanton(tokens[cantonIndex]) : null;
  const region = cantonIndex >= 0 ? tokens[cantonIndex + 1] ?? null : null;

  return { tokens, canton, region };
}

function parseCsvLine(value: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === '"') {
      if (inQuotes && value[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      pushCleanField(fields, current);
      current = '';
      continue;
    }

    current += char;
  }

  pushCleanField(fields, current);
  return fields;
}

function pushCleanField(fields: string[], value: string): void {
  const cleaned = decodeHtmlEntities(value)
    .replace(/^[\s"'`“”‘’]+|[\s"'`“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned !== '') {
    fields.push(cleaned);
  }
}

function lookupCanton(value: string): string | null {
  const key = normalizeCantonLookupKey(value).replace(/^kanton /, '');
  return CANTON_ALIASES.get(key) ?? null;
}

function normalizeCantonLookupKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
