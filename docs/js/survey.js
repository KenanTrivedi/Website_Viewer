let currentSection = 0
let userData = {}
let isNewUser = true

document.addEventListener('DOMContentLoaded', function () {
  loadUserData()
  populateSectionDropdown()
  renderSection(currentSection)
  updateProgressBar()
  document
    .getElementById('prevButton')
    .addEventListener('click', previousSection)
  document.getElementById('nextButton').addEventListener('click', nextSection)
  document.getElementById('logoutButton').addEventListener('click', logout)
  document
    .getElementById('saveProgressButton')
    .addEventListener('click', saveAndResumeLater)
  document
    .getElementById('section-select')
    .addEventListener('change', handleSectionChange)

  // Check for resume token
  const resumeToken = localStorage.getItem('surveyResumeToken')
  if (resumeToken) {
    const { userId, section } = JSON.parse(atob(resumeToken))
    if (userId === sessionStorage.getItem('userId')) {
      currentSection = parseInt(section)
      renderSection(currentSection)
      updateProgressBar()
      localStorage.removeItem('surveyResumeToken')
    }
  }
})

function loadUserData() {
  const userId = sessionStorage.getItem('userId')
  if (userId) {
    fetch(`/api/user-data/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (
          data.data &&
          data.data.responses &&
          Object.keys(data.data.responses).length > 0
        ) {
          userData = data.data.responses
          currentSection = parseInt(data.data.currentSection) || 0
          isNewUser = false
        } else {
          isNewUser = true
          userData = {}
        }
        renderSection(currentSection)
      })
      .catch((error) => {
        console.error('Error loading user data:', error)
        isNewUser = true
        userData = {}
        renderSection(currentSection)
      })
  } else {
    isNewUser = true
    userData = {}
    renderSection(currentSection)
  }
}

function renderSection(index) {
  const section = surveyData[index]
  let html = `<div class="section"><h2>${section.title}</h2>`

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`
    let savedValue = isNewUser ? '' : userData[questionId] || ''

    html += `<div class="question"><p>${question.text}</p>`

    if (question.type === 'radio') {
      question.options.forEach((option) => {
        html += `<label><input type="radio" name="${questionId}" value="${option}" ${
          !isNewUser && savedValue === option ? 'checked' : ''
        } required> ${option}</label><br>`
      })
    } else if (question.type === 'number') {
      html += `
        <div class="input-container">
          <input type="number" id="${questionId}" name="${questionId}" value="${savedValue}" min="${question.min}" max="${question.max}" required>
          <label for="${questionId}" class="floating-label">Enter a number</label>
        </div>`
    } else if (question.type === 'scale') {
      html += `<div class="rating-scale" role="group" aria-label="Competency scale from 0 to 6">`
      for (let i = 0; i <= 6; i++) {
        html += `
          <label class="scale-label">
            <input type="radio" name="${questionId}" value="${i}" ${
          !isNewUser && savedValue == i ? 'checked' : ''
        } required>
            <span class="scale-button" role="radio" aria-checked="${
              !isNewUser && savedValue == i ? 'true' : 'false'
            }" tabindex="0">${i}</span>
            <span class="sr-only">${
              i === 0
                ? 'gar nicht kompetent'
                : i === 6
                ? 'ausgesprochen kompetent'
                : ''
            }</span>
          </label>`
      }
      html += `</div>
        <div class="scale-labels">
          <span>gar nicht kompetent</span>
          <span>ausgesprochen kompetent</span>
        </div>`
    }

    html += `</div>`
  })

  html += `</div>`
  document.getElementById('surveyForm').innerHTML = html

  // Add event listeners for keyboard navigation on scale buttons
  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('keydown', handleScaleKeydown)
  })

  updateNavigationButtons()
  updateSectionDropdown(index)
  window.scrollTo(0, 0)
}

function handleScaleKeydown(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    event.target.previousElementSibling.checked = true
    event.target.setAttribute('aria-checked', 'true')
  }
}

