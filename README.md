# smellcheck

> Static analyzer that detects AI-generated text fingerprints in user submissions.

Smellcheck uses **static analysis only** — no ML, no API calls, no latency. It catches telltale signs that text was generated or heavily processed by an LLM: unusual typography characters, suspicious Unicode, AI clichés, and vocabulary that humans rarely reach for spontaneously.

---

## Install

```bash
npm install smellcheck
```

---

## Usage

### As a library

```ts
import { createSmellcheck } from 'smellcheck';

// Loads smellcheck.config.json from cwd (if present), merges with inline config
const checker = await createSmellcheck({
  plugins: {
    unicode: false,                        // disable a plugin
    buzzwords: { extra: ['synergize'] },   // extend word lists
    unnatural: { exclude: ['whilst'] },    // remove false positives
  }
});

const result = checker.analyze(text);

console.log(result.flagged);          // true | false
console.log(result.plugins);          // per-plugin results
console.log(result.allMatches);       // all matches sorted by position
```

### Synchronous (no config file)

```ts
import { Smellcheck } from 'smellcheck';

const checker = new Smellcheck({ plugins: { unicode: false } });
const result = checker.analyze(text);
```

### With HTML rendering

```ts
import { createSmellcheck, renderHtml, renderLegendHtml, renderSummaryHtml } from 'smellcheck';

const checker = await createSmellcheck();
const result = checker.analyze(userSubmission);

document.getElementById('preview').innerHTML = renderHtml(userSubmission, result);
document.getElementById('legend').innerHTML  = renderLegendHtml();
document.getElementById('summary').innerHTML = renderSummaryHtml(result);
```

### Browser textarea integration

```ts
import { Smellcheck, watchTextarea, renderHtml } from 'smellcheck';

const checker = new Smellcheck();
const textarea = document.getElementById('submission') as HTMLTextAreaElement;
const preview  = document.getElementById('preview');

// Analyzes on every keystroke (debounced 300ms by default)
const cleanup = watchTextarea(textarea, (text) => {
  const result = checker.analyze(text);
  preview.innerHTML = renderHtml(text, result);
});

// Later: cleanup() to remove event listener
```

### Clipboard (browser)

```ts
import { readFromClipboard, Smellcheck } from 'smellcheck';

const text   = await readFromClipboard();
const result = new Smellcheck().analyze(text);
```

---

## CLI

```bash
# Analyze a file
smellcheck report.txt

# Pipe from stdin
cat submission.txt | smellcheck

# Disable specific plugins
smellcheck --no-unicode --no-buzzwords report.txt

# Output raw JSON (for piping to other tools)
smellcheck --json report.txt

# Exit code: 0 = clean, 1 = flagged (useful for CI / git hooks)
smellcheck report.txt && echo "Clean!"
```

---

## Plugins

| Plugin | What it detects |
|---|---|
| `typography` | Em dashes, en dashes, non-breaking spaces, zero-width chars, curly quotes, soft hyphens, ellipsis characters |
| `unicode` | Emoji, pictograms, decorative symbols from Unicode blocks rarely found in plain text |
| `buzzwords` | AI clichés: *delve*, *tapestry*, *nuanced*, *holistic*, *robust*, *leverage*, *cutting-edge*, *it's worth noting*, … |
| `unnatural` | Vocabulary humans recognize but rarely type: *aforementioned*, *heretofore*, *whilst*, *elucidate*, *notwithstanding*, … |

All plugins are **enabled by default** and can be toggled individually.

---

## Configuration

### smellcheck.config.json

```json
{
  "plugins": {
    "typography": true,
    "unicode": true,
    "buzzwords": {
      "extra": ["synergize", "circle back"],
      "exclude": ["robust"]
    },
    "unnatural": {
      "extra": ["heretofore"],
      "exclude": ["whilst"]
    }
  }
}
```

### Custom plugins

```ts
import { Smellcheck } from 'smellcheck';
import type { SlobPlugin, PluginResult } from 'smellcheck';

class MyPlugin implements SlobPlugin {
  name = 'my-plugin';

  analyze(text: string): PluginResult {
    const matches = [];
    // ... your logic
    return { plugin: this.name, flagged: matches.length > 0, matches };
  }
}

const checker = new Smellcheck();
checker.use(new MyPlugin());
```

---

## Result shape

```ts
interface SmellcheckResult {
  flagged: boolean;       // true if ANY plugin flagged
  plugins: PluginResult[];
  allMatches: Match[];    // sorted by position
}

interface PluginResult {
  plugin: string;
  flagged: boolean;
  matches: Match[];
}

interface Match {
  text: string;   // matched text
  index: number;  // position in original string
  length: number;
  plugin: string;
  reason: string; // human-readable explanation
}
```

---

## License

MIT
