/**
 * Inline SVG icons. All are decorative (aria-hidden) – the owning button
 * supplies the accessible name. Replaces the 10 separate <img src="*.svg">
 * requests of v1 (and fixes the swapped play/pause artwork).
 */
function Icon({ size = 24, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p) => (
  <Icon {...p}>
    <path d="M8 5v14l11-7z" />
  </Icon>
);

export const PauseIcon = (p) => (
  <Icon {...p}>
    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
  </Icon>
);

export const NextIcon = (p) => (
  <Icon {...p}>
    <path d="M16 6v12h-2V6h2zm-3.5 6L4 6v12l8.5-6z" />
  </Icon>
);

export const PrevIcon = (p) => (
  <Icon {...p}>
    <path d="M6 18V6h2v12H6zm3.5-6 8.5 6V6l-8.5 6z" />
  </Icon>
);

export const ShuffleIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Icon>
);

export const RepeatIcon = (p) => (
  <Icon {...p}>
    <path d="M17 1l4 4-4 4V6H7a3 3 0 0 0-3 3v2H2V9a5 5 0 0 1 5-5h10V1zm-10 22l-4-4 4-4v3h10a3 3 0 0 0 3-3v-2h2v2a5 5 0 0 1-5 5H7v3z" />
  </Icon>
);

export const RepeatOneIcon = (p) => (
  <Icon {...p}>
    <path d="M17 1l4 4-4 4V6H7a3 3 0 0 0-3 3v2H2V9a5 5 0 0 1 5-5h10V1zm-10 22l-4-4 4-4v3h10a3 3 0 0 0 3-3v-2h2v2a5 5 0 0 1-5 5H7v3z" />
    <path d="M12.5 15h-1.2v-4.6l-1.3.4V9.9l2.3-.8h.2V15z" />
  </Icon>
);

export const VolumeIcon = (p) => (
  <Icon {...p}>
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z" />
  </Icon>
);

export const VolumeMuteIcon = (p) => (
  <Icon {...p}>
    <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0a7 7 0 0 1-.87 3.36l1.52 1.52A9 9 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.9 6.9 0 0 1 14 18.7v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
  </Icon>
);

/** Mini Loop – a looping arrow around a small note */
export const MiniLoopIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12a8 8 0 0 1 13.66-5.66" />
    <path d="M20 12a8 8 0 0 1-13.66 5.66" />
    <polyline points="17 2 18 6.5 13.5 7" />
    <polyline points="7 22 6 17.5 10.5 17" />
    <circle cx="10.5" cy="13.5" r="1.5" fill="currentColor" />
    <path d="M12 13.5V9l3-1" />
  </Icon>
);

export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6h4v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732z" />
  </Icon>
);

export const CloseIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const CheckIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5L20 7" />
  </Icon>
);

export const SunIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
);

export const MoonIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Icon>
);

export const LeafIcon = (p) => (
  <Icon {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20c0-9 5-14 16-16-1 11-6 16-14 16" />
    <path d="M4 20c3-5 7-9 12-12" />
  </Icon>
);

export const MusicNoteIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </Icon>
);

export const WarningIcon = (p) => (
  <Icon {...p}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </Icon>
);

/** Vector version of the BeatNest mark: headphones around a note. */
export const LogoMark = ({ size = 32, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
    <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="4" />
    <path d="M14 30a18 18 0 0 1 36 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <rect x="9" y="28" width="9" height="14" rx="3.5" fill="currentColor" />
    <rect x="46" y="28" width="9" height="14" rx="3.5" fill="currentColor" />
    <path
      d="M34 20v15.5a4.5 4.5 0 1 0 3 4.2V26l6-1.6v6a4.5 4.5 0 1 0 3 4.2V18l-12 3z"
      fill="currentColor"
    />
    <path d="M22 36v4M25.5 33v7M29 35v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
