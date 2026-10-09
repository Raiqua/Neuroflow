import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { isPublicIPv4, publicUrl, type Article } from './reader';

async function safeFetch(value: string, depth = 0): Promise<Response> {
  const url = publicUrl(value);
  const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=A`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!dns.ok) throw new Error('This website could not be reached. Try pasting its text instead.');
  const result = await dns.json() as { Answer?: { type: number; data: string }[] };
  const addresses = result.Answer?.filter(a => a.type === 1) ?? [];
  if (!addresses.length || addresses.some(a => !isPublicIPv4(a.data))) throw new Error('This website address is not available to the reader.');
  const response = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html', 'User-Agent': 'NeuroFlowReader/1.0' } });
  if (response.status >= 300 && response.status < 400) {
    const next = response.headers.get('location');
    if (!next || depth >= 3) throw new Error('This website has too many redirects. Try pasting its text instead.');
    return safeFetch(new URL(next, url).href, depth + 1);
  }
  return response;
}

export async function readWebsite(value: string): Promise<Article> {
  const response = await safeFetch(value);
  if (!response.ok) throw new Error('This website does not allow the reader to open it. Try pasting its text instead.');
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Please use a webpage, or upload a text document.');
  if (!response.body) throw new Error('This page has no readable content.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 2_000_000) { await reader.cancel(); throw new Error('This page is too large. Try pasting the section you want to read.'); }
    html += decoder.decode(chunk.value, { stream: true });
  }
  html += decoder.decode();
  const { document } = parseHTML(html);
  const parsed = new Readability(document as unknown as Document).parse();
  if (!parsed?.textContent?.trim()) throw new Error('No article was found. Try pasting its text instead.');
  const content = parseHTML(`<html><body>${parsed.content}</body></html>`).document;
  const text = Array.from(content.querySelectorAll('p, h2, h3, li')).map(p => p.textContent?.trim()).filter(Boolean).join('\n\n') || parsed.textContent.trim();
  if (text.length > 30000) throw new Error('This article is too long. Paste a shorter section to read.');
  return { title: parsed.title || 'Your article', text, source: new URL(value).hostname };
}