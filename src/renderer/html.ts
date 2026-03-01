import type { SmellcheckResult, Match } from '../types.js';

/** Color scheme per plugin */
const PLUGIN_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  typography: { bg: '#FFE4E4', border: '#FF6B6B', label: 'Typography' },
  unicode:    { bg: '#FFF3CD', border: '#FFC107', label: 'Unicode' },
  buzzwords:  { bg: '#E8F4FD', border: '#2196F3', label: 'Buzzword' },
  unnatural:  { bg: '#F3E8FF', border: '#9C27B0', label: 'Unnatural' },
};

const DEFAULT_COLOR = { bg: '#F0F0F0', border: '#999', label: 'Flagged' };

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the analyzed text as HTML with <mark> highlights for each match.
 * Overlapping matches from different plugins are handled by merging spans.
 */
export function renderHtml(text: string, result: SmellcheckResult): string {
  if (result.allMatches.length === 0) {
    return `<span class="smellcheck-clean">${escapeHtml(text)}</span>`;
  }

  // Build a list of non-overlapping segments
  // For overlapping matches, prefer the first plugin's color
  const events: Array<{ pos: number; type: 'open' | 'close'; match: Match }> = [];
  for (const match of result.allMatches) {
    events.push({ pos: match.index, type: 'open', match });
    events.push({ pos: match.index + match.length, type: 'close', match });
  }
  events.sort((a, b) => a.pos - b.pos || (a.type === 'close' ? -1 : 1));

  let html = '';
  let cursor = 0;
  const openStack: Match[] = [];

  for (const event of events) {
    // Flush plain text up to this position
    if (event.pos > cursor) {
      html += escapeHtml(text.slice(cursor, event.pos));
      cursor = event.pos;
    }

    if (event.type === 'open') {
      const color = PLUGIN_COLORS[event.match.plugin] ?? DEFAULT_COLOR;
      const escapedReason = escapeHtml(event.match.reason);
      html += `<mark class="smellcheck smellcheck-${event.match.plugin}" `
        + `style="background:${color.bg};outline:1px solid ${color.border};border-radius:2px;cursor:help;" `
        + `title="${escapedReason}" `
        + `data-plugin="${event.match.plugin}" `
        + `data-reason="${escapedReason}">`;
      openStack.push(event.match);
    } else {
      html += '</mark>';
      openStack.pop();
    }
  }

  // Flush remaining text
  if (cursor < text.length) {
    html += escapeHtml(text.slice(cursor));
  }

  return html;
}

/**
 * Returns a self-contained <style> block with legend styles.
 */
export function renderLegendHtml(): string {
  const items = Object.entries(PLUGIN_COLORS)
    .map(([_plugin, color]) =>
      `<span class="smellcheck-legend-item" style="background:${color.bg};border:1px solid ${color.border};padding:2px 8px;border-radius:3px;font-size:0.85em;">${color.label}</span>`
    )
    .join(' ');

  return `<div class="smellcheck-legend" style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
  <strong style="font-size:0.85em;">Smellcheck:</strong> ${items}
</div>`;
}

/**
 * Renders a full summary report as an HTML snippet.
 */
export function renderSummaryHtml(result: SmellcheckResult): string {
  if (!result.flagged) {
    return `<div class="smellcheck-summary smellcheck-clean" style="color:green;">✓ No AI fingerprints detected</div>`;
  }

  const rows = result.plugins
    .filter(p => p.flagged)
    .map(p => {
      const color = PLUGIN_COLORS[p.plugin] ?? DEFAULT_COLOR;
      return `<li style="margin:4px 0;">
        <span style="background:${color.bg};border:1px solid ${color.border};padding:1px 6px;border-radius:3px;font-size:0.85em;">${color.label}</span>
        ${p.matches.length} match${p.matches.length !== 1 ? 'es' : ''}
      </li>`;
    })
    .join('');

  return `<div class="smellcheck-summary" style="color:#c00;">
  ⚠ AI fingerprints detected:
  <ul style="margin:4px 0;padding-left:20px;">${rows}</ul>
</div>`;
}

/**
 * Renders ScorePlugin results as HTML score meters with findings.
 */
export function renderScoredPluginsHtml(scoredPlugins: import('../types.js').ScorePluginResult[]): string {
  if (scoredPlugins.length === 0) return '';

  const LABELS: Record<string, string> = {
    sentenceUniformity: 'Sentence Uniformity',
  };

  const SEVERITY_COLOR: Record<string, string> = {
    low: '#888',
    medium: '#FFC107',
    high: '#FF5050',
  };

  const sections = scoredPlugins.map(r => {
    const label = LABELS[r.plugin] ?? r.plugin;

    if (r.skipped) {
      return `<div class="smellcheck-scored" style="margin-bottom:12px;">
  <strong style="font-size:0.9em;">${label}</strong>
  <span style="color:#888;font-size:0.8em;margin-left:8px;">skipped — ${escapeHtml(r.skipReason ?? '')}</span>
</div>`;
    }

    const pct = Math.round(r.score * 100);
    const barColor = r.score >= 0.7 ? '#FF5050' : r.score >= 0.35 ? '#FFC107' : '#50C878';

    const findingsHtml = r.findings.map(f => `
  <div style="margin-top:6px;padding:6px 8px;background:#f8f8f8;border-left:3px solid ${SEVERITY_COLOR[f.severity]};font-size:0.82em;line-height:1.4;">
    <strong>${escapeHtml(f.label)}</strong><br>
    ${escapeHtml(f.detail)}
  </div>`).join('');

    return `<div class="smellcheck-scored" style="margin-bottom:16px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
    <strong style="font-size:0.9em;">${label}</strong>
    <span style="font-size:0.85em;font-weight:700;color:${barColor};">${pct}%</span>
  </div>
  <div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">
    <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;transition:width 0.3s;"></div>
  </div>
  ${findingsHtml}
</div>`;
  });

  return `<div class="smellcheck-scored-plugins">${sections.join('')}</div>`;
}
