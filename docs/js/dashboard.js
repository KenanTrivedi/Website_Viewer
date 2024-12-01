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
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.style.display = 'none';
  
  if (!startDate || !endDate) {
    showError('Please select both start and end dates.');
    return;
  }

  if (startDate > endDate) {
    showError('Start date must be before end date.');
    return;
  }

  if (startDate > new Date() || endDate > new Date()) {
    showError('Dates cannot be in the future.');
    return;
  }

  currentPage = 1;
  renderTable();
  updatePagination();
}

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 3000);
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
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  
  try {
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';
    
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/dashboard-login';
      return;
    }

    const response = await fetch('/api/dashboard-data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      window.location.href = '/dashboard-login';
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.users) || !Array.isArray(data.questionIds)) {
      throw new Error('Invalid data structure received from server');
    }

    questionIds = data.questionIds;
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
    console.error('Error fetching data:', error);
    errorMessage.textContent = 'Failed to load dashboard data. Please try refreshing the page.';
    errorMessage.style.display = 'block';
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

function displayUserData(userData) {
  const tableBody = document.getElementById('userTableBody')
  if (!tableBody) return

  tableBody.innerHTML = ''
  userData.forEach(user => {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${user.userCode}</td>
      <td>${user.gender}</td>
      <td>${user.birthYear}</td>
      <td>${user.data?.responses?.q0_2 || ''}</td>
      <td>${user.data?.responses?.q0_3 || ''}</td>
      <td>${user.courses?.join(', ') || ''}</td>
      <td>${user.openEndedResponses?.['attempt2_course_feedback'] || ''}</td>
      <td>${user.openEndedResponses?.t1_strategy || ''}</td>
      <td>${user.openEndedResponses?.t2_reflection || ''}</td>
      <td>${user.attemptNumber || 1}</td>
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
    tableBody.appendChild(row)
  })
}

function filterUsers() {
  const searchInput = document.getElementById('userSearch');
  const filterValue = searchInput.value.toLowerCase();
  
  const filteredUsers = users.filter(user => 
    user.userCode.toLowerCase().includes(filterValue) ||
    user.gender.toLowerCase().includes(filterValue) ||
    user.birthYear.toString().includes(filterValue)
  )
  
  return filteredUsers
}

function updatePagination(totalUsers) {
  const totalPages = Math.ceil(totalUsers / usersPerPage)
  document.getElementById('currentPage').textContent = `${currentPage} / ${totalPages}`
}

function changePage(direction) {
  const totalPages = Math.ceil(users.length / usersPerPage)
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages)
  
  const start = (currentPage - 1) * usersPerPage
  const paginatedUsers = users.slice(start, start + usersPerPage)
  
  displayUserData(paginatedUsers)
  updatePagination(users.length)
}

function renderTable() {
  const filteredUsers = filterUsers()
  const start = (currentPage - 1) * usersPerPage
  const paginatedUsers = filteredUsers.slice(start, start + usersPerPage)
  displayUserData(paginatedUsers)
  updatePagination(filteredUsers.length)
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
  if (!currentUser) return;
  
  const ctx = document.getElementById('userChart').getContext('2d');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  try {
    loadingIndicator.style.display = 'block';
    
    if (chart) {
      chart.destroy();
    }

    const categories = Object.keys(labelMap);
    const initialData = categories.map(cat => currentUser.initialScores?.[cat] || 0);
    const updatedData = categories.map(cat => currentUser.updatedScores?.[cat] || 0);
    
    const chartData = {
      labels: categories.map(cat => labelMap[cat]),
      datasets: [
        {
          label: 'Initial Assessment',
          data: initialData,
          backgroundColor: categories.map(cat => getLighterColor(colorMap[cat])),
          borderColor: categories.map(cat => colorMap[cat]),
          borderWidth: 2
        },
        {
          label: 'Latest Assessment',
          data: updatedData,
          backgroundColor: categories.map(cat => colorMap[cat]),
          borderColor: categories.map(cat => colorMap[cat]),
          borderWidth: 2
        }
      ]
    };

    chart = new Chart(ctx, {
      type: 'radar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 6,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: `Competency Profile - ${currentUser.userCode}`,
            font: {
              size: 16
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating visualization:', error);
    showError('Failed to update visualization');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

async function exportToExcel(data) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  try {
    loadingIndicator.style.display = 'block';
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Survey Data');

    // Add headers
    const headers = [
      'User Code',
      'Gender',
      'Birth Year',
      'First Submission',
      'Latest Submission',
      ...questionIds,
      ...Object.keys(labelMap).map(cat => `${labelMap[cat]} Score`)
    ];
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(user => {
      const row = [
        user.userCode,
        user.gender,
        user.birthYear,
        user.firstSubmissionTime ? new Date(user.firstSubmissionTime).toLocaleString() : '',
        user.latestSubmissionTime ? new Date(user.latestSubmissionTime).toLocaleString() : '',
        ...questionIds.map(qId => user.updatedResponses?.[qId] || user.initialResponses?.[qId] || ''),
        ...Object.keys(labelMap).map(cat => user.updatedScores?.[cat] || user.initialScores?.[cat] || 0)
      ];
      worksheet.addRow(row);
    });

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
      column.width = Math.max(
        ...worksheet.getColumn(column.id).values.map(v => v ? v.toString().length : 0)
      ) + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    showError('Failed to export data');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

function toggleSelectAll(event) {
  const checkboxes = document.querySelectorAll('.user-select')
  checkboxes.forEach((checkbox) => (checkbox.checked = event.target.checked))
}

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
  const searchInput = document.getElementById('userSearch');
  const errorMessage = document.getElementById('errorMessage');
  const searchTerm = searchInput.value.trim();
  
  errorMessage.style.display = 'none';
  
  if (searchTerm.length < 2 && searchTerm.length > 0) {
    showError('Please enter at least 2 characters to search');
    return;
  }
  
  currentPage = 1;
  renderTable();
  updatePagination();
}

function changePage(direction) {
  const totalPages = Math.ceil(users.length / usersPerPage)
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages)
  
  const start = (currentPage - 1) * usersPerPage
  const paginatedUsers = users.slice(start, start + usersPerPage)
  
  displayUserData(paginatedUsers)
  updatePagination(users.length)
}
