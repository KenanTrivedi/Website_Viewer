// survey.js

// Global Variables
let currentSection = -1
let userData = {}
let chart1Instance = null
let initialScores = {}
let updatedScores = {}
let userDataInitial = {}
let userDataUpdated = {}

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

// Ensure that surveyData is available globally
if (typeof surveyData === 'undefined') {
  console.error(
    'surveyData ist nicht definiert. Bitte stellen Sie sicher, dass es geladen ist, bevor dieses Skript verwendet wird.'
  )
}

// Event Listener Setup on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  loadUserData()
  initializeSurvey()
  updateProgressBar()
  setupEventListeners()
  checkResumeToken()
})

// Setup Event Listeners Function
function setupEventListeners() {
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')
  const logoutButton = document.getElementById('logoutButton')
  const saveProgressButton = document.getElementById('saveProgressButton')
  const surveyForm = document.getElementById('surveyForm')

  if (prevButton) {
    prevButton.addEventListener('click', previousSection)
  }

  if (nextButton) {
    nextButton.addEventListener('click', nextSection)
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', logout)
  }

  if (saveProgressButton) {
    saveProgressButton.addEventListener('click', saveAndResumeLater)
  }

  if (surveyForm) {
    // Auto-save on input change
    surveyForm.addEventListener('input', function () {
      saveSectionData(false)
    })
  }
}

function checkResumeToken() {
  const resumeToken = localStorage.getItem('surveyResumeToken')
  if (resumeToken) {
    try {
      const decoded = JSON.parse(atob(resumeToken))
      const { userId, section } = decoded
      if (userId === sessionStorage.getItem('userId')) {
        currentSection = parseInt(section, 10)
        renderSection(currentSection)
        updateProgressBar()
        localStorage.removeItem('surveyResumeToken')
      }
    } catch (error) {
      console.error('Fehler beim Dekodieren des Resume-Tokens:', error)
      // Invalid token, remove it
      localStorage.removeItem('surveyResumeToken')
    }
  }
}

// Ensure populatePersonalInfo only targets the "Persönliche Angaben" section

/**
 * Prefills only the "Persönliche Angaben" section
 * @param {HTMLElement} form
 * @param {Object} data
 */
