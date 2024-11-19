// Define all competencies in a single array with both general and professional competencies
const competencies = [
  // General Competencies
  {
    title: 'Suchen',
    fullTitle: 'Suchen, Verarbeiten und Aufbewahren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
    iconClass: 'fas fa-search',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Kommunizieren',
    fullTitle: 'Kommunikation und Kollaborieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen.',
    iconClass: 'fas fa-comments',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Produzieren',
    fullTitle: 'Produzieren und Präsentieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren.',
    iconClass: 'fas fa-chalkboard-teacher',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Schützen',
    fullTitle: 'Schützen und sicher Agieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren zu vermeiden.',
    iconClass: 'fas fa-shield-alt',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Problemlösen',
    fullTitle: 'Problemlösen und Handeln',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen.',
    iconClass: 'fas fa-lightbulb',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Analysieren',
    fullTitle: 'Analysieren und Reflektieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren.',
    iconClass: 'fas fa-chart-line',
    category: 'Allgemeine digitale Kompetenzen',
  },
  // Professional Competencies
  {
    title: 'Organisieren',
    fullTitle: 'Organisation und Administration',
    description:
      'Der Kompetenzbereich umfasst sowohl die Kompetenz, digitale Medien gezielt zu suchen, auszuwählen und anzupassen, um den Anforderungen des Unterrichts gerecht zu werden, als auch die Nutzung solcher Medien. Zudem beinhaltet dieser Bereich das effiziente Management, den Schutz und die gemeinsame Nutzung digitaler Daten.',
    iconClass: 'fas fa-folder-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Engagement',
    fullTitle: 'Berufliches Engagement außerhalb des Unterrichts',
    description:
      'Der Kompetenzbereich umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation in Schule, z.B. zwischen Lehrenden und Eltern. Weiterhin wird die Nutzung digitaler Medien für das Schulmanagement und die Zusammenarbeit mit Kolleg*innen dazugezählt.',
    iconClass: 'fas fa-users',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lehren',
    fullTitle: 'Lehren und Lernen',
    description:
      'Der Kompetenzbereich umfasst die Nutzung digitaler Medien zur Unterstützung von projektbasiertem, kollaborativen oder selbstregulierten Lernen, zur Unterrichtsdurchführung und Unterstützung der Lernenden.',
    iconClass: 'fas fa-book-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Fördern',
    fullTitle: 'Lernende fördern',
    description:
      'Der Kompetenzbereich umfasst die Gewährleistung von Barrierefreiheit und Inklusion, indem sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben.',
    iconClass: 'fas fa-hands-helping',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Bewerten',
    fullTitle: 'Bewertung',
    description:
      'Der Kompetenzbereich umfasst die Anwendung von digitalen Medien zur Erfassung des Lernfortschrittes der Schüler*innen. Dabei wird Wert auf die kritische Analyse und Interpretation digitaler Informationen gelegt.',
    iconClass: 'fas fa-clipboard-check',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Förderung',
    fullTitle: 'Förderung digitaler Kompetenzen der Lernenden',
    description:
      'Der Kompetenzbereich umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht.',
    iconClass: 'fas fa-laptop-code',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
]

// Error handling wrapper for DOM operations
const safeQuerySelector = (selector) => {
  const element = document.querySelector(selector)
  if (!element) {
    console.warn(`Element not found: ${selector}`)
    return null
  }
  return element
}

// Create a competency card
function createCompetencyCard(item) {
  const card = document.createElement('div')
  card.classList.add('competency-card')
  card.setAttribute('data-title', item.fullTitle)
  card.setAttribute('data-description', item.description)
  card.setAttribute('data-category', item.category)

  // Add accessibility attributes
  card.setAttribute('role', 'button')
  card.setAttribute('tabindex', '0')
  card.setAttribute('aria-label', `${item.fullTitle} - ${item.category}`)

  const icon = document.createElement('i')
  icon.className = `${item.iconClass} competency-icon`
  icon.setAttribute('aria-hidden', 'true')

  const title = document.createElement('span')
  title.textContent = item.title

  card.appendChild(icon)
  card.appendChild(title)

  // Add click and keyboard event listeners
  card.addEventListener('click', () => handleCompetencySelection(item, card))
  card.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCompetencySelection(item, card)
    }
  })

  return card
}

// Handle competency selection
function handleCompetencySelection(item, card) {
  displayCompetencyDescription(item)
  highlightSelectedCard(card)
}

// Display competency description
function displayCompetencyDescription(item) {
  const descriptionContainer = safeQuerySelector('#competency-description')
  if (!descriptionContainer) return

  descriptionContainer.innerHTML = `
    <h2>${item.fullTitle}</h2>
    <h3>${item.category}</h3>
    <p>${item.description}</p>
  `

  // Smooth scroll to description on mobile
  if (window.innerWidth <= 768) {
    descriptionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Highlight selected card
function highlightSelectedCard(selectedCard) {
  document.querySelectorAll('.competency-card').forEach((card) => {
    card.classList.remove('selected')
    card.setAttribute('aria-pressed', 'false')
  })
  selectedCard.classList.add('selected')
  selectedCard.setAttribute('aria-pressed', 'true')
}

// Generate competency grid
function generateCompetencyGrid() {
  const generalGrid = safeQuerySelector('#general-grid')
  const professionalGrid = safeQuerySelector('#professional-grid')

  if (!generalGrid || !professionalGrid) return

  competencies.forEach((item) => {
    const card = createCompetencyCard(item)

    if (item.category === 'Allgemeine digitale Kompetenzen') {
      generalGrid.appendChild(card)
    } else if (item.category === 'Berufsspezifische digitale Kompetenzen') {
      professionalGrid.appendChild(card)
    }
  })
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  generateCompetencyGrid()

  const defaultDescription = safeQuerySelector('#competency-description')
  if (defaultDescription) {
    defaultDescription.innerHTML = `
      <h2>Kompetenzbereich auswählen</h2>
      <p>Klicke auf eine Kompetenz, um die Beschreibung anzuzeigen.</p>
    `
  }
})
