import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Flower2, Leaf, LoaderCircle, SlidersHorizontal, Sparkles, X, Download, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { IngestionPanel } from '@/components/reader/ingestion-panel';
import { ReadingText, BionicText } from '@/components/reader/reading-text';
import { ReaderSettings, defaultPreferences, type ReaderPreferences } from '@/components/reader/reader-settings';
import { FocusToolbar } from '@/components/reader/focus-toolbar';
import { extractArticle } from '@/lib/reader.functions';
import { focusChunks, publicUrl, sampleArticle, type Article, type ReadingLevel } from '@/lib/reader';
import hills from '@/assets/quiet-hills.jpg';
import dyslexicFont from '@/assets/dyslexic-font.asset.json';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'NeuroFlow — A calmer way to read' },
    { name: 'description', content: 'Read at your own pace with bionic reading, focus cards, gentle themes and AI text simplification in NeuroFlow.' },
    { property: 'og:title', content: 'NeuroFlow — A calmer way to read' },
    { property: 'og:description', content: 'Your text. Your pace. A calmer reading space for every kind of mind.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const extract = useServerFn(extractArticle);
  const [article, setArticle] = useState<Article>(sampleArticle);
  const [level, setLevel] = useState<ReadingLevel>('original');
  const [variants, setVariants] = useState<Partial<Record<ReadingLevel, string>>>({});
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPreferences);
  const [bionic, setBionic] = useState(false);
  const [focus, setFocus] = useState(false);
  const [chunksOpen, setChunksOpen] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [distractionFree, setDistractionFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const readerRef = useRef<HTMLElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const text = level === 'original' ? article.text : (variants[level] ?? '');
  const chunks = focusChunks(text);
  const words = text.trim().split(/\s+/).length;

  useEffect(() => {
    const font = new FontFace('OpenDyslexic', `url(${dyslexicFont.url})`);
    void font.load().then(loaded => document.fonts.add(loaded)).catch(() => setError('The OpenDyslexic font could not load. Please check your connection.'));
    return () => { abortRef.current?.abort(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    function update() {
      const element = readerRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const amount = (window.innerHeight - rect.top) / rect.height;
      setProgress(Math.max(0, Math.min(100, amount * 100)));
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [text]);

  useEffect(() => {
    if (!focus) return;
    const move = (event: MouseEvent) => focusRef.current?.style.setProperty('--focus-y', `${event.clientY}px`);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocus(false);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const current = Number.parseFloat(focusRef.current?.style.getPropertyValue('--focus-y') || '400');
        focusRef.current?.style.setProperty('--focus-y', `${Math.max(50, Math.min(window.innerHeight - 50, current + (event.key === 'ArrowDown' ? 32 : -32)))}px`);
      }
    };
    window.addEventListener('mousemove', move); window.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('keydown', keyboard); };
  }, [focus]);

  function stopListening() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setListening(false);
  }

  async function ingest(value: string, type: 'url' | 'text', filename?: string) {
    setError('');
    if (!value.trim() || value.length > 30000) { setError('Please provide text up to 30,000 characters.'); return; }
    if (type === 'url') {
      try { publicUrl(value); } catch (e) { setError(e instanceof Error ? e.message : 'Please use a public HTTPS website address.'); return; }
    }
    stopListening(); setBusy(true); abortRef.current?.abort();
    try {
      let next: Article;
      if (type === 'url') {
        const result = await extract({ data: { url: value } });
        if (!result.article) throw new Error(result.error || 'This page could not be read.');
        next = result.article;
      } else {
        await new Promise(resolve => window.setTimeout(resolve, 500));
        next = { title: filename ? filename.replace(/\.(txt|md)$/i, '') : 'A fresh perspective', text: value.trim(), source: filename ? 'Your document' : 'Your text' };
      }
      setArticle(next); setVariants({}); setLevel('original'); setChunkIndex(0);
      readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { setError(e instanceof Error ? e.message : 'This could not be opened. Try pasting its text.'); }
    finally { setBusy(false); }
  }

  async function changeLevel(next: ReadingLevel) {
    if (generating) return;
    stopListening(); setError(''); setChunkIndex(0);
    if (next === 'original' || variants[next]) { setLevel(next); return; }
    const controller = new AbortController(); abortRef.current = controller;
    setGenerating(true); setLevel(next); setVariants(old => ({ ...old, [next]: '' }));
    let output = '';
    try {
      const response = await fetch('/api/public/simplify', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: article.text, level: next }) });
      if (!response.ok) {
        const failure = await response.json();
        throw new Error(failure.message || failure.error?.message || failure.error || 'Simplification is currently unavailable.');
      }
      const stream = response.body?.getReader();
      if (!stream) throw new Error('No response was received. Your original text is still available.');
      const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const part = await stream.read(); if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop() || '';
        for (const event of events) {
          const raw = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
          if (!raw || raw === '[DONE]') continue;
          const payload = JSON.parse(raw);
          if (payload.type === 'response.output_text.delta') {
            output += payload.delta;
            setVariants(old => ({ ...old, [next]: output }));
          }
          if (payload.type === 'error' || payload.type === 'response.failed') throw new Error(payload.message || payload.error?.message || payload.response?.error?.message || 'Simplification stopped. Your original text is still available.');
          if (payload.type === 'response.refusal.delta' || payload.type === 'response.refusal.done') throw new Error(payload.refusal || payload.delta || 'This text could not be simplified.');
        }
      }
      if (!output.trim()) throw new Error('No simplified text was returned. Your original text is still available.');
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Simplification could not finish.');
      setVariants(old => { const copy = { ...old }; delete copy[next]; return copy; }); setLevel('original');
    } finally { setGenerating(false); abortRef.current = null; }
  }

  function listen() {
    if (!('speechSynthesis' in window)) { setError('Read-aloud is not supported in this browser.'); return; }
    if (listening) { stopListening(); return; }
    const utterance = new SpeechSynthesisUtterance(`${article.title}. ${text}`);
    utterance.rate = 0.9; utterance.onend = () => setListening(false);
    utterance.onerror = () => { setListening(false); setError('Read-aloud could not play. Please try again.'); };
    window.speechSynthesis.speak(utterance); setListening(true);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([`${article.title}\n\n${text}`], { type: 'text/plain' }));
    const link = document.createElement('a'); link.href = url; link.download = 'neuroflow-reading.txt'; link.click(); URL.revokeObjectURL(url);
  }

  return <div className={`neuroflow theme-${preferences.theme} ${distractionFree ? 'distraction-free' : ''}`}>
    <div className={`reading-progress ${progress >= 99 ? 'complete' : ''}`} style={{ '--progress': `${progress}%` } as React.CSSProperties} aria-hidden="true"/>
    <a href="#reader" className="skip-link">Skip to reader</a>
    <header className="app-header"><a href="/" className="brand" aria-label="NeuroFlow home"><span className="brand-mark"><Flower2 size={27} strokeWidth={1.6}/></span><span>neuro<span className="font-normal">flow</span><span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-9"><a href="#reader" className="nav-current">Reader</a><Button variant="ghost" className="about-button" onClick={() => setAboutOpen(true)}>About NeuroFlow</Button><span className="header-tag"><Leaf size={14}/>A little breathing room</span></nav>
    </header>

    <div className="workspace">
      <section className="welcome-section"><div className="eyebrow"><span/>A CALMER WAY TO READ</div><h1>Your space to read<span className="text-primary">.</span></h1><p>Less noise. More understanding. At your own pace.</p>
        <IngestionPanel busy={busy} onSubmit={ingest} onError={setError}/>
      </section>
      {error && <div role="alert" className="error-notice"><span>{error}</span><Button variant="ghost" size="icon" aria-label="Dismiss error" onClick={() => setError('')}><X/></Button></div>}
      <section className="reading-workspace" aria-label="Adaptive reader">
        <div className="reader-column"><div className="reader-topline"><div className="flex items-center gap-2"><BookOpen size={17}/><span>Your reading space</span></div><div className="flex items-center gap-2"><span className="sample-label">{article === sampleArticle ? 'A little something to start with' : 'Ready when you are'}</span><Button className="mobile-settings" variant="ghost" size="icon" aria-label="Reading preferences" onClick={() => setSettingsOpen(true)}><SlidersHorizontal/></Button></div></div>
          <article id="reader" ref={readerRef} className={`reader-canvas ${busy ? 'transforming' : ''}`}>
            <div className="reader-levels"><div className="level-controls" role="group" aria-label="Text simplification level">{([{ value: 'original', label: 'Original' }, { value: 'simplified', label: 'Simplified' }, { value: 'summary', label: 'Summary' }] as const).map(item => <Button key={item.value} variant="ghost" disabled={generating || busy} aria-pressed={level === item.value} className={level === item.value ? 'level-active' : ''} onClick={() => void changeLevel(item.value)}>{item.value === 'simplified' && <Sparkles size={14}/>} {item.label}</Button>)}</div><Button variant="ghost" size="icon" aria-label="Download reading text" title="Download reading text" disabled={generating} onClick={download}><Download size={17}/></Button></div>
            <div className="article-inner"><div className="article-meta"><span className="journal-label"><span/>{article.source}</span><span className="flex items-center gap-1.5"><Clock3 size={13}/>{Math.max(1, Math.ceil(words/200))} min read</span></div>
              <h2 className="article-title">{article.title}</h2>
              {article === sampleArticle && <div className="article-image"><img src={hills} width={1600} height={544} alt="A winding path through quiet green hills"/></div>}
              <div className="article-text" data-dyslexic={preferences.dyslexic} style={{ '--reader-size': `${preferences.fontSize}px`, '--reader-spacing': preferences.lineSpacing } as React.CSSProperties}>
                {generating && !text && <div className="generation-loading" role="status"><LoaderCircle className="animate-spin" size={20}/>Finding a clearer way to say it…</div>}
                <ReadingText text={text} bionic={bionic}/>
              </div>
              {generating ? <Button variant="outline" onClick={() => abortRef.current?.abort()}><X/>Stop simplification</Button> : <div className="article-end"><Flower2 size={20}/><span>A little pause is part of the progress.</span></div>}
            </div>
          </article>
          <div className="reader-footnote"><ShieldCheck size={13}/><span>Your reading stays in this session. AI rewrites may need a fact-check.</span></div>
        </div>
        <ReaderSettings preferences={preferences} onChange={setPreferences}/>
      </section>
      <footer className="app-footer"><span>Made for different minds.</span><span>Read gently. Learn freely.</span></footer>
    </div>
    <FocusToolbar bionic={bionic} focus={focus} chunks={chunksOpen} distractionFree={distractionFree} listening={listening} onBionic={() => setBionic(!bionic)} onFocus={() => setFocus(!focus)} onChunks={() => { setChunkIndex(0); setChunksOpen(true); }} onDistraction={() => setDistractionFree(!distractionFree)} onListen={listen}/>
    {focus && <div ref={focusRef} className="focus-line" aria-hidden="true"><div/></div>}
    <Dialog open={chunksOpen} onOpenChange={setChunksOpen}><DialogContent className={`focus-card theme-${preferences.theme}`}><DialogHeader><DialogTitle className="text-sm font-normal text-muted-foreground">One thought at a time</DialogTitle><DialogDescription>{article.title}</DialogDescription></DialogHeader><div className="focus-card-counter">{chunkIndex+1} / {Math.max(1,chunks.length)}</div>
      <div key={chunkIndex} className="focus-card-text" data-dyslexic={preferences.dyslexic} style={{ '--reader-size': `${preferences.fontSize}px`, '--reader-spacing': preferences.lineSpacing } as React.CSSProperties}><BionicText text={chunks[chunkIndex] || 'Your reading is ready.'} enabled={bionic}/></div>
      <div className="flex items-center justify-between gap-3"><Button variant="outline" aria-label="Previous focus card" disabled={chunkIndex === 0} onClick={() => setChunkIndex(i => i-1)}><ArrowLeft/>Previous</Button><span className="text-xs text-muted-foreground">No rush.</span>{chunkIndex < chunks.length-1 ? <Button aria-label="Next focus card" onClick={() => setChunkIndex(i => i+1)}>Next<ArrowRight/></Button> : <Button onClick={() => setChunksOpen(false)}>Finish<Check/></Button>}</div>
    </DialogContent></Dialog>
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className={`settings-dialog theme-${preferences.theme}`}><DialogHeader><DialogTitle>Reading preferences</DialogTitle><DialogDescription className="sr-only">Adjust the reader appearance and typography.</DialogDescription></DialogHeader><ReaderSettings preferences={preferences} onChange={setPreferences}/></DialogContent></Dialog>
    <Dialog open={aboutOpen} onOpenChange={setAboutOpen}><DialogContent className={`theme-${preferences.theme}`}><DialogHeader><DialogTitle className="flex items-center gap-2"><Flower2/>About NeuroFlow</DialogTitle><DialogDescription>A calmer reading space for every kind of mind.</DialogDescription></DialogHeader><p className="leading-relaxed">NeuroFlow is built around the idea that learning should meet you where you are. Different minds deserve different ways to read.</p><p className="text-sm leading-relaxed text-muted-foreground">Your reading is not saved after you leave. Choosing Simplified or Summary sends the current text to our AI service. Avoid sharing private or sensitive information. AI can make mistakes; check important details against the original.</p></DialogContent></Dialog>
  </div>;
}
