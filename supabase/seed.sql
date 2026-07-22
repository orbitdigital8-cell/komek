-- ============================================================================
-- Демо-данные: справочник профессий + витрина специалистов.
-- Контакты вымышленные. Фото — генеративные заглушки (pravatar / picsum).
-- ============================================================================

-- ---- Профессии --------------------------------------------------------------
-- segment: 'toi' — для тоя/праздника, 'general' — бытовые услуги
insert into public.professions (id, label, emoji, category, segment, sort_order) values
  ('organizer',    'Организатор тоя',          '📋', 'Организация',     'toi',      5),
  ('tamada',       'Тамада / асаба',           '🎤', 'Ведущие',        'toi',     10),
  ('host',         'Ведущий мероприятий',      '🎙️', 'Ведущие',        'toi',     20),
  ('singer',       'Певец / вокалист',         '🎶', 'Артисты',        'toi',     30),
  ('dancer',       'Танцор / шоу-балет',       '💃', 'Артисты',        'toi',     40),
  ('dance_group',  'Танцевальная группа',      '🕺', 'Артисты',        'toi',     50),
  ('animator',     'Аниматор',                 '🎈', 'Артисты',        'toi',     60),
  ('musician',     'Музыкант / кавер-бэнд',    '🎸', 'Артисты',        'toi',     70),
  ('showman',      'Шоу-программа',             '🎭', 'Артисты',        'toi',     80),
  ('pyro',         'Салют / пиротехника',      '🎆', 'Шоу и эффекты',   'toi',     85),
  ('sound',        'Звукорежиссёр',            '🔊', 'Техника и медиа', 'toi',    100),
  ('photographer', 'Фотограф',                 '📸', 'Техника и медиа', 'toi',    110),
  ('videographer', 'Видеооператор',            '🎥', 'Техника и медиа', 'toi',    120),
  ('photobooth',   'Фотозона / фотобудка',     '🤳', 'Техника и медиа', 'toi',    125),
  ('decorator',    'Декоратор / оформление',   '🎀', 'Оформление',      'toi',    130),
  ('visagiste',    'Визажист / стилист',       '💄', 'Красота',         'toi',    135),
  ('cake',         'Кондитер / торты',         '🎂', 'Кейтеринг',       'toi',    140),
  ('nanny',        'Няня',                     '🧸', 'Бытовые услуги',  'general', 200),
  ('housekeeper',  'Домработница',             '🧹', 'Бытовые услуги',  'general', 210),
  ('cook',         'Повар на выезд',           '👨‍🍳', 'Бытовые услуги', 'general', 215),
  ('driver',       'Водитель',                 '🚗', 'Бытовые услуги',  'general', 220)
on conflict (id) do nothing;

-- ---- Демо-специалисты -------------------------------------------------------
insert into public.specialists
  (id, owner_id, profession, name, city, tagline, about, price_from, experience_years, avatar_url, video_url, work_link, gallery, rating, is_demo)
