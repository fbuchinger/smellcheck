export { Smellcheck } from './detector.js';
export { loadFileConfig, mergeConfigs } from './config.js';

// Plugins
export { TypographyPlugin }         from './plugins/typography.js';
export { UnicodePlugin }            from './plugins/unicode.js';
export { BuzzwordsPlugin }          from './plugins/buzzwords.js';
export { UnnaturalPlugin }          from './plugins/unnatural.js';
export { SentenceUniformityPlugin } from './plugins/sentence-uniformity.js';

// Renderers
export { renderHtml, renderLegendHtml, renderSummaryHtml, renderScoredPluginsHtml } from './renderer/html.js';
export { renderCli, renderCliSummary } from './renderer/cli.js';

// Input helpers
export { readFromClipboard, readFromStdin, readFromFile, watchTextarea } from './input/index.js';

// Types
export type {
  Match,
  PluginResult,
  PatternPlugin,
  ScorePlugin,
  ScorePluginResult,
  Finding,
  FindingSeverity,
  SmellcheckConfig,
  SmellcheckResult,
  TypographyPluginConfig,
  UnicodePluginConfig,
  BuzzwordsPluginConfig,
  UnnaturalPluginConfig,
  SentenceUniformityConfig,
} from './types.js';

// Convenience async factory
import { Smellcheck } from './detector.js';
import { loadFileConfig, mergeConfigs } from './config.js';
import type { SmellcheckConfig } from './types.js';

export async function createSmellcheck(config: SmellcheckConfig = {}): Promise<Smellcheck> {
  const fileConfig = await loadFileConfig();
  const merged = mergeConfigs(fileConfig, config);
  return new Smellcheck(merged);
}
