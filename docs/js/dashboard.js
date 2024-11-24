// dashboard.js

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
let currentSort = { field: null, ascending: true }
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

document.addEventListener('DOMContentLoaded', function () {
  fetchData()
  document
    .getElementById('exportSelected')
    .addEventListener('click', exportSelected)
  document.getElementById('exportAll').addEventListener('click', exportAll)
  document
    .getElementById('toggleVisualization')
    .addEventListener('click', toggleVisualizationSidebar)
  document
    .getElementById('closeVisualization')
    .addEventListener('click', closeVisualizationSidebar)
  document
    .getElementById('downloadChart')
    .addEventListener('click', downloadChart)
  document.getElementById('searchButton').addEventListener('click', searchUsers)
  document
    .getElementById('applyDateFilter')
    .addEventListener('click', applyDateFilter)
  document
    .getElementById('clearDateFilter')
    .addEventListener('click', clearDateFilter)

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
})

function applyDateFilter() {
  if (startDate && endDate) {
    currentPage = 1
    renderTable()
    updatePagination()
  } else {
    alert('Please select both start and end dates.')
  }
}

function clearDateFilter() {
  document.getElementById('dateRange').value = ''
  startDate = null
  endDate = null
  currentPage = 1
  renderTable()
  updatePagination()
}

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
      userCode: user.userCode || user.userId,
      gender: user.gender || '',
      birthYear: user.birthYear || '',
      data: user.data || { responses: {} },
      initialScores: user.initialScores || {},
      updatedScores: user.updatedScores || {},
    }))
    console.log('Processed users:', users)
    renderTable()
    updatePagination()
  } catch (error) {
    console.error('Error fetching data:', error)
    document.getElementById('userTable').innerHTML =
      '<tr><td colspan="4">Error loading data. Please try again later.</td></tr>'
  }
}

