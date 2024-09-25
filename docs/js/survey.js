// Global variables
let currentSection = 0
let userData = {}
let chart1Instance = null
let initialScores = {}
let updatedScores = {}

// Constants
const labelMap = {
  'Suchen, Verarbeiten und Aufbewahren': 'Suchen',
  'Kommunikation und Kollaborieren': 'Kommunizieren',
  'Produzieren und Präsentieren': 'Produzieren',
  'Schützen und sicher Agieren': 'Schützen',
  'Problemlösen und Handeln': 'Problemlösen',
  'Analysieren und Reflektieren': 'Analysieren',
}

const colorMap = {
  Suchen: '#00FF00', // Bright Green
  Kommunizieren: '#00FFFF', // Cyan
  Produzieren: '#FF0000', // Bright Red
  Schützen: '#8000FF', // Purple
  Problemlösen: '#FF00FF', // Magenta
  Analysieren: '#FFD700', // Gold
}

const competencyDescriptions = {
  'Suchen, Verarbeiten und Aufbewahren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
  'Kommunikation und Kollaborieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen, dabei die Verhaltensnormen in digitalen Umgebungen zu beachten und digitale Technologien zur gesellschaftlichen Teilhabe und Selbstermächtigung zu nutzen.',
  'Problemlösen und Handeln':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen und kreative technische Lösungen für spezifische Bedürfnisse zu finden. Zudem gehört zum Kompetenzbereich informatisches Denken, also das strategische Lösen komplexer Probleme in digitalen Umgebungen und die kontinuierliche Weiterentwicklung der eigenen digitalen Kompetenzen.',
  'Schützen und sicher Agieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren bei der Nutzung digitaler Technologien zu vermeiden, und persönliche Daten, Identität sowie Privatsphäre in digitalen Umgebungen verantwortungsvoll zu schützen.',
  'Produzieren und Präsentieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren, dabei Urheberrecht und Lizenzen zu berücksichtigen, sowie das Programmieren digitaler Produkte.',
  'Analysieren und Reflektieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren, deren Glaubwürdigkeit und Zuverlässigkeit kritisch zu bewerten sowie Geschäftsaktivitäten in digitalen Umgebungen zu identifizieren und angemessen darauf zu reagieren.',
}

document.addEventListener('DOMContentLoaded', function () {
  loadUserData()
  populateSectionDropdown()
  renderSection(currentSection)
  updateProgressBar()
  setupEventListeners()
  checkResumeToken()
})

function setupEventListeners() {
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
}

function checkResumeToken() {
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
}

