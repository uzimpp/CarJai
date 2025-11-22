// src/components/search/filterIcons.tsx
// Reusable icon components for fuel types and body types

import { ReactNode } from "react";

// Fuel Type Icons
export const FuelTypeIcons: Record<string, ReactNode> = {
  GASOLINE: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M20 13.277c0-4.525-4.59-8.481-6.81-10.136a2.004 2.004 0 0 0-2.38 0C8.59 4.796 4 8.752 4 13.277c0 5.98 5 7.973 8 7.973s8-1.993 8-7.973"></path>
        <path d="M7 13.277c0 1.322.527 2.59 1.464 3.524A5.009 5.009 0 0 0 12 18.26"></path>
      </g>
    </svg>
  ),
  DIESEL: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M5 6v-.5c0-.943 0-1.414.293-1.707S6.057 3.5 7 3.5s1.414 0 1.707.293S9 4.557 9 5.5V6m6-1h3" />
        <path d="M16 2h-1.333C12.793 2 12 2.934 12 4.667C12 5.533 11.603 6 10.667 6H7c-1.886 0-2.828 0-3.414.586S3 8.114 3 10v5c0 3.3 0 4.95 1.025 5.975S6.7 22 10 22h4c3.3 0 4.95 0 5.975-1.025S21 18.3 21 15V7c0-2.357 0-3.536-.732-4.268C19.535 2 18.357 2 16 2" />
        <path d="M9 14.587c0-1.464 1.264-2.911 2.15-3.747a1.23 1.23 0 0 1 1.7 0c.886.836 2.15 2.283 2.15 3.747a2.933 2.933 0 0 1-3 2.913c-1.864 0-3-1.477-3-2.913" />
      </g>
    </svg>
  ),
  HYBRID: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        fill="currentColor"
        d="M26 22a3.958 3.958 0 0 0-2.02.566L17.414 16l6.567-6.567A3.952 3.952 0 0 0 26 10a4 4 0 1 0-4-4a3.951 3.951 0 0 0 .567 2.019L16 14.586L9.434 8.02A3.958 3.958 0 0 0 10 6a4 4 0 1 0-4 4a3.958 3.958 0 0 0 2.02-.566L14.586 16l-6.567 6.567A3.952 3.952 0 0 0 6 22a4 4 0 1 0 4 4a3.951 3.951 0 0 0-.567-2.019L16 17.414l6.566 6.566A3.958 3.958 0 0 0 22 26a4 4 0 1 0 4-4Zm0-18a2 2 0 1 1-2 2a2.002 2.002 0 0 1 2-2ZM6 28a2 2 0 1 1 2-2a2.002 2.002 0 0 1-2 2Z"
      />
    </svg>
  ),
  ELECTRIC: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
        d="M13 2v8h7l-9 12v-8H4Z"
      />
    </svg>
  ),
  LPG: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M5 21c.5-4.5 2.5-8 7-10" />
        <path d="M9 18c6.218 0 10.5-3.288 11-12V4h-4.014c-9 0-11.986 4-12 9c0 1 0 3 2 5h3z" />
      </g>
    </svg>
  ),
  CNG: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M5 21c.5-4.5 2.5-8 7-10" />
        <path d="M9 18c6.218 0 10.5-3.288 11-12V4h-4.014c-9 0-11.986 4-12 9c0 1 0 3 2 5h3z" />
      </g>
    </svg>
  ),
};

