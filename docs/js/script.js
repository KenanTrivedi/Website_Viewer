document.addEventListener('DOMContentLoaded', function () {
  setupNavigationButtons()
  setupCodeGenerationForm() // Set up the form
  handleCodeGenerationFormSubmission()
  handleLoginFormSubmission()
  displayGeneratedCode()
  setupLogoutFunctionality()
  setupLoginPageFunctionality()
  setupStartSurveyButton()

  if (document.getElementById('birthyear')) {
    initializeFlatpickr()
  }

  // Only load and set up survey data if we're on the survey page
  if (document.getElementById('surveyForm')) {
    loadStoredSurveyData()
    setupSurveyDataPersistence()
  }
})

function setupCodeGenerationForm() {
  const form = document.getElementById('generateCodeForm')
  if (form) {
    form.addEventListener('submit', handleCodeGenerationFormSubmission)
  }
}

function setupNavigationButtons() {
  const buttons = ['letsGetStarted', 'startSurvey']
  buttons.forEach((buttonId) => {
    const button = document.getElementById(buttonId)
    if (button) {
      button.addEventListener('click', function () {
        window.location.href = 'login.html'
      })
    }
  })
}

async function handleCodeGenerationFormSubmission(event) {
  event.preventDefault()
  const form = event.target
  if (validateFormInputs(form)) {
    const code = generateCodeFromForm(form)
    try {
      const response = await submitForm('/register', { code })
      const data = await response.json()

      if (response.ok) {
        sessionStorage.setItem('userId', data.userId)
        sessionStorage.setItem('generatedCode', code)
        window.location.href = 'codeConfirmation.html'
      } else {
        if (data.isDuplicateCode) {
          alert(
            'Dieser Code existiert bereits. Bitte verwenden Sie stattdessen die Initialen Ihres Vaters für den zweiten Teil des Codes.'
          )
          updateParentFieldForFather()
        } else {
          alert(
            'Fehler beim Registrieren des Codes: ' +
              (data.message || 'Unbekannter Fehler')
          )
        }
      }
    } catch (error) {
      console.error('Error registering code:', error)
      alert(
        'Es gab einen Fehler bei der Registrierung. Bitte versuchen Sie es später erneut.'
      )
    }
  }
}

function updateParentFieldForFather() {
  const parentLabel = document.getElementById('parentLabel')
  const parentInstructions = document.getElementById('parentInstructions')
  const parentNameInput = document.getElementById('parentName')

  if (parentLabel && parentInstructions && parentNameInput) {
    parentLabel.textContent =
      'Vorname des Vaters / Ihres Erziehungsberechtigten'
    parentInstructions.textContent =
      'Bitte geben Sie den ersten und letzten Buchstaben des Vornamens Ihres Vaters ein. Bsp.: Thomas = TS'
    parentNameInput.value = '' // Clear the input field
    parentNameInput.focus() // Set focus to the input field
  }
}

function validateFormInputs(form) {
  const inputs = form.querySelectorAll('input[type="text"]')
  let isValid = true
  inputs.forEach((input) => {
    if (input.value.trim().length !== 2) {
      alert(
        `Bitte geben Sie genau zwei Zeichen für ${input.previousElementSibling.textContent.trim()} ein.`
      )
      isValid = false
    }
  })
  return isValid
}

function generateCodeFromForm(form) {
  const birthplace = document.getElementById('birthplace').value.toUpperCase()
  const parentName = document.getElementById('parentName').value.toUpperCase() // 'motherName' to 'parentName'
  const birthday = document.getElementById('birthday').value
  const school = document.getElementById('school').value.toUpperCase()
  return `${birthplace}-${parentName}-${birthday}-${school}`
}

async function submitForm(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      // Return the response even if not ok to handle it in the caller
      return { ok: false, ...errorData }
    }

    return { ok: true, ...(await response.json()) }
  } catch (error) {
    console.error('Error submitting form:', error)
    throw error
  }
}

function handleLoginFormSubmission() {
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault()
      await handleLogin()
    })
  }
}