function updateProgressBar() {
  const progress = ((currentSection + 1) / surveyData.length) * 100
  const progressFill = document.getElementById('progressFill')
  const progressText = document.getElementById('progressText')

  progressFill.style.width = `${progress}%`
  progressText.textContent = `Abschnitt ${currentSection + 1} von ${
    surveyData.length
  }`

  // Update ARIA attributes for accessibility
  progressFill.setAttribute('aria-valuenow', currentSection + 1)
  progressFill.setAttribute('aria-valuemax', surveyData.length)
}

function saveSectionData() {
  const formData = new FormData(document.getElementById('surveyForm'))
  for (let [key, value] of formData.entries()) {
    userData[key] = value
  }
  userData.currentSection = currentSection

  const userId = sessionStorage.getItem('userId')
  if (userId) {
    const data = {
      userId: userId,
      data: {
        responses: userData,
        currentSection: currentSection,
        overallScore: calculateCompetenzScore(),
        categoryScores: calculateCategoryScores(),
      },
    }

    fetch('/api/save-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => console.log('Data saved successfully:', data))
      .catch((error) => console.error('Error saving data:', error))
  }
}

function calculateCategoryScores() {
  let categoryScores = {}
  surveyData.forEach((section) => {
    let totalScore = 0
    let questionCount = 0
    section.questions.forEach((question, qIndex) => {
      const questionId = `q${surveyData.indexOf(section)}_${qIndex}`
      if (userData[questionId] !== undefined && question.type === 'scale') {
        totalScore += parseInt(userData[questionId])
        questionCount++
      }
    })
    if (section.title !== 'Persönliche Angaben') {
      categoryScores[section.title] =
        questionCount > 0
          ? Math.round((totalScore / (questionCount * 6)) * 100)
          : 0
    }
  })
  return categoryScores
}

function saveAndResumeLater() {
  saveSectionData()
  const resumeToken = btoa(
    JSON.stringify({
      userId: sessionStorage.getItem('userId'),
      section: currentSection,
    })
  )
  localStorage.setItem('surveyResumeToken', resumeToken)
  alert(
    'Ihr Fortschritt wurde gespeichert. Sie können später mit demselben Login fortfahren.'
  )
  window.location.href = 'index.html'
}

function previousSection() {
  if (currentSection > 0) {
    saveSectionData()
    currentSection--
    renderSection(currentSection)
    updateProgressBar()
  }
}

function nextSection() {
  if (validateSection()) {
    saveSectionData()
    if (currentSection < surveyData.length - 1) {
      currentSection++
      renderSection(currentSection)
      updateProgressBar()
    } else {
      finishSurvey()
    }
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
  }
}

function validateSection() {
  const inputs = document.querySelectorAll('#surveyForm input[required]')
  let isValid = true
  inputs.forEach((input) => {
    if (input.type === 'radio') {
      const name = input.getAttribute('name')
      if (!document.querySelector(`input[name="${name}"]:checked`)) {
        isValid = false
        highlightQuestion(input.closest('.question'))
      }
    } else if (input.value.trim() === '') {
      isValid = false
      highlightQuestion(input.closest('.question'))
    }
  })
  return isValid
}

function highlightQuestion(questionElement) {
  questionElement.classList.add('unanswered')
  questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function logout() {
  saveSectionData()
  sessionStorage.clear()
  window.location.href = 'login.html'
}

function populateSectionDropdown() {
  const select = document.getElementById('section-select')
  surveyData.forEach((section, index) => {
    const option = document.createElement('option')
    option.value = index
    option.textContent = section.title
    select.appendChild(option)
  })
}

function updateSectionDropdown(currentIndex) {
  const select = document.getElementById('section-select')
  select.value = currentIndex
}

function handleSectionChange(e) {
  const selectedSection = parseInt(e.target.value)
  if (selectedSection !== currentSection) {
    if (validateSection()) {
      saveSectionData()
      currentSection = selectedSection
      renderSection(currentSection)
      updateProgressBar()
    } else {
      alert(
        'Bitte beantworten Sie alle Fragen in diesem Abschnitt, bevor Sie zu einem anderen wechseln.'
      )
      e.target.value = currentSection
    }
  }
}

function updateNavigationButtons() {
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')

  prevButton.disabled = currentSection === 0
  nextButton.textContent =
    currentSection === surveyData.length - 1 ? 'Abschließen' : 'Weiter'
  nextButton.innerHTML =
    currentSection === surveyData.length - 1
      ? 'Abschließen'
      : 'Weiter <i class="fas fa-chevron-right"></i>'
}

function calculateCompetenzScore() {
  let totalScore = 0
  let totalQuestions = 0

  surveyData.forEach((section) => {
    section.questions.forEach((question, qIndex) => {
      const questionId = `q${surveyData.indexOf(section)}_${qIndex}`
      if (userData[questionId] !== undefined && question.type === 'scale') {
        totalScore += parseInt(userData[questionId])
        totalQuestions++
      }
    })
  })

  if (totalQuestions === 0) return 0

  const maxPossibleScore = totalQuestions * 6
  const percentage = (totalScore / maxPossibleScore) * 100

  return Math.round(percentage)
}

function getCoursesSuggestions(score) {
  if (score < 30) {
    return ['Basic Digital Skills', 'Introduction to Online Safety']
  } else if (score < 60) {
    return ['Intermediate Digital Literacy', 'Effective Online Communication']
  } else {
    return ['Advanced Digital Competencies', 'Digital Leadership in Education']
  }
}

function finishSurvey() {
  saveSectionData()
  showDatenschutz()
}

function showDatenschutz() {
  const datenschutzHtml = `
    <h1>Datenschutz</h1>
    <h2>Projektleitung: Prof.in Dr. Charlott Rubach & Anne-Kathrin Hirsch</h2>
    
    <button id="acceptDatenschutz">Akzeptieren und fortfahren</button>
  `

  document.getElementById('surveyForm').innerHTML = datenschutzHtml
  document.querySelector('.navigation-buttons').style.display = 'none'
  document.querySelector('.progress-container').style.display = 'none'
  document.querySelector('.section-nav').style.display = 'none'

  document
    .getElementById('acceptDatenschutz')
    .addEventListener('click', showResults)
}

function showResults() {
  const score = calculateCompetenzScore()
  const courses = getCoursesSuggestions(score)
  const categoryScores = calculateCategoryScores()

  const resultHtml = `
    <h2>Your Competenz Score: ${score}%</h2>
    <p>Based on your score, we recommend the following courses:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
    <canvas id="competencyChart" width="600" height="400"></canvas>
    <button id="downloadChart" class="btn btn-primary">Download Chart</button>
  `

  document.getElementById('surveyForm').innerHTML = resultHtml

  createCompetencyChart(categoryScores)

  const downloadButton = document.getElementById('downloadChart')
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadChart)
  } else {
    console.error('Download button not found')
  }
}

