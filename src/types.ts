// ─── PatternPlugin ────────────────────────────────────────────────────────────
// Plugins that find suspicious spans/tokens at specific positions in the text.
// Implement this interface for character-, word-, or regex-based detectors.

export interface Match {
  text: string;
  index: number;
  length: number;
  plugin: string;
  reason: string;
}

export interface PluginResult {
  plugin: string;
  flagged: boolean;
  matches: Match[];
}

export interface PatternPlugin {
  readonly name: string;
  analyze(text: string): PluginResult;
}

// ─── ScorePlugin ──────────────────────────────────────────────────────────────
// Plugins that compute an aggregated score for the whole text.
// 0.0 = looks human, 1.0 = maximally suspicious.

export type FindingSeverity = 'low' | 'medium' | 'high';

export interface Finding {
  label: string;
  detail: string;
  severity: FindingSeverity;
  evidence: Record<string, unknown>;
}

export interface ScorePluginResult {
  plugin: string;
  score: number;
  skipped: boolean;
  skipReason?: string;
  findings: Finding[];
}

export interface ScorePlugin {
  readonly name: string;
  analyze(text: string): ScorePluginResult;
}

// ─── Plugin Configs ───────────────────────────────────────────────────────────

export interface TypographyPluginConfig {
  enabled?: boolean;
  extra?: string[];
}

export interface UnicodePluginConfig {
  enabled?: boolean;
  extraRanges?: [number, number][];
}

export interface BuzzwordsPluginConfig {
  enabled?: boolean;
  extra?: string[];
  exclude?: string[];
}

export interface UnnaturalPluginConfig {
  enabled?: boolean;
  extra?: string[];
  exclude?: string[];
}

export interface SentenceUniformityConfig {
  enabled?: boolean;
  minSentences?: number;
  stddevFloor?: number;
  stddevCeiling?: number;
  penaltyShort?: number;
}

export interface SmellcheckConfig {
  plugins?: {
    typography?: boolean | TypographyPluginConfig;
    unicode?: boolean | UnicodePluginConfig;
    buzzwords?: boolean | BuzzwordsPluginConfig;
    unnatural?: boolean | UnnaturalPluginConfig;
    sentenceUniformity?: boolean | SentenceUniformityConfig;
  };
}

// ─── Analysis Result ──────────────────────────────────────────────────────────

export interface SmellcheckResult {
  flagged: boolean;
  plugins: PluginResult[];
  scoredPlugins: ScorePluginResult[];
  allMatches: Match[];
}
