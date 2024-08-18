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
      totalScore: calculateTotalScore(user.scores),
    }))
    sections = data.sections
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
        <th class="sortable" data-section="Total Score">Total Score <i class="sort-icon fas fa-sort"></i></th>
    `
  tbody.innerHTML = ''

  // Add section headers
  sections.forEach((section) => {
    const th = document.createElement('th')
    th.innerHTML = `${section} <i class="sort-icon fas fa-sort"></i>`
    th.classList.add('sortable')
    th.dataset.section = section
    thead.appendChild(th)
  })

  // Add user rows
  users.forEach((user) => {
    const tr = document.createElement('tr')
    tr.classList.add('user-row')
    tr.innerHTML = `
            <td><input type="checkbox" class="user-select" data-id="${
              user.userId
            }"></td>
            <td>${user.userCode}</td>
            <td>${user.gender || 'undefined'}</td>
            <td>${user.birthYear || 'undefined'}</td>
            <td>${user.totalScore}%</td>
            ${sections
              .map((section) => `<td>${user.scores[section] || 0}%</td>`)
              .join('')}
        `
    tr.addEventListener('click', (event) => {
      if (!event.target.classList.contains('user-select')) {
        showUserDetails(user)
      }
    })
    tbody.appendChild(tr)
  })

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
  updateSortIcons()
}

function setupSortingListeners() {
  const thead = document.querySelector('#userTable thead')
  thead.addEventListener('click', function (e) {
    const target = e.target.closest('.sortable')
    if (target) {
      const section = target.dataset.section
      if (currentSort.section === section) {
        currentSort.ascending = !currentSort.ascending
      } else {
        currentSort = { section, ascending: true }
      }
      sortUsers()
    }
  })
}

function sortUsers() {
  const sortableSections = [
    'Total Score',
    'Suchen, Verarbeiten und Aufbewahren',
    'Kommunikation und Kollaborieren',
    'Produzieren und Präsentieren',
    'Schützen und sicher agieren',
    'Problemlösen und Handeln',
    'Analysieren und Reflektieren',
  ]

  if (sortableSections.includes(currentSort.section)) {
    users.sort((a, b) => {
      let valueA, valueB
      if (currentSort.section === 'Total Score') {
        valueA = a.totalScore
        valueB = b.totalScore
      } else {
        valueA = a.scores[currentSort.section] || 0
        valueB = b.scores[currentSort.section] || 0
      }
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

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sections,
      datasets: [
        {
          label: 'User Scores',
          data: sections.map((section) => currentUser.scores[section] || 0),
          backgroundColor: '#004a99',
          borderColor: '#004a99',
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
          title: {
            display: true,
            text: 'Competencies',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Scores for User: ${currentUser.userCode}`,
        },
      },
    },
  })
  // Force a resize to ensure proper rendering
  chart.resize()
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
      Gender: user.gender,
      'Birth Year': user.birthYear,
      'Total Score': user.totalScore + '%',
      ...Object.fromEntries(
        sections.map((section) => [section, user.scores[section] + '%'])
      ),
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
      user.userCode.toLowerCase().includes(searchTerm) ||
      user.gender.toLowerCase().includes(searchTerm) ||
      user.birthYear.toString().includes(searchTerm)
  )
  renderTable(filteredUsers)
}