function populatePersonalInfo(form, data) {
  surveyData.forEach((section, sectionIndex) => {
    if (section.title === 'Persönliche Angaben') {
      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`
        const value = data[questionId]
        if (value !== undefined) {
          const field = form.querySelector(`[name="${questionId}"]`)
          if (field) {
            if (field.type === 'radio') {
              const radioButton = form.querySelector(
                `[name="${questionId}"][value="${value}"]`
              )
              if (radioButton) radioButton.checked = true
            } else if (field.type === 'date') {
              field.value = value // Already set to today's date and read-only
            } else {
              field.value = value
            }
          }
        }
      })
    }
  })
}

// Reset User Data Function
function resetUserData() {
  userData = {}
  currentSection = -1
  initialScores = {}
  updatedScores = {}
}

function saveSectionData(isComplete = false) {
  removeUnansweredMarkers()

  const formData = new FormData(document.getElementById('surveyForm'))
  for (let [key, value] of formData.entries()) {
    userData[key] = value
  }

  const userId = sessionStorage.getItem('userId')
  if (!userId) {
    console.error('No userId found in sessionStorage')
    alert('Bitte melden Sie sich erneut an.')
    window.location.href = 'login.html'
    return
  }

  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1
  const categoryScores = calculateCategoryScores(userData)

  const dataToSend = {
    userId: userId,
    data: userData,
    isComplete: isComplete,
    categoryScores: categoryScores,
    currentSection: currentSection,
    isPersonalInfo: currentSection === 0,
  }

  // Handle personal info section specially
  if (currentSection === 0) {
    dataToSend.personalInfo = {
      q0_0: userData.q0_0,  // Gender
      q0_1: userData.q0_1,  // Birth year
      q0_2: userData.q0_2,  // Teaching student
      q0_3: userData.q0_3,  // Teaching type
      q0_4: userData.q0_4,  // Teaching subjects
      q0_5: userData.q0_5,  // Non-teaching program
      q0_6: userData.q0_6,  // Semester
    }
  }

  // Store responses based on attempt number
  if (attemptNumber === 1) {
    dataToSend.initialResponses = userData
  } else if (attemptNumber === 2) {
    dataToSend.updatedResponses = userData
  } else if (attemptNumber === 3) {
    dataToSend.updatedResponses2 = userData
  }

  // Handle datenschutz and signature
  const datenschutzConsentElement = document.getElementById('datenschutzConsent')
  const unterschriftElement = document.getElementById('unterschrift')

  if (datenschutzConsentElement) {
    dataToSend.datenschutzConsent = datenschutzConsentElement.checked
  }

  if (unterschriftElement) {
    dataToSend.unterschrift = unterschriftElement.value
  }

  // Save data
  fetch('/api/save-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log('Data saved successfully:', result)
      if (result.userData) {
        sessionStorage.setItem('surveyData', JSON.stringify(result.userData.data || {}))
        sessionStorage.setItem('currentSection', String(result.userData.currentSection ?? -1))
        sessionStorage.setItem('datenschutzConsent', String(result.userData.datenschutzConsent || false))
      }
    })
    .catch((error) => {
      console.error('Error saving data:', error)
      alert('Fehler beim Speichern der Daten. Bitte versuchen Sie es später erneut.')
    })
}

function nextSection() {
  if (validateSection()) {
    if (currentSection < surveyData.length - 1) {
      currentSection++
      saveSectionData(false) // Save data and currentSection
      renderSection(currentSection)
      updateProgressBar()
      window.scrollTo(0, 0)
    } else {
      finishSurvey()
    }
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
    markUnansweredQuestions()
  }
}

function previousSection() {
  if (currentSection > 0) {
    currentSection--
    saveSectionData(false) // Save data and currentSection
    renderSection(currentSection)
    updateProgressBar()
    window.scrollTo(0, 0)
  }
}

async function loadUserData(isNewAttempt = false) {
  const userId = sessionStorage.getItem('userId')
  if (userId) {
    try {
      const response = await fetch(`/api/user-data/${userId}`)
      if (response.status === 404) {
        console.log('User data not found, initializing new user data.')
        userData = {}
        currentSection = -1
        initialScores = {}
        updatedScores = {}
      } else if (!response.ok) {
        throw new Error('Error fetching user data')
      } else {
        const data = await response.json()
        console.log('Raw loaded user data:', data)

        // Store attemptNumber in sessionStorage
        const attemptNumber = data.attemptNumber || 1
        sessionStorage.setItem('attemptNumber', attemptNumber.toString())

        if (data.data) {
          if (isNewAttempt || attemptNumber > 1) {
            // For new attempts or T2, use initial responses for teaching subjects and semester
            userData = {
              q0_0: data.data.q0_0,  // Gender
              q0_1: data.data.q0_1,  // Birth year
              q0_2: data.data.q0_2,  // Teaching student
              q0_3: data.data.q0_3,  // Teaching type
              q0_4: data.initialResponses?.q0_4,  // Teaching subjects - use initial response
              q0_5: data.data.q0_5,  // Non-teaching program
              q0_6: data.initialResponses?.q0_6,  // Semester - use initial response
              initialResponses: data.initialResponses || {}  // Store initial responses for reference
            }
            console.log('T2/New attempt - Using initial responses:', {
              subjects: userData.q0_4,
              semester: userData.q0_6
            })
            currentSection = -1
            updatedScores = {}
          } else {
            userData = {
              ...data.data,
              initialResponses: data.initialResponses || {}
            }
            currentSection = data.currentSection !== undefined ? data.currentSection : -1
            updatedScores = data.updatedScores || {}
          }
          initialScores = data.initialScores || {}
          console.log('Processed user data:', userData)
        } else {
          userData = {}
          currentSection = -1
        }
      }
      renderSection(currentSection)
      updateProgressBar()
      // Clear 'startNewAttempt' after handling
      sessionStorage.removeItem('startNewAttempt')
    } catch (error) {
      console.error('Error loading user data:', error)
      resetUserData()
      renderSection(currentSection)
      updateProgressBar()
    }
  } else {
    resetUserData()
    renderSection(currentSection)
    updateProgressBar()
  }
}

function validateYear(input) {
  // Remove any non-digit characters
  input.value = input.value.replace(/\D/g, '')
  
  // Enforce maximum length of 4 digits
  if (input.value.length > 4) {
    input.value = input.value.slice(0, 4)
  }
  
  // Add visual feedback
  const currentYear = new Date().getFullYear()
  if (input.value.length === 4) {
    const year = parseInt(input.value)
    if (year < 1900 || year > currentYear) {
      input.setCustomValidity(`Bitte geben Sie ein Jahr zwischen 1900 und ${currentYear} ein.`)
      input.style.borderColor = 'red'
    } else {
      input.setCustomValidity('')
      input.style.borderColor = ''
    }
  } else {
    input.setCustomValidity('Bitte geben Sie ein vollständiges Jahr ein (JJJJ).')
    input.style.borderColor = 'red'
  }
  input.reportValidity()
}

function renderSection(index) {
  if (index === -1) {
    renderDatenschutzSection()
    return
  }

  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1
  const section = surveyData[index]

  if (!section) {
    console.error('Invalid section index:', index)
    return
  }

  // Always show Datenschutz section first on every attempt
  if (index === 0 && !sessionStorage.getItem('datenschutzConsent')) {
    renderDatenschutzSection()
    return
  }

  const mainContent = document.getElementById('mainContent')
  mainContent.innerHTML = ''

  // Create section container
  const sectionContainer = document.createElement('div')
  sectionContainer.className = 'section-container'

  // Add section title
  const title = document.createElement('h2')
  title.textContent = section.title
  sectionContainer.appendChild(title)

  // Create form
  const form = document.createElement('form')
  form.id = 'surveyForm'
  form.className = 'survey-form'

  // Skip T2 open-ended questions for T3
  if (attemptNumber === 3 && section.questions.some(q => q.type === 't2_open_ended')) {
    nextSection()
    return
  }

  // Add questions
  section.questions.forEach((question, questionIndex) => {
    const questionContainer = document.createElement('div')
    questionContainer.className = 'question-container'

    const questionText = document.createElement('p')
    questionText.className = 'question-text'
    questionText.textContent = question.text
    questionContainer.appendChild(questionText)

    if (question.type === 'scale') {
      // Render scale question
      const scaleContainer = document.createElement('div')
      scaleContainer.className = 'scale-container'

      for (let i = 1; i <= 6; i++) {
        const label = document.createElement('label')
        label.className = 'scale-label'

        const input = document.createElement('input')
        input.type = 'radio'
        input.name = `q${index}_${questionIndex}`
        input.value = i
        input.className = 'scale-input'
        input.required = true

        const span = document.createElement('span')
        span.textContent = i
        span.className = 'scale-number'

        label.appendChild(input)
        label.appendChild(span)
        scaleContainer.appendChild(label)
      }

      questionContainer.appendChild(scaleContainer)
    } else if (question.type === 'radio') {
      // Render radio options
      const optionsContainer = document.createElement('div')
      optionsContainer.className = 'radio-container'

      question.options.forEach((option, optionIndex) => {
        const label = document.createElement('label')
        label.className = 'radio-label'

        const input = document.createElement('input')
        input.type = 'radio'
        input.name = `q${index}_${questionIndex}`
        input.value = option
        input.className = 'radio-input'
        input.required = true
        if (question.id === 'q0_2') {
          input.onchange = () => handleTeachingStudentChange(input)
        }

        const span = document.createElement('span')
        span.textContent = option
        span.className = 'radio-text'

        label.appendChild(input)
        label.appendChild(span)
        optionsContainer.appendChild(label)
      })

      questionContainer.appendChild(optionsContainer)
    } else if (question.type === 'dropdown') {
      // Render dropdown
      const select = document.createElement('select')
      select.name = `q${index}_${questionIndex}`
      select.className = 'form-control'
      select.required = true

      // Add default empty option
      const defaultOption = document.createElement('option')
      defaultOption.value = ''
      defaultOption.textContent = 'Bitte auswählen'
      select.appendChild(defaultOption)

      question.options.forEach(option => {
        const optionElement = document.createElement('option')
        optionElement.value = option
        optionElement.textContent = option
        select.appendChild(optionElement)
      })

      // Handle dependencies
      if (question.dependsOn) {
        const dependentQuestion = document.querySelector(`input[name="q${index}_${question.dependsOn.questionId}"][value="${question.dependsOn.value}"]`)
        if (!dependentQuestion?.checked) {
          questionContainer.style.display = 'none'
        }
      }

      questionContainer.appendChild(select)
    } else if (question.type === 'number') {
      // Render number input
      const input = document.createElement('input')
      input.type = 'number'
      input.name = `q${index}_${questionIndex}`
      input.className = 'form-control'
      input.required = true
      if (question.min !== undefined) input.min = question.min
      if (question.max !== undefined) input.max = question.max

      // For birth year validation
      if (index === 0 && questionIndex === 1) {
        input.onchange = () => validateYear(input)
      }

      questionContainer.appendChild(input)
    } else if (question.type === 'text' || question.type === 'date') {
      const input = document.createElement('input')
      input.type = question.type
      input.name = `q${index}_${questionIndex}`
      input.className = 'form-control'
      input.required = true

      // Handle dependencies
      if (question.dependsOn) {
        const dependentQuestion = document.querySelector(`input[name="q${index}_${question.dependsOn.questionId}"][value="${question.dependsOn.value}"]`)
        if (!dependentQuestion?.checked) {
          questionContainer.style.display = 'none'
        }
      }

      questionContainer.appendChild(input)
    }

    form.appendChild(questionContainer)
  })

  sectionContainer.appendChild(form)
  mainContent.appendChild(sectionContainer)

  // Show navigation buttons
  const buttonContainer = document.createElement('div')
  buttonContainer.className = 'button-container'

  if (index > 0) {
    const prevButton = document.createElement('button')
    prevButton.textContent = 'Zurück'
    prevButton.className = 'btn btn-secondary'
    prevButton.onclick = previousSection
    buttonContainer.appendChild(prevButton)
  }

  const nextButton = document.createElement('button')
  nextButton.textContent = index === surveyData.length - 1 ? 'Abschließen' : 'Weiter'
  nextButton.className = 'btn btn-primary'
  nextButton.onclick = index === surveyData.length - 1 ? finishSurvey : nextSection
  buttonContainer.appendChild(nextButton)

  mainContent.appendChild(buttonContainer)

  // Populate form fields if data exists
  const savedData = JSON.parse(sessionStorage.getItem('surveyData') || '{}')
  if (Object.keys(savedData).length > 0) {
    populateFormFields(form, savedData, index)
  }

  updateProgressBar()
  window.scrollTo(0, 0)
}

// Submit Final Data Function
function submitFinalData(event) {
  event.preventDefault()
  if (validateDatenschutz()) {
    saveSectionData(true)
    showResults()
  } else {
    alert('Bitte beantworten Sie alle Pflichtfelder.')
  }
}

window.submitFinalData = submitFinalData

// Function to render the Datenschutz section
function renderDatenschutzSection() {
  const datenschutzHtml = `
    <div class="datenschutz-section">
      <h2>Datenschutzerklärung</h2>
      <p>
        Danke, dass Sie den Fragebogen ausgefüllt haben. Bevor wir Ihnen eine persönliche Rückmeldung geben, müssen wir sicher stellen, dass wir Ihre Daten speichern dürfen. Dafür lesen Sie sich bitte die Datenschutzerklärung durch und stimmen Sie dieser durch Ihre digitale Unterschrift zu.
      </p>
      <div class="datenschutz-content">
         <h3>Projektleitung:</h3>
        <p>Prof.in Dr. Charlott Rubach & Anne-Kathrin Hirsch</p>
        <p>Sehr geehrte Lehramtsstudierende,</p>
        <p>
          die Digitalisierung und Digitalität im Bildungsbereich erhielten in den letzten Jahren große Aufmerksamkeit. Der kompetente Umgang mit digitalen Medien gehört zum Aufgabenbereich von Lehrkräften. Daher ist es bedeutsam, dass Lehramtsstudierende während ihrer Ausbildung auf diesen Umgang vorbereitet werden. Wir interessieren uns im Rahmen dieser Studie „Open-Digi“ dafür, inwieweit die von uns erstellten Lernerfahrungen zur Förderung digitaler Kompetenzen beitragen.
        </p>
        <h3>Wer sind wir?</h3>
        <p>
          Wir sind Prof. Dr. Charlott Rubach und Anne-Kathrin Hirsch, Bildungsforscherinnen an der Universität Rostock. Unsere Forschungsschwerpunkte sind Digitalisierung, Förderung digitaler Kompetenzen und Gestaltungsmöglichkeiten einer bedarfsorientierten Lehrkräftebildung.
        </p>
        <h3>Worum geht es in diesem Projekt?</h3>
        <p>
          Ziel des Projektes ist die Untersuchung von effektiven Lernerfahrungen für die Entwicklung digitaler Kompetenzen. Das Projekt besteht aus mehreren Schritten:
        </p>
        <ul>
          <li>Sie füllen die Befragung zum Open-Digi Projekt aus, welcher der Pre-Diagnostik gilt und zirka 10 Minuten dauert. Alle Befragungen thematisieren ausschließlich Aspekte von digitaler Kompetenz.</li>
          <li>Ihnen werden auf Grundlage der Diagnostik mehrere Vorschläge gemacht, wie sie eigene Kompetenzen weiterentwickeln können.</li>
          <li>Sie bearbeiten verschiedene Kurse.</li>
          <li>Sie durchlaufen die Post-Diagnostik direkt nach Bearbeitung der Kurse.</li>
          <li>Sie machen eine dritte Befragung, 1 Monat nach Bearbeitung der Kurse.</li>
        </ul>
        <h3>Was bedeutet die Teilnahme für mich und meine Daten?</h3>
        <p>
          Ihre Teilnahme an unserer Studie ist freiwillig. Wenn Sie an der Studie teilnehmen, können Sie die Befragung jederzeit abbrechen. In diesem Falle werden die Daten nicht gespeichert.
        </p>
        <p>
          Die Befragung ist anonym. Das heißt, es werden auch ausschließlich anonymisierte Informationen analysiert und im Rahmen wissenschaftlicher Arbeiten veröffentlicht. Es werden keine Informationen gespeichert, die es uns möglich machen, Sie als Person zu identifizieren. Eine Rücknahme Ihres Einverständnisses und damit Löschung Ihrer Daten, nachdem Sie den Fragebogen ausgefüllt und abgegeben haben, ist demnach nicht möglich. Anonymisiert sind auch Daten, die keine persönliche Information mehr enthalten, bspw. Alter, Geschlecht, Lehramtstyp, Fächer und Hochschulsemester.
        </p>
        <p>
          Wir speichern Ihre Antworten und Ihre Angaben (z. B. Alter und Geschlecht). Diese werden bis zum Abschluss der Untersuchung und maximal 10 Jahre auf den Dienstrechnern der Wissenschaftlerinnen aus dem Projekt gespeichert und danach gelöscht.
        </p>
        <p>
          Es erfolgt keine Weitergabe Ihrer Daten an Dritte außerhalb des Forschungsprojektes.
        </p>
        <p>
          Unter folgendem <a href="datenschutz.html" target="_blank">Link</a> finden Sie ausführliche Hinweise zum Schutz Ihrer Daten.
        </p>
      </div>
      <div class="final-inputs">
        <div class="question">
          <label for="datum">Datum</label>
          <input type="date" id="datum" name="datum" value="${
            new Date().toISOString().split('T')[0]
          }" readonly required aria-required="true">
        </div>
        <div class="question">
          <label for="unterschrift">Unterschrift (Bitte tippen Sie Ihren Namen als Unterschrift)</label>
          <input type="text" id="unterschrift" name="unterschrift" required aria-required="true">
        </div>
        <div class="agreement-questions">
          <div class="agreement">
            <label>
              <input type="checkbox" id="datenschutzKenntnis" name="datenschutzKenntnis" required>
              Mir sind die Datenschutzhinweise zur Befragung zur Kenntnis gegeben worden.
            </label>
          </div>
          <div class="agreement">
            <label>
              <input type="checkbox" id="datenschutzVerarbeitung" name="datenschutzVerarbeitung" required>
              Ich erkläre mich damit einverstanden, dass meine Daten gemäß der Informationen zum Datenschutz verarbeitet und gespeichert werden.
            </label>
          </div>
          <div class="agreement">
            <label>
              <input type="checkbox" id="teilnahmeEinverstaendnis" name="teilnahmeEinverstaendnis" required>
              Hiermit erkläre mich einverstanden, unter den genannten Bedingungen an der Befragung teilzunehmen.
            </label>
          </div>
        </div>
        <div class="navigation-buttons">
          <button type="button" id="prevButton" class="btn btn-secondary">
            <i class="fas fa-chevron-left"></i> Zurück
          </button>
          <button type="button" id="saveProgressButton" class="btn btn-primary">
            <i class="fas fa-save"></i> Fortschritt speichern
          </button>
          <button type="button" id="submitFinal" class="btn btn-primary">
            Weiter <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `

  const surveyForm = document.getElementById('surveyForm')
  if (surveyForm) {
    surveyForm.innerHTML = datenschutzHtml

    // Add event listener to the final submit button
    const submitButton = document.getElementById('submitFinal')
    if (submitButton) {
      submitButton.addEventListener('click', submitFinalData)
    }

    // Remove any existing navigation buttons
    const existingNav = document.querySelector('.navigation-buttons')
    if (existingNav) {
      existingNav.remove()
    }

    // Update the navigation buttons to match the survey style
    updateNavigationButtons()
  }
}

// Handle Scale Keydown Function
function handleScaleKeydown(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    const radio = event.target.previousElementSibling
    if (radio) {
      radio.checked = true
      radio.dispatchEvent(new Event('change'))
    }
    event.target.setAttribute('aria-checked', 'true')
  }
}

// Update Progress Bar Function
function updateProgressBar() {
  const totalSteps = surveyData.length + 1 // Includes Datenschutz section
  const currentStep = currentSection < 0 ? 1 : currentSection + 2 // Adjust for Datenschutz
  const progress = (currentStep / totalSteps) * 100
  const progressFill = document.getElementById('progressFill')
  const progressText = document.getElementById('progressText')

  if (progressFill) {
    progressFill.style.width = `${progress}%`
    progressFill.setAttribute('aria-valuenow', currentStep)
    progressFill.setAttribute('aria-valuemax', totalSteps)
  }

  if (progressText) {
    progressText.textContent = `Schritt ${currentStep} von ${totalSteps}`
  }
}

// Finish Survey Function
function finishSurvey() {
  if (validateSection()) {
    const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

    if (attemptNumber === 3) {
      // Show T3 open-ended question
      const mainContent = document.getElementById('mainContent')
      mainContent.innerHTML = `
        <div class="open-ended-section">
          <h2>Abschließende Frage</h2>
          <div class="form-group">
            <label for="t3OpenEndedResponse">Wie schätzen Sie Ihren Fortschritt seit T2 ein?</label>
            <textarea 
              id="t3OpenEndedResponse" 
              class="form-control" 
              rows="5" 
              placeholder="Bitte beschreiben Sie hier Ihren Fortschritt..."
            ></textarea>
          </div>
          <button onclick="submitT3OpenEndedResponse(event)" class="btn btn-primary mt-3">
            Abschließen
          </button>
        </div>
      `
    } else {
      saveSectionData(true)
      showResults()
    }
  } else {
    markUnansweredQuestions()
  }
}

// Function to handle T3 open-ended response submission
function submitT3OpenEndedResponse(event) {
  event.preventDefault()
  
  const response = document.getElementById('t3OpenEndedResponse').value.trim()
  if (!response) {
    alert('Bitte beantworten Sie die Frage, bevor Sie fortfahren.')
    return
  }

  const userId = sessionStorage.getItem('userId')
  const dataToSend = {
    userId,
    openEndedResponses: {
      t3_progress: response
    }
  }

  fetch('/api/save-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataToSend)
  })
    .then(response => response.json())
    .then(() => {
      saveSectionData(true)
      showResults()
    })
    .catch(error => {
      console.error('Error saving T3 response:', error)
      alert('Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.')
    })
}

// Add to window object for global access
window.submitT3OpenEndedResponse = submitT3OpenEndedResponse

// Mark Unanswered Questions Function
function markUnansweredQuestions() {
  const form = document.getElementById('surveyForm')
  if (!form) return null

  const requiredFields = form.querySelectorAll('[required]')
  let firstUnanswered = null

  requiredFields.forEach((field) => {
    const questionDiv = field.closest('.question') || field.parentElement
    if (!questionDiv) return

    const isUnanswered =
      (field.type === 'radio' &&
        !form.querySelector(`input[name="${field.name}"]:checked`)) ||
      (field.type === 'checkbox' && !field.checked) ||
      (field.type !== 'radio' && field.type !== 'checkbox' && !field.value.trim())

    if (isUnanswered) {
      questionDiv.classList.add('unanswered')
      questionDiv.style.animation =
        'shake 0.82s cubic-bezier(.36,.07,.19,.97) both'
      if (!firstUnanswered) {
        firstUnanswered = questionDiv
      }
    } else {
      questionDiv.classList.remove('unanswered')
      questionDiv.style.animation = ''
    }
  })

  if (firstUnanswered) {
    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return firstUnanswered
}

// Calculate Category Scores Function
function calculateCategoryScores(data) {
  const categoryScores = {}
  const maxScorePerQuestion = 6 // Assuming a scale of 0-6

  surveyData.forEach((section, sectionIndex) => {
    if (
      section.title !== 'Persönliche Angaben' &&
      section.title !== 'Abschluss'
    ) {
      let totalScore = 0
      let questionCount = 0

      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`
        if (data[questionId] && question.type === 'scale') {
          const score = parseInt(data[questionId], 10)
          if (!isNaN(score)) {
            totalScore += score
            questionCount++
          }
        }
      })

      if (questionCount > 0) {
        categoryScores[section.title] = Math.round(
          (totalScore / (questionCount * maxScorePerQuestion)) * 100
        )
      } else {
        categoryScores[section.title] = 0
      }
    }
  })

  return categoryScores
}

