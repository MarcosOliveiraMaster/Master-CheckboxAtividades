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
  };

  // =============================================
  // 2. ESTADO DA APLICAÇÃO
  // =============================================
  const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    areas: ["Financeiro", "Atendimento", "Operacional", "Técnico", "Mentoria", "Inovação", "Marketing", "Pesquisa"],
    colaboradores: [
      { nome: "Ester", cor: "--laranja-borda" },
      { nome: "Marcos", cor: "--azul-borda" }
    ],
    sortOrder: 'desc', // 'asc' ou 'desc'
    currentTaskId: null,
    selectedFile: null
  };

  // =============================================
  // 3. INICIALIZAÇÃO
  // =============================================
  function init() {
    renderTasks();
    renderAreaFilters();
    setupEventListeners();
    updateChart();
  }

  // =============================================
  // 4. RENDERIZAÇÃO
  // =============================================
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
      attachment: null,
      comments: ""
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
      
      // Ícone de anexo
      if (e.target.classList.contains('task-attachment')) {
        showAttachment(taskId);
      }
    });
  }

  // =============================================
  // 9. FUNÇÕES AUXILIARES
  // =============================================
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

  function toggleFilter(menu) {
    menu.classList.toggle('hidden');
  }

// =============================================
// 10. INICIALIZAÇÃO DA APLICAÇÃO (VERSÃO COMPLETA)
// =============================================
function initializeApp() {
  // 10.1 Carrega dados salvos
  loadSavedData();
  
  // 10.2 Configura todos os listeners
  setupAllEventListeners();
  
  // 10.3 Renderiza a interface inicial
  renderInitialUI();
  
  // 10.4 Verifica estado inicial
  checkInitialState();
}

function loadSavedData() {
  // Carrega tasks do localStorage
  const savedTasks = JSON.parse(localStorage.getItem('tasks'));
  if (savedTasks) state.tasks = savedTasks;
  
  // Carrega colaboradores
  const savedColabs = JSON.parse(localStorage.getItem('colaboradores'));
  if (savedColabs) state.colaboradores = savedColabs;
  
  // Carrega áreas
  const savedAreas = JSON.parse(localStorage.getItem('areas'));
  if (savedAreas) {
    state.areas = savedAreas;
  } else {
    // Áreas padrão se não existirem
    state.areas = ["Financeiro", "Atendimento", "Operacional", "Técnico", 
                  "Mentoria", "Inovação", "Marketing", "Pesquisa"];
    saveAreas();
  }
}

function setupAllEventListeners() {
  // Listeners básicos (já implementados)
  setupEventListeners();
  
  // Listeners adicionais
  document.getElementById('task-submit').addEventListener('click', handleTaskSubmit);
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  document.getElementById('save-resolution').addEventListener('click', saveTaskResolution);
  
  // Listeners para modais de gestão
  document.getElementById('add-area-btn').addEventListener('click', showAddAreaModal);
  document.getElementById('add-colab-btn').addEventListener('click', showAddColabModal);
}

function renderInitialUI() {
  // Renderiza tasks
  renderTasks();
  
  // Renderiza filtros
  renderAreaFilters();
  renderPriorityFilters();
  
  // Renderiza opções nos modais
  renderAreaOptions();
  renderResponsavelOptions();
  
  // Atualiza gráfico
  updateChart();
}

function checkInitialState() {
  // Verifica se há tasks completas para animação
  if (state.tasks.length > 0 && state.tasks.every(t => t.completed)) {
    triggerConfetti();
  }
  
  // Verifica dados essenciais
  if (state.colaboradores.length === 0) {
    console.warn('Nenhum colaborador cadastrado');
  }
}

// =============================================
// FUNÇÕES ADICIONAIS PARA COMPLETAR
// =============================================

function handleTaskSubmit() {
  const titleInput = document.getElementById('task-title-input');
  const descInput = document.getElementById('task-desc-input');
  const prioritySelect = document.getElementById('task-priority-select');
  
  // Validação
  if (!titleInput.value.trim()) {
    showAlert('Por favor, insira um título para a task!');
    titleInput.focus();
    return;
  }
  
  // Obtém área e responsável selecionados
  const area = document.querySelector('input[name="area"]:checked')?.value;
  const responsavel = document.querySelector('input[name="responsavel"]:checked')?.value;
  
  if (!area || !responsavel) {
    showAlert('Selecione uma área e um responsável!');
    return;
  }
  
  // Cria nova task
  addTask({
    title: titleInput.value.trim(),
    desc: descInput.value.trim(),
    area,
    responsavel,
    priority: prioritySelect.value
  });
  
  // Limpa formulário
  titleInput.value = '';
  descInput.value = '';
}

function showAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-message';
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

function showAddAreaModal() {
  // Implementação da modal para adicionar nova área
}

function showAddColabModal() {
  // Implementação da modal para adicionar novo colaborador
}

