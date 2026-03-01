import { Smellcheck } from '../src/detector.js';

const CLEAN_TEXT = 'I went to the market and bought some groceries. The weather was nice today. My dog enjoyed the walk.';

const AI_TEXT = [
  'It is worth noting that the utilization of AI has been transformative.',
  'The paradigm shift in holistic approaches is groundbreaking.',
  'We must leverage robust ecosystems to empower stakeholders.',
  'The nuanced landscape requires meticulous and comprehensive solutions.',
  'Aforementioned challenges must be elucidat\u2014ed notwithstanding the obstacles.',
  'In conclusion, the vibrant tapestry of innovation remains pivotal.',
].join(' ');

describe('Smellcheck (integration)', () => {
  describe('given clean text', () => {
    it('should not flag the text', () => {
      const checker = new Smellcheck({ plugins: { sentenceUniformity: false } });
      const result = checker.analyze(CLEAN_TEXT);
      expect(result.flagged).toBe(false);
    });

    it('should return empty allMatches', () => {
      const checker = new Smellcheck({ plugins: { sentenceUniformity: false } });
      const result = checker.analyze(CLEAN_TEXT);
      expect(result.allMatches).toHaveLength(0);
    });
  });

  describe('given AI-like text', () => {
    it('should flag the text', () => {
      const checker = new Smellcheck({ plugins: { sentenceUniformity: false } });
      const result = checker.analyze(AI_TEXT);
      expect(result.flagged).toBe(true);
    });

    it('should return results from all PatternPlugins', () => {
      const checker = new Smellcheck({ plugins: { sentenceUniformity: false } });
      const result = checker.analyze(AI_TEXT);
      expect(result.plugins).toHaveLength(4);
    });

    it('should have allMatches sorted by index', () => {
      const checker = new Smellcheck({ plugins: { sentenceUniformity: false } });
      const result = checker.analyze(AI_TEXT);
      const positions = result.allMatches.map(m => m.index);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });
  });

  describe('plugin enable/disable', () => {
    it('should produce no matches when all PatternPlugins are disabled', () => {
      const checker = new Smellcheck({
        plugins: {
          typography: false,
          unicode: false,
          buzzwords: false,
          unnatural: false,
          sentenceUniformity: false,
        },
      });
      const result = checker.analyze(AI_TEXT);
      expect(result.plugins).toHaveLength(0);
      expect(result.allMatches).toHaveLength(0);
    });

    it('should only run the enabled plugin when one PatternPlugin is enabled', () => {
      const checker = new Smellcheck({
        plugins: {
          typography: true,
          unicode: false,
          buzzwords: false,
          unnatural: false,
          sentenceUniformity: false,
        },
      });
      const result = checker.analyze(AI_TEXT);
      expect(result.plugins).toHaveLength(1);
      expect(result.plugins[0].plugin).toBe('typography');
    });
  });

  describe('ScorePlugin results', () => {
    it('should include scoredPlugins in the result', () => {
      const checker = new Smellcheck();
      const result = checker.analyze(CLEAN_TEXT);
      expect(result.scoredPlugins).toBeDefined();
      expect(Array.isArray(result.scoredPlugins)).toBe(true);
    });

    it('should skip sentence uniformity on short text', () => {
      const checker = new Smellcheck();
      const result = checker.analyze('Short text. Not enough sentences.');
      const su = result.scoredPlugins.find(r => r.plugin === 'sentenceUniformity');
      expect(su?.skipped).toBe(true);
    });
  });

  describe('.use() — registering custom plugins at runtime', () => {
    it('should accept and run a custom PatternPlugin', () => {
      const checker = new Smellcheck({ plugins: { typography: false, unicode: false, buzzwords: false, unnatural: false, sentenceUniformity: false } });
      checker.use({
        name: 'custom',
        analyze: (text) => ({
          plugin: 'custom',
          flagged: text.includes('BANNED'),
          matches: text.includes('BANNED')
            ? [{ text: 'BANNED', index: text.indexOf('BANNED'), length: 6, plugin: 'custom', reason: 'Banned word' }]
            : [],
        }),
      });
      const result = checker.analyze('This text contains BANNED content.');
      expect(result.flagged).toBe(true);
      expect(result.allMatches[0].plugin).toBe('custom');
    });
  });

  describe('result shape', () => {
    it('should always include flagged, plugins, scoredPlugins, and allMatches', () => {
      const checker = new Smellcheck();
      const result = checker.analyze(CLEAN_TEXT);
      expect(result).toHaveProperty('flagged');
      expect(result).toHaveProperty('plugins');
      expect(result).toHaveProperty('scoredPlugins');
      expect(result).toHaveProperty('allMatches');
    });
  });
});
