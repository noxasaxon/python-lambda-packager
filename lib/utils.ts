import { existsSync, mkdirSync } from 'fs';

// fs-extra isn't converted to ESM syntax, so we need to use regular fs
// https://ar.al/2021/03/07/fs-extra-to-fs/

export function ensureDirSync(directory) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}
