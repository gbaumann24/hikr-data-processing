import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { climbingExtractionAgentResultSchema } from '../../apps/agent/src/mastra/workflows/climbing/extraction/types.ts';

const outputDir = resolve('outputs/schema-proofread');
const outputPath = join(outputDir, 'climbing-extraction-schema-fields.xlsx');

const schema = climbingExtractionAgentResultSchema.toJSONSchema();
const generatedAt = new Date().toISOString();

const headers = [
  'Path',
  'Field',
  'Level',
  'Type',
  'Required',
  'Nullable',
  'Enum / Const / Items',
  'Description',
  'Review Notes',
];

function normalizeSchema(node) {
  if (!node || typeof node !== 'object') {
    return { schema: {}, nullable: false };
  }

  if (Array.isArray(node.anyOf)) {
    const nullable = node.anyOf.some((item) => item?.type === 'null');
    const nonNull = node.anyOf.find((item) => item?.type !== 'null') ?? {};
    return {
      schema: {
        ...nonNull,
        description: node.description ?? nonNull.description,
      },
      nullable,
    };
  }

  return { schema: node, nullable: false };
}

function typeLabel(node) {
  const { schema: base, nullable } = normalizeSchema(node);
  let label = 'unknown';

  if (base.const !== undefined) {
    label = 'literal';
  } else if (base.enum) {
    label = 'enum';
  } else if (base.type === 'array') {
    const item = normalizeSchema(base.items ?? {}).schema;
    const itemType = item.enum ? 'enum' : item.const !== undefined ? 'literal' : item.type ?? 'unknown';
    label = `array<${itemType}>`;
  } else if (Array.isArray(base.type)) {
    label = base.type.filter((value) => value !== 'null').join(' | ');
  } else if (base.type) {
    label = base.type;
  }

  return nullable ? `${label} | null` : label;
}

function enumOrConstLabel(node) {
  const { schema: base } = normalizeSchema(node);

  if (base.const !== undefined) {
    return `const: ${String(base.const)}`;
  }

  if (Array.isArray(base.enum)) {
    return base.enum.join(', ');
  }

  if (base.type === 'array' && base.items) {
    const item = normalizeSchema(base.items).schema;
    if (Array.isArray(item.enum)) {
      return `items enum: ${item.enum.join(', ')}`;
    }
    if (item.const !== undefined) {
      return `items const: ${String(item.const)}`;
    }
    if (item.type) {
      return `items: ${item.type}`;
    }
  }

  return '';
}

function leafName(path) {
  if (path === '$') {
    return '(root)';
  }

  const parts = path.split('.');
  return parts[parts.length - 1];
}

function walk(node, path = '$', level = 0, required = true, rows = [], enumRows = []) {
  const { schema: base, nullable } = normalizeSchema(node);

  rows.push({
    path,
    field: leafName(path),
    level,
    type: typeLabel(node),
    required: required ? 'Yes' : 'No',
    nullable: nullable ? 'Yes' : 'No',
    enumInfo: enumOrConstLabel(node),
    description: base.description ?? '',
    reviewNotes: '',
  });

  if (Array.isArray(base.enum)) {
    base.enum.forEach((value, index) => {
      enumRows.push([path, index + 1, value, base.description ?? '']);
    });
  }

  if (base.const !== undefined) {
    enumRows.push([path, 1, `const: ${String(base.const)}`, base.description ?? '']);
  }

  if (base.type === 'object' && base.properties) {
    const requiredSet = new Set(base.required ?? []);

    for (const [key, child] of Object.entries(base.properties)) {
      walk(child, path === '$' ? key : `${path}.${key}`, level + 1, requiredSet.has(key), rows, enumRows);
    }
  }

  if (base.type === 'array' && base.items) {
    const itemPath = `${path}[]`;
    const { schema: item } = normalizeSchema(base.items);

    if (Array.isArray(item.enum)) {
      item.enum.forEach((value, index) => {
        enumRows.push([`${path}[]`, index + 1, value, item.description ?? base.description ?? '']);
      });
    }

    if (item.type === 'object' && item.properties) {
      const requiredSet = new Set(item.required ?? []);

      for (const [key, child] of Object.entries(item.properties)) {
        walk(child, `${itemPath}.${key}`, level + 1, requiredSet.has(key), rows, enumRows);
      }
    } else if (item.type && item.type !== 'object') {
      rows.push({
        path: itemPath,
        field: '[]',
        level: level + 1,
        type: typeLabel(base.items),
        required: 'Item',
        nullable: normalizeSchema(base.items).nullable ? 'Yes' : 'No',
        enumInfo: enumOrConstLabel(base.items),
        description: item.description ?? '',
        reviewNotes: '',
      });
    }
  }

  return { rows, enumRows };
}

const { rows, enumRows } = walk(schema);

const fieldRows = [
  headers,
  ...rows.map((row) => [
    row.path,
    row.field,
    row.level,
    row.type,
    row.required,
    row.nullable,
    row.enumInfo,
    row.description,
    row.reviewNotes,
  ]),
];

