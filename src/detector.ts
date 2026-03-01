import type {
  SlobPlugin,
  SmellcheckConfig,
  SmellcheckResult,
  TypographyPluginConfig,
  UnicodePluginConfig,
  BuzzwordsPluginConfig,
  UnnaturalPluginConfig,
} from './types.js';
import { TypographyPlugin } from './plugins/typography.js';
import { UnicodePlugin } from './plugins/unicode.js';
import { BuzzwordsPlugin } from './plugins/buzzwords.js';
import { UnnaturalPlugin } from './plugins/unnatural.js';

function isEnabled(setting: boolean | object | undefined): boolean {
  if (setting === undefined) return true;  // default on
  if (typeof setting === 'boolean') return setting;
  return true; // object config means enabled
}

function getConfig<T>(setting: boolean | T | undefined): T {
  if (!setting || typeof setting === 'boolean') return {} as T;
  return setting;
}

export class Smellcheck {
  private plugins: SlobPlugin[] = [];

  constructor(config: SmellcheckConfig = {}) {
    const p = config.plugins ?? {};

    if (isEnabled(p.typography)) {
      this.plugins.push(new TypographyPlugin(getConfig<TypographyPluginConfig>(p.typography)));
    }
    if (isEnabled(p.unicode)) {
      this.plugins.push(new UnicodePlugin(getConfig<UnicodePluginConfig>(p.unicode)));
    }
    if (isEnabled(p.buzzwords)) {
      this.plugins.push(new BuzzwordsPlugin(getConfig<BuzzwordsPluginConfig>(p.buzzwords)));
    }
    if (isEnabled(p.unnatural)) {
      this.plugins.push(new UnnaturalPlugin(getConfig<UnnaturalPluginConfig>(p.unnatural)));
    }
  }

  /**
   * Register a custom plugin. Allows extending smellcheck with your own analyzers.
   */
  use(plugin: SlobPlugin): this {
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Analyze a text string. Returns per-plugin results and an aggregated summary.
   */
  analyze(text: string): SmellcheckResult {
    const pluginResults = this.plugins.map(p => p.analyze(text));

    const allMatches = pluginResults
      .flatMap(r => r.matches)
      .sort((a, b) => a.index - b.index);

    return {
      flagged: pluginResults.some(r => r.flagged),
      plugins: pluginResults,
      allMatches,
    };
  }
}
