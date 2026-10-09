import { ScanLine, Layers, Headphones, Maximize2, Minimize2, Pause, Bold } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FocusToolbar({ bionic, focus, chunks, distractionFree, listening, onBionic, onFocus, onChunks, onDistraction, onListen }: {
  bionic: boolean; focus: boolean; chunks: boolean; distractionFree: boolean; listening: boolean;
  onBionic: () => void; onFocus: () => void; onChunks: () => void; onDistraction: () => void; onListen: () => void;
}) {
  const items = [
    { name: 'Bionic reading', short: 'Bionic', icon: Bold, active: bionic, click: onBionic },
    { name: 'Focus line', short: 'Focus line', icon: ScanLine, active: focus, click: onFocus },
    { name: 'Focus cards', short: 'Focus cards', icon: Layers, active: chunks, click: onChunks },
    { name: listening ? 'Stop listening' : 'Listen to article', short: listening ? 'Stop' : 'Listen', icon: listening ? Pause : Headphones, active: listening, click: onListen },
  ];
  return <TooltipProvider><div className="focus-toolbar" role="toolbar" aria-label="Focus tools">{items.map(item => <Tooltip key={item.name}><TooltipTrigger asChild>
    <Button variant="ghost" aria-label={item.name} aria-pressed={item.active} onClick={item.click} className={`toolbar-button ${item.active ? 'is-active' : ''}`}><item.icon size={18}/><span>{item.short}</span></Button>
  </TooltipTrigger><TooltipContent>{item.name}</TooltipContent></Tooltip>)}<span className="toolbar-divider"/>
    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="toolbar-button" aria-label={distractionFree ? 'Exit distraction-free mode' : 'Distraction-free mode'} aria-pressed={distractionFree} onClick={onDistraction}>{distractionFree ? <Minimize2/> : <Maximize2/>}</Button></TooltipTrigger><TooltipContent>{distractionFree ? 'Exit distraction-free mode' : 'Distraction-free mode'}</TooltipContent></Tooltip>
  </div></TooltipProvider>;
}