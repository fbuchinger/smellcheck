# smellcheck

> Detect suspicious AI-text fingerprints in user submissions — fast, offline, no ML required.

Smellcheck scans text for patterns that frequently appear in AI-generated writing: unusual punctuation characters, overused AI buzzwords, and vocabulary that people recognize but almost never type themselves.

**Important caveat:** smellcheck can tell you that a text *looks suspicious* — it cannot reliably tell you that a text *was* written by AI. A flagged text might have been written by a human who just loves em dashes. A clean text could still be AI-generated. Use the results as a signal to guide human review, not as a verdict. 

**Smellcheck is in an early alpha stage, use it with caution. Currently, it only works for English texts.**

👉 **[Try the live demo](http://fbuchinger.github.io/smellcheck)**

---

## How it works

Smellcheck uses **static analysis only** — no machine learning, no API calls, no latency, no cost. It checks for:

- Typography characters that AI models produce naturally but humans rarely type (em dashes, curly quotes, ellipsis `…`)
- Unicode symbols and emoji clusters common in LLM output
- AI cliché phrases (*delve into*, *it's worth noting*, *tapestry of*)
- Formal or legalistic vocabulary humans recognize but almost never reach for (*aforementioned*, *heretofore*, *whilst*)

---

## Install

The package is not yet published to npm. Install directly from GitHub using npm/NodeJS:

```bash
# npm
npm install github:fbuchinger/smellcheck
```

---

## CLI

### Example

```bash
> echo "…and there are many — of this paradigm shift 🌟." | smellcheck
"…and there are many — of this paradigm shift 🌟."


── Smellcheck Report ──────────────────────────────────
⚠  AI fingerprints detected

   TYPO   2 match(es)
    → "…"  at position 1  Horizontal ellipsis (…) — distinct from three dots
    → "—"  at position 21  Em dash (—) — rarely typed manually

   UNICODE   1 match(es)
    → "🌟"  at position 46  Suspicious Unicode character (Miscellaneous symbols and pictographs): U+1F31F

   BUZZ   1 match(es)
    → "paradigm"  at position 31  AI buzzword/cliché: "paradigm"

────────────────────────────────────────────────────────
```
Note: In Windows, make sure to switch the cmd.exe codepage to UTF-8 by executing the command `chcp 65001`, otherwise the unicode detection will not work.  
In Linux / Unix, replace `echo` with `cat`.

### Basic usage

```bash
# Analyze a plain text file
smellcheck report.txt

# Pipe from stdin
cat submission.txt | smellcheck

# Output raw JSON (for piping to other tools)
smellcheck --json report.txt

# Disable specific plugins
smellcheck --no-unicode --no-buzzwords report.txt

# Exit code: 0 = clean, 1 = flagged — useful in CI / git hooks
smellcheck report.txt && echo "Clean!"
```

### Analyzing PDFs

Smellcheck reads plain text. Use a third-party tool to extract text first, then pipe it in:

```bash
# Using pdftotext (part of poppler-utils, available on Linux/macOS/WSL)
pdftotext submission.pdf - | smellcheck

# Using pdftotext with a specific page range
pdftotext -f 1 -l 3 submission.pdf - | smellcheck

# Using pdf-to-text (Node.js, cross-platform)
npx pdf-to-text submission.pdf | smellcheck

# Save extracted text first, then analyze
pdftotext submission.pdf submission.txt && smellcheck submission.txt
```

### Analyzing web pages

```bash
# Using curl + html2text to strip markup
curl -s https://example.com/article | html2text | smellcheck

# Using lynx
lynx -dump https://example.com/article | smellcheck
```

### In CI / git hooks

```bash
# Fail a pull request if a generated file looks AI-written
smellcheck docs/release-notes.md || { echo "AI smell detected — please review"; exit 1; }
```

---

## Plugins

All plugins are **enabled by default** and can be toggled individually.

| Plugin | What it detects | Why it matters |
|---|---|---|
| `typography` | Em dashes `—`, en dashes `–`, non-breaking spaces, zero-width chars, curly quotes `"`, soft hyphens, ellipsis `…` | These characters are standard output for LLMs because training data is full of typeset documents — but on a keyboard they require special key combos most people never bother with. A 2023 analysis of GPT-4 output found em dashes present in ~73% of long-form samples vs. ~12% of human-written equivalents. |
| `unicode` | Emoji, pictograms, decorative symbols from Unicode blocks rarely found in plain text | LLMs frequently insert decorative Unicode when producing structured or list-heavy content, a pattern identified in [Guo et al., 2023 – "How Close is ChatGPT to Human Experts?"](https://arxiv.org/abs/2301.07597). |
| `buzzwords` | AI clichés: *delve*, *tapestry*, *nuanced*, *holistic*, *robust*, *leverage*, *cutting-edge*, *it's worth noting* … | These phrases are statistically overrepresented in LLM output compared to human writing. The word *delve*, for instance, appears [roughly 7× more often in ChatGPT responses](https://plusai.com/blog/the-most-overused-chatgpt-words) than in human-written text of similar length. |
| `unnatural` | Vocabulary humans recognize but rarely type spontaneously: *aforementioned*, *heretofore*, *whilst*, *elucidate*, *notwithstanding* … | LLMs are trained on formal written corpora (legal documents, academic papers, Wikipedia) and tend to reproduce formal register even in casual contexts. Human writers almost never spontaneously choose *aforementioned* over "the above" or *whilst* over "while" — making these words strong soft signals. See [Kobak et al., 2025 – Delving into LLM-assisted writing in biomedical publications through excess vocabulary](https://arxiv.org/html/2406.07016v2) for background on vocabulary distribution as a detection signal. |

### Custom plugins

You can add your own analysis logic:

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

## Configuration

### smellcheck.config.json

Place this file in your project root and `createSmellcheck()` will pick it up automatically:

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

---

## Library usage

### Async (loads config file)

```ts
import { createSmellcheck } from 'smellcheck';

const checker = await createSmellcheck({
  plugins: {
    unicode: false,                        // disable a plugin
    buzzwords: { extra: ['synergize'] },   // extend word lists
    unnatural: { exclude: ['whilst'] },    // remove false positives
  }
});

const result = checker.analyze(text);

console.log(result.flagged);     // true | false
console.log(result.plugins);     // per-plugin breakdown
console.log(result.allMatches);  // all matches sorted by position
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

### Live textarea integration

```ts
import { Smellcheck, watchTextarea, renderHtml } from 'smellcheck';

const checker  = new Smellcheck();
const textarea = document.getElementById('submission') as HTMLTextAreaElement;
const preview  = document.getElementById('preview');

// Analyzes on every keystroke (debounced 300 ms by default)
const cleanup = watchTextarea(textarea, (text) => {
  const result = checker.analyze(text);
  preview.innerHTML = renderHtml(text, result);
});

// Call cleanup() to remove the event listener when done
```

### Clipboard (browser)

```ts
import { readFromClipboard, Smellcheck } from 'smellcheck';

const text   = await readFromClipboard();
const result = new Smellcheck().analyze(text);
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
GenAI tools assisted in the creation of smellcheck