// Body Type Icons
export const BodyTypeIcons: Record<string, ReactNode> = {
  CITYCAR: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 35"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M51.5,21.5 C51.5,23.985 49.485,26 47,26 C44.515,26 42.5,23.985 42.5,21.5 C42.5,19.015 44.515,17 47,17 C49.485,17 51.5,19.015 51.5,21.5 L51.5,21.5 Z" />
      <path d="M3,22 C3,17.582 6.582,14 11,14 C15.418,14 19,17.582 19,22" />
      <path d="M19,22 L39,22" />
      <path d="M39,22 C39,17.582 42.582,14 47,14 C51.418,14 55,17.582 55,22" />
      <path d="M15.5,21.5 C15.5,23.985 13.485,26 11,26 C8.515,26 6.5,23.985 6.5,21.5 C6.5,19.015 8.515,17 11,17 C13.485,17 15.5,19.015 15.5,21.5 L15.5,21.5 Z" />
      <path d="M55,22 L58,22" />
      <path d="M58,19 L58,22" />
      <path d="M3,22 L0,22" />
      <path d="M0,22 L0,19" />
      <path d="M1,19 L0,19" />
      <path d="M58,19 L57,19" />
      <path d="M57,11 L57,19" />
      <path d="M1,19 L1,14" />
      <path d="M1,14 C1,11.236 6.814,9 14,9" />
      <path d="M14,9 C18.292,3.583 25.781,-0.969 40,1" />
      <path d="M51,9 C48.792,5.167 46.063,2.063 40,1" />
      <path d="M51,9 L57,11" />
      <path d="M14,9 L51,9" />
      <path d="M32,1.0625 L32,9.0625" />
      <path d="M44.0625,2.4375 L44.0005,8.9995" />
      <path d="M1,14 L4,14" />
      <path d="M57,13 L54,13" />
    </svg>
  ),
  DAILY: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 35"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M51.5,21.5 C51.5,23.985 49.485,26 47,26 C44.515,26 42.5,23.985 42.5,21.5 C42.5,19.015 44.515,17 47,17 C49.485,17 51.5,19.015 51.5,21.5 L51.5,21.5 Z" />
      <path d="M3,22 C3,17.582 6.582,14 11,14 C15.418,14 19,17.582 19,22" />
      <path d="M19,22 L39,22" />
      <path d="M39,22 C39,17.582 42.582,14 47,14 C51.418,14 55,17.582 55,22" />
      <path d="M15.5,21.5 C15.5,23.985 13.485,26 11,26 C8.515,26 6.5,23.985 6.5,21.5 C6.5,19.015 8.515,17 11,17 C13.485,17 15.5,19.015 15.5,21.5 L15.5,21.5 Z" />
      <path d="M55,22 L58,22" />
      <path d="M58,19 L58,22" />
      <path d="M3,22 L0,22" />
      <path d="M0,22 L0,19" />
      <path d="M1,19 L0,19" />
      <path d="M58,19 L57,19" />
      <path d="M57,11 L57,19" />
      <path d="M1,19 L1,14" />
      <path d="M1,14 C1,11.236 6.814,9 14,9" />
      <path d="M14,9 C18.292,3.583 25.781,-0.969 40,1" />
      <path d="M51,9 C48.792,5.167 46.063,2.063 40,1" />
      <path d="M51,9 L57,11" />
      <path d="M14,9 L51,9" />
      <path d="M32,1.0625 L32,9.0625" />
      <path d="M44.0625,2.4375 L44.0005,8.9995" />
      <path d="M1,14 L4,14" />
      <path d="M57,13 L54,13" />
    </svg>
  ),
  SPORTLUX: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M52.5,17.5 C52.5,19.985 50.485,22 48,22 C45.515,22 43.5,19.985 43.5,17.5 C43.5,15.015 45.515,13 48,13 C50.485,13 52.5,15.015 52.5,17.5 L52.5,17.5 Z" />
      <path d="M40,18 C40,13.582 43.582,10 48,10 C52.418,10 56,13.582 56,18" />
      <path d="M18.5,17.5 C18.5,19.985 16.485,22 14,22 C11.515,22 9.5,19.985 9.5,17.5 C9.5,15.015 11.515,13 14,13 C16.485,13 18.5,15.015 18.5,17.5 L18.5,17.5 Z" />
      <path d="M6,18 C6,13.582 9.582,10 14,10 C18.418,10 22,13.582 22,18" />
      <path d="M6,18 L1,17" />
      <path d="M1,17 C-1.25,14.531 1,12 1,12" />
      <path d="M1,12 C2.75,9.562 7,5.583 16,6" />
      <path d="M25,0 L16,6" />
      <path d="M28,2 L25,0" />
      <path d="M22,6 L28,2" />
      <path d="M35,3 L34,6" />
      <path d="M43,5 L35,3" />
      <path d="M22,6 C22,6 27.625,7.687 34,6" />
      <path d="M43,5 C47.75,4.094 52.719,4.531 57,7" />
      <path d="M57,11 L57,7" />
      <path d="M58,11 C58,14.869 57.105,18 56,18" />
      <path d="M57,11 L58,11" />
      <path d="M22,18 L40,18" />
      <path d="M57,9 L54,9" />
      <path d="M3,10 L6,10" />
    </svg>
  ),
  SUV: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 33.75"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M50.5,20.5 C50.5,22.985 48.485,25 46,25 C43.515,25 41.5,22.985 41.5,20.5 C41.5,18.015 43.515,16 46,16 C48.485,16 50.5,18.015 50.5,20.5 L50.5,20.5 Z" />
      <path d="M38,21 C38,16.582 41.582,13 46,13 C50.418,13 54,16.582 54,21" />
      <path d="M16.5,20.5 C16.5,22.985 14.485,25 12,25 C9.515,25 7.5,22.985 7.5,20.5 C7.5,18.015 9.515,16 12,16 C14.485,16 16.5,18.015 16.5,20.5 L16.5,20.5 Z" />
      <path d="M4,21 C4,16.582 7.582,13 12,13 C16.418,13 20,16.582 20,21" />
      <path d="M4,21 L1,21" />
      <path d="M14,8 L1,9" />
      <path d="M1,21 C-1.083,13.458 1,9 1,9" />
      <path d="M14,8 L22,2" />
      <path d="M22,2 C22,2 28.062,-2.187 53,2" />
      <path d="M57,8 L57,13" />
      <path d="M54,21 L57,21" />
      <path d="M53,2 L57,8" />
      <path d="M57,21 C59.25,17 57,13 57,13" />
      <path d="M20,21 L38,21" />
      <path d="M14,8 L57,8" />
      <path d="M32,1 L32,8" />
      <path d="M40,1 L44,8" />
      <path d="M1,12 L3,12" />
      <path d="M57,11 L54,11" />
    </svg>
  ),
  VAN: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 37.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M49.5,23.5 C49.5,25.985 47.485,28 45,28 C42.515,28 40.5,25.985 40.5,23.5 C40.5,21.015 42.515,19 45,19 C47.485,19 49.5,21.015 49.5,23.5 L49.5,23.5 Z" />
      <path d="M37,24 C37,19.582 40.582,16 45,16 C49.418,16 53,19.582 53,24" />
      <path d="M17.5,23.5 C17.5,25.985 15.485,28 13,28 C10.515,28 8.5,25.985 8.5,23.5 C8.5,21.015 10.515,19 13,19 C15.485,19 17.5,21.015 17.5,23.5 L17.5,23.5 Z" />
      <path d="M5,24 C5,19.582 8.582,16 13,16 C17.418,16 21,19.582 21,24" />
      <path d="M21,24 L37,24" />
      <path d="M53,24 L57,24" />
      <path d="M57,22 L57,24" />
      <path d="M58,21 L57,22" />
      <path d="M58,19 L58,21" />
      <path d="M57,18 L58,19" />
      <path d="M57,0 L57,18" />
      <path d="M12,0 L57,0" />
      <path d="M5,10 L12,0" />
      <path d="M5,24 L1,24" />
      <path d="M1,22 L1,24" />
      <path d="M1,22 L0,21" />
      <path d="M0,19 L0,21" />
      <path d="M1,18 L0,19" />
      <path d="M1,18 C1.187,13.938 2.75,11.844 5,10" />
      <path d="M22,0 L22,10" />
      <path d="M5,10 L22,10" />
      <path d="M2,15 L5,15" />
      <path d="M57,15 L54,15" />
    </svg>
  ),
  PICKUP: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-8"
      viewBox="0 0 60 35"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M51.5,21.5 C51.5,23.985 49.485,26 47,26 C44.515,26 42.5,23.985 42.5,21.5 C42.5,19.015 44.515,17 47,17 C49.485,17 51.5,19.015 51.5,21.5 L51.5,21.5 Z" />
      <path d="M39,22 C39,17.582 42.582,14 47,14 C51.418,14 55,17.582 55,22" />
      <path d="M17.5,21.5 C17.5,23.985 15.485,26 13,26 C10.515,26 8.5,23.985 8.5,21.5 C8.5,19.015 10.515,17 13,17 C15.485,17 17.5,19.015 17.5,21.5 L17.5,21.5 Z" />
      <path d="M5,22 C5,17.582 8.582,14 13,14 C17.418,14 21,17.582 21,22" />
      <path d="M55,22 L57,22" />
      <path d="M58,21 L57,22" />
      <path d="M58,17 L58,21" />
      <path d="M57,16 L58,17" />
      <path d="M57,9 L57,16" />
      <path d="M40,9 L57,9" />
      <path d="M39,9 L39,0.022" />
      <path d="M21,22 L39,22" />
      <path d="M5,22 L1,22" />
      <path d="M1,20 L1,22" />
      <path d="M0,19 L1,20" />
      <path d="M0,17 L0,19" />
      <path d="M1,16 L0,17" />
      <path d="M1,16 C1,12.131 7.262,9 15,9" />
      <path d="M13,9 C18.917,2.042 22.125,-0.103 39,0.022" />
      <path d="M15,9 L40,9" />
      <path d="M29,1 L29,9" />
      <path d="M3,13 L7,13" />
      <path d="M57,13 L54,13" />
    </svg>
  ),
};