function renderTable(usersToRender = getUsersForCurrentPage()) {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')

  const sortableColumns = [
    'birthYear',
    'firstSubmission',
    'latestSubmission',
    ...questionIds.filter(
      (id) =>
        id.startsWith('q') &&
        id !== 'q0_0' &&
        id !== 'q0_1' &&
        id !== 'q0_2' &&
        id !== 'q0_3'
    ),
  ]

  // Calculate max attempt number across all users
  const maxAttemptNumber = Math.max(
    ...usersToRender.map((u) => u.attemptNumber || 1)
  )

  // Generate table header
  thead.innerHTML = `
    <th><input type="checkbox" id="selectAll"></th>
    <th>User Code</th>
    <th>Geschlecht</th>
    <th class="sortable" data-field="birthYear">Geburtsjahr <span class="sort-icon">↕️</span></th>
    <th>Lehramt</th>
    <th>Fächer</th>
    <th>Kurse</th>
    <th>Feedback zu Kursen</th>
    <th>Strategie bei der Auswahl</th>
    <th>Veränderung der Kompetenzüberzeugungen</th>
    <th>Attempt Number</th>
    <th class="sortable" data-field="firstSubmission">Erste Abgabe <span class="sort-icon">↕️</span></th>
    <th class="sortable" data-field="latestSubmission">Letzte Abgabe <span class="sort-icon">↕️</span></th>
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
        <th class="sortable" data-field="${id}_t1">${id} (T1) <span class="sort-icon">↕️</span></th>
        <th class="sortable" data-field="${id}_latest">${id} (T${maxAttemptNumber}) <span class="sort-icon">↕️</span></th>
      `
      )
      .join('')}
  `

  updateSortIcons()

  // Clear and prepare tbody
  tbody.innerHTML = ''
  const fragment = document.createDocumentFragment()

  // Generate rows for each user
  usersToRender.forEach((user) => {
    const tr = document.createElement('tr')

    // Helper function to create cells with proper escaping
    const createCell = (content, isCheckbox = false) => {
      const td = document.createElement('td')
      if (isCheckbox) {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = 'user-select'
        checkbox.dataset.id = user.userId
        td.appendChild(checkbox)
      } else {
        td.textContent = content
      }
      return td
    }

    // Add basic user info cells
    tr.appendChild(createCell('', true)) // Checkbox
    tr.appendChild(createCell(user.userCode || ''))
    tr.appendChild(createCell(user.gender || ''))
    tr.appendChild(createCell(user.birthYear || ''))
    tr.appendChild(createCell(user.data?.responses?.q0_2 || '')) // Lehramt
    tr.appendChild(createCell(user.data?.responses?.q0_3 || '')) // Fächer
    tr.appendChild(createCell(user.courses?.join(', ') || ''))

    // Add feedback and responses
    tr.appendChild(
      createCell(user.openEndedResponses?.['attempt2_course_feedback'] || '')
    )
    tr.appendChild(createCell(user.openEndedResponses?.t1_strategy || ''))
    tr.appendChild(createCell(user.openEndedResponses?.t2_reflection || ''))

    // Add attempt number
    tr.appendChild(createCell(user.attemptNumber || 1))

    // Add submission times
    tr.appendChild(
      createCell(
        user.firstSubmissionTime
          ? new Date(user.firstSubmissionTime).toLocaleString()
          : ''
      )
    )
    tr.appendChild(
      createCell(
        user.latestSubmissionTime
          ? new Date(user.latestSubmissionTime).toLocaleString()
          : ''
      )
    )

    // Add question responses (T1 and current attempt)
    questionIds
      .filter(
        (id) =>
          id.startsWith('q') &&
          id !== 'q0_0' &&
          id !== 'q0_1' &&
          id !== 'q0_2' &&
          id !== 'q0_3'
      )
      .forEach((id) => {
        // Add T1 (initial) response
        const initialResponse = user.initialResponses?.[id]
        const initialCell = createCell(initialResponse || '')
        initialCell.title = 'T1'
        tr.appendChild(initialCell)

        // Add current attempt response
        const latestResponse = user.updatedResponses?.[id]
        const latestCell = createCell(latestResponse || '')
        latestCell.title = `T${user.attemptNumber || 1}`
        tr.appendChild(latestCell)
      })

    fragment.appendChild(tr)
  })

  tbody.appendChild(fragment)

  // Add event listeners
  document.querySelectorAll('.user-select').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      const userId = this.dataset.id
      const user = users.find((u) => u.userId === userId)
      if (this.checked && user) {
        showUserDetails(user)
      }
    })
  })

  document
    .getElementById('selectAll')
    ?.addEventListener('change', toggleSelectAll)
  setupSortingListeners()
}

function getUsersForCurrentPage() {
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  return filterUsers().slice(startIndex, endIndex)
}

function filterUsers() {
  return users.filter((user) => {
    const matchesSearch = searchUser(user)
    const matchesDateRange = filterByDateRange(user)
    return matchesSearch && matchesDateRange
  })
}

function getSortIcon(field) {
  if (currentSort.field !== field) return '↕️'
  return currentSort.ascending ? '↑' : '↓'
}

function setupSortingListeners() {
  const thead = document.querySelector('#userTable thead')
  thead.addEventListener('click', function (e) {
    const target = e.target.closest('.sortable')
    if (target) {
      const field = target.dataset.field
      if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending
      } else {
        currentSort = { field, ascending: true }
      }
      sortUsers()
      updateSortIcons()
    }
  })
}

function sortUsers() {
  if (currentSort.field) {
    users.sort((a, b) => {
      let valueA, valueB

      // Check if this is a t1/latest field
      if (currentSort.field.endsWith('_t1')) {
        const baseField = currentSort.field.replace('_t1', '')
        valueA = parseFloat(a.initialResponses?.[baseField]) || 0
        valueB = parseFloat(b.initialResponses?.[baseField]) || 0
      } else if (currentSort.field.endsWith('_latest')) {
        const baseField = currentSort.field.replace('_latest', '')
        valueA = parseFloat(a.updatedResponses?.[baseField]) || 0
        valueB = parseFloat(b.updatedResponses?.[baseField]) || 0
      } else {
        // Handle other fields as before
        switch (currentSort.field) {
          case 'birthYear':
            valueA = parseInt(a.birthYear) || 0
            valueB = parseInt(b.birthYear) || 0
            break
          case 'firstSubmission':
            valueA = a.firstSubmissionTime
              ? new Date(a.firstSubmissionTime).getTime()
              : 0
            valueB = b.firstSubmissionTime
              ? new Date(b.firstSubmissionTime).getTime()
              : 0
            break
          case 'latestSubmission':
            valueA = a.latestSubmissionTime
              ? new Date(a.latestSubmissionTime).getTime()
              : 0
            valueB = b.latestSubmissionTime
              ? new Date(b.latestSubmissionTime).getTime()
              : 0
            break
          default:
            valueA = 0
            valueB = 0
        }
      }

      if (valueA < valueB) return currentSort.ascending ? -1 : 1
      if (valueA > valueB) return currentSort.ascending ? 1 : -1
      return 0
    })

    currentPage = 1
    renderTable()
    updatePagination()
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
  if (
    !currentUser ||
    !currentUser.initialScores ||
    !currentUser.updatedScores
  ) {
    console.error('User data or category scores not available')
    return
  }

  const canvas = document.getElementById('userChart')
  if (chart) {
    chart.destroy()
  }

  const ctx = canvas.getContext('2d')
  const fullLabels = Object.keys(currentUser.initialScores)
  const labels = fullLabels.map((key) => labelMap[key] || key)
  const initialData = fullLabels.map(
    (label) => currentUser.initialScores[label] || 0
  )
  const updatedData = fullLabels.map(
    (label) => currentUser.updatedScores[label] || 0
  )

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'T1 Score',
          data: initialData,
          backgroundColor: fullLabels.map((label) =>
            getLighterColor(colorMap[label] || '#999999')
          ),
          borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
          borderWidth: 1,
        },
        {
          label: `T${currentUser.attemptNumber || 1} Score`,
          data: updatedData,
          backgroundColor: fullLabels.map(
            (label) => colorMap[label] || '#999999'
          ),
          borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
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
        legend: { display: true },
        title: {
          display: true,
          text: `Scores for User: ${currentUser.userCode} (Attempt ${
            currentUser.attemptNumber || 1
          })`,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => {
              const fullLabel = fullLabels[tooltipItems[0].dataIndex]
              return fullLabel || tooltipItems[0].label
            },
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y}%`,
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

