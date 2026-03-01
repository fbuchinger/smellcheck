import type { SmellcheckConfig } from './types.js';

/**
 * Attempts to load smellcheck.config.json from the current working directory.
 * Only works in Node.js — silently returns {} in browser environments.
 */
export async function loadFileConfig(configPath?: string): Promise<SmellcheckConfig> {
  // Browser guard
  if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
    return {};
  }

  try {
    const path = await import('node:path');
    const fs = await import('node:fs/promises');

    const filePath = configPath ?? path.join(process.cwd(), 'smellcheck.config.json');

    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as SmellcheckConfig;
  } catch {
    // No config file found — that's fine
    return {};
  }
}

/**
 * Deep-merge two SmellcheckConfig objects.
 * Programmatic config takes precedence over file config.
 */
export function mergeConfigs(
  fileConfig: SmellcheckConfig,
  programmaticConfig: SmellcheckConfig
): SmellcheckConfig {
  return {
    plugins: {
      ...fileConfig.plugins,
      ...programmaticConfig.plugins,
    },
  };
}
