let users = []
let sections = []
let currentUser = null
let currentSort = { section: null, ascending: true }
let chart = null

function getAuthToken() {
  return localStorage.getItem('dashboardToken')
}

document.addEventListener('DOMContentLoaded', function () {
  fetchData()
  document
    .getElementById('exportSelected')
    .addEventListener('click', exportSelected)
  document.getElementById('exportAll').addEventListener('click', exportAll)
  document
    .getElementById('selectAll')
    .addEventListener('change', toggleSelectAll)
  document
    .getElementById('toggleVisualization')
    .addEventListener('click', toggleVisualizationSidebar)
  setupSortingListeners()
  document
    .getElementById('closeVisualization')
    .addEventListener('click', closeVisualizationSidebar)
  document
    .getElementById('downloadChart')
    .addEventListener('click', downloadChart)
  document.getElementById('userSearch').addEventListener('input', searchUsers)
})

async function fetchData() {
  try {
    const response = await fetch('/api/dashboard-data', {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
    if (response.status === 401) {
      window.location.href = '/dashboard-login'
      return
    }
    const data = await response.json()
    console.log('Received data from server:', data)
    users = data.users.map((user) => ({
      ...user,
      userCode: user.userId, // Assuming userId is the user code
    }))
    sections = Object.keys(users[0].data.categoryScores)
    console.log('Users:', users)
    console.log('Sections:', sections)
    renderTable()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

function calculateTotalScore(scores) {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)
  return Math.round(total / Object.keys(scores).length)
}

function renderTable(usersToRender = users) {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')

  // Clear existing headers and rows
  thead.innerHTML = `
    <th><input type="checkbox" id="selectAll"></th>
    <th>User Code</th>
    <th>Gender</th>
    <th>Birth Year</th>
  `

  // Add question ID headers
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const questionId = `q${i}_${j}`
      const th = document.createElement('th')
      th.textContent = questionId
      th.classList.add('sortable')
      th.dataset.questionId = questionId
      thead.appendChild(th)
    }
  }

  // Add user rows
  usersToRender.forEach((user) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><input type="checkbox" class="user-select" data-id="${
        user.userId
      }"></td>
      <td>${user.userCode || ''}</td>
      <td>${user.data.responses.q0_0 || ''}</td>
      <td>${user.data.responses.q0_1 || ''}</td>
    `

    // Add question scores
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const questionId = `q${i}_${j}`
        const score = user.data.responses[questionId] || ''
        tr.innerHTML += `<td>${score}</td>`
      }
    }

    tbody.appendChild(tr)
  })

  // Re-add event listeners
  document.querySelectorAll('.user-select').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      const userId = this.dataset.id
      const user = users.find((u) => u.userId === userId)
      if (this.checked) {
        showUserDetails(user)
      }
    })
  })

  document
    .getElementById('selectAll')
    .addEventListener('change', toggleSelectAll)
  setupSortingListeners()
}

function setupSortingListeners() {
  const thead = document.querySelector('#userTable thead')
  thead.addEventListener('click', function (e) {
    const target = e.target.closest('.sortable')
    if (target) {
      const questionId = target.dataset.questionId
      if (currentSort.questionId === questionId) {
        currentSort.ascending = !currentSort.ascending
      } else {
        currentSort = { questionId, ascending: true }
      }
      sortUsers()
    }
  })
}

function sortUsers() {
  if (currentSort.questionId) {
    users.sort((a, b) => {
      const valueA = parseInt(a.data.responses[currentSort.questionId]) || 0
      const valueB = parseInt(b.data.responses[currentSort.questionId]) || 0
      return currentSort.ascending ? valueA - valueB : valueB - valueA
    })
    renderTable()
  }
}

function updateSortIcons() {
  document.querySelectorAll('.sort-icon').forEach((icon) => {
    icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort')
    icon.classList.add('fa-sort')
  })

  if (currentSort.section) {
    const currentIcon = document.querySelector(
      `.sortable[data-section="${currentSort.section}"] .sort-icon`
    )
    currentIcon.classList.remove('fa-sort')
    currentIcon.classList.add(
      currentSort.ascending ? 'fa-sort-up' : 'fa-sort-down'
    )
  }
}

function showUserDetails(user) {
  currentUser = user
  document
    .querySelectorAll('.user-row')
    .forEach((row) => row.classList.remove('selected-row'))
  document
    .querySelector(`.user-select[data-id="${user.userId}"]`)
    .closest('.user-row')
    .classList.add('selected-row')
  updateVisualization()
  openVisualizationSidebar()
}

function updateVisualization() {
  if (!currentUser) return

  const ctx = document.getElementById('userChart')

  if (chart) {
    chart.destroy()
  }
  ctx.style.display = 'block'

  const labels = Object.keys(currentUser.data.categoryScores)
  const data = Object.values(currentUser.data.categoryScores)

  const colorMap = {
    'Suchen, Verarbeiten und Aufbewahren': '#00BF63',
    'Kommunikation und Kollaborieren': '#0CC0DF',
    'Produzieren und Präsentieren': '#FF6D5F',
    'Schützen und sicher Agieren': '#8C52FF',
    'Problemlösen und Handeln': '#E884C4',
    'Analysieren und Reflektieren': '#FFD473',
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: labels.map((label) => colorMap[label]),
          borderColor: labels.map((label) => colorMap[label]),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score (%)',
          },
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Scores for User: ${currentUser.userCode}`,
        },
      },
    },
  })

  chart.resize()
}

