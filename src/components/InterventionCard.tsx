import { ChevronDown, BookOpen } from 'lucide-react';
import type { Intervention, Philosopher } from '@/types';

interface InterventionCardProps {
  intervention: Intervention;
  philosopher: Philosopher;
  onClick: () => void;
}

export function InterventionCard({ intervention, philosopher, onClick }: InterventionCardProps) {
  return (
    <button onClick={onClick} className="dark-academia-card text-left p-5 w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full border flex items-center justify-center font-heading shrink-0"
            style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}
          >
            {philosopher.name.charAt(0)}
          </span>
          <div>
            <p className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#8b5254]">
              Seat {intervention.seat_position + 1} · Pass {intervention.pass_number}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className="text-[#4a392d]/50 shrink-0" />
      </div>
      <p className="drop-cap line-clamp-4 text-[15px] leading-relaxed text-[#465f75]">
        {intervention.response_text}
      </p>
      <div className="flex flex-wrap gap-1 mt-4">
        {intervention.citations.map((citation) => (
          <span key={citation.label} className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}>
            <BookOpen size={10} /> {citation.label}
          </span>
        ))}
      </div>
    </button>
  );
}
