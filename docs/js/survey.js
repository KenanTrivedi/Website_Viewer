// survey.js

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
  'Suchen, Verarbeiten und Aufbewahren': '#00BF63', // Green
  'Kommunikation und Kollaborieren': '#0CC0DF', // Blue
  'Produzieren und Präsentieren': '#FF6D5F', // Red
  'Schützen und sicher Agieren': '#8C52FF', // Purple
  'Problemlösen und Handeln': '#E884C4', // Pink
  'Analysieren und Reflektieren': '#FFD473', // Yellow
}

const competencyDescriptions = {
  'Suchen, Verarbeiten und Aufbewahren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
  'Kommunikation und Kollaborieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen, dabei die Verhaltensnormen in digitalen Umgebungen zu beachten und digitale Technologien zur gesellschaftlichen Teilhabe und Selbstermächtigung zu nutzen.',
  'Produzieren und Präsentieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren, dabei Urheberrecht und Lizenzen zu berücksichtigen, sowie das Programmieren digitaler Produkte.',
  'Schützen und sicher Agieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren bei der Nutzung digitaler Technologien zu vermeiden, und persönliche Daten, Identität sowie Privatsphäre in digitalen Umgebungen verantwortungsvoll zu schützen.',
  'Problemlösen und Handeln':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen und kreative technische Lösungen für spezifische Bedürfnisse zu finden. Zudem gehört zum Kompetenzbereich informatisches Denken, also das strategische Lösen komplexer Probleme in digitalen Umgebungen und die kontinuierliche Weiterentwicklung der eigenen digitalen Kompetenzen.',
  'Analysieren und Reflektieren':
    'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren, deren Glaubwürdigkeit und Zuverlässigkeit kritisch zu bewerten sowie Geschäftsaktivitäten in digitalen Umgebungen zu identifizieren und angemessen darauf zu reagieren.',
}

