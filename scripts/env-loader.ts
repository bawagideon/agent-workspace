import fs from 'fs';
import path from 'path';

export interface EnvLoadResult {
  loadedFile: string | null;
  keysFound: string[];
}

export function loadEnvironment(): EnvLoadResult {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../apps/hq/.env.local'),
    path.resolve(__dirname, '../apps/hq/.env'),
    path.resolve(process.cwd(), 'apps/hq/.env.local'),
    path.resolve(process.cwd(), 'apps/hq/.env')
  ];

  const uniquePaths = Array.from(new Set(possiblePaths));
  let loadedFile: string | null = null;
  const keysFound: string[] = [];

  for (const envPath of uniquePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        // Handle Windows \r\n and Unix \n
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            // Remove optional quotes (single, double, or backticks)
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'")) ||
                (val.startsWith('`') && val.endsWith('`'))) {
              val = val.slice(1, -1);
            }
            
            // Only set if not already set by system environment
            if (key) {
              process.env[key] = val;
              keysFound.push(key);
            }
          }
        }
        loadedFile = envPath;
        break; // Stop after first valid env file loaded
      } catch (err) {
        // Continue searching
      }
    }
  }

  return {
    loadedFile,
    keysFound: Array.from(new Set(keysFound))
  };
}
