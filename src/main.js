import './style.css';
import { initCityAutocomplete } from './lib/geocode.js';
import { DECK } from './shared/deck.js'; 

// ==========================================
// 1. ЛУНА
// ==========================================
function updateMoonCalendar() {
  const textEl = document.getElementById('moon-phase');
  const iconEl = document.getElementById('moon-icon');
  const textElMobile = document.getElementById('moon-phase-mobile');
  const iconElMobile = document.getElementById('moon-icon-mobile');
  
  if (!textEl && !textElMobile) return;

  try {
    const SYNODIC_MONTH = 29.53058867;
    const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
    const now = new Date().getTime();
    const daysSince = (now - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
    let phase = (daysSince % SYNODIC_MONTH) / SYNODIC_MONTH;
    if (phase < 0) phase += 1;
    const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) * 50);

    let phaseRu = ""; let iconPhase = "";
    if (phase < 0.03 || phase > 0.97) { phaseRu = "Новолуние"; iconPhase = "New Moon"; }
    else if (phase < 0.22) { phaseRu = "Растущий серп"; iconPhase = "Waxing Crescent"; }
    else if (phase < 0.28) { phaseRu = "Первая четверть"; iconPhase = "First Quarter"; }
    else if (phase < 0.47) { phaseRu = "Растущая луна"; iconPhase = "Waxing Gibbous"; }
    else if (phase < 0.53) { phaseRu = "Полнолуние"; iconPhase = "Full Moon"; }
    else if (phase < 0.72) { phaseRu = "Убывающая луна"; iconPhase = "Waning Gibbous"; }
    else if (phase < 0.78) { phaseRu = "Последняя четверть"; iconPhase = "Last Quarter"; }
    else { phaseRu = "Убывающий серп"; iconPhase = "Waning Crescent"; }

    const moonIcons = {
      "New Moon": `<span class="text-xl">🌑</span>`, "Waxing Crescent": `<span class="text-xl">🌒</span>`,
      "First Quarter": `<span class="text-xl">🌓</span>`, "Waxing Gibbous": `<span class="text-xl">🌔</span>`,
      "Full Moon": `<span class="text-xl">🌕</span>`, "Waning Gibbous": `<span class="text-xl">🌖</span>`,
      "Last Quarter": `<span class="text-xl">🌗</span>`, "Waning Crescent": `<span class="text-xl">🌘</span>`
    };

    if (textEl) textEl.textContent = `${phaseRu} • ${illumination}%`;
    if (iconEl) iconEl.innerHTML = moonIcons[iconPhase] || moonIcons["New Moon"];
    if (textElMobile) textElMobile.textContent = `${phaseRu} • ${illumination}%`;
    if (iconElMobile) iconElMobile.innerHTML = moonIcons[iconPhase] || moonIcons["New Moon"];
  } catch (error) { console.error('Ошибка луны:', error); }
}

// ==========================================
// 2. КАРТА ДНЯ
// ==========================================
function initDailyCard() {
  const imgEl = document.getElementById('daily-card-img');
  const nameEl = document.getElementById('daily-card-name');
  const titleEl = document.getElementById('daily-title');
  const textEl = document.getElementById('daily-text');
  if (!imgEl) return;

  const today = new Date();
  const seedStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  let t = h + 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const rnd = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  const card = DECK[Math.floor(rnd * DECK.length)];
  if (!card) return;

  // Грузим WEBP
  imgEl.src = `/cards/${card.id}.webp`;
  imgEl.onerror = () => { imgEl.src = '/tarot.webp'; };
  
  if (nameEl) nameEl.textContent = card.name;
  if (titleEl) titleEl.textContent = card.title || '';
  if (textEl) textEl.textContent = card.text || '';
}

