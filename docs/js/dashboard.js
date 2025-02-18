let users = []
let questionIds = [] // This will be set from the server
let currentPage = 1
const usersPerPage = 50
let surveyData = null // Add this line to store surveyData

// Corrected escapeHtml function
function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    flatpickr('#dateRange', { mode: 'range', dateFormat: 'd/m/Y' })
    document.getElementById('userSearch')?.addEventListener('input', () => {
      currentPage = 1
      renderTable()
    })
    document
      .getElementById('applyDateFilter')
      ?.addEventListener('click', () => {
        currentPage = 1
        renderTable()
      })
    document
      .getElementById('clearDateFilter')
      ?.addEventListener('click', () => {
        const drp = document.getElementById('dateRange')
        if (drp && drp._flatpickr) drp._flatpickr.clear()
        currentPage = 1
        renderTable()
      })
    document
      .getElementById('exportSelected')
      ?.addEventListener('click', exportSelectedData)
    document.getElementById('exportAll')?.addEventListener('click', () => {
      document
        .querySelectorAll('.user-select')
        .forEach((box) => (box.checked = true))
      exportSelectedData()
    })
    document
      .getElementById('toggleVisualization')
      ?.addEventListener('click', () => {
        const vs = document.getElementById('visualizationSidebar')
        if (vs?.classList.contains('active')) {
          closeVisualization()
        } else {
          openVisualization()
        }
      })
    document
      .getElementById('closeVisualization')
      ?.addEventListener('click', closeVisualization)
    document
      .getElementById('visualizationOverlay')
      ?.addEventListener('click', closeVisualization)
    await fetchData()
  } catch (err) {
    console.error('Error initializing dashboard:', err)
    showError('Failed to initialize dashboard')
  }
})

function getAuthToken() {
  return localStorage.getItem('dashboardToken') || ''
}

