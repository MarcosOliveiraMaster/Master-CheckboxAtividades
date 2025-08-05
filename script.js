document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const novaTaskBtn = document.getElementById('novaTask');
  const divtask = document.querySelector('.divtask');
  const tasksContainer = document.querySelector('.tasks-container');
  const taskTitleInput = document.querySelector('.task-title');
  const taskDescInput = document.querySelector('.task-desc');
  const cancelBtn = document.querySelector('.cancel-btn');
  const submitBtn = document.querySelector('.submit-btn');
  const donutChart = document.querySelector('.donut-chart');
  const percentageEl = document.querySelector('.percentage');
  const counterEl = document.querySelector('.counter');
  const searchInput = document.querySelector('.search-input');
  const sortByTimeBtn = document.getElementById('sort-by-time');
  const attachmentModal = document.getElementById('attachment-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const confirmModal = document.getElementById('confirm-modal');
  const fileInput = document.getElementById('file-input');
  const filePreview = document.getElementById('file-preview');

  // Dados iniciais
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let colaboradores = [
    { nome: "Ester", cor: "var(--laranja-borda)" },
    { nome: "Marcos", cor: "var(--azul-borda)" }
  ];
  let areas = ["Financeiro", "Atendimento", "Operacional", "Técnico", "Mentoria", "Inovação", "Marketing", "Pesquisa"];
  let sortOrder = 'asc';

  // Inicialização
  initListaSTRs();
  renderTasks();

  // Event Listeners
  novaTaskBtn.addEventListener('click', () => {
    divtask.classList.remove('hidden');
    taskTitleInput.focus();
  });

  cancelBtn.addEventListener('click', resetForm);
  submitBtn.addEventListener('click', addTask);
  searchInput.addEventListener('input', filterTasks);
  sortByTimeBtn.addEventListener('click', toggleSortOrder);
  closeModalBtn.addEventListener('click', () => attachmentModal.classList.add('hidden'));
  fileInput.addEventListener('change', handleFileUpload);

  // Funções
  function initListaSTRs() {
    // Implementação das listasSTR para áreas e responsáveis
    // [TODO] Adicionar lógica completa
  }

  function addTask() {
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();

    if (!title) {
      taskTitleInput.focus();
      return;
    }

    const newTask = {
      id: Date.now(),
      title,
      desc,
      area: "Financeiro", // [TODO] Pegar da listaSTR
      responsavel: "Ester", // [TODO] Pegar da listaSTR
      prioridade: "normal", // [TODO] Pegar do select
      data: formatDate(new Date()),
      concluido: false,
      anexo: null,
      comentarios: ""
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    resetForm();
  }

  function renderTasks() {
    tasksContainer.innerHTML = '';

    tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = `task-card ${task.concluido ? 'completed' : ''}`;
      taskEl.innerHTML = `
        <div class="task-border" style="background-color: ${getResponsavelColor(task.responsavel)}"></div>
        <input type="checkbox" class="task-checkbox" ${task.concluido ? 'checked' : ''} data-id="${task.id}">
        <div class="task-content">
          <div class="task-header">
            <span class="task-area">${task.area}</span>
            <span class="task-time">${task.data}</span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.desc}</div>
          <select class="task-priority" data-id="${task.id}">
            <option value="urgente" ${task.prioridade === 'urgente' ? 'selected' : ''}>Urgente</option>
            <option value="espera" ${task.prioridade === 'espera' ? 'selected' : ''}>Em Espera</option>
            <option value="sem-urgencia" ${task.prioridade === 'sem-urgencia' ? 'selected' : ''}>Sem Urgência</option>
          </select>
        </div>
        <i class="fas fa-trash task-delete" data-id="${task.id}"></i>
        ${task.anexo ? '<i class="fas fa-paperclip task-attachment" data-id="' + task.id + '"></i>' : ''}
      `;
      tasksContainer.appendChild(taskEl);
    });

    // Adicionar eventos aos novos elementos
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', toggleTaskStatus);
    });

    document.querySelectorAll('.task-delete').forEach(icon => {
      icon.addEventListener('click', showDeleteConfirmation);
    });

    document.querySelectorAll('.task-attachment').forEach(icon => {
      icon.addEventListener('click', showAttachment);
    });

    document.querySelectorAll('.task-priority').forEach(select => {
      select.addEventListener('change', updatePriority);
    });

    updateChart();
  }

  function toggleTaskStatus(e) {
    const taskId = parseInt(e.target.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      task.concluido = e.target.checked;
      saveTasks();
      renderTasks();
      
      if (tasks.every(t => t.concluido)) {
        triggerConfetti();
      }
    }
  }

  function updateChart() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.concluido).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    percentageEl.textContent = `${percentage}%`;
    counterEl.textContent = `${completedTasks} / ${totalTasks}`;
    donutChart.style.background = `conic-gradient(var(--laranja-primario) ${percentage}%, var(--cinza) ${percentage}%)`;
  }

  function triggerConfetti() {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF7D33', '#FFAA6B', '#E65C00']
    });
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // [TODO] Implementar outras funções necessárias
  function resetForm() { /* ... */ }
  function filterTasks() { /* ... */ }
  function toggleSortOrder() { /* ... */ }
  function showDeleteConfirmation() { /* ... */ }
  function showAttachment() { /* ... */ }
  function handleFileUpload() { /* ... */ }
  function updatePriority() { /* ... */ }
  function formatDate(date) { /* ... */ }
  function getResponsavelColor(nome) { /* ... */ }
});