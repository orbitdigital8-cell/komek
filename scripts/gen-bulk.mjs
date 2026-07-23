// Генератор массовых демо-анкет (1500) для Kömek. Пишет supabase/seed_bulk.sql.
import { randomUUID } from "crypto";
import { writeFileSync } from "fs";

const N = 600;
const R = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[R(a.length)];
const chance = (p) => Math.random() < p;
const pickN = (a, n) => { const s = new Set(); const k = Math.min(n, a.length); while (s.size < k) s.add(pick(a)); return [...s]; };
const money = (min, max, step) => (min + R(Math.floor((max - min) / step) + 1) * step);
const esc = (s) => String(s).replace(/'/g, "''");

const cities = ["Алматы","Астана","Шымкент","Караганда","Актобе","Тараз","Павлодар","Усть-Каменогорск","Семей","Атырау","Костанай","Кызылорда","Уральск","Петропавловск","Актау","Темиртау","Туркестан","Кокшетау"];
const cityWeights = ["Алматы","Алматы","Алматы","Астана","Астана","Астана","Шымкент","Шымкент","Караганда","Актобе","Тараз","Павлодар"]; // крупные чаще

const kzM = ["Ерлан","Нурлан","Дулат","Азамат","Аскар","Данияр","Тимур","Ержан","Бекзат","Арман","Санжар","Дамир","Мадияр","Алибек","Нуржан","Ансар","Улан","Дастан","Кайрат","Мурат","Серик","Айдар","Бауыржан","Жанибек","Ерасыл","Абылай","Диас","Медет","Ринат","Сакен"];
const kzF = ["Айгерим","Аружан","Динара","Гульнар","Меруерт","Асель","Жанна","Айнур","Камила","Балжан","Сауле","Гаухар","Айгуль","Толкын","Назерке","Аяулым","Дана","Жулдыз","Мадина","Алия","Айым","Ботагоз","Индира","Карина","Лаура","Нургуль","Сабина","Томирис","Улжан","Жанель"];
const ruM = ["Дмитрий","Александр","Сергей","Андрей","Максим","Иван","Артём","Никита","Роман","Владимир","Егор","Павел","Денис","Кирилл","Антон","Виктор","Олег","Григорий"];
const ruF = ["Анна","Мария","Елена","Ольга","Наталья","Ирина","Екатерина","Юлия","Виктория","Дарья","Ксения","Полина","Алина","Валерия","Марина","Светлана"];
const kzRoots = ["Сапар","Асан","Ахмет","Оспан","Кенже","Серик","Жумабек","Ибрагим","Досжан","Мукаш","Сагын","Байжан","Ержан","Карим","Султан","Нуркен","Тлеу","Алдияр","Бектур","Есим"];
const ruRoots = ["Иван","Петр","Смирн","Кузнец","Сокол","Козл","Новик","Мороз","Волк","Зайц","Павл","Голуб","Виноград","Соловь"];
const words = ["Астра","Мираж","Луна","Фаворит","Империя","Гранд","Феерия","Магия","Салют","Ритм","Гармония","Престиж","Виктория","Джаз","Соло","Аура","Бриз","Космос","Атмосфера","Сатурн","Феникс","Оазис","Эдем","Карнавал","Фиеста","Тойхан","Мерей","Шаттык","Куаныш","Балауса"];

function personName(female) {
  const kz = chance(0.62);
  const first = kz ? (female ? pick(kzF) : pick(kzM)) : (female ? pick(ruF) : pick(ruM));
  const root = kz ? pick(kzRoots) : pick(ruRoots);
  const last = root + (female ? "ова" : "ов");
  return `${first} ${last}`;
}
const phone = () => `+7 7${R(9)}${R(9)} ${100 + R(900)} ${10 + R(90)} ${10 + R(90)}`;
const handle = () => pick(["star","pro","kz","show","top","best","event","art","vip","official"]) + "_" + pick(words).toLowerCase().replace(/[^a-zа-я]/g, "") + R(99);

// Рабочие нейтральные mp4-заглушки (200 video/mp4). Без мультиков.
// По-настоящему тематические видео — через Pexels/Pixabay API (нужен ключ).
const VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
];

