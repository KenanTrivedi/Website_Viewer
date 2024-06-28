document.addEventListener('DOMContentLoaded', function () {
  // Navigation Button Handlers
  setupNavigationButtons()

  // Form Submissions
  handleCodeGenerationFormSubmission()
  handleLoginFormSubmission()

  // Logout Functionality
  setupLogoutFunctionality()

  // Survey Data Management
  loadStoredSurveyData()
  setupSurveyDataPersistence()
})

function setupNavigationButtons() {
  const buttons = ['letsGetStarted', 'startSurvey']
  buttons.forEach((buttonId) => {
    const button = document.getElementById(buttonId)
    if (button) {
      button.addEventListener('click', () => {
        window.location.href = 'login.html'
      })
    }
  })
}

function handleCodeGenerationFormSubmission() {
  const form = document.getElementById('generateCodeForm')
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault()
      if (validateFormInputs(form)) {
        const code = generateCodeFromForm(form)
        try {
          const response = await submitForm('/register', { code })
          if (response.ok) {
            sessionStorage.setItem('generatedCode', code)
            window.location.href = 'codeConfirmation.html'
          } else {
            alert('Error registering code.')
          }
        } catch (error) {
          console.error('Fetch error:', error)
          alert('Error registering code.')
        }
      }
    })
  }
}

function validateFormInputs(form) {
  const inputs = form.querySelectorAll('input[type="text"]')
  let isValid = true
  inputs.forEach((input) => {
    if (input.value.length !== 2) {
      alert(
        `Bitte geben Sie genau zwei Zeichen für ${input.previousElementSibling.textContent} ein.`
      )
      isValid = false
    }
  })
  return isValid
}

function generateCodeFromForm(form) {
  const birthplace = form.birthplace.value.toUpperCase()
  const motherName = form.motherName.value.toUpperCase()
  const birthday = form.birthday.value
  const school = form.school.value.toUpperCase()
  return `${birthplace}-${motherName}-${birthday}-${school}`
}

async function submitForm(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

function handleLoginFormSubmission() {
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault()
      const loginCode = loginForm.loginCode.value
      try {
        const response = await submitForm('/login', { code: loginCode })
        if (response.ok) {
          sessionStorage.setItem('loginCode', loginCode)
          window.location.href = 'survey.html'
        } else {
          alert('Invalid code')
        }
      } catch (error) {
        console.error('Login error:', error)
        alert('Error logging in.')
      }
    })
  }
}

function setupLogoutFunctionality() {
  const logoutButton = document.getElementById('logoutButton')
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.clear()
      window.location.href = 'login.html'
    })
  }
}

function loadStoredSurveyData() {
  const surveyForm = document.getElementById('surveyForm')
  if (surveyForm) {
    const storedData = JSON.parse(localStorage.getItem('surveyData'))
    if (storedData) {
      populateFormFields(surveyForm, storedData)
    }
  }
}

function populateFormFields(form, data) {
  for (const key in data) {
    const field = form.querySelector(`[name="${key}"]`)
    if (field) {
      field.value = data[key]
      if (field.type === 'radio' && field.value === data[key]) {
        field.checked = true
      }
    }
  }
}

function setupSurveyDataPersistence() {
  const surveyForm = document.getElementById('surveyForm')
  if (surveyForm) {
    surveyForm.addEventListener('input', () => {
      const data = Object.fromEntries(new FormData(surveyForm))
      localStorage.setItem('surveyData', JSON.stringify(data))
    })
  }
}
