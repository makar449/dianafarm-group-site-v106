(function () {
  'use strict';

  var LANG_KEY = 'dfg_lang';
  var running = false;
  var lastSignature = '';

  var common = {
    bg: {
      'Главная':'Начало','Услуги':'Услуги','Все услуги':'Всички услуги','ВНЖ / ПМЖ Болгария':'ВНЖ / ПМЖ България','Регистрация компаний':'Регистрация на компании','Банки и счета':'Банки и сметки','Узбекистан / Азия':'Узбекистан / Азия','Регистрация БАДов':'Регистрация на добавки','Регистрация косметики':'Регистрация на козметика','Фармацевтический консалтинг':'Фармацевтичен консалтинг','Нострификация дипломов':'Нострификация на дипломи','Недвижимость':'Имоти','Международная торговля':'Международна търговия','О компании':'За компанията','Блог':'Блог','Отзывы':'Отзиви','Контакты':'Контакти','Связаться с нами':'Свържете се с нас','Получить консультацию':'Получете консултация','Консультация':'Консултация','Смотреть все услуги':'Вижте всички услуги','Оставить заявку':'Оставете заявка','Запросить маршрут':'Заявете маршрут','Контакты':'Контакти','Разделы':'Раздели','Сделано компанией':'Изработено от','Мы используем cookies для корректной работы сайта и аналитики.':'Използваме cookies за коректна работа на сайта и аналитика.','Ок':'ОК',
      'Международный консалтинг и бизнес-решения':'Международен консалтинг и бизнес решения','Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.':'Ваш надежден партньор в международния бизнес, регистрациите, инвестициите и имиграционното право.','Надёжность и конфиденциальность':'Надеждност и конфиденциалност','Гарантируем безопасность данных и полную конфиденциальность.':'Гарантираме сигурност на данните и пълна конфиденциалност.','Гарантируем безопасность ваших данных и полную конфиденциальность.':'Гарантираме сигурност на вашите данни и пълна конфиденциалност.','Международный опыт':'Международен опит','Болгария, ЕС, ОАЭ, Узбекистан и Азия.':'България, ЕС, ОАЕ, Узбекистан и Азия.','Комплексный подход':'Комплексен подход','Решаем задачи любой сложности под ключ.':'Решаваме задачи с всякаква сложност до ключ.','Ключевые направления':'Ключови направления','ВНЖ / ПМЖ':'ВНЖ / ПМЖ','Банки':'Банки','Азия':'Азия','Фармацевтика':'Фармация','Наши услуги':'Нашите услуги','Комплексные решения для вашего бизнеса и жизни':'Комплексни решения за вашия бизнес и живот','Почему выбирают DIANAFARM GROUP':'Защо избират DIANAFARM GROUP','Профессионализм':'Професионализъм','Индивидуальный подход':'Индивидуален подход','Прозрачность':'Прозрачност','Поддержка 24/7':'Поддръжка 24/7','Готовы начать?':'Готови ли сте да започнете?','Получите персональную консультацию и узнайте, какое решение подходит именно вам.':'Получете персонална консултация и разберете кое решение е подходящо за вас.',
      'Что говорят клиенты':'Какво казват клиентите','Отзывы клиентов':'Отзиви на клиенти','Документы без хаоса':'Документи без хаос','Бизнес и банки':'Бизнес и банки','Международный контур':'Международен контур','ВНЖ / ПМЖ':'ВНЖ / ПМЖ','Клиент по ВНЖ / ПМЖ':'Клиент по ВНЖ / ПМЖ','Болгария':'България','Помогли выстроить маршрут, документы и коммуникацию без лишних шагов. Всё было понятно по срокам и ответственности.':'Помогнаха да изградим маршрут, документи и комуникация без излишни стъпки. Всичко беше ясно по срокове и отговорности.','Диагностика':'Диагностика','Проверяем документы, вводные и доступные варианты.':'Проверяваме документи, данни и достъпни варианти.','Маршрут':'Маршрут','Контроль':'Контрол','Результат':'Резултат','Стратегия':'Стратегия','Документы':'Документи','Регистрация':'Регистрация','Банк и старт':'Банка и старт','Компания и лицензия':'Компания и лиценз','Банковский профиль':'Банков профил','Запуск бизнеса':'Стартиране на бизнес','Маршрут запуска в ОАЭ':'Маршрут за старт в ОАЕ','Ваш мост между ЕС, ОАЭ и Азией':'Вашият мост между ЕС, ОАЕ и Азия',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.':'Платформа за консалтинг, имоти, фармация, козметика и международен бизнес.','Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.':'Платформа за консалтинг, имоти, автомобили, паркинги, фармация, козметика и международен бизнес.','Авто':'Авто','Паркинги':'Паркинги','categories.cars':'Автомобили','categories.parking':'Паркинги','categories.business':'Бизнес'
    },
    en: {
      'Главная':'Home','Услуги':'Services','Все услуги':'All services','ВНЖ / ПМЖ Болгария':'Bulgaria residence','Регистрация компаний':'Company registration','Банки и счета':'Banks and accounts','Узбекистан / Азия':'Uzbekistan / Asia','Регистрация БАДов':'Supplement registration','Регистрация косметики':'Cosmetics registration','Фармацевтический консалтинг':'Pharma consulting','Нострификация дипломов':'Diploma recognition','Недвижимость':'Real estate','Международная торговля':'International trade','О компании':'About','Блог':'Blog','Отзывы':'Reviews','Контакты':'Contacts','Связаться с нами':'Contact us','Получить консультацию':'Get a consultation','Консультация':'Consultation','Смотреть все услуги':'View all services','Оставить заявку':'Send request','Запросить маршрут':'Request a route','Разделы':'Sections','Сделано компанией':'Built by','Мы используем cookies для корректной работы сайта и аналитики.':'We use cookies for site functionality and analytics.','Ок':'OK',
      'Международный консалтинг и бизнес-решения':'International consulting and business solutions','Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.':'Your reliable partner for international business, registrations, investments and immigration support.','Надёжность и конфиденциальность':'Reliability and confidentiality','Гарантируем безопасность данных и полную конфиденциальность.':'We ensure data security and full confidentiality.','Гарантируем безопасность ваших данных и полную конфиденциальность.':'We ensure your data security and full confidentiality.','Международный опыт':'International experience','Болгария, ЕС, ОАЭ, Узбекистан и Азия.':'Bulgaria, EU, UAE, Uzbekistan and Asia.','Комплексный подход':'Integrated approach','Решаем задачи любой сложности под ключ.':'We handle complex tasks turnkey.','Ключевые направления':'Key directions','ВНЖ / ПМЖ':'Residence','Банки':'Banks','Азия':'Asia','Фармацевтика':'Pharma','Наши услуги':'Our services','Комплексные решения для вашего бизнеса и жизни':'Complete solutions for business and life','Почему выбирают DIANAFARM GROUP':'Why clients choose DIANAFARM GROUP','Профессионализм':'Professionalism','Индивидуальный подход':'Personal approach','Прозрачность':'Transparency','Поддержка 24/7':'24/7 support','Готовы начать?':'Ready to start?','Получите персональную консультацию и узнайте, какое решение подходит именно вам.':'Get a personal consultation and see which solution fits your case.',
      'Что говорят клиенты':'What clients say','Отзывы клиентов':'Client reviews','Документы без хаоса':'Documents without chaos','Бизнес и банки':'Business and banking','Международный контур':'International route','Клиент по ВНЖ / ПМЖ':'Residence client','Болгария':'Bulgaria','Помогли выстроить маршрут, документы и коммуникацию без лишних шагов. Всё было понятно по срокам и ответственности.':'They helped build the route, documents and communication without unnecessary steps. Timing and responsibilities were clear.','Диагностика':'Diagnostics','Проверяем документы, вводные и доступные варианты.':'We check documents, inputs and available options.','Маршрут':'Route','Контроль':'Control','Результат':'Result','Стратегия':'Strategy','Документы':'Documents','Регистрация':'Registration','Банк и старт':'Bank and launch','Компания и лицензия':'Company and license','Банковский профиль':'Banking profile','Запуск бизнеса':'Business launch','Маршрут запуска в ОАЭ':'UAE launch route','Ваш мост между ЕС, ОАЭ и Азией':'Your bridge between the EU, UAE and Asia',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.':'A platform for consulting, real estate, pharmaceuticals, cosmetics and international business.','Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.':'A platform for consulting, real estate, cars, parking, pharmaceuticals, cosmetics and international business.','Авто':'Cars','Паркинги':'Parking','categories.cars':'Cars','categories.parking':'Parking','categories.business':'Business'
    },
    ka: {
      'Главная':'მთავარი','Услуги':'სერვისები','Все услуги':'ყველა სერვისი','ВНЖ / ПМЖ Болгария':'ბინადრობა ბულგარეთში','Регистрация компаний':'კომპანიის რეგისტრაცია','Банки и счета':'ბანკები და ანგარიშები','Узбекистан / Азия':'უზბეკეთი / აზია','Регистрация БАДов':'დანამატების რეგისტრაცია','Регистрация косметики':'კოსმეტიკის რეგისტრაცია','Фармацевтический консалтинг':'ფარმა კონსალტინგი','Нострификация дипломов':'დიპლომის აღიარება','Недвижимость':'უძრავი ქონება','Международная торговля':'საერთაშორისო ვაჭრობა','О компании':'კომპანიის შესახებ','Блог':'ბლოგი','Отзывы':'შეფასებები','Контакты':'კონტაქტები','Связаться с нами':'დაგვიკავშირდით','Получить консультацию':'კონსულტაციის მიღება','Консультация':'კონსულტაცია','Смотреть все услуги':'ყველა სერვისი','Оставить заявку':'განაცხადის დატოვება','Запросить маршрут':'მარშრუტის მოთხოვნა','Разделы':'განყოფილებები','Сделано компанией':'შექმნილია კომპანიის მიერ','Мы используем cookies для корректной работы сайта и аналитики.':'საიტის მუშაობისა და ანალიტიკისთვის ვიყენებთ cookies.','Ок':'კარგი',
      'Международный консалтинг и бизнес-решения':'საერთაშორისო კონსალტინგი და ბიზნეს გადაწყვეტილებები','Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.':'თქვენი საიმედო პარტნიორი საერთაშორისო ბიზნესში, რეგისტრაციებში, ინვესტიციებსა და იმიგრაციის მხარდაჭერაში.','Надёжность и конфиденциальность':'საიმედოობა და კონფიდენციალურობა','Гарантируем безопасность данных и полную конфиденциальность.':'ვუზრუნველყოფთ მონაცემების უსაფრთხოებას და სრულ კონფიდენციალურობას.','Гарантируем безопасность ваших данных и полную конфиденциальность.':'ვუზრუნველყოფთ თქვენი მონაცემების უსაფრთხოებას და სრულ კონფიდენციალურობას.','Международный опыт':'საერთაშორისო გამოცდილება','Болгария, ЕС, ОАЭ, Узбекистан и Азия.':'ბულგარეთი, ЕС, UAE, უზბეკეთი და აზია.','Комплексный подход':'კომპლექსური მიდგომა','Решаем задачи любой сложности под ключ.':'ვწყვეტთ რთულ ამოცანებს სრული მხარდაჭერით.','Ключевые направления':'ძირითადი მიმართულებები','ВНЖ / ПМЖ':'ბინადრობა','Банки':'ბანკები','Азия':'აზია','Фармацевтика':'ფარმა','Наши услуги':'ჩვენი სერვისები','Комплексные решения для вашего бизнеса и жизни':'კომპლექსური გადაწყვეტილებები ბიზნესისა და ცხოვრებისთვის','Почему выбирают DIANAFARM GROUP':'რატომ ირჩევენ DIANAFARM GROUP-ს','Профессионализм':'პროფესიონალიზმი','Индивидуальный подход':'ინდივიდუალური მიდგომა','Прозрачность':'გამჭვირვალობა','Поддержка 24/7':'24/7 მხარდაჭერა','Готовы начать?':'მზად ხართ დასაწყებად?','Получите персональную консультацию и узнайте, какое решение подходит именно вам.':'მიიღეთ პერსონალური კონსულტაცია და გაიგეთ, რომელი გადაწყვეტა შეესაბამება თქვენს შემთხვევას.',
      'Что говорят клиенты':'რას ამბობენ კლიენტები','Отзывы клиентов':'კლიენტების შეფასებები','Документы без хаоса':'დოკუმენტები ქაოსის გარეშე','Бизнес и банки':'ბიზნესი და ბანკები','Международный контур':'საერთაშორისო მარშრუტი','Клиент по ВНЖ / ПМЖ':'ბინადრობის კლიენტი','Болгария':'ბულგარეთი','Помогли выстроить маршрут, документы и коммуникацию без лишних шагов. Всё было понятно по срокам и ответственности.':'დაგვეხმარნენ მარშრუტის, დოკუმენტებისა და კომუნიკაციის დალაგებაში ზედმეტი ნაბიჯების გარეშე. ვადები და პასუხისმგებლობა გასაგები იყო.','Диагностика':'დიაგნოსტიკა','Проверяем документы, вводные и доступные варианты.':'ვამოწმებთ დოკუმენტებს, მონაცემებს და ხელმისაწვდომ ვარიანტებს.','Маршрут':'მარშრუტი','Контроль':'კონტროლი','Результат':'შედეგი','Стратегия':'სტრატეგია','Документы':'დოკუმენტები','Регистрация':'რეგისტრაცია','Банк и старт':'ბანკი და სტარტი','Компания и лицензия':'კომპანია და ლიცენზია','Банковский профиль':'საბანკო პროფილი','Запуск бизнеса':'ბიზნესის გაშვება','Маршрут запуска в ОАЭ':'UAE გაშვების მარშრუტი','Ваш мост между ЕС, ОАЭ и Азией':'თქვენი ხიდი ЕС-ს, UAE-სა და აზიას შორის',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.':'კონსალტინგის, უძრავი ქონების, ფარმაციის, კოსმეტიკისა და საერთაშორისო ბიზნესის პლატფორმა.','Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.':'კონსალტინგის, უძრავი ქონების, ავტომობილების, პარკინგის, ფარმაციის, კოსმეტიკისა და საერთაშორისო ბიზნესის პლატფორმა.','Авто':'ავტო','Паркинги':'პარკინგი','categories.cars':'ავტომობილები','categories.parking':'პარკინგი','categories.business':'ბიზნესი'
    }
  };

  var pageCopy = {
    home: {
      bg: ['DIANAFARM GROUP','Вашият надежден партньор за международен бизнес, регистрации, инвестиции и имиграционно право.'],
      en: ['DIANAFARM GROUP','Your reliable partner for international business, registrations, investments and immigration support.'],
      ka: ['DIANAFARM GROUP','თქვენი საიმედო პარტნიორი საერთაშორისო ბიზნესში, რეგისტრაციებში, ინვესტიციებსა და იმიგრაციის მხარდაჭერაში.']
    },
    reviews: {
      bg: ['Какво казват клиентите\nDIANAFARM GROUP','Кратки реални отзиви за документи, срокове, комуникация и резултат.'],
      en: ['What clients say\nabout DIANAFARM GROUP','Short real reviews about documents, timing, communication and results.'],
      ka: ['რას ამბობენ კლიენტები\nDIANAFARM GROUP-ზე','მოკლე შეფასებები დოკუმენტებზე, ვადებზე, კომუნიკაციასა და შედეგზე.']
    },
    services: {
      bg: ['Глобални услуги до ключ','Пълен набор от решения за бизнес и живот в Европа, Азия и Близкия изток.'],
      en: ['Global turnkey services','A complete set of solutions for business and life across Europe, Asia and the Middle East.'],
      ka: ['გლობალური სერვისები სრული მხარდაჭერით','სრული გადაწყვეტილებები ბიზნესისა და ცხოვრებისათვის ევროპაში, აზიასა და ახლო აღმოსავლეთში.']
    },
    uae: {
      bg: ['UAE / Dubai direction','Бизнес в Дубай: компании, лицензи, банки, compliance, търговски процеси и старт до ключ.'],
      en: ['UAE / Dubai direction','Business in Dubai: company setup, licenses, banking, compliance, trade processes and turnkey launch.'],
      ka: ['UAE / Dubai მიმართულება','ბიზნესი დუბაიში: კომპანიები, ლიცენზიები, ბანკები, compliance, სავაჭრო პროცესები და სრული გაშვება.']
    },
    asia: {
      bg: ['Бизнес контакти\nс Узбекистан и Азия','Доставчици, импорт / експорт, документи, логистика, бизнес кореспонденция и съпровождане.'],
      en: ['Business contacts\nwith Uzbekistan and Asia','Suppliers, import / export, documents, logistics, business correspondence and trade support.'],
      ka: ['ბიზნეს კონტაქტები\nუზბეკეთსა და აზიაში','მომწოდებლები, იმპორტი / ექსპორტი, დოკუმენტები, ლოგისტიკა და ბიზნეს კომუნიკაცია.']
    },
    about: {
      bg: ['DIANAFARM GROUP','Международна екосистема от брандове за частни клиенти, производители, инвеститори и бизнес.'],
      en: ['DIANAFARM GROUP','An international brand ecosystem for private clients, producers, investors and businesses.'],
      ka: ['DIANAFARM GROUP','საერთაშორისო ბრენდების ეკოსისტემა კერძო კლიენტებისთვის, მწარმოებლებისთვის, ინვესტორებისა და ბიზნესისთვის.']
    },
    contacts: {
      bg: ['Получете\nконсултация','Опишете задачата си — ще подготвим ясен маршрут по срокове, документи и следваща стъпка.'],
      en: ['Get a\nconsultation','Describe your request — we will build a clear route by timing, documents and next step.'],
      ka: ['მიიღეთ\nკონსულტაცია','აღწერეთ თქვენი ამოცანა — მოვამზადებთ გასაგებ მარშრუტს ვადებით, დოკუმენტებით და შემდეგი ნაბიჯით.']
    }
  };

  function getLang() {
    var active = document.querySelector('.lang-btn.active');
    return (active && active.dataset.lang) || localStorage.getItem(LANG_KEY) || document.documentElement.lang || 'ru';
  }

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) return true;
    var p = node.parentElement;
    return /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/i.test(p.tagName) || p.closest('script,style,noscript,textarea,input,select,option,svg');
  }

  function replaceExactText(lang) {
    var map = common[lang];
    if (!map) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
        var value = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var raw = String(node.nodeValue || '');
      var key = raw.replace(/\s+/g, ' ').trim();
      if (map[key]) {
        node.nodeValue = raw.replace(key, map[key]);
      }
    });
  }

  function translateStaticBySelector(lang) {
    var map = common[lang] || {};
    document.querySelectorAll('.nav-dropdown__menu a,.main-nav a,.footer-grid h3,.footer-grid a,.wow-home-rail span,.reviews-hero__meta span,.filter-btn,.premium-filter__button,.service-card__meta,.btn,.header-contact').forEach(function (el) {
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (map[txt]) el.textContent = map[txt];
    });
  }

  function applyPageCopy(lang) {
    if (lang === 'ru') return;
    var page = document.body && document.body.dataset ? document.body.dataset.page : '';
    var copy = pageCopy[page] && pageCopy[page][lang];
    if (!copy) return;
    var heroTitle = document.querySelector('.hero__copy h1,.v9-page-hero__copy h1,.reviews-hero__copy h1');
    var heroText = document.querySelector('.hero__lead,.v9-page-hero__copy p:not(.eyebrow),.reviews-hero__copy p:not(.eyebrow)');
    if (heroTitle) heroTitle.innerHTML = copy[0].split('\n').map(escapeHtml).join('<br>');
    if (heroText) heroText.textContent = copy[1];
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); });
  }

  function fallbackRussianCleanup(lang) {
    if (lang !== 'en' && lang !== 'ka') return;
    var generic = {
      en: {
        h: 'International support',
        p: 'Personal route, documents, communication and practical support without unnecessary steps.',
        btn: 'Get a consultation'
      },
      ka: {
        h: 'საერთაშორისო მხარდაჭერა',
        p: 'პერსონალური მარშრუტი, დოკუმენტები, კომუნიკაცია და პრაქტიკული მხარდაჭერა ზედმეტი ნაბიჯების გარეშე.',
        btn: 'კონსულტაციის მიღება'
      }
    }[lang];
    document.querySelectorAll('main h1, main h2, main h3, main p, main button.btn, main a.btn').forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (!/[А-Яа-яЁё]{2,}/.test(text)) return;
      if (common[lang] && common[lang][text]) return;
      if (el.matches('button.btn,a.btn')) el.textContent = generic.btn;
      else if (el.matches('h1,h2,h3')) el.textContent = generic.h;
      else if (text.length > 35) el.textContent = generic.p;
    });
  }

  function fixReviews() {
    document.querySelectorAll('.reviews-vertical,.reviews-vertical--premium').forEach(function (slider) {
      var cards = Array.prototype.slice.call(slider.querySelectorAll('.review-card'));
      if (!cards.length) {
        slider.innerHTML = '<article class="review-card is-active"><div class="review-card__top"><span class="review-card__badge">DIANAFARM</span><span class="review-card__rating">★★★★★</span></div><p>Помогли выстроить маршрут, документы и коммуникацию без лишних шагов. Всё было понятно по срокам и ответственности.</p><div class="review-card__footer"><strong>Клиент по ВНЖ / ПМЖ</strong><span>Болгария</span></div></article>';
        cards = Array.prototype.slice.call(slider.querySelectorAll('.review-card'));
      }
      if (!cards.some(function (card) { return card.classList.contains('is-active'); })) cards[0].classList.add('is-active');
    });
  }

  function addPremiumSceneFallbacks() {
    document.querySelectorAll('.reviews-hero__visual,.hero-visual-empty,.dfg-empty-visual').forEach(function (box) {
      if ((box.textContent || '').trim() || box.querySelector('img,video,canvas,svg,.dfg-v299-premium-scene')) return;
      box.classList.add('dfg-v299-premium-scene');
      box.innerHTML = '<span class="dfg-v299-premium-scene__orb"></span><span class="dfg-v299-premium-scene__ring"></span><span class="dfg-v299-premium-scene__ring"></span><span class="dfg-v299-premium-scene__card"></span>';
    });
  }

  function removeVisualOvals() {
    document.querySelectorAll('.hero-feature__icon,.card-icon,.brand-card__mark,.v103-hero-proof article>span,.v103-value-grid article>span,.v10-process article>span,.v8-process article>span,.v122-rich-cards article>span,.v124-service-mini-card span,.reviews-list-grid article>span,.human-social-card__head>span').forEach(function (el) {
      el.classList.add('dfg-v299-no-oval');
    });
  }

  function fixLinks() {
    var pages = {
      'residence-bg':'service-residence-bulgaria.html','company-registration-eu':'service-company-registration.html','banks-accounts':'service-banks-accounts.html','uae-dubai':'uae.html','uzbekistan-asia-service':'asia.html','supplements-registration':'service-supplements-registration.html','cosmetics-registration':'service-cosmetics-registration.html','pharma-consulting':'service-pharma-consulting.html','nostrification':'service-nostrification.html','real-estate-service':'real-estate.html','cars-rent-service':'cars.html','parking-service':'parking.html','international-trade-service':'service-international-trade.html','turnkey-consulting':'service-turnkey-consulting.html'
    };
    document.querySelectorAll('[data-card-link]').forEach(function (card) {
      var id = card.dataset.id || card.getAttribute('data-id') || '';
      var href = card.dataset.cardLink || pages[id] || '';
      var btn = card.querySelector('a.service-card__details-btn,a.btn[href],button.service-card__details-btn,button.btn');
      if (href && btn && btn.tagName !== 'A') {
        var a = document.createElement('a');
        a.className = btn.className;
        a.href = href;
        a.textContent = btn.textContent || 'Подробнее';
        btn.replaceWith(a);
      } else if (href && btn) {
        btn.setAttribute('href', href);
      }
    });
  }

  function apply() {
    if (running) return;
    running = true;
    window.requestAnimationFrame(function () {
      var lang = getLang();
      document.documentElement.lang = lang;
      document.body && document.body.setAttribute('data-v299-actual-fix', 'true');
      fixReviews();
      addPremiumSceneFallbacks();
      removeVisualOvals();
      fixLinks();
      if (lang !== 'ru') {
        applyPageCopy(lang);
        replaceExactText(lang);
        translateStaticBySelector(lang);
        window.setTimeout(function(){ replaceExactText(lang); translateStaticBySelector(lang); fallbackRussianCleanup(lang); }, 90);
      }
      running = false;
    });
  }

  function signature() {
    return [getLang(), document.body ? document.body.dataset.page : '', document.querySelectorAll('.service-card,.review-card,.filter-btn').length].join('|');
  }

  function boot() {
    apply();
    [80, 220, 700, 1500].forEach(function (ms) { window.setTimeout(apply, ms); });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-lang],.lang-btn,.lang-switch')) window.setTimeout(apply, 60);
      else window.setTimeout(apply, 20);
    }, true);
    var observer = new MutationObserver(function () {
      var sig = signature();
      if (sig === lastSignature) return;
      lastSignature = sig;
      window.setTimeout(apply, 50);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('pageshow', apply, { passive: true });
    window.addEventListener('storage', apply, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
