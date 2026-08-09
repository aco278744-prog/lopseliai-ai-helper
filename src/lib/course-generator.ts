import type { OnboardingData } from "@/lib/onboarding";
import type { CourseContent, CourseModule } from "@/lib/course-types";

type Copy = {
  courseTitle: (pain: string) => string;
  subtitle: (role: string, minutes: string) => string;
  roles: Record<OnboardingData["role"], string>;
  pains: Record<OnboardingData["main_pain"], string>;
  ageGroups: Record<OnboardingData["age_groups"][number], string>;
  time: Record<OnboardingData["time_budget"], string>;
  modules: (ctx: Ctx) => CourseModule[];
};

type Ctx = {
  role: string;
  pain: string;
  groups: string;
  minutes: string;
  format: OnboardingData["output_format"];
  experience: OnboardingData["ai_experience"];
};

const lt: Copy = {
  courseTitle: (pain) => `Dirbtinis intelektas ikimokyklinėje įstaigoje: ${pain.toLowerCase()}`,
  subtitle: (role, minutes) =>
    `Personalus kursas pagal jūsų vaidmenį (${role.toLowerCase()}) ir ${minutes} tempą.`,
  roles: {
    director: "Direktorė",
    deputy_education: "Pavaduotoja ugdymui",
    deputy_facility: "Pavaduotoja ūkio reikalams",
    accountant: "Buhalterė",
    facility_manager: "Ūkvedė",
    teacher: "Auklėtoja",
    specialist: "Specialistė",
  },
  pains: {
    parent_communications: "Bendravimas su tėvais",
    education_plans: "Ugdymo planai",
    events_celebrations: "Renginiai ir šventės",
    reports_municipality: "Ataskaitos savivaldybei",
    internal_orders: "Vidaus tvarkos ir įsakymai",
  },
  ageGroups: {
    nursery: "lopšelio",
    preschool: "darželio",
    prekindergarten: "priešmokyklinės",
  },
  time: { "5_min": "5 min./d.", "15_min": "15 min./d.", "30_min": "30 min./d." },
  modules: (ctx) => [
    {
      id: "m1",
      title: "1 modulis. Pagrindai per 3 dienas",
      description: `Kaip DI veikia praktiškai ir kur jis realiai sutaupo laiko ${ctx.groups} grupėse.`,
      lessons: [
        {
          id: "m1l1",
          title: "Kas yra gera užklausa",
          summary:
            "Trys dalys, be kurių DI atsakymas visada bus bendrinis: vaidmuo, kontekstas, formatas.",
          minutes: 6,
          steps: [
            "Perskaitykite užklausos struktūrą: vaidmuo → kontekstas → užduotis → formatas.",
            "Paimkite vieną savo šios savaitės tekstą (laišką, planą ar raštą).",
            "Perrašykite jį pagal šabloną ir palyginkite rezultatą su savo pirmuoju bandymu.",
          ],
          prompts: [
            {
              title: "Universalus starto šablonas",
              body: `Tu esi patyrusi Lietuvos lopšelio-darželio ${ctx.role.toLowerCase()}. Kontekstas: dirbu su ${ctx.groups} amžiaus grupe. Užduotis: [įrašykite užduotį]. Rašyk lietuviškai, dalykiškai ir šiltai. Formatas: [sąrašas / laiškas / lentelė]. Ilgis: iki 250 žodžių.`,
            },
          ],
        },
        {
          id: "m1l2",
          title: "Duomenų sauga ir etika",
          summary: "Ką galima ir ko negalima rašyti į DI įrankį darželio kasdienybėje.",
          minutes: 5,
          steps: [
            "Sudarykite draudžiamų duomenų sąrašą: vaikų vardai, sveikatos duomenys, adresai.",
            "Susikurkite anonimizavimo įprotį: „Vaikas A“, „Tėvas B“.",
            "Įsirašykite tai į įstaigos vidaus tvarką kaip vieną pastraipą.",
          ],
          prompts: [
            {
              title: "Vidaus tvarkos pastraipa apie DI",
              body: "Parenk 150 žodžių pastraipą lopšelio-darželio vidaus tvarkos aprašui apie atsakingą dirbtinio intelekto naudojimą: kokius duomenis draudžiama įvesti, kas tikrina rezultatą, kaip žymimi DI padėti parengti dokumentai.",
            },
          ],
        },
      ],
    },
    {
      id: "m2",
      title: `2 modulis. ${ctx.pain}`,
      description: "Jūsų pagrindinis skausmo taškas — išspręstas paruoštais sprendimais.",
      lessons: [
        {
          id: "m2l1",
          title: `${ctx.pain}: greitasis sprendimas`,
          summary: `Vienas šablonas, kurį naudosite kiekvieną savaitę per ${ctx.minutes}.`,
          minutes: 8,
          steps: [
            "Nustatykite dažniausiai pasikartojančią situaciją.",
            "Paruoškite užklausą ir išsaugokite ją savo šablonų faile.",
            "Patikrinkite rezultatą pagal faktus ir tik tada naudokite.",
          ],
          prompts: [
            {
              title: "Pagrindinis darbo šablonas",
              body: `Tu esi Lietuvos ikimokyklinio ugdymo įstaigos ${ctx.role.toLowerCase()}. Tema: ${ctx.pain.toLowerCase()}. Situacija: [aprašykite]. Parenk ${
                ctx.format === "document_templates"
                  ? "oficialaus dokumento ruošinį su antrašte ir punktais"
                  : ctx.format === "step-by-step_guides"
                    ? "žingsnis po žingsnio veiksmų planą"
                    : "3 skirtingų tonų variantus"
              }. Kalba: lietuvių, be kanceliarinių perteklinių frazių.`,
            },
            {
              title: "Sudėtingos situacijos variantas",
              body: `Perrašyk ankstesnį tekstą taip, kad jis tiktų įtemptai situacijai: išlaikyk ramų toną, pripažink jausmus, pasiūlyk konkretų kitą žingsnį ir susitikimo laiką.`,
            },
          ],
        },
        {
          id: "m2l2",
          title: "Kokybės patikra prieš siunčiant",
          summary: "Penkių punktų sąrašas, kad DI klaidos nepasiektų tėvų ar savivaldybės.",
          minutes: 5,
          steps: [
            "Patikrinkite faktus ir datas.",
            "Pašalinkite bet kokius asmens duomenis, kurių nereikia.",
            "Perskaitykite garsiai — ar skamba kaip jūs?",
          ],
          prompts: [
            {
              title: "Redaktorės užklausa",
              body: "Būk griežta lietuvių kalbos redaktorė. Patikrink šį tekstą: gramatika, stilius, perteklinės frazės, neaiškūs teiginiai. Pateik pataisytą versiją ir trumpą pastabų sąrašą.",
            },
          ],
        },
      ],
    },
    {
      id: "m3",
      title: "3 modulis. Įprotis ir komanda",
      description: "Kaip DI taps kasdiene įstaigos praktika, o ne vienkartiniu bandymu.",
      lessons: [
        {
          id: "m3l1",
          title: "Asmeninė šablonų biblioteka",
          summary: "Susikurkite 10 užklausų rinkinį, kurį naudosite nuolat.",
          minutes: 7,
          steps: [
            "Sukurkite dokumentą „Mano DI šablonai“.",
            "Kaskart, kai užklausa pavyksta, iškart ją išsaugokite.",
            "Kas mėnesį peržiūrėkite ir patobulinkite tris dažniausiai naudojamas.",
          ],
          prompts: [
            {
              title: "Šablonų audito užklausa",
              body: "Peržiūrėk šias mano užklausas ir pasiūlyk, kaip kiekvieną patobulinti: pridėk trūkstamą kontekstą, formato reikalavimą ir kokybės kriterijų. Pateik lentelę: „Buvo“ / „Siūlau“.",
            },
          ],
        },
        {
          id: "m3l2",
          title: "Komandos mokymas per 30 minučių",
          summary: "Paruošta metodinės valandėlės struktūra kolegoms.",
          minutes: 9,
          steps: [
            "Parodykite vieną realų pavyzdį iš savo darbo.",
            "Leiskite kolegoms išbandyti tą pačią užklausą.",
            "Susitarkite dėl bendrų saugos taisyklių.",
          ],
          prompts: [
            {
              title: "Metodinės valandėlės planas",
              body: "Parenk 30 minučių metodinės valandėlės planą darželio komandai tema „DI kasdieniame darbe“: tikslas, laiko skaidymas minutėmis, praktinė užduotis, klausimai diskusijai, apibendrinimas.",
            },
          ],
        },
      ],
    },
  ],
};

