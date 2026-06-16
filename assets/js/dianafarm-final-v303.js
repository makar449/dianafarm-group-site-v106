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

/* v301 complete i18n pass: deterministic public-site translator and service-page renderer. */
(function () {
  'use strict';

  var LANG_KEY = 'dfg_lang';
  var SERVICE_BY_FILE = {
    'service-residence-bulgaria.html': 'residence-bg',
    'service-company-registration.html': 'company-registration-eu',
    'service-banks-accounts.html': 'banks-accounts',
    'service-supplements-registration.html': 'supplements-registration',
    'service-cosmetics-registration.html': 'cosmetics-registration',
    'service-nostrification.html': 'nostrification',
    'service-turnkey-consulting.html': 'turnkey-consulting',
    'service-pharma-consulting.html': 'pharma-consulting',
    'service-international-trade.html': 'international-trade-service'
  };

  var STATIC = {
    bg: {
      'Главная': 'Начало',
      'Услуги': 'Услуги',
      'Все услуги': 'Всички услуги',
      'ВНЖ / ПМЖ Болгария': 'ВНЖ / ПМЖ България',
      'Регистрация компаний': 'Регистрация на компании',
      'Банки и счета': 'Банки и сметки',
      'Узбекистан / Азия': 'Узбекистан / Азия',
      'Регистрация БАДов': 'Регистрация на добавки',
      'Регистрация косметики': 'Регистрация на козметика',
      'Фармацевтический консалтинг': 'Фармацевтичен консалтинг',
      'Нострификация дипломов': 'Нострификация на дипломи',
      'Недвижимость': 'Имоти',
      'Международная торговля': 'Международна търговия',
      'О компании': 'За компанията',
      'Блог': 'Блог',
      'Отзывы': 'Отзиви',
      'Контакты': 'Контакти',
      'Разделы': 'Раздели',
      'Сделано компанией': 'Изработено от',
      'Связаться с нами': 'Свържете се с нас',
      'Получить консультацию': 'Получете консултация',
      'Получить персональную консультацию': 'Получете персонална консултация',
      'Получить персональный маршрут': 'Получете персонален маршрут',
      'Получить персональный маршрут': 'Получете персонален маршрут',
      'Оставить заявку': 'Изпрати запитване',
      'Запросить маршрут': 'Заявете маршрут',
      'Смотреть все услуги': 'Вижте всички услуги',
      'Консультация': 'Консултация',
      'Подробнее': 'Повече',
      'Детали': 'Детайли',
      'Мы используем cookies для корректной работы сайта и аналитики.': 'Използваме cookies за коректна работа на сайта и аналитика.',
      'Ок': 'ОК',
      'Открыть список услуг': 'Отвори списъка с услуги',
      'Список услуг': 'Списък с услуги',
      'Основная навигация': 'Основна навигация',
      'На главную': 'Към началната страница',
      'Связаться': 'Свързване',
      'Международный консалтинг и бизнес-решения': 'Международен консалтинг и бизнес решения',
      'Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.': 'Вашият надежден партньор в международния бизнес, регистрациите, инвестициите и имиграционното право.',
      'Наши услуги': 'Нашите услуги',
      'Комплексные решения для вашего бизнеса и жизни': 'Комплексни решения за вашия бизнес и живот',
      'Почему выбирают DIANAFARM GROUP': 'Защо избират DIANAFARM GROUP',
      'Профессионализм': 'Професионализъм',
      'Индивидуальный подход': 'Индивидуален подход',
      'Прозрачность': 'Прозрачност',
      'Поддержка 24/7': 'Поддръжка 24/7',
      'Готовы начать?': 'Готови ли сте да започнете?',
      'Получите персональную консультацию и узнайте, какое решение подходит именно вам.': 'Получете персонална консултация и разберете кое решение е подходящо за вас.',
      'Как мы работаем': 'Как работим',
      'Заявка': 'Запитване',
      'Анализ': 'Анализ',
      'Решение': 'Решение',
      'Результат': 'Резултат',
      'Вы оставляете запрос на консультацию.': 'Оставяте заявка за консултация.',
      'Мы анализируем вашу ситуацию и цели.': 'Анализираме вашата ситуация и цели.',
      'Предлагаем оптимальную стратегию.': 'Предлагаме оптимална стратегия.',
      'Вы получаете результат и поддержку.': 'Получавате резултат и подкрепа.',
      'Надёжность и конфиденциальность': 'Надеждност и конфиденциалност',
      'Гарантируем безопасность данных и полную конфиденциальность.': 'Гарантираме сигурност на данните и пълна конфиденциалност.',
      'Гарантируем безопасность ваших данных и полную конфиденциальность.': 'Гарантираме сигурност на вашите данни и пълна конфиденциалност.',
      'Международный опыт': 'Международен опит',
      'Болгария, ЕС, ОАЭ, Узбекистан и Азия.': 'България, ЕС, ОАЕ, Узбекистан и Азия.',
      'Комплексный подход': 'Комплексен подход',
      'Решаем задачи любой сложности под ключ.': 'Решаваме сложни задачи до ключ.',
      'Ключевые направления': 'Ключови направления',
      'ВНЖ / ПМЖ': 'ВНЖ / ПМЖ',
      'Банки': 'Банки',
      'Азия': 'Азия',
      'Фармацевтика': 'Фармация',
      'Документы': 'Документи',
      'Маршрут': 'Маршрут',
      'Контроль': 'Контрол',
      'Стратегия': 'Стратегия',
      'Диагностика': 'Диагностика',
      'Проверяем документы, вводные и доступные варианты.': 'Проверяваме документите, данните и достъпните варианти.',
      'Бизнес и банки': 'Бизнес и банки',
      'Документы без хаоса': 'Документи без хаос',
      'Международный контур': 'Международен контур',
      'Болгария': 'България',
      'Клиент по ВНЖ / ПМЖ': 'Клиент по ВНЖ / ПМЖ',
      'Что говорят клиенты': 'Какво казват клиентите',
      'Отзывы клиентов': 'Отзиви от клиенти',
      'Живые короткие отзывы о сопровождении, контакты, документах и результате. Всё собрано в более чистой, спокойной и премиальной подаче — без перегруза и тяжёлых эффектов.': 'Кратки реални отзиви за съпровождане, контакти, документи и резултат. Всичко е поднесено чисто, спокойно и премиум — без претоварване и тежки ефекти.',
      'Клиенты отмечают спокойную подачу, понятный маршрут и ясность по срокам.': 'Клиентите отбелязват спокойна комуникация, ясен маршрут и яснота по срокове.',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.': 'Платформа за консалтинг, имоти, фармация, козметика и международен бизнес.',
      'Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.': 'Платформа за консалтинг, имоти, автомобили, паркинги, фармация, козметика и международен бизнес.',
      'Авто': 'Авто',
      'Паркинги': 'Паркинги',
      'Авто в аренду': 'Автомобили под наем',
      'Запросить авто': 'Заявете автомобил',
      'Запросить паркинг': 'Заявете паркинг',
      'Нужна персональная подборка?': 'Нужна ли е персонална подборка?',
      'Оставьте запрос — проверим доступность и предложим лучшее решение.': 'Оставете запитване — ще проверим наличността и ще предложим най-доброто решение.',
      'Глобальные услуги под ключ': 'Глобални услуги до ключ',
      'Полный спектр решений для бизнеса и жизни в Европе, Азии и на Ближнем Востоке. Одна команда — ваш надёжный партнёр на каждом этапе.': 'Пълен спектър решения за бизнес и живот в Европа, Азия и Близкия изток. Един екип — надежден партньор на всеки етап.',
      'Блог и аналитика': 'Блог и анализи',
      'Практические материалы о Болгарии, недвижимости, бизнесе, банках, UAE, косметике и БАДах.': 'Практични материали за България, имоти, бизнес, банки, UAE, козметика и добавки.',
      'Получить консультацию': 'Получете консултация',
      'Получить консультацию': 'Получете консултация',
      'Получить консультацию': 'Получете консултация'
    },
    en: {
      'Главная': 'Home',
      'Услуги': 'Services',
      'Все услуги': 'All services',
      'ВНЖ / ПМЖ Болгария': 'Bulgaria residence',
      'Регистрация компаний': 'Company registration',
      'Банки и счета': 'Banks and accounts',
      'Узбекистан / Азия': 'Uzbekistan / Asia',
      'Регистрация БАДов': 'Supplement registration',
      'Регистрация косметики': 'Cosmetics registration',
      'Фармацевтический консалтинг': 'Pharma consulting',
      'Нострификация дипломов': 'Diploma recognition',
      'Недвижимость': 'Real estate',
      'Международная торговля': 'International trade',
      'О компании': 'About',
      'Блог': 'Blog',
      'Отзывы': 'Reviews',
      'Контакты': 'Contacts',
      'Разделы': 'Sections',
      'Сделано компанией': 'Built by',
      'Связаться с нами': 'Contact us',
      'Получить консультацию': 'Get a consultation',
      'Получить персональную консультацию': 'Get a personal consultation',
      'Получить персональный маршрут': 'Get a personal route',
      'Оставить заявку': 'Send request',
      'Запросить маршрут': 'Request a route',
      'Смотреть все услуги': 'View all services',
      'Консультация': 'Consultation',
      'Подробнее': 'Details',
      'Детали': 'Details',
      'Мы используем cookies для корректной работы сайта и аналитики.': 'We use cookies for site functionality and analytics.',
      'Ок': 'OK',
      'Открыть список услуг': 'Open services list',
      'Список услуг': 'Services list',
      'Основная навигация': 'Main navigation',
      'На главную': 'Back to home',
      'Связаться': 'Contact',
      'Международный консалтинг и бизнес-решения': 'International consulting and business solutions',
      'Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.': 'Your reliable partner for international business, registrations, investments and immigration support.',
      'Наши услуги': 'Our services',
      'Комплексные решения для вашего бизнеса и жизни': 'Integrated solutions for your business and life',
      'Почему выбирают DIANAFARM GROUP': 'Why clients choose DIANAFARM GROUP',
      'Профессионализм': 'Professionalism',
      'Индивидуальный подход': 'Individual approach',
      'Прозрачность': 'Transparency',
      'Поддержка 24/7': '24/7 support',
      'Готовы начать?': 'Ready to start?',
      'Получите персональную консультацию и узнайте, какое решение подходит именно вам.': 'Get a personal consultation and understand which solution fits your case.',
      'Как мы работаем': 'How we work',
      'Заявка': 'Request',
      'Анализ': 'Analysis',
      'Решение': 'Solution',
      'Результат': 'Result',
      'Вы оставляете запрос на консультацию.': 'You send a consultation request.',
      'Мы анализируем вашу ситуацию и цели.': 'We analyze your situation and goals.',
      'Предлагаем оптимальную стратегию.': 'We propose an optimal strategy.',
      'Вы получаете результат и поддержку.': 'You receive the result and support.',
      'Надёжность и конфиденциальность': 'Reliability and confidentiality',
      'Гарантируем безопасность данных и полную конфиденциальность.': 'We ensure data security and full confidentiality.',
      'Гарантируем безопасность ваших данных и полную конфиденциальность.': 'We ensure your data security and full confidentiality.',
      'Международный опыт': 'International experience',
      'Болгария, ЕС, ОАЭ, Узбекистан и Азия.': 'Bulgaria, EU, UAE, Uzbekistan and Asia.',
      'Комплексный подход': 'Integrated approach',
      'Решаем задачи любой сложности под ключ.': 'We handle complex tasks turnkey.',
      'Ключевые направления': 'Key directions',
      'ВНЖ / ПМЖ': 'Residence',
      'Банки': 'Banks',
      'Азия': 'Asia',
      'Фармацевтика': 'Pharma',
      'Документы': 'Documents',
      'Маршрут': 'Route',
      'Контроль': 'Control',
      'Стратегия': 'Strategy',
      'Диагностика': 'Diagnostics',
      'Проверяем документы, вводные и доступные варианты.': 'We check documents, inputs and available options.',
      'Бизнес и банки': 'Business and banks',
      'Документы без хаоса': 'Documents without chaos',
      'Международный контур': 'International framework',
      'Болгария': 'Bulgaria',
      'Клиент по ВНЖ / ПМЖ': 'Residence client',
      'Что говорят клиенты': 'What clients say',
      'Отзывы клиентов': 'Client reviews',
      'Живые короткие отзывы о сопровождении, контакты, документах и результате. Всё собрано в более чистой, спокойной и премиальной подаче — без перегруза и тяжёлых эффектов.': 'Short real reviews about support, communication, documents and results. Everything is presented in a clean, calm and premium way — without overload or heavy effects.',
      'Клиенты отмечают спокойную подачу, понятный маршрут и ясность по срокам.': 'Clients note calm communication, a clear route and clarity on timing.',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.': 'A platform for consulting, real estate, pharmaceuticals, cosmetics and international business.',
      'Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.': 'A platform for consulting, real estate, cars, parking, pharmaceuticals, cosmetics and international business.',
      'Авто': 'Cars',
      'Паркинги': 'Parking',
      'Авто в аренду': 'Car rental',
      'Запросить авто': 'Request a car',
      'Запросить паркинг': 'Request parking',
      'Нужна персональная подборка?': 'Need a personal selection?',
      'Оставьте запрос — проверим доступность и предложим лучшее решение.': 'Send a request — we will check availability and propose the best option.',
      'Глобальные услуги под ключ': 'Global turnkey services',
      'Полный спектр решений для бизнеса и жизни в Европе, Азии и на Ближнем Востоке. Одна команда — ваш надёжный партнёр на каждом этапе.': 'A full range of solutions for business and life across Europe, Asia and the Middle East. One team — your reliable partner at every stage.',
      'Блог и аналитика': 'Blog and insights',
      'Практические материалы о Болгарии, недвижимости, бизнесе, банках, UAE, косметике и БАДах.': 'Practical materials on Bulgaria, real estate, business, banks, UAE, cosmetics and supplements.'
    },
    ka: {
      'Главная': 'მთავარი',
      'Услуги': 'მომსახურება',
      'Все услуги': 'ყველა მომსახურება',
      'ВНЖ / ПМЖ Болгария': 'ბულგარეთის ბინადრობა',
      'Регистрация компаний': 'კომპანიების რეგისტრაცია',
      'Банки и счета': 'ბანკები და ანგარიშები',
      'Узбекистан / Азия': 'უზბეკეთი / აზია',
      'Регистрация БАДов': 'დანამატების რეგისტრაცია',
      'Регистрация косметики': 'კოსმეტიკის რეგისტრაცია',
      'Фармацевтический консалтинг': 'ფარმაცევტული კონსალტინგი',
      'Нострификация дипломов': 'დიპლომის აღიარება',
      'Недвижимость': 'უძრავი ქონება',
      'Международная торговля': 'საერთაშორისო ვაჭრობა',
      'О компании': 'კომპანიის შესახებ',
      'Блог': 'ბლოგი',
      'Отзывы': 'შეფასებები',
      'Контакты': 'კონტაქტები',
      'Разделы': 'სექციები',
      'Сделано компанией': 'შექმნილია კომპანიის მიერ',
      'Связаться с нами': 'დაგვიკავშირდით',
      'Получить консультацию': 'კონსულტაციის მიღება',
      'Получить персональную консультацию': 'პერსონალური კონსულტაციის მიღება',
      'Получить персональный маршрут': 'პერსონალური მარშრუტის მიღება',
      'Оставить заявку': 'განაცხადის დატოვება',
      'Запросить маршрут': 'მარშრუტის მოთხოვნა',
      'Смотреть все услуги': 'ყველა მომსახურების ნახვა',
      'Консультация': 'კონსულტაცია',
      'Подробнее': 'დეტალურად',
      'Детали': 'დეტალები',
      'Мы используем cookies для корректной работы сайта и аналитики.': 'ვიყენებთ cookies-ს საიტის სწორად მუშაობისა და ანალიტიკისთვის.',
      'Ок': 'კარგი',
      'Открыть список услуг': 'მომსახურებების სიის გახსნა',
      'Список услуг': 'მომსახურებების სია',
      'Основная навигация': 'მთავარი ნავიგაცია',
      'На главную': 'მთავარზე დაბრუნება',
      'Связаться': 'დაკავშირება',
      'Международный консалтинг и бизнес-решения': 'საერთაშორისო კონსალტინგი და ბიზნეს-გადაწყვეტილებები',
      'Ваш надёжный партнёр в мире международного бизнеса, регистрации, инвестиций и иммиграционного права.': 'თქვენი საიმედო პარტნიორი საერთაშორისო ბიზნესში, რეგისტრაციებში, ინვესტიციებსა და იმიგრაციის მხარდაჭერაში.',
      'Наши услуги': 'ჩვენი მომსახურება',
      'Комплексные решения для вашего бизнеса и жизни': 'კომპლექსური გადაწყვეტილებები თქვენი ბიზნესისა და ცხოვრებისათვის',
      'Почему выбирают DIANAFARM GROUP': 'რატომ ირჩევენ DIANAFARM GROUP-ს',
      'Профессионализм': 'პროფესიონალიზმი',
      'Индивидуальный подход': 'ინდივიდუალური მიდგომა',
      'Прозрачность': 'გამჭვირვალობა',
      'Поддержка 24/7': 'მხარდაჭერა 24/7',
      'Готовы начать?': 'მზად ხართ დასაწყებად?',
      'Получите персональную консультацию и узнайте, какое решение подходит именно вам.': 'მიიღეთ პერსონალური კონსულტაცია და გაიგეთ, რომელი გადაწყვეტა შეესაბამება თქვენს შემთხვევას.',
      'Как мы работаем': 'როგორ ვმუშაობთ',
      'Заявка': 'განაცხადი',
      'Анализ': 'ანალიზი',
      'Решение': 'გადაწყვეტა',
      'Результат': 'შედეგი',
      'Вы оставляете запрос на консультацию.': 'თქვენ ტოვებთ მოთხოვნას კონსულტაციაზე.',
      'Мы анализируем вашу ситуацию и цели.': 'ვ анализებთ თქვენს სიტუაციასა და მიზნებს.',
      'Предлагаем оптимальную стратегию.': 'გთავაზობთ ოპტიმალურ სტრატეგიას.',
      'Вы получаете результат и поддержку.': 'იღებთ შედეგსა და მხარდაჭერას.',
      'Надёжность и конфиденциальность': 'საიმედოობა და კონფიდენციალურობა',
      'Гарантируем безопасность данных и полную конфиденциальность.': 'ვუზრუნველყოფთ მონაცემების უსაფრთხოებას და სრულ კონფიდენციალურობას.',
      'Гарантируем безопасность ваших данных и полную конфиденциальность.': 'ვუზრუნველყოფთ თქვენი მონაცემების უსაფრთხოებას და სრულ კონფიდენციალურობას.',
      'Международный опыт': 'საერთაშორისო გამოცდილება',
      'Болгария, ЕС, ОАЭ, Узбекистан и Азия.': 'ბულგარეთი, ევროკავშირი, UAE, უზბეკეთი და აზია.',
      'Комплексный подход': 'კომპლექსური მიდგომა',
      'Решаем задачи любой сложности под ключ.': 'ვჭრით რთულ ამოცანებს სრული მხარდაჭერის ფორმატში.',
      'Ключевые направления': 'ძირითადი მიმართულებები',
      'ВНЖ / ПМЖ': 'ბინადრობა',
      'Банки': 'ბანკები',
      'Азия': 'აზია',
      'Фармацевтика': 'ფარმაცია',
      'Документы': 'დოკუმენტები',
      'Маршрут': 'მარშრუტი',
      'Контроль': 'კონტროლი',
      'Стратегия': 'სტრატეგია',
      'Диагностика': 'დიაგნოსტიკა',
      'Проверяем документы, вводные и доступные варианты.': 'ვამოწმებთ დოკუმენტებს, მონაცემებს და ხელმისაწვდომ ვარიანტებს.',
      'Бизнес и банки': 'ბიზნესი და ბანკები',
      'Документы без хаоса': 'დოკუმენტები ქაოსის გარეშე',
      'Международный контур': 'საერთაშორისო მიმართულება',
      'Болгария': 'ბულგარეთი',
      'Клиент по ВНЖ / ПМЖ': 'ბინადრობის კლიენტი',
      'Что говорят клиенты': 'რას ამბობენ კლიენტები',
      'Отзывы клиентов': 'კლიენტების შეფასებები',
      'Живые короткие отзывы о сопровождении, контакты, документах и результате. Всё собрано в более чистой, спокойной и премиальной подаче — без перегруза и тяжёлых эффектов.': 'მოკლე რეალური შეფასებები მხარდაჭერაზე, კომუნიკაციაზე, დოკუმენტებსა და შედეგზე. ყველაფერი წარმოდგენილია სუფთად, მშვიდად და პრემიუმ ფორმატში — გადატვირთვისა და მძიმე ეფექტების გარეშე.',
      'Клиенты отмечают спокойную подачу, понятный маршрут и ясность по срокам.': 'კლიენტები აღნიშნავენ მშვიდ კომუნიკაციას, გასაგებ მარშრუტს და ვადების სიცხადეს.',
      'Платформа для консалтинга, недвижимости, фармацевтики, косметики и международного бизнеса.': 'კონსალტინგის, უძრავი ქონების, ფარმაციის, კოსმეტიკისა და საერთაშორისო ბიზნესის პლატფორმა.',
      'Платформа для консалтинга, недвижимости, авто, паркингов, фармацевтики, косметики и международного бизнеса.': 'კონსალტინგის, უძრავი ქონების, ავტომობილების, პარკინგის, ფარმაციის, კოსმეტიკისა და საერთაშორისო ბიზნესის პლატფორმა.',
      'Авто': 'ავტომობილები',
      'Паркинги': 'პარკინგი',
      'Авто в аренду': 'ავტომობილის დაქირავება',
      'Запросить авто': 'ავტომობილის მოთხოვნა',
      'Запросить паркинг': 'პარკინგის მოთხოვნა',
      'Нужна персональная подборка?': 'გჭირდებათ პერსონალური შერჩევა?',
      'Оставьте запрос — проверим доступность и предложим лучшее решение.': 'დატოვეთ მოთხოვნა — შევამოწმებთ ხელმისაწვდომობას და შემოგთავაზებთ საუკეთესო ვარიანტს.',
      'Глобальные услуги под ключ': 'გლობალური მომსახურება სრული მხარდაჭერით',
      'Полный спектр решений для бизнеса и жизни в Европе, Азии и на Ближнем Востоке. Одна команда — ваш надёжный партнёр на каждом этапе.': 'სრული გადაწყვეტილებები ბიზნესისა და ცხოვრებისათვის ევროპაში, აზიასა და ახლო აღმოსავლეთში. ერთი გუნდი — საიმედო პარტნიორი ყველა ეტაპზე.',
      'Блог и аналитика': 'ბლოგი და ანალიტიკა',
      'Практические материалы о Болгарии, недвижимости, бизнесе, банках, UAE, косметике и БАДах.': 'პრაქტიკული მასალები ბულგარეთზე, უძრავ ქონებაზე, ბიზნესზე, ბანკებზე, UAE-ზე, კოსმეტიკასა და დანამატებზე.'
    }
  };

  function lang() {
    var active = document.querySelector('.lang-btn.active');
    return (active && active.dataset.lang) || localStorage.getItem(LANG_KEY) || document.documentElement.lang || 'ru';
  }

  function localized(value, language) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(function (item) { return localized(item, language); }).filter(Boolean);
    return value[language] || value.ru || value.bg || value.en || value.ka || Object.values(value)[0] || '';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return {'&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'}[char];
    });
  }

  function pageFile() {
    return (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');
  }

  function buildDataDictionary(language) {
    var output = Object.assign({}, STATIC[language] || {});
    var data = window.DFG_DEFAULT_DATA || {};
    function walk(value) {
      if (!value || typeof value !== 'object') return;
      if (!Array.isArray(value)) {
        var keys = Object.keys(value);
        if (keys.indexOf('ru') !== -1 && keys.indexOf(language) !== -1) {
          var ru = value.ru;
          var target = value[language];
          if (typeof ru === 'string' && typeof target === 'string' && ru.trim() && target.trim()) output[normalize(ru)] = target;
          if (Array.isArray(ru) && Array.isArray(target)) {
            ru.forEach(function (item, idx) {
              if (typeof item === 'string' && typeof target[idx] === 'string') output[normalize(item)] = target[idx];
            });
          }
        }
      }
      Object.keys(value).forEach(function (key) { walk(value[key]); });
    }
    walk(data);
    // Ensure Georgian bullets for services that did not have KA in old data.
    var serviceBulletKa = {
      'Анализ основания и семейного сценария':'საფუძვლისა და ოჯახის სცენარის ანალიზი',
      'Переводы, легализация и пакет документов':'თარგმანები, ლეგალიზაცია და დოკუმენტების პაკეტი',
      'Адрес, страховка, запись и подача':'მისამართი, დაზღვევა, ჩაწერა და შეტანა',
      'Продление статуса и дальнейший маршрут':'სტატუსის გაგრძელება და შემდეგი მარშრუტი',
      'Выбор EOOD / OOD или иной структуры':'EOOD / OOD ან სხვა სტრუქტურის არჩევა',
      'Учредительные документы и регистрация':'დამფუძნებელი დოკუმენტები და რეგისტრაცია',
      'Юридический адрес и доверенности':'იურიდიული მისამართი და მინდობილობები',
      'Бухгалтерия, налоги и банковский маршрут':'ბუღალტერია, გადასახადები და საბანკო მარშრუტი',
      'Предварительный комплаенс-анализ':'წინასწარი compliance-ანალიზი',
      'Анкеты, KYC и подтверждение источника средств':'ანკეტები, KYC და თანხების წყაროს დადასტურება',
      'Коммуникация с банком и доработка пакета':'ბანკთან კომუნიკაცია და პაკეტის დამუშავება',
      'Личные и корпоративные счета':'პირადი და კორპორატიული ანგარიშები',
      'Регистрация компании и лицензия':'კომპანიის რეგისტრაცია და ლიცენზია',
      'Резидентский и корпоративный маршрут':'რეზიდენტობისა და კორპორატიული მარშრუტი',
      'Банковские счета и комплаенс':'საბანკო ანგარიშები და compliance',
      'Вывод продукции и B2B-коммуникация':'პროდუქტის ბაზარზე გაყვანა და B2B კომუნიკაცია',
      'Поиск поставщиков и переговоры':'მომწოდებლების ძიება და მოლაპარაკებები',
      'Коммерческие запросы и деловая переписка':'კომერციული მოთხოვნები და საქმიანი მიმოწერა',
      'Импорт / экспорт и логистика':'იმპორტი / ექსპორტი და ლოგისტიკა',
      'Локальная коммуникация и сопровождение':'ადგილობრივი კომუნიკაცია და მხარდაჭერა',
      'Проверка состава и классификации':'შემადგენლობისა და კლასიფიკაციის შემოწმება',
      'Маркировка и упаковка':'მარკირება და შეფუთვა',
      'Регистрационный пакет и документы':'რეგისტრაციის პაკეტი და დოკუმენტები',
      'Маршрут вывода продукта на рынок':'პროდუქტის ბაზარზე გაყვანის მარშრუტი',
      'Анализ цели: работа, учёба, медицина':'მიზნის ანალიზი: სამუშაო, სწავლა, მედიცინა',
      'Подача и сопровождение процедуры':'შეტანა და პროცედურის მხარდაჭერა',
      'Контроль сроков и коммуникации':'ვადებისა და კომუნიკაციის კონტროლი'
    };
    if (language === 'ka') Object.keys(serviceBulletKa).forEach(function (k) { output[normalize(k)] = serviceBulletKa[k]; });
    return output;
  }

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function skip(node) {
    if (!node || !node.parentElement) return true;
    var p = node.parentElement;
    return /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE)$/i.test(p.tagName) || p.closest('script,style,noscript,textarea,input,select,option,svg,code,pre,[data-no-i18n]');
  }

  function preserveReplace(raw, replacement) {
    var start = raw.match(/^\s*/)[0];
    var end = raw.match(/\s*$/)[0];
    return start + replacement + end;
  }

  function translateNodeText(node, dictionary) {
    var raw = String(node.nodeValue || '');
    var key = normalize(raw);
    if (!key) return;
    if (!node.__dfgRuOriginal && /[А-Яа-яЁё]/.test(raw)) node.__dfgRuOriginal = raw;
    var source = node.__dfgRuOriginal || raw;
    var sourceKey = normalize(source);
    if (dictionary[sourceKey]) {
      node.nodeValue = preserveReplace(source, dictionary[sourceKey]);
      return;
    }
    var changed = source;
    Object.keys(dictionary).sort(function (a,b) { return b.length - a.length; }).forEach(function (phrase) {
      if (phrase.length < 4) return;
      if (changed.indexOf(phrase) !== -1) changed = changed.split(phrase).join(dictionary[phrase]);
    });
    if (changed !== source) node.nodeValue = preserveReplace(source, changed.trim());
  }

  function translateAttributes(dictionary) {
    document.querySelectorAll('[aria-label],[title],[placeholder],[alt],[value]').forEach(function (el) {
      ['aria-label','title','placeholder','alt','value'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var raw = el.getAttribute(attr) || '';
        var key = normalize(raw);
        if (!key) return;
        if (!el.__dfgI18nAttrs) el.__dfgI18nAttrs = {};
        if (!el.__dfgI18nAttrs[attr] && /[А-Яа-яЁё]/.test(raw)) el.__dfgI18nAttrs[attr] = raw;
        var source = el.__dfgI18nAttrs[attr] || raw;
        var sourceKey = normalize(source);
        if (dictionary[sourceKey]) el.setAttribute(attr, dictionary[sourceKey]);
      });
    });
  }

  function translateStaticText(language) {
    if (language === 'ru') return;
    var dictionary = buildDataDictionary(language);
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) { return skip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) { translateNodeText(node, dictionary); });
    translateAttributes(dictionary);
  }

  function serviceLabels(language) {
    return ({
      ru: { home:'Главная', services:'Услуги', support:'Premium support', proof1:'Персональный анализ', proof2:'Документы и маршрут', proof3:'Результат', proof1s:'без шаблонов и лишней воды', proof2s:'понятная последовательность действий', proof3s:'контроль до финала', intro:'Что входит в работу', result:'Что получает клиент', process:'Как мы работаем', start:'Старт', route:'Маршрут', documents:'Документы', control:'Контроль', ctaTitle:'Нужна точная консультация по вашему кейсу?', ctaText:'Напишите задачу, страну и сроки — мы предложим аккуратный маршрут и следующий практический шаг.', cta:'Получить консультацию', all:'Все услуги' },
      bg: { home:'Начало', services:'Услуги', support:'Premium support', proof1:'Персонален анализ', proof2:'Документи и маршрут', proof3:'Резултат', proof1s:'без шаблони и излишни думи', proof2s:'ясна последователност на действията', proof3s:'контрол до финала', intro:'Какво влиза в работата', result:'Какво получава клиентът', process:'Как работим', start:'Старт', route:'Маршрут', documents:'Документи', control:'Контрол', ctaTitle:'Нужна ли е точна консултация за вашия случай?', ctaText:'Напишете задачата, страната и сроковете — ще предложим ясен маршрут и следваща практическа стъпка.', cta:'Получете консултация', all:'Всички услуги' },
      en: { home:'Home', services:'Services', support:'Premium support', proof1:'Personal analysis', proof2:'Documents and route', proof3:'Result', proof1s:'no templates or empty words', proof2s:'a clear sequence of actions', proof3s:'control until completion', intro:'What is included', result:'What the client receives', process:'How we work', start:'Start', route:'Route', documents:'Documents', control:'Control', ctaTitle:'Need a precise consultation for your case?', ctaText:'Send the task, country and timing — we will suggest a clear route and the next practical step.', cta:'Get a consultation', all:'All services' },
      ka: { home:'მთავარი', services:'მომსახურება', support:'Premium support', proof1:'პერსონალური ანალიზი', proof2:'დოკუმენტები და მარშრუტი', proof3:'შედეგი', proof1s:'შაბლონებისა და ზედმეტი სიტყვების გარეშე', proof2s:'მოქმედებების მკაფიო თანმიმდევრობა', proof3s:'კონტროლი დასრულებამდე', intro:'რა შედის მუშაობაში', result:'რას იღებს კლიენტი', process:'როგორ ვმუშაობთ', start:'სტარტი', route:'მარშრუტი', documents:'დოკუმენტები', control:'კონტროლი', ctaTitle:'გჭირდებათ ზუსტი კონსულტაცია თქვენს შემთხვევაზე?', ctaText:'მოგვწერეთ ამოცანა, ქვეყანა და ვადები — შემოგთავაზებთ მკაფიო მარშრუტს და შემდეგ პრაქტიკულ ნაბიჯს.', cta:'კონსულტაციის მიღება', all:'ყველა მომსახურება' }
    })[language] || null;
  }

  function renderServicePage(language) {
    if (language === 'ru') return;
    var id = SERVICE_BY_FILE[pageFile()];
    if (!id) return;
    var data = window.DFG_DEFAULT_DATA || {};
    var service = (data.services || []).find(function (item) { return item.id === id; });
    if (!service) return;
    var l = serviceLabels(language);
    var title = localized(service.title, language);
    var excerpt = localized(service.excerpt, language);
    var bullets = localized(service.bullets, language);
    if (!Array.isArray(bullets) || !bullets.length) bullets = localized(service.bullets, 'en');
    var image = service.image || 'assets/img/hero-sea-office.svg';
    var main = document.getElementById('mainContent');
    if (!main || main.dataset.v301ServiceRendered === language + ':' + id) return;
    main.dataset.v301ServiceRendered = language + ':' + id;
    document.title = title + ' — DIANAFARM GROUP';
    main.innerHTML = '<section class="v9-page-hero v103-service-hero" style="--hero-img:url(' + esc(image) + ')">' +
      '<div aria-hidden="true" class="v9-page-hero__bg"></div><div class="container v9-page-hero__grid">' +
      '<div class="v9-page-hero__copy reveal in-view"><div class="breadcrumbs"><a href="index.html">' + esc(l.home) + '</a><span>›</span><a href="services.html">' + esc(l.services) + '</a><span>›</span><span>' + esc(title) + '</span></div>' +
      '<p class="eyebrow">DIANAFARM GROUP · premium service</p><h1>' + esc(title) + '</h1><p>' + esc(excerpt) + '</p><div class="hero__actions hero__actions--mockup"><button class="btn btn--primary" data-context="' + esc(title) + '" data-open-form="consultation">' + esc(l.cta) + '</button><a class="btn btn--ghost" href="services.html">' + esc(l.all) + '</a></div></div>' +
      '<aside aria-label="Service benefits" class="v103-hero-proof reveal-group"><article><span>01</span><strong>' + esc(l.proof1) + '</strong><small>' + esc(l.proof1s) + '</small></article><article><span>02</span><strong>' + esc(l.proof2) + '</strong><small>' + esc(l.proof2s) + '</small></article><article><span>03</span><strong>' + esc(l.proof3) + '</strong><small>' + esc(l.proof3s) + '</small></article></aside></div></section>' +
      '<section class="section v103-section"><div class="container v10-detail-grid v103-detail-grid"><article class="v10-detail-panel v103-detail-panel reveal in-view"><p class="eyebrow">' + esc(l.intro) + '</p><h2>' + esc(title) + '</h2><p>' + esc(excerpt) + '</p><ul class="v10-detail-list v103-detail-list">' + bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></article><aside class="v10-side-card v103-side-card reveal in-view"><img alt="' + esc(title) + '" src="' + esc(image) + '"><div><span class="eyebrow">' + esc(l.support) + '</span><h3>' + esc(l.route) + '</h3><p>' + esc(l.ctaText) + '</p><button class="btn btn--primary btn--wide" data-context="' + esc(title) + '" data-open-form="consultation">' + esc(l.cta) + '</button></div></aside></div></section>' +
      '<section class="section v103-section"><div class="container"><div class="v9-section-row reveal in-view"><div><p class="eyebrow">' + esc(l.result) + '</p><h2>' + esc(l.process) + '</h2></div></div><div class="v103-value-grid reveal-group"><article><span>01</span><h3>' + esc(l.proof1) + '</h3><p>' + esc(l.proof1s) + '</p></article><article><span>02</span><h3>' + esc(l.route) + '</h3><p>' + esc(l.proof2s) + '</p></article><article><span>03</span><h3>' + esc(l.control) + '</h3><p>' + esc(l.proof3s) + '</p></article><article><span>04</span><h3>' + esc(l.result) + '</h3><p>' + esc(excerpt) + '</p></article></div><div class="v9-wide-contact v103-final-request reveal in-view"><div><span class="eyebrow">Premium support</span><h3>' + esc(l.ctaTitle) + '</h3><p>' + esc(l.ctaText) + '</p></div><button class="btn btn--primary" data-context="' + esc(title) + '" data-open-form="consultation">' + esc(l.cta) + '</button></div></div></section>';
  }

  function updateLangButtonState(language) {
    document.documentElement.lang = language;
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === language);
    });
  }

  var scheduled = false;
  function run() {
    scheduled = false;
    var language = lang();
    updateLangButtonState(language);
    renderServicePage(language);
    translateStaticText(language);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(run, 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    run();
    setTimeout(run, 250);
    setTimeout(run, 900);
    setTimeout(run, 1800);
    var observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (m) { return m.addedNodes && m.addedNodes.length; })) schedule();
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  });
  document.addEventListener('click', function (event) {
    var btn = event.target && event.target.closest ? event.target.closest('[data-lang]') : null;
    if (btn && btn.dataset.lang) setTimeout(run, 40);
  }, true);
  window.addEventListener('storage', function (event) {
    if (event.key === LANG_KEY) setTimeout(run, 40);
  });
  window.DFG_V301_TRANSLATE_NOW = run;
})();