// Modified fetchData function
async function fetchData() {
  try {
    // Fetch surveyData FIRST
    const surveyRes = await fetch('/api/survey-data')
    if (!surveyRes.ok)
      throw new Error('Failed to fetch survey data: ' + surveyRes.status)
    surveyData = await surveyRes.json() // Store it in the global variable

    const res = await fetch('/api/dashboard-data', {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
    if (!res.ok) throw new Error('Failed to fetch data: ' + res.status)
    const data = await res.json()
    if (!Array.isArray(data.users) || !Array.isArray(data.questionIds))
      throw new Error('Invalid data structure from server')
    // questionIds = data.questionIds //This line was causing the issue
    // Ensure userCode is available, using userId as a fallback

    // --- CORRECT QUESTION ID GENERATION ---
    questionIds = [] // Reset the array
    surveyData.forEach((section, sectionIndex) => {
      section.questions.forEach((_, questionIndex) => {
        questionIds.push(`q${sectionIndex}_${questionIndex}`)
      })
    })
    // --- END OF CORRECT QUESTION ID GENERATION ---

    users = data.users.map((u) => ({ ...u, userCode: u.userCode || u.userId }))
    renderTable()
  } catch (err) {
    console.error('Error fetching data:', err)
    showError('Failed to load user data')
  }
}

function renderTable() {
  const theadRow = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')
  if (!theadRow || !tbody) return

  const filtered = filterUsers()
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const displaySet = filtered.slice(startIndex, endIndex)

  let headerHTML = `
    <th>Select</th>
    <th>Code</th>
    <th>Attempt</th>
    <th>Datenschutz accepted?</th>
    <th>Gender</th>
    <th>Birth Year</th>
    <th>Studieren Sie Lehramt?</th>
    <th>Lehramt / Studiengang</th>
    <th>Semester</th>
    <th>Strategy (T1)</th>
    <th>Courses</th>
    <th>Course Feedback (T2)</th>
    <th>Reflection (T2)</th>
    <th>Reflection (T3)</th>
    <th>T1 Timestamp</th>
    <th>T2 Timestamp</th>
    <th>T3 Timestamp</th>
  `

  const questionIdsToDisplay = questionIds.filter((id) => !id.startsWith('q0_'))
  headerHTML += questionIdsToDisplay
    .map((id) => `<th>${id} (T1)</th><th>${id} (T2)</th><th>${id} (T3)</th>`)
    .join('')
  theadRow.innerHTML = headerHTML
  tbody.innerHTML = ''

  displaySet.forEach((user) => {
    try {
      // Merge personal data from all attempts
      let personalData = {}
      Object.assign(
        personalData,
        user.initialResponses,
        user.updatedResponses,
        user.followUpResponses
      )

      const t1Strategy =
        safeAccess(user, 'openEndedResponses.t1_strategy') || ''
      const t2CourseList =
        safeAccess(user, 'openEndedResponses.t2_course_list') || ''
      const courses = t2CourseList
        ? t2CourseList.split(',').map((c) => c.trim())
        : []
      const t2CourseFeedback =
        safeAccess(user, 'updatedResponses.t2_course_feedback') || ''
      const t2Reflection =
        safeAccess(user, 'openEndedResponses.t2_reflection') || ''
      const t3Reflection =
        safeAccess(user, 'openEndedResponses.t3_reflection') || ''

      const gender = safeAccess(personalData, 'q0_0') || ''
      const birthYear = safeAccess(personalData, 'q0_1') || ''
      const studiesTeaching = safeAccess(personalData, 'q0_2') || ''
      const teachingType = safeAccess(personalData, 'q0_6') || ''
      const subjects = safeAccess(personalData, 'q0_7') || ''
      const otherStudies = safeAccess(personalData, 'q0_8') || ''
      const semester = safeAccess(personalData, 'q0_3') || ''

      let teachingInfo = ''
      if (studiesTeaching === 'Ja') {
        teachingInfo =
          'Lehramt: ' +
          escapeHtml(teachingType) +
          ', Fächer: ' +
          escapeHtml(subjects)
      } else if (studiesTeaching === 'Nein') {
        teachingInfo = 'Studiengang: ' + escapeHtml(otherStudies)
      }

      function formatDate(dateString) {
        if (!dateString) return ''
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        } catch (error) {
          return 'Invalid Date'
        }
      }

      const row = document.createElement('tr')
      row.innerHTML = `
        <td><input type="checkbox" class="user-select" /></td>
        <td>${escapeHtml(user.userCode)}</td>
        <td>${user.attemptNumber || 1}</td>
        <td>${user.datenschutzConsent ? 'Yes' : 'No'}</td>
        <td>${escapeHtml(gender)}</td>
        <td>${escapeHtml(birthYear)}</td>
        <td>${escapeHtml(studiesTeaching)}</td>
        <td>${escapeHtml(teachingInfo)}</td>
        <td>${escapeHtml(semester)}</td>
        <td>${escapeHtml(t1Strategy)}</td>
        <td>${escapeHtml(courses.join('; '))}</td>
        <td>${escapeHtml(t2CourseFeedback)}</td>
        <td>${escapeHtml(t2Reflection)}</td>
        <td>${escapeHtml(t3Reflection)}</td>
        <td>${formatDate(safeAccess(user, 'timeStamps.t1'))}</td>
        <td>${formatDate(safeAccess(user, 'timeStamps.t2'))}</td>
        <td>${formatDate(safeAccess(user, 'timeStamps.t3'))}</td>
        ${questionIdsToDisplay
          .map(
            (id) => `
            <td>${escapeHtml(
              safeAccess(user, 'initialResponses.' + id) || ''
            )}</td>
            <td>${escapeHtml(
              safeAccess(user, 'updatedResponses.' + id) || ''
            )}</td>
            <td>${escapeHtml(
              safeAccess(user, 'followUpResponses.' + id) || ''
            )}</td>
          `
          )
          .join('')}
      `
      tbody.appendChild(row)
    } catch (error) {
      const row = document.createElement('tr')
      row.innerHTML =
        '<td colspan="20">Error displaying data for this user. Check</td>'
      tbody.appendChild(row)
    }
  })
}

// Add safeAccess function
function safeAccess(obj, path) {
  return path
    .split('.')
    .reduce((acc, part) => (acc && acc[part] ? acc[part] : ''), obj)
}

function filterUsers() {
  const searchTerm = (
    document.getElementById('userSearch')?.value || ''
  ).toLowerCase()
  const dateRange = document.getElementById('dateRange')?._flatpickr
  let start = null
  let end = null

  if (dateRange && dateRange.selectedDates.length === 2) {
    start = dateRange.selectedDates[0]
    end = dateRange.selectedDates[1]
    start.setHours(0, 0, 0, 0) // Start of day
    end.setHours(23, 59, 59, 999) // End of day
  }

  return users.filter((user) => {
    // Date filtering
    if (start && end) {
      const t1Timestamp = user.timeStamps?.t1
        ? new Date(user.timeStamps.t1)
        : null
      if (!t1Timestamp || t1Timestamp < start || t1Timestamp > end) {
        return false // Exclude if outside date range
      }
    }

    // Text search filtering (if there's a search term)
    if (searchTerm) {
      const fieldsToCheck = [
        user.userCode,
        user.attemptNumber,
        user.datenschutzConsent ? 'Yes' : 'No',
        user.personalData?.q0_0, // Gender
        user.personalData?.q0_1, // Birth Year
        user.personalData?.q0_2, // Studies Teaching?
        user.personalData?.q0_6, // Teaching type  <-- Corrected
        user.personalData?.q0_7, // Subjects       <-- Corrected
        user.personalData?.q0_8, // Other studies  <-- Corrected
        user.personalData?.q0_3, // Semester       <-- Corrected
        (user.courses || []).join('; '), // Courses, using semicolon as separator
        user.openEndedResponses?.t2_course_feedback,
        user.openEndedResponses?.t1_strategy,
        user.openEndedResponses?.t2_reflection,
        user.openEndedResponses?.t3_reflection,
      ]

      // Check if the search term is present in ANY of the fields
      const foundInFields = fieldsToCheck.some((field) => {
        return (
          typeof field === 'string' && field.toLowerCase().includes(searchTerm)
        )
      })

      // Add the question responses
      for (const id of questionIds) {
        if (user.responses?.t1?.[id]?.toLowerCase().includes(searchTerm))
          return true
        if (user.responses?.t2?.[id]?.toLowerCase().includes(searchTerm))
          return true
        if (user.responses?.t3?.[id]?.toLowerCase().includes(searchTerm))
          return true
      }

      if (!foundInFields) {
        return false // Exclude if search term not found
      }
    }

    return true // Include if all checks pass
  })
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
  document
    .getElementById('prevPage')
    ?.addEventListener('click', () => changePage(-1))
  document
    .getElementById('nextPage')
    ?.addEventListener('click', () => changePage(1))
}
function changePage(direction) {
  const filtered = filterUsers()
  const totalPages = Math.ceil(filtered.length / usersPerPage)
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages)
  renderTable()
}

