import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { publicUrl } from './reader';

export const extractArticle = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ url: z.string().max(2048) }).parse(input))
  .handler(async ({ data }) => {
    try {
      publicUrl(data.url);
      const { readWebsite } = await import('./reader.server');
      return { article: await readWebsite(data.url), error: null };
    } catch (error) {
      return { article: null, error: error instanceof Error ? error.message : 'This page could not be read. Try pasting its text instead.' };
    }
  });