async function handleLogin() {
  const courses = document.getElementById('courses').value.trim()
  const loginCode = document.getElementById('loginCode').value.trim()

  if (!loginCode) {
    alert('Bitte geben Sie Ihren persönlichen Code ein.')
    return
  }

  try {
    const response = await submitForm('/login', { code: loginCode, courses })
    const data = response

    if (response.ok) {
      sessionStorage.clear()
      sessionStorage.setItem('userId', data.userId)
      sessionStorage.setItem('isNewUser', data.isNewUser)
      sessionStorage.setItem('courses', JSON.stringify(data.courses))

      if (data.data && data.data.responses) {
        sessionStorage.setItem(
          'surveyData',
          JSON.stringify(data.data.responses)
        )
        sessionStorage.setItem(
          'initialScores',
          JSON.stringify(data.initialScores || {})
        )
        sessionStorage.setItem(
          'updatedScores',
          JSON.stringify(data.updatedScores || {})
        )
      }

      console.log('User data stored in session storage')
      window.location.href = 'survey.html'
    } else {
      alert(`Login fehlgeschlagen: ${data.message}`)
    }
  } catch (error) {
    console.error('Login error:', error)
    alert('Fehler beim Einloggen. Bitte versuchen Sie es später erneut.')
  }
}

function setupLogoutFunctionality() {
  const logoutButton = document.getElementById('logoutButton')
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      sessionStorage.clear()
      window.location.href = 'login.html'
    })
  }
}

// Add a function to check if the user is new or returning
function isNewUser() {
  return sessionStorage.getItem('isNewUser') === 'true'
}

function initializeFlatpickr() {
  if (typeof flatpickr === 'function') {
    flatpickr('#birthyear', {
      dateFormat: 'Y',
      maxDate: new Date().getFullYear().toString(),
      minDate: '1900',
      defaultDate: '2000',
    })
  } else {
    console.warn(
      'Flatpickr ist nicht geladen. Die Funktionalität des Datumswählers kann eingeschränkt sein.'
    )
  }
}

function displayGeneratedCode() {
  const codeDisplayElement = document.getElementById('personalCodeDisplay')
  const generatedCode = sessionStorage.getItem('generatedCode')

  if (codeDisplayElement && generatedCode) {
    codeDisplayElement.textContent = `Dein generierter Code ist: ${generatedCode}`
  } else if (codeDisplayElement) {
    codeDisplayElement.textContent =
      'Kein Code verfügbar oder Sitzung abgelaufen.'
  }
}

function setupStartSurveyButton() {
  const startSurveyButton = document.getElementById('startSurveyButton')
  if (startSurveyButton) {
    startSurveyButton.addEventListener('click', function () {
      window.location.href = 'survey.html'
    })
  }
}

function loadStoredSurveyData() {
  const surveyForm = document.getElementById('surveyForm')
  const storedData = sessionStorage.getItem('surveyData')
  if (surveyForm && storedData) {
    const data = JSON.parse(storedData)
    populateFormFields(surveyForm, data)
  }
}

function populateFormFields(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`)
    if (field) {
      if (field.type === 'radio') {
        const radioButton = form.querySelector(
          `[name="${key}"][value="${value}"]`
        )
        if (radioButton) radioButton.checked = true
      } else {
        field.value = value
      }
    }
  })
}

function saveUserData(userId, data, isComplete = false) {
  const categoryScores = calculateCategoryScores(data)
  fetch('/api/save-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      data: {
        responses: data,
      },
      isComplete: isComplete,
      categoryScores: categoryScores,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to save data')
      }
      return response.json()
    })
    .then((result) => {
      console.log('Data saved successfully:', result)
      sessionStorage.setItem('surveyData', JSON.stringify(data))
      sessionStorage.setItem(
        'initialScores',
        JSON.stringify(result.initialScores)
      )
      sessionStorage.setItem(
        'updatedScores',
        JSON.stringify(result.updatedScores)
      )
    })
    .catch((error) => {
      console.error('Fehler beim Speichern der Benutzerdaten:', error)
    })
}

function calculateCategoryScores(data) {
  const categoryScores = {}
  const maxScorePerQuestion = 6 // Assuming the scale is 0-6

  surveyData.forEach((section, sectionIndex) => {
    if (section.title !== 'Persönliche Angaben') {
      let totalScore = 0
      let questionCount = 0

      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`
        if (data[questionId] && question.type === 'scale') {
          totalScore += parseInt(data[questionId], 10)
          questionCount++
        }
      })

      if (questionCount > 0) {
        const maxPossibleScore = questionCount * maxScorePerQuestion
        categoryScores[section.title] = Math.round(
          (totalScore / maxPossibleScore) * 100
        )
      } else {
        categoryScores[section.title] = 0
      }
    }
  })

  return categoryScores
}

