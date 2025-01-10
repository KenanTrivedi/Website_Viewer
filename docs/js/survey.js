// survey.js

// Global Variables
let currentSection = 0
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
  renderSection(currentSection)
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
  currentSection = 0
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

  const attemptNumber =
    parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1
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
      q0_0: userData.q0_0,
      q0_1: userData.q0_1,
      q0_2: userData.q0_2,
      q0_3: userData.q0_3,
    }
  }

  // Handle datenschutz and signature
  const datenschutzConsentElement =
    document.getElementById('datenschutzConsent')
  const unterschriftElement = document.getElementById('unterschrift')

  if (datenschutzConsentElement) {
    dataToSend.datenschutzConsent = datenschutzConsentElement.checked
  }

  if (unterschriftElement) {
    dataToSend.unterschrift = unterschriftElement.value.trim()
  }

  // Handle all open-ended responses
  const openEndedResponses = {}

  // T1 strategy response
  const t1StrategyElement = document.getElementById('t1OpenEndedResponse')
  if (t1StrategyElement && t1StrategyElement.value.trim()) {
    openEndedResponses.t1_strategy = t1StrategyElement.value.trim()
  }

  // T2 course feedback
  if (attemptNumber > 1 && userData['t2_course_feedback']) {
    openEndedResponses[`attempt${attemptNumber}_course_feedback`] =
      userData['t2_course_feedback']
  }

  // T2 reflection response
  const t2ReflectionElement = document.getElementById('t2OpenEndedResponse')
  if (t2ReflectionElement && t2ReflectionElement.value.trim()) {
    openEndedResponses.t2_reflection = t2ReflectionElement.value.trim()
  }

  if (Object.keys(openEndedResponses).length > 0) {
    dataToSend.openEndedResponses = openEndedResponses
  }

  // Handle scores
  if (isComplete || currentSection === surveyData.length) {
    if (!sessionStorage.getItem('hasInitialScores')) {
      dataToSend.initialScores = categoryScores
      sessionStorage.setItem('hasInitialScores', 'true')
    } else {
      dataToSend.updatedScores = categoryScores
    }
  }

  fetch('/api/save-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Server responded with status ${response.status}`
        )
      }
      return response.json()
    })
    .then((result) => {
      console.log('Data saved successfully:', result)

      if (result.initialScores) {
        sessionStorage.setItem(
          'initialScores',
          JSON.stringify(result.initialScores)
        )
        initialScores = result.initialScores
      }
      if (result.updatedScores) {
        sessionStorage.setItem(
          'updatedScores',
          JSON.stringify(result.updatedScores)
        )
        updatedScores = result.updatedScores
      }

      if (isComplete) {
        showResults()
      }
    })
    .catch((error) => {
      console.error('Error saving data:', error)
      // Don't show error alert for initial save of personal info section
      if (currentSection !== 0 || isComplete) {
        alert(
          'Es gab einen Fehler beim Speichern Ihrer Daten. Bitte versuchen Sie es erneut.'
        )
      }
    })
}