function createCompetencyChart(categoryScores) {
  const canvas = document.getElementById('competencyChart')
  if (!canvas) {
    console.error('Chart canvas not found')
    return
  }

  const ctx = canvas.getContext('2d')
  const labels = Object.keys(categoryScores)
  const data = Object.values(categoryScores)

  // Define colors for each category
  const colorMap = {
    'Analysieren und Reflektieren': '#FFD473',
    'Kommunikation und Kollaborieren': '#0CC0DF',
    'Problemlösen und Handeln': '#E884C4',
    'Produzieren und Präsentieren': '#FF6D5F',
    'Schützen und sicher agieren': '#8C52FF',
    'Suchen, Verarbeiten und Aufbewahren': '#00BF63',
  }

  try {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: labels.map(
              (label) => colorMap[label] || '#004a99'
            ), // Default to blue if color not found
            borderColor: labels.map((label) => colorMap[label] || '#004a99'),
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
            title: {
              display: false, // Remove x-axis title
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false, // Remove chart title
          },
          tooltip: {
            callbacks: {
              title: function (tooltipItems) {
                return tooltipItems[0].label
              },
              label: function (context) {
                return `Competency Score: ${context.parsed.y}%`
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Error creating chart:', error)
  }
}

function downloadChart(event) {
  event.preventDefault()
  const canvas = document.getElementById('competencyChart')
  if (canvas) {
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'competency-chart.png'
    link.href = image
    link.click()
  } else {
    console.error('Chart canvas not found')
  }
}
