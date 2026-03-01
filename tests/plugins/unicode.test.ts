import { UnicodePlugin } from '../../src/plugins/unicode.js';

describe('UnicodePlugin', () => {
  const plugin = new UnicodePlugin();

  describe('given plain ASCII text', () => {
    it('should not flag the text', () => {
      const result = plugin.analyze('Hello world! No emoji here.');
      expect(result.flagged).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('given text containing emoji', () => {
    it('should flag a face emoji', () => {
      const result = plugin.analyze('Great job! \uD83D\uDE00');
      expect(result.flagged).toBe(true);
    });

    it('should return a match with the correct plugin name', () => {
      const result = plugin.analyze('Hello \uD83C\uDF1F world');
      expect(result.matches[0].plugin).toBe('unicode');
    });

    it('should include the Unicode code point in the reason', () => {
      const result = plugin.analyze('\uD83D\uDE80');
      expect(result.matches[0].reason).toContain('U+');
    });
  });

  describe('given text with miscellaneous symbols', () => {
    it('should flag a star symbol (\u2605)', () => {
      const result = plugin.analyze('Rating: \u2605\u2605\u2605');
      expect(result.flagged).toBe(true);
      expect(result.matches).toHaveLength(3);
    });

    it('should flag dingbats', () => {
      const result = plugin.analyze('See here \u2708');
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with flag emoji components', () => {
    it('should flag regional indicator symbols', () => {
      const result = plugin.analyze('\uD83C\uDDFA\uD83C\uDDF8'); // US flag
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with ordinary Latin extended characters', () => {
    it('should not flag accented letters', () => {
      const result = plugin.analyze('caf\u00E9 na\u00EFve r\u00E9sum\u00E9');
      expect(result.flagged).toBe(false);
    });
  });

  describe('given multiple emoji', () => {
    it('should return matches sorted by position', () => {
      const text = '\uD83D\uDE00 hello \uD83D\uDE80 world';
      const result = plugin.analyze(text);
      expect(result.matches.length).toBe(2);
      expect(result.matches[0].index).toBeLessThan(result.matches[1].index);
    });
  });

  describe('with custom extra ranges', () => {
    it('should flag characters in the extra range', () => {
      const custom = new UnicodePlugin({ extraRanges: [[0x2460, 0x2473]] }); // circled numbers
      const result = custom.analyze('Step \u2460: start here');
      expect(result.flagged).toBe(true);
    });
  });
});
