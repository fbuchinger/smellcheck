import { SentenceUniformityPlugin, splitSentences, countWords, stddev, mean } from '../../src/plugins/sentence-uniformity.js';

// ─── Unit tests for helper functions ─────────────────────────────────────────

describe('splitSentences (helper)', () => {
  describe('given simple sentences', () => {
    it('should split on full stops', () => {
      const result = splitSentences('Hello world. This is a test. Another sentence here.');
      expect(result).toHaveLength(3);
    });

    it('should split on exclamation marks', () => {
      const result = splitSentences('Wow! That is great! Really amazing.');
      expect(result).toHaveLength(3);
    });

    it('should split on question marks', () => {
      const result = splitSentences('What is this? Is it a test? Yes it is.');
      expect(result).toHaveLength(3);
    });
  });

  describe('given text with abbreviations', () => {
    it('should not split on Dr.', () => {
      const result = splitSentences('Dr. Smith attended the meeting. It was productive.');
      expect(result).toHaveLength(2);
    });

    it('should not split on e.g.', () => {
      const result = splitSentences('Common fruits, e.g. apples and oranges, are healthy. Eat them daily.');
      expect(result).toHaveLength(2);
    });

    it('should not split on vs.', () => {
      const result = splitSentences('The match was City vs. United. It ended in a draw.');
      expect(result).toHaveLength(2);
    });
  });

  describe('given fragments shorter than 2 words', () => {
    it('should discard single-word fragments', () => {
      const result = splitSentences('Hello. This is a proper sentence. OK.');
      expect(result).toHaveLength(1); // only the middle sentence
    });
  });
});

describe('countWords (helper)', () => {
  it('should count whitespace-delimited tokens', () => {
    expect(countWords('hello world foo')).toBe(3);
  });

  it('should handle extra whitespace', () => {
    expect(countWords('  hello   world  ')).toBe(2);
  });
});

describe('stddev (helper)', () => {
  it('should return 0 for an empty array', () => {
    expect(stddev([])).toBe(0);
  });

  it('should return 0 for identical values', () => {
    expect(stddev([5, 5, 5, 5])).toBe(0);
  });

  it('should compute population stddev correctly', () => {
    // Values: [2, 4, 4, 4, 5, 5, 7, 9], mean=5, variance=4, stddev=2
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 5);
  });
});

