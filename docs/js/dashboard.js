let users = []
let questionIds = [
  'q0_0',
  'q0_1',
  'q1_0',
  'q1_1',
  'q1_2',
  'q1_3',
  'q1_4',
  'q1_5',
  'q2_0',
  'q2_1',
  'q2_2',
  'q2_3',
  'q2_4',
  'q2_5',
  'q2_6',
  'q3_0',
  'q3_1',
  'q3_2',
  'q3_3',
  'q3_4',
  'q3_5',
  'q3_6',
  'q4_0',
  'q4_1',
  'q4_2',
  'q4_3',
  'q4_4',
  'q4_5',
  'q5_0',
  'q5_1',
  'q5_2',
  'q5_3',
  'q5_4',
  'q5_5',
  'q5_6',
  'q6_0',
  'q6_1',
  'q6_2',
  'q6_3',
  'q6_4',
  'q6_5',
]
let currentUser = null
let currentSort = { questionId: null, ascending: true }
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

    // Map the received users to the format needed
    users = data.users.map((user) => ({
      ...user,
      userCode: user.userCode || user.userId,
      gender: user.gender || '',
      birthYear: user.birthYear || '',
      data: user.data || { responses: {} },
    }))
    console.log('Processed users:', users)
    renderTable()
  } catch (error) {
    console.error('Error fetching data:', error)
    document.getElementById('userTable').innerHTML =
      '<tr><td colspan="4">Error loading data. Please try again later.</td></tr>'
  }
}

function renderTable(usersToRender = users) {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')

  thead.innerHTML = `
    <th><input type="checkbox" id="selectAll"></th>
    <th>User Code</th>
    <th>Gender</th>
    <th class="sortable" data-field="birthYear">Birth Year</th>
    <th>Lehramt</th>
    <th>Fächer</th>
    <th class="sortable" data-field="firstSubmission">First Submission</th>
    <th class="sortable" data-field="latestSubmission">Latest Submission</th>
  `

  // Add sortable headers for specified question responses
  const sortableQuestions = [
    'q1_0',
    'q1_1',
    'q1_2',
    'q1_3',
    'q1_4',
    'q1_5',
    'q2_0',
    'q2_1',
    'q2_2',
    'q2_3',
    'q2_4',
    'q2_5',
    'q2_6',
    'q3_0',
    'q3_1',
    'q3_2',
    'q3_3',
    'q3_4',
    'q3_5',
    'q3_6',
    'q4_0',
    'q4_1',
    'q4_2',
    'q4_3',
    'q4_4',
    'q4_5',
    'q5_0',
    'q5_1',
    'q5_2',
    'q5_3',
    'q5_4',
    'q5_5',
    'q5_6',
    'q6_0',
    'q6_1',
    'q6_2',
    'q6_3',
    'q6_4',
    'q6_5',
  ]

  sortableQuestions.forEach((questionId) => {
    const th = document.createElement('th')
    th.textContent = questionId
    th.classList.add('sortable')
    th.dataset.field = questionId
    thead.appendChild(th)
  })

  tbody.innerHTML = ''
  usersToRender.forEach((user) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><input type="checkbox" class="user-select" data-id="${
        user.userId
      }"></td>
      <td>${user.userCode || ''}</td>
      <td>${user.gender || ''}</td>
      <td>${user.birthYear || ''}</td>
      <td>${user.data?.responses?.q0_2 || ''}</td>
      <td>${user.data?.responses?.q0_3 || ''}</td>
      <td>${
        user.firstSubmissionTime
          ? new Date(user.firstSubmissionTime).toLocaleString()
          : ''
      }</td>
      <td>${
        user.latestSubmissionTime
          ? new Date(user.latestSubmissionTime).toLocaleString()
          : ''
      }</td>
    `

    sortableQuestions.forEach((questionId) => {
      const response = user.data?.responses?.[questionId] || ''
      tr.innerHTML += `<td>${response}</td>`
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
}

function setupSortingListeners() {
  const thead = document.querySelector('#userTable thead')
  thead.addEventListener('click', function (e) {
    const target = e.target.closest('th')
    if (target && target.classList.contains('sortable')) {
      const field = target.dataset.field
      if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending
      } else {
        currentSort = { field, ascending: true }
      }
      sortUsers()
    }
  })
}

function sortUsers() {
  if (currentSort.questionId) {
    users.sort((a, b) => {
      const valueA = parseInt(a.data?.responses?.[currentSort.questionId]) || 0
      const valueB = parseInt(b.data?.responses?.[currentSort.questionId]) || 0
      return currentSort.ascending ? valueA - valueB : valueB - valueA
    })
    renderTable()
  }
}

function showUserDetails(user) {
  currentUser = user
  document
    .querySelectorAll('.user-row')
    .forEach((row) => row.classList.remove('selected-row'))
  document
    .querySelector(`.user-select[data-id="${user.userId}"]`)
    .closest('tr')
    .classList.add('selected-row')
  updateVisualization()
  openVisualizationSidebar()
}

function updateVisualization() {
  if (!currentUser || !currentUser.scores) {
    console.error('User data or category scores not available')
    return
  }

  const canvas = document.getElementById('userChart')

  if (chart) {
    chart.destroy()
  }

  const ctx = canvas.getContext('2d')

  const labels = Object.keys(currentUser.scores)
  const data = Object.values(currentUser.scores)

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
          backgroundColor: labels.map((label) => colorMap[label] || '#999999'),
          borderColor: labels.map((label) => colorMap[label] || '#999999'),
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
            callback: function (value) {
              if (typeof value === 'string') {
                return value.split(' ').length > 1 ? value.split(' ') : value
              }
              return value
            },
          },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Scores for User: ${currentUser.userCode}`,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => tooltipItems[0].label,
            label: (context) => `Score: ${context.parsed.y}%`,
          },
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
      Lehramt: user.data?.responses?.q0_2 || '',
      Fächer: user.data?.responses?.q0_3 || '',
      'First Submission': user.firstSubmissionTime
        ? new Date(user.firstSubmissionTime).toLocaleString()
        : '',
      ...questionIds.reduce((acc, questionId) => {
        if (
          questionId !== 'q0_0' &&
          questionId !== 'q0_1' &&
          questionId !== 'q0_2' &&
          questionId !== 'q0_3'
        ) {
          acc[questionId] = user.data?.responses?.[questionId] || ''
        }
        return acc
      }, {}),
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
      (user.gender && user.gender.toLowerCase().includes(searchTerm)) ||
      (user.birthYear && user.birthYear.toString().includes(searchTerm)) ||
      (user.data?.responses?.q0_2 &&
        user.data.responses.q0_2.toLowerCase().includes(searchTerm)) ||
      (user.data?.responses?.q0_3 &&
        user.data.responses.q0_3.toLowerCase().includes(searchTerm)) ||
      (user.firstSubmissionTime &&
        new Date(user.firstSubmissionTime)
          .toLocaleString()
          .toLowerCase()
          .includes(searchTerm)) ||
      (user.latestSubmissionTime &&
        new Date(user.latestSubmissionTime)
          .toLocaleString()
          .toLowerCase()
          .includes(searchTerm))
  )
  renderTable(filteredUsers)
}
