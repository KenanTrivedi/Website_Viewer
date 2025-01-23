// survey.js

// Global Variables
let currentSection = -1
let userData = {}
let chart1Instance = null
let initialScores = {}
let updatedScores = {}
let userDataInitial = {}
let userDataUpdated = {}

// Section initialization logic
function initializeSections() {
  // Check if survey was completed
  if (sessionStorage.getItem('surveyCompleted') === 'true') {
    showResults()
    return
  }

  // Start with Datenschutz page
  currentSection = -1
  renderSection(currentSection)
  updateNavigationButtons()
}

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
      if (decoded.userId === sessionStorage.getItem('userId')) {
        // Force Datenschutz for new attempts
        if (userData.meta.attemptNumber > 1 && !userData.datenschutz) {
          currentSection = -1
        }
        renderSection(currentSection)
        localStorage.removeItem('surveyResumeToken')
      }
    } catch (error) {
      console.error('Invalid token:', error)
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
  userData = {
    t1: {},
    t2: {},
    meta: {
      attemptNumber: 1,
      currentSection: -1,
    },
  }
  initialScores = {}
  updatedScores = {}
}

function saveSectionData(isComplete = false) {
  removeUnansweredMarkers()
  const userId = sessionStorage.getItem('userId')
  const attemptNumber =
    parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

  if (!userId) {
    console.error('No userId found')
    return Promise.reject(new Error('No userId found'))
  }

  // Handle Datenschutz section separately
  if (currentSection === -1) {
    userData.datenschutz = {
      kenntnis:
        document.getElementById('datenschutzKenntnis')?.checked || false,
      verarbeitung:
        document.getElementById('datenschutzVerarbeitung')?.checked || false,
      einverstaendnis:
        document.getElementById('teilnahmeEinverstaendnis')?.checked || false,
      unterschrift: document.getElementById('unterschrift')?.value.trim() || '',
      datum:
        document.getElementById('datum')?.value ||
        new Date().toISOString().split('T')[0],
    }
  } else {
    // Handle regular form data
    const formData = new FormData(document.getElementById('surveyForm'))

    // For T2 personal info section, preserve T1 data except semester
    if (attemptNumber > 1 && currentSection === 0) {
      userData.t2 = {
        ...userData.t2,
        ...Object.fromEntries(formData.entries()),
        // Preserve T1 personal info except semester
        ...Object.keys(userData.t1).reduce((acc, key) => {
          if (key.startsWith('q0_') && key !== 'q0_6')
            acc[key] = userData.t1[key]
          return acc
        }, {}),
      }
    } else {
      // Regular data handling for other sections
      for (const [key, value] of formData.entries()) {
        if (attemptNumber > 1) {
          userData.t2[key] = value
        } else {
          userData[key] = value
        }
      }
    }
  }

  // Calculate scores based on current attempt data
  const categoryScores =
    currentSection === -1
      ? {}
      : calculateCategoryScores(attemptNumber > 1 ? userData.t2 : userData)

  // Prepare data payload
  const dataToSend = {
    userId: userId,
    data: attemptNumber > 1 ? userData.t2 : userData,
    isComplete: isComplete,
    categoryScores: categoryScores,
    currentSection: currentSection,
    attemptNumber: attemptNumber,
    openEndedResponses: {},
    meta: {
      attemptNumber: attemptNumber,
      currentSection: currentSection,
    },
  }

  // Handle open-ended responses
  const t1Response = document.getElementById('t1OpenEndedResponse')
  const t2Response = document.getElementById('t2OpenEndedResponse')
  const t2Feedback = document.querySelector('[name="t2_course_feedback"]')

  if (t1Response?.value?.trim()) {
    dataToSend.openEndedResponses.t1_strategy = t1Response.value.trim()
  }
  if (t2Response?.value?.trim()) {
    dataToSend.openEndedResponses.t2_reflection = t2Response.value.trim()
  }
  if (t2Feedback?.value?.trim() && attemptNumber > 1) {
    dataToSend.openEndedResponses.t2_course_feedback = t2Feedback.value.trim()
  }

  return fetch('/api/save-user-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSend),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Server error')
      }
      return response.json()
    })
    .then((result) => {
      // Update local score storage
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

      // Handle completion
      if (isComplete && currentSection !== -1) {
        if (attemptNumber === 1) {
          sessionStorage.setItem('hasInitialScores', 'true')
        }
      }
      // Clear previous ILIAS links before showing new ones
      const iliasLinks = document.getElementById('iliasLinks')
      if (iliasLinks) iliasLinks.innerHTML = ''

      return result
    })
}

