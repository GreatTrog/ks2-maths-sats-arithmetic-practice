import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cacheDir = path.join(os.tmpdir(), 'gh-pages-cache');
const ghPagesBin = path.resolve('node_modules', 'gh-pages', 'bin', 'gh-pages');

const result = spawnSync(process.execPath, [ghPagesBin, '-d', 'dist'], {
  stdio: 'inherit',
  env: {...process.env, CACHE_DIR: cacheDir},
});

if (result.error) {
  throw result.error;
}

if (result.status && result.status !== 0) {
  process.exit(result.status);
}
