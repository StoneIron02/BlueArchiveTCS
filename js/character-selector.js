// Character Selector Module
const CharacterSelector = (() => {
  let selectedCharacters = [];
  let allCharacters = [];
  let tempSelected = [];

  function init() {
    allCharacters = getCharacterList();

    document.getElementById('btn-add-character').addEventListener('click', openModal);
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-confirm-characters').addEventListener('click', confirmSelection);
    document.getElementById('character-search').addEventListener('input', filterCharacters);

    // Close modal on backdrop click
    document.getElementById('character-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    renderGrid(allCharacters);
  }

  function openModal() {
    tempSelected = [...selectedCharacters];
    const modal = document.getElementById('character-modal');
    modal.hidden = false;
    document.getElementById('character-search').value = '';
    renderGrid(allCharacters);
    updateSelectedState();
  }

  function closeModal() {
    document.getElementById('character-modal').hidden = true;
  }

  function confirmSelection() {
    selectedCharacters = [...tempSelected];
    closeModal();
    renderSelectedCharacters();
    App.updatePreview();
  }

  function normalize(str) {
    return str.replace(/[\s()_\-]/g, '').toLowerCase();
  }

  function filterCharacters() {
    const query = normalize(document.getElementById('character-search').value);
    if (!query) {
      renderGrid(allCharacters);
      return;
    }
    const filtered = allCharacters.filter(c =>
      normalize(c.nameKo).includes(query) ||
      normalize(c.nameEn).includes(query) ||
      normalize(c.id).includes(query)
    );
    renderGrid(filtered);
  }

  function renderGrid(characters) {
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';

    characters.forEach(char => {
      const div = document.createElement('div');
      div.className = 'char-grid-item';
      if (tempSelected.includes(char.id)) div.classList.add('selected');
      div.dataset.charId = char.id;

      div.innerHTML = `
        <img src="CharacterPortrait/${char.file}" alt="${char.nameKo}" loading="lazy">
        <div class="char-name">${char.nameKo}</div>
      `;

      div.addEventListener('click', () => toggleCharacter(char.id, div));
      grid.appendChild(div);
    });
  }

  const MAX_CHARACTERS = 10;

  function toggleCharacter(id, element) {
    const idx = tempSelected.indexOf(id);
    if (idx >= 0) {
      tempSelected.splice(idx, 1);
      element.classList.remove('selected');
    } else {
      if (tempSelected.length >= MAX_CHARACTERS) return;
      tempSelected.push(id);
      element.classList.add('selected');
    }
    document.getElementById('selected-count').textContent = `${tempSelected.length}개 선택됨 (최대 ${MAX_CHARACTERS}개)`;
  }

  function updateSelectedState() {
    const items = document.querySelectorAll('.char-grid-item');
    items.forEach(item => {
      if (tempSelected.includes(item.dataset.charId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    document.getElementById('selected-count').textContent = `${tempSelected.length}개 선택됨 (최대 ${MAX_CHARACTERS}개)`;
  }

  function renderSelectedCharacters() {
    const container = document.getElementById('selected-characters');
    const addBtn = document.getElementById('btn-add-character');

    // Remove existing items
    container.querySelectorAll('.selected-char-item').forEach(el => el.remove());

    selectedCharacters.forEach(id => {
      const char = allCharacters.find(c => c.id === id);
      if (!char) return;

      const div = document.createElement('div');
      div.className = 'selected-char-item';
      div.innerHTML = `
        <img src="CharacterPortrait/${char.file}" alt="${char.nameKo}">
        <button class="remove-char" data-id="${id}">&times;</button>
      `;

      div.querySelector('.remove-char').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCharacter(id);
      });

      container.insertBefore(div, addBtn);
    });
  }

  function removeCharacter(id) {
    selectedCharacters = selectedCharacters.filter(c => c !== id);
    renderSelectedCharacters();
    App.updatePreview();
  }

  function getSelected() {
    return selectedCharacters.map(id => {
      const char = allCharacters.find(c => c.id === id);
      return char || null;
    }).filter(Boolean);
  }

  function reset() {
    selectedCharacters = [];
    tempSelected = [];
    renderSelectedCharacters();
  }

  return { init, getSelected, reset };
})();
