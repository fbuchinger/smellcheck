import type { PatternPlugin, ScorePlugin, SmellcheckConfig, SmellcheckResult } from './types.js';
import { createPatternPlugins, createScorePlugins } from './plugins/index.js';

export class Smellcheck {
  private patternPlugins: PatternPlugin[];
  private scorePlugins: ScorePlugin[];

  constructor(config: SmellcheckConfig = {}) {
    this.patternPlugins = createPatternPlugins(config);
    this.scorePlugins   = createScorePlugins(config);
  }

  /** Register a custom PatternPlugin or ScorePlugin at runtime */
  use(plugin: PatternPlugin | ScorePlugin): this {
    if ('analyze' in plugin) {
      // Distinguish by return type: ScorePlugin result has 'score' field
      // We use duck-typing on the plugin name conventions — just push to both
      // and let the result type be determined at analysis time.
      // For strict typing, check if the plugin implements ScorePlugin:
      const result = (plugin as PatternPlugin).analyze('test');
      if ('score' in result) {
        this.scorePlugins.push(plugin as ScorePlugin);
      } else {
        this.patternPlugins.push(plugin as PatternPlugin);
      }
    }
    return this;
  }

  /** Analyse text through all registered plugins */
  analyze(text: string): SmellcheckResult {
    const patternResults = this.patternPlugins.map(p => p.analyze(text));
    const scoreResults   = this.scorePlugins.map(p => p.analyze(text));

    const allMatches = patternResults
      .flatMap(r => r.matches)
      .sort((a, b) => a.index - b.index);

    const flagged =
      patternResults.some(r => r.flagged) ||
      scoreResults.some(r => !r.skipped && r.score > 0);

    return {
      flagged,
      plugins: patternResults,
      scoredPlugins: scoreResults,
      allMatches,
    };
  }
}
