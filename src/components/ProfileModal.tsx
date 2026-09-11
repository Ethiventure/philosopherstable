import { X } from 'lucide-react';
import type { Philosopher } from '@/types';

interface ProfileModalProps {
  philosopher: Philosopher;
  onClose: () => void;
}

export function ProfileModal({ philosopher, onClose }: ProfileModalProps) {
  const profile = philosopher.profile;
  const baseKeys = [
    'identity', 'ontology', 'epistemology', 'conception_of_human_subject',
    'conception_of_society', 'conception_of_power', 'conception_of_freedom',
    'theory_of_social_change', 'conception_of_technology',
    'rhetorical_style', 'what_he_sees_well', 'what_he_overlooks',
  ];
  const hiddenKeys = new Set(['reasoning', 'self_review', 'meta_fix', 'style', 'historical_boundary']);
  const altKey = (key: string) =>
    key.startsWith('what_he_') ? key.replace('what_he_', 'what_she_')
    : key.startsWith('what_she_') ? key.replace('what_she_', 'what_he_') : null;
  const rows: { label: string; value: unknown }[] = [];
  const consumed = new Set<string>();
  for (const key of baseKeys) {
    const alt = altKey(key);
    const value = profile[key] !== undefined ? profile[key] : alt ? profile[alt] : undefined;
    if (value === undefined) continue;
    const labelKey = profile[key] !== undefined ? key : (alt ?? key);
    rows.push({ label: labelKey.replace(/_/g, ' '), value });
    consumed.add(key);
    if (alt) consumed.add(alt);
  }
  for (const key of Object.keys(profile)) {
    if (consumed.has(key) || hiddenKeys.has(key)) continue;
    rows.push({ label: key.replace(/_/g, ' '), value: profile[key] });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="dark-academia-card max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between gap-4 mb-6">
          <div>
            <p className="pass-indicator text-[#8b5254]">
              Seat {philosopher.seat_order + 1} · intellectual profile
            </p>
            <h2 className="text-4xl">{philosopher.full_name}</h2>
            <p className="italic text-[#465f75]/70">
              {philosopher.birth_year} — {philosopher.death_year}
            </p>
          </div>
          <button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {philosopher.analytical_center.map((item) => (
            <span key={item} className="citation-badge">{item}</span>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {rows.map((row) => {
            return (
              <div key={row.label} className="border-t border-[#4a392d]/15 pt-3">
                <p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">
                  {row.label}
                </p>
                <p className="text-[15px] leading-relaxed text-[#465f75]/85">
                  {Array.isArray(row.value) ? row.value.join(' · ') : String(row.value ?? '')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
