document.addEventListener('DOMContentLoaded', () => {
  // =============================================
  // 1. CONSTANTES E ELEMENTOS DOM
  // =============================================
  const DOM = {
    // Elementos principais
    container: document.querySelector('.container'),
    divgrafico: document.querySelector('.divgrafico'),
    divdata: document.querySelector('.divdata'),
    
    // Elementos do gráfico
    donutChart: document.querySelector('.donut-chart'),
    percentageEl: document.querySelector('.percentage'),
    counterEl: document.querySelector('.counter'),
    
    // Filtros e busca
    filterAreaBtn: document.getElementById('filter-area-btn'),
    filterPriorityBtn: document.getElementById('filter-priority-btn'),
    areaOptions: document.getElementById('area-options'),
    priorityOptions: document.getElementById('priority-options'),
    searchInput: document.getElementById('search-input'),
    sortTimeBtn: document.getElementById('sort-time-btn'),
    
    // Tasks
    novaTaskBtn: document.getElementById('novaTask'),
    tasksContainer: document.getElementById('tasks-container'),
    
    // Modais
    confirmModal: document.getElementById('confirm-modal'),
    taskModal: document.getElementById('task-modal'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
    
    // Formulário de task
    taskTitleInput: document.getElementById('task-title-input'),
    taskDescInput: document.getElementById('task-desc-input'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskAreaSelect: document.getElementById('task-area-select'), // Novo elemento
    taskSubmitBtn: document.getElementById('task-submit'),
    modalResponsavelList: document.getElementById('modal-responsavel-list')
  };

  // =============================================
  // 2. ESTADO DA APLICAÇÃO
  // =============================================
  const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    areas: ["Financeiro", "Atendimento", "Operacional", "Técnico", "Mentoria", "Inovação", "Marketing", "Pesquisa"],
    colaboradores: [
      { nome: "Ester", cor: "--laranja-primario" },
      { nome: "Marcos", cor: "--azul" }
    ],
    sortOrder: 'desc',
    currentTaskId: null
  };

  // =============================================
  // 3. FUNÇÕES DE INICIALIZAÇÃO
  // =============================================
  function init() {
    loadSavedData();
    setupEventListeners();
    renderInitialUI();
  }

  function loadSavedData() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks'));
    if (savedTasks) state.tasks = savedTasks;
    
    const savedAreas = JSON.parse(localStorage.getItem('areas'));
    if (savedAreas) state.areas = savedAreas;
    
    const savedColabs = JSON.parse(localStorage.getItem('colaboradores'));
    if (savedColabs) state.colaboradores = savedColabs;
  }

  // =============================================
  // 4. FUNÇÕES DE RENDERIZAÇÃO
  // =============================================
  function renderInitialUI() {
    renderTasks();
    renderAreaFilters();
    renderAreaOptions(); // Modificado para usar select
    renderResponsavelOptions();
    updateChart();
  }

  function renderTasks(tasksToRender = state.tasks) {
    DOM.tasksContainer.innerHTML = tasksToRender.map(task => `
      <div class="task-card ${task.completed ? 'completed' : ''}" 
           data-id="${task.id}" 
           data-area="${task.area}" 
           data-priority="${task.priority}" 
           data-time="${task.timestamp}">
        <div class="task-border" style="border-left: 4px solid ${getResponsavelColor(task.responsavel)}"></div>
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
          <div class="task-header">
            <span class="task-area">${task.area}</span>
            <span class="task-time">${formatDate(task.timestamp)}</span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.desc}</div>
          <div class="task-priority ${task.priority}">${getPriorityLabel(task.priority)}</div>
        </div>
        <i class="fas fa-trash task-delete"></i>
        ${task.attachment ? '<i class="fas fa-paperclip task-attachment"></i>' : ''}
      </div>
    `).join('');
  }

  function renderAreaFilters() {
    DOM.areaOptions.innerHTML = state.areas.map(area => `
      <label>
        <input type="checkbox" value="${area}"> 
        ${area}
      </label>
    `).join('');
  }

  function renderAreaOptions() {
    DOM.taskAreaSelect.innerHTML = state.areas.map(area => `
      <option value="${area}">${area}</option>
    `).join('');
    
    // Adiciona uma opção padrão desabilitada
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione uma área';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    DOM.taskAreaSelect.prepend(defaultOption);
  }

  function renderResponsavelOptions() {
    DOM.modalResponsavelList.innerHTML = state.colaboradores.map(colab => `
      <label>
        <input type="radio" name="responsavel" value="${colab.nome}" required>
        <span style="color: var(${colab.cor})">${colab.nome}</span>
      </label>
    `).join('');
  }

  function updateChart() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    DOM.percentageEl.textContent = `${percentage}%`;
    DOM.counterEl.textContent = `${completedTasks} / ${totalTasks}`;
    DOM.donutChart.style.background = `
      conic-gradient(var(--laranja-primario) ${percentage}%, var(--cinza-medio) ${percentage}%)
    `;
  }

  // =============================================
  // 5. MANIPULAÇÃO DE TASKS
  // =============================================
  function addTask(taskData) {
    const newTask = {
      id: Date.now(),
      title: taskData.title,
      desc: taskData.desc,
      area: taskData.area,
      responsavel: taskData.responsavel,
      priority: taskData.priority,
      timestamp: Date.now(),
      completed: false,
      attachment: null
    };

    state.tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateChart();
    closeModal(DOM.taskModal);
  }

  function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateChart();
    closeModal(DOM.confirmModal);
  }

  function toggleTaskStatus(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      updateChart();
      
      if (state.tasks.every(t => t.completed)) {
        triggerConfetti();
      }
    }
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
  }

  // =============================================
  // 6. FILTROS E ORDENAÇÃO
  // =============================================
  function filterTasks() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const selectedAreas = [...DOM.areaOptions.querySelectorAll('input:checked')].map(el => el.value);
    const selectedPriorities = [...DOM.priorityOptions.querySelectorAll('input:checked')].map(el => el.value);

    const filtered = state.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                          task.desc.toLowerCase().includes(searchTerm);
      const matchesArea = selectedAreas.length === 0 || selectedAreas.includes(task.area);
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(task.priority);
      
      return matchesSearch && matchesArea && matchesPriority;
    });

    renderTasks(filtered);
  }

  function toggleSortOrder() {
    state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    state.tasks.sort((a, b) => state.sortOrder === 'asc' 
      ? a.timestamp - b.timestamp 
      : b.timestamp - a.timestamp
    );
    renderTasks();
    DOM.sortTimeBtn.innerHTML = `
      <i class="fas fa-clock"></i> Ordenar por hora (${state.sortOrder === 'asc' ? 'mais antigas' : 'mais novas'})
    `;
  }

  // =============================================
  // 7. MANIPULAÇÃO DE MODAIS
  // =============================================
  function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function showTaskModal() {
    DOM.taskModal.querySelector('#modal-title').textContent = 'Nova Task';
    DOM.taskTitleInput.value = '';
    DOM.taskDescInput.value = '';
    DOM.taskPrioritySelect.value = 'sem-urgencia';
    DOM.taskAreaSelect.value = ''; // Reseta o select de área
    openModal(DOM.taskModal);
  }

  function showDeleteConfirmation(taskId) {
    state.currentTaskId = taskId;
    openModal(DOM.confirmModal);
  }

  // =============================================
  // 8. EVENT LISTENERS
  // =============================================
  function setupEventListeners() {
    // Botão Nova Task
    DOM.novaTaskBtn.addEventListener('click', showTaskModal);
    
    // Filtros
    DOM.filterAreaBtn.addEventListener('click', () => toggleFilter(DOM.areaOptions));
    DOM.filterPriorityBtn.addEventListener('click', () => toggleFilter(DOM.priorityOptions));
    DOM.searchInput.addEventListener('input', filterTasks);
    DOM.sortTimeBtn.addEventListener('click', toggleSortOrder);
    
    // Modais
    DOM.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.closest('.modal'));
      });
    });
    
    // Confirmação de exclusão
    document.getElementById('confirm-cancel').addEventListener('click', () => closeModal(DOM.confirmModal));
    document.getElementById('confirm-delete').addEventListener('click', () => deleteTask(state.currentTaskId));
    
    // Formulário de task
    DOM.taskSubmitBtn.addEventListener('click', handleTaskSubmit);
    
    // Delegação de eventos para elementos dinâmicos
    DOM.tasksContainer.addEventListener('click', (e) => {
      const taskCard = e.target.closest('.task-card');
      if (!taskCard) return;
      
      const taskId = parseInt(taskCard.dataset.id);
      
      // Checkbox
      if (e.target.classList.contains('task-checkbox')) {
        toggleTaskStatus(taskId);
      }
      
      // Ícone de lixeira
      if (e.target.classList.contains('task-delete')) {
        showDeleteConfirmation(taskId);
      }
    });
  }

  function handleTaskSubmit() {
    const title = DOM.taskTitleInput.value.trim();
    const desc = DOM.taskDescInput.value.trim();
    const priority = DOM.taskPrioritySelect.value;
    const area = DOM.taskAreaSelect.value; // Obtém o valor do select
    const responsavel = document.querySelector('input[name="responsavel"]:checked')?.value;
    
    if (!title) {
      alert('Por favor, insira um título para a task!');
      return;
    }
    
    if (!area) {
      alert('Selecione uma área!');
      return;
    }
    
    if (!responsavel) {
      alert('Selecione um responsável!');
      return;
    }
    
    addTask({
      title,
      desc,
      area,
      responsavel,
      priority
    });
  }

  // =============================================
  // 9. FUNÇÕES AUXILIARES
  // =============================================
  function toggleFilter(menu) {
    menu.classList.toggle('hidden');
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + 
           date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
  }

  function getPriorityLabel(priority) {
    const labels = {
      'urgente': 'Urgente',
      'espera': 'Em Espera',
      'sem-urgencia': 'Sem Urgência'
    };
    return labels[priority] || priority;
  }

  function getResponsavelColor(nome) {
    const colaborador = state.colaboradores.find(c => c.nome === nome);
    return colaborador ? `var(${colaborador.cor})` : 'var(--cinza-medio)';
  }

  function triggerConfetti() {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF7D33', '#FFAA6B', '#E65C00']
    });
  }

  // =============================================
  // 10. INICIALIZAÇÃO
  // =============================================
  init();
});