function nextSection() {
  if (currentSection === -1) {
    // Validate Datenschutz with enhanced checks
    const form = document.getElementById('surveyForm')
    let isValid = true

    // Validate all fields including hidden ones
    isValid = validateSection(true)

    // Additional check for visible validity
    if (!form.checkValidity()) isValid = false

    if (isValid && validateDatenschutz()) {
      saveSectionData(false)
      currentSection = 0 // Move to personal info
      renderSection(currentSection)
      updateProgressBar()
      // Scroll to top after transition
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300) // Increased timeout for better reliability
    } else {
      const firstError = markUnansweredQuestions()
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  } else if (currentSection < surveyData.length - 1) {
    const form = document.getElementById('surveyForm')
    let isValid = true

    // Validate all fields including hidden ones
    isValid = validateSection(true)

    // Additional check for visible validity
    if (!form.checkValidity()) isValid = false

    if (isValid) {
      currentSection++
      saveSectionData(false)
      renderSection(currentSection)
      updateProgressBar()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const firstError = markUnansweredQuestions()
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  } else {
    finishSurvey()
  }
}

// Remove real-time validation alerts and update validation logic
function validateSection() {
  const form = document.getElementById('surveyForm')
  if (!form) return false
  const attemptNumber = userData.meta.attemptNumber
  const isT2 = attemptNumber > 1
  const isPersonalSection = currentSection === 0
  let isValid = true

  // Reset validation states
  form.querySelectorAll('.question').forEach((q) => {
    q.classList.remove('unanswered')
  })

  // For T2 personal section, only validate the feedback question
  if (isT2 && isPersonalSection) {
    const feedback = form.querySelector('[name="t2_course_feedback"]')
    if (!feedback || !feedback.value.trim()) {
      isValid = false
      const container = feedback.closest('.question') || feedback.parentElement
      container.classList.add('unanswered')
      alert('Bitte geben Sie Ihr Feedback zu den ILIAS-Kursen ein.')
    }
    return isValid
  }

  // Special handling for personal info section
  if (currentSection === 0) {
    // Handle hidden T2 fields
    const isT2 = attemptNumber > 1

    // Validate Lehramt dropdown
    const lehramtField = isT2
      ? form.querySelector('input[type="hidden"][name="q0_3"]')
      : form.querySelector('[name="q0_3"]')

    if (
      lehramtField &&
      lehramtField.offsetParent &&
      lehramtField.value === ''
    ) {
      isValid = false
      const container = lehramtField.closest('.question') || form
      container.classList.add('unanswered')
    }

    // Validate birth year
    const birthYearField = form.querySelector('[name="q0_1"]')
    if (birthYearField) {
      validateYear(birthYearField) // Force validation
      if (!birthYearField.checkValidity()) {
        isValid = false
        birthYearField.closest('.question').classList.add('unanswered')
      }
    }

    // Validate Fächer/Studien field
    const studienField = form.querySelector('[name="q0_4"], [name="q0_5"]')
    if (
      studienField &&
      studienField.offsetParent &&
      !studienField.value.trim()
    ) {
      isValid = false
      studienField.closest('.question').classList.add('unanswered')
    }
  }

  // Generic validation for all required fields
  let requiredFields = []
  form.querySelectorAll('[required]').forEach((field) => {
    // Skip hidden fields that have visible counterparts
    if (
      field.type === 'hidden' &&
      form.querySelector(`[name="${field.name}"]:not([type="hidden"])`)
    )
      return

    requiredFields.push(field)
  })

  requiredFields.forEach((field) => {
    if (
      field.offsetParent && // Only validate visible fields
      ((field.type === 'radio' &&
        !form.querySelector(`[name="${field.name}"]:checked`)) ||
        (field.type === 'checkbox' && !field.checked) ||
        (field.type !== 'radio' &&
          field.type !== 'checkbox' &&
          !field.value.trim()))
    ) {
      isValid = false
      const container = field.closest('.question') || field.parentElement
      container.classList.add('unanswered')
    }
  })

  if (!isValid) {
    const firstError = form.querySelector('.unanswered')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    alert('Bitte füllen Sie alle Pflichtfelder aus.')
  }

  return isValid
}

function validateDatenschutz() {
  const elements = [
    {
      el: document.getElementById('datenschutzKenntnis'),
      label: 'Datenschutzkenntnis',
    },
    {
      el: document.getElementById('datenschutzVerarbeitung'),
      label: 'Datenverarbeitung',
    },
    {
      el: document.getElementById('teilnahmeEinverstaendnis'),
      label: 'Teilnahmeeinverständnis',
    },
    { el: document.getElementById('unterschrift'), label: 'Unterschrift' },
  ]

  let isValid = true

  // Remove any existing error styling
  elements.forEach(({ el }) => {
    if (el?.parentElement) {
      el.parentElement.classList.remove('unanswered')
    }
  })

  elements.forEach(({ el, label }) => {
    if (!el) {
      console.error(`Element not found: ${label}`)
      isValid = false
      return
    }

    const isFieldValid =
      el.type === 'checkbox' ? el.checked : el.value.trim() !== ''
    if (!isFieldValid) {
      isValid = false
      if (el.parentElement) {
        el.parentElement.classList.add('unanswered')
      }
    }
  })

  // Validate signature length
  const signature = document.getElementById('unterschrift')?.value.trim()
  if (signature && signature.length < 3) {
    isValid = false
    const signatureEl = document.getElementById('unterschrift')
    if (signatureEl?.parentElement) {
      signatureEl.parentElement.classList.add('unanswered')
    }
  }

  if (!isValid) {
    return false
  }
  return true
}

function previousSection() {
  // Prevent going back to Datenschutz after completion
  if (currentSection === 0 && !userData.datenschutz) {
    currentSection = -1
    renderSection(currentSection)
    updateProgressBar()
  } else if (currentSection > 0) {
    currentSection--
    saveSectionData(false)
    renderSection(currentSection)
    updateProgressBar()
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Add this
  }
}

async function loadUserData(isNewAttempt = false) {
  try {
    const userId = sessionStorage.getItem('userId')
    if (!userId) {
      console.error('No userId found')
      window.location.href = 'login.html'
      return
    }

    const response = await fetch(`/api/user-data/${userId}`)
    let data

    // Handle new users (404) and existing users
    if (response.status === 404) {
      console.log('New user, initializing data')
      data = {
        userData: {
          t1: {},
          t2: {},
          meta: {
            attemptNumber: 1,
            currentSection: -1,
          },
        },
      }
    } else if (!response.ok) {
      throw new Error('Failed to load user data')
    } else {
      data = await response.json()
    }

    // Initialize userData with the full response data
    userData = data

    // For T2, ensure we start at personal section
    const attemptNumber = parseInt(
      sessionStorage.getItem('attemptNumber') || '1'
    )
    if (attemptNumber > 1) {
      userData.meta = {
        ...userData.meta,
        attemptNumber: 2,
        currentSection: 0, // Always start T2 at personal section
      }
      currentSection = 0
      console.log('T2: Starting at personal section')

      // Initialize t2 data structure if needed
      if (!userData.t2) {
        userData.t2 = {}
      }

      // Copy data from initialResponses for personal section
      if (userData.initialResponses) {
        Object.keys(userData.initialResponses).forEach((key) => {
          if (key.startsWith('q0_')) {
            userData.t2[key] = userData.initialResponses[key]
            // Also copy to t1 for compatibility with existing code
            if (!userData.t1) userData.t1 = {}
            userData.t1[key] = userData.initialResponses[key]
          }
        })
        console.log(
          'T2: Copied personal info:',
          JSON.stringify(userData.t2, null, 2)
        )
      } else if (userData.data) {
        // Fallback to data if initialResponses not found
        Object.keys(userData.data).forEach((key) => {
          if (key.startsWith('q0_')) {
            userData.t2[key] = userData.data[key]
            if (!userData.t1) userData.t1 = {}
            userData.t1[key] = userData.data[key]
          }
        })
        console.log(
          'T2: Copied from data:',
          JSON.stringify(userData.t2, null, 2)
        )
      } else {
        console.warn('No data found to copy from')
      }
    } else {
      userData.meta = {
        ...userData.meta,
        attemptNumber: 1,
        currentSection: isNewAttempt ? -1 : userData.meta?.currentSection || -1,
      }
      currentSection = userData.meta.currentSection
    }

    console.log('Current section:', currentSection)

    renderSection(currentSection)
    updateProgressBar()
    updateNavigationButtons()
  } catch (error) {
    console.error('Error loading user data:', error)
    // For new users, just start fresh instead of showing error
    if (error.message === 'Failed to load user data') {
      userData = {
        t1: {},
        t2: {},
        meta: {
          attemptNumber: 1,
          currentSection: -1,
        },
      }
      currentSection = -1
      renderSection(currentSection)
      updateProgressBar()
      updateNavigationButtons()
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load user data. Please try again.',
      }).then(() => {
        window.location.href = 'login.html'
      })
    }
  }
}

