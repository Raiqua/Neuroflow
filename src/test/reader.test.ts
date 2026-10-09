import { describe, expect, it } from 'vitest';
import { bionicParts, focusChunks, publicUrl, isPublicIPv4 } from '@/lib/reader';

describe('Reader transformations', () => {
  it('highlights the initial letters without losing text', () => {
    expect(bionicParts('reading')).toEqual(['read', 'ing']);
  });
  it('breaks paragraphs into sequential focus cards', () => {
    expect(focusChunks('A small pause.\n\nA fresh start.')).toEqual(['A small pause.', 'A fresh start.']);
  });
  it('only accepts public HTTPS addresses', () => {
    expect(publicUrl('https://example.com/story').hostname).toBe('example.com');
    for (const value of ['http://example.com', 'https://localhost', 'https://127.0.0.1', 'https://10.1.1.1', 'https://user:pass@example.com', 'https://example.internal']) expect(() => publicUrl(value)).toThrow();
  });
  it('rejects private DNS destinations', () => {
    expect(isPublicIPv4('93.184.216.34')).toBe(true);
    for (const ip of ['127.0.0.1', '10.0.0.1', '192.168.0.1', '172.16.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0']) expect(isPublicIPv4(ip)).toBe(false);
  });
});