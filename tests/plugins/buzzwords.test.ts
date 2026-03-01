import { BuzzwordsPlugin } from '../../src/plugins/buzzwords.js';

describe('BuzzwordsPlugin', () => {
  const plugin = new BuzzwordsPlugin();

  describe('given clean, everyday text', () => {
    it('should not flag the text', () => {
      const result = plugin.analyze('I went to the store and bought some bread and milk.');
      expect(result.flagged).toBe(false);
    });
  });

  describe('given text containing "delve"', () => {
    it('should flag the text', () => {
      const result = plugin.analyze('Let us delve into the topic.');
      expect(result.flagged).toBe(true);
    });

    it('should match case-insensitively', () => {
      const result = plugin.analyze('Let us DELVE into the topic.');
      expect(result.flagged).toBe(true);
    });

    it('should return the original casing in the match text', () => {
      const result = plugin.analyze('We must Delve deeper.');
      expect(result.matches[0].text).toBe('Delve');
    });
  });

  describe('given text with an AI phrase', () => {
    it('should flag "it\'s worth noting"', () => {
      const result = plugin.analyze("It's worth noting that this is flagged.");
      expect(result.flagged).toBe(true);
    });

    it('should flag "in conclusion"', () => {
      const result = plugin.analyze('In conclusion, the results are clear.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "a plethora of"', () => {
      const result = plugin.analyze('There are a plethora of reasons to avoid this.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with words that contain a buzzword as a substring', () => {
    it('should not flag "leverage" appearing inside "knowledgeable"', () => {
      // "leverage" is a buzzword but should not match inside other words
      const result = plugin.analyze('She is very knowledgeable on the subject.');
      expect(result.flagged).toBe(false);
    });
  });

  describe('given multiple buzzwords', () => {
    it('should return one match per buzzword occurrence', () => {
      const result = plugin.analyze('We will leverage robust synergy to empower the ecosystem.');
      expect(result.matches.length).toBeGreaterThanOrEqual(4);
    });

    it('should sort matches by position', () => {
      const result = plugin.analyze('Leverage and synergy and robust and holistic approaches.');
      const positions = result.matches.map(m => m.index);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });
  });

  describe('with extra words added via config', () => {
    it('should flag the custom extra word', () => {
      const custom = new BuzzwordsPlugin({ extra: ['synergize'] });
      const result = custom.analyze('We need to synergize our efforts.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('with words excluded via config', () => {
    it('should not flag the excluded word', () => {
      const custom = new BuzzwordsPlugin({ exclude: ['robust'] });
      const result = custom.analyze('A robust solution.');
      expect(result.flagged).toBe(false);
    });
  });
});