function validateYear(input) {
  // Remove non-digits and enforce 4 characters
  input.value = input.value.replace(/\D/g, '').slice(0, 4)

  const currentYear = new Date().getFullYear()
  const isValid =
    input.value.length === 4 &&
    parseInt(input.value) >= 1900 &&
    parseInt(input.value) <= currentYear

  // Set validation messages
  if (input.value === '') {
    input.setCustomValidity('Bitte geben Sie Ihr Geburtsjahr ein.')
  } else if (!isValid) {
    input.setCustomValidity(
      `Geben Sie ein Jahr zwischen 1900 und ${currentYear} ein.`
    )
  } else {
    input.setCustomValidity('')
  }

  // Visual feedback
  input.style.borderColor = isValid ? '' : 'red'
  input.reportValidity()
}

function handleScaleClick(event) {
  const button = event.target
  const radio = button.previousElementSibling
  if (radio && radio.type === 'radio') {
    radio.checked = true
    radio.dispatchEvent(new Event('change'))
  }
}

function handleScaleKeydown(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    const radio = event.target.previousElementSibling
    if (radio && radio.type === 'radio') {
      radio.checked = true
      radio.dispatchEvent(new Event('change'))
    }
    event.target.setAttribute('aria-checked', 'true')
  }
}

window.handleScaleClick = handleScaleClick
window.handleScaleKeydown = handleScaleKeydown

// Helper function to render conditional fields
function renderConditionalField(
  section,
  question,
  index,
  fieldType,
  isT2 = false
) {
  const questionId = `q${section.questions.indexOf(question)}_${index}`
  const savedValue =
    userData.initialResponses?.[questionId] || userData[questionId] || ''

  // Special handling for subjects field
  if (fieldType === 'Fächer') {
    return `
      <div class="conditional-question">
        <label>${section.questions[index].text}</label>
        <div class="prefilled-field">
          <input type="text" 
                 name="${questionId}" 
                 value="${savedValue}"
                 ${isT2 ? 'readonly' : ''}
                 ${section.questions[index].required ? 'required' : ''}>
        </div>
      </div>
    `
  }

  // Handling for Lehramt (teaching degree) field
  if (fieldType === 'Lehramt') {
    return `
      <div class="conditional-question">
        <label>${section.questions[index].text}</label>
        <input type="text" 
               name="${questionId}" 
               value="${savedValue}"
               ${isT2 ? 'readonly' : ''}
               ${section.questions[index].required ? 'required' : ''}>
      </div>
    `
  }

  // Default handling
  return `
    <div class="conditional-question">
      <label>${section.questions[index].text}</label>
      <input type="${section.questions[index].type}" 
             name="${questionId}" 
             value="${savedValue}"
             ${section.questions[index].required ? 'required' : ''}>
    </div>
  `
}

