import type { PatternPlugin, PluginResult, Match, BuzzwordsPluginConfig } from '../types.js';

/**
 * Words and phrases that are statistically overrepresented in AI-generated text.
 * Compiled from linguistic research and community observations.
 */
const DEFAULT_BUZZWORDS: string[] = [
  // Single words
  'delve', 'delves', 'delved', 'delving',
  'tapestry', 'tapestries',
  'unleash', 'unleashes', 'unleashed', 'unleashing',
  'unpack', 'unpacks', 'unpacked', 'unpacking',
  'nuanced', 'nuance', 'nuances',
  'multifaceted',
  'groundbreaking',
  'pivotal',
  'transformative',
  'revolutionary',
  'paradigm', 'paradigms',
  'synergy', 'synergies', 'synergistic',
  'holistic',
  'robust',
  'leverage', 'leverages', 'leveraged', 'leveraging',
  'scalable', 'scalability',
  'ecosystem',
  'empower', 'empowers', 'empowered', 'empowering',
  'streamline', 'streamlines', 'streamlined', 'streamlining',
  'innovative', 'innovation', 'innovations',
  'cutting-edge',
  'state-of-the-art',
  'game-changer', 'game-changing',
  'disruptive', 'disrupt', 'disruption',
  'actionable',
  'impactful',
  'overarching',
  'bespoke',
  'curated',
  'foster', 'fosters', 'fostered', 'fostering',
  'facilitate', 'facilitates', 'facilitated', 'facilitating',
  'utilize', 'utilizes', 'utilized', 'utilizing', 'utilization',
  'endeavor', 'endeavors', 'endeavour', 'endeavours',
  'commendable',
  'meticulous', 'meticulously',
  'comprehensive',
  'invaluable',
  'vibrant',
  'dynamic',
  'remarkable',
  'crucial',
  'vital',
  'imperative',

  // Phrases (matched as substrings)
  "it's worth noting",
  "it is worth noting",
  "it's important to note",
  "it is important to note",
  'in conclusion',
  'in summary',
  'to summarize',
  'as mentioned earlier',
  'as previously mentioned',
  'as noted above',
  'needless to say',
  'at the end of the day',
  'in the realm of',
  'in the landscape of',
  'the world of',
  'dive deep', 'dive deeper', 'deep dive',
  'shed light on',
  'stands as a testament',
  'testament to',
  "let's explore",
  "let's delve",
  "let's unpack",
  'navigating the',
  'journey of',
  'a wealth of',
  'a plethora of',
];

function buildWordPattern(words: string[]): RegExp {
  // Sort by length descending so longer phrases match first
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![\\w-])(${escaped.join('|')})(?![\\w-])`, 'gi');
}

export class BuzzwordsPlugin implements PatternPlugin {
  readonly name = 'buzzwords';
  private pattern: RegExp;
  private wordSet: Set<string>;

  constructor(config: BuzzwordsPluginConfig = {}) {
    let words = [...DEFAULT_BUZZWORDS];

    if (config.extra) words = [...words, ...config.extra];
    if (config.exclude) {
      const excluded = new Set(config.exclude.map(w => w.toLowerCase()));
      words = words.filter(w => !excluded.has(w.toLowerCase()));
    }

    this.wordSet = new Set(words.map(w => w.toLowerCase()));
    this.pattern = buildWordPattern(words);
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
        reason: `AI buzzword/cliché: "${m[0].toLowerCase()}"`,
      });
    }

    return {
      plugin: this.name,
      flagged: matches.length > 0,
      matches,
    };
  }
}
