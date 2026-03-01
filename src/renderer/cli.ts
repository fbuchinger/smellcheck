import type { SmellcheckResult, Match } from '../types.js';

// ANSI escape codes
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

const PLUGIN_COLORS: Record<string, string> = {
  typography: '\x1b[41m',  // red bg
  unicode:    '\x1b[43m',  // yellow bg
  buzzwords:  '\x1b[44m',  // blue bg
  unnatural:  '\x1b[45m',  // magenta bg
};

const PLUGIN_LABELS: Record<string, string> = {
  typography: 'TYPO',
  unicode:    'UNICODE',
  buzzwords:  'BUZZ',
  unnatural:  'UNNAT',
};

/**
 * Renders highlighted text in the terminal using ANSI color codes.
 */
export function renderCli(text: string, result: SmellcheckResult): string {
  if (result.allMatches.length === 0) {
    return text;
  }

  let output = '';
  let cursor = 0;

  for (const match of result.allMatches) {
    output += text.slice(cursor, match.index);
    const color = PLUGIN_COLORS[match.plugin] ?? '\x1b[47m';
    output += `${color}${BOLD}${match.text}${RESET}`;
    cursor = match.index + match.length;
  }

  output += text.slice(cursor);
  return output;
}

/**
 * Renders a structured summary report for the terminal.
 */
export function renderCliSummary(result: SmellcheckResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`${BOLD}── Smellcheck Report ──────────────────────────────────${RESET}`);

  if (!result.flagged) {
    lines.push(`\x1b[32m✓  No AI fingerprints detected${RESET}`);
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`\x1b[31m⚠  AI fingerprints detected${RESET}`);
  lines.push('');

  for (const pluginResult of result.plugins) {
    if (!pluginResult.flagged) continue;

    const color = PLUGIN_COLORS[pluginResult.name] ?? '\x1b[47m';
    const label = PLUGIN_LABELS[pluginResult.name] ?? pluginResult.name.toUpperCase();
    lines.push(`  ${color}${BOLD} ${label} ${RESET}  ${pluginResult.matches.length} match(es)`);

    for (const match of pluginResult.matches) {
      const display = match.text.trim() || `[U+${match.text.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')}]`;
      lines.push(`    ${DIM}→${RESET} "${display}"  at position ${match.index}  ${DIM}${match.reason}${RESET}`);
    }
    lines.push('');
  }

  lines.push('─'.repeat(56));
  lines.push('');

  return lines.join('\n');
}