function renderSection(index) {
  console.log(`Rendering section ${index}`)
  const form = document.getElementById('surveyForm')
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber') || '1')
  const isT2 = attemptNumber > 1
  const isPersonalInfoSection = index === 0

  form.innerHTML = ''

  if (index === -1) {
    // Datenschutz page
    form.innerHTML = `
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
        <p>
          Wir sind Prof. Dr. Charlott Rubach und Anne-Kathrin Hirsch, Bildungsforscherinnen an der Universität Rostock. Unsere Forschungsschwerpunkte sind Digitalisierung, Förderung digitaler Kompetenzen und Gestaltungsmöglichkeiten einer bedarfsorientierten Lehrkräftebildung.
        </p>
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
            <input type="date" id="datum" name="datum" 
                  value="${new Date().toISOString().split('T')[0]}" 
                  readonly required>
          </div>
          <div class="question">
            <label for="unterschrift">Unterschrift</label>
            <input type="text" id="unterschrift" name="unterschrift" 
                  required placeholder="Vollständiger Name">
          </div>
          <div class="agreement-questions">
            <div class="agreement">
              <label>
                  <input type="checkbox" id="datenschutzKenntnis" required>
    Mir sind die Datenschutzhinweise zur Kenntnis gegeben worden
            </label>
          </div>
            <div class="agreement">
              <label>
                <input type="checkbox" id="datenschutzVerarbeitung" required>
                Ich stimme der Datenverarbeitung zu
              </label>
        </div>
            <div class="agreement">
              <label>
                <input type="checkbox" id="teilnahmeEinverstaendnis" required>
                Ich möchte an der Befragung teilnehmen
              </label>
      </div>
          </div>
        </div>
      </div>
    </div>`
    return
  }

  if (index < 0 || index >= surveyData.length) {
    console.error(`Invalid section index: ${index}`)
    currentSection = -1
    renderSection(currentSection)
    return
  }

  const section = surveyData[index]
  let html = `<div class="section"><h2>${section.title}</h2>`

  if (section.title !== 'Persönliche Angaben') {
    html += `<p class="section-instruction">Wie kompetent fühlen Sie sich in der Ausführung der folgenden Aktivitäten...</p>`
  }

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`
    const isSemesterField = question.text.includes('Fachsemester')
    let savedValue = userData[questionId] || ''

    // Handle T2 prefilling for personal info
    if (isT2 && isPersonalInfoSection) {
      savedValue = userData.t1[questionId] || ''
    }

    // Handle question dependencies
    if (question.dependsOn) {
      const parentValue = userData[question.dependsOn.questionId]
      if (parentValue !== question.dependsOn.value) return
    }

    html += `<div class="question" id="${questionId}-container">`
    html += `<p>${question.text}</p>`

    switch (question.type) {
      case 'radio':
        html += `<div class="radio-group" id="${questionId}-container">`
        question.options.forEach((option) => {
          const isChecked = savedValue === option
          const isT2 = attemptNumber > 1
          const t1Value = userData.t1?.[questionId] // Get T1 value for T2 attempts

          // Determine if we should use T1 value for T2 rendering
          const shouldCheck = isT2 ? option === t1Value : isChecked

          html += `<div class="radio-option">
        <label>
          <input type="radio" 
                 name="${questionId}" 
                 value="${option}"
                 ${shouldCheck ? 'checked' : ''}
                 ${question.required ? 'required' : ''}
                 ${isT2 ? 'disabled' : ''}
                 onchange="handleTeachingStudentChange(this)">
          <span class="radio-checkmark"></span>
          ${option}
        </label>`

          if (questionId === 'q0_2') {
            const showField = shouldCheck || (!isT2 && isChecked)
            html += `<div class="conditional-field" 
                 data-condition="${option}"
                 style="display: ${
                   (option === 'Ja' &&
                     (isT2 ? t1Value === 'Ja' : shouldCheck)) ||
                   (option === 'Nein' &&
                     (isT2 ? t1Value === 'Nein' : shouldCheck))
                     ? 'block'
                     : 'none'
                 }">`

            if (option === 'Ja') {
              // Lehramt dropdown
              const lehramtValue = isT2 ? userData.t1?.q0_3 : userData.q0_3
              html += `<div class="question">
            <label>${surveyData[0].questions[3].text}</label>
            <select name="q0_3" 
                    ${isT2 ? 'disabled readonly' : ''} 
                    ${surveyData[0].questions[3].required ? 'required' : ''}>
              <option value="" disabled>Bitte wählen</option>
              ${surveyData[0].questions[3].options
                .map(
                  (opt) => `
                <option value="${opt}" ${
                    lehramtValue === opt ? 'selected' : ''
                  }>${opt}</option>
              `
                )
                .join('')}
            </select>
            ${
              isT2
                ? `<input type="hidden" name="q0_3" value="${lehramtValue}">`
                : ''
            }
          </div>`

              // Fächer field
              const facherValue = isT2 ? userData.t1?.q0_4 : userData.q0_4
              html += `<div class="question">
            <label>${surveyData[0].questions[4].text}</label>
            <input type="text" 
                   name="q0_4" 
                   value="${facherValue || ''}"
                   ${isT2 ? 'readonly disabled' : ''}
                   ${surveyData[0].questions[4].required ? 'required' : ''}>
          </div>`
            }

            if (option === 'Nein') {
              // Studienprogramm field
              const studienValue = isT2 ? userData.t1?.q0_5 : userData.q0_5
              html += `<div class="question">
            <label>${surveyData[0].questions[5].text}</label>
            <input type="text" 
                   name="q0_5" 
                   value="${studienValue || ''}"
                   ${isT2 ? 'readonly disabled' : ''}
                   ${surveyData[0].questions[5].required ? 'required' : ''}>
          </div>`
            }
            html += `</div>` // Close conditional-field
          }
          html += `</div>` // Close radio-option
        })
        html += `</div>` // Close radio-group
        break

      case 'dropdown':
        const dropdownValue =
          isT2 && isPersonalInfoSection ? userData.t1[questionId] : savedValue
        html += `<select name="${questionId}" 
                        ${question.required ? 'required' : ''}
                        ${isT2 && isPersonalInfoSection ? 'disabled' : ''}>`
        html += `<option value="" disabled ${
          !dropdownValue ? 'selected' : ''
        }>Bitte wählen</option>`
        question.options.forEach((option) => {
          html += `<option value="${option}" ${
            dropdownValue === option ? 'selected' : ''
          }>${option}</option>`
        })
        html += `</select>`
        if (isT2 && isPersonalInfoSection) {
          html += `<input type="hidden" name="${questionId}" value="${dropdownValue}">`
        }
        break

      case 'number':
        const numberValue =
          isT2 && isPersonalInfoSection ? userData.t1[questionId] : savedValue
        html += `
          <input type="${question.text.includes('Jahr') ? 'text' : 'number'}" 
                 name="${questionId}" 
                 value="${numberValue || ''}"
                 min="${question.min || 1}"
                 max="${question.max || 99}"
                 ${
                   question.text.includes('Jahr')
                     ? 'oninput="validateYear(this)"'
                     : ''
                 }
                 ${
                   isT2 && isPersonalInfoSection && isSemesterField
                     ? 'readonly disabled'
                     : isT2 && isPersonalInfoSection
                     ? 'readonly'
                     : ''
                 }
                 ${question.required ? 'required' : ''}
                 placeholder="${question.placeholder || ''}">`
        break

      case 'text':
        const textValue =
          isT2 && isPersonalInfoSection ? userData.t1[questionId] : savedValue
        html += `<input type="text" 
                       name="${questionId}" 
                       value="${textValue || ''}"
                       ${question.required ? 'required' : ''}
                       ${isT2 && isPersonalInfoSection ? 'readonly' : ''}>`
        break

      case 'scale':
        html += `<div class="rating-scale">`
        for (let i = 0; i <= 6; i++) {
          const isChecked = savedValue === i.toString()
          html += `
            <label class="scale-label">
              <input type="radio" 
                     name="${questionId}" 
                     value="${i}" 
                     ${isChecked ? 'checked' : ''}
                     ${question.required ? 'required' : ''}>
              <span class="scale-button">${i}</span>
            </label>`
        }
        html += `</div>
                <div class="scale-labels">
                  <span>gar nicht kompetent</span>
                  <span>ausgesprochen kompetent</span>
                </div>`
        break
    }

    html += `</div>` // Close question div
  })

  // T2 feedback question
  if (isPersonalInfoSection && isT2) {
    // Make all personal info fields read-only except semester
    html += `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('surveyForm')
          form.querySelectorAll('input, select, textarea').forEach(el => {
            if (!el.name.includes('q0_6') && !el.name.includes('t2_course_feedback')) {
              el.readOnly = true
              el.disabled = true
            }
          })
        })
      </script>
    `

    // Add T2 feedback question
    html += `
      <div class="t2-feedback">
        <p>Wie fandest du deine absolvierten Kurse in ILIAS in Bezug auf Inhalt und Struktur? Was hast du für dich mitgenommen? Was war hilfreich für dich?</p>
        <textarea name="t2_course_feedback" 
                  placeholder="Bitte geben Sie hier Ihr Feedback ein..." 
                  required>${userData.t2?.t2_course_feedback || ''}</textarea>
      </div>`
  }

  html += `</div>` // Close section div
  form.innerHTML = html

  // Initialize scale buttons
  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('click', handleScaleClick)
    button.addEventListener('keydown', handleScaleKeydown)
  })

  // Handle teaching student fields
  if (isPersonalInfoSection) {
    const teachingRadio = document.querySelector('input[name="q0_2"]:checked')
    if (teachingRadio) handleTeachingStudentChange(teachingRadio)
  }

  // Update navigation buttons after form content is rendered
  updateNavigationButtons()
}

// Submit Final Data Function
function submitFinalData(event) {
  event.preventDefault()
  if (validateDatenschutz()) {
    saveSectionData(true)
    showResults()
  } else {
    return false
  }
}