const ru: Copy = {
  courseTitle: (pain) => `Искусственный интеллект в детском саду: ${pain.toLowerCase()}`,
  subtitle: (role, minutes) =>
    `Персональный курс для вашей роли (${role.toLowerCase()}) в темпе ${minutes}.`,
  roles: {
    director: "Директор",
    deputy_education: "Заместитель по воспитанию",
    deputy_facility: "Заместитель по хозяйственной части",
    accountant: "Бухгалтер",
    facility_manager: "Завхоз",
    teacher: "Воспитатель",
    specialist: "Специалист",
  },
  pains: {
    parent_communications: "Общение с родителями",
    education_plans: "Планы образования",
    events_celebrations: "Renginiai ir šventės",
    reports_municipality: "Отчёты самоуправлению",
    internal_orders: "Внутренние приказы",
  },
  ageGroups: { nursery: "ясельной", preschool: "садовой", prekindergarten: "подготовительной" },
  time: { "5_min": "5 мин./день", "15_min": "15 мин./день", "30_min": "30 мин./день" },
  modules: (ctx) => [
    {
      id: "m1",
      title: "Модуль 1. Основы за 3 дня",
      description: `Как ИИ реально экономит время в работе с ${ctx.groups} группой.`,
      lessons: [
        {
          id: "m1l1",
          title: "Что такое хороший запрос",
          summary: "Роль, контекст, задача и формат — без них ответ всегда будет общим.",
          minutes: 6,
          steps: [
            "Изучите структуру запроса: роль → контекст → задача → формат.",
            "Возьмите один свой рабочий текст этой недели.",
            "Перепишите его по шаблону и сравните результат.",
          ],
          prompts: [
            {
              title: "Универсальный шаблон",
              body: `Ты опытный ${ctx.role.toLowerCase()} детского сада в Литве. Контекст: работаю с ${ctx.groups} группой. Задача: [впишите]. Пиши по-русски, деловито и тепло. Формат: [список / письмо / таблица]. Объём: до 250 слов.`,
            },
          ],
        },
        {
          id: "m1l2",
          title: "Безопасность данных",
          summary: "Что нельзя вводить в ИИ-инструменты в работе детского сада.",
          minutes: 5,
          steps: [
            "Составьте список запрещённых данных: имена детей, здоровье, адреса.",
            "Используйте обезличивание: «Ребёнок А», «Родитель Б».",
            "Зафиксируйте это во внутреннем порядке учреждения.",
          ],
          prompts: [
            {
              title: "Пункт внутреннего порядка об ИИ",
              body: "Подготовь абзац (150 слов) для внутреннего порядка детского сада об ответственном использовании ИИ: запрещённые данные, кто проверяет результат, как помечаются документы.",
            },
          ],
        },
      ],
    },
    {
      id: "m2",
      title: `Модуль 2. ${ctx.pain}`,
      description: "Ваша главная боль — с готовыми решениями.",
      lessons: [
        {
          id: "m2l1",
          title: `${ctx.pain}: быстрое решение`,
          summary: `Один шаблон, который вы будете использовать каждую неделю за ${ctx.minutes}.`,
          minutes: 8,
          steps: [
            "Определите самую частую повторяющуюся ситуацию.",
            "Подготовьте запрос и сохраните его в файл шаблонов.",
            "Проверьте факты перед использованием.",
          ],
          prompts: [
            {
              title: "Основной рабочий шаблон",
              body: `Ты ${ctx.role.toLowerCase()} детского сада. Тема: ${ctx.pain.toLowerCase()}. Ситуация: [опишите]. Подготовь ${
                ctx.format === "document_templates"
                  ? "заготовку официального документа"
                  : ctx.format === "step-by-step_guides"
                    ? "пошаговый план действий"
                    : "три варианта разного тона"
              }. Язык: русский, без канцелярита.`,
            },
          ],
        },
        {
          id: "m2l2",
          title: "Проверка качества",
          summary: "Пять пунктов, чтобы ошибки ИИ не дошли до родителей.",
          minutes: 5,
          steps: [
            "Проверьте факты и даты.",
            "Удалите лишние персональные данные.",
            "Прочитайте вслух — звучит ли это как вы?",
          ],
          prompts: [
            {
              title: "Запрос редактору",
              body: "Будь строгим редактором. Проверь текст: грамматика, стиль, лишние фразы. Дай исправленную версию и список замечаний.",
            },
          ],
        },
      ],
    },
    {
      id: "m3",
      title: "Модуль 3. Привычка и команда",
      description: "Как ИИ станет ежедневной практикой учреждения.",
      lessons: [
        {
          id: "m3l1",
          title: "Личная библиотека шаблонов",
          summary: "Соберите 10 запросов для постоянного использования.",
          minutes: 7,
          steps: [
            "Создайте документ «Мои ИИ-шаблоны».",
            "Сохраняйте удачные запросы сразу.",
            "Раз в месяц улучшайте три самых частых.",
          ],
          prompts: [
            {
              title: "Аудит шаблонов",
              body: "Просмотри мои запросы и предложи улучшения: контекст, формат, критерий качества. Дай таблицу «Было» / «Предлагаю».",
            },
          ],
        },
        {
          id: "m3l2",
          title: "Обучение команды за 30 минут",
          summary: "Готовая структура методического занятия для коллег.",
          minutes: 9,
          steps: [
            "Покажите реальный пример из своей работы.",
            "Дайте коллегам попробовать тот же запрос.",
            "Договоритесь об общих правилах безопасности.",
          ],
          prompts: [
            {
              title: "План методического занятия",
              body: "Подготовь план 30-минутного занятия для команды детского сада на тему «ИИ в ежедневной работе»: цель, тайминг, практика, вопросы, итог.",
            },
          ],
        },
      ],
    },
  ],
};

export function buildMockCourse(data: OnboardingData): CourseContent {
  const copy = data.language_style === "ru" ? ru : lt;
  const role = copy.roles[data.role];
  const pain = copy.pains[data.main_pain];
  const minutes = copy.time[data.time_budget];
  const groups = data.age_groups.map((group) => copy.ageGroups[group]).join(", ");

  const ctx: Ctx = {
    role,
    pain,
    groups,
    minutes,
    format: data.output_format,
    experience: data.ai_experience,
  };

  return {
    title: copy.courseTitle(pain),
    subtitle: copy.subtitle(role, minutes),
    language: data.language_style,
    modules: copy.modules(ctx),
  };
}