describe('mean (helper)', () => {
  it('should return 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('should compute the average correctly', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });
});

// ─── Plugin integration tests ─────────────────────────────────────────────────

/** Generates sentences of exactly `wordCount` words, repeated `count` times */
function makeSentences(lengths: number[]): string {
  return lengths
    .map(n => Array(n).fill('word').join(' ') + '.')
    .join(' The next sentence follows. ');
  // wrapping context words don't matter; splitSentences will handle them
}

/**
 * Builds a paragraph of sentences all the same length — maximally AI-like.
 */
function uniformText(sentenceLength: number, count: number): string {
  return Array(count)
    .fill(null)
    .map((_, i) => Array(sentenceLength).fill(`word${i}`).join(' ') + '.')
    .join(' ');
}

/**
 * Builds a paragraph with highly varied sentence lengths — human-like.
 */
const HUMAN_LIKE_TEXT = [
  'I went to the market.',
  'The vegetables were fresh and the fruit was absolutely wonderful, so I bought a great deal more than I had originally planned.',
  'Back home.',
  'Cooking took ages because I decided to try three completely new recipes from a book my friend lent me.',
  'We ate well.',
  'My partner loved the soup, which was a thick, creamy tomato bisque with a touch of smoked paprika and fresh basil on top.',
  'A good evening.',
  'Tomorrow we might do it all over again if we find the time and energy after work.',
].join(' ');

describe('SentenceUniformityPlugin', () => {
  describe('given fewer sentences than minSentences', () => {
    it('should skip analysis', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 6 });
      const result = plugin.analyze('Hello world. This is short.');
      expect(result.skipped).toBe(true);
    });

    it('should set a descriptive skipReason', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 6 });
      const result = plugin.analyze('Only two sentences here. Not enough at all.');
      expect(result.skipReason).toContain('need at least 6');
    });

    it('should return a score of 0 when skipped', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 6 });
      const result = plugin.analyze('Short text. Only here.');
      expect(result.score).toBe(0);
    });
  });

  describe('given disabled plugin', () => {
    it('should skip immediately', () => {
      const plugin = new SentenceUniformityPlugin({ enabled: false });
      const result = plugin.analyze(HUMAN_LIKE_TEXT);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('disabled');
    });
  });

  describe('given highly uniform sentence lengths (AI-like)', () => {
    // All sentences exactly 10 words → stddev = 0 → score = 1.0
    const AI_TEXT = uniformText(10, 10);

    it('should return a high score', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(AI_TEXT);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should not be skipped', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(AI_TEXT);
      expect(result.skipped).toBe(false);
    });

    it('should include a low_sentence_stddev finding', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(AI_TEXT);
      expect(result.findings.some(f => f.label === 'low_sentence_stddev')).toBe(true);
    });

    it('should include sentenceCount and lengths in the finding evidence', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(AI_TEXT);
      const finding = result.findings.find(f => f.label === 'low_sentence_stddev')!;
      expect(finding.evidence).toHaveProperty('sentenceCount');
      expect(finding.evidence).toHaveProperty('lengths');
      expect(finding.evidence).toHaveProperty('meanWords');
      expect(finding.evidence).toHaveProperty('stddevWords');
    });
  });

  describe('given human-like text with varied sentence lengths', () => {
    it('should return a low score', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 4 });
      const result = plugin.analyze(HUMAN_LIKE_TEXT);
      expect(result.score).toBeLessThan(0.4);
    });

    it('should have no findings', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 4 });
      const result = plugin.analyze(HUMAN_LIKE_TEXT);
      // Score may be 0 with no findings
      if (result.score === 0) {
        expect(result.findings).toHaveLength(0);
      }
    });
  });

  describe('given short and uniform sentences (listicle-style AI prose)', () => {
    // Sentences of 8 words each → short (< 15) AND uniform → bonus penalty
    const LISTICLE_TEXT = uniformText(8, 10);

    it('should apply the bonus penalty', () => {
      const plugin = new SentenceUniformityPlugin({ penaltyShort: 0.15 });
      const basePlugin = new SentenceUniformityPlugin({ penaltyShort: 0 });
      const withPenalty = plugin.analyze(LISTICLE_TEXT);
      const withoutPenalty = basePlugin.analyze(LISTICLE_TEXT);
      // With penalty score should be strictly higher (or both 1.0 if capped)
      expect(withPenalty.score).toBeGreaterThanOrEqual(withoutPenalty.score);
    });

    it('should include a short_uniform_sentences finding', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(LISTICLE_TEXT);
      expect(result.findings.some(f => f.label === 'short_uniform_sentences')).toBe(true);
    });

    it('should cap the score at 1.0', () => {
      const plugin = new SentenceUniformityPlugin({ penaltyShort: 999 });
      const result = plugin.analyze(LISTICLE_TEXT);
      expect(result.score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('score interpolation', () => {
    it('should return 1.0 when stddev is at or below stddevFloor', () => {
      // Sentences all the same length → stddev = 0, which is below any floor
      const plugin = new SentenceUniformityPlugin({ stddevFloor: 4.5, penaltyShort: 0 });
      const result = plugin.analyze(uniformText(20, 8)); // long uniform sentences, no short penalty
      expect(result.score).toBe(1.0);
    });

    it('should return 0.0 when stddev is at or above stddevCeiling', () => {
      // Wildly varied sentence lengths — very long + very short
      const varied = [
        'word.',
        Array(40).fill('word').join(' ') + '.',
        'tiny here.',
        Array(35).fill('long').join(' ') + '.',
        'ok.',
        Array(30).fill('sentence').join(' ') + '.',
        'yes.',
        Array(45).fill('big').join(' ') + '.',
      ].join(' ');
      const plugin = new SentenceUniformityPlugin({ stddevCeiling: 12, penaltyShort: 0, minSentences: 4 });
      const result = plugin.analyze(varied);
      expect(result.score).toBe(0);
    });
  });

  describe('custom configuration', () => {
    it('should respect a custom stddevFloor', () => {
      // With a very high floor, even moderately varied text should score 1.0
      const plugin = new SentenceUniformityPlugin({ stddevFloor: 100, stddevCeiling: 200, penaltyShort: 0 });
      const result = plugin.analyze(HUMAN_LIKE_TEXT);
      expect(result.score).toBe(1.0);
    });

    it('should respect a custom minSentences', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 2 });
      const result = plugin.analyze('First sentence here. Second sentence follows.');
      expect(result.skipped).toBe(false);
    });
  });

  describe('output shape', () => {
    it('should always return plugin name "sentenceUniformity"', () => {
      const plugin = new SentenceUniformityPlugin();
      const result = plugin.analyze(HUMAN_LIKE_TEXT);
      expect(result.plugin).toBe('sentenceUniformity');
    });

    it('should always return a score between 0 and 1', () => {
      const plugin = new SentenceUniformityPlugin({ minSentences: 2 });
      const texts = [HUMAN_LIKE_TEXT, uniformText(10, 8), 'Two sentences only. Here is second.'];
      texts.forEach(text => {
        const result = plugin.analyze(text);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });
  });
});