function nextSection() {
  if (currentSection < surveyData.length - 1) {
    if (validateSection()) {
      currentSection++
      saveSectionData(false) // Save data and currentSection
      renderSection(currentSection)
      updateProgressBar()
      window.scrollTo(0, 0)
    } else {
      alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
      markUnansweredQuestions()
    }
  } else {
    finishSurvey()
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
        // User data not found, initialize userData
        console.log('User data not found, initializing new user data.')
        userData = {}
        currentSection = 0
        initialScores = {}
        updatedScores = {}
        // No need to renderSection here because we'll do it after the try/catch
      } else if (!response.ok) {
        throw new Error('Error fetching user data')
      } else {
        const data = await response.json()
        console.log('Loaded user data:', data)

        // Store attemptNumber in sessionStorage
        sessionStorage.setItem('attemptNumber', data.attemptNumber || '1')

        if (data.data) {
          if (isNewAttempt) {
            // Keep all personal information for new attempts
            userData = {
              q0_0: data.data.q0_0,  // Gender
              q0_1: data.data.q0_1,  // Birth year
              q0_2: data.data.q0_2,  // Teaching student
              q0_3: data.data.q0_3,  // Teaching type
              q0_4: data.data.q0_4,  // Teaching subjects
              q0_5: data.data.q0_5,  // Non-teaching program
              q0_6: data.data.q0_6   // Semester
            }
            currentSection = 0 // Start from the first section
            updatedScores = {} // Reset updatedScores
          } else {
            userData = data.data
            currentSection =
              data.currentSection !== undefined ? data.currentSection : 0
            updatedScores = data.updatedScores || {}
          }
          initialScores = data.initialScores || {}
          console.log('Processed user data:', userData)
        } else {
          // No data found in the response, initialize userData
          userData = {}
          currentSection = 0
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
  console.log(`Rendering section ${index}`)

  if (index < 0 || index > surveyData.length) {
    console.error(`Invalid section index: ${index}`)
    currentSection = 0 // Reset to first section
    index = 0
  }

  // Get attemptNumber from sessionStorage
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

  if (index === surveyData.length) {
    renderDatenschutzSection()
    return
  }

  const section = surveyData[index]
  console.log(`Section title: ${section.title}`)

  document.getElementById('surveyForm').innerHTML = ''

  let html = `<div class="section"><h2>${section.title}</h2>`

  // Display the introductory text before every category section except 'Persönliche Angaben'
  if (section.title !== 'Persönliche Angaben') {
    html += `<p>Wie kompetent fühlen Sie sich in der Ausführung der folgenden Aktivitäten...</p>`
  }

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`
    console.log(`Rendering question: ${questionId}`)
    let savedValue = userData[questionId] || ''

    // Check if this question depends on another question's answer
    let shouldDisplay = true;
    if (question.dependsOn) {
      const dependentQuestionId = question.dependsOn.questionId
      const dependentValue = userData[dependentQuestionId]
      console.log('Checking dependency:', {
        question: question.text,
        dependsOn: dependentQuestionId,
        expectedValue: question.dependsOn.value,
        actualValue: dependentValue
      });
      shouldDisplay = dependentValue === question.dependsOn.value;
    }

    html += `<div class="question" id="question-${questionId}" style="${shouldDisplay ? '' : 'display: none;'}"><p>${question.text}</p>`

    if (question.type === 'radio') {
      question.options.forEach((option) => {
        const isTeachingQuestion = questionId === 'q0_2';
        html += `<label><input type="radio" name="${questionId}" value="${option}" ${
          savedValue === option ? 'checked' : ''
        } ${isTeachingQuestion ? 'onchange="handleTeachingStudentChange(this)"' : ''} required> ${option}</label><br>`
      })
    } else if (question.type === 'number' && question.text.includes('Jahr')) {
      html += `<input type="text" id="${questionId}" name="${questionId}" 
                     value="${savedValue}" 
                     oninput="validateYear(this)" 
                     maxlength="4" 
                     pattern="[0-9]{4}"
                     required>`
    } else if (question.type === 'number') {
      // For semester number input
      html += `<input type="number" id="${questionId}" name="${questionId}" 
                     value="${savedValue}" 
                     min="1" 
                     max="99"
                     required>`
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

  // After rendering the first section, add the open-ended question for T2
  if (index === 0 && attemptNumber > 1) {
    html += `
      <div class="question">
        <p>Wie fandest du deine absolvierten Kurse in ILIAS in Bezug auf Inhalt und Struktur? Was hast du für dich mitgenommen? Was war hilfreich für dich?</p>
        <textarea name="t2_course_feedback" id="t2_course_feedback" rows="4" style="width:100%;" required>${
          userData['t2_course_feedback'] || ''
        }</textarea>
      </div>
    `
  }

  html += `</div>`
  document.getElementById('surveyForm').innerHTML = html

  // Add event listeners for scale buttons
  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('keydown', handleScaleKeydown)
  })

  // If we're in the personal info section, add the teaching student change handler
  if (section.title === 'Persönliche Angaben') {
    const teachingStudentRadios = document.querySelectorAll('input[name="q0_2"]')
    teachingStudentRadios.forEach(radio => {
      radio.addEventListener('change', () => handleTeachingStudentChange(radio))
    })
    // Trigger the handler if a value is already selected
    const selectedRadio = document.querySelector('input[name="q0_2"]:checked')
    if (selectedRadio) {
      handleTeachingStudentChange(selectedRadio)
    }
  }

  updateNavigationButtons()
  updateProgressBar()
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
  const currentStep = Math.min(currentSection + 1, totalSteps) // Prevent overflow
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
  const isLastSection = currentSection === surveyData.length;

  if (isLastSection) {
    if (!validateDatenschutz()) {
      markUnansweredQuestions();
      return;
    }
    saveSectionData(true);
    showResults();
  } else if (validateSection()) {
    saveSectionData(false);
    currentSection++;
    if (currentSection === surveyData.length) {
      renderDatenschutzSection();
    } else {
      renderSection(currentSection);
    }
    updateProgressBar();
    window.scrollTo(0, 0);
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.');
    markUnansweredQuestions();
  }
}

// Mark Unanswered Questions Function
function markUnansweredQuestions() {
  const form = document.getElementById('surveyForm')
  if (!form) return null;

  const requiredFields = form.querySelectorAll('[required]')
  let firstUnanswered = null

  requiredFields.forEach((field) => {
    const questionDiv = field.closest('.question') || field.parentElement
    if (!questionDiv) return;

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
  });

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
      });

      if (questionCount > 0) {
        categoryScores[section.title] = Math.round(
          (totalScore / (questionCount * maxScorePerQuestion)) * 100
        )
      } else {
        categoryScores[section.title] = 0
      }
    }
  });

  return categoryScores
}

// Create Competency Chart Function
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

  // Determine all unique labels from initial and updated scores
  const allLabels = new Set([
    ...Object.keys(initialScores),
    ...Object.keys(updatedScores),
  ])
  const fullLabels = Array.from(allLabels)
  const labels = fullLabels.map((key) => labelMap[key] || key)
  let currentHoveredIndex = -1

  const datasets = [
    {
      label: 'Initial Score',
      data: fullLabels.map((label) => initialScores[label] || 0),
      backgroundColor: fullLabels.map((label) =>
        getLighterColor(colorMap[label] || '#999999')
      ),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    },
  ]

  if (Object.keys(updatedScores).length > 0) {
    datasets.push({
      label: 'Updated Score',
      data: fullLabels.map((label) => updatedScores[label] || 0),
      backgroundColor: fullLabels.map((label) => colorMap[label] || '#999999'),
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
          display: datasets.length > 1, // Show legend only if multiple datasets
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
          // Do not clear the description box when not hovering
        }
      },
    },
  })

  chart1Instance.update()

  // Initialize the description box with the first competency
  if (fullLabels.length > 0) {
    const firstCompetency = fullLabels[0]
    updateDescriptionBox(
      descriptionBox,
      firstCompetency,
      competencyDescriptions[firstCompetency]
    )
  }

  // Fix the size of the description box
  descriptionBox.style.minHeight = '150px' // Adjust as needed
}

/**
 * Populates the form fields based on user data for the given section.
 * @param {HTMLElement} form - The survey form element.
 * @param {Object} data - The user data containing responses.
 * @param {number} sectionIndex - The current section index.
 */
function populateFormFields(form, data, sectionIndex) {
  const section = surveyData[sectionIndex]
  if (!section) return

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

// Modify the showResults function in survey.js

async function showResults() {
  const userId = sessionStorage.getItem('userId')
  if (!userId) {
    console.error('No userId found in sessionStorage.')
    return
  }

  try {
    const response = await fetch(`/api/user-data/${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }
    const data = await response.json()

    initialScores = data.initialScores || {}
    updatedScores = data.updatedScores || {}

    console.log('Fetched User Data:', data)

    const attemptNumber =
      parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

    // Calculate competency score using updatedScores if available, otherwise use initialScores
    const scoreData =
      Object.keys(updatedScores).length > 0 ? updatedScores : initialScores
    const score = calculateCompetenzScore(scoreData)

    // Generate HTML for results
    let resultHtml = `
      <h2>Ihr Kompetenzscore beträgt ${score}%</h2>
      <p>Dieser Score repräsentiert Ihren aktuellen Stand in digitalen Kompetenzen basierend auf Ihren Antworten.</p>
      <h3>Kompetenzdiagramm</h3>
      <p>Das folgende Diagramm zeigt Ihre Scores in verschiedenen Kompetenzbereichen.${
        Object.keys(updatedScores).length > 0
          ? ' Die helleren Balken repräsentieren Ihre Ergebnisse nach der ersten Befragung (T1), während die dunkleren Balken Ihre Ergebnisse nach der aktuellen Befragung (T2) darstellen.'
          : ' Die Balken repräsentieren Ihre Ergebnisse nach der ersten Befragung.'
      }</p>
      <div class="attention-box">
        <span class="info-icon">ℹ️</span>
        Bewegen Sie den Mauszeiger über die Balken, um detaillierte Informationen zu den einzelnen Kompetenzen zu erhalten.
      </div>
      <div style="height: 300px; width: 100%;">
        <canvas id="competencyChart1"></canvas>
      </div>
      <div id="descriptionBox1"></div>
        <div style="display: flex; justify-content: center; margin-top: 20px;">
    <button id="downloadChart" class="btn btn-primary" style="background-color: #004A99; color: white; border: none; padding: 15px 30px; cursor: pointer; border-radius: 5px; font-size: 18px;">Diagramm herunterladen</button>
  </div>
  <hr>
`

    if (attemptNumber === 1) {
      // T1 specific content
      resultHtml += `
        <p>Nun ist es Zeit, deine digitalen Kompetenzen zu fördern. Hier kommst du zu den Kursen der jeweiligen Kompetenzbereiche. Klicke einfach auf den Link und du wirst zu ILIAS weitergeleitet.</p>
        <ul>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_121177&client_id=ilias_hro" target="_blank">Suchen, Verarbeiten und Aufbewahren</a></li>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122050&client_id=ilias_hro" target="_blank">Analysieren und Reflektieren</a></li>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_120680&client_id=ilias_hro" target="_blank">Kommunikation & Kollaboration</a></li>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122048&client_id=ilias_hro" target="_blank">Problemlösen und Handeln</a></li>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122047&client_id=ilias_hro" target="_blank">Produzieren</a></li>
          <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122049&client_id=ilias_hro" target="_blank">Schützen und sicher Agieren</a></li>
        </ul>
      `
    } else if (attemptNumber > 1) {
      // T2 specific content
      resultHtml += `
        <p>Jetzt hast du den Vergleich zwischen deiner Kompetenzeinschätzung vor und nach der Absolvierung der ILIAS Kurse. Wenn der helle Balken niedriger ist als der dunklere, bedeutet das, dass du dich nach den ILIAS-Kursen besser einschätzt als zuvor. Ist der helle Balken höher als der dunklere ist es genau umgekehrt. Es ist auch möglich, dass du dich bei beiden Befragungen in gewissen Kompetenzbereichen gleich eingeschätzt hast: dann sind beide Balken gleich hoch.</p>
        <p><strong>Wie haben sich deine Kompetenzüberzeugungen nun verändert? Beschreibe, was du im Diagramm siehst und teile uns mit, welche Schlüsse du aus deiner Lernerfahrung ziehst.</strong></p>
        <textarea id="t2OpenEndedResponse" rows="4" style="width:100%;" required></textarea>
        <button id="submitT2OpenEndedResponse" class="btn btn-primary">Absenden</button>
      `
    }

    document.getElementById('surveyForm').innerHTML = resultHtml

    // Hide the progress bar
    const progressBar = document.getElementById('progressBar')
    const progressText = document.getElementById('progressText')
    if (progressBar) progressBar.style.display = 'none'
    if (progressText) progressText.style.display = 'none'

    // Create the competency chart
    if (Object.keys(updatedScores).length > 0) {
      // Show both initial and updated scores
      createCompetencyChart1(initialScores, updatedScores)
    } else {
      // Show only initial scores
      createCompetencyChart1(initialScores, {})
    }

    // Add event listener for chart download
    const downloadButton = document.getElementById('downloadChart')
    if (downloadButton) {
      downloadButton.addEventListener('click', downloadChart)
    }

    // Add event listeners for response submissions
    const t1ResponseButton = document.getElementById('submitT1OpenEndedResponse')
    if (t1ResponseButton) {
      t1ResponseButton.addEventListener('click', submitT1OpenEndedResponse)
    }

    const t2ResponseButton = document.getElementById('submitT2OpenEndedResponse')
    if (t2ResponseButton) {
      t2ResponseButton.addEventListener('click', submitT2OpenEndedResponse)
    }

    // Hide navigation buttons for results page
    hideNavigationButtons()
  } catch (error) {
    console.error('Error displaying results:', error)
  }
}

// Assign showResults to window after its definition
window.showResults = showResults

// Function to handle T1 open-ended response submission
function submitT1OpenEndedResponse(event) {
  event.preventDefault()
  const openEndedResponse = document
    .getElementById('t1OpenEndedResponse')
    .value.trim()
  if (!openEndedResponse) {
    alert('Bitte füllen Sie das Textfeld aus.')
    return
  }

  const userId = sessionStorage.getItem('userId')

  fetch('/api/save-open-ended-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      key: 't1_strategy',
      response: openEndedResponse,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }
      return response.json()
    })
    .then(() => {
      document.getElementById('t1OpenEndedResponse').value = ''
      showCourseLinks()
    })
    .catch((error) => {
      console.error('Error saving open-ended response:', error)
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      )
    })
}

