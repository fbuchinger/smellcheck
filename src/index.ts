// ─── Main Entry Point ────────────────────────────────────────────────────────

export { Smellcheck } from './detector.js';
export { loadFileConfig, mergeConfigs } from './config.js';

// Plugins (for custom use or extension)
export { TypographyPlugin } from './plugins/typography.js';
export { UnicodePlugin }   from './plugins/unicode.js';
export { BuzzwordsPlugin } from './plugins/buzzwords.js';
export { UnnaturalPlugin } from './plugins/unnatural.js';

// Renderers
export { renderHtml, renderLegendHtml, renderSummaryHtml } from './renderer/html.js';
export { renderCli, renderCliSummary } from './renderer/cli.js';

// Input helpers
export { readFromClipboard, readFromStdin, readFromFile, watchTextarea } from './input/index.js';

// Types
export type {
  Match,
  PluginResult,
  SlobPlugin,
  SmellcheckConfig,
  SmellcheckResult,
  TypographyPluginConfig,
  UnicodePluginConfig,
  BuzzwordsPluginConfig,
  UnnaturalPluginConfig,
} from './types.js';

// ─── Convenience factory ─────────────────────────────────────────────────────

import { Smellcheck } from './detector.js';
import { loadFileConfig, mergeConfigs } from './config.js';
import type { SmellcheckConfig } from './types.js';

/**
 * Creates a Smellcheck instance, merging smellcheck.config.json (if found)
 * with any programmatic config you pass in.
 *
 * @example
 * const checker = await createSmellcheck({ plugins: { unicode: false } });
 * const result = checker.analyze(text);
 */
export async function createSmellcheck(config: SmellcheckConfig = {}): Promise<Smellcheck> {
  const fileConfig = await loadFileConfig();
  const merged = mergeConfigs(fileConfig, config);
  return new Smellcheck(merged);
}