// Create Competency Chart Function
function createCompetencyChart1(initialScores, updatedScores, updatedScores2) {
  if (chart1Instance) {
    chart1Instance.destroy()
  }

  const ctx = document.getElementById('competencyChart1').getContext('2d')
  const labels = Object.keys(initialScores).map(key => labelMap[key] || key)
  const datasets = []

  // T1 dataset (always present)
  datasets.push({
    label: 'T1',
    data: Object.values(initialScores),
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgba(54, 162, 235, 1)',
    borderWidth: 2,
    borderRadius: 5,
  })

  // T2 dataset (if present)
  if (Object.keys(updatedScores).length > 0) {
    datasets.push({
      label: 'T2',
      data: Object.values(updatedScores),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      borderRadius: 5,
    })
  }

  // T3 dataset (if present)
  if (Object.keys(updatedScores2 || {}).length > 0) {
    datasets.push({
      label: 'T3',
      data: Object.values(updatedScores2),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2,
      borderRadius: 5,
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 6,
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ihre Kompetenzen im Überblick',
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const fullCompetency = Object.keys(initialScores)[context[0].dataIndex]
            return fullCompetency
          },
          label: function (context) {
            return `Score: ${context.raw}`
          },
          afterLabel: function (context) {
            const fullCompetency = Object.keys(initialScores)[context.dataIndex]
            return competencyDescriptions[fullCompetency]
          },
        },
      },
    },
  }

  chart1Instance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: options,
  })

  // Add click event listener for description box
  ctx.canvas.onclick = function (evt) {
    const points = chart1Instance.getElementsAtEventForMode(
      evt,
      'nearest',
      { intersect: true },
      true
    )
    if (points.length) {
      const firstPoint = points[0]
      const label = chart1Instance.data.labels[firstPoint.index]
      const fullCompetency = Object.keys(initialScores)[firstPoint.index]
      const description = competencyDescriptions[fullCompetency]
      const descriptionBox = document.getElementById('competencyDescription')
      if (descriptionBox) {
        updateDescriptionBox(descriptionBox, fullCompetency, description)
      }
    }
  }

  return chart1Instance
}