/**
 * Function to handle T2 open-ended response submission
 */
function submitT2OpenEndedResponse(event) {
  event.preventDefault()
  const openEndedResponse = document
    .getElementById('t2OpenEndedResponse')
    .value.trim()
  if (!openEndedResponse) {
    alert('Bitte füllen Sie das Textfeld aus.')
    return
  }

  const userId = sessionStorage.getItem('userId')

  fetch('/api/save-open-ended-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      key: 't2_reflection',
      response: openEndedResponse,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }
      return response.json()
    })
    .then(() => {
      document.getElementById('t2OpenEndedResponse').value = ''
      alert('Vielen Dank für Ihre Antwort!')
    })
    .catch((error) => {
      console.error('Error saving open-ended response:', error)
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      )
    })
}

// Function to display course links
function showCourseLinks() {
  const courseLinksHtml = `
    <p>Nun ist es Zeit, deine digitalen Kompetenzen zu fördern. Hier kommst du zu den Kursen der jeweiligen Kompetenzbereiche. Klicke einfach auf den Link und du wirst zu ILIAS weitergeleitet.</p>
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
    .getElementById('surveyForm')
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

    alert(
      'Ihre Umfrage wurde erfolgreich zurückgesetzt. Sie können jetzt eine neue Umfrage starten.'
    )

    // Set 'startNewAttempt' to 'true' in sessionStorage
    sessionStorage.setItem('startNewAttempt', 'true')

    // Load user data as a new attempt
    loadUserData(true)
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
    currentSection = 0
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
  
  // Update the current question's value in userData
  userData[radio.name] = radio.value;

  // Get all dependent questions
  const teachingQuestions = [
    document.querySelector('#question-q0_3'),  // Lehramt type
    document.querySelector('#question-q0_4')   // Teaching subjects
  ];
  const nonTeachingQuestion = document.querySelector('#question-q0_5');  // Non-teaching program

  if (radio.value === 'Ja') {
    // Show teaching questions, hide non-teaching
    teachingQuestions.forEach(q => {
      if (q) {
        q.style.display = '';
        // Make inputs required
        const inputs = q.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.required = true);
      }
    });
    if (nonTeachingQuestion) {
      nonTeachingQuestion.style.display = 'none';
      // Remove required from hidden inputs
      const inputs = nonTeachingQuestion.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.required = false);
      // Clear the value
      delete userData['q0_5'];
    }
  } else {
    // Show non-teaching question, hide teaching
    teachingQuestions.forEach(q => {
      if (q) {
        q.style.display = 'none';
        // Remove required from hidden inputs
        const inputs = q.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.required = false);
      }
    });
    if (nonTeachingQuestion) {
      nonTeachingQuestion.style.display = '';
      // Make inputs required
      const inputs = nonTeachingQuestion.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.required = true);
    }
    // Clear teaching-related values
    delete userData['q0_3'];
    delete userData['q0_4'];
  }

  // Save the current state
  saveSectionData(false);
  console.log('Current userData:', userData);
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