function calculateCompetencyScore(user, sectionIndex) {
  if (!user.data || !user.data.responses) return 0

  let totalScore = 0
  let questionCount = 0
  for (let j = 0; j < 7; j++) {
    const questionId = `q${sectionIndex}_${j}`
    if (user.data.responses[questionId] !== undefined) {
      totalScore += parseInt(user.data.responses[questionId]) || 0
      questionCount++
    }
  }
  return questionCount > 0
    ? Math.round((totalScore / (questionCount * 6)) * 100)
    : 0
}

function toggleSelectAll(event) {
  const checkboxes = document.querySelectorAll('.user-select')
  checkboxes.forEach((checkbox) => (checkbox.checked = event.target.checked))
}

function exportSelected() {
  const selectedUsers = users.filter(
    (user) =>
      document.querySelector(`.user-select[data-id="${user.userId}"]`).checked
  )
  exportToExcel(selectedUsers)
}

function exportAll() {
  exportToExcel(users)
}

function exportToExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((user) => ({
      'User Code': user.userCode,
      Gender: user.data.responses.q0_0,
      'Birth Year': user.data.responses.q0_1,
      ...user.data.responses,
      'Overall Score': user.data.overallScore,
      ...user.data.categoryScores,
    }))
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
  XLSX.writeFile(workbook, 'survey_data.xlsx')
}

function toggleVisualizationSidebar() {
  const sidebar = document.getElementById('visualizationSidebar')
  const mainContent = document.getElementById('mainContent')
  const toggleBtn = document.getElementById('toggleVisualization')

  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open')
    mainContent.classList.remove('shifted')
    toggleBtn.textContent = 'Show Visualization'
  } else {
    sidebar.classList.add('open')
    mainContent.classList.add('shifted')
    toggleBtn.textContent = 'Hide Visualization'
    if (currentUser) {
      updateVisualization()
    } else {
      // Clear the chart if no user is selected
      const ctx = document.getElementById('userChart')
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height)
    }
  }
}

function openVisualizationSidebar() {
  const sidebar = document.getElementById('visualizationSidebar')
  const mainContent = document.getElementById('mainContent')
  const toggleBtn = document.getElementById('toggleVisualization')
  sidebar.classList.add('open')
  mainContent.classList.add('shifted')
  toggleBtn.textContent = 'Hide Visualization'
}

function closeVisualizationSidebar() {
  const sidebar = document.getElementById('visualizationSidebar')
  const mainContent = document.getElementById('mainContent')
  const toggleBtn = document.getElementById('toggleVisualization')
  sidebar.classList.remove('open')
  mainContent.classList.remove('shifted')
  toggleBtn.textContent = 'Show Visualization'
}

function downloadChart() {
  if (!chart) return

  const canvas = document.getElementById('userChart')
  const imageData = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = imageData
  link.download = `${currentUser.userCode}_chart.png`
  link.click()
}

function searchUsers() {
  const searchTerm = document.getElementById('userSearch').value.toLowerCase()
  const filteredUsers = users.filter(
    (user) =>
      (user.userCode && user.userCode.toLowerCase().includes(searchTerm)) ||
      (user.data.responses.q0_0 &&
        user.data.responses.q0_0.toLowerCase().includes(searchTerm)) || // Gender
      (user.data.responses.q0_1 &&
        user.data.responses.q0_1.toString().includes(searchTerm)) // Birth year
  )
  renderTable(filteredUsers)
}
