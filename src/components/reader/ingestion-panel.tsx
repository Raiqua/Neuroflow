import { useRef, useState } from 'react';
import { Link2, AlignLeft, Upload, ArrowUpRight, LoaderCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function IngestionPanel({ busy, onSubmit, onError }: { busy: boolean; onSubmit: (value: string, type: 'url' | 'text', filename?: string) => void; onError: (message: string) => void }) {
  const [type, setType] = useState('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  async function readFile(file?: File) {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) { onError('Please upload a .txt or .md document.'); return; }
    if (file.size > 120000) { onError('Please use a document smaller than 120 KB.'); return; }
    const value = await file.text();
    if (value.length > 30000) { onError('Please use a document with up to 30,000 characters.'); return; }
    setText(value); setFilename(file.name);
  }
  return <section className="ingestion-panel" aria-label="Open reading material">
    <Tabs value={type} onValueChange={setType}><div className="flex flex-wrap items-center justify-between gap-3"><TabsList className="ingestion-tabs"><TabsTrigger value="url"><Link2/>Website</TabsTrigger><TabsTrigger value="text"><AlignLeft/>Paste text</TabsTrigger><TabsTrigger value="upload"><Upload/>Upload</TabsTrigger></TabsList><span className="hidden text-xs text-muted-foreground sm:block">A fresh page, a clearer mind.</span></div>
    <form onSubmit={event => { event.preventDefault(); onSubmit(type === 'url' ? url : text, type === 'url' ? 'url' : 'text', filename); }} className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><TabsContent value="url" className="mt-0"><label className="sr-only" htmlFor="article-url">Website address</label><div className="relative"><Link2 className="absolute left-4 top-4 text-muted-foreground" size={17}/><Input id="article-url" type="url" placeholder="Paste an article or webpage link…" maxLength={2048} value={url} onChange={e => setUrl(e.target.value)} required={type === 'url'} className="h-12 bg-card pl-11"/></div></TabsContent>
      <TabsContent value="text" className="mt-0"><label className="sr-only" htmlFor="article-text">Text to read</label><Textarea id="article-text" placeholder="Paste something you’d like to read…" value={text} maxLength={30000} onChange={e => setText(e.target.value)} required={type === 'text'} className="min-h-24 bg-card"/></TabsContent>
      <TabsContent value="upload" className="mt-0"><input type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" ref={fileInput} aria-label="Upload text document" onChange={e => void readFile(e.target.files?.[0])}/><Button type="button" variant="outline" className="h-12 w-full justify-start bg-card text-muted-foreground" onClick={() => fileInput.current?.click()}><FileText/>{filename || 'Choose a text document (.txt, .md)'}</Button></TabsContent></div>
      <Button type="submit" disabled={busy || !(type === 'url' ? url.trim() : text.trim())} className="h-12 px-6">{busy ? <LoaderCircle className="animate-spin"/> : null}{busy ? 'Making room…' : 'Simplify & Focus'}{!busy && <ArrowUpRight/>}</Button></div>
    </form></Tabs>
  </section>;
}