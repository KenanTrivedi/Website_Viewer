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
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(
              `Server responded with status ${response.status}: ${text}`
            )
          })
        }
        return response.json()
      })
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
    <h2>Ihr Kompetenz-Score: ${score}%</h2>
    <p>Basierend auf Ihrem Score empfehlen wir folgende Kurse:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
    <h3>Diagramm 1: Hover für Scores</h3>
    <div style="height: 300px; width: 100%;">
      <canvas id="competencyChart1"></canvas>
    </div>
    <div id="descriptionBox1"></div>
    <h3>Diagramm 2: Klicken für detaillierte Informationen</h3>
    <div id="chart2Container" style="position: relative; height: 300px; width: 100%;">
      <canvas id="competencyChart2"></canvas>
      <div id="chart2Tooltip" style="position: absolute; display: none; background-color: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; pointer-events: auto;"></div>
    </div>
    <button id="downloadChart" class="btn btn-primary">Diagramme herunterladen</button>
  `

  document.getElementById('surveyForm').innerHTML = resultHtml

  // Use requestAnimationFrame to ensure the DOM is updated before creating charts
  requestAnimationFrame(() => {
    createCompetencyChart1(categoryScores)
    createCompetencyChart2(categoryScores)
  })

  const downloadButton = document.getElementById('downloadChart')
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadChart)
  } else {
    console.error('Download button not found')
  }
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

let chart1Instance = null
let chart2Instance = null

function createCompetencyChart1(categoryScores) {
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
  const labels = Object.keys(categoryScores)
  const data = Object.values(categoryScores)

  const colorMap = {
    'Suchen, Verarbeiten und Aufbewahren': '#00BF63',
    'Kommunikation und Kollaborieren': '#0CC0DF',
    'Produzieren und Präsentieren': '#FF6D5F',
    'Schützen und sicher Agieren': '#8C52FF',
    'Problemlösen und Handeln': '#E884C4',
    'Analysieren und Reflektieren': '#FFD473',
  }

  let currentHoveredIndex = -1

  chart1Instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
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
            maxRotation: 45,
            minRotation: 45,
            autoSkip: false,
            callback: function (value) {
              if (typeof value === 'string') {
                return value.split(' ').length > 1 ? value.split(' ') : value
              }
              return value
            },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => tooltipItems[0].label,
            label: (context) => `Score: ${context.parsed.y}%`,
          },
        },
      },
      onHover: (event, activeElements) => {
        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index
          if (dataIndex !== currentHoveredIndex) {
            currentHoveredIndex = dataIndex
            const competency = labels[dataIndex]
            updateDescriptionBox(
              descriptionBox,
              competency,
              competencyDescriptions[competency]
            )
          }
        }
      },
    },
  })
}

function createCompetencyChart2(categoryScores) {
  const chartContainer = document.getElementById('chart2Container')
  const canvas = document.getElementById('competencyChart2')
  const tooltip = document.getElementById('chart2Tooltip')
  if (!chartContainer || !canvas || !tooltip) {
    console.error('Chart elements not found')
    return
  }

  if (chart2Instance) {
    chart2Instance.destroy()
  }

  const ctx = canvas.getContext('2d')
  const labels = Object.keys(categoryScores)
  const data = Object.values(categoryScores)

  const colorMap = {
    'Suchen, Verarbeiten und Aufbewahren': '#00BF63',
    'Kommunikation und Kollaborieren': '#0CC0DF',
    'Produzieren und Präsentieren': '#FF6D5F',
    'Schützen und sicher Agieren': '#8C52FF',
    'Problemlösen und Handeln': '#E884C4',
    'Analysieren und Reflektieren': '#FFD473',
  }

  chart2Instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
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
            maxRotation: 45,
            minRotation: 45,
            autoSkip: false,
            callback: function (value, index) {
              if (typeof value === 'string') {
                const words = value.split(' ')
                const lines = []
                let line = ''
                words.forEach((word) => {
                  if (line.length + word.length > 10) {
                    lines.push(line)
                    line = word
                  } else {
                    line += (line ? ' ' : '') + word
                  }
                })
                lines.push(line)
                return lines
              }
              return value
            },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          updateTooltip(
            tooltip,
            labels[index],
            data[index],
            chart2Instance,
            index
          )
        } else {
          tooltip.style.display = 'none'
        }
      },
    },
  })

  document.addEventListener('click', (event) => {
    if (!chartContainer.contains(event.target)) {
      tooltip.style.display = 'none'
    }
  })
}

function updateDescriptionBox(descriptionBox, competency, description) {
  descriptionBox.innerHTML = `
    <h3>${competency}</h3>
    <p>${description || 'Beschreibung nicht verfügbar.'}</p>
  `
}
function updateTooltip(tooltip, competency, score, chart, dataIndex) {
  const description = competencyDescriptions[competency]
  tooltip.innerHTML = `
    <div class="tooltip-content">
      <h3>${competency}</h3>
      <p>Score: ${score}%</p>
      <button class="info-button">ℹ️ Show Description</button>
      <p class="description" style="display: none;">${description}</p>
    </div>
  `

  const infoButton = tooltip.querySelector('.info-button')
  const descriptionElement = tooltip.querySelector('.description')
  infoButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (descriptionElement.style.display === 'none') {
      descriptionElement.style.display = 'block'
      infoButton.textContent = '🔼 Hide Description'
    } else {
      descriptionElement.style.display = 'none'
      infoButton.textContent = 'ℹ️ Show Description'
    }
  })

  positionTooltip(tooltip, chart, dataIndex)
  tooltip.style.display = 'block'
}

function positionTooltip(tooltip, chart, dataIndex) {
  const meta = chart.getDatasetMeta(0)
  const rect = chart.canvas.getBoundingClientRect()
  const barPos = meta.data[dataIndex].getCenterPoint()

  const tooltipWidth = 250 // Set a fixed width for the tooltip
  let left = rect.left + barPos.x - tooltipWidth / 2
  const top = rect.top + barPos.y - 10 // Position above the bar

  // Adjust horizontal position if it goes out of the chart area
  if (left < rect.left) left = rect.left
  if (left + tooltipWidth > rect.right) left = rect.right - tooltipWidth

  tooltip.style.left = `${left}px`
  tooltip.style.top = `${top}px`
  tooltip.style.width = `${tooltipWidth}px`
  tooltip.style.transform = 'translateY(-100%)' // Move tooltip above the cursor
}

function downloadChart(event) {
  event.preventDefault()

  const canvas1 = document.getElementById('competencyChart1')
  const canvas2 = document.getElementById('competencyChart2')
  if (canvas1 && canvas2) {
    const zipFile = new JSZip()
    zipFile.file('chart1.png', canvas1.toDataURL().split(',')[1], {
      base64: true,
    })
    zipFile.file('chart2.png', canvas2.toDataURL().split(',')[1], {
      base64: true,
    })
    zipFile.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, 'competency-charts.zip')
    })
  }
}
