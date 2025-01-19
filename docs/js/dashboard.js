// Global variables
let users = []
let questionIds = [
  'q0_0',  // Gender
  'q0_1',  // Birth year
  'q0_2',  // Teaching student
  'q0_3',  // Teaching type
  'q0_4',  // Teaching subjects
  'q0_5',  // Non-teaching study program
  'q0_6',  // Semester
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
let chart = null
let currentPage = 1
let startDate = null
let endDate = null
const usersPerPage = 100

// Constants (Extracted from survey.js)
const labelMap = {
  'Suchen, Verarbeiten und Aufbewahren': 'Suchen',
  'Kommunikation und Kollaborieren': 'Kommunizieren',
  'Produzieren und Präsentieren': 'Produzieren',
  'Schützen und sicher Agieren': 'Schützen',
  'Problemlösen und Handeln': 'Problemlösen',
  'Analysieren und Reflektieren': 'Analysieren',
}

const colorMap = {
  'Suchen': '#00BF63', // Green
  'Kommunizieren': '#0CC0DF', // Blue
  'Produzieren': '#FF6D5F', // Red
  'Schützen': '#8C52FF', // Purple
  'Problemlösen': '#E884C4', // Pink
  'Analysieren': '#FFD473', // Yellow
}

function getInitialResponse(user, questionId) {
  return user.initialResponses?.[questionId] || ''
}

function getLatestResponse(user, questionId) {
  return user.updatedResponses?.[questionId] || ''
}

function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return ''
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getLighterColor(hexColor) {
  if (!hexColor || hexColor.length !== 7 || hexColor[0] !== '#') {
    return '#cccccc' // Return a default color if invalid
  }
  let r = parseInt(hexColor.slice(1, 3), 16)
  let g = parseInt(hexColor.slice(3, 5), 16)
  let b = parseInt(hexColor.slice(5, 7), 16)

  // Make the color significantly lighter
  r = Math.min(255, r + Math.floor((255 - r) * 0.7))
  g = Math.min(255, g + Math.floor((255 - g) * 0.7))
  b = Math.min(255, b + Math.floor((255 - b) * 0.7))

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getAuthToken() {
  return localStorage.getItem('dashboardToken')
}

document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Initialize datepicker
    flatpickr('#dateRange', {
      mode: 'range',
      dateFormat: 'd/m/Y',
      onClose: function (selectedDates, dateStr, instance) {
        if (selectedDates.length == 2) {
          startDate = selectedDates[0]
          endDate = selectedDates[1]
        }
      },
      disableMobile: true,
    })

    // Setup event listeners
    const searchInput = document.getElementById('userSearch')
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentPage = 1
        renderTable()
      })
    }

    // Setup event listeners for checkboxes
    const tbody = document.querySelector('#userTable tbody')
    tbody.addEventListener('change', function (event) {
      if (event.target.classList.contains('user-select')) {
        updateVisualization()
      }
    })

    // Setup event listener for export buttons
    const exportSelectedButton = document.getElementById('exportSelected')
    if (exportSelectedButton) {
      exportSelectedButton.addEventListener('click', exportSelectedData)
    }

    const exportAllButton = document.getElementById('exportAll')
    if (exportAllButton) {
      exportAllButton.addEventListener('click', function() {
        // Select all checkboxes
        document.querySelectorAll('.user-select').forEach(checkbox => {
          checkbox.checked = true;
        });
        exportSelectedData();
      })
    }

    // Setup event listeners for visualization
    const toggleVisualizationButton = document.getElementById('toggleVisualization')
    const visualizationSidebar = document.getElementById('visualizationSidebar')
    const closeVisualizationButton = document.getElementById('closeVisualization')
    const overlay = document.getElementById('visualizationOverlay')

    function closeVisualization() {
      visualizationSidebar.classList.remove('active')
      overlay.classList.remove('active')
      toggleVisualizationButton.innerHTML = '<i class="fas fa-chart-line me-2"></i>Show Visualization'
    }

    function openVisualization() {
      visualizationSidebar.classList.add('active')
      overlay.classList.add('active')
      toggleVisualizationButton.innerHTML = '<i class="fas fa-chart-line me-2"></i>Hide Visualization'
      updateVisualization()
    }

    if (toggleVisualizationButton && visualizationSidebar && closeVisualizationButton && overlay) {
      toggleVisualizationButton.addEventListener('click', function() {
        if (visualizationSidebar.classList.contains('active')) {
          closeVisualization()
        } else {
          openVisualization()
        }
      })

      closeVisualizationButton.addEventListener('click', closeVisualization)
      overlay.addEventListener('click', closeVisualization)
    }

    // Fetch initial data
    await fetchData()
  } catch (error) {
    console.error('Error initializing dashboard:', error)
    showError('Failed to initialize dashboard. Please refresh the page.')
  }
})

