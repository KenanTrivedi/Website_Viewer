// Global variables
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
  'Suchen, Verarbeiten und Aufbewahren': '#00BF63', // Green
  'Kommunikation und Kollaborieren': '#0CC0DF', // Blue
  'Produzieren und Präsentieren': '#FF6D5F', // Red
  'Schützen und sicher Agieren': '#8C52FF', // Purple
  'Problemlösen und Handeln': '#E884C4', // Pink
  'Analysieren und Reflektieren': '#FFD473', // Yellow
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
  try {
    const filteredUsers = filterUsers()
    const start = (currentPage - 1) * usersPerPage
    const paginatedUsers = filteredUsers.slice(start, start + usersPerPage)

    const thead = document.querySelector('#userTable thead tr')
    const tbody = document.querySelector('#userTable tbody')

    if (!thead || !tbody) {
      console.error('Table elements not found')
      return
    }

    // Generate table header
    thead.innerHTML = `
      <th>Select</th>
      <th>User Code</th>
      <th>Gender</th>
      <th>Birth Year</th>
      <th>First Submission</th>
      <th>Latest Submission</th>
      ${questionIds
        .filter(
          (id) =>
            id.startsWith('q') &&
            id !== 'q0_0' &&
            id !== 'q0_1' &&
            id !== 'q0_2' &&
            id !== 'q0_3'
        )
        .map(
          (id) => `
          <th>${id} (T1)</th>
          <th>${id} (Latest)</th>
        `
        )
        .join('')}
    `

    // Clear and prepare tbody
    tbody.innerHTML = ''

    // Generate rows for each user
    paginatedUsers.forEach((user) => {
      const tr = document.createElement('tr')

      tr.innerHTML = `
        <td><input type="checkbox" class="user-select" /></td>
        <td>${user.userCode || ''}</td>
        <td>${user.gender || ''}</td>
        <td>${user.birthYear || ''}</td>
        <td>${user.firstSubmissionTime ? new Date(user.firstSubmissionTime).toLocaleString() : ''}</td>
        <td>${user.latestSubmissionTime ? new Date(user.latestSubmissionTime).toLocaleString() : ''}</td>
        ${questionIds
          .filter(
            (id) =>
              id.startsWith('q') &&
              id !== 'q0_0' &&
              id !== 'q0_1' &&
              id !== 'q0_2' &&
              id !== 'q0_3'
          )
          .map(
            (id) => `
            <td>${user.initialResponses?.[id] || ''}</td>
            <td>${user.updatedResponses?.[id] || ''}</td>
          `
          )
          .join('')}
      `

      tbody.appendChild(tr)
    })

    updatePagination(filteredUsers.length)
  } catch (error) {
    console.error('Error rendering table:', error)
    showError('Failed to display user data. Please refresh the page.')
  }
}

function filterUsers() {
  const searchInput = document.getElementById('userSearch')
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : ''

  return users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      (user.userCode && user.userCode.toLowerCase().includes(searchTerm)) ||
      (user.gender && user.gender.toLowerCase().includes(searchTerm)) ||
      (user.birthYear && user.birthYear.toString().includes(searchTerm))

    const matchesDateRange = filterByDateRange(user)

    return matchesSearch && matchesDateRange
  })
}

function filterByDateRange(user) {
  if (!startDate && !endDate) return true

  const submissionDate = user.firstSubmissionTime
    ? new Date(user.firstSubmissionTime)
    : null

  if (!submissionDate) return false

  if (startDate && submissionDate < startDate) return false
  if (endDate && submissionDate > endDate) return false

  return true
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
