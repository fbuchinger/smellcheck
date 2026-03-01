import type { ScorePlugin, ScorePluginResult, Finding, SentenceUniformityConfig } from '../types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULTS = {
  minSentences: 6,
  stddevFloor: 4.5,
  stddevCeiling: 12.0,
  penaltyShort: 0.15,
} as const;

/**
 * Common abbreviations whose period must not be treated as a sentence boundary.
 * Pattern matches the abbreviation at a word boundary followed by a literal dot.
 */
const ABBREV_PATTERN = /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|e\.g|i\.e|etc|No|Fig|al|ca|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|vol|ed|est|approx|dept|govt|corp|inc|ltd)\./gi;

/** Sentinel used to temporarily replace protected dots during splitting */
const SENTINEL = '\x00';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits text into sentences, protecting known abbreviations from being treated
 * as sentence boundaries. Discards fragments shorter than 2 whitespace-delimited words.
 */
export function splitSentences(text: string): string[] {
  // 1. Protect abbreviation dots
  const protected_ = text.replace(ABBREV_PATTERN, (m) => m.slice(0, -1) + SENTINEL);

  // 2. Split on . ! ? followed by whitespace and an uppercase letter or end of string
  //    This avoids splitting mid-paragraph on lowercase continuations.
  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z\u00C0-\u00DC])/);

  // 3. Restore sentinels and filter short fragments
  return raw
    .map(s => s.replace(/\x00/g, '.').trim())
    .filter(s => {
      const words = s.split(/\s+/).filter(w => w.length > 0);
      return words.length >= 2;
    });
}

/** Counts whitespace-delimited tokens in a sentence */
export function countWords(sentence: string): number {
  return sentence.split(/\s+/).filter(w => w.length > 0).length;
}

/** Population standard deviation */
export function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Mean of an array */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * SentenceUniformityPlugin — ScorePlugin
 *
 * Detects AI-generated text by measuring the statistical uniformity of sentence
 * lengths. AI text has unnaturally low variance in sentence length ("burstiness");
 * human writing mixes short and long sentences freely.
 *
 * To add this plugin to your Smellcheck instance, it is already registered in
 * src/plugins/index.ts. To customise thresholds, pass a SentenceUniformityConfig
 * via SmellcheckConfig.plugins.sentenceUniformity.
 */
export class SentenceUniformityPlugin implements ScorePlugin {
  readonly name = 'sentenceUniformity';

  private minSentences: number;
  private stddevFloor: number;
  private stddevCeiling: number;
  private penaltyShort: number;
  private enabled: boolean;

  constructor(config: SentenceUniformityConfig = {}) {
    this.enabled       = config.enabled       ?? true;
    this.minSentences  = config.minSentences  ?? DEFAULTS.minSentences;
    this.stddevFloor   = config.stddevFloor   ?? DEFAULTS.stddevFloor;
    this.stddevCeiling = config.stddevCeiling ?? DEFAULTS.stddevCeiling;
    this.penaltyShort  = config.penaltyShort  ?? DEFAULTS.penaltyShort;
  }

  analyze(text: string): ScorePluginResult {
    // ── Disabled guard ────────────────────────────────────────────────────────
    if (!this.enabled) {
      return { plugin: this.name, score: 0, skipped: true, skipReason: 'Plugin is disabled', findings: [] };
    }

    // ── Sentence extraction ───────────────────────────────────────────────────
    const sentences = splitSentences(text);

    if (sentences.length < this.minSentences) {
      return {
        plugin: this.name,
        score: 0,
        skipped: true,
        skipReason: `Only ${sentences.length} usable sentence(s) found; need at least ${this.minSentences}`,
        findings: [],
      };
    }

    // ── Statistics ────────────────────────────────────────────────────────────
    const lengths  = sentences.map(countWords);
    const meanLen  = mean(lengths);
    const stddevLen = stddev(lengths);

    // ── Score mapping (linear interpolation between floor and ceiling) ────────
    let score: number;
    if (stddevLen <= this.stddevFloor) {
      score = 1.0;
    } else if (stddevLen >= this.stddevCeiling) {
      score = 0.0;
    } else {
      score = 1.0 - (stddevLen - this.stddevFloor) / (this.stddevCeiling - this.stddevFloor);
    }

    // ── Findings ──────────────────────────────────────────────────────────────
    const findings: Finding[] = [];

    if (score > 0) {
      const severity = score >= 0.7 ? 'high' : score >= 0.35 ? 'medium' : 'low';
      findings.push({
        label: 'low_sentence_stddev',
        detail:
          `Sentence length stddev is ${stddevLen.toFixed(2)} words ` +
          `(suspicious below ${this.stddevFloor}, human-like above ${this.stddevCeiling}). ` +
          `Mean sentence length: ${meanLen.toFixed(1)} words across ${lengths.length} sentences.`,
        severity,
        evidence: {
          sentenceCount: lengths.length,
          meanWords: parseFloat(meanLen.toFixed(2)),
          stddevWords: parseFloat(stddevLen.toFixed(2)),
          lengths,
        },
      });
    }

    // ── Bonus penalty: short + uniform ────────────────────────────────────────
    if (score > 0 && meanLen < 15) {
      score = Math.min(1.0, score + this.penaltyShort);
      findings.push({
        label: 'short_uniform_sentences',
        detail:
          `Mean sentence length is ${meanLen.toFixed(1)} words — short and uniform, ` +
          `typical of AI listicle-style prose. Penalty of ${this.penaltyShort} applied.`,
        severity: 'medium',
        evidence: {
          meanWords: parseFloat(meanLen.toFixed(2)),
        },
      });
    }

    return {
      plugin: this.name,
      score: parseFloat(score.toFixed(4)),
      skipped: false,
      findings,
    };
  }
}
