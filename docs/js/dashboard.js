let users = []
let sections = []
let currentUser = null

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
  setupSortingListeners()
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
    setupVisualizationSection()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

function calculateTotalScore(scores) {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)
  return Math.round(total / Object.keys(scores).length)
}

function renderTable() {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')

  // Clear existing headers and rows
  thead.innerHTML = `
        <th><input type="checkbox" id="selectAll"></th>
        <th>User Code</th>
        <th>Gender</th>
        <th>Birth Year</th>
        <th class="sortable" data-section="Total Score">Total Score</th>
    `
  tbody.innerHTML = ''

  // Add section headers
  sections.forEach((section) => {
    const th = document.createElement('th')
    th.textContent = section
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
    tr.addEventListener('click', () => showUserDetails(user))
    tbody.appendChild(tr)
  })

  document
    .getElementById('selectAll')
    .addEventListener('change', toggleSelectAll)
}

function setupSortingListeners() {
  const thead = document.querySelector('#userTable thead')
  thead.addEventListener('click', function (e) {
    const target = e.target.closest('.sortable')
    if (target) {
      const section = target.dataset.section
      sortUsers(section)
    }
  })
}

function sortUsers(section) {
  const sortableSections = [
    'Total Score',
    'Suchen, Verarbeiten und Aufbewahren',
    'Kommunikation und Kollaborieren',
    'Produzieren und Präsentieren',
    'Schützen und sicher agieren',
    'Problemlösen und Handeln',
    'Analysieren und Reflektieren',
  ]

  if (sortableSections.includes(section)) {
    users.sort((a, b) => {
      if (section === 'Total Score') {
        return b.totalScore - a.totalScore
      } else {
        return (b.scores[section] || 0) - (a.scores[section] || 0)
      }
    })
    renderTable()
  }
}

function setupVisualizationSection() {
  let visualizationSection = document.getElementById('visualizationSection')
  if (!visualizationSection) {
    visualizationSection = document.createElement('div')
    visualizationSection.id = 'visualizationSection'
    document.body.appendChild(visualizationSection)
  }
  visualizationSection.style.position = 'fixed'
  visualizationSection.style.top = '70px'
  visualizationSection.style.right = '20px'
  visualizationSection.style.width = '400px'
  visualizationSection.style.height = '300px'
  visualizationSection.style.backgroundColor = 'white'
  visualizationSection.style.padding = '10px'
  visualizationSection.style.border = '1px solid #ddd'
  visualizationSection.style.borderRadius = '5px'
  visualizationSection.style.zIndex = '1000'
  visualizationSection.innerHTML = '<canvas id="userChart"></canvas>'
}

function showUserDetails(user) {
  currentUser = user
  updateVisualization()
}

function updateVisualization() {
  if (!currentUser) return

  const ctx = document.getElementById('userChart').getContext('2d')
  if (window.userChart) {
    window.userChart.destroy()
  }

  window.userChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sections,
      datasets: [
        {
          label: 'User Scores',
          data: sections.map((section) => currentUser.scores[section] || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
        },
      },
      plugins: {
        title: {
          display: true,
          text: `Scores for User: ${currentUser.userCode}`,
        },
      },
    },
  })
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
