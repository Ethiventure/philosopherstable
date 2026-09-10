import { ArrowRight } from 'lucide-react';
import type { Intervention, Philosopher } from '@/types';

interface CabinetTableProps {
  philosophers: Philosopher[];
  activeAgent: number;
  activePass: number;
  interventions: Intervention[];
  onSelect: (philosopher: Philosopher) => void;
}

export function CabinetTable({
  philosophers,
  activeAgent,
  activePass,
  interventions,
  onSelect,
}: CabinetTableProps) {
  const count = philosophers.length;
  const radius = 42;

  return (
    <div className="relative w-full max-w-[760px] mx-auto aspect-square min-h-[390px] md:min-h-[560px] flex items-center justify-center">
      {/* Table surface */}
      <div className="absolute w-[48%] h-[34%] rounded-[50%] border-[10px] border-[#4a392d]/80 bg-[#6d4c37]/10 shadow-[inset_0_0_40px_rgba(74,57,45,0.2),0_8px_24px_rgba(74,57,45,0.2)]">
        <div className="absolute inset-3 rounded-[50%] border border-[#b89968]/50 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">The cabinet</span>
          <span className="font-heading text-lg md:text-2xl text-[#4a392d]">A dialectical spiral</span>
          <span className="text-xs italic text-[#465f75]/60 mt-1">clockwise · sequential · unresolved</span>
        </div>
      </div>

      {/* Rotation arrow */}
      <div className="absolute inset-[8%] rotation-arrow pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#8b5254]">
          <ArrowRight size={22} />
        </div>
      </div>

      {/* Seats */}
      {philosophers.map((philosopher, index) => {
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        const isActive = activeAgent === index;
        const hasSpoken = interventions.some(
          (item) => item.pass_number === activePass + 1 && item.seat_position === index,
        );
        return (
          <button
            key={philosopher.slug}
            onClick={() => onSelect(philosopher)}
            className={`cabinet-seat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${isActive ? 'cabinet-seat-active' : ''} ${hasSpoken ? 'cabinet-seat-spoken' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center bg-[#f2ebd9] ${isActive ? 'speaker-glow border-[#cc5f68]' : 'border-[#4a392d]/35'}`}
              style={{ borderColor: isActive ? undefined : philosopher.accent_color }}
            >
              <span className="font-heading text-lg md:text-2xl" style={{ color: philosopher.accent_color }}>
                {philosopher.name.charAt(0)}
              </span>
            </span>
            <span className="font-heading text-xs md:text-sm text-[#4a392d] whitespace-nowrap">
              {philosopher.name}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#465f75]/55">
              Seat {index + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