/**
 * Prefills the form fields based on user data for the given section.
 * @param {HTMLElement} form - The survey form element.
 * @param {Object} data - The user data containing responses.
 * @param {number} sectionIndex - The current section index.
 */
function populateFormFields(form, data, sectionIndex) {
  const section = surveyData[sectionIndex]
  if (!section) return

  // Get attempt number from session storage
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber') || '1')
  const isT2 = attemptNumber > 1

  console.log('Populating form fields. Attempt number:', attemptNumber)
  console.log('Current data:', data)

  section.questions.forEach((question, questionIndex) => {
    const questionId = `q${sectionIndex}_${questionIndex}`
    
    // Get the value - for T2, teaching subjects and semester are already set in userData
    const value = data[questionId]
    console.log(`Field ${questionId}:`, value)

    if (value !== undefined) {
      const field = form.querySelector(`[name="${questionId}"]`)
      if (field) {
        if (field.type === 'radio') {
          const radioButton = form.querySelector(
            `[name="${questionId}"][value="${value}"]`
          )
          if (radioButton) radioButton.checked = true
        } else if (field.type === 'date') {
          field.value = value
        } else {
          field.value = value
          
          // For T2, make teaching subjects and semester read-only
          if (isT2 && (questionId === 'q0_4' || questionId === 'q0_6')) {
            field.readOnly = true
            field.style.backgroundColor = '#f0f0f0'
            console.log(`Setting ${questionId} as read-only with value: ${value}`)
          }
        }
      }
    }
  })
}

