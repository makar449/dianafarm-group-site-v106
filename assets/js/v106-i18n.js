(function () {
  'use strict';

  const LANGS = ['ru', 'bg', 'ka', 'en'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const getLang = () => LANGS.includes(localStorage.getItem('dfg_lang')) ? localStorage.getItem('dfg_lang') : 'ru';
  const tr = (value) => {
    const lang = getLang();
    if (!value || typeof value !== 'object') return value ?? '';
    return value[lang] || value.ru || value.en || value.bg || value.ka || Object.values(value)[0] || '';
  };

  const common = {
    ru: {
      home: 'Главная', services: 'Услуги', about: 'О компании', blog: 'Блог', reviews: 'Отзывы', b2b: 'B2B Offers', contacts: 'Контакты', allServices: 'Все услуги',
      consult: 'Получить консультацию', all: 'Все услуги', request: 'Оставить заявку', route: 'Запросить маршрут', footerSections: 'Разделы', social: 'Social', admin: 'Админ-панель',
      proof1: 'Персональный анализ', proof1s: 'без шаблонов и лишней воды', proof2: 'Документы и маршрут', proof2s: 'понятная последовательность действий', proof3: 'Помощь', proof3s: 'помогаем до результата',
      strategy: 'Стратегия и помощь', privateRequest: 'Private request', personalRoute: 'Персональный маршрут', personalText: 'Оставьте заявку — мы уточним задачу, страну, сроки и подготовим решение без лишней бюрократии и хаоса.',
      valueEyebrow: 'Что получает клиент', valueTitle: 'Услуга как понятная система', processEyebrow: 'Как мы работаем', processTitle: 'От запроса до результата', support: 'Premium support', finalTitle: 'Нужна точная консультация по вашему кейсу?', finalText: 'Напишите задачу, страну и сроки — мы предложим аккуратный маршрут и следующий практический шаг.',
      values: ['Анализ', 'Маршрут', 'Документы', 'Результат'], valueTexts: ['Разбираем ситуацию и видим риски заранее.', 'Выстраиваем последовательность действий без хаоса.', 'Готовим нужный пакет и коммуникацию.', 'Доводим процесс до понятного результата.'],
      steps: ['Заявка', 'Диагностика', 'Стратегия', 'Результат'], stepTexts: ['Фиксируем задачу, страну, сроки и ожидания.', 'Проверяем документы, вводные и доступные варианты.', 'Предлагаем понятный маршрут и приоритеты.', 'Передаём итог, рекомендации и следующий шаг.']
    },
    bg: {
      home: 'Начало', services: 'Услуги', about: 'За нас', blog: 'Блог', reviews: 'Отзиви', b2b: 'B2B оферти', contacts: 'Контакти', allServices: 'Всички услуги',
      consult: 'Получете консултация', all: 'Всички услуги', request: 'Изпрати запитване', route: 'Заявете маршрут', footerSections: 'Раздели', social: 'Социални мрежи', admin: 'Админ панел',
      proof1: 'Персонален анализ', proof1s: 'без шаблони и излишна информация', proof2: 'Документи и маршрут', proof2s: 'ясна последователност от действия', proof3: 'Съдействие', proof3s: 'контрол на комуникацията до резултат',
      strategy: 'Стратегия и помощь', privateRequest: 'Private request', personalRoute: 'Персонален маршрут', personalText: 'Изпратете запитване — ще уточним задачата, страната, сроковете и ще подготвим решение без излишна бюрокрация.',
      valueEyebrow: 'Какво получава клиентът', valueTitle: 'Услугата като ясна система', processEyebrow: 'Как работим', processTitle: 'От запитване до резултат', support: 'Premium support', finalTitle: 'Нужна ли е точна консултация за вашия казус?', finalText: 'Опишете задачата, страната и сроковете — ще предложим точен маршрут и следваща практическа стъпка.',
      values: ['Анализ', 'Маршрут', 'Документи', 'Резултат'], valueTexts: ['Разбираме ситуацията и виждаме рисковете предварително.', 'Изграждаме последователност от действия без хаос.', 'Подготвяме нужния пакет и комуникация.', 'Довеждаме процеса до ясен резултат.'],
      steps: ['Запитване', 'Диагностика', 'Стратегия', 'Резултат'], stepTexts: ['Фиксираме задачата, страната, сроковете и очакванията.', 'Проверяваме документи, входни данни и варианти.', 'Предлагаме ясен маршрут и приоритети.', 'Предаваме резултат, препоръки и следваща стъпка.']
    },
    ka: {
      home: 'მთავარი', services: 'სერვისები', about: 'კომპანიის შესახებ', blog: 'ბლოგი', reviews: 'შეფასებები', b2b: 'B2B შეთავაზებები', contacts: 'კონტაქტები', allServices: 'ყველა სერვისი',
      consult: 'კონსულტაციის მიღება', all: 'ყველა სერვისი', request: 'განაცხადის გაგზავნა', route: 'მარშრუტის მოთხოვნა', footerSections: 'განყოფილებები', social: 'სოციალური ქსელები', admin: 'ადმინ-პანელი',
      proof1: 'პერსონალური ანალიზი', proof1s: 'შაბლონებისა და ზედმეტი ტექსტის გარეშე', proof2: 'დოკუმენტები და მარშრუტი', proof2s: 'მოქმედებების მკაფიო თანმიმდევრობა', proof3: 'სრული მხარდაჭერა', proof3s: 'კომუნიკაციის კონტროლი შედეგამდე',
      strategy: 'სტრატეგია და განხორციელება', privateRequest: 'Private request', personalRoute: 'პერსონალური მარშრუტი', personalText: 'დატოვეთ განაცხადი — დავაზუსტებთ ამოცანას, ქვეყანას, ვადებს და მოვამზადებთ გასაგებ გადაწყვეტას.',
      valueEyebrow: 'რას იღებს კლიენტი', valueTitle: 'სერვისი როგორც გასაგები სისტემა', processEyebrow: 'როგორ ვმუშაობთ', processTitle: 'მოთხოვნიდან შედეგამდე', support: 'Premium support', finalTitle: 'გჭირდებათ ზუსტი კონსულტაცია თქვენს საქმეზე?', finalText: 'მოგვწერეთ ამოცანა, ქვეყანა და ვადები — შემოგთავაზებთ სწორ მარშრუტს და პრაქტიკულ შემდეგ ნაბიჯს.',
      values: ['ანალიზი', 'მარშრუტი', 'დოკუმენტები', 'შედეგი'], valueTexts: ['ვაანალიზებთ სიტუაციას და რისკებს წინასწარ ვხედავთ.', 'ვაგებთ მოქმედებების თანმიმდევრობას ქაოსის გარეშე.', 'ვამზადებთ საჭირო პაკეტსა და კომუნიკაციას.', 'პროცესი მიჰყავს გასაგებ შედეგამდე.'],
      steps: ['განაცხადი', 'დიაგნოსტიკა', 'სტრატეგია', 'მხარდაჭერა', 'შედეგი'], stepTexts: ['ვაფიქსირებთ ამოცანას, ქვეყანას, ვადებს და მოლოდინს.', 'ვამოწმებთ დოკუმენტებს, მონაცემებს და ვარიანტებს.', 'ვთავაზობთ მკაფიო მარშრუტსა და პრიორიტეტებს.', 'ვუძღვებით პროცესსა და კომუნიკაციას.', 'გადმოგცემთ შედეგს, რეკომენდაციებს და შემდეგ ნაბიჯს.']
    },
    en: {
      home: 'Home', services: 'Services', about: 'About', blog: 'Blog', reviews: 'Reviews', b2b: 'B2B Offers', contacts: 'Contacts', allServices: 'All services',
      consult: 'Get a consultation', all: 'All services', request: 'Submit request', route: 'Request a route', footerSections: 'Sections', social: 'Social', admin: 'Admin panel',
      proof1: 'Personal analysis', proof1s: 'without templates or unnecessary noise', proof2: 'Documents and route', proof2s: 'clear sequence of actions', proof3: 'Full support', proof3s: 'communication control until result',
      strategy: 'Strategy and implementation', privateRequest: 'Private request', personalRoute: 'Personal route', personalText: 'Leave a request — we will clarify your task, country and timeline, then prepare a clear solution without unnecessary bureaucracy.',
      valueEyebrow: 'What the client receives', valueTitle: 'The service as a clear system', processEyebrow: 'How we work', processTitle: 'From request to result', support: 'Premium support', finalTitle: 'Need a precise consultation for your case?', finalText: 'Describe the task, country and timing — we will propose a careful route and the next practical step.',
      values: ['Analysis', 'Route', 'Documents', 'Result'], valueTexts: ['We understand the situation and see risks in advance.', 'We build a clean sequence of actions without chaos.', 'We prepare the required package and communication.', 'We guide the process to a clear result.'],
      steps: ['Request', 'Diagnosis', 'Strategy', 'Result'], stepTexts: ['We define the task, country, timeline and expectations.', 'We review documents, inputs and available options.', 'We propose a clear route and priorities.', 'We deliver the result, recommendations and next step.']
    }
  };

  const menuLinks = {
    'services.html': { ru: 'Все услуги', bg: 'Всички услуги', ka: 'ყველა სერვისი', en: 'All services' },
    'service-residence-bulgaria.html': { ru: 'ВНЖ / ПМЖ Болгария', bg: 'Пребиваване в България', ka: 'ბულგარეთის ბინადრობა', en: 'Bulgaria residence' },
    'service-company-registration.html': { ru: 'Регистрация компаний', bg: 'Регистрация на фирми', ka: 'კომპანიების რეგისტრაცია', en: 'Company registration' },
    'service-banks-accounts.html': { ru: 'Банки и счета', bg: 'Банки и сметки', ka: 'ბანკები და ანგარიშები', en: 'Banks and accounts' },
    'uae.html': { ru: 'UAE / Dubai', bg: 'UAE / Dubai', ka: 'UAE / Dubai', en: 'UAE / Dubai' },
    'asia.html': { ru: 'Узбекистан / Азия', bg: 'Узбекистан / Азия', ka: 'უზბეკეთი / აზია', en: 'Uzbekistan / Asia' },
    'service-supplements-registration.html': { ru: 'Регистрация БАДов', bg: 'Регистрация на добавки', ka: 'დანამატების რეგისტრაცია', en: 'Supplements registration' },
    'service-cosmetics-registration.html': { ru: 'Регистрация косметики', bg: 'Регистрация на козметика', ka: 'კოსმეტიკის რეგისტრაცია', en: 'Cosmetics registration' },
    'service-pharma-consulting.html': { ru: 'Фармацевтический консалтинг', bg: 'Фарма консултинг', ka: 'ფარმაცევტული კონსалтინგი', en: 'Pharma consulting' },
    'service-nostrification.html': { ru: 'Нострификация дипломов', bg: 'Нострификация на дипломи', ka: 'დიპლომების აღიარება', en: 'Diploma recognition' },
    'real-estate.html': { ru: 'Недвижимость', bg: 'Имоти', ka: 'უძრავი ქონება', en: 'Real estate' },
    'cars.html': { ru: 'Авто в аренду', bg: 'Авто под наем', ka: 'ავტომობილების გაქირავება', en: 'Cars for rent' },
    'parking.html': { ru: 'Паркинги', bg: 'Паркинги', ka: 'პარკინგები', en: 'Parking' },
    'b2b.html': { ru: 'B2B Offers', bg: 'B2B оферти', ka: 'B2B შეთავაზებები', en: 'B2B Offers' }
  };

  const servicePages = {
    'service-residence-bg': {
      img: 'assets/img/v10/service-residence.webp',
      title: { ru: 'ВНЖ / ПМЖ Болгария', bg: 'Пребиваване / ПМЖ в България', ka: 'ბულგარეთის ბინადრობა / მუდმივი სტატუსი', en: 'Bulgaria residence / permanent residence' },
      subtitle: { ru: 'Основание, документы, подача, продление и персональный маршрут для жизни, семьи и бизнеса в Болгарии.', bg: 'Основание, документи, подаване, продължаване и персонален маршрут за живот, семейство и бизнес в България.', ka: 'საფუძველი, დოკუმენტები, შეტანა, გაგრძელება და პერსონალური მარშრუტი ბულგარეთში ცხოვრებისა და ბიზნესისთვის.', en: 'Grounds, documents, filing, renewal and a personal route for life, family and business in Bulgaria.' },
      h2: { ru: 'Маршрут по статусу без лишней бюрократии', bg: 'Маршрут за статут без излишна бюрокрация', ka: 'სტატუსის მარშრუტი ზედმეტი ბიუროკრატიის გარეშე', en: 'A residence route without unnecessary bureaucracy' },
      intro: { ru: 'Мы помогаем клиенту не просто собрать бумаги, а понять весь путь целиком: какое основание подходит, какие документы действительно нужны, где возможны риски, как подготовиться к подаче и что делать после получения статуса.', bg: 'Помагаме не само със събиране на документи, а с цялостно разбиране на маршрута: основание, пакет, рискове, подаване и следващи действия.', ka: 'ჩვენ არ ვეხმარებით მხოლოდ დოკუმენტების შეგროვებაში — ვაგებთ სრულ მარშრუტს: საფუძველი, საჭირო პაკეტი, რისკები, შეტანა და შემდეგი ნაბიჯები.', en: 'We help the client understand the full route: the correct basis, required documents, possible risks, filing preparation and what to do after status approval.' }
    },
    'service-company-registration-eu': {
      img: 'assets/img/v10/service-company.webp',
      title: { ru: 'Регистрация компаний', bg: 'Регистрация на фирми', ka: 'კომპანიების რეგისტრაცია', en: 'Company registration' },
      subtitle: { ru: 'EООД / OОД, документы, юридический адрес, банковский маршрут, бухгалтерия и запуск компании под ключ.', bg: 'ЕООД / ООД, документи, адрес, банков маршрут, счетоводство и старт на фирма до ключ.', ka: 'EOOD / OOD, დოკუმენტები, იურიდიული მისამართი, საბანკო მარშრუტი, ბუღალტერია და კომპანიის სრული გაშვება.', en: 'EOOD / OOD, documents, legal address, banking route, accounting and turnkey company launch.' },
      h2: { ru: 'Компания как рабочий инструмент, а не просто запись в реестре', bg: 'Фирма като работещ инструмент, а не само запис в регистъра', ka: 'კომპანია როგორც სამუშაო ინსტრუმენტი და არა მხოლოდ რეესტრის ჩანაწერი', en: 'A company as a working tool, not just a registry entry' },
      intro: { ru: 'Регистрация фирмы — это начало бизнес-системы. Мы помогаем подобрать структуру, подготовить документы, организовать подачу, выстроить банковский маршрут и предусмотреть бухгалтерию, налоги и дальнейший операционный старт.', bg: 'Регистрацията е начало на бизнес система. Помагаме със структура, документи, подаване, банков маршрут, счетоводство и реален старт.', ka: 'კომპანიის რეგისტრაცია არის ბიზნეს-სისტემის დასაწყისი. ვეხმარებით სტრუქტურაში, დოკუმენტებში, შეტანაში, ბანკში, ბუღალტერიასა და რეალურ სტარტში.', en: 'Company registration is the start of a business system. We help define structure, prepare documents, file, plan banking, accounting, taxes and operational launch.' }
    },
    'service-banks-accounts': {
      img: 'assets/img/v10/service-banks.webp',
      title: { ru: 'Банки и счета', bg: 'Банки и сметки', ka: 'ბანკები და ანგარიშები', en: 'Banks and accounts' },
      subtitle: { ru: 'Личные и корпоративные счета, KYC / комплаенс, происхождение средств и сопровождение до активации.', bg: 'Лични и фирмени сметки, KYC / комплайънс, произход на средства и съдействие до активация.', ka: 'პირადი და კორპორატიული ანგარიშები, KYC / კომპლაიანსი, თანხების წარმოშობა და მხარდაჭერა აქტივაციამდე.', en: 'Personal and corporate accounts, KYC / compliance, source of funds and support until activation.' },
      h2: { ru: 'Банковский маршрут, подготовленный заранее', bg: 'Банков маршрут, подготвен предварително', ka: 'წინასწარ მომზადებული საბანკო მარშრუტი', en: 'A banking route prepared in advance' },
      intro: { ru: 'Сегодня банк оценивает не только документы, но и общую логику клиента: кто вы, зачем открываете счёт, каков профиль операций и насколько прозрачен источник средств. Мы помогаем подготовиться заранее.', bg: 'Банката оценява не само документите, а целия профил: цел на сметката, операции и произход на средства. Подготвяме това предварително.', ka: 'ბანკი აფასებს არა მხოლოდ დოკუმენტებს, არამედ კლიენტის პროფილს, ანგარიშის მიზანს, ოპერაციებს და თანხების წყაროს. ჩვენ ამას წინასწარ ვამზადებთ.', en: 'The bank evaluates not only documents, but the full profile: who you are, why the account is needed, expected operations and source of funds. We prepare this in advance.' }
    },
    'service-supplements-registration': {
      img: 'assets/img/v10/service-supplements.webp',
      title: { ru: 'Регистрация БАДов', bg: 'Регистрация на добавки', ka: 'დანამატების რეგისტრაცია', en: 'Supplements registration' },
      subtitle: { ru: 'Состав, маркировка, документы и regulatory-маршрут для вывода продукта на рынок.', bg: 'Състав, етикет, документи и регулаторен маршрут за пазарен достъп.', ka: 'შემადგენლობა, ეტიკეტი, დოკუმენტები და რეგულაციური მარშრუტი პროდუქტის ბაზარზე გასაყვანად.', en: 'Formula, labeling, documents and a regulatory route for market entry.' },
      h2: { ru: 'Регуляторный маршрут, понятный бизнесу', bg: 'Регулаторен маршрут, разбираем за бизнеса', ka: 'ბიზნესისთვის გასაგები რეგულაციური მარშრუტი', en: 'A regulatory route that business can understand' },
      intro: { ru: 'Для БАДов важно корректно определить классификацию, проверить состав, подготовить маркировку и понять, какие документы нужны для конкретного рынка.', bg: 'За добавките е важно правилно да се определи класификацията, съставът, етикетът и документите за конкретния пазар.', ka: 'დანამატებისთვის მნიშვნელოვანია სწორი კლასიფიკაცია, შემადგენლობის შემოწმება, ეტიკეტი და კონკრეტული ბაზრისთვის საჭირო დოკუმენტები.', en: 'For supplements it is important to define classification, check formula, prepare labeling and understand which documents are required for the target market.' }
    },
    'service-cosmetics-registration': {
      img: 'assets/img/v10/service-cosmetics.webp',
      title: { ru: 'Регистрация косметики', bg: 'Регистрация на козметика', ka: 'კოსმეტიკის რეგისტრაცია', en: 'Cosmetics registration' },
      subtitle: { ru: 'PIF, safety assessment, INCI, CPNP, private label и сопровождение запуска косметического продукта.', bg: 'PIF, safety assessment, INCI, CPNP, private label и съдействие при пускане на козметика.', ka: 'PIF, safety assessment, INCI, CPNP, private label და კოსმეტიკური პროდუქტის გაშვების მხარდაჭერა.', en: 'PIF, safety assessment, INCI, CPNP, private label and cosmetic product launch support.' },
      h2: { ru: 'Красивый продукт должен быть ещё и правильно оформлен', bg: 'Красивият продукт трябва да бъде и правилно оформен', ka: 'ლამაზი პროდუქტი ასევე სწორად უნდა იყოს оформებული', en: 'A beautiful product must also be properly documented' },
      intro: { ru: 'Косметика требует сочетания regulatory-дисциплины и премиальной коммерческой подачи. Мы помогаем собрать документы, подготовить PIF, safety assessment, INCI, маркировку и маршрут вывода на рынок.', bg: 'Козметиката изисква регулаторна дисциплина и премиум търговско представяне. Помагаме с PIF, safety assessment, INCI, етикет и пазарен маршрут.', ka: 'კოსმეტიკა მოითხოვს რეგულაციურ დისციპლინას და პრემიუმ კომერციულ წარდგენას. ვეხმარებით PIF, safety assessment, INCI, ეტიკეტსა და ბაზარზე გასვლის მარშრუტში.', en: 'Cosmetics require both regulatory discipline and premium commercial presentation. We support documents, PIF, safety assessment, INCI, labeling and the market-entry route.' }
    },
    'service-pharma-consulting': {
      img: 'assets/img/v10/service-pharma.webp',
      title: { ru: 'Фармацевтический консалтинг', bg: 'Фармацевтичен консултинг', ka: 'ფარმაცევტული კონსалтინგი', en: 'Pharmaceutical consulting' },
      subtitle: { ru: 'Регуляторная стратегия, партнёры, досье, GMP / GDP и развитие фармацевтических проектов.', bg: 'Регулаторна стратегия, партньори, досие, GMP / GDP и развитие на фарма проекти.', ka: 'რეგულაციური სტრატეგია, პარტნიორები, დოსიე, GMP / GDP და ფარმა პროექტების განვითარება.', en: 'Regulatory strategy, partners, dossier, GMP / GDP and pharmaceutical project development.' },
      h2: { ru: 'Стратегический и практический подход к фармпроекту', bg: 'Стратегически и практически подход към фарма проект', ka: 'სტრატეგიული და პრაქტიკული მიდგომა ფარმა პროექტისადმი', en: 'A strategic and practical approach to a pharma project' },
      intro: { ru: 'Фармацевтические проекты требуют регуляторики, коммерческой логики, документов, партнёров и понимания рынка. Мы структурируем проект, риски и реалистичный план действий.', bg: 'Фарма проектите изискват регулации, търговска логика, документи, партньори и разбиране на пазара.', ka: 'ფარმა პროექტებს სჭირდება რეგულაციები, კომერციული ლოგიკა, დოკუმენტები, პარტნიორები და ბაზრის გაგება.', en: 'Pharmaceutical projects require regulation, commercial logic, documents, partners and market understanding. We structure the project, risks and a realistic plan.' }
    },
    'service-nostrification': {
      img: 'assets/img/v10/service-diploma.webp',
      title: { ru: 'Нострификация дипломов', bg: 'Нострификация на дипломи', ka: 'დიპლომების აღიარება', en: 'Diploma recognition' },
      subtitle: { ru: 'Признание дипломов для учёбы, работы, медицины и регулируемых профессий с полным сопровождением.', bg: 'Признаване на дипломи за обучение, работа, медицина и регулирани професии.', ka: 'დიპლომების აღიარება სწავლის, მუშაობის, მედიცინისა და რეგულირებადი პროფესიებისთვის.', en: 'Diploma recognition for study, work, medicine and regulated professions with full support.' },
      h2: { ru: 'Признание диплома с пониманием цели клиента', bg: 'Признаване на диплома с разбиране на целта', ka: 'დიპლომის აღიარება კლიენტის მიზნის გათვალისწინებით', en: 'Diploma recognition based on the client’s goal' },
      intro: { ru: 'У нострификации всегда есть цель: поступление, трудоустройство, профессиональная лицензия или продолжение карьеры. Мы начинаем с вашей задачи и под неё выстраиваем маршрут.', bg: 'Нострификацията винаги има цел: обучение, работа, лиценз или кариера. Започваме от задачата и изграждаме маршрут.', ka: 'აღიარებას ყოველთვის აქვს მიზანი: სწავლა, მუშაობა, ლიცენზია ან კარიერა. ვიწყებთ თქვენი ამოცანით და ვაგებთ მარშრუტს.', en: 'Recognition always has a goal: study, work, professional licensing or career development. We start with your goal and build the route around it.' }
    },
    'service-turnkey-consulting': {
      img: 'assets/img/premium/turnkey-consulting.webp',
      title: { ru: 'Консалтинг под ключ', bg: 'Консултинг до ключ', ka: 'კონსალტინგი სრული მხარდაჭერით', en: 'Turnkey consulting' },
      subtitle: { ru: 'Персональная стратегия для жизни, бизнеса, инвестиций и международных задач — от первого запроса до результата.', bg: 'Персонална стратегия за живот, бизнес, инвестиции и международни задачи — от първо запитване до резултат.', ka: 'პერსონალური სტრატეგია ცხოვრების, ბიზნესის, ინვესტიციებისა და საერთაშორისო ამოცანებისთვის — მოთხოვნიდან შედეგამდე.', en: 'A personal strategy for life, business, investments and international tasks — from first request to result.' },
      h2: { ru: 'Когда нужен не совет, а управляемый маршрут', bg: 'Когато е нужен не съвет, а управляем маршрут', ka: 'როცა საჭიროა არა რჩევა, არამედ მართვადი მარშრუტი', en: 'When you need not advice, but a managed route' },
      intro: { ru: 'Эта услуга подходит клиентам, у которых несколько задач одновременно: страна, статус, компания, банк, продукт, недвижимость, партнёры. Мы объединяем всё в одну стратегию.', bg: 'Услугата е за клиенти с няколко задачи едновременно: държава, статут, фирма, банка, продукт, имот и партньори.', ka: 'ეს სერვისი არის კლიენტებისთვის, რომლებსაც ერთდროულად აქვთ რამდენიმე ამოცანა: ქვეყანა, სტატუსი, კომპანია, ბანკი, პროდუქტი, ქონება და პარტნიორები.', en: 'This service is for clients with several tasks at once: country, status, company, bank, product, real estate and partners. We combine everything into one strategy.' }
    },
    'service-international-trade': {
      img: 'assets/img/premium/international-trade.webp',
      title: { ru: 'Международная торговля', bg: 'Международна търговия', ka: 'საერთაშორისო ვაჭრობა', en: 'International trade' },
      subtitle: { ru: 'Удобрения, сырьё, LOI / ICPO, коммерческие предложения, документы, переговоры и логистика для B2B-сделок.', bg: 'Торове, суровини, LOI / ICPO, оферти, документи, преговори и логистика за B2B сделки.', ka: 'სასუქები, ნედლეული, LOI / ICPO, კომერციული შეთავაზებები, დოკუმენტები, მოლაპარაკებები და ლოგისტიკა B2B გარიგებებისთვის.', en: 'Fertilizers, raw materials, LOI / ICPO, commercial offers, documents, negotiations and logistics for B2B deals.' },
      h2: { ru: 'Структурированная B2B-сделка вместо хаотичной переписки', bg: 'Структурирана B2B сделка вместо хаотична кореспонденция', ka: 'სტრუქტურირებული B2B გარიგება ქაოსური переписка-ს ნაცვლად', en: 'A structured B2B deal instead of chaotic correspondence' },
      intro: { ru: 'В международной торговле важны ясный запрос, корректная коммерческая подача, проверенные вводные и понятный маршрут сделки. Мы помогаем оформить оффер, документы и логистику.', bg: 'В международната търговия са важни ясен запитване, правилна оферта, проверени данни и маршрут на сделката.', ka: 'საერთაშორისო ვაჭრობაში მნიშვნელოვანია მკაფიო მოთხოვნა, სწორი კომერციული წარდგენა, შემოწმებული მონაცემები და გარიგების მარშრუტი.', en: 'International trade requires a clear request, proper commercial presentation, verified inputs and a understandable deal route. We support offers, documents and logistics.' }
    }
  };

  const pageHero = {
    services: { title: { ru: 'Глобальные услуги под ключ', bg: 'Международни услуги до ключ', ka: 'საერთაშორისო სერვისები სრული მხარდაჭერით', en: 'International turnkey services' }, text: { ru: 'Полный спектр решений для бизнеса и жизни в Европе, Азии и на Ближнем Востоке. Одна команда — ваш надёжный партнёр на каждом этапе.', bg: 'Пълен спектър решения за бизнес и живот в Европа, Азия и Близкия изток. Един екип — надежден партньор на всеки етап.', ka: 'სრული გადაწყვეტილებები ბიზნესისა და ცხოვრებისათვის ევროპაში, აზიასა და ახლო აღმოსავლეთში. ერთი გუნდი — საიმედო პარტნიორი ყველა ეტაპზე.', en: 'A full spectrum of solutions for business and life across Europe, Asia and the Middle East. One team — your reliable partner at every stage.' } },
    'real-estate': { title: { ru: 'Недвижимость в Болгарии у моря', bg: 'Имоти в България край морето', ka: 'უძრავი ქონება ბულგარეთის ზღვისპირეთში', en: 'Real Estate by the sea in Bulgaria' }, text: { ru: 'Премиальные квартиры и виллы у моря для жизни, отдыха и инвестиций.', bg: 'Премиални апартаменти и вили край морето за живот, почивка и инвестиции.', ka: 'პრემიუმ აპარტამენტები და ვილები ზღვის პირას ცხოვრებისთვის, დასვენებისა და ინვესტიციებისთვის.', en: 'Premium seaside apartments and villas for living, holidays and investments.' } },
    cars: { title: { ru: 'Премиальные автомобили в аренду', bg: 'Премиални автомобили под наем', ka: 'პრემიუმ ავტომობილების გაქირავება', en: 'Premium cars for rent' }, text: { ru: 'Автомобили на день, неделю, месяц, трансфер и авто с водителем для клиентов DIANAFARM GROUP.', bg: 'Автомобили за ден, седмица, месец, трансфер и автомобил с шофьор.', ka: 'ავტომობილები დღით, კვირით, თვიურად, ტრანსფერი და მძღოლით მომსახურება.', en: 'Cars by day, week, month, transfers and chauffeur service for DIANAFARM GROUP clients.' } },
    parking: { title: { ru: 'Паркинги на продажу и в аренду', bg: 'Паркинги за продажба и наем', ka: 'პარკინგები გაყიდვით და ქირით', en: 'Parking for sale and rent' }, text: { ru: 'Паркоместа по номерам, закрытые места, места у моря и в комплексах.', bg: 'Паркоместа по номера, закрити места, места край морето и в комплекси.', ka: 'ნომრიანი პარკინგები, დახურული ადგილები, ზღვისპირა და კომპლექსების პარკინგები.', en: 'Numbered spaces, closed parking, spaces by the sea and in residential complexes.' } },
    uae: { title: { ru: 'Dubai direction: бизнес, лицензии, банки', bg: 'Dubai direction: бизнес, лицензи, банки', ka: 'Dubai direction: ბიზნესი, ლიცენზიები, ბანკები', en: 'Dubai direction: business, licenses, banks' }, text: { ru: 'Регистрация компаний, банковские счета, торговые лицензии и вывод продукции на рынок ОАЭ.', bg: 'Регистрация на фирми, банкови сметки, търговски лицензи и пазарен достъп в ОАЕ.', ka: 'კომპანიების რეგისტრაცია, საბანკო ანგარიშები, სავაჭრო ლიცენზიები და UAE ბაზარზე პროდუქტის გატანა.', en: 'Company registration, bank accounts, trade licenses and UAE market entry.' } },
    asia: { title: { ru: 'Бизнес-контакты с Узбекистаном и Азией', bg: 'Бизнес комуникация с Узбекистан и Азия', ka: 'ბიზნეს-კომუნიკაცია უზბეკეთსა და აზიასთან', en: 'Business communication with Uzbekistan and Asia' }, text: { ru: 'Поиск поставщиков, торговое сопровождение, импорт / экспорт, документы, логистика и деловая переписка.', bg: 'Доставчици, търговско съдействие, импорт / експорт, документи, логистика и кореспонденция.', ka: 'მომწოდებლები, სავაჭრო მხარდაჭერა, იმპორტი / ექსპორტი, დოკუმენტები, ლოგისტიკა და ბიზნეს переписка.', en: 'Supplier search, trade support, import / export, documents, logistics and business correspondence.' } },
    b2b: { title: { ru: 'Международная торговля и B2B предложения', bg: 'Международна търговия и B2B оферти', ka: 'საერთაშორისო ვაჭრობა და B2B შეთავაზებები', en: 'International trade and B2B offers' }, text: { ru: 'Удобрения, косметика, сырьё, LOI / ICPO, документы, логистика и сопровождение сделок.', bg: 'Торове, козметика, суровини, LOI / ICPO, документи, логистика и сделки.', ka: 'სასუქები, კოსმეტიკა, ნედლეული, LOI / ICPO, დოკუმენტები, ლოგისტიკა და გარიგებების მხარდაჭერა.', en: 'Fertilizers, cosmetics, raw materials, LOI / ICPO, documents, logistics and deal support.' } },
    blog: { title: { ru: 'Бизнес-журнал DIANAFARM GROUP', bg: 'Бизнес журнал DIANAFARM GROUP', ka: 'DIANAFARM GROUP ბიზნეს-ჟურნალი', en: 'DIANAFARM GROUP business journal' }, text: { ru: 'Практичные материалы для жизни, бизнеса, инвестиций, Dubai direction и международной торговли.', bg: 'Практични материали за живот, бизнес, инвестиции, Dubai direction и международна търговия.', ka: 'პრაქტიკული მასალები ცხოვრების, ბიზნესის, ინვესტიციების, Dubai direction-ისა და საერთაშორისო ვაჭრობისთვის.', en: 'Practical materials for life, business, investments, Dubai direction and international trade.' } },
    about: { title: { ru: 'DIANAFARM GROUP', bg: 'DIANAFARM GROUP', ka: 'DIANAFARM GROUP', en: 'DIANAFARM GROUP' }, text: { ru: 'Международная экосистема брендов для частных клиентов, производителей, инвесторов и бизнеса.', bg: 'Международна екосистема от брандове за частни клиенти, производители, инвеститори и бизнес.', ka: 'საერთაშორისო ბრენდების ეკოსისტემა კერძო კლიენტებისთვის, მწარმოებლებისთვის, ინვესტორებისა და ბიზნესისთვის.', en: 'An international ecosystem of brands for private clients, producers, investors and businesses.' } },
    contacts: { title: { ru: 'Получить консультацию', bg: 'Получете консултация', ka: 'კონსულტაციის მიღება', en: 'Get a consultation' }, text: { ru: 'Расскажите о вашей задаче — наши эксперты предложат лучшее решение для вашего бизнеса и жизни.', bg: 'Разкажете ни за задачата — нашите експерти ще предложат най-доброто решение.', ka: 'მოგვიყევით ამოცანის შესახებ — ჩვენი ექსპერტები შემოგთავაზებენ საუკეთესო გადაწყვეტას.', en: 'Tell us about your request — our experts will propose the best solution for your business and life.' } }
  };

  function setText(selector, value, root = document) {
    const el = $(selector, root);
    if (el && value) el.textContent = value;
  }

  function setHero(title, text) {
    const titleEl = $('.v9-page-hero__copy h1');
    const textEl = $('.v9-page-hero__copy > p:not(.eyebrow)');
    if (titleEl) {
      const page = document.body.dataset.page;
      const lang = getLang();
      if (page === 'about') {
        titleEl.classList.add('about-title-fit');
        titleEl.setAttribute('data-hard-about-title', 'true');
        titleEl.innerHTML = 'DIANAFARM<br>GROUP';
      } else if (lang === 'ru' && page === 'services') {
        titleEl.innerHTML = '<span class="services-title-v199__lead">Все услуги</span><br><span class="services-title-v199__phrase">Глобальные&nbsp;услуги&nbsp;под&nbsp;ключ</span>';
      } else if (lang === 'ru' && page === 'asia') {
        titleEl.innerHTML = 'Бизнес-контакты<br>с&nbsp;Узбекистаном<br>и&nbsp;АЗИЕЙ';
      } else if (lang === 'ru' && page === 'real-estate') {
        titleEl.innerHTML = '<span>Недвижимость</span><span>В&nbsp;Болгарии</span><span>У&nbsp;моря</span>';
        titleEl.classList.add('realestate-title-v200');
      } else if (lang === 'ru' && page === 'cars') {
        titleEl.innerHTML = 'Премиальные автомобили<br>в&nbsp;аренду';
      } else if (lang === 'ru' && page === 'parking') {
        titleEl.innerHTML = 'Паркинги на продажу<br>и&nbsp;в&nbsp;аренду';
      } else {
        titleEl.innerHTML = esc(title).replace(/\s+/, '<br>');
      }
    }
    if (textEl) textEl.textContent = text;
  }

  function servicePageHTML(cfg) {
    const c = common[getLang()] || common.ru;
    const title = tr(cfg.title);
    const subtitle = tr(cfg.subtitle);
    const h2 = tr(cfg.h2);
    const intro = tr(cfg.intro);
    const values = c.values.map((title, i) => `<article><span>0${i + 1}</span><h3>${esc(title)}</h3><p>${esc(c.valueTexts[i])}</p></article>`).join('');
    const steps = c.steps.map((title, i) => `<article><span>0${i + 1}</span><h3>${esc(title)}</h3><p>${esc(c.stepTexts[i])}</p></article>`).join('');
    return `
      <section class="v9-page-hero v103-service-hero" style="--hero-img:url(${esc(cfg.img)})">
        <div class="v9-page-hero__bg" data-parallax aria-hidden="true"></div>
        <div class="container v9-page-hero__grid v103-hero-grid">
          <div class="v9-page-hero__copy reveal">
            <div class="breadcrumbs"><a href="index.html">${esc(c.home)}</a><span>›</span><a href="services.html">${esc(c.services)}</a><span>›</span><span>${esc(title)}</span></div>
            <p class="eyebrow">DIANAFARM GROUP · premium service</p>
            <h1>${esc(title)}</h1>
            <p>${esc(subtitle)}</p>
            <div class="hero__actions hero__actions--mockup">
              <button class="btn btn--primary" data-open-form="consultation" data-context="${esc(title)}">${esc(c.consult)}</button>
              <a class="btn btn--ghost" href="services.html">${esc(c.all)}</a>
            </div>
          </div>
          <aside class="v103-hero-proof reveal-group"><article><span>01</span><strong>${esc(c.proof1)}</strong><small>${esc(c.proof1s)}</small></article><article><span>02</span><strong>${esc(c.proof2)}</strong><small>${esc(c.proof2s)}</small></article><article><span>03</span><strong>${esc(c.proof3)}</strong><small>${esc(c.proof3s)}</small></article></aside>
        </div>
      </section>
      <section class="section v103-service-detail"><div class="container v10-detail-grid"><article class="v10-detail-panel v103-detail-panel reveal"><p class="eyebrow">${esc(c.strategy)}</p><h2>${esc(h2)}</h2><p>${esc(intro)}</p><ul class="v10-detail-list"><li>${esc(c.values[0])}</li><li>${esc(c.values[1])}</li><li>${esc(c.values[2])}</li><li>${esc(c.values[3])}</li></ul></article><aside class="v10-side-card v103-side-card reveal"><img src="${esc(cfg.img)}" alt="${esc(title)}"><div><span class="eyebrow">${esc(c.privateRequest)}</span><h3>${esc(c.personalRoute)}</h3><p>${esc(c.personalText)}</p><button class="btn btn--primary btn--wide" data-open-form="consultation" data-context="${esc(title)}">${esc(c.request)}</button></div></aside></div></section>
      <section class="section v103-values"><div class="container"><div class="v9-section-row reveal"><div><p class="eyebrow">${esc(c.valueEyebrow)}</p><h2>${esc(c.valueTitle)}</h2></div></div><div class="v103-value-grid reveal-group">${values}</div></div></section>
      <section class="section v103-process-section"><div class="container"><div class="v9-section-row reveal"><div><p class="eyebrow">${esc(c.processEyebrow)}</p><h2>${esc(c.processTitle)}</h2></div></div><div class="v10-process v103-process reveal-group">${steps}</div><div class="v9-wide-contact v103-final-request reveal"><div><span class="eyebrow">${esc(c.support)}</span><h3>${esc(c.finalTitle)}</h3><p>${esc(c.finalText)}</p></div><button class="btn btn--primary" data-open-form="consultation" data-context="${esc(title)}">${esc(c.route)}</button></div></div></section>`;
  }

  function applyMenu() {
    const c = common[getLang()] || common.ru;
    $$('[data-i18n="nav.home"]').forEach((el) => { el.textContent = c.home; });
    $$('[data-i18n="nav.services"]').forEach((el) => { el.textContent = c.services; });
    $$('[data-i18n="nav.about"]').forEach((el) => { el.textContent = c.about; });
    $$('[data-i18n="nav.blog"]').forEach((el) => { el.textContent = c.blog; });
    $$('[data-i18n="nav.reviews"]').forEach((el) => { el.textContent = c.reviews || 'Отзывы'; });
    $$('[data-i18n="nav.contacts"]').forEach((el) => { el.textContent = c.contacts; });
    $$('a[data-nav="b2b"]').forEach((el) => { el.textContent = c.b2b; });
    $$('.nav-dropdown__menu a').forEach((a) => {
      const href = a.getAttribute('href');
      if (menuLinks[href]) a.textContent = tr(menuLinks[href]);
    });
    $$('.site-footer h3').forEach((h3) => {
      if (h3.textContent.trim() === 'Разделы' || h3.textContent.trim() === 'Sections' || h3.textContent.trim() === 'Раздели' || h3.textContent.trim() === 'განყოფილებები') h3.textContent = c.footerSections;
      if (h3.textContent.trim() === 'Social' || h3.textContent.trim() === 'Социални мрежи' || h3.textContent.trim() === 'სოციალური ქსელები') h3.textContent = c.social;
    });
    $$('.footer-admin-link').forEach((a) => { a.textContent = c.admin; });
  }

  function applyHome() {
    const c = common[getLang()] || common.ru;
    const copy = {
      ru: ['Международный консалтинг и бизнес-решения', 'Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.', 'Наши услуги', 'Консультация'],
      bg: ['Международен консалтинг и бизнес решения', 'Вашият надежден партньор за международен бизнес, регистрации, инвестиции и имиграционно съдействие.', 'Нашите услуги', 'Консултация'],
      ka: ['საერთაშორისო კონსალტინგი და ბიზნეს-გადაწყვეტილებები', 'თქვენი საიმედო პარტნიორი საერთაშორისო ბიზნესში, რეგისტრაციებში, ინვესტიციებსა და იმიგრაციულ მხარდაჭერაში.', 'ჩვენი სერვისები', 'კონსულტაცია'],
      en: ['International consulting and business solutions', 'Your trusted partner in international business, registrations, investments and immigration support.', 'Our services', 'Consultation']
    }[getLang()] || [];
    setText('.hero__eyebrow', copy[0]);
    setText('.hero__lead', copy[1]);
    const actions = $$('.hero__actions--mockup .btn', $('.hero--landing'));
    if (actions[0]) actions[0].textContent = copy[2];
    if (actions[1]) actions[1].textContent = copy[3];
    const trust = $$('.hero-feature');
    const trustText = {
      ru: [['Надёжность и конфиденциальность','Гарантируем безопасность данных и полную конфиденциальность.'], ['Международный опыт','Болгария, ЕС, ОАЭ, Узбекистан и Азия.'], ['Комплексный подход','Решаем задачи любой сложности под ключ.']],
      bg: [['Надеждност и конфиденциалност','Гарантираме сигурност на данните и пълна конфиденциалност.'], ['Международен опит','България, ЕС, ОАЕ, Узбекистан и Азия.'], ['Комплексен подход','Решаваме сложни задачи до ключ.']],
      ka: [['საიმედოობა და კონფიდენციალურობა','ვიცავთ მონაცემებს და უზრუნველვყოფთ სრულ კონფიდენციალურობას.'], ['საერთაშორისო გამოცდილება','ბულგარეთი, EU, UAE, უზბეკეთი და აზია.'], ['კომპლექსური მიდგომა','ვწყვეტთ რთულ ამოცანებს სრული მხარდაჭერით.']],
      en: [['Reliability and confidentiality','We protect your data and ensure full confidentiality.'], ['International experience','Bulgaria, EU, UAE, Uzbekistan and Asia.'], ['Integrated approach','Turnkey solutions for complex tasks.']]
    }[getLang()] || [];
    trust.forEach((el, i) => { if (trustText[i]) { setText('strong', trustText[i][0], el); setText('p', trustText[i][1], el); } });
    setText('.section--v9-home-services .section-head .eyebrow', {ru:'Наши услуги', bg:'Нашите услуги', ka:'ჩვენი სერვისები', en:'Our services'}[getLang()]);
    setText('.section--v9-home-services .section-head h2', {ru:'Комплексные решения для вашего бизнеса и жизни', bg:'Комплексни решения за вашия бизнес и живот', ka:'კომპლექსური გადაწყვეტილებები თქვენი ბიზნესისა და ცხოვრებისათვის', en:'Integrated solutions for your business and life'}[getLang()]);
    $$('.services-all-btn a').forEach((a) => { a.textContent = c.allServices; });
  }


  function applyPremiumCopy() {
    const lang = getLang();
    const c = common[lang] || common.ru;
    const staticCopy = {
      ru: {
        process: [['01','Заявка','Вы оставляете запрос на консультацию.'],['02','Анализ','Мы анализируем вашу ситуацию и цели.'],['03','Решение','Предлагаем оптимальную стратегию.'],['04','Результат','Вы получаете результат и поддержку.']],
        whyTitle: 'Почему выбирают DIANAFARM GROUP', whyItems: ['Профессионализм','Индивидуальный подход','Прозрачность','Поддержка 24/7'], finalTitle: 'Готовы начать?', finalText: 'Получите персональную консультацию и узнайте, какое решение подходит именно вам.', popular: 'Популярные', request: 'Получить консультацию', allObjects: 'Смотреть все объекты →', realEstatePick: 'Подбор недвижимости', realEstateTitle: 'Подборка недвижимости у моря', locationTitle: 'Популярные локации на побережье', contactExpert: 'Связаться с экспертом', socialTitle: 'Мы в социальных сетях', socialText: 'TikTok, Instagram, Facebook и активные аккаунты брендов DIANAFARM GROUP.', offices: 'Наши офисы и контакты', leaveRequest: 'Оставьте заявку — мы подготовим персональное решение', confidential: 'Конфиденциально. Ответим в ближайшее рабочее время.'
      },
      bg: {
        process: [['01','Запитване','Оставяте заявка за консултация.'],['02','Анализ','Анализираме ситуацията и целите ви.'],['03','Решение','Предлагаме оптимална стратегия.'],['04','Резултат','Получавате резултат и подкрепа.']],
        whyTitle: 'Защо избират DIANAFARM GROUP', whyItems: ['Професионализъм','Индивидуален подход','Прозрачност','Подкрепа 24/7'], finalTitle: 'Готови ли сте да започнете?', finalText: 'Получете персонална консултация и разберете кое решение е подходящо за вас.', popular: 'Популярни', request: 'Получете консултация', allObjects: 'Вижте всички обекти →', realEstatePick: 'Подбор на имоти', realEstateTitle: 'Подборка имоти край морето', locationTitle: 'Популярни локации по крайбрежието', contactExpert: 'Свържете се с експерт', socialTitle: 'Ние в социалните мрежи', socialText: 'TikTok, Instagram, Facebook и активните профили на DIANAFARM GROUP.', offices: 'Нашите офиси и контакти', leaveRequest: 'Оставете заявка — ще подготвим персонално решение', confidential: 'Конфиденциално. Ще отговорим в най-близкото работно време.'
      },
      ka: {
        process: [['01','მოთხოვნა','ტოვებთ კონსულტაციის მოთხოვნას.'],['02','ანალიზი','ვ აანალიზებთ თქვენს სიტუაციასა და მიზნებს.'],['03','გადაწყვეტა','გთავაზობთ ოპტიმალურ სტრატეგიას.'],['04','შედეგი','იღებთ შედეგსა და მხარდაჭერას.']],
        whyTitle: 'რატომ ირჩევენ DIANAFARM GROUP-ს', whyItems: ['პროფესიონალიზმი','ინდივიდუალური მიდგომა','გამჭვირვალობა','მხარდაჭერა 24/7'], finalTitle: 'მზად ხართ დასაწყებად?', finalText: 'მიიღეთ პერსონალური კონსულტაცია და გაიგეთ, რომელი გადაწყვეტა შეესაბამება თქვენ.', popular: 'პოპულარული', request: 'კონსულტაციის მიღება', allObjects: 'ყველა ობიექტის ნახვა →', realEstatePick: 'უძრავი ქონების შერჩევა', realEstateTitle: 'ზღვისპირა უძრავი ქონების შერჩევა', locationTitle: 'პოპულარული ლოკაციები სანაპიროზე', contactExpert: 'ექსპერტთან დაკავშირება', socialTitle: 'ჩვენ სოციალურ ქსელებში', socialText: 'TikTok, Instagram, Facebook და DIANAFARM GROUP-ის აქტიური ანგარიშები.', offices: 'ჩვენი ოფისები და კონტაქტები', leaveRequest: 'დატოვეთ მოთხოვნა — მოვამზადებთ პერსონალურ გადაწყვეტას', confidential: 'კონფიდენციალურად. გიპასუხებთ უახლოეს სამუშაო დროს.'
      },
      en: {
        process: [['01','Request','You leave a consultation request.'],['02','Analysis','We analyse your situation and goals.'],['03','Solution','We propose the optimal strategy.'],['04','Result','You receive the result and support.']],
        whyTitle: 'Why clients choose DIANAFARM GROUP', whyItems: ['Professionalism','Individual approach','Transparency','24/7 support'], finalTitle: 'Ready to start?', finalText: 'Get a personal consultation and see which solution fits your case.', popular: 'Popular', request: 'Get a consultation', allObjects: 'View all properties →', realEstatePick: 'Property selection', realEstateTitle: 'Seaside property selection', locationTitle: 'Popular coastal locations', contactExpert: 'Contact an expert', socialTitle: 'We are on social media', socialText: 'TikTok, Instagram, Facebook and active DIANAFARM GROUP brand accounts.', offices: 'Our offices and contacts', leaveRequest: 'Leave a request — we will prepare a personal solution', confidential: 'Confidential. We will reply during the nearest business hours.'
      }
    }[lang] || {};

    const processArticles = $$('.v8-process article');
    processArticles.forEach((article, i) => {
      const row = staticCopy.process?.[i];
      if (!row) return;
      setText('span', row[0], article); setText('strong', row[1], article); setText('p', row[2], article);
    });
    setText('.v9-why-cta article:first-child h3', staticCopy.whyTitle);
    $$('.v9-why-cta .v9-mini-columns span').forEach((el, i) => { if (staticCopy.whyItems?.[i]) el.textContent = staticCopy.whyItems[i]; });
    setText('.v9-final-cta h3', staticCopy.finalTitle);
    setText('.v9-final-cta p', staticCopy.finalText);
    $$('.v9-final-cta button, .v9-wide-contact button').forEach((el) => { if (el.textContent.trim().match(/консульта|consult|запит|კონსულტ/i)) el.textContent = staticCopy.request; });
    setText('.v9-view-tools span', staticCopy.popular);
    setText('.section--v9-realestate-list .v9-section-row .eyebrow', staticCopy.realEstatePick);
    setText('.section--v9-realestate-list .v9-section-row h2', staticCopy.realEstateTitle);
    const allLink = $('.section--v9-realestate-list .v9-section-row .text-link'); if (allLink) allLink.textContent = staticCopy.allObjects;
    setText('.section--v9-locations .v9-section-row h2', staticCopy.locationTitle);
    const expertBtn = $('.section--v9-locations .v9-wide-contact .btn'); if (expertBtn) expertBtn.textContent = staticCopy.contactExpert;
    setText('.v81-form-intro h3', staticCopy.leaveRequest);
    setText('.v81-form-intro p', staticCopy.confidential);
    setText('.contact-column .eyebrow', staticCopy.offices);
    setText('.section--v9-socials h2', staticCopy.socialTitle);
    setText('.section--v9-socials p:not(.eyebrow)', staticCopy.socialText);
    $$('#formTabs .tab').forEach((tab) => {
      const key = tab.dataset.formTab;
      const labels = {
        consultation: {ru:'Консультация', bg:'Консултация', ka:'კონსულტაცია', en:'Consultation'},
        realEstate: {ru:'Недвижимость', bg:'Имоти', ka:'უძრავი ქონება', en:'Real estate'},
        car: {ru:'Авто', bg:'Авто', ka:'ავტო', en:'Cars'}
      };
      if (labels[key]) tab.textContent = labels[key][lang] || labels[key].ru;
    });
  }

  function applyTopPage() {
    const page = document.body.dataset.page || 'home';
    if (page === 'home') applyHome();
    const hero = pageHero[page];
    if (hero) setHero(tr(hero.title), tr(hero.text));
  }

  function renderServicePage() {
    const page = document.body.dataset.page;
    const cfg = servicePages[page];
    const main = $('#mainContent');
    if (!cfg || !main) return;
    const key = `${page}:${getLang()}`;
    if (main.dataset.v105Key === key) return;
    main.innerHTML = servicePageHTML(cfg);
    main.dataset.v105Key = key;
  }

  let busy = false;
  function applyV105() {
    if (busy) return;
    busy = true;
    try {
      document.documentElement.lang = getLang();
      applyMenu();
      applyTopPage();
      renderServicePage();
      applyPremiumCopy();
    } finally {
      busy = false;
    }
  }

  function scheduleApply() {
    window.setTimeout(applyV105, 0);
    window.setTimeout(applyV105, 120);
  }

  document.addEventListener('DOMContentLoaded', scheduleApply);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-lang]')) scheduleApply();
  }, true);
  window.addEventListener('storage', (event) => {
    if (event.key === 'dfg_lang') scheduleApply();
  });
  const observer = new MutationObserver(() => {
    if (!busy) window.clearTimeout(observer._timer);
    observer._timer = window.setTimeout(applyV105, 80);
  });
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleApply();
})();
