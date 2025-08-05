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

  // Carrega tasks do localStorage
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  renderTasks();

  // Botão "Nova Task"
  novaTaskBtn.addEventListener('click', () => {
    divtask.classList.remove('hidden');
    taskTitleInput.focus();
  });

  // Botão "Cancelar"
  cancelBtn.addEventListener('click', () => {
    divtask.classList.add('hidden');
    taskTitleInput.value = '';
    taskDescInput.value = '';
  });

  // Botão "Enviar"
  submitBtn.addEventListener('click', addTask);

  // Auto-resize para o textarea do título
  taskTitleInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  // Adiciona task
  function addTask() {
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();

    if (!title) return;

    const newTask = {
      id: Date.now(),
      title,
      desc,
      completed: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Limpa e esconde o form
    taskTitleInput.value = '';
    taskDescInput.value = '';
    divtask.classList.add('hidden');
  }

  // Renderiza todas as tasks
  function renderTasks() {
    tasksContainer.innerHTML = '';

    tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
      taskEl.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.desc}</div>
        </div>
        <i class="fas fa-trash task-delete" data-id="${task.id}"></i>
      `;
      tasksContainer.appendChild(taskEl);
    });

    // Atualiza gráfico
    updateChart();

    // Adiciona eventos aos novos elementos
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', toggleTask);
    });

    document.querySelectorAll('.task-delete').forEach(icon => {
      icon.addEventListener('click', deleteTask);
    });
  }

  // Alterna task entre concluída/pendente
  function toggleTask(e) {
    const taskId = parseInt(e.target.dataset.id);
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    tasks[taskIndex].completed = e.target.checked;
    saveTasks();

    // Reordena tasks (concluídas vão para o final)
    tasks.sort((a, b) => a.completed - b.completed);
    renderTasks();

    // Animação de confete se todas estiverem concluídas
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
    triggerConfetti();
    }
  }

  // Deleta task
  function deleteTask(e) {
    const taskId = parseInt(e.target.dataset.id);
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
  }

  // Atualiza gráfico de rosca
  function updateChart() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Atualiza DOM
    percentageEl.textContent = `${percentage}%`;
    counterEl.textContent = `${completedTasks} / ${totalTasks}`;

    // Atualiza gráfico
    donutChart.style.background = `conic-gradient(#6a9bd8 ${percentage}%, #d3e0f0 ${percentage}%)`;
  }

  // Animação de confete
  function triggerConfetti() {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Salva tasks no localStorage
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
});