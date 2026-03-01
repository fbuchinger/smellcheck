import { TypographyPlugin } from '../../src/plugins/typography.js';

describe('TypographyPlugin', () => {
  const plugin = new TypographyPlugin();

  describe('given clean ASCII text', () => {
    it('should not flag the text', () => {
      const result = plugin.analyze('Hello world. This is a normal sentence.');
      expect(result.flagged).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('given text containing an em dash', () => {
    it('should flag the text', () => {
      const result = plugin.analyze('This is suspicious \u2014 see?');
      expect(result.flagged).toBe(true);
    });

    it('should return a match at the correct position', () => {
      const text = 'Hello \u2014 world';
      const result = plugin.analyze(text);
      expect(result.matches[0].index).toBe(6);
      expect(result.matches[0].text).toBe('\u2014');
    });

    it('should identify the plugin as "typography"', () => {
      const result = plugin.analyze('Test \u2014 dash');
      expect(result.matches[0].plugin).toBe('typography');
    });
  });

  describe('given text containing an en dash', () => {
    it('should flag it', () => {
      const result = plugin.analyze('Pages 10\u201320');
      expect(result.flagged).toBe(true);
      expect(result.matches[0].text).toBe('\u2013');
    });
  });

  describe('given text containing a non-breaking space', () => {
    it('should flag it', () => {
      const result = plugin.analyze('Hello\u00A0world');
      expect(result.flagged).toBe(true);
      expect(result.matches[0].reason).toContain('Non-breaking space');
    });
  });

  describe('given text with curly quotes', () => {
    it('should flag curly single quotes', () => {
      const result = plugin.analyze('\u2018smart quotes\u2019');
      expect(result.flagged).toBe(true);
      expect(result.matches).toHaveLength(2);
    });

    it('should flag curly double quotes', () => {
      const result = plugin.analyze('\u201CHello\u201D');
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with a zero-width space', () => {
    it('should flag it and report correct match length', () => {
      const text = 'invis\u200Bible';
      const result = plugin.analyze(text);
      expect(result.flagged).toBe(true);
      expect(result.matches[0].length).toBe(1);
    });
  });

  describe('given text with an ellipsis character', () => {
    it('should flag the Unicode ellipsis but not three separate dots', () => {
      const withChar = plugin.analyze('Waiting\u2026');
      const withDots = plugin.analyze('Waiting...');
      expect(withChar.flagged).toBe(true);
      expect(withDots.flagged).toBe(false);
    });
  });

  describe('given multiple suspicious characters', () => {
    it('should return multiple matches sorted by position', () => {
      const text = '\u2018Hello\u2019 \u2014 world\u2026';
      const result = plugin.analyze(text);
      expect(result.matches.length).toBeGreaterThanOrEqual(3);
      const positions = result.matches.map(m => m.index);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });
  });

  describe('with custom extra patterns', () => {
    it('should flag characters matching the extra pattern', () => {
      const custom = new TypographyPlugin({ extra: ['\u00B0'] }); // degree sign
      const result = custom.analyze('It is 72\u00B0F today');
      expect(result.flagged).toBe(true);
    });
  });
});
