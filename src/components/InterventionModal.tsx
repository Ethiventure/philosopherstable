import { X, BookOpen } from 'lucide-react';
import type { Intervention, Philosopher } from '@/types';
import { PASS_NAMES } from '@/types';

interface InterventionModalProps {
  intervention: Intervention;
  philosopher?: Philosopher;
  onClose: () => void;
}

export function InterventionModal({ intervention, philosopher, onClose }: InterventionModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="dark-academia-card max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between gap-4">
          <div>
            <p className="pass-indicator text-[#8b5254]">
              Pass {intervention.pass_number} · {PASS_NAMES[intervention.pass_number - 1]}
            </p>
            <h2 className="text-3xl">{philosopher?.full_name}</h2>
            <p className="italic text-[#465f75]/65">{intervention.position_label}</p>
          </div>
          <button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button>
        </div>
        <p className="drop-cap text-lg leading-relaxed mt-6 whitespace-pre-line text-[#465f75]">
          {intervention.response_text}
        </p>
        <div className="mt-7 border-t border-[#4a392d]/20 pt-5">
          <p className="font-heading text-xl text-[#4a392d] mb-3">Source status</p>
          {intervention.citations.map((citation) => (
            <div key={citation.label} className="p-3 bg-[#eae1ca]/60 border border-[#4a392d]/15 mb-2">
              <span className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}>
                <BookOpen size={11} /> {citation.label}
              </span>
              <p className="text-xs italic mt-2 text-[#465f75]/65">
                {citation.verified
                  ? 'Retrieved or verified source reference.'
                  : 'Profile-grounded interpretation; underlying passage requires corpus retrieval.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
