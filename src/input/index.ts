/**
 * Reads text from the system clipboard.
 * Works in modern browsers via the Clipboard API.
 * In Node 20+ with --experimental-permission it may also work.
 */
export async function readFromClipboard(): Promise<string> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API is not available in this environment.');
  }
  return navigator.clipboard.readText();
}

/**
 * Reads all text from Node.js stdin (pipe or redirect).
 * Resolves with the full contents when stdin closes.
 */
export async function readFromStdin(): Promise<string> {
  if (typeof process === 'undefined' || !process.stdin) {
    throw new Error('stdin is not available in this environment.');
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}

/**
 * Reads text from a file path (Node.js only).
 */
export async function readFromFile(filePath: string): Promise<string> {
  const fs = await import('node:fs/promises');
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Attaches smellcheck to a textarea element (browser only).
 * Calls onChange with the current value on every input event.
 */
export function watchTextarea(
  textarea: HTMLTextAreaElement,
  onChange: (text: string) => void,
  options: { debounceMs?: number } = {}
): () => void {
  const delay = options.debounceMs ?? 300;
  let timer: ReturnType<typeof setTimeout>;

  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => onChange(textarea.value), delay);
  };

  textarea.addEventListener('input', handler);

  // Return cleanup function
  return () => {
    clearTimeout(timer);
    textarea.removeEventListener('input', handler);
  };
}
