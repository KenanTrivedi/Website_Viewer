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

// Removed the populateSectionDropdown function and its invocation as per user request.

document.addEventListener('DOMContentLoaded', function () {
  loadUserData()
  // populateSectionDropdown(); // Removed as per user request
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
          // Merge initialResponses and updatedResponses
          userData = { ...data.initialResponses, ...data.updatedResponses }
          currentSection = data.data.currentSection || 0
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
    let savedValue = ''

    if (userData[questionId] !== undefined) {
      savedValue = userData[questionId]
    }

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
    } else if (question.type === 'date') {
      html += `<input type="date" id="${questionId}" name="${questionId}" value="${savedValue}" required>`
    }

    html += `</div>`
  })

  html += `</div>`
  document.getElementById('surveyForm').innerHTML = html

  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('keydown', handleScaleKeydown)
  })

  updateNavigationButtons()
  // updateSectionDropdown(index); // Removed as per user request
  window.scrollTo(0, 0) // Ensure the page starts at the top
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
  removeUnansweredMarkers() // Remove any previous error markings

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
      data: userData,
      isComplete: isComplete,
      categoryScores: categoryScores,
      courses: sessionStorage.getItem('courses') // Ensure courses are included if needed
        ? [sessionStorage.getItem('courses')]
        : [],
      currentSection: currentSection, // Save the current section
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
    markUnansweredQuestions()
  }
}

function markUnansweredQuestions() {
  const form = document.getElementById('surveyForm')
  const requiredFields = form.querySelectorAll('[required]')

  requiredFields.forEach((field) => {
    if (
      (!field.value ||
        (field.type === 'radio' &&
          !form.querySelector(`input[name="${field.name}"]:checked`))) &&
      !field.closest('.question').classList.contains('unanswered')
    ) {
      field.closest('.question').classList.add('unanswered')
    }

    // Additional validation for date fields
    if (field.type === 'date') {
      if (!field.value) {
        field.closest('.question').classList.add('unanswered')
      }
    }

    // Additional validation for number fields
    if (field.type === 'number' && field.id.startsWith('q0_')) {
      const year = parseInt(field.value, 10)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        field.closest('.question').classList.add('unanswered')
      }
    }
  })
}

