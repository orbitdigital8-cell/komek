// ---- Доменные типы платформы «Подбор» ----

export type Role = "client" | "specialist" | "admin";

export type Segment = "toi" | "general";

export interface Profession {
  id: string;
  label: string;
  label_kk?: string;
  emoji: string;
  category: string;
  segment: Segment;
  sort_order: number;
}

export const SEGMENT_LABEL: Record<Segment, string> = {
  toi: "Для тоя и праздника",
  general: "Бытовые услуги",
};

export interface Specialist {
  id: string;
  owner_id: string | null;
  profession: string;
  name: string;
  city: string;
  tagline: string;
  about: string;
  price_from: number | null;
  experience_years: number;
  avatar_url: string;
  video_url: string;
  work_link: string;
  gallery: string[];
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  rating: number;
  review_count: number;
  verified: boolean;
  published: boolean;
  is_demo: boolean;
  created_at: string;
  response_minutes: number | null;
  response_count: number;
  tagline_kk: string;
  about_kk: string;
}

// Быстро отвечает: среднее время ответа ≤ 60 минут при ≥ 3 ответах
export function isFastResponder(s: Pick<Specialist, "response_minutes" | "response_count">): boolean {
  return s.response_minutes != null && s.response_minutes <= 60 && s.response_count >= 3;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// Ссылка WhatsApp с готовым текстом
export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export interface Social {
  id: string;
  specialist_id: string;
  type: string;
  value: string;
  is_public: boolean;
  sort_order: number;
}

export const SOCIAL_META: Record<string, { label: string; icon: string; base: string }> = {
  instagram: { label: "Instagram", icon: "📷", base: "https://instagram.com/" },
  tiktok: { label: "TikTok", icon: "🎵", base: "https://tiktok.com/@" },
  youtube: { label: "YouTube", icon: "▶️", base: "https://youtube.com/@" },
  facebook: { label: "Facebook", icon: "👥", base: "https://facebook.com/" },
  website: { label: "Сайт", icon: "🔗", base: "" },
};

export const SOCIAL_ORDER = ["instagram", "tiktok", "youtube", "facebook", "website"];

// Ссылка соцсети: если value уже URL — используем как есть, иначе клеим к базе
export function socialHref(type: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = SOCIAL_META[type]?.base ?? "";
  return base + value.replace(/^@/, "");
}

export interface Review {
  id: string;
  specialist_id: string;
  client_id: string;
  author_name: string;
  rating: number;
  text: string;
  photos: string[];
  created_at: string;
}

// ---- Биржа открытых заявок --------------------------------------------------
export interface OpenRequest {
  id: string;
  client_id: string | null;
  client_name: string;
  professions: string[];
  city: string;
  event_date: string | null;
  budget: number | null;
  details: string;
  status: "open" | "closed";
  is_demo: boolean;
  created_at: string;
}

export interface OpenRequestBid {
  id: string;
  request_id: string;
  specialist_id: string;
  price: number | null;
  message: string;
  created_at: string;
}

// ---- Пакеты услуг -----------------------------------------------------------
export interface SpecialistPackage {
  id: string;
  specialist_id: string;
  name: string;
  price: number;
  description: string;
  sort_order: number;
}

// ---- Портфолио-кейсы --------------------------------------------------------
export interface PortfolioCase {
  id: string;
  specialist_id: string;
  title: string;
  description: string;
  photos: string[];
  videos: string[];
  event_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface SpecialistContacts {
  specialist_id: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  telegram: string;
}

export interface BusyDate {
  specialist_id: string;
  busy_date: string; // YYYY-MM-DD
  note: string;
}

// «15 августа», «15 авг. 2026» и т.п.
export function formatDate(d: string, withYear = false): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  if (withYear) opts.year = "numeric";
  return new Date(d + "T00:00:00").toLocaleDateString("ru-RU", opts);
}

export type RequestStatus = "pending" | "accepted" | "declined" | "booked" | "completed" | "cancelled";

export interface ContactRequest {
  id: string;
  specialist_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  event_date: string | null;
  message: string;
  status: RequestStatus;
  created_at: string;
}

// Запрос, обогащённый анкетой специалиста (для кабинета заказчика)
export interface RequestWithSpecialist extends ContactRequest {
  specialist: Specialist | null;
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Ожидает ответа",
  accepted: "Контакт открыт",
  declined: "Отклонён",
  booked: "Забронирован",
  completed: "Завершён",
  cancelled: "Отменён",
};

// CSS-класс бейджа по статусу
export const STATUS_BADGE: Record<RequestStatus, string> = {
  pending: "badge-pending",
  accepted: "badge-accepted",
  declined: "badge-declined",
  booked: "badge-booked",
  completed: "badge-completed",
  cancelled: "badge-mute",
};

// Форматирование цены «от N ₸»
export function priceLabel(price: number | null): string {
  if (!price) return "Договорная";
  return `от ${price.toLocaleString("ru-RU")} ₸`;
}
