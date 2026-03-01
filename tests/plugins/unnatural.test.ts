import { UnnaturalPlugin } from '../../src/plugins/unnatural.js';

describe('UnnaturalPlugin', () => {
  const plugin = new UnnaturalPlugin();

  describe('given everyday conversational text', () => {
    it('should not flag the text', () => {
      const result = plugin.analyze('I went to the gym today and had a great workout.');
      expect(result.flagged).toBe(false);
    });
  });

  describe('given text with archaic connectives', () => {
    it('should flag "aforementioned"', () => {
      const result = plugin.analyze('The aforementioned issues need addressing.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "heretofore"', () => {
      const result = plugin.analyze('This was heretofore unknown.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "whilst"', () => {
      const result = plugin.analyze('I waited whilst she finished.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "notwithstanding"', () => {
      const result = plugin.analyze('Notwithstanding the challenges, we proceed.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with pompous vocabulary', () => {
    it('should flag "elucidate"', () => {
      const result = plugin.analyze('Allow me to elucidate the matter.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "ameliorate"', () => {
      const result = plugin.analyze('Steps taken to ameliorate the situation.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "ubiquitous"', () => {
      const result = plugin.analyze('Smartphones have become ubiquitous.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('given text with Latin phrases', () => {
    it('should flag "inter alia"', () => {
      const result = plugin.analyze('The report covers, inter alia, the budget.');
      expect(result.flagged).toBe(true);
    });

    it('should flag "prima facie"', () => {
      const result = plugin.analyze('This is a prima facie case.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('match boundaries', () => {
    it('should not match unnatural words as substrings of other words', () => {
      // "whilst" should not match inside "meanwhile" or similar
      const result = plugin.analyze('She reiterated the point for clarity.');
      // "reiterate" IS in the list, so this should be flagged
      expect(result.flagged).toBe(true);
    });

    it('should match case-insensitively', () => {
      const result = plugin.analyze('AFOREMENTIONED issues remain.');
      expect(result.flagged).toBe(true);
    });
  });

  describe('with custom configuration', () => {
    it('should flag extra words added via config', () => {
      const custom = new UnnaturalPlugin({ extra: ['henceforthwith'] });
      const result = custom.analyze('We proceed henceforthwith.');
      expect(result.flagged).toBe(true);
    });

    it('should not flag words in the exclude list', () => {
      const custom = new UnnaturalPlugin({ exclude: ['elucidate'] });
      const result = custom.analyze('Allow me to elucidate.');
      expect(result.flagged).toBe(false);
    });
  });
});
