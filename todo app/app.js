(() => {
  const form = document.getElementById('todoForm');
  const input = document.getElementById('todoInput');
  const list = document.getElementById('todoList');
  const emptyState = document.getElementById('emptyState');
  const summaryText = document.getElementById('summaryText');
  const tasksCountPill = document.getElementById('tasksCountPill');
  const clearDoneBtn = document.getElementById('clearDoneBtn');

  const doneCountEl = document.getElementById('doneCount');
  const activeCountEl = document.getElementById('activeCount');
  const progressFill = document.getElementById('progressFill');
  const progressBar = document.getElementById('progressBar');

  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const sortSelect = document.getElementById('sortSelect');



  const STORAGE_KEY = 'todo_ui_items_v1';

  /** @type {{id:string,title:string,done:boolean,createdAt:number}[]} */
  let items = loadItems();

  let filter = 'all';

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(x => x && typeof x.title === 'string')
        .map(x => ({
          id: String(x.id ?? cryptoRandomId()),
          title: x.title,
          done: Boolean(x.done),
          createdAt: Number(x.createdAt ?? Date.now()),
        }));
    } catch {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function cryptoRandomId() {
    // lightweight fallback
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function applyFilter(data) {
    if (filter === 'active') return data.filter(x => !x.done);
    if (filter === 'done') return data.filter(x => x.done);
    return data;
  }

  function applySort(data) {
    const v = sortSelect.value;
    const copy = [...data];

    copy.sort((a, b) => {
      switch (v) {
        case 'created_asc':
          return a.createdAt - b.createdAt;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'created_desc':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return copy;
  }

  function render() {
    const doneCount = items.filter(x => x.done).length;
    const activeCount = items.length - doneCount;

    const total = items.length;
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

    doneCountEl.textContent = String(doneCount);
    activeCountEl.textContent = String(activeCount);

    progressFill.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', String(percent));

    tasksCountPill.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;

    const filtered = applySort(applyFilter(items));

    list.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.hidden = false;
      if (items.length === 0) {
        summaryText.textContent = 'No tasks yet.';
      } else {
        summaryText.textContent = filter === 'all'
          ? 'No tasks.'
          : `No ${filter === 'active' ? 'active' : 'done'} tasks.`;
      }
      clearDoneBtn.disabled = (items.length === 0 || doneCount === 0);
      clearDoneBtn.style.opacity = clearDoneBtn.disabled ? '.55' : '1';
      return;
    }

    emptyState.hidden = true;
    summaryText.textContent = `${filtered.length} shown · ${doneCount} done`;

    for (const item of filtered) {
      const li = document.createElement('li');
      li.className = 'todo' + (item.done ? ' is-done' : '');
      li.dataset.id = item.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.done;
      checkbox.setAttribute('aria-label', item.done ? 'Mark as active' : 'Mark as done');
      checkbox.addEventListener('change', () => {
        item.done = checkbox.checked;
        saveItems();
        render();
      });

      const content = document.createElement('div');
      content.className = 'todo__content';

      const title = document.createElement('p');
      title.className = 'todo__title';
      title.textContent = item.title;

      content.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'todo__actions';

      const del = document.createElement('button');
      del.className = 'icon-btn icon-btn--danger';
      del.type = 'button';
      del.title = 'Delete';
      del.setAttribute('aria-label', 'Delete todo');
      del.textContent = '✕';
      del.addEventListener('click', () => {
        items = items.filter(x => x.id !== item.id);
        saveItems();
        render();
      });

      actions.appendChild(del);

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);

      list.appendChild(li);
    }

    clearDoneBtn.disabled = (doneCount === 0);
    clearDoneBtn.style.opacity = clearDoneBtn.disabled ? '.55' : '1';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    items.unshift({
      id: cryptoRandomId(),
      title,
      done: false,
      createdAt: Date.now(),
    });

    input.value = '';
    input.focus();

    saveItems();
    render();
  });

  clearDoneBtn.addEventListener('click', () => {
    const before = items.length;
    items = items.filter(x => !x.done);
    if (items.length !== before) {
      saveItems();
      render();
    }
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterButtons.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  sortSelect.addEventListener('change', render);




  render();
})();

