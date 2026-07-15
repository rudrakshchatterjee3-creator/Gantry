// Mark: a floodlight gantry tower reads as a negative-space "G" — the
// crossbar + splayed lamp struts trace the letterform while staying literally
// true to a stadium lighting rig. Two-tone: structure in floodlight-white,
// the single lit lamp in broadcast-cyan (the app's one non-severity accent).
export function GantryMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M24 4L24 44"
        stroke="#EDF1F3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M24 44C13.5 44 6 36.5 6 26C6 17 12 9 24 9"
        stroke="#EDF1F3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M24 15L38 8" stroke="#EDF1F3" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 24L42 24" stroke="#EDF1F3" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 33L38 40" stroke="#EDF1F3" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="40" cy="24" r="4.5" fill="#2DD4E8" />
      <circle cx="40" cy="24" r="8" fill="#2DD4E8" fillOpacity="0.18" />
    </svg>
  );
}

export function GantryLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <GantryMark className="h-8 w-8 shrink-0" />
      <span className="font-display text-xl font-bold uppercase tracking-wide text-floodlight">
        Gantry
      </span>
    </div>
  );
}
