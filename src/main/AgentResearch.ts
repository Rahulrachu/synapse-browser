export type ResearchSource = { title: string; url: string; summary: string; relevance: string };

export const MAX_RESEARCH_SOURCES = 8;
export const MAX_SOURCE_SUMMARY = 600;

export function trackSource(current: ResearchSource[], source: ResearchSource, max = MAX_RESEARCH_SOURCES): ResearchSource[] {
  const normalizedUrl = String(source.url || '').trim();
  if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) return current;
  const next = current.filter((item) => item.url !== normalizedUrl);
  next.push({
    title: String(source.title || normalizedUrl).slice(0, 240),
    url: normalizedUrl,
    summary: String(source.summary || '').slice(0, MAX_SOURCE_SUMMARY),
    relevance: String(source.relevance || 'Inspected directly by Synapse').slice(0, 240),
  });
  return next.slice(-max);
}
