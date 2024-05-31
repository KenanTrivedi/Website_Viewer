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
  form.addEventListener('submit', async function (event) {
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

      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (response.ok) {
          sessionStorage.setItem('generatedCode', code)
          window.location.href = 'codeConfirmation.html'
        } else {
          alert('Error registering code.')
        }
      } catch (error) {
        alert('Error registering code.')
      }
    }
  })
}

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

const personalCodeDisplay = document.getElementById('personalCodeDisplay')
if (personalCodeDisplay) {
  const generatedCode = sessionStorage.getItem('generatedCode')
  if (generatedCode) {
    personalCodeDisplay.textContent = `Ihr persönlicher Code ist: ${generatedCode}`
    sessionStorage.removeItem('generatedCode')
  } else {
    personalCodeDisplay.textContent =
      'Es wurde kein Code generiert oder der Code ist abgelaufen.'
  }
}

const loginForm = document.getElementById('loginForm')
if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault()
    const loginCode = document.getElementById('loginCode').value

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginCode }),
      })

      if (response.ok) {
        sessionStorage.setItem('userCode', loginCode) // Store user code in session
        window.location.href = 'survey.html' // Redirect to the survey page upon successful login
      } else {
        alert('Invalid code')
      }
    } catch (error) {
      alert('Error logging in.')
    }
  })
}

// Display user code on survey.html and handle logout
document.addEventListener('DOMContentLoaded', function () {
  const userCodeDisplay = document.getElementById('userCodeDisplay')
  const userCode = sessionStorage.getItem('userCode')
  if (userCodeDisplay && userCode) {
    userCodeDisplay.textContent = `Code: ${userCode}`
  }

  const logoutButton = document.getElementById('logoutButton')
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      sessionStorage.removeItem('userCode')
      window.location.href = 'login.html'
    })
  }

  const nextButton = document.getElementById('nextButton')
  const progressBar = document.getElementById('progressBar')
  let progress = 10 // Initial progress

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      // Logic to move to the next part of the survey
      progress += 10 // Increment progress
      if (progress > 100) progress = 100 // Ensure it doesn't exceed 100%
      progressBar.style.width = `${progress}%`
    })
  }
})
