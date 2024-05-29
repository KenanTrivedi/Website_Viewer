document.addEventListener('DOMContentLoaded', function () {
  const letsGetStartedBtn = document.getElementById('letsGetStarted')
  const startSurveyBtn = document.getElementById('startSurvey')

  if (letsGetStartedBtn) {
    letsGetStartedBtn.addEventListener('click', function () {
      window.location.href = 'login.html' // Redirect to the login page
    })
  }

  if (startSurveyBtn) {
    startSurveyBtn.addEventListener('click', function () {
      window.location.href = 'login.html' // Also redirect to the login page to start the survey
    })
  }
})

// Handle code generation form submission
const form = document.getElementById('generateCodeForm')
if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    let isValid = true
    const inputs = document.querySelectorAll(
      '#generateCodeForm input[type="text"]'
    )

    inputs.forEach((input) => {
      if (input.value.length !== 2) {
        alert(
          `Bitte geben Sie genau zwei Zeichen für ${input.previousElementSibling.textContent} ein.`
        )
        isValid = false
      }
    })

    if (isValid) {
      const birthplace = document
        .getElementById('birthplace')
        .value.toUpperCase()
      const motherName = document
        .getElementById('motherName')
        .value.toUpperCase()
      const birthday = document.getElementById('birthday').value
      const school = document.getElementById('school').value.toUpperCase()
      const code = `${birthplace}-${motherName}-${birthday}-${school}`
      sessionStorage.setItem('generatedCode', code)
      window.location.href = 'codeConfirmation.html'
    }
  })
}

// Immediate feedback for inputs within the generate code form
if (form) {
  const inputs = form.querySelectorAll('input[type="text"]')
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      if (input.value.length > 2) {
        input.value = input.value.slice(0, 2)
      }
    })
  })
}

// Display the generated code on the codeConfirmation.html page
const personalCodeDisplay = document.getElementById('personalCodeDisplay')
if (personalCodeDisplay) {
  const generatedCode = sessionStorage.getItem('generatedCode')
  if (generatedCode) {
    personalCodeDisplay.textContent = `Ihr persönlicher Code ist: ${generatedCode}`
    sessionStorage.removeItem('generatedCode') // Clean up session storage
  } else {
    personalCodeDisplay.textContent =
      'Es wurde kein Code generiert oder der Code ist abgelaufen.'
  }
}

// Handle Login Form Submission
document
  .getElementById('loginForm')
  ?.addEventListener('submit', async function (event) {
    event.preventDefault()
    const loginCode = document.getElementById('loginCode').value

    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: loginCode }),
    })

    if (response.ok) {
      window.location.href = 'survey.html'
    } else {
      alert('Invalid code')
    }
  })
