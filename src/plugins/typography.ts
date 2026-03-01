import type { SlobPlugin, PluginResult, Match, TypographyPluginConfig } from '../types.js';

/**
 * Characters that are hallmarks of AI-generated or auto-formatted text.
 * Real humans rarely type these directly — they come from smart editors, LLMs,
 * or copy-paste from formatted sources.
 */
const SUSPICIOUS_CHARS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\u2014/g, reason: 'Em dash (—) — rarely typed manually' },
  { pattern: /\u2013/g, reason: 'En dash (–) — rarely typed manually' },
  { pattern: /\u00A0/g, reason: 'Non-breaking space — invisible formatting character' },
  { pattern: /\u200B/g, reason: 'Zero-width space — invisible character' },
  { pattern: /\u200C/g, reason: 'Zero-width non-joiner — invisible character' },
  { pattern: /\u200D/g, reason: 'Zero-width joiner — invisible character' },
  { pattern: /\uFEFF/g, reason: 'Byte order mark / zero-width no-break space' },
  { pattern: /\u2018|\u2019/g, reason: 'Curly single quote — auto-substituted by smart editors' },
  { pattern: /\u201C|\u201D/g, reason: 'Curly double quote — auto-substituted by smart editors' },
  { pattern: /\u2026/g, reason: 'Horizontal ellipsis (…) — distinct from three dots' },
  { pattern: /\u00AD/g, reason: 'Soft hyphen — invisible formatting hint' },
  { pattern: /\u2002|\u2003|\u2004|\u2005|\u2006|\u2009|\u200A/g, reason: 'Typographic space variant' },
];

export class TypographyPlugin implements SlobPlugin {
  readonly name = 'typography';
  private patterns: Array<{ pattern: RegExp; reason: string }>;

  constructor(config: TypographyPluginConfig = {}) {
    this.patterns = [...SUSPICIOUS_CHARS];

    if (config.extra) {
      for (const src of config.extra) {
        this.patterns.push({
          pattern: new RegExp(src, 'g'),
          reason: `Custom flagged character/pattern: ${src}`,
        });
      }
    }
  }

  analyze(text: string): PluginResult {
    const matches: Match[] = [];

    for (const { pattern, reason } of this.patterns) {
      // Reset regex state
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        matches.push({
          text: m[0],
          index: m.index,
          length: m[0].length,
          plugin: this.name,
          reason,
        });
      }
    }

    matches.sort((a, b) => a.index - b.index);

    return {
      plugin: this.name,
      flagged: matches.length > 0,
      matches,
    };
  }
}