async function fetchData() {
  try {
    const response = await fetch('/api/dashboard-data', {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!Array.isArray(data.users) || !Array.isArray(data.questionIds)) {
      throw new Error('Invalid data structure received from server')
    }

    questionIds = data.questionIds
    users = data.users.map((user) => ({
      ...user,
      userCode: user.userCode || user.userId,
      gender: user.gender || '',
      birthYear: user.birthYear || '',
      data: user.data || { responses: {} },
      initialScores: user.initialScores || {},
      updatedScores: user.updatedScores || {},
    }))
    console.log('Processed users:', users)

    // Initialize the table after data is loaded
    renderTable()
  } catch (error) {
    console.error('Error fetching data:', error)
    showError('Failed to load user data. Please try again later.')
  }
}

function renderTable() {
  const filteredUsers = filterUsers()
  const tbody = document.querySelector('#userTable tbody')
  const thead = document.querySelector('#userTable thead')
  tbody.innerHTML = ''

  // Create header row
  let headerHtml = `
    <tr>
      <th>Select</th>
      <th>Code</th>
      <th>First Submission</th>
      <th>Latest Submission</th>
      <th>T2 Attempts</th>
      <th>T3 Attempts</th>
      <th>Complete</th>
  `

  // Add question columns for T1, T2, and T3
  questionIds.forEach((id) => {
    headerHtml += `
      <th>${id}_T1</th>
      <th>${id}_T2</th>
      <th>${id}_T3</th>
    `
  })

  headerHtml += '</tr>'
  thead.innerHTML = headerHtml

  // Calculate pagination
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Create table rows
  paginatedUsers.forEach((user) => {
    const row = document.createElement('tr')
    
    // Calculate attempt counts
    const t2AttemptCount = user.T2AttemptCount || 0;
    const t3AttemptCount = user.T3AttemptCount || 0;

    // Basic user info
    row.innerHTML = `
      <td><input type="checkbox" class="user-select" value="${user.userId}"></td>
      <td>${escapeHtml(user.code || '')}</td>
      <td>${new Date(user.firstSubmissionTime).toLocaleDateString()}</td>
      <td>${new Date(user.latestSubmissionTime).toLocaleDateString()}</td>
      <td>${t2AttemptCount}</td>
      <td>${t3AttemptCount}</td>
      <td>${user.isComplete ? '✓' : '✗'}</td>
    `

    // Add responses for each question
    questionIds.forEach((id) => {
      const t1Response = escapeHtml(user.initialResponses?.[id] || '')
      const t2Response = escapeHtml(user.updatedResponses?.[id] || '')
      const t3Response = escapeHtml(user.updatedResponses2?.[id] || '')

      row.innerHTML += `
        <td>${t1Response}</td>
        <td>${t2Response}</td>
        <td>${t3Response}</td>
      `
    })

    tbody.appendChild(row)
  })

  updatePagination(filteredUsers.length)
}

function filterUsers() {
  const searchInput = document.getElementById('userSearch')
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : ''
  const dateRange = getSelectedDateRange()

  return users.filter(user => {
    const matchesSearch = !searchTerm || [
      user.userCode,
      user.attemptNumber?.toString(),
      user.data?.q0_0, // Geschlecht
      user.data?.q0_1, // Geburtsjahr
      user.data?.q0_2, // Teaching student
      user.data?.q0_3, // Teaching type
      user.data?.q0_4, // Teaching subjects
      user.data?.q0_5, // Non-teaching study program
      user.data?.q0_6, // Semester
      (user.courses || []).join(', '),
      user.data?.t2_course_feedback || user.openEndedResponses?.attempt2_course_feedback,
      user.openEndedResponses?.t1_strategy,
      user.openEndedResponses?.t2_reflection
    ].some(field => field?.toString().toLowerCase().includes(searchTerm))

    return matchesSearch && (!dateRange.start || filterByDateRange(user))
  })
}

function getSelectedDateRange() {
  const dateRangePicker = document.getElementById('dateRange')
  if (!dateRangePicker || !dateRangePicker._flatpickr) {
    return { start: null, end: null }
  }
  const selectedDates = dateRangePicker._flatpickr.selectedDates
  return {
    start: selectedDates[0] || null,
    end: selectedDates[1] || null
  }
}

function filterByDateRange(user) {
  const dateRange = getSelectedDateRange()
  if (!dateRange.start || !dateRange.end) {
    return true
  }

  const submissionDate = user.firstSubmissionTime ? new Date(user.firstSubmissionTime) : null
  if (!submissionDate) {
    return false
  }

  // Reset hours, minutes, seconds, and milliseconds for accurate date comparison
  submissionDate.setHours(0, 0, 0, 0)
  const start = new Date(dateRange.start)
  start.setHours(0, 0, 0, 0)
  const end = new Date(dateRange.end)
  end.setHours(23, 59, 59, 999)

  return submissionDate >= start && submissionDate <= end
}

function updatePagination(totalUsers) {
  const paginationElement = document.getElementById('pagination')
  if (!paginationElement) {
    console.error('Pagination element not found')
    return
  }

  const totalPages = Math.ceil(totalUsers / usersPerPage)

  paginationElement.innerHTML = `
    <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
  `

  const prevButton = document.getElementById('prevPage')
  const nextButton = document.getElementById('nextPage')

  if (prevButton) {
    prevButton.addEventListener('click', () => changePage(-1))
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => changePage(1))
  }
}

