export type ReadingLevel = 'original' | 'simplified' | 'summary';
export type ReaderTheme = 'cream' | 'slate' | 'dark' | 'sepia';
export type Article = { title: string; text: string; source: string; image?: string };

export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

export function focusChunks(text: string): string[] {
  return paragraphs(text).flatMap(paragraph => {
    const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [paragraph];
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if (current && (current + sentence).split(/\s+/).length > 65) {
        chunks.push(current.trim());
        current = '';
      }
      current += sentence;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  });
}

export function bionicParts(word: string): [string, string] {
  const length = Math.ceil(word.length / 2);
  return [word.slice(0, length), word.slice(length)];
}

export function publicUrl(value: string): URL {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
    !host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') ||
    host.endsWith('.internal') || host.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    throw new Error('Please use a public HTTPS website address.');
  }
  return url;
}

export function isPublicIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  return a !== 0 && a !== 10 && a !== 127 && a !== undefined && a < 224 &&
    !(a === 169 && b === 254) && !(a === 172 && b !== undefined && b >= 16 && b <= 31) &&
    !(a === 192 && (b === 168 || b === 0)) && !(a === 100 && b !== undefined && b >= 64 && b <= 127) &&
    !(a === 198 && (b === 18 || b === 19));
}

export const sampleArticle: Article = {
  title: 'The quiet power of taking a break',
  source: 'The NeuroFlow journal',
  text: `In a world that celebrates being busy, taking a break can feel like falling behind. But a pause is not the opposite of progress. Sometimes, it is exactly what makes progress possible.

Our brains are not designed to stay focused for hours without rest. When we give ourselves a moment to step away, we create space to process what we have learned and return with a clearer mind.

A small pause, a big difference

You do not need a long holiday to feel the benefits of rest. A short walk, a glass of water, or a few minutes looking out of a window can help your attention reset. The important thing is to let your mind wander without asking it to do another task.

Research suggests that brief breaks can improve concentration and help us approach problems from a new perspective. A different view, even for a moment, can reveal a solution that was difficult to see before.

Finding your own rhythm

There is no perfect schedule that works for everyone. Try noticing when your attention starts to drift. That might be your mind asking for a little breathing room, rather than a sign that you need to try harder.

Start small. Read a little, pause, and come back when you are ready. Learning is not a race. Your pace is a good place to begin.`,
};