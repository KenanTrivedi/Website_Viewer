document.addEventListener('DOMContentLoaded', function () {
  setupNavigationButtons()
  handleCodeGenerationFormSubmission()
  handleLoginFormSubmission()
  displayGeneratedCode()
  setupLogoutFunctionality()
  initializeFlatpickr()
  loadStoredSurveyData()
  setupSurveyDataPersistence()
})

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

function handleCodeGenerationFormSubmission() {
  const form = document.getElementById('generateCodeForm')
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault()
      if (validateFormInputs(form)) {
        const code = generateCodeFromForm(form)
        const response = await submitForm('/register', { code })
        if (response.ok) {
          sessionStorage.setItem('generatedCode', code)
          window.location.href = 'codeConfirmation.html'
        } else {
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
  const birthplace = document.getElementById('birthplace').value.toUpperCase()
  const motherName = document.getElementById('motherName').value.toUpperCase()
  const birthday = document.getElementById('birthday').value
  const school = document.getElementById('school').value.toUpperCase()
  return `${birthplace}-${motherName}-${birthday}-${school}`
}

async function submitForm(url, data) {
  return await fetch(url, {
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
          const data = await response.json()
          sessionStorage.setItem('userId', data.userId)
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
    logoutButton.addEventListener('click', function () {
      sessionStorage.clear()
      window.location.href = 'login.html'
    })
  }
}

function initializeFlatpickr() {
  flatpickr('#birthyear', {
    dateFormat: 'Y',
    maxDate: new Date().getFullYear().toString(),
    minDate: '1900',
    defaultDate: '2000',
  })
}

function displayGeneratedCode() {
  const codeDisplayElement = document.getElementById('personalCodeDisplay')
  const generatedCode = sessionStorage.getItem('generatedCode')

  if (codeDisplayElement && generatedCode) {
    codeDisplayElement.textContent = `Your generated code is: ${generatedCode}`
  } else if (codeDisplayElement) {
    codeDisplayElement.textContent = 'No code available or session expired.'
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
      if (field.type === 'radio') {
        if (field.value === data[key]) field.checked = true
      } else {
        field.value = data[key]
      }
    }
  }
}

function setupSurveyDataPersistence() {
  const surveyForm = document.getElementById('surveyForm')
  if (surveyForm) {
    surveyForm.addEventListener('input', function () {
      const data = Object.fromEntries(new FormData(surveyForm))
      localStorage.setItem('surveyData', JSON.stringify(data))
    })
  }
}