// Load the survey data (ensure that surveyData is available globally)
// If surveyData is in a separate file, make sure to include it before this script.

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
  // Removed section-select since "Springen zu Abschnitt:" was deleted
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

  // Add instruction before "Suchen, Verarbeiten und Aufbewahren"
  if (section.title === 'Suchen, Verarbeiten und Aufbewahren') {
    html += `<p>Wie kompetent fühlen Sie sich in der Ausführung der folgenden Aktivitäten...</p>`
  }

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
                <label for="${questionId}" class="floating-label">Füge das Jahr als Zahl ein</label>
               </div>`
    } else if (question.type === 'scale') {
      html += `<div class="rating-scale" role="group" aria-label="Kompetenzskala von 0 bis 6">`
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
    } else if (question.type === 'dropdown') {
      html += `<select id="${questionId}" name="${questionId}" required>
                <option value="" disabled ${
                  !savedValue ? 'selected' : ''
                }>Bitte wählen Sie eine Option</option>
                ${question.options
                  .map(
                    (option) =>
                      `<option value="${option}" ${
                        savedValue === option ? 'selected' : ''
                      }>${option}</option>`
                  )
                  .join('')}
               </select>`
    } else if (question.type === 'text') {
      html += `<input type="text" id="${questionId}" name="${questionId}" value="${savedValue}" required>`
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
  if (validateSection()) {
    saveSectionData(true)
    showDatenschutz()
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
  }
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

function getCoursesSuggestions(score) {
  if (score < 30) {
    return [
      'Grundlegende digitale Fähigkeiten',
      'Einführung in die Online-Sicherheit',
    ]
  } else if (score < 60) {
    return [
      'Digitale Kompetenz für Fortgeschrittene',
      'Effektive Online-Kommunikation',
    ]
  } else {
    return [
      'Fortgeschrittene digitale Kompetenzen',
      'Digital Leadership in der Bildung',
    ]
  }
}

function showDatenschutz() {
  // Create the modal overlay
  const modalOverlay = document.createElement('div')
  modalOverlay.id = 'datenschutzModalOverlay'
  Object.assign(modalOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  })

  // Create the modal content container
  const modalContent = document.createElement('div')
  Object.assign(modalContent.style, {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '80%',
    maxWidth: '800px',
    height: '80%',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  })

  // Create the header of the modal
  const modalHeader = document.createElement('div')
  Object.assign(modalHeader.style, {
    padding: '10px 20px',
    backgroundColor: '#004A99',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  })

  const modalTitle = document.createElement('h2')
  modalTitle.textContent = 'Datenschutzerklärung'
  Object.assign(modalTitle.style, {
    margin: '0',
    fontSize: '1.5em',
  })

  const closeButtonHeader = document.createElement('span')
  closeButtonHeader.innerHTML = '&times;'
  Object.assign(closeButtonHeader.style, {
    cursor: 'pointer',
    fontSize: '1.5em',
  })

  // Append title and close button to header
  modalHeader.appendChild(modalTitle)
  modalHeader.appendChild(closeButtonHeader)

  // Create the body of the modal with an iframe
  const modalBody = document.createElement('div')
  Object.assign(modalBody.style, {
    flex: '1',
    padding: '20px',
    overflowY: 'auto',
  })

  const iframe = document.createElement('iframe')
  iframe.src = 'datenschutz.html' // Ensure the path is correct relative to survey.html
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
  })

  modalBody.appendChild(iframe)

  // Create the footer with action buttons
  const modalFooter = document.createElement('div')
  Object.assign(modalFooter.style, {
    padding: '10px 20px',
    backgroundColor: '#f1f1f1',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  })

  // Create the "Schließen" (Close) button
  const closeButton = document.createElement('button')
  closeButton.textContent = 'Schließen'
  Object.assign(closeButton.style, {
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '1em',
  })

  // Create the "Akzeptieren und fortfahren" (Accept and Proceed) button
  const acceptButton = document.createElement('button')
  acceptButton.textContent = 'Akzeptieren und fortfahren'
  Object.assign(acceptButton.style, {
    backgroundColor: '#004A99',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '1em',
  })

  // Append buttons to footer
  modalFooter.appendChild(closeButton)
  modalFooter.appendChild(acceptButton)

  // Append header, body, and footer to modal content
  modalContent.appendChild(modalHeader)
  modalContent.appendChild(modalBody)
  modalContent.appendChild(modalFooter)

  // Append modal content to overlay
  modalOverlay.appendChild(modalContent)

  // Append overlay to body
  document.body.appendChild(modalOverlay)

  // Event listener to close modal when '×' in header is clicked
  closeButtonHeader.addEventListener('click', () => {
    modalOverlay.remove()
    alert('Sie müssen die Datenschutzerklärung akzeptieren, um fortzufahren.')
  })

  // Event listener to close modal when 'Schließen' button is clicked
  closeButton.addEventListener('click', () => {
    modalOverlay.remove()
    alert('Sie müssen die Datenschutzerklärung akzeptieren, um fortzufahren.')
  })

  // Event listener to accept and proceed when 'Akzeptieren und fortfahren' button is clicked
  acceptButton.addEventListener('click', () => {
    modalOverlay.remove()
    showResults()
  })
}

function showResults() {
  const score = calculateCompetenzScore()
  const courses = getCoursesSuggestions(score)

  // Retrieve scores from session storage
  initialScores = JSON.parse(sessionStorage.getItem('initialScores') || '{}')
  updatedScores = JSON.parse(sessionStorage.getItem('updatedScores') || '{}')

  const resultHtml = `
    <h2>Ihr Kompetenzscore beträgt ${score}%</h2>
    <p>Dieser Score repräsentiert Ihren aktuellen Stand in digitalen Kompetenzen basierend auf Ihren Antworten.</p>
    <h3>Kursempfehlungen</h3>
    <p>Basierend auf Ihrem Score empfehlen wir folgende Kurse zur Verbesserung Ihrer digitalen Kompetenzen:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
    <h3>Kompetenzdiagramm</h3>
    <p>Das folgende Diagramm zeigt Ihre Scores in verschiedenen Kompetenzbereichen. Die helleren Balken repräsentieren Ihre Ergebnisse nach der ersten Befragung (T1), während die dunkleren Balken Ihre Ergebnisse nach der zweiten Befragung (T2) darstellen.</p>
    <div style="height: 300px; width: 100%;">
      <canvas id="competencyChart1"></canvas>
    </div>
    <div id="descriptionBox1"></div>
    <button id="downloadChart" class="btn btn-primary" style="background-color: #004A99; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Diagramm herunterladen</button>
    <hr>
    <div style="text-align: center; margin-top: 20px;">
      <button id="viewDatenschutzButton" class="btn btn-secondary" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Datenschutzerklärung anzeigen</button>
    </div>
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

  // Add event listener to the "Datenschutzerklärung anzeigen" button
  const viewDatenschutzButton = document.getElementById('viewDatenschutzButton')
  if (viewDatenschutzButton) {
    viewDatenschutzButton.addEventListener('click', () => {
      showDatenschutz()
    })
  }
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

