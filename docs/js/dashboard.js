let users = []
let questionIds = [
  'q0_0',
  'q0_1',
  'q0_2',
  'q0_3',
  'q0_4',
  'q0_5',
  'q0_6',
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
let currentPage = 1
const usersPerPage = 100

const labelMap = {
  'Suchen, Verarbeiten und Aufbewahren': 'Suchen',
  'Kommunikation und Kollaborieren': 'Kommunizieren',
  'Produzieren und Präsentieren': 'Produzieren',
  'Schützen und sicher Agieren': 'Schützen',
  'Problemlösen und Handeln': 'Problemlösen',
  'Analysieren und Reflektieren': 'Analysieren',
}

const colorMap = {
  Suchen: '#00BF63',
  Kommunizieren: '#0CC0DF',
  Produzieren: '#FF6D5F',
  Schützen: '#8C52FF',
  Problemlösen: '#E884C4',
  Analysieren: '#FFD473',
}

function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Initialize Flatpickr for date range
    flatpickr('#dateRange', {
      mode: 'range',
      dateFormat: 'd/m/Y',
      disableMobile: true,
      onClose: function (selectedDates) {
        // We don't have to do anything special here; we'll filter on apply
      },
    })

    const searchInput = document.getElementById('userSearch')
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentPage = 1
        renderTable()
      })
    }

    const tbody = document.querySelector('#userTable tbody')
    if (tbody) {
      tbody.addEventListener('change', (event) => {
        if (event.target.classList.contains('user-select')) {
          // We do NOT auto-update the chart or open the sidebar
          // The user must click "toggleVisualization" for changes to be seen
        }
      })
    }

    const exportSelectedButton = document.getElementById('exportSelected')
    if (exportSelectedButton) {
      exportSelectedButton.addEventListener('click', exportSelectedData)
    }

    const exportAllButton = document.getElementById('exportAll')
    if (exportAllButton) {
      exportAllButton.addEventListener('click', () => {
        document.querySelectorAll('.user-select').forEach((checkbox) => {
          checkbox.checked = true
        })
        exportSelectedData()
      })
    }

    // Visualization toggling
    const toggleVisualizationButton = document.getElementById(
      'toggleVisualization'
    )
    const visualizationSidebar = document.getElementById('visualizationSidebar')
    const closeVisualizationButton =
      document.getElementById('closeVisualization')
    const overlay = document.getElementById('visualizationOverlay')

    function openVisualization() {
      visualizationSidebar.classList.add('active')
      overlay.classList.add('active')
      toggleVisualizationButton.innerHTML =
        '<i class="fas fa-chart-line me-2"></i>Hide Visualization'
      updateVisualization()
    }

    function closeVisualization() {
      visualizationSidebar.classList.remove('active')
      overlay.classList.remove('active')
      toggleVisualizationButton.innerHTML =
        '<i class="fas fa-chart-line me-2"></i>Show Visualization'
    }

    if (
      toggleVisualizationButton &&
      closeVisualizationButton &&
      overlay &&
      visualizationSidebar
    ) {
      toggleVisualizationButton.addEventListener('click', () => {
        if (visualizationSidebar.classList.contains('active')) {
          closeVisualization()
        } else {
          openVisualization()
        }
      })

      closeVisualizationButton.addEventListener('click', closeVisualization)
      overlay.addEventListener('click', closeVisualization)
    }

    // Buttons for date filter
    const applyDateFilterBtn = document.getElementById('applyDateFilter')
    if (applyDateFilterBtn) {
      applyDateFilterBtn.addEventListener('click', () => {
        currentPage = 1
        renderTable()
      })
    }

    const clearDateFilterBtn = document.getElementById('clearDateFilter')
    if (clearDateFilterBtn) {
      clearDateFilterBtn.addEventListener('click', () => {
        const dateRangePicker = document.getElementById('dateRange')
        if (dateRangePicker && dateRangePicker._flatpickr) {
          dateRangePicker._flatpickr.clear()
        }
        currentPage = 1
        renderTable()
      })
    }

    // Finally fetch the data
    await fetchData()
  } catch (err) {
    console.error('Error initializing dashboard:', err)
    showError('Failed to initialize dashboard. Please refresh the page.')
  }
})

function getAuthToken() {
  return localStorage.getItem('dashboardToken') || ''
}