function showError(msg) {
  const el = document.getElementById('errorMessage')
  if (el) {
    el.textContent = msg
    el.style.display = 'block'
    setTimeout(() => {
      el.style.display = 'none'
    }, 5000)
  } else {
    console.error(msg)
  }
}

function openVisualization() {
  const sidebar = document.getElementById('visualizationSidebar')
  const overlay = document.getElementById('visualizationOverlay')
  const toggleBtn = document.getElementById('toggleVisualization')
  if (!sidebar || !overlay || !toggleBtn) return
  sidebar.classList.add('active')
  overlay.classList.add('active')
  toggleBtn.innerHTML =
    '<i class="fas fa-chart-line me-2"></i>Hide Visualization'
  updateVisualization()

  const downloadButton = document.getElementById('downloadVisualization')
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadVisualizationChart)
  }
}

function closeVisualization() {
  const sidebar = document.getElementById('visualizationSidebar')
  const overlay = document.getElementById('visualizationOverlay')
  const toggleBtn = document.getElementById('toggleVisualization')
  if (!sidebar || !overlay || !toggleBtn) return
  sidebar.classList.remove('active')
  overlay.classList.remove('active')
  toggleBtn.innerHTML =
    '<i class="fas fa-chart-line me-2"></i>Show Visualization'
}