// Конфиг профессий: сегмент, доля женщин, компания?, цена [min,max,step], видео%, соцсети {ig,tt,yt}, теги, тэглайны, фрагменты «о себе»
const P = {
  organizer:   { f:.5, comp:.6, price:[150000,400000,25000], vid:.2, s:{ig:.7,tt:.3,yt:.2}, tags:["под ключ","координация","смета","площадки","декор включён","тайминг"], tl:["Организация тоя под ключ","Свадьбы и корпоративы под ключ","Ивент-агентство полного цикла"], ab:["Возьмём весь той на себя: площадка, артисты, декор, тайминг.","Прозрачная смета и координация в день события.","Более сотни проведённых мероприятий."] },
  tamada:      { f:.4, comp:.05, price:[80000,250000,10000], vid:.55, s:{ig:.8,tt:.55,yt:.3}, tags:["на казахском","на двух языках","живой юмор","современные конкурсы","узату той","беташар","своя команда"], tl:["Тамада на двух языках","Асаба для тоя любой сложности","Ведущий свадеб и юбилеев"], ab:["Веду тои, свадьбы и юбилеи ярко и по-современному.","Авторские сценарии под каждого клиента.","Работаю в связке со своими музыкантами."] },
  host:        { f:.45, comp:.05, price:[100000,220000,10000], vid:.4, s:{ig:.8,tt:.4,yt:.2}, tags:["корпоративы","на русском","премии","презентации","конференции"], tl:["Ведущий корпоративов и презентаций","Шоумен для мероприятий","Ведущий премий и открытий"], ab:["Корпоративы, открытия, конференции, премии.","Чёткий тайминг, стиль и уместный юмор.","Опыт работы с крупными брендами."] },
  singer:      { f:.55, comp:.1, price:[60000,150000,5000], vid:.5, s:{ig:.8,tt:.6,yt:.4}, tags:["живой вокал","казахский","русский","эстрада","кавер","под минус"], tl:["Живой вокал: эстрада и кавер","Певец на той и свадьбу","Вокалист — живое выступление"], ab:["Пою вживую под минус или с музыкантами.","Репертуар на казахском, русском, турецком.","Возможен дуэт и сольная программа."] },
  dancer:      { f:.7, comp:.15, price:[50000,120000,5000], vid:.5, s:{ig:.85,tt:.7,yt:.3}, tags:["восточные танцы","современные","костюмы включены","национальные","шоу-номер"], tl:["Танцор — яркий номер на той","Шоу-балет для праздника","Танцевальное шоу"], ab:["Восточные, современные и национальные номера.","Костюмы и постановка включены.","Украсим любой той эффектным шоу."] },
  dance_group: { f:.6, comp:.85, price:[90000,200000,10000], vid:.55, s:{ig:.85,tt:.75,yt:.4}, tags:["национальные","уличные","современные","8 артистов","готовые постановки"], tl:["Танцевальный коллектив","Шоу-балет — команда артистов","Ансамбль для тоя"], ab:["Национальные, современные и уличные направления.","Готовые постановки под ваш той.","Своя постановщица, костюмы включены."] },
  animator:    { f:.6, comp:.2, price:[25000,60000,5000], vid:.4, s:{ig:.8,tt:.6,yt:.3}, tags:["аквагрим","шоу пузырей","супергерои","принцессы","научное шоу","детский праздник"], tl:["Аниматоры для детских праздников","Детский праздник под ключ","Аниматор и шоу для детей"], ab:["Более 30 персонажей: супергерои, принцессы, роботы.","Шоу мыльных пузырей, аквагрим, научное шоу.","Работаем командой, реквизит наш."] },
  musician:    { f:.35, comp:.25, price:[60000,140000,5000], vid:.4, s:{ig:.7,tt:.4,yt:.4}, tags:["домбра","скрипка","саксофон","национальные","инструментал","живая музыка"], tl:["Живая музыка на той","Музыкант: домбра и скрипка","Инструментальное сопровождение"], ab:["Инструментальное сопровождение тоя и встречи гостей.","Национальные и эстрадные композиции.","Возможен дуэт или трио."] },
  showman:     { f:.3, comp:.7, price:[100000,250000,10000], vid:.5, s:{ig:.8,tt:.6,yt:.3}, tags:["фаер-шоу","лазерное шоу","пиротехника","световые костюмы","ростовые куклы"], tl:["Шоу-программа для тоя","Фаер- и лазер-шоу","Эффектное шоу на праздник"], ab:["Пиротехника, световые костюмы, огненные номера.","Безопасно на улице и в помещении.","Эффектный старт или финал праздника."] },
  pyro:        { f:.2, comp:.4, price:[60000,150000,5000], vid:.5, s:{ig:.5,tt:.3,yt:.2}, tags:["холодные фонтаны","салют","тяжёлый дым","фейерверк","разрешения есть"], tl:["Салют, фейерверк и фонтаны","Пиротехника для тоя","Салют KZ"], ab:["Салют в финале, холодные фонтаны на выход молодых.","Тяжёлый дым и спецэффекты.","Все разрешения и техника безопасности."] },
  sound:       { f:.15, comp:.5, price:[80000,200000,10000], vid:.15, s:{ig:.5,tt:.2,yt:.1}, tags:["своё оборудование","свет","выезд по области","колонки","микрофоны"], tl:["Звук и свет под ключ","Звукорежиссёр на площадку","Аппаратура и свет"], ab:["Профессиональный аппарат: колонки, микрофоны, свет.","Выезд по области, настройка и сопровождение.","Работаю с любым ведущим и диджеем."] },
  photographer:{ f:.5, comp:.1, price:[50000,150000,5000], vid:.2, s:{ig:.9,tt:.35,yt:.3}, tags:["своя студия","свадебный","выезд на природу","репортаж","семейный"], tl:["Свадебный и семейный фотограф","Фотограф на той и love story","Репортажная съёмка"], ab:["Репортаж и постановка, 300+ обработанных кадров.","Есть студия и выезд на природу.","Фотокнига в подарок."] },
  videographer:{ f:.3, comp:.15, price:[80000,200000,10000], vid:.6, s:{ig:.9,tt:.4,yt:.5}, tags:["дрон","стедикам","love story","клип","фильм дня"], tl:["Видеограф: клипы и love story","Видеосъёмка тоя","Клип и фильм дня"], ab:["Съёмка на два оператора, дрон, стедикам.","Монтаж клипа за 2 недели.","Полный фильм дня по запросу."] },
  photobooth:  { f:.4, comp:.7, price:[50000,100000,5000], vid:.4, s:{ig:.8,tt:.6,yt:.2}, tags:["печать фото","360 видео","реквизит","брендирование","моментальная печать"], tl:["Фотобудка и 360-платформа","Фотозона с печатью","PhotoBox 360"], ab:["Моментальная печать фото гостям на память.","Видео 360°, реквизит и оформление зоны.","Брендированные снимки под ваш той."] },
  decorator:   { f:.65, comp:.6, price:[120000,350000,10000], vid:.2, s:{ig:.85,tt:.4,yt:.2}, tags:["фотозоны","живые цветы","арки","президиум","оформление шаров"], tl:["Оформление и флористика","Декор мероприятий","Студия декора"], ab:["Арки, президиумы, фотозоны, живые цветы.","Концепция под цвет и тематику.","Монтаж и демонтаж наши."] },
  visagiste:   { f:.92, comp:.1, price:[20000,60000,2500], vid:.2, s:{ig:.9,tt:.6,yt:.2}, tags:["свадебный макияж","укладка","выезд","вечерний образ","пробный образ"], tl:["Визажист и стилист по причёскам","Свадебный макияж и укладки","Образ на той и узату"], ab:["Свадебный и вечерний макияж, укладки, образ.","Выезд к вам утром, стойкий макияж на весь день.","Пробный образ по желанию."] },
  cake:        { f:.8, comp:.3, price:[15000,45000,2500], vid:.15, s:{ig:.85,tt:.5,yt:.15}, tags:["той-торт","капкейки","кэнди-бар","на заказ","доставка"], tl:["Той-торты и капкейки на заказ","Кондитер: торты для тоя","Сладкий стол и торты"], ab:["Многоярусные той-торты, капкейки, кэнди-бар.","Натуральные ингредиенты, дизайн под тематику.","Доставка по городу в день события."] },
  nanny:       { f:.95, comp:.02, price:[8000,25000,1000], vid:.05, s:{ig:.2,tt:.1,yt:.05}, tags:["с медкнижкой","игры и творчество","опыт 10 лет","безопасность","до 3 лет"], tl:["Няня-аниматор на время торжества","Няня на мероприятие","Присмотр за детьми"], ab:["Присмотрю за детьми, пока взрослые празднуют.","Игры, творчество, безопасность.","Мед. книжка, опыт в детском саду."] },
  housekeeper: { f:.9, comp:.02, price:[8000,20000,1000], vid:.02, s:{ig:.15,tt:.05,yt:.02}, tags:["генеральная уборка","глажка","помощь на кухне","до и после тоя","аккуратно"], tl:["Домработница: уборка до и после тоя","Помощь по дому к торжеству","Генеральная уборка"], ab:["Помогу подготовить дом к приёму гостей.","Генеральная уборка, глажка, помощь на кухне.","Аккуратно и честно."] },
  cook:        { f:.35, comp:.1, price:[60000,150000,5000], vid:.15, s:{ig:.4,tt:.2,yt:.1}, tags:["бешбармак","плов","свой казан","на выезд","до 200 порций"], tl:["Повар-казан на выезд","Национальная кухня на той","Повар на мероприятие"], ab:["Готовлю национальные блюда на большое количество гостей.","Свой казан и продукты.","До 200 порций прямо на площадке."] },
  driver:      { f:.1, comp:.05, price:[8000,20000,1000], vid:.03, s:{ig:.15,tt:.05,yt:.02}, tags:["минивэн","детское кресло","трансфер","встреча из аэропорта","кортеж"], tl:["Водитель с минивэном на мероприятие","Трансфер гостей и молодожёнов","Водитель на той"], ab:["Развезу гостей, встречу из аэропорта, трансфер.","Минивэн на 7 мест, детское кресло.","Аккуратно и по времени."] },
};

