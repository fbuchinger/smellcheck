// ─── Core Types ──────────────────────────────────────────────────────────────

export interface Match {
  /** The matched text (character or word) */
  text: string;
  /** Start index in the original string */
  index: number;
  /** Length of the matched text */
  length: number;
  /** Which plugin produced this match */
  plugin: string;
  /** Human-readable reason for the match */
  reason: string;
}

export interface PluginResult {
  /** Plugin identifier, e.g. "typography" */
  plugin: string;
  /** Whether this plugin considers the text suspicious */
  flagged: boolean;
  /** All matches found by this plugin */
  matches: Match[];
}

export interface SlobPlugin {
  /** Unique plugin name */
  readonly name: string;
  /** Run analysis on a text string */
  analyze(text: string): PluginResult;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface TypographyPluginConfig {
  enabled?: boolean;
  /** Additional characters (as strings or regex sources) to flag */
  extra?: string[];
}

export interface UnicodePluginConfig {
  enabled?: boolean;
  /** Unicode category ranges to flag, as [start, end] codepoint pairs */
  extraRanges?: [number, number][];
}

export interface BuzzwordsPluginConfig {
  enabled?: boolean;
  /** Words to add to the built-in list */
  extra?: string[];
  /** Words to remove from the built-in list */
  exclude?: string[];
}

export interface UnnaturalPluginConfig {
  enabled?: boolean;
  /** Words to add to the built-in list */
  extra?: string[];
  /** Words to remove from the built-in list */
  exclude?: string[];
}

export interface SmellcheckConfig {
  plugins?: {
    typography?: boolean | TypographyPluginConfig;
    unicode?: boolean | UnicodePluginConfig;
    buzzwords?: boolean | BuzzwordsPluginConfig;
    unnatural?: boolean | UnnaturalPluginConfig;
  };
}

// ─── Analysis Result ─────────────────────────────────────────────────────────

export interface SmellcheckResult {
  /** True if ANY plugin flagged the text */
  flagged: boolean;
  /** Per-plugin results */
  plugins: PluginResult[];
  /** All matches across all plugins, sorted by index */
  allMatches: Match[];
}
