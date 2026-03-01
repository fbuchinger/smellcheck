import type { PatternPlugin, PluginResult, Match, UnnaturalPluginConfig } from '../types.js';

/**
 * Words that educated humans recognise but almost never type spontaneously.
 * These flow naturally from LLMs but would make a real person pause and
 * second-guess themselves mid-sentence.
 *
 * Criteria: formal, archaic, or bureaucratic register that is technically
 * correct but feels unnatural in conversational or web-form writing.
 */
const DEFAULT_UNNATURAL_WORDS: string[] = [
  // Archaic / overly formal connectives
  'aforementioned',
  'aforesaid',
  'heretofore',
  'hitherto',
  'herein',
  'hereof',
  'hereinafter',
  'therein',
  'thereof',
  'thereto',
  'whereby',
  'wherein',
  'whereupon',
  'whilst',
  'notwithstanding',
  'insofar',
  'inasmuch',
  'forthwith',
  'henceforth',
  'thenceforth',
  'theretofore',

  // Latin / academic register
  'vis-à-vis',
  'inter alia',
  'mutatis mutandis',
  'ergo',
  'ipso facto',
  'prima facie',
  'de facto',
  'de jure',
  'modus operandi',
  'sine qua non',
  'status quo ante',
  'ex ante',
  'ex post',

  // Bureaucratic / overly formal verbs
  'effectuate',
  'operationalize',
  'conceptualize',
  'institutionalize',
  'incentivize',
  'prioritize',  // borderline, but flagging
  'systematize',
  'contextualize',
  'problematize',
  'reimagine',
  'reconceptualize',

  // Pompous nouns/adjectives
  'plenitude',
  'preponderance',
  'ubiquity', 'ubiquitous',
  'efficacy', 'efficacious',
  'perspicacious', 'perspicacity',
  'sagacious', 'sagacity',
  'propitious',
  'auspicious',
  'felicitous',
  'propound',
  'elucidate', 'elucidates', 'elucidated', 'elucidating', 'elucidation',
  'explicate', 'explicates', 'explicated', 'explicating', 'explication',
  'delineate', 'delineates', 'delineated', 'delineating', 'delineation',
  'promulgate', 'promulgates', 'promulgated',
  'instantiate', 'instantiates', 'instantiated',
  'subsume', 'subsumes', 'subsumed',
  'undergird', 'undergirds', 'undergirded',
  'presuppose', 'presupposes', 'presupposed',
  'dialectic', 'dialectical',
  'epistemological', 'epistemology',
  'ontological', 'ontology',
  'axiomatically',
  'teleological',

  // Words that feel off in casual writing
  'substantiate', 'substantiates', 'substantiated',
  'corroborate', 'corroborates', 'corroborated',
  'ameliorate', 'ameliorates', 'ameliorated',
  'exacerbate', 'exacerbates', 'exacerbated',
  'proliferate', 'proliferates', 'proliferated',
  'mitigate', 'mitigates', 'mitigated',
  'obviate', 'obviates', 'obviated',
  'obviate',
  'reiterate', 'reiterates', 'reiterated', 'reiterating',
  'extrapolate', 'extrapolates', 'extrapolated',
  'interpolate', 'interpolates', 'interpolated',
];

function buildPattern(words: string[]): RegExp {
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![\\w-])(${escaped.join('|')})(?![\\w-])`, 'gi');
}

export class UnnaturalPlugin implements PatternPlugin {
  readonly name = 'unnatural';
  private pattern: RegExp;

  constructor(config: UnnaturalPluginConfig = {}) {
    let words = [...DEFAULT_UNNATURAL_WORDS];

    if (config.extra) words = [...words, ...config.extra];
    if (config.exclude) {
      const excluded = new Set(config.exclude.map(w => w.toLowerCase()));
      words = words.filter(w => !excluded.has(w.toLowerCase()));
    }

    this.pattern = buildPattern(words);
  }

  analyze(text: string): PluginResult {
    const matches: Match[] = [];
    this.pattern.lastIndex = 0;

    let m: RegExpExecArray | null;
    while ((m = this.pattern.exec(text)) !== null) {
      matches.push({
        text: m[0],
        index: m.index,
        length: m[0].length,
        plugin: this.name,
        reason: `Unnatural vocabulary — rarely typed spontaneously: "${m[0].toLowerCase()}"`,
      });
    }

    return {
      plugin: this.name,
      flagged: matches.length > 0,
      matches,
    };
  }
}