async function fetchData() {
  try {
    const res = await fetch('/api/dashboard-data', {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch data: ' + res.status)
    }
    const data = await res.json()

    if (!Array.isArray(data.users) || !Array.isArray(data.questionIds)) {
      throw new Error('Invalid data structure from server')
    }

    questionIds = data.questionIds
    users = data.users.map((u) => {
      return {
        ...u,
        userCode: u.userCode || u.userId,
        // For T1, T2, T3 we rely on initialScores, updatedScores, followUpScores
        t1Scores: u.initialScores || {},
        t2Scores: u.updatedScores || {},
        t3Scores: u.followUpScores || {},
        // We'll store the times if provided
        t1SubmissionTime: u.t1SubmissionTime || '', // If your server provides these
        t2SubmissionTime: u.t2SubmissionTime || '',
        t3SubmissionTime: u.t3SubmissionTime || '',
      }
    })

    renderTable()
  } catch (err) {
    console.error('Error fetching data:', err)
    showError('Failed to load user data. Please try again later.')
  }
}

function renderTable() {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')
  if (!thead || !tbody) return

  const filtered = filterUsers()
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const displaySet = filtered.slice(startIndex, endIndex)

  // We'll add T1, T2, T3 columns specifically
  thead.innerHTML = `
    <th>
      Select 
      <span class="info-icon" data-tooltip="Wählen Sie mehrere Nutzer aus...">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Details
      <span class="info-icon" data-tooltip="Klicken Sie, um T1/T2/T3 anzuzeigen">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Code 
      <span class="info-icon" data-tooltip="Eindeutiger Nutzercode">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>Versuch</th>
    <th>Geschlecht</th>
    <th>Geburtsjahr</th>
    <th>Lehramt?</th>
    <th>Art Lehramt</th>
    <th>Studienfächer</th>
    <th>Studiengang</th>
    <th>Semester</th>
    <th>Kurse</th>
    <th>Feedback</th>
    <th>Strategie</th>
    <th>Reflexion</th>
  `

  tbody.innerHTML = ''
  displaySet.forEach((u) => {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td><input type="checkbox" class="user-select" /></td>
      <td>
        <button class="btn btn-sm btn-link toggle-details">
          <i class="fas fa-plus-circle"></i> Show
        </button>
      </td>
      <td>${escapeHtml(u.userCode || '')}</td>
      <td>${u.attemptNumber || ''}</td>
      <td>${escapeHtml(u.data?.q0_0 || '')}</td>
      <td>${escapeHtml(u.data?.q0_1 || '')}</td>
      <td>${escapeHtml(u.data?.q0_2 || '')}</td>
      <td>${escapeHtml(u.data?.q0_3 || '')}</td>
      <td>${escapeHtml(u.data?.q0_4 || '')}</td>
      <td>${escapeHtml(u.data?.q0_5 || '')}</td>
      <td>${escapeHtml(u.data?.q0_6 || '')}</td>
      <td>${escapeHtml((u.courses || []).join(', '))}</td>
      <td>${escapeHtml(
        u.openEndedResponses?.attempt2_course_feedback || ''
      )}</td>
      <td>${escapeHtml(u.openEndedResponses?.t1_strategy || '')}</td>
      <td>${escapeHtml(u.openEndedResponses?.t2_reflection || '')}</td>
    `
    tbody.appendChild(row)

    const detailsRow = document.createElement('tr')
    detailsRow.className = 'details-row'
    detailsRow.innerHTML = `
      <td colspan="15">
        <div style="padding: 1rem;">
          <strong>T1 Zeitpunkt:</strong> ${
            u.t1SubmissionTime
              ? new Date(u.t1SubmissionTime).toLocaleString()
              : 'N/A'
          }<br/>
          <strong>T2 Zeitpunkt:</strong> ${
            u.t2SubmissionTime
              ? new Date(u.t2SubmissionTime).toLocaleString()
              : 'N/A'
          }<br/>
          <strong>T3 Zeitpunkt:</strong> ${
            u.t3SubmissionTime
              ? new Date(u.t3SubmissionTime).toLocaleString()
              : 'N/A'
          }<br/>
          <hr/>
          <strong>T1 Responses:</strong> ${escapeHtml(JSON.stringify(u.initialResponses))}<br/>
          <strong>T2 Responses:</strong> ${escapeHtml(JSON.stringify(u.updatedResponses))}<br/>
          <strong>T3 Responses:</strong> ${escapeHtml(JSON.stringify(u.followUpResponses))}
        </div>
      </td>
    `
    tbody.appendChild(detailsRow)

    const toggleBtn = row.querySelector('.toggle-details')
    toggleBtn.addEventListener('click', () => {
      if (detailsRow.style.display === 'table-row') {
        detailsRow.style.display = 'none'
        toggleBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Show'
      } else {
        detailsRow.style.display = 'table-row'
        toggleBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Hide'
      }
    })
  })

  updatePagination(filtered.length)
}

function filterUsers() {
  const searchTerm = (
    document.getElementById('userSearch')?.value || ''
  ).toLowerCase()

  const dateRangePicker = document.getElementById('dateRange')?._flatpickr
  let start = null
  let end = null
  if (dateRangePicker && dateRangePicker.selectedDates.length === 2) {
    start = dateRangePicker.selectedDates[0]
    end = dateRangePicker.selectedDates[1]
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  }

  return users.filter((u) => {
    // Filter by date
    if (start && end) {
      // We'll check T1 as initial
      const t1 = u.t1SubmissionTime ? new Date(u.t1SubmissionTime) : null
      if (t1) {
        t1.setHours(0, 0, 0, 0)
        if (t1 < start || t1 > end) return false
      } else {
        // If user has no T1, we skip them
        return false
      }
    }

    // Filter by search
    if (searchTerm) {
      const fieldsToCheck = [
        u.userCode,
        u.attemptNumber,
        u.data?.q0_0,
        u.data?.q0_1,
        u.data?.q0_2,
        u.data?.q0_3,
        u.data?.q0_4,
        u.data?.q0_5,
        u.data?.q0_6,
        (u.courses || []).join(', '),
        u.openEndedResponses?.attempt2_course_feedback,
        u.openEndedResponses?.t1_strategy,
        u.openEndedResponses?.t2_reflection,
      ]
      const combinedString = fieldsToCheck.join(' ').toLowerCase()
      if (!combinedString.includes(searchTerm)) return false
    }
    return true
  })
}

function showError(msg) {
  const errorEl = document.getElementById('errorMessage')
  if (errorEl) {
    errorEl.textContent = msg
    errorEl.style.display = 'block'
    setTimeout(() => {
      errorEl.style.display = 'none'
    }, 5000)
  } else {
    console.error(msg)
  }
}

function updatePagination(totalCount) {
  const paginationEl = document.getElementById('pagination')
  if (!paginationEl) return

  const totalPages = Math.ceil(totalCount / usersPerPage)
  paginationEl.innerHTML = `
    <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="nextPage" ${
      currentPage === totalPages ? 'disabled' : ''
    }>Next</button>
  `

  const prevBtn = document.getElementById('prevPage')
  const nextBtn = document.getElementById('nextPage')
  if (prevBtn) {
    prevBtn.addEventListener('click', () => changePage(-1))
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => changePage(1))
  }
}

function changePage(direction) {
  const filtered = filterUsers()
  const totalPages = Math.ceil(filtered.length / usersPerPage)
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages)
  renderTable()
}

/* 
  updateVisualization:
   1) If exactly one user is selected, show that user's T1/T2/T3 as 1,2,3 bars.
   2) If multiple users are selected, use the *last selected user* for the chart.
   3) If no user is selected, do nothing or show an empty chart.

  We'll rely on userDoc's t1Scores, t2Scores, t3Scores, which correspond to 
  userDoc.initialScores, userDoc.updatedScores, userDoc.followUpScores.
*/
function updateVisualization() {
  const canvas = document.getElementById('visualization')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const checked = Array.from(document.querySelectorAll('.user-select:checked'))
  if (checked.length < 1) {
    // No user selected => clear chart or do nothing
    if (window.myChart) window.myChart.destroy()
    return
  }

  // If multiple, we pick the last user
  const lastCheckbox = checked[checked.length - 1]
  const row = lastCheckbox.closest('tr')
  const codeCell = row?.querySelector('td:nth-child(2)')
  if (!codeCell) {
    if (window.myChart) window.myChart.destroy()
    return
  }
  const userCode = codeCell.textContent.trim()
  const user = users.find((u) => u.userCode === userCode)
  if (!user) {
    if (window.myChart) window.myChart.destroy()
    return
  }

  // Build up to 3 "score sets": T1, T2, T3
  const categories = Object.values(labelMap) // ["Suchen", "Kommunizieren", ...]
  const t1Data = []
  const t2Data = []
  const t3Data = []
  let hasT1 = false
  let hasT2 = false
  let hasT3 = false

  categories.forEach((shortName) => {
    // We find the full name from labelMap by flipping the object
    const fullNameEntry = Object.entries(labelMap).find(
      ([key, val]) => val === shortName
    )
    if (!fullNameEntry) {
      t1Data.push(0)
      t2Data.push(0)
      t3Data.push(0)
      return
    }
    const [fullName] = fullNameEntry

    const s1 = user.t1Scores?.[fullName]
    const s2 = user.t2Scores?.[fullName]
    const s3 = user.t3Scores?.[fullName]

    if (s1 !== undefined && s1 !== null) {
      hasT1 = true
      t1Data.push(s1)
    } else {
      t1Data.push(0)
    }

    if (s2 !== undefined && s2 !== null) {
      hasT2 = true
      t2Data.push(s2)
    } else {
      t2Data.push(0)
    }

    if (s3 !== undefined && s3 !== null) {
      hasT3 = true
      t3Data.push(s3)
    } else {
      t3Data.push(0)
    }
  })

  // We'll build datasets dynamically
  const datasets = []
  if (hasT1) {
    datasets.push({
      label: 'T1 Score',
      data: t1Data,
      backgroundColor: categories.map((c) => colorMap[c] + '80'),
      borderColor: categories.map((c) => colorMap[c]),
      borderWidth: 1,
    })
  }
  if (hasT2) {
    datasets.push({
      label: 'T2 Score',
      data: t2Data,
      backgroundColor: categories.map((c) => colorMap[c]),
      borderColor: categories.map((c) => colorMap[c]),
      borderWidth: 1,
    })
  }
  if (hasT3) {
    datasets.push({
      label: 'T3 Score',
      data: t3Data,
      backgroundColor: categories.map((c) => colorMap[c] + 'A0'),
      borderColor: categories.map((c) => colorMap[c]),
      borderWidth: 1,
    })
  }

  if (window.myChart) {
    window.myChart.destroy()
  }

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: datasets,
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
      },
      plugins: {
        title: {
          display: true,
          text: `Kompetenz-Diagramm für ${user.userCode}`,
          font: {
            size: 16,
          },
        },
        legend: {
          position: 'top',
        },
      },
    },
  })
}

/* 
  CSV Export:
    We export T1, T2, T3 columns for each question.
*/
function exportSelectedData() {
  const checked = document.querySelectorAll('.user-select:checked')
  if (!checked.length) {
    showError('Please select at least one user to export data.')
    return
  }
  const selectedUsers = []
  checked.forEach((box) => {
    const row = box.closest('tr')
    const codeCell = row.querySelector('td:nth-child(2)')
    if (!codeCell) return
    const userCode = codeCell.textContent.trim()
    const user = users.find((u) => u.userCode === userCode)
    if (user) {
      selectedUsers.push(user)
    }
  })

  const csvRows = []
  const headers = [
    'Code',
    'Versuch',
    'Geschlecht',
    'Geburtsjahr',
    'Lehramt?',
    'Art Lehramt',
    'Studienfächer',
    'Studiengang',
    'Semester',
    'Kurse',
    'Feedback',
    'Strategie',
    'Reflexion',
    'T1 Zeitpunkt',
    'T2 Zeitpunkt',
    'T3 Zeitpunkt',
    ...questionIds.flatMap((id) => [`${id} (T1)`, `${id} (T2)`, `${id} (T3)`]),
  ]
  csvRows.push(headers)

  selectedUsers.forEach((u) => {
    const row = [
      u.userCode,
      u.attemptNumber || '',
      u.data?.q0_0 || '',
      u.data?.q0_1 || '',
      u.data?.q0_2 || '',
      u.data?.q0_3 || '',
      u.data?.q0_4 || '',
      u.data?.q0_5 || '',
      u.data?.q0_6 || '',
      (u.courses || []).join(';'),
      u.openEndedResponses?.attempt2_course_feedback || '',
      u.openEndedResponses?.t1_strategy || '',
      u.openEndedResponses?.t2_reflection || '',
      u.t1SubmissionTime ? new Date(u.t1SubmissionTime).toLocaleString() : '',
      u.t2SubmissionTime ? new Date(u.t2SubmissionTime).toLocaleString() : '',
      u.t3SubmissionTime ? new Date(u.t3SubmissionTime).toLocaleString() : '',
      ...questionIds.flatMap((id) => [
        u.initialResponses?.[id] || '',
        u.updatedResponses?.[id] || '',
        u.followUpResponses?.[id] || '',
      ]),
    ]
    csvRows.push(row)
  })

  const csvString = csvRows
    .map((rowArr) =>
      rowArr
        .map((cell) => {
          if (typeof cell === 'string' && cell.includes(',')) {
            return `"${cell}"`
          }
          return cell
        })
        .join(',')
    )
    .join('\n')

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'survey_data.csv'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