/* ==========================================================================
   v302 targeted final patch — user requested only these fixes.
   ========================================================================== */
(function(){
  'use strict';
  var VERSION='v302-targeted-user-fixes';
  var LANGS=['ru','bg','ka','en'];
  function getLang(){
    var lang='ru';
    try{ lang=(localStorage.getItem('dfg_lang')||document.documentElement.lang||'ru').slice(0,2).toLowerCase(); }catch(e){ lang=(document.documentElement.lang||'ru').slice(0,2).toLowerCase(); }
    return LANGS.indexOf(lang)>-1?lang:'ru';
  }
  function pick(obj){var l=getLang();return obj && (obj[l]||obj.ru||obj.en||'') || '';}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function restoreDubai3D(){
    var stages=document.querySelectorAll('.v238-motion-stage[data-v238-scene="uae"], .dfg-empty-visual, .hero-visual-empty');
    stages.forEach(function(stage){
      if(!stage || stage.querySelector('.dfg-v302-3d-scene')) return;
      var hasRealContent=(stage.textContent||'').trim() || stage.querySelector('img,video,canvas:not([aria-hidden="true"]),svg:not([aria-hidden="true"])');
      if(hasRealContent && !stage.matches('.v238-motion-stage[data-v238-scene="uae"]')) return;
      stage.classList.add('dfg-v302-3d-stage');
      stage.innerHTML = ''+
        '<div class="dfg-v302-3d-scene" aria-hidden="true">'+
          '<span class="dfg-v302-card dfg-v302-card--one"></span>'+
          '<span class="dfg-v302-passport"></span>'+
          '<span class="dfg-v302-card dfg-v302-card--two"></span>'+
          '<span class="dfg-v302-orb dfg-v302-orb--one"></span>'+
          '<span class="dfg-v302-orb dfg-v302-orb--two"></span>'+
          '<span class="dfg-v302-orb dfg-v302-orb--three"></span>'+
        '</div>';
    });
  }

  var catalog={
    head:{
      eyebrow:{ru:'Dubai / UAE · партнерский каталог',bg:'Dubai / UAE · партньорски каталог',ka:'Dubai / UAE · პარტნიორული კატალოგი',en:'Dubai / UAE · partner catalog'},
      title:{ru:'Практический запуск направления в ОАЭ',bg:'Практически старт на направление в ОАЕ',ka:'პრაქტიკული გაშვება UAE-ში',en:'Practical UAE launch support'},
      lead:{ru:'Добавлены только профильные услуги для Dubai/UAE: диагностика экспортной готовности, регистрация продукции, маркетплейсы, торговые и аптечные сети, дистрибуция, склад, платежи и регистрация компании.',bg:'Добавени са само профилните услуги за Dubai/UAE: експортна диагностика, регистрация на продукти, маркетплейси, търговски и аптечни мрежи, дистрибуция, склад, плащания и регистрация на компания.',ka:'დამატებულია მხოლოდ Dubai/UAE-სთვის საჭირო სერვისები: ექსპორტისთვის მზადყოფნის შეფასება, პროდუქტის რეგისტრაცია, marketplace-ები, retail/აფთიაქების ქსელები, დისტრიბუცია, საწყობი, გადახდები და კომპანიის რეგისტრაცია.',en:'Only relevant Dubai/UAE services are added: export readiness, product registration, marketplaces, retail and pharmacy channels, distribution, warehouse, payments and company registration.'}
    },
    cta:{
      title:{ru:'Обсудить запуск в ОАЭ',bg:'Обсъдете старт в ОАЕ',ka:'განვიხილოთ UAE-ში გაშვება',en:'Discuss a UAE launch'},
      text:{ru:'Опишите продукт или бизнес-задачу — подберём аккуратный маршрут без лишнего перегруза.',bg:'Опишете продукта или бизнес задачата — ще подберем ясен маршрут без излишно претоварване.',ka:'აღწერეთ პროდუქტი ან ბიზნეს ამოცანა — შევარჩევთ გასაგებ მარშრუტს ზედმეტი გადატვირთვის გარეშე.',en:'Describe the product or business task — we will choose a clear route without overload.'},
      btn:{ru:'Получить консультацию',bg:'Получить консултация',ka:'კონსულტაციის მიღება',en:'Get a consultation'}
    },
    cards:[
      {n:'01',t:{ru:'Диагностика и стратегия',bg:'Диагностика и стратегия',ka:'დიაგნოსტიკა და სტრატეგია',en:'Diagnostics and strategy'},p:{ru:'Проверяем продукт, рынок, документы, цену, упаковку и маршрут запуска перед расходами.',bg:'Проверяваме продукт, пазар, документи, цена, опаковка и маршрут преди разходи.',ka:'ვამოწმებთ პროდუქტს, ბაზარს, დოკუმენტებს, ფასს, შეფუთვას და გაშვების მარშრუტს ხარჯებამდე.',en:'We check product, market, documents, price, packaging and launch route before major costs.'}},
      {n:'02',t:{ru:'Регистрация продукции в ОАЭ',bg:'Регистрация на продукти в ОАЕ',ka:'პროდუქტის რეგისტრაცია UAE-ში',en:'UAE product registration'},p:{ru:'Подготовка данных, описаний, этикеток и файлов для допуска к импорту и продаже.',bg:'Подготовка на данни, описания, етикети и файлове за импорт и продажби.',ka:'მონაცემების, აღწერების, ეტიკეტებისა და ფაილების მომზადება იმპორტისა და გაყიდვებისთვის.',en:'Preparation of data, descriptions, labels and files for import and sale approval.'}},
      {n:'03',t:{ru:'Маркетплейсы и розница',bg:'Маркетплейси и ритейл',ka:'Marketplace-ები და retail',en:'Marketplaces and retail'},p:{ru:'Amazon.ae, Noon, торговые сети, аптечные каналы и первичное размещение.',bg:'Amazon.ae, Noon, търговски мрежи, аптечни канали и първично позициониране.',ka:'Amazon.ae, Noon, სავაჭრო ქსელები, აფთიაქების არხები და საწყისი განთავსება.',en:'Amazon.ae, Noon, retail chains, pharmacy channels and initial placement.'}},
      {n:'04',t:{ru:'Дистрибуция, склад и платежи',bg:'Дистрибуция, склад и плащания',ka:'დისტრიბუცია, საწყობი და გადახდები',en:'Distribution, warehouse and payments'},p:{ru:'Инфраструктура продаж: склад, fulfilment, партнёры, платежная логика и контроль этапов.',bg:'Продажбена инфраструктура: склад, fulfilment, партньори, платежна логика и контрол.',ka:'გაყიდვების ინფრასტრუქტურა: საწყობი, fulfillment, პარტნიორები, გადახდები და ეტაპების კონტროლი.',en:'Sales infrastructure: warehouse, fulfilment, partners, payment logic and stage control.'}},
      {n:'05',t:{ru:'Регистрация компании в ОАЭ',bg:'Регистрация на компания в ОАЕ',ka:'კომპანიის რეგისტრაცია UAE-ში',en:'UAE company registration'},p:{ru:'Free zone / mainland, лицензия, документы, структура и понятный дальнейший маршрут.',bg:'Free zone / mainland, лиценз, документи, структура и ясен следващ маршрут.',ka:'Free zone / mainland, ლიცენზია, დოკუმენტები, სტრუქტურა და შემდეგი მარშრუტი.',en:'Free zone / mainland, license, documents, structure and clear next route.'}},
      {n:'06',t:{ru:'Комплексный запуск',bg:'Комплексен старт',ka:'კომპლექსური გაშვება',en:'Complete launch'},p:{ru:'Один управляемый проект: анализ, упаковка, документы, партнёры, переговоры и пилотные действия.',bg:'Един управляван проект: анализ, пакетиране, документи, партньори, преговори и пилотни действия.',ka:'ერთი მართული პროექტი: ანალიზი, შეფუთვა, დოკუმენტები, პარტნიორები, მოლაპარაკებები და პილოტური ნაბიჯები.',en:'One managed project: analysis, packaging, documents, partners, negotiations and pilot actions.'}}
    ]
  };

  function addDubaiCatalog(){
    if(!document.body || document.body.dataset.page!=='uae') return;
    if(document.getElementById('dubaiPartnerCatalog')) return;
    var after=document.querySelector('.v238-motion-section') || document.querySelector('.v238-direction-hero');
    if(!after) return;
    var section=document.createElement('section');
    section.className='section dfg-v302-dubai-catalog';
    section.id='dubaiPartnerCatalog';
    section.innerHTML = '<div class="container">'+
      '<div class="dfg-v302-catalog-head reveal"><p class="eyebrow">'+esc(pick(catalog.head.eyebrow))+'</p><h2>'+esc(pick(catalog.head.title))+'</h2><p>'+esc(pick(catalog.head.lead))+'</p></div>'+
      '<div class="dfg-v302-catalog-grid reveal-group">'+catalog.cards.map(function(c){return '<article class="dfg-v302-catalog-card"><span>'+esc(c.n)+'</span><h3>'+esc(pick(c.t))+'</h3><p>'+esc(pick(c.p))+'</p></article>';}).join('')+'</div>'+
      '<div class="dfg-v302-catalog-cta reveal"><div><strong>'+esc(pick(catalog.cta.title))+'</strong><p>'+esc(pick(catalog.cta.text))+'</p></div><button class="btn btn--primary" data-open-form="consultation">'+esc(pick(catalog.cta.btn))+'</button></div>'+
      '</div>';
    after.insertAdjacentElement('afterend',section);
  }

  function removeIconOvals(){
    document.querySelectorAll('.hero-feature__icon,.card-icon,.brand-card__mark,.v103-hero-proof article>span,.v103-value-grid article>span,.v10-process article>span,.v8-process article>span,.v122-rich-cards article>span,.v124-service-mini-card span,.reviews-list-grid article>span,.human-social-card__head>span,.rge-dubai-card__mark,.rge-dubai-icon,.v9-lux-grid article>span,.v238-motion-copy article>span').forEach(function(el){
      el.classList.add('dfg-v302-no-icon-oval');
      el.style.background='transparent';el.style.border='0';el.style.boxShadow='none';el.style.borderRadius='0';el.style.backdropFilter='none';
    });
  }

  function fixReviews(){
    if(!document.body || document.body.dataset.page!=='reviews') return;
    document.querySelectorAll('.reviews-vertical .review-card,.reviews-vertical--premium .review-card').forEach(function(card,i){
      card.classList.toggle('is-active',i===0);
      card.style.display=i===0?'flex':'none';
      var p=card.querySelector('p');
      if(p){
        p.style.fontSize='';
        p.style.maxHeight='none';
        p.style.overflow='visible';
      }
    });
  }

  function centerLogo(){
    document.querySelectorAll('.brand__seal').forEach(function(el){
      el.style.display='inline-grid';el.style.placeItems='center';el.style.textAlign='center';el.style.lineHeight='1';el.style.padding='0';
    });
  }

  function apply(){
    restoreDubai3D();
    addDubaiCatalog();
    removeIconOvals();
    fixReviews();
    centerLogo();
    document.documentElement.dataset.dfgV302Targeted='ready';
  }
  var timer=0;
  function schedule(ms){clearTimeout(timer);timer=setTimeout(apply,ms||0);}
  function boot(){apply();[80,250,700,1400,2600].forEach(schedule);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){schedule(0);schedule(900);},{once:true});
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-lang],.lang-btn')){setTimeout(function(){var old=document.getElementById('dubaiPartnerCatalog');if(old) old.remove();apply();},80);setTimeout(apply,420);}},true);
  try{new MutationObserver(function(){schedule(120);}).observe(document.documentElement,{childList:true,subtree:true,characterData:false});}catch(e){}
  window.DFG_V302_TARGETED={version:VERSION,apply:apply};
})();