// Modify the showResults function in survey.js

async function showResults() {
  const userId = sessionStorage.getItem('userId')
  if (!userId) {
    console.error('No userId found in sessionStorage')
    return
  }

  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

  fetch(`/api/results/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.userData) {
        throw new Error('No user data found')
      }

      const { initialScores, updatedScores, updatedScores2 } = data.userData
      
      // Clear the main content
      const mainContent = document.getElementById('mainContent')
      mainContent.innerHTML = `
        <div class="results-container">
          <h2>Ihre Ergebnisse</h2>
          
          <div class="chart-container" style="position: relative; height:60vh; width:80vw; margin: auto;">
            <canvas id="competencyChart1"></canvas>
          </div>
          
          <div id="competencyDescription" class="mt-4 p-3 border rounded">
            <p>Klicken Sie auf einen Bereich im Diagramm für mehr Details.</p>
          </div>

          ${attemptNumber === 3 ? `
            <div class="alert alert-info mt-4">
              <p>Nicht zufrieden mit Ihren T3-Ergebnissen? Besuchen Sie die ILIAS-Kurse unten, um Ihr Niveau zu verbessern.</p>
            </div>

            <div class="mt-4">
              <h3>Abschließende Reflexion</h3>
              <div class="form-group">
                <label for="t3ReflectionResponse">Wie bewerten Sie Ihre Entwicklung von T2 zu T3?</label>
                <textarea 
                  id="t3ReflectionResponse" 
                  class="form-control" 
                  rows="4" 
                  placeholder="Beschreiben Sie hier Ihre Entwicklung..."
                ></textarea>
                <button onclick="submitT3ReflectionResponse(event)" class="btn btn-primary mt-2">
                  Reflexion speichern
                </button>
              </div>
            </div>
          ` : ''}

          <div class="mt-4">
            <h3>Ihre ILIAS-Kurse</h3>
            <div id="courseLinks"></div>
          </div>

          <div class="mt-4">
            <button onclick="downloadChart(event)" class="btn btn-secondary">
              Chart herunterladen
            </button>
          </div>
        </div>
      `

      // Create the competency chart
      createCompetencyChart1(initialScores, updatedScores, updatedScores2)

      // Show course links
      showCourseLinks()

      // Hide navigation buttons
      hideNavigationButtons()
    })
    .catch((error) => {
      console.error('Error fetching results:', error)
      alert('Fehler beim Laden der Ergebnisse')
    })
}

// Function to handle T3 reflection response submission
function submitT3ReflectionResponse(event) {
  event.preventDefault()
  
  const response = document.getElementById('t3ReflectionResponse').value.trim()
  if (!response) {
    alert('Bitte geben Sie Ihre Reflexion ein, bevor Sie fortfahren.')
    return
  }

  const userId = sessionStorage.getItem('userId')
  const dataToSend = {
    userId,
    openEndedResponses: {
      t3_reflection: response
    }
  }

  fetch('/api/save-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataToSend)
  })
    .then(response => response.json())
    .then(() => {
      alert('Ihre Reflexion wurde erfolgreich gespeichert.')
    })
    .catch(error => {
      console.error('Error saving T3 reflection:', error)
      alert('Fehler beim Speichern Ihrer Reflexion. Bitte versuchen Sie es erneut.')
    })
}

// Add to window object for global access
window.submitT3ReflectionResponse = submitT3ReflectionResponse

// Function to display course links
function showCourseLinks() {
  const courseLinksHtml = `
    <p>Nun ist es Zeit, Ihre digitalen Kompetenzen zu fördern. Hier kommen Sie zu den Kursen der jeweiligen Kompetenzbereiche. Klicken Sie einfach auf den Link und Sie werden zu ILIAS weitergeleitet.</p>
    <ul>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_121177&client_id=ilias_hro" target="_blank">Suchen, Verarbeiten und Aufbewahren</a></li>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122050&client_id=ilias_hro" target="_blank">Analysieren und Reflektieren</a></li>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_120680&client_id=ilias_hro" target="_blank">Kommunikation & Kollaboration</a></li>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122048&client_id=ilias_hro" target="_blank">Problemlösen und Handeln</a></li>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122047&client_id=ilias_hro" target="_blank">Produzieren</a></li>
      <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122049&client_id=ilias_hro" target="_blank">Schützen und sicher Agieren</a></li>
    </ul>
  `

  document
    .getElementById('courseLinks')
    .insertAdjacentHTML('beforeend', courseLinksHtml)
}

// Update Navigation Buttons Function
function updateNavigationButtons() {
  const container = document.querySelector('.container')
  if (!container) return

  // Remove any existing navigation buttons
  const existingNav = container.querySelector('.navigation-buttons')
  if (existingNav) {
    existingNav.remove()
  }

  // Create new navigation buttons
  const navigationButtons = document.createElement('div')
  navigationButtons.className = 'navigation-buttons'
  navigationButtons.innerHTML = `
    <button type="button" id="prevButton" class="btn btn-secondary">
      <i class="fas fa-chevron-left"></i> Zurück
    </button>
    <button type="button" id="saveProgressButton" class="btn btn-primary">
      <i class="fas fa-save"></i> Fortschritt speichern
    </button>
    <button type="button" id="nextButton" class="btn btn-primary">
      Weiter <i class="fas fa-chevron-right"></i>
    </button>
  `
  container.appendChild(navigationButtons)

  // Add event listeners
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')
  const saveButton = document.getElementById('saveProgressButton')

  if (prevButton) prevButton.addEventListener('click', previousSection)
  if (nextButton) nextButton.addEventListener('click', nextSection)
  if (saveButton) saveButton.addEventListener('click', saveAndResumeLater)
}

async function startNewSurvey() {
  const userId = sessionStorage.getItem('userId')
  if (!userId) {
    alert('Benutzer-ID nicht gefunden. Bitte melden Sie sich erneut an.')
    return
  }

  try {
    const response = await fetch('/api/reset-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error('Fehler beim Zurücksetzen der Umfrage.')
    }

    // Set 'startNewAttempt' to 'true' in sessionStorage
    sessionStorage.setItem('startNewAttempt', 'true')

    // Load user data as a new attempt
    await loadUserData(true)

    alert(
      'Ihre Umfrage wurde erfolgreich zurückgesetzt. Sie können jetzt eine neue Umfrage starten.'
    )
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Umfrage:', error)
    alert(
      'Fehler beim Zurücksetzen der Umfrage. Bitte versuchen Sie es erneut.'
    )
  }
}

async function resetSurveyData() {
  const userId = sessionStorage.getItem('userId')
  if (!userId) {
    alert('Benutzer-ID nicht gefunden. Bitte melden Sie sich erneut an.')
    return
  }

  try {
    const response = await fetch('/api/reset-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error('Fehler beim Zurücksetzen der Umfrage.')
    }

    alert(
      'Ihre Umfrage wurde erfolgreich zurückgesetzt. Sie können jetzt eine neue Umfrage starten.'
    )

    // Reload the survey to reflect the reset
    resetUserData()
    currentSection = -1
    renderSection(currentSection)
    updateProgressBar()
    updateNavigationButtons()
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Umfrage:', error)
    alert(
      'Fehler beim Zurücksetzen der Umfrage. Bitte versuchen Sie es erneut.'
    )
  }
}

// Logout Function
function logout() {
  sessionStorage.clear()
  window.location.href = 'login.html'
}

// Save and Resume Later Function
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

// Validate Section Function
function validateSection() {
  const form = document.getElementById('surveyForm')
  if (!form) return false

  // Special validation for birth year in the personal information section
  if (currentSection === 0) {
    const birthYearInput = form.querySelector('input[name="q0_1"]')
    if (birthYearInput) {
      const birthYear = birthYearInput.value.trim()
      const currentYear = new Date().getFullYear()
      
      // Check if it's exactly 4 digits and within valid range
      if (!/^\d{4}$/.test(birthYear) || 
          parseInt(birthYear) < 1900 || 
          parseInt(birthYear) > currentYear) {
        alert('Bitte geben Sie ein gültiges Geburtsjahr im Format JJJJ ein (z.B. 1990).')
        birthYearInput.focus()
        return false
      }
    }
  }

  const firstUnanswered = markUnansweredQuestions()
  if (firstUnanswered) {
    // Scroll to the first unanswered question smoothly
    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }

  return true
}

// Remove Unanswered Markers Function
function removeUnansweredMarkers() {
  const unansweredQuestions = document.querySelectorAll('.question.unanswered')
  unansweredQuestions.forEach((question) => {
    question.classList.remove('unanswered')
  })
}

// Calculate Kompetenz Score Function
function calculateCompetenzScore(scores) {
  const scoreValues = Object.values(scores)
  if (scoreValues.length === 0) return 0
  const total = scoreValues.reduce((acc, val) => acc + val, 0)
  return Math.round(total / scoreValues.length)
}

// Utility Function to Get Lighter Color
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

// Utility Function to Get Contrast Color
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

// Update Description Box Function
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

// Download Chart Function
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

// Hide Navigation Buttons Function
function hideNavigationButtons() {
  const navButtons = document.querySelector('.navigation-buttons')
  if (navButtons) {
    navButtons.style.display = 'none'
  }
}

// Expose Necessary Functions Globally
window.saveSectionData = saveSectionData
window.validateYear = validateYear

// Handle teaching student radio button changes
function handleTeachingStudentChange(radio) {
  console.log('handleTeachingStudentChange called with value:', radio.value);
  // Show/hide dependent questions based on yes/no
  const teachingQuestions = [
    document.querySelector('#question-q0_3'),
    document.querySelector('#question-q0_4')
  ];
  const nonTeachingQuestion = document.querySelector('#question-q0_5');

  if (radio.value === 'Ja') {
    teachingQuestions.forEach(q => {
      if (q) {
        q.style.display = '';
        q.querySelectorAll('input, select, textarea').forEach(input => input.required = true);
      }
    });
    if (nonTeachingQuestion) {
      nonTeachingQuestion.style.display = 'none';
      nonTeachingQuestion.querySelectorAll('input, select, textarea').forEach(input => {
        input.required = false;
        input.value = '';
      });
    }
  } else {
    teachingQuestions.forEach(q => {
      if (q) {
        q.style.display = 'none';
        q.querySelectorAll('input, select, textarea').forEach(input => {
          input.required = false;
          input.value = '';
        });
      }
    });
    if (nonTeachingQuestion) {
      nonTeachingQuestion.style.display = '';
      nonTeachingQuestion.querySelectorAll('input, select, textarea').forEach(input => input.required = true);
    }
  }
  userData[radio.name] = radio.value;
  saveSectionData(false);
}

// Add to window object for global access
window.handleTeachingStudentChange = handleTeachingStudentChange;

function validateDatenschutz() {
  const unterschriftElement = document.getElementById('unterschrift')
  const datenschutzKenntnisElement = document.getElementById('datenschutzKenntnis')
  const datenschutzVerarbeitungElement = document.getElementById('datenschutzVerarbeitung')
  const teilnahmeEinverstaendnisElement = document.getElementById('teilnahmeEinverstaendnis')

  let isValid = true

  if (unterschriftElement.value.trim() === '') {
    isValid = false
    alert('Bitte geben Sie Ihre Unterschrift ein.')
    return isValid
  }

  if (!datenschutzKenntnisElement.checked) {
    isValid = false
    alert('Bitte bestätigen Sie, dass Sie die Datenschutzhinweise gelesen haben.')
    return isValid
  }

  if (!datenschutzVerarbeitungElement.checked) {
    isValid = false
    alert('Bitte stimmen Sie der Verarbeitung Ihrer Daten zu.')
    return isValid
  }

  if (!teilnahmeEinverstaendnisElement.checked) {
    isValid = false
    alert('Bitte stimmen Sie der Teilnahme an der Befragung zu.')
    return isValid
  }

  return isValid
}

// Initialize survey after code generation
async function initializeSurvey() {
  currentSection = -1; // -1 represents datenschutz section
  renderDatenschutzSection();
  updateProgressBar();
}

// Modify renderDatenschutzSection to only show Weiter button
function renderDatenschutzSection() {
  const datenschutzHtml = `
    <div class="datenschutz-section">
      <h2>Datenschutzerklärung</h2>
      <p>
        Bevor Sie mit der Befragung beginnen, müssen wir sicher stellen, dass wir Ihre Daten speichern dürfen. Dafür lesen Sie sich bitte die Datenschutzerklärung durch und stimmen Sie dieser durch Ihre digitale Unterschrift zu.
      </p>
      <div class="datenschutz-content">
         <h3>Projektleitung:</h3>
        <p>Prof.in Dr. Charlott Rubach & Anne-Kathrin Hirsch</p>
        <p>Sehr geehrte Lehramtsstudierende,</p>
        <p>
          die Digitalisierung und Digitalität im Bildungsbereich erhielten in den letzten Jahren große Aufmerksamkeit. Der kompetente Umgang mit digitalen Medien gehört zum Aufgabenbereich von Lehrkräften. Daher ist es bedeutsam, dass Lehramtsstudierende während ihrer Ausbildung auf diesen Umgang vorbereitet werden. Wir interessieren uns im Rahmen dieser Studie „Open-Digi“ dafür, inwieweit die von uns erstellten Lernerfahrungen zur Förderung digitaler Kompetenzen beitragen.
        </p>
        <h3>Wer sind wir?</h3>
        <p>
          Wir sind Prof. Dr. Charlott Rubach und Anne-Kathrin Hirsch, Bildungsforscherinnen an der Universität Rostock. Unsere Forschungsschwerpunkte sind Digitalisierung, Förderung digitaler Kompetenzen und Gestaltungsmöglichkeiten einer bedarfsorientierten Lehrkräftebildung.
        </p>
        <h3>Worum geht es in diesem Projekt?</h3>
        <p>
          Ziel des Projektes ist die Untersuchung von effektiven Lernerfahrungen für die Entwicklung digitaler Kompetenzen. Das Projekt besteht aus mehreren Schritten:
        </p>
        <ul>
          <li>Sie füllen die Befragung zum Open-Digi Projekt aus, welcher der Pre-Diagnostik gilt und zirka 10 Minuten dauert. Alle Befragungen thematisieren ausschließlich Aspekte von digitaler Kompetenz.</li>
          <li>Ihnen werden auf Grundlage der Diagnostik mehrere Vorschläge gemacht, wie sie eigene Kompetenzen weiterentwickeln können.</li>
          <li>Sie bearbeiten verschiedene Kurse.</li>
          <li>Sie durchlaufen die Post-Diagnostik direkt nach Bearbeitung der Kurse.</li>
          <li>Sie machen eine dritte Befragung, 1 Monat nach Bearbeitung der Kurse.</li>
        </ul>
        <h3>Was bedeutet die Teilnahme für mich und meine Daten?</h3>
        <p>
          Ihre Teilnahme an unserer Studie ist freiwillig. Wenn Sie an der Studie teilnehmen, können Sie die Befragung jederzeit abbrechen. In diesem Falle werden die Daten nicht gespeichert.
        </p>
        <p>
          Die Befragung ist anonym. Das heißt, es werden auch ausschließlich anonymisierte Informationen analysiert und im Rahmen wissenschaftlicher Arbeiten veröffentlicht. Es werden keine Informationen gespeichert, die es uns möglich machen, Sie als Person zu identifizieren. Eine Rücknahme Ihres Einverständnisses und damit Löschung Ihrer Daten, nachdem Sie den Fragebogen ausgefüllt und abgegeben haben, ist demnach nicht möglich. Anonymisiert sind auch Daten, die keine persönliche Information mehr enthalten, bspw. Alter, Geschlecht, Lehramtstyp, Fächer und Hochschulsemester.
        </p>
        <p>
          Wir speichern Ihre Antworten und Ihre Angaben (z. B. Alter und Geschlecht). Diese werden bis zum Abschluss der Untersuchung und maximal 10 Jahre auf den Dienstrechnern der Wissenschaftlerinnen aus dem Projekt gespeichert und danach gelöscht.
        </p>
        <p>
          Es erfolgt keine Weitergabe Ihrer Daten an Dritte außerhalb des Forschungsprojektes.
        </p>
        <p>
          Unter folgendem <a href="datenschutz.html" target="_blank">Link</a> finden Sie ausführliche Hinweise zum Schutz Ihrer Daten.
        </p>
      </div>
      <div class="final-inputs">
        <div class="question">
          <label for="datum">Datum</label>
          <input type="date" id="datum" name="datum" value="${
            new Date().toISOString().split('T')[0]
          }" readonly required aria-required="true">
        </div>
        <div class="question">
          <label for="unterschrift">Unterschrift (Bitte tippen Sie Ihren Namen als Unterschrift)</label>
          <input type="text" id="unterschrift" name="unterschrift" required aria-required="true">
        </div>
        <div class="agreement-questions">
          <div class="agreement">
            <label>
              <input type="checkbox" id="datenschutzKenntnis" name="datenschutzKenntnis" required>
              Mir sind die Datenschutzhinweise zur Befragung zur Kenntnis gegeben worden.
            </label>
          </div>
          <div class="agreement">
            <label>
              <input type="checkbox" id="datenschutzVerarbeitung" name="datenschutzVerarbeitung" required>
              Ich erkläre mich damit einverstanden, dass meine Daten gemäß der Informationen zum Datenschutz verarbeitet und gespeichert werden.
            </label>
          </div>
          <div class="agreement">
            <label>
              <input type="checkbox" id="teilnahmeEinverstaendnis" name="teilnahmeEinverstaendnis" required>
              Hiermit erkläre mich einverstanden, unter den genannten Bedingungen an der Befragung teilzunehmen.
            </label>
          </div>
        </div>
        <div class="navigation-buttons">
          <button type="button" id="submitFinal" class="btn btn-primary" onclick="finishDatenschutz()">
            Weiter <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `

  const surveyForm = document.getElementById('surveyForm')
  if (surveyForm) {
    surveyForm.innerHTML = datenschutzHtml
  }
}

// New function to handle datenschutz completion
function finishDatenschutz() {
  if (validateDatenschutz()) {
    currentSection = 0;
    renderSection(currentSection);
    updateProgressBar();
    window.scrollTo(0, 0);
  }
}
