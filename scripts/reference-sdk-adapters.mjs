// Read-only registry for reviewed SDK handling. It deliberately contains no code that
// bypasses a publisher lock, simulates an account, or reports fabricated ad rewards.
import { readFileSync } from 'node:fs';

const sdkDocument = JSON.parse(readFileSync(new URL('../docs/V4_SDK_DEPENDENCIES.json', import.meta.url), 'utf8'));
const bySlug = new Map(sdkDocument.games.map(game => [game.slug, game]));

/** Return the reviewed SDK/runtime notes for a catalogue slug, or null if unreviewed. */
export function getReferenceSdkDependency(slug) {
  return bySlug.get(slug) ?? null;
}

/**
 * Return a safe, explicitly recorded local adapter reference.
 * Only a guest-only adapter with a concrete local file is executable by a preparer.
 */
export function getLocalOfflineSdkAdapter(slug) {
  const adapter = bySlug.get(slug)?.adapter;
  if (!adapter?.file || adapter.mode !== 'guest-only offline compatibility') return null;
  if (!/^[a-z0-9./_-]+$/.test(adapter.file) || adapter.file.split('/').includes('..')) {
    throw new Error(`Unsafe local SDK adapter path for ${slug}`);
  }
  return { ...adapter };
}

/** Publisher runtimes and non-guest adapters are never eligible for automatic injection. */
export function canInjectLocalOfflineSdkAdapter(slug) {
  return getLocalOfflineSdkAdapter(slug) !== null;
}

export const referenceSdkPolicy = Object.freeze([...sdkDocument.policy]);
