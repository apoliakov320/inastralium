// src/lib/geocode.js

export function initCityAutocomplete(inputEl, onSelect) {
  let timer;
  const listId = 'city-suggestions';
  let list = document.getElementById(listId);
  
  if (!list) {
    list = document.createElement('ul');
    list.id = listId;
    // Делаем список по центру, фиксированной ширины, с правильными стилями
    list.className = 'absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-[#050814] border border-[#D4C4A8]/40 rounded-md z-[100] max-h-60 overflow-y-auto text-sm hidden shadow-[0_10px_30px_rgba(0,0,0,0.9)] w-[280px]';
    inputEl.parentElement.style.position = 'relative';
    inputEl.parentElement.appendChild(list);
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inputEl.value.trim();
    
    if (q.length < 2) {
      list.classList.add('hidden');
      return;
    }
    
    timer = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=20&language=ru&format=json`;
        
        const r = await fetch(url);
        const data = await r.json();
        
        if (!data.results || !data.results.length) {
          list.classList.add('hidden');
          return;
        }

        const filtered = data.results.filter(f => {
          const isCity = ['PPL', 'PPLA', 'PPLC', 'PPLA2'].includes(f.feature_code);
          const isBigEnough = (f.population || 0) > 10000;
          return isCity && isBigEnough;
        });

        const finalCities = filtered.length > 0 ? filtered : data.results.slice(0, 3);
        const cities = finalCities.slice(0, 5);

        // Выстраиваем элементы в одну строку (flex row) и выравниваем по центру
        list.innerHTML = cities.map((f, i) => {
          const info = f.admin1 ? `${f.admin1}, ${f.country}` : f.country;
          
          return `
            <li data-i="${i}" class="px-4 py-2 cursor-pointer hover:bg-[#D4C4A8]/10 text-[#F4F4F5] transition-colors border-b border-white/5 last:border-0 flex flex-row items-center justify-center gap-2 whitespace-nowrap">
              <span class="font-medium text-sm">${f.name}</span>
              <span class="text-[#A3A3A3] text-[10px] uppercase tracking-wider truncate">${info}</span>
            </li>
          `;
        }).join('');
          
        list.classList.remove('hidden');
        
        // Обработка клика по городу
        list.querySelectorAll('li').forEach((li) => {
          li.addEventListener('click', () => {
            const f = cities[+li.dataset.i];
            
            inputEl.value = f.name;
            list.classList.add('hidden'); // Скрываем список
            
            onSelect({
              city: f.name,
              country: f.country || '',
              lat: f.latitude,
              lon: f.longitude,
              tz: f.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
          });
        });
      } catch (err) {
        console.error('Ошибка поиска города:', err);
        list.classList.add('hidden');
      }
    }, 300);
  });

  // Скрываем при клике вне поля
  document.addEventListener('click', (e) => {
    if (!inputEl.parentElement.contains(e.target)) {
      list.classList.add('hidden');
    }
  });
}