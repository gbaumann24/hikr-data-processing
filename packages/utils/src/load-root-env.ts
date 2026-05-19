import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export type LoadedRootEnv = {
  rootDir: string;
  loadedFiles: string[];
};

export type LoadRootEnvOptions = {
  startDir?: string;
  files?: readonly string[];
  mode?: string;
  override?: boolean;
};

export function loadRootEnv(options: LoadRootEnvOptions = {}): LoadedRootEnv {
  const rootDir = findWorkspaceRoot(options.startDir ?? process.cwd());
  const loadedFiles: string[] = [];
  const envFromFiles: Record<string, string> = {};

  for (const file of options.files ?? getRootEnvFiles(options.mode)) {
    const filePath = join(rootDir, file);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(envFromFiles, parseEnvFile(readFileSync(filePath, 'utf8')));
    loadedFiles.push(filePath);
  }

  for (const [key, value] of Object.entries(envFromFiles)) {
    if (options.override === true || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return { rootDir, loadedFiles };
}

export function findWorkspaceRoot(startDir: string): string {
  let currentDir = resolve(startDir);

  while (true) {
    const packageJsonPath = join(currentDir, 'package.json');

    if (existsSync(packageJsonPath) && packageJsonHasWorkspaces(packageJsonPath)) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error(`Could not find workspace root from ${startDir}`);
    }

    currentDir = parentDir;
  }
}

function getRootEnvFiles(mode = process.env.BUN_ENV ?? process.env.NODE_ENV): string[] {
  return [
    '.env',
    '.env.local',
    ...(mode ? [`.env.${mode}`, `.env.${mode}.local`] : []),
  ];
}

function packageJsonHasWorkspaces(packageJsonPath: string): boolean {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      workspaces?: unknown;
    };

    return (
      Array.isArray(packageJson.workspaces) ||
      (typeof packageJson.workspaces === 'object' && packageJson.workspaces !== null)
    );
  } catch {
    return false;
  }
}

function parseEnvFile(source: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);

    if (!match) {
      continue;
    }

    values[match[1]] = parseEnvValue(match[2] ?? '');
  }

  return values;
}

function parseEnvValue(rawValue: string): string {
  const trimmedValue = rawValue.trim();
  const firstCharacter = trimmedValue.at(0);
  const lastCharacter = trimmedValue.at(-1);

  if (
    firstCharacter !== undefined &&
    firstCharacter === lastCharacter &&
    ['"', "'", '`'].includes(firstCharacter)
  ) {
    const unquotedValue = trimmedValue.slice(1, -1);

    if (firstCharacter === '"') {
      return unquotedValue
        .replaceAll('\\n', '\n')
        .replaceAll('\\r', '\r')
        .replaceAll('\\t', '\t')
        .replaceAll('\\"', '"')
        .replaceAll('\\\\', '\\');
    }

    return unquotedValue;
  }

  return trimmedValue.replace(/\s+#.*$/, '').trim();
}