const enumSheetRows = [
  ['Path', 'Option #', 'Value', 'Field Description'],
  ...enumRows,
];

const infoRows = [
  ['Key', 'Value'],
  ['Schema version', schema.properties?.schemaVersion?.const ?? ''],
  ['Generated at', generatedAt],
  ['Source file', 'apps/agent/src/mastra/workflows/climbing/extraction/types.ts'],
  ['Field rows', rows.length],
  ['Enum / const option rows', enumRows.length],
  ['Root description', schema.description ?? ''],
];

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function colName(index) {
  let name = '';
  let n = index + 1;

  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }

  return name;
}

function cellXml(value, rowIndex, colIndex, styleId = 2) {
  const ref = `${colName(colIndex)}${rowIndex}`;

  if (typeof value === 'number') {
    return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr" s="${styleId}"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function rowHeight(row) {
  const maxChars = Math.max(...row.map((value) => String(value ?? '').length));
  return Math.min(132, Math.max(22, 16 + Math.ceil(maxChars / 95) * 15));
}

function sheetXml(rowsMatrix, { widths, freezeFirstColumn = false }) {
  const lastCol = colName((rowsMatrix[0]?.length ?? 1) - 1);
  const lastRow = rowsMatrix.length;
  const colsXml = widths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join('');
  const pane = freezeFirstColumn
    ? '<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="B2" sqref="B2"/>'
    : '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>';

  const rowsXml = rowsMatrix
    .map((row, rowOffset) => {
      const rowIndex = rowOffset + 1;
      const styleId = rowIndex === 1 ? 1 : 2;
      const height = rowIndex === 1 ? 28 : rowHeight(row);
      const cells = row.map((value, colIndex) => cellXml(value, rowIndex, colIndex, styleId)).join('');
      return `<row r="${rowIndex}" ht="${height}" customHeight="1">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastCol}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  <autoFilter ref="A1:${lastCol}${lastRow}"/>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Schema Fields" sheetId="1" r:id="rId1"/>
    <sheet name="Enum Options" sheetId="2" r:id="rId2"/>
    <sheet name="Schema Info" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/><family val="2"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E5F"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD9E2E7"/></left>
      <right style="thin"><color rgb="FFD9E2E7"/></right>
      <top style="thin"><color rgb="FFD9E2E7"/></top>
      <bottom style="thin"><color rgb="FFD9E2E7"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

function coreXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Climbing Extraction Schema Fields</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>3</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="3" baseType="lpstr"><vt:lpstr>Schema Fields</vt:lpstr><vt:lpstr>Enum Options</vt:lpstr><vt:lpstr>Schema Info</vt:lpstr></vt:vector></TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>`;
}

async function writePackage() {
  await mkdir(outputDir, { recursive: true });
  const tempDir = await mkdtemp(join(tmpdir(), 'schema-xlsx-'));

  try {
    await mkdir(join(tempDir, '_rels'), { recursive: true });
    await mkdir(join(tempDir, 'docProps'), { recursive: true });
    await mkdir(join(tempDir, 'xl', '_rels'), { recursive: true });
    await mkdir(join(tempDir, 'xl', 'worksheets'), { recursive: true });

    await writeFile(join(tempDir, '[Content_Types].xml'), contentTypesXml());
    await writeFile(join(tempDir, '_rels', '.rels'), rootRelsXml());
    await writeFile(join(tempDir, 'docProps', 'core.xml'), coreXml());
    await writeFile(join(tempDir, 'docProps', 'app.xml'), appXml());
    await writeFile(join(tempDir, 'xl', 'workbook.xml'), workbookXml());
    await writeFile(join(tempDir, 'xl', '_rels', 'workbook.xml.rels'), workbookRelsXml());
    await writeFile(join(tempDir, 'xl', 'styles.xml'), stylesXml());
    await writeFile(
      join(tempDir, 'xl', 'worksheets', 'sheet1.xml'),
      sheetXml(fieldRows, {
        widths: [58, 26, 8, 22, 11, 11, 60, 100, 30],
        freezeFirstColumn: true,
      }),
    );
    await writeFile(
      join(tempDir, 'xl', 'worksheets', 'sheet2.xml'),
      sheetXml(enumSheetRows, {
        widths: [58, 11, 34, 100],
      }),
    );
    await writeFile(
      join(tempDir, 'xl', 'worksheets', 'sheet3.xml'),
      sheetXml(infoRows, {
        widths: [24, 130],
      }),
    );

    const zip = spawnSync('zip', ['-qr', outputPath, '.'], {
      cwd: tempDir,
      encoding: 'utf8',
    });

    if (zip.status !== 0) {
      throw new Error(`zip failed: ${zip.stderr || zip.stdout}`);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

await writePackage();
console.log(JSON.stringify({ outputPath, fieldRows: rows.length, enumRows: enumRows.length }, null, 2));
