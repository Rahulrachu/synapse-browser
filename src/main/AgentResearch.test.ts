import { describe, expect, it } from 'vitest';
import { trackSource } from './AgentResearch';

describe('research source tracking', () => {
  it('deduplicates URLs and keeps the latest inspected summary', () => {
    const first = trackSource([], { title: 'One', url: 'https://example.com', summary: 'old', relevance: 'first' });
    const second = trackSource(first, { title: 'One updated', url: 'https://example.com', summary: 'new', relevance: 'latest' });
    expect(second).toHaveLength(1);
    expect(second[0].summary).toBe('new');
  });

  it('keeps a bounded list and ignores non-http sources', () => {
    let sources = [];
    for (let index = 0; index < 10; index += 1) sources = trackSource(sources, { title: String(index), url: `https://example.com/${index}`, summary: 'x', relevance: 'r' });
    expect(sources).toHaveLength(8);
    expect(sources[0].title).toBe('2');
    expect(trackSource(sources, { title: 'bad', url: 'file:///secret', summary: 'x', relevance: 'r' })).toEqual(sources);
  });
});
