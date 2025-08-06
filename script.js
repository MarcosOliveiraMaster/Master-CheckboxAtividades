document.addEventListener('DOMContentLoaded', () => {
  // =============================
  // 1. ELEMENTOS DOM
  // =============================
  const DOM = {
    container: document.querySelector('.container'),
    divgrafico: document.querySelector('.divgrafico'),
    divdata: document.querySelector('.divdata'),

    donutChart: document.querySelector('.donut-chart'),
    percentageEl: document.querySelector('.percentage'),
    counterEl: document.querySelector('.counter'),

    filterAreaBtn: document.getElementById('filter-area-btn'),
    filterPriorityBtn: document.getElementById('filter-priority-btn'),
    filterResponsavelBtn: document.getElementById('filter-responsavel-btn'),
    filterStatusBtn: document.getElementById('filter-status-btn'), // Novo DOM element
    areaOptions: document.getElementById('area-options'),
    priorityOptions: document.getElementById('priority-options'),
    responsavelOptions: document.getElementById('responsavel-options'),
    statusOptions: document.getElementById('status-options'), // Novo DOM element
    searchInput: document.getElementById('search-input'),
    sortTimeBtn: document.getElementById('sort-time-btn'),

    novaTaskBtn: document.getElementById('novaTask'),
    tasksContainer: document.getElementById('tasks-container'),

    confirmModal: document.getElementById('confirm-modal'),
    taskModal: document.getElementById('task-modal'),
    closeModalBtns: document.querySelectorAll('.close-modal'),

    taskTitleInput: document.getElementById('task-title-input'),
    taskDescInput: document.getElementById('task-desc-input'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskAreaSelect: document.getElementById('task-area-select'),
    taskSubmitBtn: document.getElementById('task-submit')
  };

  // =============================
  // 2. ESTADO GLOBAL
  // =============================
  const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    areas: ["Atendimento", "Operacional", "Financeiro", "TI - Técnologia", "Mentoria", "Inovação", "Jurídico", "Marketing", "Pesquisa"],
    colaboradores: [
      { nome: "Marcos", cor: "--azul" },
      { nome: "Ester", cor: "--vermelho" } // Alterado para vermelho para Ester
    ],
    sortOrder: 'desc', // 'desc' para mais novas, 'asc' para mais antigas
    currentTaskId: null,
    activeFilters: {
      areas: [],
      priorities: [],
      responsaveis: [],
      status: [] // Novo filtro de status (e.g., 'completed', 'pending')
    }
  };

  // =============================
  // 3. INICIALIZAÇÃO
  // =============================
  function init() {
    loadSavedData();
    setupEventListeners();
    renderInitialUI();
    setupFilterListeners();
  }

  function loadSavedData() {
    try {
      const savedTasks = JSON.parse(localStorage.getItem('tasks'));
      if (savedTasks) state.tasks = savedTasks;

      const savedAreas = JSON.parse(localStorage.getItem('areas'));
      if (savedAreas) state.areas = savedAreas;

      const savedColabs = JSON.parse(localStorage.getItem('colaboradores'));
      if (savedColabs) state.colaboradores = savedColabs;
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage:", e);
      localStorage.removeItem('tasks');
      localStorage.removeItem('areas');
      localStorage.removeItem('colaboradores');
    }
  }

  function renderInitialUI() {
    filterTasks();
    renderAreaFilters();
    renderAreaOptions();
    renderResponsavelOptionsForModal(); // Renomeado para clareza
    updateChart();
    updateSortButtonText();
  }

  // =============================
  // 4. RENDERIZAÇÃO
  // =============================
  function renderTasks(tasksToRender = state.tasks) {
    const sorted = [...tasksToRender].sort((a, b) => {
      // Prioriza tarefas não concluídas
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      // Em seguida, ordena por timestamp
      return state.sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });

    DOM.tasksContainer.innerHTML = sorted.map(task => `
      <div class="task-card ${task.completed ? 'completed' : ''}"
           data-id="${task.id}"
           data-area="${task.area}"
           data-priority="${task.priority}"
           data-responsavel="${task.responsavel}"
           data-time="${task.timestamp}"
           data-status="${task.completed ? 'completed' : 'pending'}">
        <div class="task-border" style="border-left: 4px solid ${getResponsavelColor(task.responsavel)}"></div>
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
          <div class="task-header">
            <span class="task-area">${task.area}</span>
            <span class="task-time">
              ${formatDate(task.timestamp)}
              ${task.completed ? `<br><small>Concluído em: ${formatDate(task.completedAt)}</small>` : ''}
            </span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.desc}</div>
          <div class="task-priority ${task.priority}">${getPriorityLabel(task.priority)}</div>
        </div>
        <i class="fas fa-trash task-delete"></i>
      </div>
    `).join('');
  }

  function renderAreaFilters() {
    DOM.areaOptions.innerHTML = state.areas.map(area => `
      <label class="filter-option-item">
        <input type="checkbox" value="${area}" ${state.activeFilters.areas.includes(area) ? 'checked' : ''}> 
        ${area}
      </label>
    `).join('');
  }

  function renderAreaOptions() {
    DOM.taskAreaSelect.innerHTML = '<option value="" disabled selected>Selecione uma área</option>';
    state.areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      DOM.taskAreaSelect.appendChild(option);
    });
  }

  // Renderiza as opções de responsável no modal de cadastro/edição
  function renderResponsavelOptionsForModal() {
    const container = DOM.taskModal.querySelector('.responsaveis-container');
    container.innerHTML = state.colaboradores.map(colab => `
      <label class="responsavel-option ${colab.nome.toLowerCase()}-option">
        <input type="radio" name="responsavel" value="${colab.nome}">
        <span class="responsavel-name">${colab.nome}</span>
      </label>
    `).join('');
  }

  function updateChart() {
    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    DOM.percentageEl.textContent = `${percent}%`;
    DOM.counterEl.textContent = `${done} / ${total}`;
    DOM.donutChart.style.background = `
      conic-gradient(var(--laranja-primario) ${percent}%, var(--cinza-medio) ${percent}%)
    `;
  }

  // =============================
  // 5. FILTRAGEM & BUSCA
  // =============================
  function setupFilterListeners() {
    DOM.areaOptions.addEventListener('change', e => {
      const val = e.target.value;
      if (e.target.checked) {
        if (!state.activeFilters.areas.includes(val)) {
          state.activeFilters.areas.push(val);
        }
      } else {
        state.activeFilters.areas = state.activeFilters.areas.filter(a => a !== val);
      }
      filterTasks();
    });

    DOM.priorityOptions.addEventListener('change', e => {
      const val = e.target.value;
      if (e.target.checked) {
        if (!state.activeFilters.priorities.includes(val)) {
          state.activeFilters.priorities.push(val);
        }
      } else {
        state.activeFilters.priorities = state.activeFilters.priorities.filter(p => p !== val);
      }
      filterTasks();
    });

    DOM.responsavelOptions.addEventListener('change', e => {
      const val = e.target.value;
      if (e.target.checked) {
        if (!state.activeFilters.responsaveis.includes(val)) {
          state.activeFilters.responsaveis.push(val);
        }
      } else {
        state.activeFilters.responsaveis = state.activeFilters.responsaveis.filter(r => r !== val);
      }
      filterTasks();
    });

    // Novo listener para o filtro de status de conclusão
    DOM.statusOptions.addEventListener('change', e => {
      const val = e.target.value; // 'completed' ou 'pending'
      if (e.target.checked) {
        if (!state.activeFilters.status.includes(val)) {
          state.activeFilters.status.push(val);
        }
      } else {
        state.activeFilters.status = state.activeFilters.status.filter(s => s !== val);
      }
      filterTasks();
    });
  }

  function filterTasks() {
    const search = DOM.searchInput.value.toLowerCase();
    const filtered = state.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search) || task.desc.toLowerCase().includes(search);
      const matchesArea = state.activeFilters.areas.length === 0 || state.activeFilters.areas.includes(task.area);
      const matchesPriority = state.activeFilters.priorities.length === 0 || state.activeFilters.priorities.includes(task.priority);
      const matchesResponsavel = state.activeFilters.responsaveis.length === 0 || state.activeFilters.responsaveis.includes(task.responsavel);
      
      // Lógica para o novo filtro de status
      const matchesStatus = state.activeFilters.status.length === 0 ||
                            (state.activeFilters.status.includes('completed') && task.completed) ||
                            (state.activeFilters.status.includes('pending') && !task.completed);

      return matchesSearch && matchesArea && matchesPriority && matchesResponsavel && matchesStatus;
    });
    renderTasks(filtered);
  }

  function toggleSortOrder() {
    state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    filterTasks();
    updateSortButtonText();
  }

  function updateSortButtonText() {
    DOM.sortTimeBtn.innerHTML = `
      <i class="fas fa-clock"></i> Ordenar por hora (${state.sortOrder === 'asc' ? 'mais antigas' : 'mais novas'})
    `;
  }

  // =============================
  // 6. MODAIS E FORMULÁRIOS
  // =============================
  function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function showTaskModal() {
    DOM.modalTitle = DOM.taskModal.querySelector('#modal-title');
    DOM.modalTitle.textContent = 'Nova Tarefa';
    DOM.taskTitleInput.value = '';
    DOM.taskDescInput.value = '';
    DOM.taskPrioritySelect.value = 'sem-urgencia';
    DOM.taskAreaSelect.value = '';
    // Desmarcar todos os radio buttons de responsável
    const responsavelRadios = DOM.taskModal.querySelectorAll('input[name="responsavel"]');
    responsavelRadios.forEach(radio => radio.checked = false);
    openModal(DOM.taskModal);
  }

  function handleTaskSubmit() {
    const title = DOM.taskTitleInput.value.trim();
    const desc = DOM.taskDescInput.value.trim();
    const area = DOM.taskAreaSelect.value;
    const priority = DOM.taskPrioritySelect.value;
    const responsavel = DOM.taskModal.querySelector('input[name="responsavel"]:checked')?.value;

    if (!title || !area || !responsavel) {
      alert('Por favor, preencha o Título, a Área e selecione um Responsável para a tarefa.');
      return;
    }

    addTask({ title, desc, area, priority, responsavel });
  }

  function addTask(data) {
    const newTask = {
      id: Date.now(),
      title: data.title,
      desc: data.desc,
      area: data.area,
      responsavel: data.responsavel,
      priority: data.priority,
      timestamp: Date.now(),
      completed: false,
      completedAt: null
    };

    state.tasks.unshift(newTask);
    saveTasks();
    filterTasks();
    updateChart();
    closeModal(DOM.taskModal);
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    filterTasks();
    updateChart();
    closeModal(DOM.confirmModal);
  }

  function toggleTaskStatus(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      saveTasks();
      filterTasks();
      updateChart();
      if (task.completed) {
        triggerConfetti();
      }
    }
  }

  // =============================
  // 7. UTILITÁRIOS
  // =============================
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
  }

  function formatDate(ts) {
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getPriorityLabel(p) {
    switch (p) {
      case 'urgente': return 'Alta Prioridade';
      case 'espera': return 'Média Prioridade';
      case 'sem-urgencia': return 'Baixa Prioridade';
      default: return p;
    }
  }

  function getResponsavelColor(nome) {
    const colab = state.colaboradores.find(c => c.nome === nome);
    return colab ? `var(${colab.cor})` : 'var(--cinza-escuro)';
  }

  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100, // Diminuído
        spread: 60, // Diminuído
        origin: { y: 0.6 },
        colors: ['#FF7D33', '#FFAA6B', '#E65C00', '#4e9ef5']
      });
    }
  }

  function showDeleteConfirmation(id) {
    state.currentTaskId = id;
    openModal(DOM.confirmModal);
  }

  function toggleFilter(menu) {
    menu.classList.toggle('hidden');
  }

  // =============================
  // 8. EVENTOS
  // =============================
  function setupEventListeners() {
    DOM.novaTaskBtn.addEventListener('click', showTaskModal);
    DOM.filterAreaBtn.addEventListener('click', () => toggleFilter(DOM.areaOptions));
    DOM.filterPriorityBtn.addEventListener('click', () => toggleFilter(DOM.priorityOptions));
    DOM.filterResponsavelBtn.addEventListener('click', () => toggleFilter(DOM.responsavelOptions));
    DOM.filterStatusBtn.addEventListener('click', () => toggleFilter(DOM.statusOptions)); // Novo evento
    DOM.searchInput.addEventListener('input', filterTasks);
    DOM.sortTimeBtn.addEventListener('click', toggleSortOrder);

    DOM.taskSubmitBtn.addEventListener('click', handleTaskSubmit);
    
    DOM.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });
    document.getElementById('task-cancel').addEventListener('click', () => closeModal(DOM.taskModal));

    document.getElementById('confirm-cancel').addEventListener('click', () => closeModal(DOM.confirmModal));
    document.getElementById('confirm-delete').addEventListener('click', () => deleteTask(state.currentTaskId));

    DOM.tasksContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      if (!card) return;

      const id = parseInt(card.dataset.id);

      if (e.target.classList.contains('task-checkbox')) {
        toggleTaskStatus(id);
      } else if (e.target.classList.contains('task-delete')) {
        showDeleteConfirmation(id);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal') && !e.target.closest('.modal-content')) {
        closeModal(e.target);
      }
    });

    // Fechar menus de filtro ao clicar fora
    document.addEventListener('click', (e) => {
      if (!DOM.filterAreaBtn.contains(e.target) && !DOM.areaOptions.contains(e.target)) {
        DOM.areaOptions.classList.add('hidden');
      }
      if (!DOM.filterPriorityBtn.contains(e.target) && !DOM.priorityOptions.contains(e.target)) {
        DOM.priorityOptions.classList.add('hidden');
      }
      if (!DOM.filterResponsavelBtn.contains(e.target) && !DOM.responsavelOptions.contains(e.target)) {
        DOM.responsavelOptions.classList.add('hidden');
      }
      // Novo: Fechar filtro de status ao clicar fora
      if (!DOM.filterStatusBtn.contains(e.target) && !DOM.statusOptions.contains(e.target)) {
        DOM.statusOptions.classList.add('hidden');
      }
    });
  }

  // =============================
  // 9. BOOTSTRAP
  // =============================
  init();
});