function calculateCategoryScores() {
  let categoryScores = {}
  surveyData.forEach((section, sectionIndex) => {
    if (
      section.title !== 'Persönliche Angaben' &&
      section.title !== 'Abschluss'
    ) {
      let totalScore = 0
      let questionCount = 0
      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`
        if (userData[questionId] && question.type === 'scale') {
          const parsedScore = parseInt(userData[questionId], 10)
          if (!isNaN(parsedScore)) {
            totalScore += parsedScore
            questionCount++
          }
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
  modalTitle.textContent = 'Datenschutz'
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

  // Create the body of the modal with the provided Datenschutzerklärung text
  const modalBody = document.createElement('div')
  Object.assign(modalBody.style, {
    flex: '1',
    padding: '20px',
    overflowY: 'auto',
  })

  const datenschutzContent = `
    <h3>Projektleitung:</h3>
    <p>Prof.in Dr. Charlott Rubach & Anne-Kathrin Hirsch</p>
    
    <h3>Sehr geehrte Lehramtsstudierende,</h3>
    <p>
      die Digitalisierung und Digitalität im Bildungsbereich erhielten in den letzten Jahren große Aufmerksamkeit. Der kompetente Umgang mit digitalen Medien gehört zum Aufgabenbereich von Lehrkräften. Daher ist es bedeutsam, dass Lehramtsstudierende während ihrer Ausbildung auf diesen Umgang vorbereitet werden. Wir interessieren uns im Rahmen dieser Studie „Open-Digi“ dafür, inwieweit die von uns erstellten Lernerfahrung zur Förderung digitaler Kompetenzen beitragen.
    </p>
    
    <h3>Wer sind wir?</h3>
    <p>
      Wir sind Prof. Dr. Charlott Rubach und Anne-Kathrin Hirsch, Bildungsforscherinnen an der Universität Rostock. Unsere Forschungsschwerpunkte sind Digitalisierung, Förderung digitaler Kompetenzen und Gestaltungsmöglichkeiten einer bedarfsorientierten Lehrkräftebildung.
    </p>
    
    <h3>Worum geht es in diesem Projekt?</h3>
    <p>
      Ziel des Projektes ist die Untersuchung von effektiven Lernerfahrungen für die Entwicklung digitaler Kompetenzen. Das Projekt besteht aus mehreren Schritten:
    </p>
    <ol>
      <li>Sie füllen die Befragung zum Open-Digi Projekt aus, welcher der Pre-Diagnostik gilt und zirka X Minuten dauert. Alle Befragungen thematisieren ausschließlich Aspekte von digitaler Kompetenz.</li>
      <li>Ihnen werden auf Grundlage der Diagnostik 2-3 Kurse vorgeschlagen, die Sie bearbeiten sollen.</li>
      <li>Sie bearbeiten die Kurse in einer Dauer von zirka einer Stunde.</li>
      <li>Sie durchlaufen die Post-Diagnostik direkt nach Bearbeitung der Kurse.</li>
      <li>Sie machen eine dritte Befragung, 1 Monat nach Bearbeitung der Kurse.</li>
    </ol>
    
    <h3>Was bedeutet die Teilnahme für mich und meinen Daten?</h3>
    <p>
      Ihre Teilnahme an unserer Studie ist freiwillig. Wenn Sie an der Studie teilnehmen, können Sie einzelne Fragen überspringen oder die gesamte Befragung jederzeit ganz abbrechen. In letzterem Falle, vernichten wir die Daten.
    </p>
    <p>
      Die Befragung ist anonym. Das heißt, es werden auch ausschließlich anonymisierte Informationen analysiert und im Rahmen wissenschaftlicher Arbeiten veröffentlicht. Es werden keine Informationen gespeichert, die es uns möglich machen, Sie als Person zu identifizieren. Eine Rücknahme Ihres Einverständnisses und damit Löschung Ihrer Daten, nachdem Sie den Fragebogen ausgefüllt und abgegeben haben, ist demnach nicht möglich. Anonymisierung ist das Verändern personenbezogener Daten in der Weise, dass Informationen nicht mehr oder nur mit einem unverhältnismäßig großen Aufwand an Zeit, Kosten und Arbeitskraft einer bestimmten Person zugeordnet werden können. Anonymisiert sind auch Daten, die keine persönliche Information mehr enthalten, bspw. Alter, Geschlecht, Lehramtstyp, Fächer und Hochschulsemester.
    </p>
    <p>
      Wir speichern Ihre Antworten und Ihre Angaben (z. B. Alter und Geschlecht). Diese werden bis zum Abschluss der Untersuchung und maximal 10 Jahre auf den Dienstrechnern der Wissenschaftlerinnen aus dem Projekt gespeichert und danach gelöscht.
    </p>
    <p>
      Es erfolgt keine Weitergabe Ihrer Daten an Dritte außerhalb des Forschungsprojektes.
    </p>
    <p>
      Unter folgendem Link finden Sie ausführliche Hinweise zum Schutz Ihrer Daten.
    </p>
    <p>
      Zur Erhebung und Verarbeitung der Daten benötigen wir Ihr Einverständnis:
    </p>
    <p>
      Ich versichere mit meiner Zustimmung, dass mir die Datenschutzhinweise zur Befragung „Open-Digi“ zur Kenntnis gegeben worden. Ich willige in die darin näher beschriebene Verarbeitung meiner personenbezogenen Daten ein.
    </p>
    <p>
      Datum, Ort					Unterschrift                               
                      ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
    </p>
    <p>
      Ansprechperson für weitere Fragen ist Prof.in Dr. Charlott Rubach (charlott.rubach@uni-rostock.de).
    </p>
  `

  modalBody.innerHTML = datenschutzContent

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

  const hasUpdatedScores = Object.keys(updatedScores).length > 0

  const resultHtml = `
    <h2>Ihr Kompetenzscore beträgt ${score}%</h2>
    <p>Dieser Score repräsentiert Ihren aktuellen Stand in digitalen Kompetenzen basierend auf Ihren Antworten.</p>
    <h3>Kursempfehlungen</h3>
    <p>Basierend auf Ihrem Score empfehlen wir folgende Kurse zur Verbesserung Ihrer digitalen Kompetenzen:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
    <h3>Kompetenzdiagramm</h3>
    <p>Das folgende Diagramm zeigt Ihre Scores in verschiedenen Kompetenzbereichen.${
      hasUpdatedScores
        ? ' Die helleren Balken repräsentieren Ihre Ergebnisse nach der ersten Befragung (T1), während die dunkleren Balken Ihre Ergebnisse nach der zweiten Befragung (T2) darstellen.'
        ? ' Die Balken repräsentieren Ihre Ergebnisse nach der ersten Befragung (Initialer Score).'
        : ''
    }</p>
    <div style="height: 300px; width: 100%;">
      <canvas id="competencyChart1"></canvas>
    </div>
    <div id="descriptionBox1"></div>
    <button id="downloadChart" class="btn btn-primary" style="background-color: #004A99; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Diagramm herunterladen</button>
    <hr>
    <!-- Removed "Zurück", "Weiter", and "Fortschritt" buttons -->
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

function calculateCompetenzScore() {
  // Calculate overall score as the average of all category scores
  const scores = Object.values(updatedScores)
  if (scores.length === 0) return 0
  const total = scores.reduce((acc, val) => acc + val, 0)
  return Math.round(total / scores.length)
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

  // Use full competency titles as labels
  const fullLabels =
    Object.keys(initialScores).length > 0
      ? Object.keys(initialScores)
      : Object.keys(updatedScores)
  const labels = fullLabels.map((key) => labelMap[key] || key)
  let currentHoveredIndex = -1

  const datasets = []

  // Initial Survey: Only Initial Scores
  if (
    Object.keys(initialScores).length > 0 &&
    Object.keys(updatedScores).length === 0
  ) {
    datasets.push({
      label: 'Initial Score',
      data: fullLabels.map((label) => initialScores[label] || 0),
      backgroundColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    })
  }

  // Updated Survey: Only Updated Scores
  if (
    Object.keys(updatedScores).length > 0 &&
    Object.keys(initialScores).length === 0
  ) {
    datasets.push({
      label: 'Aktualisierter Score',
      data: fullLabels.map((label) => updatedScores[label] || 0),
      backgroundColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    })
  }

  // Both Initial and Updated Scores
  if (
    Object.keys(initialScores).length > 0 &&
    Object.keys(updatedScores).length > 0
  ) {
    datasets.push({
      label: 'Initial Score',
      data: fullLabels.map((label) => initialScores[label] || 0),
      backgroundColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    })
    datasets.push({
      label: 'Aktualisierter Score',
      data: fullLabels.map((label) => updatedScores[label] || 0),
      backgroundColor: fullLabels.map((label) =>
        getLighterColor(colorMap[label] || '#999999')
      ),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    })
  }

  chart1Instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
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
          display: datasets.length > 1, // Show legend only if there are multiple datasets
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

// Define missing functions

function updateNavigationButtons() {
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')

  // Disable the Previous button on the first section
  if (currentSection === 0) {
    prevButton.disabled = true
  } else {
    prevButton.disabled = false
  }

  // Change the Next button to 'Finish' on the last section
  if (currentSection === surveyData.length - 1) {
    nextButton.textContent = 'Finish'
    nextButton.removeEventListener('click', nextSection)
    nextButton.addEventListener('click', finishSurvey)
  } else {
    nextButton.textContent = 'Weiter'
    nextButton.removeEventListener('click', finishSurvey)
    nextButton.addEventListener('click', nextSection)
  }
}

function nextSection() {
  if (currentSection < surveyData.length - 1) {
    if (validateSection()) {
      saveSectionData(false)
      currentSection++
      renderSection(currentSection)
      updateProgressBar()
      // Scroll to top to avoid automatic scrolling to the last question
      window.scrollTo(0, 0)
    } else {
      alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
      markUnansweredQuestions()
    }
  }
}

function previousSection() {
  if (currentSection > 0) {
    currentSection--
    renderSection(currentSection)
    updateProgressBar()
    // Scroll to top when navigating back
    window.scrollTo(0, 0)
  }
}

function logout() {
  sessionStorage.clear()
  window.location.href = 'login.html'
}

function saveAndResumeLater() {
  const resumeToken = btoa(
    JSON.stringify({
      userId: sessionStorage.getItem('userId'),
      section: currentSection,
    })
  )
  localStorage.setItem('surveyResumeToken', resumeToken)
  alert('Ihr Fortschritt wurde gespeichert. Sie können später fortfahren.')
}

// Function to validate if all required fields in the current section are filled
function validateSection() {
  const form = document.getElementById('surveyForm')
  if (!form) return false

  const requiredFields = form.querySelectorAll('[required]')
  let isValid = true

  requiredFields.forEach((field) => {
    if (
      (!field.value ||
        (field.type === 'radio' &&
          !form.querySelector(`input[name="${field.name}"]:checked`))) &&
      !field.closest('.question').classList.contains('unanswered')
    ) {
      field.closest('.question').classList.add('unanswered')
      isValid = false
    }

    // Additional validation for date fields
    if (field.type === 'number' && field.id.startsWith('q0_')) {
      const year = parseInt(field.value, 10)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        field.closest('.question').classList.add('unanswered')
        isValid = false
      }
    }
  })

  return isValid
}

function markUnansweredQuestions() {
  const form = document.getElementById('surveyForm')
  const requiredFields = form.querySelectorAll('[required]')

  requiredFields.forEach((field) => {
    if (
      (!field.value ||
        (field.type === 'radio' &&
          !form.querySelector(`input[name="${field.name}"]:checked`))) &&
      !field.closest('.question').classList.contains('unanswered')
    ) {
      field.closest('.question').classList.add('unanswered')
    }

    // Additional validation for date fields
    if (field.type === 'number' && field.id.startsWith('q0_')) {
      const year = parseInt(field.value, 10)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        field.closest('.question').classList.add('unanswered')
      }
    }
  })
}

function removeUnansweredMarkers() {
  const unansweredQuestions = document.querySelectorAll('.question.unanswered')
  unansweredQuestions.forEach((question) => {
    question.classList.remove('unanswered')
  })
}

// Function to handle form submission and display results
// Already handled in finishSurvey and showResults functions