values
  ('d0000000-0000-0000-0000-000000000001', null, 'tamada', 'Ерлан Сапаров', 'Алматы',
   'Тамада на двух языках — той любой сложности',
   'Веду тои, свадьбы и юбилеи на казахском и русском языках. Живой юмор, современные конкурсы, авторские сценарии под каждого клиента. Работаю в связке со своей командой музыкантов.',
   150000, 12, 'https://i.pravatar.cc/400?img=12',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
   'https://instagram.com/',
   array['https://picsum.photos/seed/tamada1a/800/600','https://picsum.photos/seed/tamada1b/800/600','https://picsum.photos/seed/tamada1c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000002', null, 'tamada', 'Айдана Нурлыбек', 'Астана',
   'Женщина-тамада для тёплых семейных торжеств',
   'Провожу узату той, кыз узату, домашние праздники. Делаю акцент на традициях и душевной атмосфере. Гибкие сценарии, работа с гостями любого возраста.',
   120000, 8, 'https://i.pravatar.cc/400?img=45',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
   'https://instagram.com/',
   array['https://picsum.photos/seed/tamada2a/800/600','https://picsum.photos/seed/tamada2b/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000003', null, 'host', 'Дмитрий Ким', 'Алматы',
   'Ведущий корпоративов и презентаций',
   'Корпоративы, открытия, конференции, премии. Опыт работы с крупными брендами. Чёткий тайминг, стиль и уместный юмор.',
   180000, 10, 'https://i.pravatar.cc/400?img=33', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/host3a/800/600','https://picsum.photos/seed/host3b/800/600'],
   4.7, true),

  ('d0000000-0000-0000-0000-000000000004', null, 'singer', 'Меруерт Асель', 'Шымкент',
   'Живой вокал: эстрада, народные, кавер',
   'Пою на тоях и свадьбах вживую под минус или с музыкантами. Репертуар на казахском, русском, турецком. Возможен дуэт.',
   100000, 6, 'https://i.pravatar.cc/400?img=47', '', '',
   array['https://picsum.photos/seed/singer4a/800/600','https://picsum.photos/seed/singer4b/800/600'],
   4.6, true),

  ('d0000000-0000-0000-0000-000000000005', null, 'dancer', 'Show Ballet «Ai»', 'Алматы',
   'Шоу-балет — 6 танцовщиц, 4 программы',
   'Восточные, современные и национальные номера. Костюмы и постановка included. Украсим любой той ярким шоу.',
   90000, 7, 'https://i.pravatar.cc/400?img=26',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
   'https://instagram.com/',
   array['https://picsum.photos/seed/dance5a/800/600','https://picsum.photos/seed/dance5b/800/600','https://picsum.photos/seed/dance5c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000006', null, 'animator', 'Аружан Party', 'Астана',
   'Аниматоры для детских праздников',
   'Более 30 персонажей: супергерои, принцессы, роботы. Шоу мыльных пузырей, аквагрим, научное шоу. Работаем командой.',
   40000, 5, 'https://i.pravatar.cc/400?img=16',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
   'https://instagram.com/',
   array['https://picsum.photos/seed/anim6a/800/600','https://picsum.photos/seed/anim6b/800/600','https://picsum.photos/seed/anim6c/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000008', null, 'sound', 'Нурлан Аудио', 'Караганда',
   'Звук и свет под ключ на площадку',
   'Профессиональный аппарат: колонки, микрофоны, световое оформление. Выезд по области. Настройка и сопровождение мероприятия.',
   130000, 11, 'https://i.pravatar.cc/400?img=59', '', '',
   array['https://picsum.photos/seed/sound8a/800/600','https://picsum.photos/seed/sound8b/800/600'],
   4.6, true),

  ('d0000000-0000-0000-0000-000000000009', null, 'photographer', 'Алия Фото', 'Алматы',
   'Свадебный и семейный фотограф',
   'Репортаж и постановка. Отдаю 300+ обработанных кадров. Есть студия и выезд на природу. Fotobook в подарок.',
   70000, 6, 'https://i.pravatar.cc/400?img=44', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/photo9a/800/600','https://picsum.photos/seed/photo9b/800/600','https://picsum.photos/seed/photo9c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000010', null, 'videographer', 'Тимур Видео', 'Астана',
   'Видеограф: клипы и love story',
   'Съёмка на два оператора, дрон, стедикам. Монтаж клипа за 2 недели. Полный фильм дня по запросу.',
   110000, 8, 'https://i.pravatar.cc/400?img=51',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://instagram.com/',
   array['https://picsum.photos/seed/video10a/800/600','https://picsum.photos/seed/video10b/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000011', null, 'decorator', 'Decor Studio Gүl', 'Алматы',
   'Оформление и флористика мероприятий',
   'Арки, президиумы, фотозоны, живые цветы. Разработка концепции под цвет и тематику. Монтаж и демонтаж наши.',
   200000, 7, 'https://i.pravatar.cc/400?img=25', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/decor11a/800/600','https://picsum.photos/seed/decor11b/800/600','https://picsum.photos/seed/decor11c/800/600'],
   4.7, true),

  ('d0000000-0000-0000-0000-000000000012', null, 'nanny', 'Гүлназ Апай', 'Алматы',
   'Няня-аниматор на время торжества',
   'Присмотрю за детьми, пока взрослые празднуют: игры, творчество, безопасность. Мед. книжка, опыт в детском саду 10 лет.',
   15000, 10, 'https://i.pravatar.cc/400?img=49', '', '',
   array['https://picsum.photos/seed/nanny12a/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000013', null, 'driver', 'Ержан Транспорт', 'Астана',
   'Водитель с минивэном на мероприятие',
   'Развезу гостей, встречу из аэропорта, трансфер молодожёнов. Мерседес Vito, 7 мест, детское кресло. Аккуратно и по времени.',
   12000, 14, 'https://i.pravatar.cc/400?img=54', '', '',
   array['https://picsum.photos/seed/driver13a/800/600','https://picsum.photos/seed/driver13b/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000014', null, 'cook', 'Асхат Аспаз', 'Шымкет',
   'Повар-казан на выезд: бешбармак, плов',
   'Готовлю национальные блюда на большое количество гостей прямо на площадке. Свой казан и продукты. До 200 порций.',
   90000, 13, 'https://i.pravatar.cc/400?img=68', '', '',
   array['https://picsum.photos/seed/cook14a/800/600','https://picsum.photos/seed/cook14b/800/600'],
   4.7, true),

  ('d0000000-0000-0000-0000-000000000015', null, 'musician', 'Дуэт «Сазген»', 'Алматы',
   'Живая музыка: домбра, скрипка, вокал',
   'Инструментальное сопровождение тоя и встречи гостей. Национальные и эстрадные композиции. Возможен трио-состав.',
   85000, 9, 'https://i.pravatar.cc/400?img=13', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/music15a/800/600','https://picsum.photos/seed/music15b/800/600'],
   4.8, true)
on conflict (id) do nothing;

-- ---- Контакты демо-специалистов (видны только после подтверждения) ----------
insert into public.specialist_contacts (specialist_id, phone, whatsapp, instagram, telegram) values
  ('d0000000-0000-0000-0000-000000000001', '+7 701 111 22 01', '+7 701 111 22 01', '@erlan_tamada', '@erlan_tamada'),
  ('d0000000-0000-0000-0000-000000000002', '+7 701 111 22 02', '+7 701 111 22 02', '@aidana_toi', ''),
  ('d0000000-0000-0000-0000-000000000003', '+7 701 111 22 03', '+7 701 111 22 03', '@dmitry_host', '@dmitry_host'),
  ('d0000000-0000-0000-0000-000000000004', '+7 701 111 22 04', '+7 701 111 22 04', '@meruert_vocal', ''),
  ('d0000000-0000-0000-0000-000000000005', '+7 701 111 22 05', '+7 701 111 22 05', '@showballet_ai', '@showballet_ai'),
  ('d0000000-0000-0000-0000-000000000006', '+7 701 111 22 06', '+7 701 111 22 06', '@aruzhan_party', '@aruzhan_party'),
  ('d0000000-0000-0000-0000-000000000008', '+7 701 111 22 08', '+7 701 111 22 08', '', ''),
  ('d0000000-0000-0000-0000-000000000009', '+7 701 111 22 09', '+7 701 111 22 09', '@aliya_photo', '@aliya_photo'),
  ('d0000000-0000-0000-0000-000000000010', '+7 701 111 22 10', '+7 701 111 22 10', '@timur_video', ''),
  ('d0000000-0000-0000-0000-000000000011', '+7 701 111 22 11', '+7 701 111 22 11', '@decor_gul', '@decor_gul'),
  ('d0000000-0000-0000-0000-000000000012', '+7 701 111 22 12', '+7 701 111 22 12', '', ''),
  ('d0000000-0000-0000-0000-000000000013', '+7 701 111 22 13', '+7 701 111 22 13', '', '@erzhan_trans'),
  ('d0000000-0000-0000-0000-000000000014', '+7 701 111 22 14', '+7 701 111 22 14', '@askhat_aspaz', ''),
  ('d0000000-0000-0000-0000-000000000015', '+7 701 111 22 15', '+7 701 111 22 15', '@sazgen_duo', '@sazgen_duo')
on conflict (specialist_id) do nothing;

-- ---- Специалисты новых ролей (танц-группа, шоу, домработница) ----------------
insert into public.specialists
  (id, owner_id, profession, name, city, tagline, about, price_from, experience_years, avatar_url, video_url, work_link, gallery, rating, is_demo)
values
  ('d0000000-0000-0000-0000-000000000016', null, 'dance_group', 'Dance Group «Tomiris»', 'Алматы',
   'Танцевальный коллектив — 8 артистов',
   'Национальные, современные и уличные направления. Готовые постановки и номера под ваш той. Своя постановщица, костюмы включены.',
   120000, 6, 'https://i.pravatar.cc/400?img=31',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
   'https://instagram.com/',
   array['https://picsum.photos/seed/dgroup16a/800/600','https://picsum.photos/seed/dgroup16b/800/600','https://picsum.photos/seed/dgroup16c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000017', null, 'showman', 'Шоу «Огонь и свет»', 'Астана',
   'Фаер- и лазер-шоу для открытий и тоев',
   'Пиротехника, световые костюмы, огненные номера. Безопасно на улице и в помещении. Эффектный старт или финал праздника.',
   160000, 5, 'https://i.pravatar.cc/400?img=15', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/show17a/800/600','https://picsum.photos/seed/show17b/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000018', null, 'housekeeper', 'Сауле Апай', 'Алматы',
   'Домработница: уборка до и после тоя',
   'Помогу подготовить дом к приёму гостей и приведу в порядок после. Генеральная уборка, глажка, помощь на кухне. Аккуратно и честно.',
   10000, 12, 'https://i.pravatar.cc/400?img=48', '', '',
   array['https://picsum.photos/seed/house18a/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000019', null, 'organizer', 'TOI Event Agency', 'Алматы',
   'Организация тоя под ключ',
   'Возьмём весь той на себя: площадка, артисты, декор, тайминг, координация в день события. Вы отдыхаете — мы работаем. Прозрачная смета.',
   250000, 7, 'https://i.pravatar.cc/400?img=20', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/org19a/800/600','https://picsum.photos/seed/org19b/800/600','https://picsum.photos/seed/org19c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000020', null, 'pyro', 'Салют KZ', 'Астана',
   'Салют, фейерверк и холодные фонтаны',
   'Пиротехническое сопровождение тоя: салют в финале, холодные фонтаны на выход молодых, тяжёлый дым. Все разрешения и техника безопасности.',
   90000, 8, 'https://i.pravatar.cc/400?img=53', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/pyro20a/800/600','https://picsum.photos/seed/pyro20b/800/600'],
   4.8, true),

  ('d0000000-0000-0000-0000-000000000021', null, 'photobooth', 'PhotoBox 360', 'Алматы',
   'Фотобудка и 360-платформа с печатью',
   'Моментальная печать фото гостям на память, видео 360°, реквизит и оформление зоны. Гости в восторге, а у вас — брендированные снимки.',
   70000, 4, 'https://i.pravatar.cc/400?img=32', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/booth21a/800/600','https://picsum.photos/seed/booth21b/800/600'],
   4.7, true),

  ('d0000000-0000-0000-0000-000000000022', null, 'visagiste', 'Динара Стиль', 'Алматы',
   'Визажист и стилист по причёскам',
   'Свадебный и вечерний макияж, укладки, образ на узату и беташар. Выезд к вам утром. Стойкий макияж на весь день, пробный образ по желанию.',
   35000, 9, 'https://i.pravatar.cc/400?img=41', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/visage22a/800/600','https://picsum.photos/seed/visage22b/800/600','https://picsum.photos/seed/visage22c/800/600'],
   4.9, true),

  ('d0000000-0000-0000-0000-000000000023', null, 'cake', 'Торты от Гульмиры', 'Шымкент',
   'Той-торты и капкейки на заказ',
   'Многоярусные той-торты, капкейки, кэнди-бар. Натуральные ингредиенты, дизайн под тематику праздника. Доставка по городу в день события.',
   25000, 6, 'https://i.pravatar.cc/400?img=24', '', 'https://instagram.com/',
   array['https://picsum.photos/seed/cake23a/800/600','https://picsum.photos/seed/cake23b/800/600'],
   4.9, true)
on conflict (id) do nothing;

insert into public.specialist_contacts (specialist_id, phone, whatsapp, instagram, telegram) values
  ('d0000000-0000-0000-0000-000000000016', '+7 701 111 22 16', '+7 701 111 22 16', '@dance_tomiris', '@dance_tomiris'),
  ('d0000000-0000-0000-0000-000000000017', '+7 701 111 22 17', '+7 701 111 22 17', '@fire_light_show', ''),
  ('d0000000-0000-0000-0000-000000000018', '+7 701 111 22 18', '+7 701 111 22 18', '', ''),
  ('d0000000-0000-0000-0000-000000000019', '+7 701 111 22 19', '+7 701 111 22 19', '@toi_event', '@toi_event'),
  ('d0000000-0000-0000-0000-000000000020', '+7 701 111 22 20', '+7 701 111 22 20', '@salut_kz', ''),
  ('d0000000-0000-0000-0000-000000000021', '+7 701 111 22 21', '+7 701 111 22 21', '@photobox360', ''),
  ('d0000000-0000-0000-0000-000000000022', '+7 701 111 22 22', '+7 701 111 22 22', '@dinara_style', '@dinara_style'),
  ('d0000000-0000-0000-0000-000000000023', '+7 701 111 22 23', '+7 701 111 22 23', '@torty_gulmira', '')
on conflict (specialist_id) do nothing;

-- ---- Теги специалистов (для уточняющего фильтра) ----------------------------
update public.specialists set tags = '{"на двух языках","живой юмор","своя команда"}'      where id = 'd0000000-0000-0000-0000-000000000001';
update public.specialists set tags = '{"на казахском","узату той","семейные"}'             where id = 'd0000000-0000-0000-0000-000000000002';
update public.specialists set tags = '{"корпоративы","на русском","премии"}'               where id = 'd0000000-0000-0000-0000-000000000003';
update public.specialists set tags = '{"живой вокал","казахский","русский"}'               where id = 'd0000000-0000-0000-0000-000000000004';
update public.specialists set tags = '{"восточные танцы","современные","костюмы включены"}' where id = 'd0000000-0000-0000-0000-000000000005';
update public.specialists set tags = '{"аквагрим","шоу пузырей","супергерои"}'             where id = 'd0000000-0000-0000-0000-000000000006';
update public.specialists set tags = '{"своё оборудование","свет","выезд по области"}'     where id = 'd0000000-0000-0000-0000-000000000008';
update public.specialists set tags = '{"своя студия","свадебный","выезд на природу"}'      where id = 'd0000000-0000-0000-0000-000000000009';
update public.specialists set tags = '{"дрон","стедикам","love story"}'                    where id = 'd0000000-0000-0000-0000-000000000010';
update public.specialists set tags = '{"фотозоны","живые цветы","арки"}'                   where id = 'd0000000-0000-0000-0000-000000000011';
update public.specialists set tags = '{"с медкнижкой","игры и творчество","опыт 10 лет"}'  where id = 'd0000000-0000-0000-0000-000000000012';
update public.specialists set tags = '{"минивэн","детское кресло","трансфер"}'             where id = 'd0000000-0000-0000-0000-000000000013';
update public.specialists set tags = '{"бешбармак","плов","свой казан"}'                   where id = 'd0000000-0000-0000-0000-000000000014';
update public.specialists set tags = '{"домбра","скрипка","национальные"}'                 where id = 'd0000000-0000-0000-0000-000000000015';
update public.specialists set tags = '{"национальные","уличные","8 артистов"}'             where id = 'd0000000-0000-0000-0000-000000000016';
update public.specialists set tags = '{"фаер-шоу","лазерное шоу","пиротехника"}'           where id = 'd0000000-0000-0000-0000-000000000017';
update public.specialists set tags = '{"генеральная уборка","глажка","помощь на кухне"}'   where id = 'd0000000-0000-0000-0000-000000000018';
update public.specialists set tags = '{"под ключ","координация","смета"}'                  where id = 'd0000000-0000-0000-0000-000000000019';
update public.specialists set tags = '{"холодные фонтаны","салют","тяжёлый дым"}'          where id = 'd0000000-0000-0000-0000-000000000020';
update public.specialists set tags = '{"печать фото","360 видео","реквизит"}'              where id = 'd0000000-0000-0000-0000-000000000021';
update public.specialists set tags = '{"свадебный макияж","укладка","выезд"}'              where id = 'd0000000-0000-0000-0000-000000000022';
update public.specialists set tags = '{"той-торт","капкейки","кэнди-бар"}'                 where id = 'd0000000-0000-0000-0000-000000000023';

-- ---- Соцсети специалистов (public — видны всем; is_public=false — после подтверждения) ----
insert into public.specialist_socials (specialist_id, type, value, is_public, sort_order) values
  ('d0000000-0000-0000-0000-000000000001', 'instagram', '@erlan_tamada', true, 0),
  ('d0000000-0000-0000-0000-000000000001', 'youtube',   '@erlan_tamada', true, 1),
  ('d0000000-0000-0000-0000-000000000001', 'tiktok',    '@erlan_tamada', false, 2),
  ('d0000000-0000-0000-0000-000000000003', 'instagram', '@dmitry_host',  true, 0),
  ('d0000000-0000-0000-0000-000000000005', 'instagram', '@showballet_ai', true, 0),
  ('d0000000-0000-0000-0000-000000000005', 'tiktok',    '@showballet_ai', true, 1),
  ('d0000000-0000-0000-0000-000000000006', 'instagram', '@aruzhan_party', true, 0),
  ('d0000000-0000-0000-0000-000000000006', 'youtube',   '@aruzhan_party', true, 1),
  ('d0000000-0000-0000-0000-000000000009', 'instagram', '@aliya_photo',   true, 0),
  ('d0000000-0000-0000-0000-000000000010', 'instagram', '@timur_video',   true, 0),
  ('d0000000-0000-0000-0000-000000000010', 'youtube',   '@timur_video',   true, 1),
  ('d0000000-0000-0000-0000-000000000011', 'instagram', '@decor_gul',     true, 0),
  ('d0000000-0000-0000-0000-000000000016', 'instagram', '@dance_tomiris', true, 0),
  ('d0000000-0000-0000-0000-000000000016', 'tiktok',    '@dance_tomiris', true, 1),
  ('d0000000-0000-0000-0000-000000000017', 'instagram', '@fire_light_show', true, 0),
  ('d0000000-0000-0000-0000-000000000019', 'instagram', '@toi_event',      true, 0),
  ('d0000000-0000-0000-0000-000000000020', 'instagram', '@salut_kz',       true, 0),
  ('d0000000-0000-0000-0000-000000000021', 'instagram', '@photobox360',    true, 0),
  ('d0000000-0000-0000-0000-000000000021', 'tiktok',    '@photobox360',    true, 1),
  ('d0000000-0000-0000-0000-000000000022', 'instagram', '@dinara_style',   true, 0),
  ('d0000000-0000-0000-0000-000000000023', 'instagram', '@torty_gulmira',  true, 0);

-- ---- Демо-занятость (будущие даты относительно сегодняшнего дня) -------------
insert into public.specialist_busy (specialist_id, busy_date, note) values
  ('d0000000-0000-0000-0000-000000000001', current_date + 3,  'той'),
  ('d0000000-0000-0000-0000-000000000001', current_date + 4,  'свадьба'),
  ('d0000000-0000-0000-0000-000000000001', current_date + 10, 'юбилей'),
  ('d0000000-0000-0000-0000-000000000019', current_date + 5,  ''),
  ('d0000000-0000-0000-0000-000000000019', current_date + 6,  ''),
  ('d0000000-0000-0000-0000-000000000022', current_date + 3,  'выезд утром'),
  ('d0000000-0000-0000-0000-000000000022', current_date + 12, ''),
  ('d0000000-0000-0000-0000-000000000009', current_date + 7,  'съёмка')
on conflict do nothing;
