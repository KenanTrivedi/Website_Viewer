const token = localStorage.getItem('dashboardToken')

function fetchSurveyData() {
  return fetch('/api/survey-data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => response.json())
}

function createOverallScoresChart(data) {
  const ctx = document.getElementById('overallScoresChart').getContext('2d')
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((item) => item.userId),
      datasets: [
        {
          label: 'Overall Scores',
          data: data.map((item) => item.data.overallScore),
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function createCategoryScoresChart(data) {
  const categories = Object.keys(data[0].data.categoryScores)
  const datasets = categories.map((category) => ({
    label: category,
    data: data.map((item) => item.data.categoryScores[category]),
    backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
      Math.random() * 255
    }, 0.5)`,
  }))

  const ctx = document.getElementById('categoryScoresChart').getContext('2d')
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.map((item) => item.userId),
      datasets: datasets,
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function populateDataTable(data) {
  const tableBody = document.querySelector('#surveyDataTable tbody')
  tableBody.innerHTML = data
    .map(
      (item) => `
          <tr>
              <td>${item.userId}</td>
              <td>${item.data.overallScore}</td>
              <td>${new Date(item.data.timestamp).toLocaleString()}</td>
          </tr>
      `
    )
    .join('')
}

function logout() {
  localStorage.removeItem('dashboardToken')
  window.location.href = '/dashboard-login.html'
}

document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = '/dashboard-login.html'
    return
  }

  fetchSurveyData()
    .then((data) => {
      createOverallScoresChart(data)
      createCategoryScoresChart(data)
      populateDataTable(data)
    })
    .catch((error) => {
      console.error('Error fetching data:', error)
      if (error.message === 'Unauthorized') {
        logout()
      }
    })

  document.getElementById('logoutBtn').addEventListener('click', logout)
})
