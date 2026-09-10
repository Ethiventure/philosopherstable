import { X } from 'lucide-react';
import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';

interface SourceDrawerProps {
  onClose: () => void;
}

export function SourceDrawer({ onClose }: SourceDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 bottom-0 w-full max-w-xl parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="pass-indicator text-[#8b5254]">Corpus manifest</p>
            <h2 className="text-3xl">The sources</h2>
            <p className="italic text-[#465f75]/65 mt-1">Provenance before performance.</p>
          </div>
          <button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="space-y-3">
          {CORPUS_SOURCES_DATA.map((source) => (
            <div key={`${source.author}-${source.title}`} className="border-b border-[#4a392d]/15 pb-3">
              <div className="flex justify-between gap-3">
                <p className="font-heading text-base text-[#4a392d]">{source.title}</p>
                <span className={`text-[9px] whitespace-nowrap uppercase tracking-wider ${source.full_text_ingested ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>
                  {source.full_text_ingested ? 'Full text' : 'Metadata'}
                </span>
              </div>
              <p className="text-sm text-[#465f75]/70">{source.author} · {source.publication_date}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#8b5254]/80 mt-1">{source.licence_status}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