window.submitFinalData = submitFinalData

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
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber') || '1')
  const totalSections = surveyData.length + (attemptNumber > 1 ? 0 : 1) // +1 Datenschutz only for T1

  // Skip progress update if we're on results page
  if (sessionStorage.getItem('surveyCompleted') === 'true') {
    return
  }

  const currentStep =
    currentSection === -1
      ? 1
      : attemptNumber > 1
      ? currentSection + 1
      : currentSection + 2
  const progress = (currentStep / totalSections) * 100

  const progressFill = document.getElementById('progressFill')
  const progressText = document.getElementById('progressText')

  if (progressFill) {
    progressFill.style.width = `${progress}%`
    progressFill.setAttribute('aria-valuenow', currentStep)
    progressFill.setAttribute('aria-valuemax', totalSections)
  }

  if (progressText) {
    progressText.textContent = `Schritt ${currentStep} von ${totalSections}`
  }
}

// Finish Survey Function
async function finishSurvey() {
  // Validate only the final survey section (no Datenschutz handling)
  if (validateSection()) {
    try {
      const result = await saveSectionData(true) // Force complete flag and wait for save
      if (result) {
        showResults()
      } else {
        throw new Error('Failed to save survey data')
      }
    } catch (error) {
      console.error('Error saving survey data:', error)
      alert(
        'Es gab einen Fehler beim Speichern. Bitte versuchen Sie es erneut.'
      )
    }
  } else {
    const firstError = markUnansweredQuestions()
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

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
        !form.querySelector(`[name="${field.name}"]:checked`)) ||
      (field.type === 'checkbox' && !field.checked) ||
      (field.type !== 'radio' &&
        field.type !== 'checkbox' &&
        !field.value.trim())

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
function createCompetencyChart1(initialScores, updatedScores) {
  const canvas = document.getElementById('competencyChart1')
  const descriptionBox = document.getElementById('descriptionBox1')
  if (!canvas || !descriptionBox) {
    console.error('Chart canvas or description box not found')
    return
  }

  // Clear any existing chart instance
  if (window.competencyChart1 instanceof Chart) {
    window.competencyChart1.destroy()
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

  window.competencyChart1 = new Chart(ctx, {
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

  window.competencyChart1.update()

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

function populateFormFields(form, data, sectionIndex) {
  const section = surveyData[sectionIndex]
  if (!section) return
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber') || '1')
  const isT2 = attemptNumber > 1

  section.questions.forEach((question, questionIndex) => {
    const questionId = `q${sectionIndex}_${questionIndex}`
    const value = data[questionId]

    if (value !== undefined) {
      const field = form.querySelector(`[name="${questionId}"]`)
      if (!field) return

      // Handle different field types
      if (field.type === 'radio') {
        const radio = form.querySelector(
          `[name="${questionId}"][value="${value}"]`
        )
        if (radio) radio.checked = true
      } else if (field.tagName === 'SELECT') {
        const option = field.querySelector(`option[value="${value}"]`)
        if (option) option.selected = true
      } else {
        field.value = value
      }

      // Apply T2 styling
      if (isT2 && sectionIndex === 0) {
        const preservedFields = ['q0_3', 'q0_4', 'q0_5', 'q0_6']
        if (preservedFields.includes(questionId)) {
          field.disabled = true
          field.style.backgroundColor = '#f0f0f0'

          if (field.tagName === 'SELECT') {
            // Add hidden input to preserve value
            field.insertAdjacentHTML(
              'afterend',
              `<input type="hidden" name="${questionId}" value="${value}">`
            )
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
    console.error('No userId found in sessionStorage.')
    return
  }

  // Set completion flag
  sessionStorage.setItem('surveyCompleted', 'true')

  try {
    const response = await fetch(`/api/user-data/${userId}`)
    if (!response.ok) throw new Error('Failed to fetch user data')
    const data = await response.json()

    initialScores = data.initialScores || {}
    updatedScores = data.updatedScores || {}
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
        <button id="downloadChart" class="btn btn-primary" style="background-color: #004A99; color: white; border: none; padding: 15px 30px; cursor: pointer; border-radius: 5px; font-size: 18px;">
          Diagramm herunterladen
        </button>
      </div>
      <hr>`

    if (attemptNumber === 1) {
      resultHtml += `
        <p>Basierend auf deinen Ergebnissen wähle nun einen oder mehrere Kompetenzbereiche aus, in denen du dich weiterbilden möchtest. Wir haben für jeden Kompetenzbereich mehrere Mikrofortbildungen entwickelt, die du absolvieren kannst. Die Auswahl der Kompetenzbereiche kannst du anhand verschiedener Motive selbst vornehmen: Möchtest du den Kompetenzbereich mit dem geringsten Score verbessern, oder interessierst du dich besonders für einen Kompetenzbereich bzw. ist ein Thema gerade sehr aktuell bei dir.</p>
        <p>Schaue dir nun die Kompetenzbereiche an und entscheide dich für 1 bis 2.</p>
        <p><strong>Welche Strategie/n hast du bei der Auswahl der Kompetenzbereiche genutzt?</strong></p>
        <textarea id="t1OpenEndedResponse" rows="4" style="width:100%;" required></textarea>
        <button id="submitT1OpenEndedResponse" class="btn btn-primary">Absenden</button>`
    } else if (attemptNumber > 1) {
      resultHtml += `
        <p>Jetzt hast du den Vergleich zwischen deiner Kompetenzeinschätzung vor und nach der Absolvierung der ILIAS Kurse. Wenn der helle Balken niedriger ist als der dunklere, bedeutet das, dass du dich nach den ILIAS-Kursen besser einschätzt als zuvor. Ist der helle Balken höher als der dunklere ist es genau umgekehrt. Es ist auch möglich, dass du dich bei beiden Befragungen in gewissen Kompetenzbereichen gleich eingeschätzt hast: dann sind beide Balken gleich hoch.</p>
        <p><strong>Wie haben sich deine Kompetenzüberzeugungen nun verändert? Beschreibe, was du im Diagramm siehst und teile uns mit, welche Schlüsse du aus deiner Lernerfahrung ziehst.</strong></p>
        <textarea id="t2OpenEndedResponse" rows="4" style="width:100%;" required></textarea>
        <button id="submitT2OpenEndedResponse" class="btn btn-primary">Absenden</button>`
    }

    document.getElementById('surveyForm').innerHTML = resultHtml
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Hide progress elements
    document.getElementById('progressBar').style.display = 'none'
    document.getElementById('progressText').style.display = 'none'

    // Initialize chart
    if (Object.keys(updatedScores).length > 0) {
      createCompetencyChart1(initialScores, updatedScores)
    } else {
      createCompetencyChart1(initialScores, {})
    }

    // Add chart download handler
    document
      .getElementById('downloadChart')
      .addEventListener('click', downloadChart)

    // Add response submission handlers
    if (attemptNumber === 1) {
      document
        .getElementById('submitT1OpenEndedResponse')
        .addEventListener('click', submitT1OpenEndedResponse)
    } else {
      document
        .getElementById('submitT2OpenEndedResponse')
        .addEventListener('click', submitT2OpenEndedResponse)
    }

    // Hide navigation buttons
    hideNavigationButtons()
  } catch (error) {
    console.error('Error displaying results:', error)
    alert(
      'Es gab einen Fehler beim Laden der Ergebnisse. Bitte versuchen Sie es später erneut.'
    )
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
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(() => {
      // Store the response in userData
      if (!userData.openEndedResponses) {
        userData.openEndedResponses = {}
      }
      userData.openEndedResponses.t1_strategy = openEndedResponse

      // Get the existing chart canvas
      const existingChart = document.getElementById('competencyChart1')
      const chartContainer = existingChart.parentElement
      const chartData = {
        initialScores: JSON.parse(
          sessionStorage.getItem('initialScores') || '{}'
        ),
        updatedScores: JSON.parse(
          sessionStorage.getItem('updatedScores') || '{}'
        ),
      }

      // Disable inputs
      document.getElementById('submitT1OpenEndedResponse').disabled = true
      document.getElementById('t1OpenEndedResponse').disabled = true

      // Show course links
      showCourseLinks()

      // Recreate the chart to ensure it's visible
      createCompetencyChart1(chartData.initialScores, chartData.updatedScores)
    })
    .catch((error) => {
      console.error('Error:', error)
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      )
    })
}

// Function to handle T2 open-ended response submission
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
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(() => {
      document.getElementById('t2OpenEndedResponse').value = ''
      alert('Vielen Dank für Ihre Antwort!')
    })
    .catch((error) => {
      console.error('Error:', error)
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      )
    })
}

// Function to display course links
function showCourseLinks() {
  const courseLinksHtml = `
    <div class="course-links">
      <p>Nun ist es Zeit, deine digitalen Kompetenzen zu fördern. Hier kommst du zu den Kursen der jeweiligen Kompetenzbereiche. Klicke einfach auf den Link und du wirst zu ILIAS weitergeleitet.</p>
      <ul>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_121177&client_id=ilias_hro" target="_blank">Suchen, Verarbeiten und Aufbewahren</a></li>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122050&client_id=ilias_hro" target="_blank">Analysieren und Reflektieren</a></li>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_120680&client_id=ilias_hro" target="_blank">Kommunikation & Kollaboration</a></li>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122048&client_id=ilias_hro" target="_blank">Produzieren und Präsentieren</a></li>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122049&client_id=ilias_hro" target="_blank">Problemlösen und Handeln</a></li>
        <li><a href="https://ilias.uni-rostock.de/goto.php?target=crs_122051&client_id=ilias_hro" target="_blank">Schützen und sicher Agieren</a></li>
      </ul>
    </div>
  `

  // Insert after the submit button
  const submitButton =
    document.getElementById('submitT1OpenEndedResponse') ||
    document.getElementById('submitT2OpenEndedResponse')
  if (submitButton) {
    submitButton.insertAdjacentHTML('afterend', courseLinksHtml)
  } else {
    console.error('Submit button not found, cannot insert course links.')
  }
}

// Update Navigation Buttons Function
function updateNavigationButtons() {
  // First, ensure we have a container
  const container = document.querySelector('.container')
  if (!container) return

  // Always remove any existing navigation buttons first
  const existingNav = container.querySelector('.navigation-buttons')
  if (existingNav) {
    existingNav.remove()
  }

  // Don't show any buttons if survey is completed (results page)
  if (sessionStorage.getItem('surveyCompleted') === 'true') {
    return
  }

  // Create new navigation buttons container
  const navigationButtons = document.createElement('div')
  navigationButtons.className = 'navigation-buttons'

  // On Datenschutz page (currentSection === -1), show only Weiter button
  if (currentSection === -1) {
    navigationButtons.innerHTML = `
      <button type="button" id="nextButton" class="btn btn-primary">
        Weiter <i class="fas fa-chevron-right"></i>
      </button>
    `
  } else {
    // On all other pages, show all three buttons
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
  }

  // Append the buttons to container
  container.appendChild(navigationButtons)

  // Add event listeners to the newly created buttons
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')
  const saveButton = document.getElementById('saveProgressButton')

  // Only add event listeners if buttons exist
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

    // For T2, ensure we start at personal section
    const attemptNumber = parseInt(
      sessionStorage.getItem('attemptNumber') || '1'
    )
    if (attemptNumber > 1) {
      sessionStorage.setItem('currentSection', '0')
    }

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

function validateSection() {
  const form = document.getElementById('surveyForm')
  if (!form) return false
  const attemptNumber = userData.meta.attemptNumber
  const isT2 = attemptNumber > 1
  const isPersonalSection = currentSection === 0
  let isValid = true

  // Reset validation states
  form.querySelectorAll('.question').forEach((q) => {
    q.classList.remove('unanswered')
  })

  // For T2 personal section, only validate the feedback question
  if (isT2 && isPersonalSection) {
    const feedback = form.querySelector('[name="t2_course_feedback"]')
    if (!feedback || !feedback.value.trim()) {
      isValid = false
      const container = feedback.closest('.question') || feedback.parentElement
      container.classList.add('unanswered')
      alert('Bitte geben Sie Ihr Feedback zu den ILIAS-Kursen ein.')
    }
    return isValid
  }

  // Special handling for personal info section
  if (currentSection === 0) {
    // Handle hidden T2 fields
    const isT2 = attemptNumber > 1

    // Validate Lehramt dropdown
    const lehramtField = isT2
      ? form.querySelector('input[type="hidden"][name="q0_3"]')
      : form.querySelector('[name="q0_3"]')

    if (
      lehramtField &&
      lehramtField.offsetParent &&
      lehramtField.value === ''
    ) {
      isValid = false
      const container = lehramtField.closest('.question') || form
      container.classList.add('unanswered')
    }

    // Validate birth year
    const birthYearField = form.querySelector('[name="q0_1"]')
    if (birthYearField) {
      validateYear(birthYearField) // Force validation
      if (!birthYearField.checkValidity()) {
        isValid = false
        birthYearField.closest('.question').classList.add('unanswered')
      }
    }

    // Validate Fächer/Studien field
    const studienField = form.querySelector('[name="q0_4"], [name="q0_5"]')
    if (
      studienField &&
      studienField.offsetParent &&
      !studienField.value.trim()
    ) {
      isValid = false
      studienField.closest('.question').classList.add('unanswered')
    }
  }

  // Generic validation for all required fields
  let requiredFields = []
  form.querySelectorAll('[required]').forEach((field) => {
    // Skip hidden fields that have visible counterparts
    if (
      field.type === 'hidden' &&
      form.querySelector(`[name="${field.name}"]:not([type="hidden"])`)
    )
      return

    requiredFields.push(field)
  })

  requiredFields.forEach((field) => {
    if (
      field.offsetParent && // Only validate visible fields
      ((field.type === 'radio' &&
        !form.querySelector(`[name="${field.name}"]:checked`)) ||
        (field.type === 'checkbox' && !field.checked) ||
        (field.type !== 'radio' &&
          field.type !== 'checkbox' &&
          !field.value.trim()))
    ) {
      isValid = false
      const container = field.closest('.question') || field.parentElement
      container.classList.add('unanswered')
    }
  })

  if (!isValid) {
    const firstError = form.querySelector('.unanswered')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    alert('Bitte füllen Sie alle Pflichtfelder aus.')
  }

  return isValid
}

function validateDatenschutz() {
  const elements = [
    {
      el: document.getElementById('datenschutzKenntnis'),
      label: 'Datenschutzkenntnis',
    },
    {
      el: document.getElementById('datenschutzVerarbeitung'),
      label: 'Datenverarbeitung',
    },
    {
      el: document.getElementById('teilnahmeEinverstaendnis'),
      label: 'Teilnahmeeinverständnis',
    },
    { el: document.getElementById('unterschrift'), label: 'Unterschrift' },
  ]

  let isValid = true

  // Remove any existing error styling
  elements.forEach(({ el }) => {
    if (el?.parentElement) {
      el.parentElement.classList.remove('unanswered')
    }
  })

  elements.forEach(({ el, label }) => {
    if (!el) {
      console.error(`Element not found: ${label}`)
      isValid = false
      return
    }

    const isFieldValid =
      el.type === 'checkbox' ? el.checked : el.value.trim() !== ''
    if (!isFieldValid) {
      isValid = false
      if (el.parentElement) {
        el.parentElement.classList.add('unanswered')
      }
    }
  })

  // Validate signature length
  const signature = document.getElementById('unterschrift')?.value.trim()
  if (signature && signature.length < 3) {
    isValid = false
    const signatureEl = document.getElementById('unterschrift')
    if (signatureEl?.parentElement) {
      signatureEl.parentElement.classList.add('unanswered')
    }
  }

  if (!isValid) {
    return false
  }
  return true
}

function previousSection() {
  // Prevent going back to Datenschutz after completion
  if (currentSection === 0 && !userData.datenschutz) {
    currentSection = -1
    renderSection(currentSection)
    updateProgressBar()
  } else if (currentSection > 0) {
    currentSection--
    saveSectionData(false)
    renderSection(currentSection)
    updateProgressBar()
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Add this
  }
}

async function loadUserData(isNewAttempt = false) {
  try {
    const userId = sessionStorage.getItem('userId')
    if (!userId) {
      console.error('No userId found')
      window.location.href = 'login.html'
      return
    }

    const response = await fetch(`/api/user-data/${userId}`)
    let data

    // Handle new users (404) and existing users
    if (response.status === 404) {
      console.log('New user, initializing data')
      data = {
        userData: {
          t1: {},
          t2: {},
          meta: {
            attemptNumber: 1,
            currentSection: -1,
          },
        },
      }
    } else if (!response.ok) {
      throw new Error('Failed to load user data')
    } else {
      data = await response.json()
    }

    // Initialize userData with the full response data
    userData = data

    // For T2, ensure we start at personal section
    const attemptNumber = parseInt(
      sessionStorage.getItem('attemptNumber') || '1'
    )
    if (attemptNumber > 1) {
      userData.meta = {
        ...userData.meta,
        attemptNumber: 2,
        currentSection: 0, // Always start T2 at personal section
      }
      currentSection = 0
      console.log('T2: Starting at personal section')

      // Initialize t2 data structure if needed
      if (!userData.t2) {
        userData.t2 = {}
      }

      // Copy data from initialResponses for personal section
      if (userData.initialResponses) {
        Object.keys(userData.initialResponses).forEach((key) => {
          if (key.startsWith('q0_')) {
            userData.t2[key] = userData.initialResponses[key]
            // Also copy to t1 for compatibility with existing code
            if (!userData.t1) userData.t1 = {}
            userData.t1[key] = userData.initialResponses[key]
          }
        })
        console.log(
          'T2: Copied personal info:',
          JSON.stringify(userData.t2, null, 2)
        )
      } else if (userData.data) {
        // Fallback to data if initialResponses not found
        Object.keys(userData.data).forEach((key) => {
          if (key.startsWith('q0_')) {
            userData.t2[key] = userData.data[key]
            if (!userData.t1) userData.t1 = {}
            userData.t1[key] = userData.data[key]
          }
        })
        console.log(
          'T2: Copied from data:',
          JSON.stringify(userData.t2, null, 2)
        )
      } else {
        console.warn('No data found to copy from')
      }
    } else {
      userData.meta = {
        ...userData.meta,
        attemptNumber: 1,
        currentSection: isNewAttempt ? -1 : userData.meta?.currentSection || -1,
      }
      currentSection = userData.meta.currentSection
    }

    console.log('Current section:', currentSection)

    renderSection(currentSection)
    updateProgressBar()
    updateNavigationButtons()
  } catch (error) {
    console.error('Error loading user data:', error)
    // For new users, just start fresh instead of showing error
    if (error.message === 'Failed to load user data') {
      userData = {
        t1: {},
        t2: {},
        meta: {
          attemptNumber: 1,
          currentSection: -1,
        },
      }
      currentSection = -1
      renderSection(currentSection)
      updateProgressBar()
      updateNavigationButtons()
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load user data. Please try again.',
      }).then(() => {
        window.location.href = 'login.html'
      })
    }
  }
}

function validateYear(input) {
  // Remove non-digits and enforce 4 characters
  input.value = input.value.replace(/\D/g, '').slice(0, 4)

  const currentYear = new Date().getFullYear()
  const isValid =
    input.value.length === 4 &&
    parseInt(input.value) >= 1900 &&
    parseInt(input.value) <= currentYear

  // Set validation messages
  if (input.value === '') {
    input.setCustomValidity('Bitte geben Sie Ihr Geburtsjahr ein.')
  } else if (!isValid) {
    input.setCustomValidity(
      `Geben Sie ein Jahr zwischen 1900 und ${currentYear} ein.`
    )
  } else {
    input.setCustomValidity('')
  }

  // Visual feedback
  input.style.borderColor = isValid ? '' : 'red'
  input.reportValidity()
}

function handleScaleClick(event) {
  const button = event.target
  const radio = button.previousElementSibling
  if (radio && radio.type === 'radio') {
    radio.checked = true
    radio.dispatchEvent(new Event('change'))
  }
}

function handleScaleKeydown(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    const radio = event.target.previousElementSibling
    if (radio && radio.type === 'radio') {
      radio.checked = true
      radio.dispatchEvent(new Event('change'))
    }
    event.target.setAttribute('aria-checked', 'true')
  }
}

window.handleScaleClick = handleScaleClick
window.handleScaleKeydown = handleScaleKeydown

// Helper function to render conditional fields
function renderConditionalField(
  section,
  question,
  index,
  fieldType,
  isT2 = false
) {
  const questionId = `q${section.questions.indexOf(question)}_${index}`
  const savedValue =
    userData.initialResponses?.[questionId] || userData[questionId] || ''

  // Special handling for subjects field
  if (fieldType === 'Fächer') {
    return `
      <div class="conditional-question">
        <label>${section.questions[index].text}</label>
        <div class="prefilled-field">
          <input type="text" 
                 name="${questionId}" 
                 value="${savedValue}"
                 ${isT2 ? 'readonly' : ''}
                 ${section.questions[index].required ? 'required' : ''}>
        </div>
      </div>
    `
  }

  // Handling for Lehramt (teaching degree) field
  if (fieldType === 'Lehramt') {
    return `
      <div class="conditional-question">
        <label>${section.questions[index].text}</label>
        <input type="text" 
               name="${questionId}" 
               value="${savedValue}"
               ${isT2 ? 'readonly' : ''}
               ${section.questions[index].required ? 'required' : ''}>
      </div>
    `
  }

  // Default handling
  return `
    <div class="conditional-question">
      <label>${section.questions[index].text}</label>
      <input type="${section.questions[index].type}" 
             name="${questionId}" 
             value="${savedValue}"
             ${section.questions[index].required ? 'required' : ''}>
    </div>
  `
}

function removeUnansweredMarkers() {
  const unansweredQuestions = document.querySelectorAll('.question.unanswered')
  unansweredQuestions.forEach((question) => {
    question.classList.remove('unanswered')
  })
}

function calculateCompetenzScore(scores) {
  const scoreValues = Object.values(scores)
  if (scoreValues.length === 0) return 0
  const total = scoreValues.reduce((acc, val) => acc + val, 0)
  return Math.round(total / scoreValues.length)
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

function hideNavigationButtons() {
  const navContainer = document.querySelector('.navigation-buttons')
  if (navContainer) {
    navContainer.style.display = 'none'
  }
  // Also hide individual buttons if they exist
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')
  const saveButton = document.getElementById('saveProgressButton')
  if (prevButton) prevButton.style.display = 'none'
  if (nextButton) nextButton.style.display = 'none'
  if (saveButton) saveButton.style.display = 'none'
}

function handleTeachingStudentChange(radio) {
  const container = radio.closest('.radio-group')
  const selectedValue = radio.value
  const attemptNumber = parseInt(sessionStorage.getItem('attemptNumber') || '1')
  const isT2 = attemptNumber > 1
  const form = document.getElementById('surveyForm')

  // Hide all conditional fields and reset inputs
  container.querySelectorAll('.conditional-field').forEach((field) => {
    field.style.display = 'none'

    // Only clear values for T1 attempts
    if (!isT2) {
      field.querySelectorAll('input, select').forEach((input) => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
          input.value = ''
        }
        input.required = false
      })
    }
  })

  // Show target conditional field
  const targetField = container.querySelector(
    `.conditional-field[data-condition="${selectedValue}"]`
  )

  if (targetField) {
    targetField.style.display = 'block'

    // T2 specific handling
    if (isT2) {
      targetField.querySelectorAll('input, select').forEach((input) => {
        const questionId = input.name
        const t1Value = userData.t1[questionId] || ''

        // Preserve T1 values
        if (input.type === 'radio' || input.type === 'checkbox') {
          input.checked = input.value === t1Value
        } else {
          input.value = t1Value
        }

        // Special handling for Fächer (q0_4)
        if (questionId === 'q0_4') {
          input.readOnly = false
          input.style.backgroundColor = '#fff'
        } else {
          input.readOnly = true
          input.style.backgroundColor = '#f0f0f0'
        }

        // Handle dropdown preservation
        if (input.tagName === 'SELECT') {
          input.disabled = true
          if (!input.nextElementSibling?.name === questionId) {
            input.insertAdjacentHTML(
              'afterend',
              `<input type="hidden" name="${questionId}" value="${t1Value}">`
            )
          }
        }
      })
    }
    // T1 handling
    else {
      targetField.querySelectorAll('input, select').forEach((input) => {
        input.required = true
        input.disabled = false
        input.readOnly = false
        input.style.backgroundColor = ''
      })
    }
  }

  // Trigger validation and auto-save for T1
  if (!isT2) {
    form.reportValidity()
    setTimeout(() => saveSectionData(false), 300)
  }
}

window.onload = function () {
  // Check if survey was completed
  const isCompleted = sessionStorage.getItem('surveyCompleted') === 'true'
  const userId = sessionStorage.getItem('userId')

  if (isCompleted && userId) {
    // Ensure the survey form is cleared before showing results
    const form = document.getElementById('surveyForm')
    if (form) form.innerHTML = ''

    fetch(`/api/user-data/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (!data) {
          throw new Error('No data received')
        }
        userData = data
        showResults()
      })
      .catch((error) => {
        console.error('Error loading completed survey:', error)
        // On error, start from beginning
        sessionStorage.removeItem('surveyCompleted')
        currentSection = -1
        initializeSections()
      })
  } else {
    currentSection = -1
    initializeSections()
  }
}

// Add CSS for T2 disabled radio buttons
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  .radio-option input[type="radio"]:disabled:checked + .radio-checkmark {
    background-color: #0066cc;
    border-color: #0066cc;
  }
  .radio-option input[type="radio"]:disabled + .radio-checkmark {
    opacity: 0.7;
    cursor: not-allowed;
  }
`
document.head.appendChild(styleSheet)