// ==========================================
// 3. СЛАЙДЕР
// ==========================================
function initSlider() {
  const section = document.getElementById('instruments');
  const slides = document.querySelectorAll('.slide-item');
  const dots = document.querySelectorAll('.slide-dot');
  if (!section || slides.length === 0) return;
  const total = slides.length;

  function updateSlide(index) {
    if (window.innerWidth < 768) return;
    slides.forEach((slide, i) => {
      slide.classList.toggle('md:opacity-0', i !== index);
      slide.classList.toggle('md:opacity-100', i === index);
      slide.classList.toggle('pointer-events-none', i !== index);
      slide.classList.toggle('pointer-events-auto', i === index);
    });
    dots.forEach((dot) => {
      const isActive = parseInt(dot.getAttribute('data-index'), 10) === index;
      dot.classList.toggle('bg-[#D4C4A8]', isActive);
      dot.classList.toggle('bg-white/20', !isActive);
      dot.classList.toggle('scale-150', isActive);
    });
  }

  window.addEventListener('scroll', () => {
    if (window.innerWidth < 768) return;
    const totalScroll = section.offsetHeight - window.innerHeight;
    if (totalScroll <= 0) return;
    const rect = section.getBoundingClientRect();
    let progress = Math.max(0, Math.min(1, -rect.top / totalScroll));
    updateSlide(Math.min(total - 1, Math.floor(progress * total)));
  }, { passive: true });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      if (window.innerWidth < 768) return;
      const dotIndex = parseInt(dot.getAttribute('data-index'), 10);
      const totalScroll = section.offsetHeight - window.innerHeight;
      window.scrollTo({ top: section.offsetTop + totalScroll * (dotIndex / Math.max(1, total - 1)), behavior: 'smooth' });
    });
  });
  updateSlide(0);
}

// ==========================================
// 4. МОДАЛКА (ФОРМА И РЕДИРЕКТ)
// ==========================================
function initModal() {
  const btn = document.getElementById('open-modal-btn');
  const modal = document.getElementById('analysis-modal');
  if (!btn || !modal) return;

  const $ = (id) => document.getElementById(id);
  const closeBtn = $('modal-close');
  const overlay = $('modal-overlay');
  const form = $('analysis-form');
  const formContainer = $('form-container');
  const loadingScreen = $('loading-screen');
  const inputCity = $('input-city');
  const modalContent = $('modal-content');

  let birthPlace = null;
  let previouslyFocusedElement = null;

  if (inputCity) {
    initCityAutocomplete(inputCity, (place) => {
      birthPlace = place;
      hideError('input-city', 'error-city');
    });
  }

  const showError = (inputId, errorId, text = null) => {
    const input = $(inputId);
    const error = $(errorId);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (error) {
      if (text) error.textContent = text;
      error.classList.remove('opacity-0');
    }
  };

  const hideError = (inputId, errorId) => {
    const input = $(inputId);
    const error = $(errorId);
    if (input) input.removeAttribute('aria-invalid');
    if (error) error.classList.add('opacity-0');
  };

  const clearAllErrors = () => {
    document.querySelectorAll('[id^="error-"]').forEach(el => el.classList.add('opacity-0'));
    document.querySelectorAll('#analysis-form input').forEach(el => el.removeAttribute('aria-invalid'));
  };

  // === ЛОВУШКА ФОКУСА ===
  const focusableElementsSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';
  
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusableElements = modalContent.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  function open() {
    previouslyFocusedElement = document.activeElement;
    form?.reset();
    clearAllErrors();
    birthPlace = null;
    
    formContainer?.classList.remove('hidden');
    loadingScreen?.classList.add('hidden');
    loadingScreen?.classList.remove('flex');

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
      
      const firstInput = $('input-day');
      if (firstInput) firstInput.focus();
    });
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', trapFocus);
  }

  function close() {
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (previouslyFocusedElement) previouslyFocusedElement.focus();
    }, 300);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapFocus);
  }

  btn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); 
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();
    let valid = true;

    const name = $('input-name').value.trim();
    const d = parseInt($('input-day').value);
    const m = parseInt($('input-month').value);
    const y = parseInt($('input-year').value);
    const privacy = $('privacy-checkbox').checked;
    
    let hh = parseInt($('input-hour').value);
    let mm = parseInt($('input-minute').value);
    if (isNaN(hh)) hh = 0;
    if (isNaN(mm)) mm = 0;

    let dateValid = true;
    const currentYear = new Date().getFullYear();
    
    if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 1920 || y > currentYear) {
      dateValid = false;
    } else {
      const birthDate = new Date(y, m - 1, d);
      const today = new Date();
      
      if (birthDate.getDate() !== d || birthDate.getMonth() !== m - 1) {
        dateValid = false;
      } else {
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
        if (birthDate > today || age < 18) dateValid = false;
      }
    }

    if (!dateValid) {
      showError('input-day', 'error-date', 'Укажите корректную дату (18+)');
      showError('input-month', 'error-date', '');
      showError('input-year', 'error-date', '');
      valid = false;
    }

    const timeStr = ($('input-hour').value.trim() + $('input-minute').value.trim());
    if (timeStr && (hh < 0 || hh > 23 || mm < 0 || mm > 59)) {
      showError('input-hour', 'error-time', 'Некорректное время');
      showError('input-minute', 'error-time', '');
      valid = false;
    }

    if (name.length > 0) {
      const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
      if (!nameRegex.test(name)) {
        showError('input-name', 'error-name', 'Только буквы, пробел и дефис');
        valid = false;
      }
    }

    if (!birthPlace) {
      showError('input-city', 'error-city', 'Выберите город из списка');
      valid = false;
    }

    if (!privacy) {
      const errBox = $('error-privacy');
      if (errBox) errBox.classList.remove('opacity-0');
      valid = false;
    }

    if (!valid) return;

    // --- ЗАГРУЗКА И РЕДИРЕКТ НА ДАШБОРД ---
    
    formContainer?.classList.add('hidden');
    loadingScreen?.classList.remove('hidden');
    loadingScreen?.classList.add('flex');

    setTimeout(() => {
      const userData = {
        name: name || 'Гость',
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        city: birthPlace.city,
        time: (hh || mm) ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : "00:00" 
      };
      
      sessionStorage.setItem('inastralium_user_data', JSON.stringify(userData));
      window.location.href = '/dashboard.html';
    }, 2000);
  });

  const autoAdvance = (currentId, nextId, maxLen) => {
    const cur = $(currentId);
    const nxt = $(nextId);
    if (!cur || !nxt) return;
    cur.addEventListener('input', () => {
      if (cur.value.length >= maxLen) nxt.focus();
    });
  };
  autoAdvance('input-day', 'input-month', 2);
  autoAdvance('input-month', 'input-year', 2);
  autoAdvance('input-hour', 'input-minute', 2);
}