/* v303: desktop parity on mobile/tablet, scroll everywhere, 3D scene restore on every stage. */
(function(){
  'use strict';
  var SCENE_LABELS = {
    uae:'UAE · DUBAI', asia:'ASIA', blog:'BLOG', realestate:'REAL ESTATE', cars:'CARS', parking:'PARKING', reviews:'REVIEWS', default:'DIANAFARM'
  };
  function sceneHtml(label){
    var safe = String(label || 'DIANAFARM').replace(/[<>&"']/g, '');
    return '<div class="dfg-v303-scene" aria-hidden="true"><span class="dfg-v303-scene__ring"></span><span class="dfg-v303-scene__ring"></span><span class="dfg-v303-scene__core" data-label="'+safe+'"></span><span class="dfg-v303-scene__orb dfg-v303-scene__orb--a"></span><span class="dfg-v303-scene__orb dfg-v303-scene__orb--b"></span><span class="dfg-v303-scene__orb dfg-v303-scene__orb--c"></span></div>';
  }
  function stageLabel(stage){
    var key = stage.getAttribute('data-v238-scene') || stage.getAttribute('data-hero-scene') || (document.body && document.body.dataset ? document.body.dataset.page : '') || 'default';
    return SCENE_LABELS[key] || SCENE_LABELS.default;
  }
  function ensure3DScenes(){
    document.querySelectorAll('.v238-motion-stage,[data-hero-scene],.reviews-hero__visual,.hero-visual-empty,.dfg-empty-visual').forEach(function(stage){
      if(!stage || stage.dataset.v303SceneReady === 'true') return;
      stage.dataset.v303SceneReady='true';
      stage.classList.add('dfg-v303-stage-ready');
      if(!stage.querySelector('.dfg-v303-scene')) stage.insertAdjacentHTML('afterbegin', sceneHtml(stageLabel(stage)));
    });
  }
  function unlockScroll(){
    document.documentElement.style.overflowY='auto';
    document.documentElement.style.touchAction='pan-y pinch-zoom';
    document.body.style.overflowY='visible';
    document.body.style.touchAction='pan-y pinch-zoom';
    if(!document.querySelector('dialog[open],.modal.is-open,.modal[open]')){
      document.body.style.position='relative';
      document.body.style.height='auto';
      document.body.classList.remove('scroll-locked','no-scroll','is-scroll-locked');
    }
  }
  function fixMobileDesktopParity(){
    document.documentElement.classList.add('dfg-v303-desktop-parity');
    document.body && document.body.classList.add('dfg-v303-desktop-parity');
  }
  function boot(){
    fixMobileDesktopParity();
    ensure3DScenes();
    unlockScroll();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', boot, {passive:true});
  window.addEventListener('pageshow', boot, {passive:true});
  window.addEventListener('resize', boot, {passive:true});
  document.addEventListener('touchstart', unlockScroll, {capture:true, passive:true});
  document.addEventListener('touchmove', unlockScroll, {capture:true, passive:true});
  var obs = new MutationObserver(function(){ boot(); });
  if(document.documentElement) obs.observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','open']});
})();