function updateVisualization() {
  const canvas = document.getElementById('visualization')
  if (!canvas) return

  const checked = [...document.querySelectorAll('.user-select:checked')]
  if (!checked.length) {
    if (window.myChart) {
      window.myChart.destroy()
      window.myChart = null // Clear reference
    }
    return
  }

  const lastChecked = checked[checked.length - 1] // Get the *last* checked box
  const codeCell = lastChecked.closest('tr')?.querySelector('td:nth-child(2)')

  if (!codeCell) {
    if (window.myChart) {
      window.myChart.destroy()
      window.myChart = null
    }
    return
  }

  const userCode = codeCell.textContent.trim()
  const user = users.find((u) => u.userCode === userCode)

  if (!user) {
    if (window.myChart) {
      window.myChart.destroy()
      window.myChart = null
    }
    return
  }

  // --- MODIFIED DATA EXTRACTION ---
  const t1 = user.initialScores || {} // Use initialScores
  const t2 = user.updatedScores || {} // Use updatedScores
  const t3 = user.followUpScores || {} // Use followUpScores
  // --- END OF MODIFIED DATA EXTRACTION ---

  const allCats = new Set([
    ...Object.keys(t1),
    ...Object.keys(t2),
    ...Object.keys(t3),
  ])
  allCats.delete('overall')
  const categories = Array.from(allCats)

  const t1Data = categories.map((cat) => t1[cat] || 0)
  const t2Data = categories.map((cat) => t2[cat] || 0)
  const t3Data = categories.map((cat) => t3[cat] || 0)

  // Use the shared chart configuration function
  const chartConfig = createCompetencyChartConfig(
    categories,
    t1Data,
    t2Data,
    t3Data,
    'visualization',
    null, // PASS NULL FOR DESCRIPTION BOX ID HERE
    userCode // ADD USER CODE ARGUMENT
  )

  if (window.myChart) {
    // Update existing chart
    window.myChart.data.labels = chartConfig.data.labels
    window.myChart.data.datasets = chartConfig.data.datasets
    window.myChart.options = chartConfig.options // Update options too!
    window.myChart.update()
  } else {
    // Create new chart
    const ctx = canvas.getContext('2d')
    window.myChart = new Chart(ctx, chartConfig)
  }
  // --- ADD USER CODE DISPLAY ---
  const userCodeSpan = document.getElementById('visualizationUserCode')
  if (userCodeSpan) {
    userCodeSpan.textContent = user.userCode
  }
  // --- END OF USER CODE DISPLAY ---
}

