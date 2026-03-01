/**
 * ─── Plugin Registry ──────────────────────────────────────────────────────────
 *
 * This is the ONLY file outside your own plugin file that you need to touch
 * when adding a new plugin. Two steps:
 *
 *   1. Import your plugin class below.
 *   2. Add it to createPatternPlugins() or createScorePlugins() — one line.
 *
 * Everything else (types, config, tests) lives entirely in your plugin file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  PatternPlugin,
  ScorePlugin,
  SmellcheckConfig,
  TypographyPluginConfig,
  UnicodePluginConfig,
  BuzzwordsPluginConfig,
  UnnaturalPluginConfig,
  SentenceUniformityConfig,
} from '../types.js';

// ── PatternPlugin imports ─────────────────────────────────────────────────────
import { TypographyPlugin } from './typography.js';
import { UnicodePlugin }    from './unicode.js';
import { BuzzwordsPlugin }  from './buzzwords.js';
import { UnnaturalPlugin }  from './unnatural.js';
// ADD NEW PatternPlugin IMPORTS HERE ↑

// ── ScorePlugin imports ───────────────────────────────────────────────────────
import { SentenceUniformityPlugin } from './sentence-uniformity.js';
// ADD NEW ScorePlugin IMPORTS HERE ↑

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEnabled(setting: boolean | object | undefined): boolean {
  if (setting === undefined) return true;
  if (typeof setting === 'boolean') return setting;
  if (typeof setting === 'object' && 'enabled' in setting) return (setting as { enabled?: boolean }).enabled ?? true;
  return true;
}

function getConfig<T>(setting: boolean | T | undefined): T {
  if (!setting || typeof setting === 'boolean') return {} as T;
  return setting;
}

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Returns all enabled PatternPlugin instances, configured from SmellcheckConfig.
 * To add a new PatternPlugin: import it above and add one line here.
 */
export function createPatternPlugins(config: SmellcheckConfig): PatternPlugin[] {
  const p = config.plugins ?? {};
  const plugins: PatternPlugin[] = [];

  if (isEnabled(p.typography)) plugins.push(new TypographyPlugin(getConfig<TypographyPluginConfig>(p.typography)));
  if (isEnabled(p.unicode))    plugins.push(new UnicodePlugin(getConfig<UnicodePluginConfig>(p.unicode)));
  if (isEnabled(p.buzzwords))  plugins.push(new BuzzwordsPlugin(getConfig<BuzzwordsPluginConfig>(p.buzzwords)));
  if (isEnabled(p.unnatural))  plugins.push(new UnnaturalPlugin(getConfig<UnnaturalPluginConfig>(p.unnatural)));
  // ADD NEW PatternPlugin REGISTRATIONS HERE ↑

  return plugins;
}

/**
 * Returns all enabled ScorePlugin instances, configured from SmellcheckConfig.
 * To add a new ScorePlugin: import it above and add one line here.
 */
export function createScorePlugins(config: SmellcheckConfig): ScorePlugin[] {
  const p = config.plugins ?? {};
  const plugins: ScorePlugin[] = [];

  if (isEnabled(p.sentenceUniformity)) plugins.push(new SentenceUniformityPlugin(getConfig<SentenceUniformityConfig>(p.sentenceUniformity)));
  // ADD NEW ScorePlugin REGISTRATIONS HERE ↑

  return plugins;
}