// Transmission Icons
export const TransmissionIcons: Record<string, ReactNode> = {
  AT: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 6v12M6 12h12" />
      </g>
    </svg>
  ),
  MANUAL: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 6h8M8 12h8M8 18h8" />
        <circle cx="6" cy="6" r="1" />
        <circle cx="18" cy="6" r="1" />
        <circle cx="6" cy="12" r="1" />
        <circle cx="18" cy="12" r="1" />
        <circle cx="6" cy="18" r="1" />
        <circle cx="18" cy="18" r="1" />
      </g>
    </svg>
  ),
};

// Drivetrain Icons
export const DrivetrainIcons: Record<string, ReactNode> = {
  FWD: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M12 2L2 12l10 10 10-10L12 2z" />
        <path d="M12 6v12M6 12h12" />
        <circle cx="12" cy="8" r="1.5" />
      </g>
    </svg>
  ),
  RWD: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M12 22L2 12l10-10 10 10-10 10z" />
        <path d="M12 18v-12M18 12H6" />
        <circle cx="12" cy="16" r="1.5" />
      </g>
    </svg>
  ),
  AWD: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
        <path d="M7 7l10 10M17 7L7 17" />
        <circle cx="12" cy="4" r="1" />
        <circle cx="12" cy="20" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="20" cy="12" r="1" />
      </g>
    </svg>
  ),
  "4WD": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
        <circle cx="12" cy="7" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="17" r="1" />
      </g>
    </svg>
  ),
};
