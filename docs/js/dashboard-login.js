document
  .getElementById('loginForm')
  .addEventListener('submit', async function (e) {
    e.preventDefault()
    const userId = document.getElementById('userId').value
    const password = document.getElementById('password').value

    try {
      const response = await fetch('/api/dashboard-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('dashboardToken', data.token)
        window.location.href = '/dashboard'
      } else {
        alert('Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('An error occurred during login')
    }
  })
