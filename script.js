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
    areaOptions: document.getElementById('area-options'),
    priorityOptions: document.getElementById('priority-options'),
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
    areas: ["Financeiro", "Atendimento", "Operacional", "Técnico", "Mentoria", "Inovação", "Marketing", "Pesquisa"],
    colaboradores: [
      { nome: "Marcos", cor: "--azul" },
      { nome: "Ester", cor: "--laranja-primario" }
    ],
    sortOrder: 'desc', // 'desc' para mais novas, 'asc' para mais antigas
    currentTaskId: null,
    activeFilters: {
      areas: [],
      priorities: []
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

      // Opcional: carregar áreas e colaboradores se forem dinâmicos
      const savedAreas = JSON.parse(localStorage.getItem('areas'));
      if (savedAreas) state.areas = savedAreas;

      const savedColabs = JSON.parse(localStorage.getItem('colaboradores'));
      if (savedColabs) state.colaboradores = savedColabs;
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage:", e);
      // Limpar dados corrompidos se necessário
      localStorage.removeItem('tasks');
      localStorage.removeItem('areas');
      localStorage.removeItem('colaboradores');
    }
  }

  function renderInitialUI() {
    filterTasks(); // Renderiza as tarefas com base nos filtros iniciais (todos)
    renderAreaFilters();
    renderAreaOptions();
    renderResponsavelOptions();
    updateChart();
    updateSortButtonText(); // Atualiza o texto do botão de ordenação
  }

  // =============================
  // 4. RENDERIZAÇÃO
  // =============================
  function renderTasks(tasksToRender = state.tasks) {
    const sorted = [...tasksToRender].sort((a, b) => {
      // Tarefas concluídas vão para o final
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Ordena por timestamp
      return state.sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });

    DOM.tasksContainer.innerHTML = sorted.map(task => `
      <div class="task-card ${task.completed ? 'completed' : ''}"
           data-id="${task.id}"
           data-area="${task.area}"
           data-priority="${task.priority}"
           data-time="${task.timestamp}">
        <div class="task-border" style="border-left: 6px solid ${getResponsavelColor(task.responsavel)}"></div>
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
    DOM.taskAreaSelect.innerHTML = '<option value="" disabled selected>Selecione uma área</option>'; // Default option
    state.areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      DOM.taskAreaSelect.appendChild(option);
    });
  }

  function renderResponsavelOptions() {
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
  }

  function filterTasks() {
    const search = DOM.searchInput.value.toLowerCase();
    const filtered = state.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search) || task.desc.toLowerCase().includes(search);
      const matchesArea = state.activeFilters.areas.length === 0 || state.activeFilters.areas.includes(task.area);
      const matchesPriority = state.activeFilters.priorities.length === 0 || state.activeFilters.priorities.includes(task.priority);
      return matchesSearch && matchesArea && matchesPriority;
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
    document.body.style.overflow = 'hidden'; // Previne scroll do body
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restaura scroll do body
  }

  function showTaskModal() {
    DOM.modalTitle = DOM.taskModal.querySelector('#modal-title');
    DOM.modalTitle.textContent = 'Nova Tarefa';
    DOM.taskTitleInput.value = '';
    DOM.taskDescInput.value = '';
    DOM.taskPrioritySelect.value = 'sem-urgencia';
    DOM.taskAreaSelect.value = ''; // Reseta para a opção padrão
    const selectedResponsavel = DOM.taskModal.querySelector('input[name="responsavel"]:checked');
    if (selectedResponsavel) selectedResponsavel.checked = false; // Desmarca o responsável
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
      id: Date.now(), // ID único baseado no timestamp
      title: data.title,
      desc: data.desc,
      area: data.area,
      responsavel: data.responsavel,
      priority: data.priority,
      timestamp: Date.now(), // Timestamp de criação
      completed: false,
      completedAt: null
    };

    state.tasks.unshift(newTask); // Adiciona a nova tarefa no início
    saveTasks();
    filterTasks(); // Re-renderiza com a nova tarefa
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
      task.completedAt = task.completed ? Date.now() : null; // Registra a data de conclusão
      saveTasks();
      filterTasks(); // Re-renderiza para atualizar o status visual
      updateChart();
      if (task.completed) { // Se a tarefa foi marcada como concluída
        triggerConfetti();
      }
      // Opcional: Se todas as tarefas estiverem concluídas, disparar confetes
      // if (state.tasks.length > 0 && state.tasks.every(t => t.completed)) {
      //   triggerConfetti();
      // }
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
    if (isNaN(date.getTime())) { // Verifica se a data é válida
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
    return colab ? `var(${colab.cor})` : 'var(--cinza-escuro)'; // Cor padrão se não encontrar
  }

  function triggerConfetti() {
    // Verifica se a biblioteca confetti está carregada
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF7D33', '#FFAA6B', '#E65C00', '#4e9ef5'] // Cores da paleta
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
    DOM.searchInput.addEventListener('input', filterTasks);
    DOM.sortTimeBtn.addEventListener('click', toggleSortOrder);

    DOM.taskSubmitBtn.addEventListener('click', handleTaskSubmit);
    
    // Event listeners para fechar modais
    DOM.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });
    document.getElementById('task-cancel').addEventListener('click', () => closeModal(DOM.taskModal)); // Botão Cancelar do modal de task

    document.getElementById('confirm-cancel').addEventListener('click', () => closeModal(DOM.confirmModal));
    document.getElementById('confirm-delete').addEventListener('click', () => deleteTask(state.currentTaskId));

    // Delegação de eventos para tasks (checkbox e delete)
    DOM.tasksContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      if (!card) return; // Clicou fora de um card

      const id = parseInt(card.dataset.id);

      if (e.target.classList.contains('task-checkbox')) {
        toggleTaskStatus(id);
      } else if (e.target.classList.contains('task-delete')) {
        showDeleteConfirmation(id);
      }
    });

    // Fechar modal ao clicar fora dele
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
    });
  }

  // =============================
  // 9. BOOTSTRAP
  // =============================
  init();
});