function setupSurveyDataPersistence() {
  const surveyForm = document.getElementById('surveyForm')
  const userId = sessionStorage.getItem('userId')
  if (surveyForm && userId) {
    // Load existing data if available
    const storedData = sessionStorage.getItem('surveyData')
    if (storedData) {
      const data = JSON.parse(storedData)
      populateFormFields(surveyForm, data)
    }

    // Set up event listener for input changes
    surveyForm.addEventListener('input', function () {
      const data = Object.fromEntries(new FormData(surveyForm))
      saveUserData(userId, data)
    })

    // Set up event listener for form submission
    surveyForm.addEventListener('submit', function (event) {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(surveyForm))
      saveUserData(userId, data, true) // true indicates survey completion

      // Use the existing showResults function from survey.js
      if (typeof showResults === 'function') {
        showResults()
      } else {
        console.error(
          'showResults function not found. Make sure survey.js is loaded correctly.'
        )
        alert('Vielen Dank für das Ausfüllen der Umfrage!')
      }
    })
  }
}

function setupLoginPageFunctionality() {
  const surveyCompletedRadios = document.querySelectorAll(
    'input[name="surveyCompleted"]'
  )
  const coursesList = document.getElementById('coursesList')
  const codeInput = document.getElementById('codeInput')
  const loginButton = document.getElementById('loginButton')
  const generateCodeButton = document.getElementById('generateCodeButton')

  // Check if we're on the login page
  if (
    surveyCompletedRadios.length === 0 ||
    !coursesList ||
    !codeInput ||
    !loginButton ||
    !generateCodeButton
  ) {
    return // Exit if we're not on the login page
  }

  const questionElement = document.querySelector('label[for="surveyCompleted"]')
  if (questionElement) {
    questionElement.textContent =
      'Haben Sie den Fragebogen schon einmal ausgefüllt, also bereits Fortbildungen auf ILIAS absolviert?'
  }

  // Update the courses input
  const coursesInput = document.getElementById('courses')
  if (coursesInput) {
    coursesInput.style.height = '100px' // Make the input box bigger
    coursesInput.placeholder =
      'Bitte geben Sie die Namen der Kurse oder eindeutige Stichworte zur Kursidentifizierung ein.'
  }

  surveyCompletedRadios.forEach((radio) => {
    radio.addEventListener('change', function () {
      if (this.value === 'yes') {
        coursesList.style.display = 'block'
        codeInput.style.display = 'block'
        generateCodeButton.style.display = 'none'
        checkInputsAndToggleLoginButton()
      } else {
        coursesList.style.display = 'none'
        codeInput.style.display = 'none'
        loginButton.style.display = 'none'
        generateCodeButton.style.display = 'block'
      }
    })
  })

  // Add input event listeners to check when fields are filled
  const coursesField = document.getElementById('courses')
  const loginCodeField = document.getElementById('loginCode')

  if (coursesField && loginCodeField) {
    coursesField.addEventListener('input', checkInputsAndToggleLoginButton)
    loginCodeField.addEventListener('input', checkInputsAndToggleLoginButton)
  }

  loginButton.addEventListener('click', handleLogin)
  generateCodeButton.addEventListener('click', function () {
    window.location.href = 'generateCode.html'
  })
}

function checkInputsAndToggleLoginButton() {
  const courses = document.getElementById('courses').value.trim()
  const loginCode = document.getElementById('loginCode').value.trim()
  const loginButton = document.getElementById('loginButton')

  if (courses && loginCode) {
    loginButton.style.display = 'block'
  } else {
    loginButton.style.display = 'none'
  }
}

// Make sure surveyData is available
if (typeof surveyData === 'undefined') {
  console.error(
    'surveyData is not defined. Please ensure it is loaded before using this script.'
  )
}