// Взвешенное распределение по профессиям (популярные чаще)
const weights = { tamada:14, photographer:12, videographer:9, host:7, singer:8, dancer:8, animator:9, visagiste:9, cake:7, decorator:7, dance_group:5, musician:5, showman:5, organizer:5, sound:5, pyro:4, photobooth:4, driver:6, nanny:6, housekeeper:5, cook:5 };
const bag = [];
for (const [k, w] of Object.entries(weights)) for (let i = 0; i < w; i++) bag.push(k);

function companyName(prof) {
  const w = pick(words);
  switch (prof) {
    case "dance_group": return pick([`Dance Group «${w}»`, `Шоу-балет «${w}»`, `Ансамбль «${w}»`]);
    case "showman": return pick([`Шоу «${w}»`, `${w} Show`, `Шоу-группа «${w}»`]);
    case "decorator": return pick([`Decor «${w}»`, `Студия «${w}»`, `«${w}» Decor`]);
    case "photobooth": return pick([`PhotoBox «${w}»`, `${w} 360`, `Фотозона «${w}»`]);
    case "organizer": return pick([`${w} Event`, `Агентство «${w}»`, `${w} Wedding`]);
    case "sound": return pick([`${w} Sound`, `Звук «${w}»`, `${w} Pro`]);
    case "pyro": return pick([`Салют «${w}»`, `${w} Fire`, `Пиро «${w}»`]);
    case "cake": return pick([`Cake «${w}»`, `Торты «${w}»`, `Sweet «${w}»`]);
    default: return pick([`«${w}»`, `Студия «${w}»`, `${w} Studio`]);
  }
}

