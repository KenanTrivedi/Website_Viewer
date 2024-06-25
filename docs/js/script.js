document.addEventListener('DOMContentLoaded', function () {
  // Navigation Button Handlers
  const letsGetStartedBtn = document.getElementById('letsGetStarted')
  const startSurveyBtn = document.getElementById('startSurvey')

  if (letsGetStartedBtn) {
    letsGetStartedBtn.addEventListener('click', function () {
      window.location.href = 'login.html'
    })
  }

  if (startSurveyBtn) {
    startSurveyBtn.addEventListener('click', function () {
      window.location.href = 'login.html'
    })
  }

  // Form Submission for Code Generation
  const form = document.getElementById('generateCodeForm')
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault()
      let isValid = true
      const inputs = document.querySelectorAll(
        '#generateCodeForm input[type="text"]'
      )

      // Validate input length
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
          console.error('Fetch error:', error)
          alert('Error registering code.')
        }
      }
    })

    // Limit input length dynamically
    const inputs = form.querySelectorAll('input[type="text"]')
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (input.value.length > 2) {
          input.value = input.value.slice(0, 2)
        }
      })
    })
  }

  // Display Generated Code on Confirmation Page
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

  // Login Form Submission
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
})