function downloadVisualizationChart() {
  const canvas = document.getElementById('visualization')
  if (!canvas) {
    console.error('Canvas element not found.')
    return
  }

  const userCodeSpan = document.getElementById('visualizationUserCode')
  const userCode = userCodeSpan ? userCodeSpan.textContent : 'chart' // Default filename if user code is not available

  const link = document.createElement('a')
  link.download = `chart_${userCode}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function escapeCsvValue(value) {
  if (typeof value !== 'string') {
    return value
  }
  let escapedValue = value.replace(/"/g, '""') // Escape double quotes
  if (
    escapedValue.includes(',') ||
    escapedValue.includes('\n') ||
    escapedValue.includes('"')
  ) {
    escapedValue = `"${escapedValue}"` // Enclose in double quotes if necessary
  }
  return escapedValue
}

function exportSelectedData() {
  const checked = document.querySelectorAll('.user-select:checked')
  if (!checked.length) {
    showError('Please select at least one user to export data.')
    return
  }

  const selectedUsers = []
  checked.forEach((box) => {
    const row = box.closest('tr')
    const codeCell = row.querySelector('td:nth-child(2)') // Code is in 2nd column
    if (!codeCell) return
    const userCode = codeCell.textContent.trim()
    const user = users.find((u) => u.userCode === userCode)
    if (user) selectedUsers.push(user)
  })

  const csvRows = []

  // Define the headers for the CSV file, including timestamps
  const headers = [
    'Code',
    'Attempt',
    'Datenschutz Accepted',
    'Gender',
    'Birth Year',
    'Studies Teaching?',
    'Teaching Type/Subject',
    'Semester',
    'T1 Strategy',
    'Courses',
    'T2 Course Feedback',
    'T2 Reflection',
    'T3 Reflection',
    'T1 Timestamp', // Add timestamp headers
    'T2 Timestamp',
    'T3 Timestamp',
    ...questionIds.flatMap((id) => [`${id} (T1)`, `${id} (T2)`, `${id} (T3)`]),
  ]

  csvRows.push(headers.map(escapeCsvValue).join(',')) // Add headers, escaping values

  selectedUsers.forEach((user) => {
    // Determine the correct source for personal data based on attemptNumber
    const attemptNumber = user.attemptNumber || 1
    let personalData = {}
    let courses = []
    let t1Strategy = ''
    let t2CourseFeedback = ''
    let t2Reflection = ''
    let t3Reflection = ''

    if (attemptNumber === 1) {
      personalData = user.initialResponses || {}
      courses = user.courses || []
      t1Strategy = safeAccess(user, 'openEndedResponses.t1_strategy') || ''
    } else if (attemptNumber === 2) {
      personalData = user.updatedResponses || {}
      // Fallback to initialResponses
      for (const key in user.initialResponses) {
        if (!(key in personalData)) {
          personalData[key] = user.initialResponses[key]
        }
      }
      courses = safeAccess(user, 'openEndedResponses.t2_course_list')
        ? safeAccess(user, 'openEndedResponses.t2_course_list')
            .split(';')
            .map((c) => c.trim())
        : []
      t2CourseFeedback =
        safeAccess(user, 'openEndedResponses.t2_course_feedback') || ''
      t2Reflection = safeAccess(user, 'openEndedResponses.t2_reflection') || ''
    } else {
      // attemptNumber === 3
      personalData = user.followUpResponses || {}
      // Fallback to updated/initial
      for (const key in user.updatedResponses) {
        if (!(key in personalData)) {
          personalData[key] = user.updatedResponses[key]
        }
      }
      for (const key in user.initialResponses) {
        if (!(key in personalData)) {
          personalData[key] = user.initialResponses[key]
        }
      }
      courses = user.courses || []
      t3Reflection = safeAccess(user, 'openEndedResponses.t3_reflection') || ''
    }
    // Extract personal data fields, handling potential null/undefined values
    const gender = personalData.q0_0 || ''
    const birthYear = personalData.q0_1 || ''
    const studiesTeaching = personalData.q0_2 || ''
    const teachingType = personalData.q0_6 || '' // Corrected: q0_6 for Lehramt type
    const subjects = personalData.q0_7 || '' // Corrected: q0_7 for subjects
    const otherStudies = personalData.q0_8 || '' // Corrected: q0_8 for other studies
    const semester = personalData.q0_3 || '' // Corrected: q0_3 for semester

    // Determine "Lehramt/Studiengang" based on "Studieren Sie Lehramt?"
    let teachingInfo = ''
    if (studiesTeaching === 'Ja') {
      teachingInfo = `Lehramt: ${teachingType}, Fächer: ${subjects}`
    } else if (studiesTeaching === 'Nein') {
      teachingInfo = `Studiengang: ${otherStudies}`
    }

    // Access responses using the correct attempt-specific objects
    const t1 = user.responses?.t1 || {}
    const t2 = user.responses?.t2 || {}
    const t3 = user.responses?.t3 || {}

    // Build the CSV row for the current user, including formatted timestamps
    const row = [
      user.userCode,
      user.attemptNumber || 1, // Ensure attemptNumber is included
      user.datenschutzConsent ? 'Yes' : 'No',
      gender,
      birthYear,
      studiesTeaching,
      teachingInfo,
      semester,
      t1Strategy,
      (courses || []).join('; '), // Corrected courses handling
      t2CourseFeedback,
      t2Reflection,
      t3Reflection,
      user.timeStamps?.t1 ? new Date(user.timeStamps.t1).toISOString() : '', // Keep ISO format for export
      user.timeStamps?.t2 ? new Date(user.timeStamps.t2).toISOString() : '',
      user.timeStamps?.t3 ? new Date(user.timeStamps.t3).toISOString() : '',
      ...questionIds.flatMap((id) => [
        t1[id] || '',
        t2[id] || '',
        t3[id] || '',
      ]),
    ]
    csvRows.push(row.map(escapeCsvValue).join(',')) // Add row, escaping all values
  })

  // Combine rows into a single CSV string
  const csvContent = csvRows.join('\n')

  // Create a Blob and trigger a download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'survey_data.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