// Ключевые слова для тематических фото по профессии (loremflickr)
const IMG_KW = {
  organizer: ["event", "wedding", "banquet"],
  tamada: ["wedding", "party", "celebration"],
  host: ["event", "conference", "presentation"],
  singer: ["singer", "concert", "microphone"],
  dancer: ["dance", "dancer", "ballet"],
  dance_group: ["dance", "dancers", "performance"],
  animator: ["kids,party", "children,party", "balloons"],
  musician: ["musician", "guitar", "violin"],
  showman: ["fire,show", "stage", "performance"],
  pyro: ["fireworks", "pyrotechnics", "sparks"],
  sound: ["concert", "dj", "loudspeaker"],
  photographer: ["wedding,photography", "photographer", "camera"],
  videographer: ["videographer", "camera", "filming"],
  photobooth: ["photobooth", "party", "portrait"],
  decorator: ["wedding,decoration", "flowers", "table,setting"],
  visagiste: ["makeup", "beauty", "cosmetics"],
  cake: ["cake", "dessert", "pastry"],
  nanny: ["child", "kids", "childcare"],
  housekeeper: ["cleaning", "housekeeping", "home"],
  cook: ["food", "cooking", "cuisine"],
  driver: ["car", "minivan", "road"],
};

function genAttrs(prof) {
  switch (prof) {
    case "nanny": return { age: 25 + R(35), education: pick(["педагог", "мед. образование", "воспитатель", "без спец. образования"]), medbook: chance(0.8), kids_age: pick(["до 3 лет", "3–7 лет", "школьники", "любой"]) };
    case "housekeeper": return { age: 25 + R(35), live_in: chance(0.3), frequency: pick(["разово", "регулярно", "и так, и так"]) };
    case "driver": return { car: pick(["Mercedes Vito", "Toyota Alphard", "Hyundai Starex", "Kia Carnival", "VW Multivan", "Toyota Camry"]), seats: pick([4, 7, 8]), license: pick(["B", "B, D", "B, C"]), child_seat: chance(0.6) };
    case "cook": return { cuisine: pick(["казахская", "узбекская", "европейская", "казахская, узбекская"]), portions: pick([50, 100, 150, 200]), own_cauldron: chance(0.8) };
    case "visagiste": return { home_visit: chance(0.85), trial: chance(0.6) };
    default: return {};
  }
}

