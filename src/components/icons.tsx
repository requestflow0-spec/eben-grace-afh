import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 8.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5" />
      <path d="M22 6.5l-2-2-8 8-8-8-2 2" />
      <path d="M12 22V8" />
      <path d="M7 13h10" />
      <path d="M12 8v-2" />
    </svg>
  );
}