function exportToExcel(data) {
  try {
    const maxAttemptNumber = Math.max(...data.map((u) => u.attemptNumber || 1))

    // Create base headers
    const headers = {
      'User Code': 'userCode',
      'Attempt Number': 'attemptNumber',
      Geschlecht: 'gender',
      Geburtsjahr: 'birthYear',
      Lehramt: 'lehramt',
      Fächer: 'faecher',
      Kurse: 'courses',
      'Feedback zu Kursen': 'courseFeedback',
      'Strategie bei der Auswahl': 'strategy',
      'Veränderung der Kompetenzüberzeugungen': 'reflection',
      'Erste Abgabe': 'firstSubmission',
      'Letzte Abgabe': 'lastSubmission',
    }

    // Transform data for export
    const exportData = data.map((user) => {
      // Create base row data
      const rowData = {
        'User Code': user.userCode || '',
        'Attempt Number': user.attemptNumber || 1,
        Geschlecht: user.gender || '',
        Geburtsjahr: user.birthYear || '',
        Lehramt: user.data?.responses?.q0_2 || '',
        Fächer: user.data?.responses?.q0_3 || '',
        Kurse: user.courses?.join(', ') || '',
        'Feedback zu Kursen':
          user.openEndedResponses?.['attempt2_course_feedback'] || '',
        'Strategie bei der Auswahl': user.openEndedResponses?.t1_strategy || '',
        'Veränderung der Kompetenzüberzeugungen':
          user.openEndedResponses?.t2_reflection || '',
        'Erste Abgabe': user.firstSubmissionTime
          ? new Date(user.firstSubmissionTime).toLocaleString()
          : '',
        'Letzte Abgabe': user.latestSubmissionTime
          ? new Date(user.latestSubmissionTime).toLocaleString()
          : '',
      }

      // Add question responses with dynamic headers based on each user's attempt number
      questionIds
        .filter(
          (id) =>
            id.startsWith('q') &&
            id !== 'q0_0' &&
            id !== 'q0_1' &&
            id !== 'q0_2' &&
            id !== 'q0_3'
        )
        .forEach((id) => {
          // Add T1 column header and response if it doesn't exist
          const t1Header = `${id} (T1)`
          if (!headers[t1Header]) {
            headers[t1Header] = `${id}_t1`
          }
          rowData[t1Header] = user.initialResponses?.[id] || ''

          // Add latest attempt column header and response
          const attemptHeader = `${id} (T${user.attemptNumber})`
          if (!headers[attemptHeader]) {
            headers[attemptHeader] = `${id}_latest`
          }
          rowData[attemptHeader] = user.updatedResponses?.[id] || ''
        })

      return rowData
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Auto-size columns
    const colWidths = Object.keys(headers).map((key) => ({
      wch: Math.max(
        key.length,
        ...exportData.map((row) => String(row[key] || '').length),
        20 // minimum width
      ),
    }))
    worksheet['!cols'] = colWidths

    // Add styling
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1'
      if (!worksheet[address]) continue
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'CCCCCC' } },
      }
    }

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Data')

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0]
    const filename = `survey_data_${currentDate}.xlsx`

    // Write file
    XLSX.writeFile(workbook, filename)

    console.log('Excel export completed successfully')
  } catch (error) {
    console.error('Error during Excel export:', error)
    alert('Fehler beim Exportieren der Daten. Bitte versuchen Sie es erneut.')
  }
}

