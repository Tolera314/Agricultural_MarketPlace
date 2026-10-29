import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/**
 * Robustly loads the centralized root .env file from the repository root,
 * regardless of whether the working directory is the repo root or backend/.
 */
export function loadCentralizedEnv(): void {
  // Candidate 1: process.cwd()/../.env (when working directory is backend/)
  const parentEnv = path.resolve(process.cwd(), '../.env');
  if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv });
    return;
  }

  // Candidate 2: process.cwd()/.env (when working directory is repo root)
  const cwdEnv = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(cwdEnv)) {
    dotenv.config({ path: cwdEnv });
    return;
  }

  // Candidate 3: Resolves relative to this source/dist file (backend/src/config -> ../../../.env)
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const candidateRoot = path.resolve(path.dirname(currentFilePath), '../../../.env');
    if (fs.existsSync(candidateRoot)) {
      dotenv.config({ path: candidateRoot });
      return;
    }
  } catch {
    // ignore
  }

  // Fallback
  dotenv.config();
}

loadCentralizedEnv();

export default process.env;

