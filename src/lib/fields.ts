// Гибкие поля анкеты под профессию. Значения хранятся в specialists.attributes (jsonb).

export type FieldType = "text" | "number" | "bool" | "select";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  suffix?: string;
  placeholder?: string;
}

export const PROFESSION_FIELDS: Record<string, FieldDef[]> = {
  nanny: [
    { key: "age", label: "Возраст", type: "number", suffix: "лет" },
    { key: "education", label: "Образование", type: "text", placeholder: "педагог / мед. образование" },
    { key: "medbook", label: "Медкнижка", type: "bool" },
    { key: "kids_age", label: "Возраст детей", type: "select", options: ["до 3 лет", "3–7 лет", "школьники", "любой"] },
  ],
  housekeeper: [
    { key: "age", label: "Возраст", type: "number", suffix: "лет" },
    { key: "live_in", label: "С проживанием", type: "bool" },
    { key: "frequency", label: "Формат", type: "select", options: ["разово", "регулярно", "и так, и так"] },
  ],
  driver: [
    { key: "car", label: "Авто", type: "text", placeholder: "Mercedes Vito" },
    { key: "seats", label: "Мест", type: "number", suffix: "мест" },
    { key: "license", label: "Категория прав", type: "text", placeholder: "B, D" },
    { key: "child_seat", label: "Детское кресло", type: "bool" },
  ],
  cook: [
    { key: "cuisine", label: "Кухня", type: "text", placeholder: "казахская, узбекская" },
    { key: "portions", label: "До скольких порций", type: "number", suffix: "порций" },
    { key: "own_cauldron", label: "Свой казан/оборудование", type: "bool" },
  ],
  visagiste: [
    { key: "home_visit", label: "Выезд на дом", type: "bool" },
    { key: "trial", label: "Пробный образ", type: "bool" },
  ],
};

export function fieldsFor(profession: string): FieldDef[] {
  return PROFESSION_FIELDS[profession] ?? [];
}

// Человекочитаемое значение атрибута для показа в анкете (t — переводчик, опционально)
export function formatAttr(f: FieldDef, value: unknown, t: (s: string) => string = (s) => s): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (f.type === "bool") return value ? t("да") : null; // false/пусто не показываем
  if (f.type === "number") return `${value}${f.suffix ? " " + t(f.suffix) : ""}`;
  return String(value);
}