function loadUserData() {
  const userId = sessionStorage.getItem('userId')
  const storedData = sessionStorage.getItem('surveyData')
  const storedInitialScores = sessionStorage.getItem('initialScores')
  const storedUpdatedScores = sessionStorage.getItem('updatedScores')

  if (userId) {
    fetch(`/api/user-data/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        return response.json()
      })
      .then((data) => {
        if (data.data && data.data.responses) {
          userData = data.data.responses
          currentSection = parseInt(data.data.currentSection) || 0
          initialScores = data.initialScores || {}
          updatedScores = data.updatedScores || {}

          // Store the scores in session storage
          sessionStorage.setItem('initialScores', JSON.stringify(initialScores))
          sessionStorage.setItem('updatedScores', JSON.stringify(updatedScores))
        } else if (storedData) {
          userData = JSON.parse(storedData)
          currentSection = userData.currentSection || 0
          initialScores = JSON.parse(storedInitialScores || '{}')
          updatedScores = JSON.parse(storedUpdatedScores || '{}')
        } else {
          resetUserData()
        }
        renderSection(currentSection)
        updateProgressBar()
      })
      .catch((error) => {
        console.error('Error loading user data:', error)
        if (storedData) {
          userData = JSON.parse(storedData)
          currentSection = userData.currentSection || 0
          initialScores = JSON.parse(storedInitialScores || '{}')
          updatedScores = JSON.parse(storedUpdatedScores || '{}')
        } else {
          resetUserData()
        }
        renderSection(currentSection)
        updateProgressBar()
      })
  } else {
    resetUserData()
    renderSection(currentSection)
    updateProgressBar()
  }
}

function resetUserData() {
  userData = {}
  currentSection = 0
  initialScores = {}
  updatedScores = {}
}

function renderSection(index) {
  const section = surveyData[index]
  let html = `<div class="section"><h2>${section.title}</h2>`

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`
    let savedValue = userData[questionId] || ''

    html += `<div class="question"><p>${question.text}</p>`

    if (question.type === 'radio') {
      question.options.forEach((option) => {
        html += `<label><input type="radio" name="${questionId}" value="${option}" ${
          savedValue === option ? 'checked' : ''
        } required> ${option}</label><br>`
      })
    } else if (question.type === 'number') {
      html += `<div class="input-container">
                <input type="number" id="${questionId}" name="${questionId}" value="${savedValue}" min="${question.min}" max="${question.max}" required>
                <label for="${questionId}" class="floating-label">Enter a number</label>
               </div>`
    } else if (question.type === 'scale') {
      html += `<div class="rating-scale" role="group" aria-label="Competency scale from 0 to 6">`
      for (let i = 0; i <= 6; i++) {
        html += `<label class="scale-label">
                  <input type="radio" name="${questionId}" value="${i}" ${
          savedValue === i.toString() ? 'checked' : ''
        } required>
                  <span class="scale-button" role="radio" aria-checked="${
                    savedValue === i.toString() ? 'true' : 'false'
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

  progressFill.setAttribute('aria-valuenow', currentSection + 1)
  progressFill.setAttribute('aria-valuemax', surveyData.length)
}

function saveSectionData(isComplete = false) {
  const formData = new FormData(document.getElementById('surveyForm'))
  for (let [key, value] of formData.entries()) {
    userData[key] = value
  }
  userData.currentSection = currentSection

  const userId = sessionStorage.getItem('userId')
  if (userId) {
    const categoryScores = calculateCategoryScores()
    const data = {
      userId: userId,
      data: {
        responses: userData,
        currentSection: currentSection,
      },
      isComplete: isComplete,
      categoryScores: categoryScores,
    }

    fetch('/api/save-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`)
        }
        return response.json()
      })
      .then((result) => {
        console.log('Data saved successfully:', result)
        sessionStorage.setItem('surveyData', JSON.stringify(userData))
        sessionStorage.setItem(
          'initialScores',
          JSON.stringify(result.initialScores)
        )
        sessionStorage.setItem(
          'updatedScores',
          JSON.stringify(result.updatedScores)
        )
        initialScores = result.initialScores
        updatedScores = result.updatedScores
      })
      .catch((error) => console.error('Error saving data:', error))
  }
}

function finishSurvey() {
  saveSectionData(true)
  showDatenschutz()
}

