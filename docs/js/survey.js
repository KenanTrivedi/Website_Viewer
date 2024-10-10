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
    userData[key] = value // Update userData object
  }

  const userId = sessionStorage.getItem('userId')
  if (userId) {
    const categoryScores = calculateCategoryScores(userData)
    const attemptNumber =
      parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1

    const dataToSend = {
      userId: userId,
      data: userData,
      isComplete: isComplete,
      categoryScores: categoryScores,
      currentSection: currentSection,
    }

    // Include datenschutzConsent and unterschrift if they exist
    const datenschutzConsentElement =
      document.getElementById('datenschutzConsent')
    const unterschriftElement = document.getElementById('unterschrift')

    if (datenschutzConsentElement) {
      dataToSend.datenschutzConsent = datenschutzConsentElement.checked
    }

    if (unterschriftElement) {
      dataToSend.unterschrift = unterschriftElement.value.trim()
    }

    // Include open-ended responses
    if (attemptNumber > 1 && userData['t2_course_feedback']) {
      dataToSend.openEndedResponses = {
        [`attempt${attemptNumber}_course_feedback`]:
          userData['t2_course_feedback'],
      }
    }

    fetch('/api/save-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`)
        }
        return response.json()
      })
      .then((result) => {
        console.log('Data saved successfully:', result)
        sessionStorage.setItem(
          'updatedScores',
          JSON.stringify(result.updatedScores)
        )
        updatedScores = result.updatedScores

        if (isComplete) {
          showResults()
        }
      })
      .catch((error) => {
        console.error('Error saving data:', error)
        alert(
          'Es gab einen Fehler beim Speichern Ihrer Daten. Bitte versuchen Sie es erneut.'
        )
      })
  }
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

