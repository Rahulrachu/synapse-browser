export interface PageSummary {
  title: string;
  url: string;
  summary: string;
  keyPoints: string[];
  readingTime: number;
  language: string;
  contentLength: number;
}

export class WebSummarizerService {
  // Extract main content from HTML
  async extractContent(html: string): Promise<string> {
    // Remove script and style tags
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    content = this.decodeHtmlEntities(content);

    // Remove extra whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content;
  }

  // Generate summary from content
  async generateSummary(content: string, maxLength: number = 300): Promise<string> {
    // Split into sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length === 0) return '';

    // Score sentences based on keyword frequency
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = this.calculateWordFrequency(words);

    const scoredSentences = sentences.map((sentence) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const score = sentenceWords.reduce(
        (sum, word) => sum + (wordFreq[word] || 0),
        0
      );
      return { sentence: sentence.trim(), score };
    });

    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(sentences.length / 3))
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
      .map((s) => s.sentence)
      .join(' ');

    // Truncate to maxLength
    if (topSentences.length > maxLength) {
      return topSentences.substring(0, maxLength) + '...';
    }

    return topSentences;
  }

  // Extract key points from content
  async extractKeyPoints(content: string, maxPoints: number = 5): Promise<string[]> {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length === 0) return [];

    // Score sentences
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = this.calculateWordFrequency(words);

    const scoredSentences = sentences.map((sentence) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const score = sentenceWords.reduce(
        (sum, word) => sum + (wordFreq[word] || 0),
        0
      );
      return { sentence: sentence.trim(), score };
    });

    // Get top sentences as key points
    const keyPoints = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPoints)
      .map((s) => s.sentence);

    return keyPoints;
  }

  // Calculate reading time
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Detect language
  async detectLanguage(content: string): Promise<string> {
    // Simple language detection based on common words
    const englishWords = [
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'i',
    ];
    const frenchWords = [
      'le',
      'de',
      'un',
      'et',
      'à',
      'être',
      'en',
      'que',
      'avoir',
      'je',
    ];
    const spanishWords = [
      'el',
      'de',
      'un',
      'y',
      'a',
      'ser',
      'en',
      'que',
      'haber',
      'yo',
    ];

    const words = content.toLowerCase().split(/\s+/).slice(0, 100);

    let englishCount = 0;
    let frenchCount = 0;
    let spanishCount = 0;

    words.forEach((word) => {
      if (englishWords.includes(word)) englishCount++;
      if (frenchWords.includes(word)) frenchCount++;
      if (spanishWords.includes(word)) spanishCount++;
    });

    if (englishCount > frenchCount && englishCount > spanishCount) {
      return 'English';
    } else if (frenchCount > spanishCount) {
      return 'French';
    } else if (spanishCount > 0) {
      return 'Spanish';
    }

    return 'Unknown';
  }

  // Generate full page summary
  async summarizePage(
    html: string,
    title: string,
    url: string
  ): Promise<PageSummary> {
    const content = await this.extractContent(html);
    const summary = await this.generateSummary(content);
    const keyPoints = await this.extractKeyPoints(content);
    const readingTime = this.calculateReadingTime(content);
    const language = await this.detectLanguage(content);

    return {
      title,
      url,
      summary,
      keyPoints,
      readingTime,
      language,
      contentLength: content.length,
    };
  }

  // Helper: Calculate word frequency
  private calculateWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
    ]);

    words.forEach((word) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        freq[cleanWord] = (freq[cleanWord] || 0) + 1;
      }
    });

    return freq;
  }

  // Helper: Decode HTML entities
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(/&[a-z]+;/gi, (entity) => entities[entity] || entity);
  }
}
