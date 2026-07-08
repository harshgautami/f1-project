import React from "react";

/* Lightweight inline SVG icons (stroke = currentColor via .icon). Keeps the
   bundle free of an icon library while giving the UI crisp, consistent marks. */

const Svg = ({ children, ...props }) => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const IconFlag = (p) => (
  <Svg {...p}>
    <path d="M4 21V4M4 4c4-2 8 2 12 0v9c-4 2-8-2-12 0" />
  </Svg>
);
export const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  </Svg>
);
export const IconHelmet = (p) => (
  <Svg {...p}>
    <path d="M3 13a9 9 0 0 1 18 0v2H3v-2Z" />
    <path d="M3 15h18M8 11h8" />
  </Svg>
);
export const IconCar = (p) => (
  <Svg {...p}>
    <path d="M3 12h18M5 12l2-4h10l2 4M6 16h.01M18 16h.01" />
    <path d="M3 16h18v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z" />
  </Svg>
);
export const IconUsers = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
  </Svg>
);
export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M3 3v18h18M8 15v3M13 10v8M18 6v12" />
  </Svg>
);
export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);
export const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Svg>
);
export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
  </Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);
export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
);
export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
export const IconPin = (p) => (
  <Svg {...p}>
    <path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
