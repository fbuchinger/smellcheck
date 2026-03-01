import type { SlobPlugin, PluginResult, Match, UnicodePluginConfig } from '../types.js';

/**
 * Unicode ranges that are suspicious in plain-text submissions.
 * These cover emoji, pictograms, and decorative symbols that humans
 * rarely type but LLMs happily sprinkle in.
 */
const SUSPICIOUS_RANGES: Array<{ start: number; end: number; reason: string }> = [
  { start: 0x1F600, end: 0x1F64F, reason: 'Emoticons block' },
  { start: 0x1F300, end: 0x1F5FF, reason: 'Miscellaneous symbols and pictographs' },
  { start: 0x1F680, end: 0x1F6FF, reason: 'Transport and map symbols' },
  { start: 0x1F700, end: 0x1F77F, reason: 'Alchemical symbols' },
  { start: 0x1F780, end: 0x1F7FF, reason: 'Geometric shapes extended' },
  { start: 0x1F800, end: 0x1F8FF, reason: 'Supplemental arrows-C' },
  { start: 0x1F900, end: 0x1F9FF, reason: 'Supplemental symbols and pictographs' },
  { start: 0x1FA00, end: 0x1FA6F, reason: 'Chess symbols' },
  { start: 0x1FA70, end: 0x1FAFF, reason: 'Symbols and pictographs extended-A' },
  { start: 0x2600,  end: 0x26FF,  reason: 'Miscellaneous symbols (☀ ★ ✓ etc.)' },
  { start: 0x2700,  end: 0x27BF,  reason: 'Dingbats (✂ ✈ etc.)' },
  { start: 0x1F1E0, end: 0x1F1FF, reason: 'Regional indicator symbols (flag components)' },
];

function isInSuspiciousRange(
  codePoint: number,
  ranges: Array<{ start: number; end: number; reason: string }>
): string | null {
  for (const range of ranges) {
    if (codePoint >= range.start && codePoint <= range.end) {
      return range.reason;
    }
  }
  return null;
}

export class UnicodePlugin implements SlobPlugin {
  readonly name = 'unicode';
  private ranges: Array<{ start: number; end: number; reason: string }>;

  constructor(config: UnicodePluginConfig = {}) {
    this.ranges = [...SUSPICIOUS_RANGES];

    if (config.extraRanges) {
      for (const [start, end] of config.extraRanges) {
        this.ranges.push({ start, end, reason: `Custom range U+${start.toString(16).toUpperCase()}–U+${end.toString(16).toUpperCase()}` });
      }
    }
  }

  analyze(text: string): PluginResult {
    const matches: Match[] = [];

    // Iterate over Unicode code points (handles surrogate pairs correctly)
    let i = 0;
    for (const char of text) {
      const cp = char.codePointAt(0)!;
      const reason = isInSuspiciousRange(cp, this.ranges);
      if (reason) {
        matches.push({
          text: char,
          index: i,
          length: char.length, // JS string length (may be 2 for surrogate pairs)
          plugin: this.name,
          reason: `Suspicious Unicode character (${reason}): U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
        });
      }
      i += char.length;
    }

    return {
      plugin: this.name,
      flagged: matches.length > 0,
      matches,
    };
  }
}
