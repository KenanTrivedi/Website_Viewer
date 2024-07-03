let currentSection = 0
let userData = {}

document.addEventListener('DOMContentLoaded', function () {
  loadUserData()
  populateSectionDropdown()
  renderSection(currentSection)
  updateProgressBar()
  document
    .getElementById('prevButton')
    .addEventListener('click', previousSection)
  document.getElementById('nextButton').addEventListener('click', nextSection)
  document.getElementById('logoutButton').addEventListener('click', logout)
  document
    .getElementById('saveProgressButton')
    .addEventListener('click', saveAndResumeLater)
  document
    .getElementById('section-select')
    .addEventListener('change', handleSectionChange)

  // Check for resume token
  const resumeToken = localStorage.getItem('surveyResumeToken')
  if (resumeToken) {
    const { userId, section } = JSON.parse(atob(resumeToken))
    if (userId === sessionStorage.getItem('userId')) {
      currentSection = parseInt(section)
      renderSection(currentSection)
      updateProgressBar()
      localStorage.removeItem('surveyResumeToken')
    }
  }
})

function loadUserData() {
  const userId = sessionStorage.getItem('userId')
  if (userId) {
    fetch(`/api/user-data/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        userData = data.data || {}
        renderSection(currentSection)
      })
      .catch((error) => console.error('Error loading user data:', error))
  }
}

function renderSection(index) {
  const section = surveyData[index]
  let html = `<div class="section"><h2>${section.title}</h2>`

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`
    const savedValue = userData[questionId] || ''

    html += `<div class="question"><p>${question.text}</p>`

    if (question.type === 'radio') {
      question.options.forEach((option) => {
        html += `<label><input type="radio" name="${questionId}" value="${option}" ${
          savedValue === option ? 'checked' : ''
        } required> ${option}</label><br>`
      })
    } else if (question.type === 'number') {
      html += `
                <div class="input-container">
                    <input type="number" id="${questionId}" name="${questionId}" value="${savedValue}" min="${question.min}" max="${question.max}" required>
                    <label for="${questionId}" class="floating-label">Enter a number</label>
                </div>`
    } else if (question.type === 'scale') {
      html += `<div class="rating-scale" role="group" aria-label="Competency scale from 0 to 6">`
      for (let i = 0; i <= 6; i++) {
        html += `
                    <label class="scale-label">
                        <input type="radio" name="${questionId}" value="${i}" ${
          savedValue == i ? 'checked' : ''
        } required>
                        <span class="scale-button" role="radio" aria-checked="${
                          savedValue == i
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
    }

    html += `</div>`
  })

  html += `</div>`
  document.getElementById('surveyForm').innerHTML = html

  // Add event listeners for keyboard navigation on scale buttons
  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('keydown', handleScaleKeydown)
  })

  updateNavigationButtons()
  window.scrollTo(0, 0)
}

function handleScaleKeydown(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    event.target.previousElementSibling.checked = true
    event.target.setAttribute('aria-checked', 'true')
  }
}

function updateProgressBar() {
  const progress = ((currentSection + 1) / surveyData.length) * 100
  const progressFill = document.getElementById('progressFill')
  const progressText = document.getElementById('progressText')

  progressFill.style.width = `${progress}%`
  progressText.textContent = `Abschnitt ${currentSection + 1} von ${
    surveyData.length
  }`

  // Update ARIA attributes for accessibility
  progressFill.setAttribute('aria-valuenow', currentSection + 1)
  progressFill.setAttribute('aria-valuemax', surveyData.length)
}

function saveSectionData() {
  const formData = new FormData(document.getElementById('surveyForm'))
  for (let [key, value] of formData.entries()) {
    userData[key] = value
  }

  const userId = sessionStorage.getItem('userId')
  if (userId) {
    fetch('/api/save-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, data: userData }),
    })
      .then((response) => response.json())
      .then((data) => console.log('Data saved successfully:', data))
      .catch((error) => console.error('Error saving data:', error))
  }
}

function saveAndResumeLater() {
  saveSectionData()
  const resumeToken = btoa(
    JSON.stringify({
      userId: sessionStorage.getItem('userId'),
      section: currentSection,
    })
  )
  localStorage.setItem('surveyResumeToken', resumeToken)
  alert(
    'Ihr Fortschritt wurde gespeichert. Sie können später mit demselben Login fortfahren.'
  )
  window.location.href = 'index.html'
}

function previousSection() {
  if (currentSection > 0) {
    saveSectionData()
    currentSection--
    renderSection(currentSection)
    updateProgressBar()
  }
}

function nextSection() {
  if (validateSection()) {
    saveSectionData()
    if (currentSection < surveyData.length - 1) {
      currentSection++
      renderSection(currentSection)
      updateProgressBar()
    } else {
      finishSurvey()
    }
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.')
  }
}

function validateSection() {
  const inputs = document.querySelectorAll('#surveyForm input[required]')
  return Array.from(inputs).every((input) =>
    input.type === 'radio'
      ? document.querySelector(`input[name="${input.name}"]:checked`)
      : input.value.trim() !== ''
  )
}

function finishSurvey() {
  saveSectionData()
  const score = calculateCompetenzScore()
  const courses = getCoursesSuggestions(score)

  // Display the score and course suggestions
  const resultHtml = `
    <h2>Your Competenz Score: ${score}%</h2>
    <p>Based on your score, we recommend the following courses:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
  `

  document.getElementById('surveyForm').innerHTML = resultHtml

  // Hide navigation buttons
  document.querySelector('.navigation-buttons').style.display = 'none'
}

function logout() {
  saveSectionData()
  sessionStorage.clear()
  window.location.href = 'login.html'
}

function populateSectionDropdown() {
  const select = document.getElementById('section-select')
  surveyData.forEach((section, index) => {
    const option = document.createElement('option')
    option.value = index
    option.textContent = section.title
    select.appendChild(option)
  })
}

function handleSectionChange(e) {
  const selectedSection = parseInt(e.target.value)
  if (selectedSection !== currentSection) {
    if (validateSection()) {
      saveSectionData()
      currentSection = selectedSection
      renderSection(currentSection)
      updateProgressBar()
    } else {
      alert(
        'Bitte beantworten Sie alle Fragen in diesem Abschnitt, bevor Sie zu einem anderen wechseln.'
      )
      e.target.value = currentSection
    }
  }
}

function updateNavigationButtons() {
  const prevButton = document.getElementById('prevButton')
  const nextButton = document.getElementById('nextButton')

  prevButton.disabled = currentSection === 0
  nextButton.textContent =
    currentSection === surveyData.length - 1 ? 'Abschließen' : 'Weiter'
  nextButton.innerHTML =
    currentSection === surveyData.length - 1
      ? 'Abschließen'
      : 'Weiter <i class="fas fa-chevron-right"></i>'
}

function calculateCompetenzScore() {
  let totalScore = 0
  let totalQuestions = 0

  surveyData.forEach((section) => {
    section.questions.forEach((question, qIndex) => {
      const questionId = `q${surveyData.indexOf(section)}_${qIndex}`
      if (userData[questionId] !== undefined && question.type === 'scale') {
        totalScore += parseInt(userData[questionId])
        totalQuestions++
      }
    })
  })

  if (totalQuestions === 0) return 0

  const maxPossibleScore = totalQuestions * 6
  const percentage = (totalScore / maxPossibleScore) * 100

  return Math.round(percentage)
}

function getCoursesSuggestions(score) {
  // This is a placeholder function. Adjust the logic based on your requirements.
  if (score < 30) {
    return ['Basic Digital Skills', 'Introduction to Online Safety']
  } else if (score < 60) {
    return ['Intermediate Digital Literacy', 'Effective Online Communication']
  } else {
    return ['Advanced Digital Competencies', 'Digital Leadership in Education']
  }
}

function finishSurvey() {
  saveSectionData()
  showDatenschutz()
}

function showDatenschutz() {
  const datenschutzHtml = `
        <h1>Datenschutz</h1>
    <h2>Projektleitung: Prof.in Dr. Charlott Rubach & Anne-Kathrin Hirsch</h2>
    <p>Sehr geehrte Lehramtsstudierende,</p>
    <p>
        die Digitalisierung und Digitalität im Bildungsbereich erhielten in den letzten Jahren große Aufmerksamkeit. Der kompetente Umgang mit digitalen Medien gehört zum Aufgabenbereich von Lehrkräften. Daher ist es bedeutsam, dass Lehramtsstudierende während ihrer Ausbildung auf diesen Umgang vorbereitet werden. Wir interessieren uns im Rahmen dieser Studie „Open-Digi“ dafür, inwieweit die von uns erstellten Lernerfahrung zur Förderung digitaler Kompetenzen beitragen.
    </p>
    <h3>Wer sind wir?</h3>
    <p>
        Wir sind Prof. Dr. Charlott Rubach und Anne-Kathrin Hirsch, Bildungsforscherinnen an der Universität Rostock. Unsere Forschungsschwerpunkte sind Digitalisierung, Förderung digitaler Kompetenzen und Gestaltungsmöglichkeiten einer bedarfsorientierten Lehrkräftebildung.
    </p>
    <h3>Worum geht es in diesem Projekt?</h3>
    <p>
        Ziel des Projektes ist die Untersuchung von effektiven Lernerfahrungen für die Entwicklung digitaler Kompetenzen. Das Projekt besteht aus mehreren Schritten:
    </p>
    <ol>
        <li>Sie füllen die Befragung zum Open-Digi Projekt aus, welcher der Pre-Diagnostik gilt und zirka X Minuten dauert. Alle Befragungen thematisieren ausschließlich Aspekte von digitaler Kompetenz.</li>
        <li>Ihnen werden auf Grundlage der Diagnostik 2-3 Kurse vorgeschlagen, die Sie bearbeiten sollen.</li>
        <li>Sie bearbeiten die Kurse in einer Dauer von zirka einer Stunde.</li>
        <li>Sie durchlaufen die Post-Diagnostik direkt nach Bearbeitung der Kurse.</li>
        <li>Sie machen eine dritte Befragung, 1 Monat nach Bearbeitung der Kurse.</li>
    </ol>
    <h3>Was bedeutet die Teilnahme für mich und meinen Daten?</h3>
    <ul>
        <li>Ihre Teilnahme an unserer Studie ist freiwillig. Wenn Sie an der Studie teilnehmen, können Sie einzelne Fragen überspringen oder die gesamte Befragung jederzeit ganz abbrechen. In letzterem Falle, vernichten wir die Daten.</li>
        <li>Die Befragung ist anonym. Das heißt, es werden auch ausschließlich anonymisierte Informationen analysiert und im Rahmen wissenschaftlicher Arbeiten veröffentlicht. Es werden keine Informationen gespeichert, die es uns möglich machen, Sie als Person zu identifizieren. Eine Rücknahme Ihres Einverständnisses und damit Löschung Ihrer Daten, nachdem Sie den Fragebogen ausgefüllt und abgegeben haben, ist demnach nicht möglich. Anonymisierung ist das Verändern personenbezogener Daten in der Weise, dass Informationen nicht mehr oder nur mit einem unverhältnismäßig großen Aufwand an Zeit, Kosten und Arbeitskraft einer bestimmten Person zugeordnet werden können. Anonymisiert sind auch Daten, die keine persönliche Information mehr enthalten, bspw. Alter, Geschlecht, Lehramtstyp, Fächer und Hochschulsemester.</li>
        <li>Wir speichern Ihre Antworten und Ihre Angaben (z. B. Alter und Geschlecht). Diese werden bis zum Abschluss der Untersuchung und maximal 10 Jahre auf den Dienstrechnern der Wissenschaftlerinnen aus dem Projekt gespeichert und danach gelöscht.</li>
        <li>Es erfolgt keine Weitergabe Ihrer Daten an Dritte außerhalb des Forschungsprojektes.</li>
        <li>Unter folgendem Link finden Sie ausführliche Hinweise zum Schutz Ihrer Daten.</li>
        <li>Zur Erhebung und Verarbeitung der Daten benötigen wir Ihr Einverständnis:</li>
    </ul>
    <p>
        Ich versichere mit meiner Zustimmung, dass mir die Datenschutzhinweise zur Befragung „Open-Digi“ zur Kenntnis gegeben worden. Ich willige in die darin näher beschriebene Verarbeitung meiner personenbezogenen Daten ein.
    </p>
    <div class="signature">
        <div>
            <strong>Datum, Ort</strong><br>
            ___________________________
        </div>
        <div>
            <strong>Unterschrift</strong><br>
            ___________________________
        </div>
    </div>
    <p>Ansprechperson für weitere Fragen ist Prof.in Dr. Charlott Rubach (<a href="mailto:charlott.rubach@uni-rostock.de">charlott.rubach@uni-rostock.de</a>).</p>

    <button id="acceptDatenschutz">Akzeptieren und fortfahren</button>
  `

  document.getElementById('surveyForm').innerHTML = datenschutzHtml
  document.querySelector('.navigation-buttons').style.display = 'none'
  document.querySelector('.progress-container').style.display = 'none'
  document.querySelector('.section-nav').style.display = 'none'

  document
    .getElementById('acceptDatenschutz')
    .addEventListener('click', showResults)
}

function showResults() {
  const score = calculateCompetenzScore()
  const courses = getCoursesSuggestions(score)

  const resultHtml = `
    <h2>Your Competenz Score: ${score}%</h2>
    <p>Based on your score, we recommend the following courses:</p>
    <ul>
      ${courses.map((course) => `<li>${course}</li>`).join('')}
    </ul>
  `

  document.getElementById('surveyForm').innerHTML = resultHtml
}
