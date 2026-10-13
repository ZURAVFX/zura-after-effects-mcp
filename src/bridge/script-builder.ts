import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = readFileSync(new URL('../host.jsx', import.meta.url), 'utf8');
const version = createHash('sha256').update(source).digest('hex').slice(0, 16);
export function getHelpersSource() { return source + '\nvar __ZURA_AE_VERSION = "' + version + '";'; }
export function helpersFileName() { return 'ae-helpers_' + version + '.jsx'; }
export function buildBootstrap(path: string) { return 'if (typeof __ZURA_AE_VERSION === "undefined" || __ZURA_AE_VERSION !== "' + version + '") $.evalFile(' + literal(path) + ');'; }
export function literal(value: unknown): string {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
}