function loadUserData(isNewAttempt = false) {
  const userId = sessionStorage.getItem('userId')
  if (userId) {
    fetch(`/api/user-data/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('User data not found')
        }
        return response.json()
      })
      .then((data) => {
        console.log('Loaded user data:', data)
        sessionStorage.setItem('attemptNumber', data.attemptNumber || '1')
        if (data.data) {
          if (isNewAttempt) {
            // Keep only personal information for new attempts
            userData = {
              q0_0: data.data.q0_0,
              q0_1: data.data.q0_1,
              q0_2: data.data.q0_2,
              q0_3: data.data.q0_3,
            }
            currentSection = 0 // Start from the first section (Personal Information)
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
          // No data found, start from the first section
          userData = {}
          currentSection = 0
        }
        renderSection(currentSection)
        updateProgressBar()
        // Clear 'startNewAttempt' after handling
        sessionStorage.removeItem('startNewAttempt')
      })
      .catch((error) => {
        console.error('Error loading user data:', error)
        resetUserData()
        renderSection(currentSection)
        updateProgressBar()
      })
  } else {
    resetUserData()
    renderSection(currentSection)
    updateProgressBar()
  }
}

function validateYear(input) {
  input.value = input.value.replace(/\D/g, '')
  if (input.value.length > 4) {
    input.value = input.value.slice(0, 4)
  }
}

function renderSection(index) {
  console.log(`Rendering section ${index}`);

  if (index < 0 || index > surveyData.length) {
    console.error(`Invalid section index: ${index}`);
    currentSection = 0; // Reset to first section
    index = 0;
  }

  // Get attemptNumber from sessionStorage
  const attemptNumber =
    parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1;

  if (index === surveyData.length) {
    renderDatenschutzSection();
    return;
  }

  const section = surveyData[index];
  console.log(`Section title: ${section.title}`);

  document.getElementById('surveyForm').innerHTML = '';

  let html = `<div class="section"><h2>${section.title}</h2>`;

  // Display the introductory text before every category section except 'Persönliche Angaben'
  if (section.title !== 'Persönliche Angaben') {
    html += `<p>Wie kompetent fühlen Sie sich in der Ausführung der folgenden Aktivitäten...</p>`;
  }

  section.questions.forEach((question, qIndex) => {
    const questionId = `q${index}_${qIndex}`;
    console.log(`Rendering question: ${questionId}`);
    let savedValue = userData[questionId] || '';

    html += `<div class="question"><p>${question.text}</p>`;

    if (question.type === 'radio') {
      question.options.forEach((option) => {
        html += `<label><input type="radio" name="${questionId}" value="${option}" ${
          savedValue === option ? 'checked' : ''
        } required> ${option}</label><br>`;
      });
    } else if (question.type === 'number' && question.text.includes('Jahr')) {
      html += `<input type="text" id="${questionId}" name="${questionId}" 
                       value="${savedValue}" 
                       oninput="validateYear(this)" 
                       maxlength="4" 
                       pattern="[0-9]{4}"
                       required>`;
    } else if (question.type === 'scale') {
      html += `<div class="rating-scale" role="group" aria-label="Kompetenzskala von 0 bis 6">`;
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
                 </label>`;
      }
      html += `</div>
               <div class="scale-labels">
                 <span>gar nicht kompetent</span>
                 <span>ausgesprochen kompetent</span>
               </div>`;
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
             </select>`;
    } else if (question.type === 'text') {
      html += `<input type="text" id="${questionId}" name="${questionId}" value="${savedValue}" required>`;
    }

    html += `</div>`;
  });

  // After rendering the first section, add the open-ended question for T2
  if (index === 0 && attemptNumber > 1) {
    html += `
      <div class="question">
        <p>Wie fandest du deine absolvierten Kurse in ILIAS in Bezug auf Inhalt und Struktur? Was hast du für dich mitgenommen? Was war hilfreich für dich?</p>
        <textarea name="t2_course_feedback" id="t2_course_feedback" rows="4" style="width:100%;" required>${
          userData['t2_course_feedback'] || ''
        }</textarea>
      </div>
    `;
  }

  html += `</div>`;
  document.getElementById('surveyForm').innerHTML = html;

  // Add event listeners for scale buttons
  document.querySelectorAll('.scale-button').forEach((button) => {
    button.addEventListener('keydown', handleScaleKeydown);
  });

  updateNavigationButtons();
  updateProgressBar();
}

// Submit Final Data Function
function submitFinalData(event) {
  event.preventDefault();
  if (validateDatenschutz()) {
    saveSectionData(true);
    showResults();
  } else {
    alert('Bitte beantworten Sie alle Pflichtfelder.');
  }
}

window.submitFinalData = submitFinalData;

// Function to render the Datenschutz section
function renderDatenschutzSection() {
  const datenschutzHtml = `
    <div class="datenschutz-section">
      <!-- Datenschutz content as before -->
      <!-- ... -->
    </div>
  `;

  document.getElementById('surveyForm').innerHTML = datenschutzHtml;

  // Add event listener to the final submit button
  document
    .getElementById('submitFinal')
    .addEventListener('click', submitFinalData);

  updateNavigationButtons();
}

// Update Navigation Buttons Function
function updateNavigationButtons() {
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');

  // Disable the Previous button on the first section
  if (currentSection === 0) {
    if (prevButton) prevButton.disabled = true;
  } else {
    if (prevButton) prevButton.disabled = false;
  }

  if (currentSection === surveyData.length) {
    // Hide the Next button on the Datenschutz section
    if (nextButton) nextButton.style.display = 'none';
  } else if (currentSection === surveyData.length - 1) {
    // Change the Next button to 'Finish' on the last survey section
    if (nextButton) {
      nextButton.style.display = 'inline-block';
      nextButton.textContent = 'Finish';
      // Remove existing event listeners to prevent multiple triggers
      nextButton.replaceWith(nextButton.cloneNode(true));
      nextButton = document.getElementById('nextButton');
      nextButton.addEventListener('click', finishSurvey);
    }
  } else {
    if (nextButton) {
      nextButton.style.display = 'inline-block';
      nextButton.textContent = 'Weiter';
      // Remove existing event listeners to prevent multiple triggers
      nextButton.replaceWith(nextButton.cloneNode(true));
      nextButton = document.getElementById('nextButton');
      nextButton.addEventListener('click', nextSection);
    }
  }
}

// Finish Survey Function
function finishSurvey() {
  if (validateSection()) {
    saveSectionData(false); // Not setting isComplete yet
    currentSection++;
    if (currentSection === surveyData.length) {
      renderDatenschutzSection();
      updateProgressBar();
      window.scrollTo(0, 0);
    } else if (currentSection > surveyData.length) {
      // Now proceed to show results
      saveSectionData(true); // Now set isComplete to true
      showResults();
    } else {
      renderSection(currentSection);
      updateProgressBar();
      window.scrollTo(0, 0);
    }
  } else {
    alert('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.');
    markUnansweredQuestions();
  }
}

// Validate Section Function
function validateSection() {
  const form = document.getElementById('surveyForm');
  if (!form) return false;

  const firstUnanswered = markUnansweredQuestions();
  if (firstUnanswered) {
    // Scroll to the first unanswered question smoothly
    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  return true;
}

// Mark Unanswered Questions Function
function markUnansweredQuestions() {
  const form = document.getElementById('surveyForm');
  const requiredFields = form.querySelectorAll('[required]');
  let firstUnanswered = null;

  requiredFields.forEach((field) => {
    const questionDiv = field.closest('.question');
    const isUnanswered =
      (field.type === 'radio' &&
        !form.querySelector(`input[name="${field.name}"]:checked`)) ||
      (field.type !== 'radio' && !field.value.trim());

    if (isUnanswered) {
      questionDiv.classList.add('unanswered');
      questionDiv.style.animation =
        'shake 0.82s cubic-bezier(.36,.07,.19,.97) both';
      if (!firstUnanswered) {
        firstUnanswered = questionDiv;
      }
    } else {
      questionDiv.classList.remove('unanswered');
      questionDiv.style.animation = '';
    }
  });

  if (firstUnanswered) {
    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return firstUnanswered;
}

// Remove Unanswered Markers Function
function removeUnansweredMarkers() {
  const unansweredQuestions = document.querySelectorAll('.question.unanswered');
  unansweredQuestions.forEach((question) => {
    question.classList.remove('unanswered');
    question.style.animation = '';
  });
}

// Show Results Function
async function showResults() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    console.error('No userId found in sessionStorage.');
    return;
  }

  try {
    const response = await fetch(`/api/user-data/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    const data = await response.json();

    initialScores = data.initialScores || {};
    updatedScores = data.updatedScores || {};

    console.log('Fetched User Data:', data);

    const attemptNumber =
      parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1;

    // Calculate competency score using updatedScores if available, otherwise use initialScores
    const scoreData =
      Object.keys(updatedScores).length > 0 ? updatedScores : initialScores;
    const score = calculateCompetenzScore(scoreData);

    // Generate HTML for results without course recommendations
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
      <button id="downloadChart" class="btn btn-primary" style="background-color: #004A99; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Diagramm herunterladen</button>
      <hr>
    `;

    if (attemptNumber === 1) {
      // T1 specific content
      resultHtml += `
        <p>Basierend auf deinen Ergebnissen wähle nun einen oder mehrere Kompetenzbereiche aus, in denen du dich weiterbilden möchtest. Wir haben für jeden Kompetenzbereiche mehrere Mikrofortbildungen entwickelt, die du absolvieren kannst. Die Auswahl der Kompetenzbereiche kannst du anhand verschiedener Motive selbst vornehmen: Möchtest du den Kompetenzbereich mit dem geringsten Score verbessern, oder interessierst du dich besonders für einen Kompetenzbereich bzw. ist ein Thema gerade sehr aktuell bei dir.</p>
        <p>Schaue dir nun die Kompetenzbereiche an und entscheide dich für 1 bis 2.</p>
        <p><strong>Welche Strategie/n hast du bei der Auswahl der Kompetenzbereiche genutzt?</strong></p>
        <textarea id="t1OpenEndedResponse" rows="4" style="width:100%;" required></textarea>
        <button id="submitT1OpenEndedResponse" class="btn btn-primary">Absenden</button>
      `;
    } else if (attemptNumber > 1) {
      // T2 specific content
      resultHtml += `
        <p>Jetzt hast du den Vergleich zwischen deiner Kompetenzeinschätzung vor und nach der Absolvierung der ILIAS Kurse. Wenn der helle Balken niedriger ist als der dunklere, bedeutet das, dass du dich nach den ILIAS-Kursen besser einschätzt als zuvor. Ist der helle Balken höher als der dunklere ist es genau umgekehrt. Es ist auch möglich, dass du dich bei beiden Befragungen in gewissen Kompetenzbereichen gleich eingeschätzt hast: dann sind beide Balken gleich hoch.</p>
        <p><strong>Wie haben sich deine Kompetenzüberzeugungen nun verändert? Beschreibe, was du im Diagramm siehst und teile uns mit, welche Schlüsse du aus deiner Lernerfahrung ziehst.</strong></p>
        <textarea id="t2OpenEndedResponse" rows="4" style="width:100%;" required></textarea>
        <button id="submitT2OpenEndedResponse" class="btn btn-primary">Absenden</button>
      `;
    }

    document.getElementById('surveyForm').innerHTML = resultHtml;

    // Hide the progress bar
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    if (progressBar) progressBar.style.display = 'none';
    if (progressText) progressText.style.display = 'none';

    // Create the competency chart
    if (Object.keys(updatedScores).length > 0) {
      // Show both initial and updated scores
      createCompetencyChart1(initialScores, updatedScores);
    } else {
      // Show only initial scores
      createCompetencyChart1(initialScores, {});
    }

    // Add event listener to the download button
    const downloadButton = document.getElementById('downloadChart');
    if (downloadButton) {
      downloadButton.addEventListener('click', downloadChart);
    } else {
      console.error('Download button not found');
    }

    // Hide navigation buttons
    hideNavigationButtons();

    // Add event listeners for open-ended responses
    if (attemptNumber === 1) {
      document
        .getElementById('submitT1OpenEndedResponse')
        .addEventListener('click', submitT1OpenEndedResponse);
    } else if (attemptNumber > 1) {
      document
        .getElementById('submitT2OpenEndedResponse')
        .addEventListener('click', submitT2OpenEndedResponse);
    }
  } catch (error) {
    console.error('Error displaying results:', error);
    alert('Fehler beim Anzeigen der Ergebnisse. Bitte versuchen Sie es erneut.');
  }
}

// Assign showResults to window after its definition
window.showResults = showResults;

// Function to handle T1 open-ended response submission
function submitT1OpenEndedResponse(event) {
  event.preventDefault();
  const openEndedResponse = document
    .getElementById('t1OpenEndedResponse')
    .value.trim();
  if (!openEndedResponse) {
    alert('Bitte füllen Sie das Textfeld aus.');
    return;
  }

  const userId = sessionStorage.getItem('userId');
  const attemptNumber =
    parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1;

  fetch('/api/save-open-ended-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      attemptNumber: attemptNumber,
      response: openEndedResponse,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      document.getElementById('t1OpenEndedResponse').value = '';
      showCourseLinks();
    })
    .catch((error) => {
      console.error('Error saving open-ended response:', error);
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      );
    });
}

// Function to handle T2 open-ended response submission
function submitT2OpenEndedResponse(event) {
  event.preventDefault();
  const openEndedResponse = document
    .getElementById('t2OpenEndedResponse')
    .value.trim();
  if (!openEndedResponse) {
    alert('Bitte füllen Sie das Textfeld aus.');
    return;
  }

  const userId = sessionStorage.getItem('userId');
  const attemptNumber =
    parseInt(sessionStorage.getItem('attemptNumber'), 10) || 1;

  fetch('/api/save-open-ended-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      attemptNumber: attemptNumber,
      response: openEndedResponse,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      document.getElementById('t2OpenEndedResponse').value = '';
      // Optionally, you can show a thank you message or redirect
      alert('Vielen Dank für Ihre Antwort!');
    })
    .catch((error) => {
      console.error('Error saving open-ended response:', error);
      alert(
        'Es gab einen Fehler beim Speichern Ihrer Antwort. Bitte versuchen Sie es erneut.'
      );
    });
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
  `;

  document
    .getElementById('surveyForm')
    .insertAdjacentHTML('beforeend', courseLinksHtml);
}

// Create Competency Chart Function
function createCompetencyChart1(initialScores, updatedScores) {
  const canvas = document.getElementById('competencyChart1');
  const descriptionBox = document.getElementById('descriptionBox1');
  if (!canvas || !descriptionBox) {
    console.error('Chart canvas or description box not found');
    return;
  }

  if (chart1Instance) {
    chart1Instance.destroy();
  }

  const ctx = canvas.getContext('2d');

  // Determine all unique labels from initial and updated scores
  const allLabels = new Set([
    ...Object.keys(initialScores),
    ...Object.keys(updatedScores),
  ]);
  const fullLabels = Array.from(allLabels);
  const labels = fullLabels.map((key) => labelMap[key] || key);
  let currentHoveredIndex = -1;

  const datasets = [
    {
      label: 'T1 Score',
      data: fullLabels.map((label) => initialScores[label] || 0),
      backgroundColor: fullLabels.map((label) =>
        getLighterColor(colorMap[label] || '#999999')
      ),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    },
  ];

  if (Object.keys(updatedScores).length > 0) {
    datasets.push({
      label: 'T2 Score',
      data: fullLabels.map((label) => updatedScores[label] || 0),
      backgroundColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderColor: fullLabels.map((label) => colorMap[label] || '#999999'),
      borderWidth: 1,
    });
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
              const index = tooltipItems[0].dataIndex;
              const fullLabel = fullLabels[index];
              return fullLabel || tooltipItems[0].label;
            },
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y}%`,
          },
        },
      },
      onHover: (event, activeElements) => {
        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index;
          if (dataIndex !== currentHoveredIndex) {
            currentHoveredIndex = dataIndex;
            const fullCompetency = fullLabels[dataIndex];
            updateDescriptionBox(
              descriptionBox,
              fullCompetency,
              competencyDescriptions[fullCompetency]
            );
          }
        } else {
          currentHoveredIndex = -1;
          descriptionBox.innerHTML = '';
          descriptionBox.style.backgroundColor = '';
          descriptionBox.style.border = '';
        }
      },
    },
  });

  chart1Instance.update();
}

// Update Description Box Function
function updateDescriptionBox(descriptionBox, fullCompetency, description) {
  const competency = labelMap[fullCompetency] || fullCompetency;
  const color = colorMap[fullCompetency] || '#999999';
  const lighterColor = getLighterColor(color);

  descriptionBox.innerHTML = `
    <h3>${fullCompetency}</h3>
    <p>${description || 'Beschreibung nicht verfügbar.'}</p>
  `;
  descriptionBox.style.backgroundColor = lighterColor;
  descriptionBox.style.padding = '15px';
  descriptionBox.style.borderRadius = '5px';
  descriptionBox.style.border = `2px solid ${color}`;
  descriptionBox.style.color = getContrastColor(lighterColor);
}

// Utility Function to Get Lighter Color
function getLighterColor(hexColor) {
  if (!hexColor || hexColor.length !== 7 || hexColor[0] !== '#') {
    return '#cccccc'; // Return a default color if invalid
  }
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  // Make the color significantly lighter
  r = Math.min(255, r + Math.floor((255 - r) * 0.7));
  g = Math.min(255, g + Math.floor((255 - g) * 0.7));
  b = Math.min(255, b + Math.floor((255 - b) * 0.7));

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Utility Function to Get Contrast Color
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

// Download Chart Function
function downloadChart(event) {
  event.preventDefault();
  const canvas1 = document.getElementById('competencyChart1');
  if (canvas1) {
    const link = document.createElement('a');
    link.download = 'kompetenz-diagramm.png';
    link.href = canvas1.toDataURL();
    link.click();
  }
}

// Hide Navigation Buttons Function
function hideNavigationButtons() {
  const navButtons = document.querySelector('.navigation-buttons');
  if (navButtons) {
    navButtons.style.display = 'none';
  }
}

// Calculate Kompetenz Score Function
function calculateCompetenzScore(scores) {
  const scoreValues = Object.values(scores);
  if (scoreValues.length === 0) return 0;
  const total = scoreValues.reduce((acc, val) => acc + val, 0);
  return Math.round(total / scoreValues.length);
}

// Expose Necessary Functions Globally
window.saveSectionData = saveSectionData;
window.validateYear = validateYear;