function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

function updateDescriptionBox(descriptionBox, fullCompetency, description) {
  const competency = labelMap[fullCompetency] || fullCompetency
  const color = colorMap[fullCompetency] || '#999999'
  const lighterColor = getLighterColor(color)

  descriptionBox.innerHTML = `
    <h3>${fullCompetency}</h3>
    <p>${description || 'Beschreibung nicht verfügbar.'}</p>
  `
  descriptionBox.style.backgroundColor = lighterColor
  descriptionBox.style.padding = '15px'
  descriptionBox.style.borderRadius = '5px'
  descriptionBox.style.border = `2px solid ${color}`
  descriptionBox.style.color = getContrastColor(lighterColor)
}

function createCompetencyChart1(initialScores, updatedScores) {
  const canvas = document.getElementById('competencyChart1')
  const descriptionBox = document.getElementById('descriptionBox1')
  if (!canvas || !descriptionBox) {
    console.error('Chart canvas oder description box nicht gefunden')
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
    console.error('Keine Scores verfügbar, um anzuzeigen')
    canvas.style.display = 'none'
    descriptionBox.innerHTML = '<p>Noch keine Kompetenzdaten verfügbar.</p>'
    return
  }

  // Use full competency titles as labels
  const fullLabels = Object.keys(updatedScores)
  const labels = fullLabels.map((key) => labelMap[key] || key)
  let currentHoveredIndex = -1

  chart1Instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Initial Score',
          data: fullLabels.map((label) => initialScores[label] || 0),
          backgroundColor: fullLabels.map((label) =>
            getLighterColor(colorMap[label] || '#999999')
          ),
          borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
          borderWidth: 1,
        },
        {
          label: 'Updated Score',
          data: fullLabels.map((label) => updatedScores[label] || 0),
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
        legend: {
          display: true,
          labels: {
            generateLabels: (chart) => {
              const datasets = chart.data.datasets
              return datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: datasets[i].backgroundColor[0],
                strokeStyle: datasets[i].borderColor[0],
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
              const index = tooltipItems[0].dataIndex
              const fullLabel = fullLabels[index]
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
            const fullCompetency = fullLabels[dataIndex]
            updateDescriptionBox(
              descriptionBox,
              fullCompetency,
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
    link.download = 'kompetenz-diagramm.png'
    link.href = canvas1.toDataURL()
    link.click()
  }
}

// Make sure surveyData is available
if (typeof surveyData === 'undefined') {
  console.error(
    'surveyData ist nicht definiert. Bitte stellen Sie sicher, dass es geladen ist, bevor dieses Skript verwendet wird.'
  )
}

// Expose necessary functions globally
window.showResults = showResults
window.saveSectionData = saveSectionData