// =============================================
// INICIALIZAÇÃO FINAL
// =============================================
document.addEventListener('DOMContentLoaded', initializeApp);

// =============================================
// 11. GESTÃO DE ANEXOS (PARTE QUE FALTARA)
// =============================================

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Valida tamanho (5MB máximo)
  if (file.size > 5 * 1024 * 1024) {
    alert('Arquivo muito grande! Máximo de 5MB permitido.');
    return;
  }

  state.selectedFile = file;
  displayFilePreview(file);
}

function displayFilePreview(file) {
  const preview = document.getElementById('file-preview');
  preview.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" class="file-thumbnail">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `
      <div class="file-icon">
        <i class="fas fa-file-alt"></i>
        <span>${file.name}</span>
      </div>
    `;
  }
}

function saveAttachmentToTask(taskId) {
  if (!state.selectedFile) return;

  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    const reader = new FileReader();
    reader.onload = (e) => {
      task.attachment = {
        name: state.selectedFile.name,
        type: state.selectedFile.type,
        data: e.target.result.split(',')[1] // Remove o prefixo base64
      };
      saveTasks();
      renderTasks();
    };
    reader.readAsDataURL(state.selectedFile);
  }
}

// =============================================
// 12. GESTÃO DE COLABORADORES (PARTE QUE FALTARA)
// =============================================

function addColaborador(nome, cor) {
  state.colaboradores.push({ nome, cor });
  saveColaboradores();
  renderResponsavelOptions();
}

function removeColaborador(nome) {
  state.colaboradores = state.colaboradores.filter(c => c.nome !== nome);
  saveColaboradores();
  renderResponsavelOptions();
}

function saveColaboradores() {
  localStorage.setItem('colaboradores', JSON.stringify(state.colaboradores));
}

// =============================================
// 13. GESTÃO DE ÁREAS (PARTE QUE FALTARA)
// =============================================

function addArea(novaArea) {
  if (!state.areas.includes(novaArea)) {
    state.areas.push(novaArea);
    saveAreas();
    renderAreaFilters();
    renderAreaOptions();
  }
}

function removeArea(area) {
  state.areas = state.areas.filter(a => a !== area);
  saveAreas();
  renderAreaFilters();
  renderAreaOptions();
}

function saveAreas() {
  localStorage.setItem('areas', JSON.stringify(state.areas));
}

// =============================================
// 14. EVENT LISTENERS ADICIONAIS (PARTE QUE FALTARA)
// =============================================

function setupAdditionalListeners() {
  // Upload de arquivo
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  
  // Formulário de task
  document.getElementById('task-submit').addEventListener('click', () => {
    const title = document.getElementById('task-title-input').value.trim();
    const desc = document.getElementById('task-desc-input').value.trim();
    const priority = document.getElementById('task-priority-select').value;
    
    // Validação básica
    if (!title) {
      alert('Por favor, insira um título para a task!');
      return;
    }
    
    // Obter área e responsável selecionados (simplificado)
    const area = "Financeiro"; // Implementar lógica real
    const responsavel = "Ester"; // Implementar lógica real
    
    addTask({
      title,
      desc,
      area,
      responsavel,
      priority
    });
  });

  // Modal de anexo
  document.getElementById('save-resolution').addEventListener('click', () => {
    if (state.currentTaskId) {
      saveAttachmentToTask(state.currentTaskId);
      closeModal(document.getElementById('attachment-modal'));
    }
  });
}

// =============================================
// 15. INICIALIZAÇÃO COMPLETA (PARTE QUE FALTARA)
// =============================================

function completeInit() {
  // Carrega dados salvos
  const savedColaboradores = JSON.parse(localStorage.getItem('colaboradores'));
  const savedAreas = JSON.parse(localStorage.getItem('areas'));
  
  if (savedColaboradores) state.colaboradores = savedColaboradores;
  if (savedAreas) state.areas = savedAreas;
  
  // Renderiza opções
  renderResponsavelOptions();
  renderAreaOptions();
  
  // Configura listeners adicionais
  setupAdditionalListeners();
}

// =============================================
// 16. FUNÇÕES AUXILIARES ADICIONAIS
// =============================================

function renderResponsavelOptions() {
  const container = document.getElementById('modal-responsavel-list');
  if (!container) return;
  
  container.innerHTML = state.colaboradores.map(colab => `
    <label>
      <input type="radio" name="responsavel" value="${colab.nome}">
      <span style="color: var(${colab.cor})">${colab.nome}</span>
    </label>
  `).join('');
}

function renderAreaOptions() {
  const container = document.getElementById('modal-area-list');
  if (!container) return;
  
  container.innerHTML = state.areas.map(area => `
    <label>
      <input type="radio" name="area" value="${area}">
      ${area}
    </label>
  `).join('');
}

// =============================================
// 17. INICIALIZAÇÃO FINAL
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  init();          // Primeira parte
  completeInit();  // Segunda parte
});