function calculateCategoryScores() {
  let categoryScores = {}
  surveyData.forEach((section, sectionIndex) => {
    if (section.title !== 'Persönliche Angaben') {
      let totalScore = 0
      let questionCount = 0
      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`
        if (userData[questionId] && question.type === 'scale') {
          totalScore += parseInt(userData[questionId])
          questionCount++
        }
      })
      if (questionCount > 0) {
        categoryScores[section.title] = Math.round(
          (totalScore / (questionCount * 6)) * 100
        )
      } else {
        categoryScores[section.title] = 0
      }
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
    }
    e.target.value = currentSection
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
    if (section.title !== 'Persönliche Angaben') {
      section.questions.forEach((question, qIndex) => {
        const questionId = `q${surveyData.indexOf(section)}_${qIndex}`
        if (userData[questionId] !== undefined && question.type === 'scale') {
          totalScore += parseInt(userData[questionId])
          totalQuestions++
        }
      })
    }
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

  // Retrieve scores from session storage
  initialScores = JSON.parse(sessionStorage.getItem('initialScores') || '{}')
  updatedScores = JSON.parse(sessionStorage.getItem('updatedScores') || '{}')

  const resultHtml = `
    <h2>Ihr Kompetenz-Score: ${score}%</h2>
    <p>Dieser Score repräsentiert Ihren aktuellen Stand in digitalen Kompetenzen basierend auf Ihren Antworten.</p>
    <h3>Kursempfehlungen</h3>
    <p>Basierend auf Ihrem Score empfehlen wir folgende Kurse zur Verbesserung Ihrer digitalen Kompetenzen:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
    <h3>Kompetenzdiagramm</h3>
    <p>Das folgende Diagramm zeigt Ihre Scores in verschiedenen Kompetenzbereichen. Die helleren Balken repräsentieren Ihre initialen Scores, während die dunkleren Balken Ihre aktuellen Scores darstellen.</p>
    <div style="height: 300px; width: 100%;">
      <canvas id="competencyChart1"></canvas>
    </div>
    <div id="descriptionBox1"></div>
    <button id="downloadChart" class="btn btn-primary">Diagramm herunterladen</button>
  `

  document.getElementById('surveyForm').innerHTML = resultHtml

  setTimeout(() => {
    createCompetencyChart1(initialScores, updatedScores)
  }, 100)

  const downloadButton = document.getElementById('downloadChart')
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadChart)
  } else {
    console.error('Download button not found')
  }
}

function getLighterColor(hexColor) {
  let r = parseInt(hexColor.slice(1, 3), 16)
  let g = parseInt(hexColor.slice(3, 5), 16)
  let b = parseInt(hexColor.slice(5, 7), 16)

  // Increase lightness more significantly
  r = Math.min(255, r + 150)
  g = Math.min(255, g + 150)
  b = Math.min(255, b + 150)

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function updateDescriptionBox(descriptionBox, competency, description) {
  const fullLabel = Object.keys(labelMap).find(
    (key) => labelMap[key] === competency
  )
  const color = colorMap[competency]
  const lighterColor = getLighterColor(color)

  descriptionBox.innerHTML = `
    <h3>${fullLabel}</h3>
    <p>${description || 'Beschreibung nicht verfügbar.'}</p>
  `
  descriptionBox.style.backgroundColor = lighterColor
  descriptionBox.style.padding = '15px'
  descriptionBox.style.borderRadius = '5px'
  descriptionBox.style.border = `2px solid ${color}`
  descriptionBox.style.color = getContrastColor(lighterColor)
}

function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

function createCompetencyChart1(initialScores, updatedScores) {
  const canvas = document.getElementById('competencyChart1')
  const descriptionBox = document.getElementById('descriptionBox1')
  if (!canvas || !descriptionBox) {
    console.error('Chart canvas or description box not found')
    return
  }

  if (chart1Instance) {
    chart1Instance.destroy()
  }

  const ctx = canvas.getContext('2d')

  // Ensure we have data to display
  if (
    Object.keys(initialScores).length === 0 &&
    Object.keys(updatedScores).length === 0
  ) {
    console.error('No scores available to display')
    canvas.style.display = 'none'
    descriptionBox.innerHTML = '<p>Noch keine Kompetenzdaten verfügbar.</p>'
    return
  }

  const labels = Object.keys(initialScores).map((key) => labelMap[key] || key)
  let currentHoveredIndex = -1

  chart1Instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Initial Score',
          data: Object.values(initialScores),
          backgroundColor: labels.map((label) =>
            getLighterColor(colorMap[label] || '#999999')
          ),
          borderColor: labels.map((label) => colorMap[label] || '#999999'),
          borderWidth: 1,
        },
        {
          label: 'Updated Score',
          data: Object.values(updatedScores),
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
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            generateLabels: (chart) => {
              return chart.data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle:
                  i === 0
                    ? getLighterColor(colorMap[labels[0]])
                    : colorMap[labels[0]],
                strokeStyle: colorMap[labels[0]],
                lineWidth: 1,
                hidden: false,
                index: i,
              }))
            },
          },
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              const fullLabel = Object.keys(labelMap).find(
                (key) => labelMap[key] === tooltipItems[0].label
              )
              return fullLabel || tooltipItems[0].label
            },
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y}%`,
          },
        },
      },
      onHover: (event, activeElements) => {
        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index
          if (dataIndex !== currentHoveredIndex) {
            currentHoveredIndex = dataIndex
            const competency = labels[dataIndex]
            const fullCompetency = Object.keys(labelMap).find(
              (key) => labelMap[key] === competency
            )
            updateDescriptionBox(
              descriptionBox,
              competency,
              competencyDescriptions[fullCompetency]
            )
          }
        } else {
          currentHoveredIndex = -1
          descriptionBox.innerHTML = ''
          descriptionBox.style.backgroundColor = ''
          descriptionBox.style.border = ''
        }
      },
    },
  })

  // Force chart update
  chart1Instance.update()
}

function downloadChart(event) {
  event.preventDefault()
  const canvas1 = document.getElementById('competencyChart1')
  if (canvas1) {
    const link = document.createElement('a')
    link.download = 'competency-chart.png'
    link.href = canvas1.toDataURL()
    link.click()
  }
}

// Make sure surveyData is available
if (typeof surveyData === 'undefined') {
  console.error(
    'surveyData is not defined. Please ensure it is loaded before using this script.'
  )
}

// Expose necessary functions globally
window.showResults = showResults
window.saveSectionData = saveSectionData
