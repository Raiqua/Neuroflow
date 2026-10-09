import { bionicParts, paragraphs } from '@/lib/reader';

export function BionicText({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled) return <>{text}</>;
  return <>{text.split(/(\p{L}+)/u).map((token, index) => {
    if (!/\p{L}/u.test(token)) return token;
    const [bold, rest] = bionicParts(token);
    return <span key={index}><strong className="font-bold">{bold}</strong>{rest}</span>;
  })}</>;
}

export function ReadingText({ text, bionic }: { text: string; bionic: boolean }) {
  return <div className="reading-prose">{paragraphs(text).map((paragraph, index) => {
    const heading = !/[.!?]$/.test(paragraph) && paragraph.length < 65 && !paragraph.startsWith('•');
    return heading ? <h3 key={index} className="mt-9 mb-4 text-[1.15em] font-bold">{paragraph}</h3> :
      <p className="mb-5" key={index}><BionicText text={paragraph} enabled={bionic} /></p>;
  })}</div>;
}