// ==========================================
// 5. ЛОГИКА ДАШБОРДА (ИИ)
// ==========================================
function initDashboard() {
  const arcanaEl = document.getElementById('arcana-number');
  if (!arcanaEl) return; // Мы не на дашборде, выходим

  const ARCANA_NAMES = {
      1: "Маг", 2: "Верховная Жрица", 3: "Императрица", 4: "Император",
      5: "Иерофант", 6: "Влюбленные", 7: "Колесница", 8: "Справедливость",
      9: "Отшельник", 10: "Колесо Фортуны", 11: "Сила", 12: "Повешенный",
      13: "Смерть", 14: "Умеренность", 15: "Дьявол", 16: "Башня",
      17: "Звезда", 18: "Луна", 19: "Солнце", 20: "Суд",
      21: "Мир", 22: "Шут"
  };

  function trimIncomplete(text) {
      if (!text) return text;
      if (/[.!?]$/.test(text.trim())) return text;
      const lastPeriod = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
      if (lastPeriod !== -1) {
          return text.substring(0, lastPeriod + 1);
      }
      return text + ".";
  }

  // Обновленная функция запроса к нашему API
  async function generateAIText(prompt, retries = 3) {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (response.status === 429 && retries > 0) {
        console.warn(`Превышен лимит (429). Повторная попытка через 2 секунды... Осталось попыток: ${retries}`);
        await new Promise(r => setTimeout(r, 2000));
        return generateAIText(prompt, retries - 1);
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
      return trimIncomplete(data.choices[0].message.content);
    } catch (error) {
      console.error("Ошибка ИИ:", error.message);
      return null;
    }
  }

  function getArcana(dateStr) {
      try {
          const parts = dateStr.split('-');
          const total = parseInt(parts[2]) + parseInt(parts[1]) + parseInt(parts[0]);
          return (total % 22) || 22;
      } catch { return 1; }
  }

  function getZodiac(dateStr) {
      try {
          const [year, month, day] = dateStr.split('-').map(Number);
          if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Овен";
          if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Телец";
          if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Близнецы";
          if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Рак";
          if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Лев";
          if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Дева";
          if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Весы";
          if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Скорпион";
          if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Стрелец";
          if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Козерог";
          if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Водолей";
          return "Рыбы";
      } catch { return "Овен"; }
  }

  const params = new URLSearchParams(window.location.search);
  
  let userData = null;
  try {
    const stored = sessionStorage.getItem('inastralium_user_data');
    if (stored) userData = JSON.parse(stored);
  } catch (e) {
    console.error("Ошибка чтения sessionStorage:", e);
  }

  // Если данных нет ни в сессии, ни в URL — значит человек зашел напрямую
  if (!userData && !params.get('name') && !params.get('date')) {
    document.getElementById('user-title').innerText = "Секунду...";
    document.getElementById('user-data').innerText = "Перенаправляем на главную для ввода данных";
    
    const cards = document.querySelectorAll('.grid > div');
    cards.forEach(card => card.style.display = 'none');

    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);
    return; 
  }

  const name = userData?.name || params.get('name') || "Гость";
  const date = userData?.date || params.get('date') || "2000-01-01";
  const city = userData?.city || params.get('city') || "Москва";
  const timeStr = userData?.time || "";

  document.getElementById('user-title').innerText = `Привет, ${name}`;
  document.getElementById('user-data').innerText = `${date} • ${city}`;

  const arcana = getArcana(date);
  const arcanaName = ARCANA_NAMES[arcana] || "";
  const zodiac = getZodiac(date);

  document.getElementById('arcana-number').innerText = arcanaName;
  document.getElementById('zodiac-sign').innerText = zodiac;

  // Выбираем карту Таро заранее (по сиду с учетом времени)
  let randomCard = null;
  if (DECK && DECK.length > 0) {
    const seedStr = `${name}-${date}-${timeStr}`;
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    let t = h + 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const rnd = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    randomCard = DECK[Math.floor(rnd * DECK.length)];
  }

  // Запускаем все 3 запроса ПАРАЛЛЕЛЬНО с красивыми лоадерами
  
  const skeleton = `<span class="skeleton-text" style="width: 100%; height: 1em; display: block; margin-bottom: 0.5em;"></span><span class="skeleton-text" style="width: 80%; height: 1em; display: block; margin-bottom: 0.5em;"></span><span class="skeleton-text" style="width: 60%; height: 1em; display: block;"></span>`;

  // 1. МАТРИЦА
  const elMatrix = document.getElementById('arcana-text');
  elMatrix.innerHTML = skeleton;
  elMatrix.classList.remove('animate-pulse');

  const promiseMatrix = generateAIText(`Твой аркан — ${arcanaName}. Опиши, какие у меня сильные стороны, черты характера и главный жизненный урок.`).then(matrixText => {
      if (matrixText) {
          elMatrix.innerText = matrixText;
      } else {
          elMatrix.innerHTML = `<span class="text-[#D4C4A8]">Звезды сегодня молчат. Не удалось получить ответ.</span> <button onclick="window.location.reload()" class="underline hover:text-white transition-colors ml-1">Обновить</button>`;
      }
  });

  // 2. НАТАЛКА
  const elNatal = document.getElementById('zodiac-text');
  elNatal.innerHTML = skeleton;
  elNatal.classList.remove('animate-pulse');

  const promiseNatal = generateAIText(`Я родился ${date}. Мой знак зодиака — ${zodiac}. Опиши мою суть и то, как меня видят окружающие.`).then(natalText => {
      if (natalText) {
          elNatal.innerText = natalText;
      } else {
          elNatal.innerHTML = `<span class="text-[#D4C4A8]">Звезды сегодня молчат. Не удалось получить ответ.</span> <button onclick="window.location.reload()" class="underline hover:text-white transition-colors ml-1">Обновить</button>`;
      }
  });

  // 3. ТАРО
  let promiseTarot = Promise.resolve();
  const elTarot = document.getElementById('tarot-meaning');
  
  if (randomCard) {
      document.getElementById('tarot-name').innerText = randomCard.name;
      const tarotImageDiv = document.getElementById('tarot-image');
      if (tarotImageDiv) {
          // Грузим WEBP с эффектом плавного появления
          tarotImageDiv.innerHTML = `<img src="/cards/${randomCard.id}.webp" 
            class="w-full h-full object-cover rounded-md transition-all duration-1000 ease-out opacity-0 scale-105" 
            onload="this.classList.remove('opacity-0', 'scale-105'); this.classList.add('opacity-100', 'scale-100');"
            onerror="this.src='/tarot.webp'">`;
      }

      elTarot.innerHTML = skeleton;
      elTarot.classList.remove('animate-pulse');

      promiseTarot = generateAIText(`Я вытянул карту Таро: "${randomCard.name}". Что эта карта значит для меня сегодня и какой совет ты мне дашь?`).then(tarotText => {
          if (tarotText) {
              elTarot.innerText = tarotText;
          } else {
              elTarot.innerHTML = `<span class="text-[#D4C4A8]">Звезды сегодня молчат. Не удалось получить ответ.</span> <button onclick="window.location.reload()" class="underline hover:text-white transition-colors ml-1">Обновить</button>`;
          }
      });
  }

  Promise.all([promiseMatrix, promiseNatal, promiseTarot]).then(() => {
    console.log("Все данные дашборда загружены.");
  });
}