// Helper functions for export
function exportSelected() {
  const selectedUsers = users.filter(
    (user) =>
      document.querySelector(`.user-select[data-id="${user.userId}"]`)?.checked
  )

  const dataToExport = selectedUsers.filter(filterByDateRange)
  exportToExcel(dataToExport)
}

function exportAll() {
  const dataToExport = users.filter(filterByDateRange)
  exportToExcel(dataToExport)
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

function filterByDateRange(user) {
  if (!startDate || !endDate) return true
  const firstSubmissionDate = new Date(user.firstSubmissionTime)
  const latestSubmissionDate = new Date(user.latestSubmissionTime)
  return (
    (firstSubmissionDate >= startDate && firstSubmissionDate <= endDate) ||
    (latestSubmissionDate >= startDate && latestSubmissionDate <= endDate)
  )
}

function searchUsers() {
  currentPage = 1
  renderTable()
  updatePagination()
}

function searchUser(user) {
  const searchTerm = document
    .getElementById('userSearch')
    .value.toLowerCase()
    .trim()
  if (!searchTerm) return true
  return (
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
}

function updateSortIcons() {
  document.querySelectorAll('.sortable').forEach((th) => {
    const icon = th.querySelector('.sort-icon')
    if (th.dataset.field === currentSort.field) {
      icon.textContent = currentSort.ascending ? '↑' : '↓'
    } else {
      icon.textContent = '↕️'
    }
  })
}

function changePage(direction) {
  const totalPages = Math.ceil(filterUsers().length / usersPerPage)
  currentPage += direction
  if (currentPage < 1) currentPage = 1
  if (currentPage > totalPages) currentPage = totalPages
  renderTable()
  updatePagination()
}

function updatePagination() {
  const filteredUsers = filterUsers()
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const paginationElement = document.getElementById('pagination')
  paginationElement.innerHTML = `
    <button id="prevPage" ${
      currentPage === 1 ? 'disabled' : ''
    }>Previous</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="nextPage" ${
      currentPage === totalPages ? 'disabled' : ''
    }>Next</button>
  `
  // Attach event listeners to pagination buttons
  document
    .getElementById('prevPage')
    .addEventListener('click', () => changePage(-1))
  document
    .getElementById('nextPage')
    .addEventListener('click', () => changePage(1))
}