const specialists = [];
const contacts = [];
const socials = [];

for (let i = 0; i < N; i++) {
  const prof = pick(bag);
  const c = P[prof];
  const female = chance(c.f);
  const company = chance(c.comp);
  const name = company ? companyName(prof) : personName(female);
  const id = randomUUID();
  const city = pick(cityWeights.concat(cities)); // крупные чаще, но все возможны
  const tagline = pick(c.tl);
  const about = pickN(c.ab, 2 + R(2)).join(" ");
  const price = money(c.price[0], c.price[1], c.price[2]);
  const exp = 1 + R(20);
  const rating = (40 + R(11)) / 10; // 4.0..5.0
  const avatar = company ? `https://picsum.photos/seed/av${i}/400/400` : `https://randomuser.me/api/portraits/${female ? "women" : "men"}/${R(100)}.jpg`;
  const verified = chance(0.4);
  const kws = IMG_KW[prof] || ["event"];
  const work = Array.from({ length: 3 }, (_, g) => `https://loremflickr.com/800/600/${kws[g % kws.length]}?lock=${i * 13 + g + 1}`);
  // У людей первым — их лицо (аватар), дальше — тематические фото работ; у компаний — только работы
  const gallery = company ? work : [avatar, ...work];
  const video = chance(c.vid) ? pick(VIDEOS) : "";
  const tags = pickN(c.tags, 2 + R(3));
  const tagsSql = "ARRAY[" + tags.map((t) => `'${esc(t)}'`).join(",") + "]::text[]";
  const gallerySql = "ARRAY[" + gallery.map((u) => `'${u}'`).join(",") + "]::text[]";
  const attrsSql = `'${esc(JSON.stringify(genAttrs(prof)))}'::jsonb`;

  specialists.push(`('${id}',NULL,'${prof}','${esc(name)}','${esc(city)}','${esc(tagline)}','${esc(about)}',${price},${exp},'${avatar}','${video}',${gallerySql},${tagsSql},${attrsSql},${rating},${verified},true)`);

  const ph = phone();
  const wa = chance(0.85) ? ph : "";
  const tg = chance(0.35) ? "@" + handle() : "";
  contacts.push(`('${id}','${ph}','${wa}','${tg}')`);

  let ord = 0;
  const h = handle();
  if (chance(c.s.ig)) socials.push(`('${id}','instagram','@${h}',true,${ord++})`);
  if (chance(c.s.tt)) socials.push(`('${id}','tiktok','@${h}',true,${ord++})`);
  if (chance(c.s.yt)) socials.push(`('${id}','youtube','@${h}',${chance(0.7)},${ord++})`);
}

function batchInsert(head, rows, size = 200) {
  let out = "";
  for (let i = 0; i < rows.length; i += size) {
    out += head + "\n" + rows.slice(i, i + size).join(",\n") + "\non conflict do nothing;\n\n";
  }
  return out;
}

let sql = "-- Массовые демо-анкеты (сгенерировано scripts/gen-bulk.mjs). Не редактировать вручную.\n\n";
sql += batchInsert("insert into public.specialists (id, owner_id, profession, name, city, tagline, about, price_from, experience_years, avatar_url, video_url, gallery, tags, attributes, rating, verified, is_demo) values", specialists);
sql += batchInsert("insert into public.specialist_contacts (specialist_id, phone, whatsapp, telegram) values", contacts);
sql += batchInsert("insert into public.specialist_socials (specialist_id, type, value, is_public, sort_order) values", socials);

writeFileSync(new URL("../supabase/seed_bulk.sql", import.meta.url), sql);
console.log(`Generated ${specialists.length} specialists, ${contacts.length} contacts, ${socials.length} socials -> supabase/seed_bulk.sql`);
