import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../src/host.jsx', import.meta.url), new URL('../dist/host.jsx', import.meta.url));
