import BrandIcon from "@/components/BrandIcon";
import { SOCIAL_META, socialHref, type Social } from "@/lib/types";

export default function SocialLinks({ socials, locked }: { socials: Social[]; locked?: boolean }) {
  if (socials.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {socials.map((s) => {
        const meta = SOCIAL_META[s.type] ?? { label: s.type };
        return (
          <a
            key={s.id}
            href={socialHref(s.type, s.value)}
            target="_blank"
            rel="noreferrer"
            className="chip"
            style={{ cursor: "pointer", gap: 8 }}
          >
            <BrandIcon type={s.type} size={16} /> {meta.label}
            {locked && <span title="Открыто после подтверждения"> 🔓</span>}
          </a>
        );
      })}
    </div>
  );
}
