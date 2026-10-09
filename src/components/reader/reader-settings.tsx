import { useId } from 'react';
import { Minus, Plus, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { type ReaderTheme } from '@/lib/reader';

export type ReaderPreferences = { theme: ReaderTheme; fontSize: number; lineSpacing: number; dyslexic: boolean };
export const defaultPreferences: ReaderPreferences = { theme: 'cream', fontSize: 18, lineSpacing: 1.8, dyslexic: false };

export function ReaderSettings({ preferences, onChange }: { preferences: ReaderPreferences; onChange: (value: ReaderPreferences) => void }) {
  const dyslexicId = useId();
  const update = (patch: Partial<ReaderPreferences>) => onChange({ ...preferences, ...patch });
  return <aside className="reader-settings" aria-label="Reading preferences">
    <div className="mb-7 flex items-center gap-2"><SlidersHorizontal size={17}/><h2 className="text-sm font-bold">Make it feel like you</h2></div>
    <fieldset><legend className="mb-3 text-xs font-bold text-muted-foreground">APPEARANCE</legend>
      <div className="grid grid-cols-4 gap-2">{(['cream','slate','dark','sepia'] as const).map(theme => <div key={theme} className="text-center">
        <Button variant="ghost" aria-label={`${theme === 'slate' ? 'Soft Slate' : theme} theme`} aria-pressed={preferences.theme === theme} onClick={() => update({ theme })} className={`theme-swatch swatch-${theme} ${preferences.theme === theme ? 'selected' : ''}`}>
          {preferences.theme === theme && <Check size={17}/>}</Button>
        <span className="mt-1 block text-[11px] text-muted-foreground">{theme === 'slate' ? 'Slate' : theme.charAt(0).toUpperCase()+theme.slice(1)}</span>
      </div>)}</div>
    </fieldset>
    <div className="setting-divider"/>
    <label className="flex items-center justify-between text-sm font-semibold">Text size <span className="text-xs font-normal text-muted-foreground">{preferences.fontSize}px</span></label>
    <div className="mt-3 flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Decrease text size" disabled={preferences.fontSize <= 16} onClick={() => update({ fontSize: preferences.fontSize - 1 })}><Minus/></Button>
      <Slider aria-label="Text size" min={16} max={28} step={1} value={[preferences.fontSize]} onValueChange={([fontSize]) => { if (fontSize !== undefined) update({ fontSize }); }}/>
      <Button variant="outline" size="icon" aria-label="Increase text size" disabled={preferences.fontSize >= 28} onClick={() => update({ fontSize: preferences.fontSize + 1 })}><Plus/></Button></div>
    <label className="mt-6 flex items-center justify-between text-sm font-semibold">Line spacing <span className="text-xs font-normal text-muted-foreground">{preferences.lineSpacing.toFixed(1)}×</span></label>
    <Slider className="mt-4" aria-label="Line spacing" min={1.6} max={1.8} step={0.1} value={[preferences.lineSpacing]} onValueChange={([lineSpacing]) => { if (lineSpacing !== undefined) update({ lineSpacing }); }}/>
    <div className="setting-divider"/>
    <label htmlFor={dyslexicId} className="flex items-center justify-between gap-2 text-sm font-semibold">OpenDyslexic <Switch id={dyslexicId} checked={preferences.dyslexic} onCheckedChange={dyslexic => update({ dyslexic })}/></label>
    <div className="font-preview mt-4 rounded-md bg-muted px-4 py-3 text-lg" data-dyslexic={preferences.dyslexic}>Aa <span className="ml-2 text-xs">A kinder kind of reading.</span></div>
    <div className="setting-divider"/>
    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => onChange(defaultPreferences)}><RotateCcw size={14}/>Reset preferences</Button>
    <div className="mt-9 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>Your pace. Your space.</div>
  </aside>;
}