function changePage(direction) {
  const filteredUsers = filterUsers()
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages)
  renderTable()
}

function applyDateFilter() {
  currentPage = 1
  renderTable()
}

function showError(message) {
  const errorContainer = document.getElementById('errorMessage')
  if (errorContainer) {
    errorContainer.textContent = message
    errorContainer.style.display = 'block'
    setTimeout(() => {
      errorContainer.style.display = 'none'
    }, 5000)
  } else {
    console.error(message)
  }
}

function updateVisualization() {
  const canvas = document.getElementById('visualization')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  
  // Calculate averages
  const categories = {
    'Suchen': { initialScore: 0, latestScore: 0, color: colorMap['Suchen'] },
    'Kommunizieren': { initialScore: 0, latestScore: 0, color: colorMap['Kommunizieren'] },
    'Produzieren': { initialScore: 0, latestScore: 0, color: colorMap['Produzieren'] },
    'Schützen': { initialScore: 0, latestScore: 0, color: colorMap['Schützen'] },
    'Problemlösen': { initialScore: 0, latestScore: 0, color: colorMap['Problemlösen'] },
    'Analysieren': { initialScore: 0, latestScore: 0, color: colorMap['Analysieren'] }
  }
  
  let userCount = 0

  users.forEach(user => {
    if (user.initialScores && user.updatedScores) {
      Object.entries(labelMap).forEach(([fullName, shortName]) => {
        if (user.initialScores[fullName] !== undefined) {
          categories[shortName].initialScore += user.initialScores[fullName] || 0
          categories[shortName].latestScore += user.updatedScores[fullName] || 0
        }
      })
      userCount++
    }
  })

  // Calculate averages
  Object.values(categories).forEach(data => {
    data.initialScore = userCount ? Math.round(data.initialScore / userCount) : 0
    data.latestScore = userCount ? Math.round(data.latestScore / userCount) : 0
  })

  // Destroy existing chart if it exists
  if (window.myChart) {
    window.myChart.destroy()
  }

  // Create new chart
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(categories),
      datasets: [
        {
          label: 'Initial Scores (T1)',
          data: Object.values(categories).map(data => data.initialScore),
          backgroundColor: Object.values(categories).map(data => data.color + '80'), // 50% opacity
          borderColor: Object.values(categories).map(data => data.color),
          borderWidth: 1
        },
        {
          label: 'Latest Scores (T2)',
          data: Object.values(categories).map(data => data.latestScore),
          backgroundColor: Object.values(categories).map(data => data.color),
          borderColor: Object.values(categories).map(data => data.color),
          borderWidth: 1
        }
      ]
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
            text: 'Score (%)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `Average Scores Comparison (${userCount} users)`,
          font: {
            size: 16
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  })
}

function exportSelectedData() {
  const selectedUsers = []
  document.querySelectorAll('.user-select:checked').forEach((checkbox) => {
    const userId = checkbox.value
    const user = users.find((u) => u.userId === userId)
    if (user) selectedUsers.push(user)
  })

  if (selectedUsers.length === 0) {
    alert('Bitte wählen Sie mindestens einen Benutzer aus.')
    return
  }

  // Prepare CSV data
  const csvData = []
  const headers = [
    'Code',
    'First Submission',
    'Latest Submission',
    'T2 Attempts',
    'T3 Attempts',
    'Complete',
    'T1 Strategy',
    'T2 Course Feedback',
    'T2 Reflection',
    'T3 Progress',
    'T3 Reflection',
    ...questionIds.flatMap(id => [`${id}_T1`, `${id}_T2`, `${id}_T3`])
  ]
  csvData.push(headers)

  selectedUsers.forEach((user) => {
    const t2AttemptCount = user.T2AttemptCount || 0;
    const t3AttemptCount = user.T3AttemptCount || 0;

    const row = [
      user.code || '',
      user.firstSubmissionTime ? new Date(user.firstSubmissionTime).toLocaleDateString() : '',
      user.latestSubmissionTime ? new Date(user.latestSubmissionTime).toLocaleDateString() : '',
      t2AttemptCount,
      t3AttemptCount,
      user.isComplete ? 'Yes' : 'No',
      user.openEndedResponses?.t1_strategy || '',
      user.openEndedResponses?.t2_course_feedback || '',
      user.openEndedResponses?.t2_reflection || '',
      user.openEndedResponses?.t3_progress || '',
      user.openEndedResponses?.t3_reflection || '',
      ...questionIds.flatMap(id => [
        user.initialResponses?.[id] || '',
        user.updatedResponses?.[id] || '',
        user.updatedResponses2?.[id] || ''
      ])
    ]
    csvData.push(row)
  })

  // Convert to CSV string
  const csvString = csvData
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  // Create and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'survey_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

document.getElementById('applyDateFilter').addEventListener('click', function() {
  renderTable()
})

document.getElementById('clearDateFilter').addEventListener('click', function() {
  const dateRangePicker = document.getElementById('dateRange')
  if (dateRangePicker && dateRangePicker._flatpickr) {
    dateRangePicker._flatpickr.clear()
    renderTable()
  }
})
