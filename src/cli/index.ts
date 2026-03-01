import { createSmellcheck } from '../index.js';
import { readFromStdin, readFromFile } from '../input/index.js';
import { renderCli, renderCliSummary } from '../renderer/cli.js';

async function main() {
  const args = process.argv.slice(2);

  // --help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
smellcheck — AI-generated text fingerprint detector

Usage:
  smellcheck [file]              Analyze a file
  cat file.txt | smellcheck      Read from stdin
  smellcheck --no-typography     Disable the typography plugin
  smellcheck --no-unicode        Disable the unicode plugin
  smellcheck --no-buzzwords      Disable the buzzwords plugin
  smellcheck --no-unnatural      Disable the unnatural words plugin
  smellcheck --json              Output raw JSON result

Options:
  -h, --help     Show this help
  --json         Output JSON instead of colored text
`);
    process.exit(0);
  }

  const jsonMode = args.includes('--json');

  // Plugin toggles
  const config = {
    plugins: {
      typography: !args.includes('--no-typography'),
      unicode:    !args.includes('--no-unicode'),
      buzzwords:  !args.includes('--no-buzzwords'),
      unnatural:  !args.includes('--no-unnatural'),
    },
  };

  // Input: file arg or stdin
  const fileArg = args.find(a => !a.startsWith('--'));
  let text: string;

  try {
    text = fileArg ? await readFromFile(fileArg) : await readFromStdin();
  } catch (err) {
    console.error(`smellcheck: could not read input — ${(err as Error).message}`);
    process.exit(1);
  }

  const checker = await createSmellcheck(config);
  const result = checker.analyze(text);

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderCli(text, result));
    console.log(renderCliSummary(result));
  }

  // Exit code 1 if flagged (useful for CI/git hooks)
  process.exit(result.flagged ? 1 : 0);
}

main().catch(err => {
  console.error('smellcheck error:', err);
  process.exit(2);
});
