// Узнаваемые монохромные иконки соцсетей/контактов (currentColor).
export default function BrandIcon({ type, size = 18 }: { type: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "telegram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.9 4.3 18.7 19.4c-.24 1.06-.87 1.32-1.76.82l-4.86-3.58-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.94 9-8.13c.39-.35-.09-.54-.6-.2L4.83 13.2l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.55L20.55 2.8c.87-.32 1.63.2 1.35 1.5Z" transform="translate(1 0)" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.24.68-1.4 1.3-1.94 1.34-.5.04-1.1.2-3.7-.78-3.1-1.2-5.06-4.3-5.22-4.5-.15-.2-1.24-1.65-1.24-3.15 0-1.5.78-2.24 1.06-2.55.28-.3.6-.38.8-.38h.58c.19 0 .43-.03.66.5.24.58.82 2 .9 2.14.07.14.12.3.02.5-.1.2-.15.32-.3.5-.15.17-.32.38-.45.51-.15.15-.3.3-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.3 2.36 1.45.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 2 .95.28.15.47.22.54.35.07.13.07.76-.17 1.44Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.76-1.77C19.3 5.1 12 5.1 12 5.1s-7.3 0-8.84.42A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.76 1.77c1.54.43 8.84.43 8.84.43s7.3 0 8.84-.43a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 3c.3 2.2 1.6 3.7 3.8 3.9v2.6c-1.3.1-2.5-.3-3.8-1v5.6c0 3.5-2.6 5.9-5.9 5.9A5.6 5.6 0 0 1 5 14.4c.1-2.9 2.5-5.2 5.7-5v2.8c-.5-.15-1-.2-1.5-.1-1.2.2-2.1 1.2-2 2.5.1 1.3 1.1 2.2 2.4 2.1 1.4-.1 2.3-1.1 2.3-2.6V3h2.6Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 9h2.5l.5-3H14V4.2c0-.8.3-1.2 1.4-1.2H17V.2C16.7.1 15.7 0 14.6 0 12.2 0 11 1.3 11 3.9V6H8.5v3H11v9h3V9Z" transform="translate(0 3)" />
        </svg>
      );
    case "website":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 6h-3A15 15 0 0 1 4 7V4Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
        </svg>
      );
  }
}