// ==========================================
// 6. ДАТА ОБНОВЛЕНИЯ (ДЛЯ ЮРИДИЧЕСКИХ СТРАНИЦ)
// ==========================================
function initPrivacyDate() {
  const dateEl = document.getElementById('current-date');
  if (!dateEl) return;
  
  const date = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = date.toLocaleDateString('ru-RU', options);
}

// ==========================================
// ЗАПУСК
// ==========================================
document.fonts.ready.then(() => {
  updateMoonCalendar();
  initDailyCard();
  initSlider();
  initModal();
  initDashboard();
  initPrivacyDate();
  
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  // МОБИЛЬНОЕ МЕНЮ
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const menuLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuBtn && menu) {
    const closeMenu = () => {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      menu.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      
      document.getElementById('menu-icon-open').classList.remove('hidden');
      document.getElementById('menu-icon-close').classList.add('hidden');
      document.body.style.overflow = '';
    };

    menuBtn.addEventListener('click', () => {
      const isHidden = menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !isHidden);
      menu.classList.toggle('flex', isHidden);
      
      menu.setAttribute('aria-hidden', !isHidden ? 'true' : 'false');
      menuBtn.setAttribute('aria-expanded', !isHidden ? 'true' : 'false');

      document.getElementById('menu-icon-open').classList.toggle('hidden', isHidden);
      document.getElementById('menu-icon-close').classList.toggle('hidden', !isHidden);
      document.body.style.overflow = isHidden ? 'hidden' : '';
    });

    menuLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  const instrumentsSection = document.getElementById('instruments');
  const floatingBtn = document.getElementById('floating-btn-container');
  const aboutSection = document.getElementById('about');

  if (instrumentsSection && floatingBtn) {
    const checkVisibility = () => {
      if (window.innerWidth >= 768) return;

      const instRect = instrumentsSection.getBoundingClientRect();
      const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;
      
      const isInsideInstruments = instRect.top < window.innerHeight * 0.8;
      const isNotInAbout = aboutRect ? aboutRect.top > window.innerHeight * 0.8 : true;

      if (isInsideInstruments && isNotInAbout) {
        floatingBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        floatingBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        floatingBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
        floatingBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      }
    };

    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility);
    checkVisibility();
  }

  const hackerTitle = document.getElementById('hacker-title');
  if (hackerTitle) {
    const finalText = "тайный код вселенной";
    const chars = "0123456789";
    let iterations = 0;
    let isScrambling = true;
    
    const scramble = () => {
      if (!isScrambling) return;
      
      const textArr = finalText.split("");
      hackerTitle.textContent = textArr.map((char, index) => {
        if (char === " ") return " ";
        if (index < Math.floor(iterations)) return finalText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      
      if (iterations >= finalText.length) {
        isScrambling = false;
        setTimeout(() => {
          iterations = 0;
          isScrambling = true;
          scramble();
        }, 3000);
        return;
      }
      
      iterations += 0.7; 
      setTimeout(() => requestAnimationFrame(scramble), 50); 
    };
    
    setTimeout(scramble, 500);
  }

  document.body.classList.add('loaded');
});