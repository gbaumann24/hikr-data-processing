const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function normalizeDescription(description: string | null | undefined): string {
  return decodeHtmlEntities(stripHtml(description ?? ''))
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDifficultyValue(value: string | null | undefined): string | null {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  const placeholder = normalized.toLowerCase();

  if (
    placeholder === '' ||
    placeholder === '-' ||
    placeholder === '--' ||
    placeholder === 'n/a' ||
    placeholder === 'na' ||
    placeholder === 'n.a.' ||
    placeholder === 'k.a.' ||
    placeholder === 'keine'
  ) {
    return null;
  }

  return normalized;
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? _match : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? _match : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[entity.toLowerCase()] ?? _match;
  });
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}
