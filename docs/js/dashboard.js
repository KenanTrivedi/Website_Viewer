let users = []
let sections = []

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
    users = data.users
    sections = data.sections
    renderTable()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

function renderTable() {
  const thead = document.querySelector('#userTable thead tr')
  const tbody = document.querySelector('#userTable tbody')

  // Add section headers
  sections.forEach((section) => {
    const th = document.createElement('th')
    th.textContent = section
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
            <td>${user.userId}</td>
            <td>${user.gender}</td>
            <td>${user.birthYear}</td>
            ${sections
              .map((section) => `<td>${user.scores[section] || 0}</td>`)
              .join('')}
        `
    tr.addEventListener('click', () => showUserDetails(user))
    tbody.appendChild(tr)
  })
}

function showUserDetails(user) {
  const modal = new bootstrap.Modal(document.getElementById('userModal'))
  const ctx = document.getElementById('userChart').getContext('2d')

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: sections,
      datasets: [
        {
          label: 'User Scores',
          data: sections.map((section) => user.scores[section] || 0),
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)',
        },
      ],
    },
    options: {
      elements: {
        line: {
          borderWidth: 3,
        },
      },
      scales: {
        r: {
          angleLines: {
            display: false,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  })

  modal.show()
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
      'User ID': user.userId,
      Gender: user.gender,
      'Birth Year': user.birthYear,
      ...user.scores,
    }))
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
  XLSX.writeFile(workbook, 'survey_data.xlsx')
}
