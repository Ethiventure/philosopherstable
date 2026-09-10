import { Sparkles, BookOpen, ScrollText } from 'lucide-react';
import type { Intervention } from '@/types';

interface SpiralViewProps {
  interventions: Intervention[];
  question: string;
  activePass: number;
}

export function SpiralView({ interventions, question, activePass }: SpiralViewProps) {
  const labels = ['The question', 'Problem map', 'Dialectical map', 'Spiral synthesis'];
  const texts = [
    question,
    'The problem has entered the first circuit and gathered distinct conceptual lenses.',
    'Positions are now encountering their strongest objections; agreement is not the measure.',
    'A revised problem waits for the cabinet to complete its third pass.',
  ];

  return (
    <div className="space-y-2">
      {labels.map((label, index) => {
        const isVisible = index === 0 || interventions.length >= index * 9;
        return (
          <div key={label} className={`relative pl-8 ${isVisible ? 'opacity-100' : 'opacity-35'} transition-opacity`}>
            <div
              className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                index <= activePass + 1
                  ? 'bg-[#8b5254] text-[#f2ebd9] border-[#8b5254]'
                  : 'border-[#4a392d]/30 text-[#4a392d]/50'
              }`}
            >
              {index}
            </div>
            {index < 3 && <div className="absolute left-[9px] top-6 h-8 border-l border-dashed border-[#b89968]" />}
            <p className="text-xs uppercase tracking-wider text-[#8b5254]">{label}</p>
            <p className="text-sm italic text-[#465f75]/75 leading-snug mt-1">{texts[index]}</p>
          </div>
        );
      })}
    </div>
  );
}

interface CabinetRecordProps {
  interventions: Intervention[];
  onInspectLatest: () => void;
}

export function CabinetRecord({ interventions, onInspectLatest }: CabinetRecordProps) {
  const uniqueCitations = new Set(interventions.flatMap((item) => item.citations.map((c) => c.label)));
  return (
    <div className="dark-academia-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen size={18} className="text-[#8b5254]" />
        <h3 className="text-xl">Cabinet record</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-[#eae1ca]/70 p-3">
          <p className="text-2xl font-heading text-[#4a392d]">{interventions.length}</p>
          <p className="text-xs uppercase tracking-wider text-[#465f75]/60">Interventions</p>
        </div>
        <div className="bg-[#eae1ca]/70 p-3">
          <p className="text-2xl font-heading text-[#4a392d]">{uniqueCitations.size}</p>
          <p className="text-xs uppercase tracking-wider text-[#465f75]/60">References</p>
        </div>
      </div>
      <button
        className="btn-secondary w-full mt-4 flex justify-center items-center gap-2"
        onClick={onInspectLatest}
        disabled={!interventions.length}
      >
        <ScrollText size={15} /> Inspect latest intervention
      </button>
    </div>
  );
}

interface PositionComparisonProps {
  philosophers: { id: string; name: string }[];
  interventions: Intervention[];
}

export function PositionComparison({ philosophers, interventions }: PositionComparisonProps) {
  return (
    <section className="mt-12">
      <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
      <p className="pass-indicator text-[#8b5254]">Memory across passes</p>
      <h2 className="text-3xl mb-5">Position changes</h2>
      <div className="grid lg:grid-cols-3 gap-4">
        {philosophers.slice(0, 3).map((philosopher) => (
          <div key={philosopher.id} className="dark-academia-card p-5">
            <h3 className="text-xl mb-3">{philosopher.name}</h3>
            {[1, 2, 3].map((pass) => {
              const item = interventions.find(
                (entry) => entry.philosopher_id === philosopher.id && entry.pass_number === pass,
              );
              return (
                <div key={pass} className="border-t border-[#4a392d]/15 pt-3 mt-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#8b5254]">Pass {pass}</p>
                  <p className="text-sm mt-1 line-clamp-3 text-[#465f75]/80">
                    {item?.response_text ?? 'Awaiting intervention.'}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export { Sparkles };
