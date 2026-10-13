// the dot and slash mark from the favicon
const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#FF7A21" />
    <circle cx="10.5" cy="16.5" r="2.6" fill="#fff" />
    <path d="M20.5 13.5 16 21" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export default Logo;
