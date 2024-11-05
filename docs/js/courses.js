// courses.js

const competencies = [
  // General Competencies
  {
    title: 'Suchen, Verarbeiten und Aufbewahren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
    iconClass: 'fas fa-search',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Kommunikation und Kollaborieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen, dabei die Verhaltensnormen in digitalen Umgebungen zu beachten und digitale Technologien zur gesellschaftlichen Teilhabe und Selbstermächtigung zu nutzen.',
    iconClass: 'fas fa-comments',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Produzieren und Präsentieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren, dabei Urheberrecht und Lizenzen zu berücksichtigen, sowie das Programmieren digitaler Produkte.',
    iconClass: 'fas fa-chalkboard-teacher',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Schützen und sicher Agieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren bei der Nutzung digitaler Technologien zu vermeiden, und persönliche Daten, Identität sowie Privatsphäre in digitalen Umgebungen verantwortungsvoll zu schützen.',
    iconClass: 'fas fa-shield-alt',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Problemlösen und Handeln',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen und kreative technische Lösungen für spezifische Bedürfnisse zu finden. Zudem gehört zum Kompetenzbereich informatisches Denken, also das strategische Lösen komplexer Probleme in digitalen Umgebungen und die kontinuierliche Weiterentwicklung der eigenen digitalen Kompetenzen.',
    iconClass: 'fas fa-lightbulb',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Analysieren und Reflektieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren, deren Glaubwürdigkeit und Zuverlässigkeit kritisch zu bewerten sowie Geschäftsaktivitäten in digitalen Umgebungen zu identifizieren und angemessen darauf zu reagieren.',
    iconClass: 'fas fa-chart-line',
    category: 'Allgemeine digitale Kompetenzen',
  },
  // Professional Competencies
  {
    title: 'Organisation und Administration',
    description:
      'Der Kompetenzbereich umfasst sowohl die Kompetenz, digitale Medien gezielt zu suchen, auszuwählen und anzupassen, um den Anforderungen des Unterrichts gerecht zu werden, als auch die Nutzung solcher Medien. Zudem beinhaltet dieser Bereich das effiziente Management, den Schutz und die gemeinsame Nutzung digitaler Daten.',
    iconClass: 'fas fa-folder-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Berufliches Engagement außerhalb des Unterrichts',
    description:
      'Der Kompetenzbereich umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation in Schule, z.B. zwischen Lehrenden und Eltern. Weiterhin wird die Nutzung digitaler Medien für das Schulmanagement und die Zusammenarbeit mit Kolleg*innen dazugezählt.',
    iconClass: 'fas fa-users',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lehren und Lernen',
    description:
      'Der Kompetenzbereich umfasst die Nutzung digitaler Medien zur Unterstützung von projektbasiertem, kollaborativen oder selbstregulierten Lernen, zur Unterrichtsdurchführung und Unterstützung der Lernenden.',
    iconClass: 'fas fa-book-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lernende fördern',
    description:
      'Der Kompetenzbereich umfasst die Gewährleistung von Barrierefreiheit und Inklusion, indem sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben. Genutzte Strategien sind die Differenzierung und Personalisierung von Lernaktivitäten, die aktive Motivation und die Förderung des Engagements der Schüler*innen.',
    iconClass: 'fas fa-hands-helping',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Bewertung',
    description:
      'Der Kompetenzbereich umfasst die Anwendung von digitalen Medien zur Erfassung des Lernfortschrittes der Schüler*innen. Dabei wird Wert auf die kritische Analyse und Interpretation digitaler Informationen gelegt.',
    iconClass: 'fas fa-clipboard-check',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Förderung digitalen Kompetenzen der Lernenden',
    description:
      'Der Kompetenzbereich umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht.',
    iconClass: 'fas fa-laptop-code',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
]

function generateCompetencyGrid() {
  const generalGrid = document.getElementById('general-grid')
  const professionalGrid = document.getElementById('professional-grid')

  competencies.forEach((item) => {
    // Create competency card
    const card = document.createElement('div')
    card.classList.add('competency-card')
    card.setAttribute('data-title', item.title)
    card.setAttribute('data-description', item.description)
    card.setAttribute('data-category', item.category)

    // Icon
    const icon = document.createElement('i')
    icon.className = `${item.iconClass} competency-icon`

    // Title
    const title = document.createElement('span')
    title.textContent = item.title

    // Append icon and title to card
    card.appendChild(icon)
    card.appendChild(title)

    // Event listener to display description
    card.addEventListener('click', () => {
      displayCompetencyDescription(item)
      highlightSelectedCard(card)
    })

    // Append card to the appropriate grid
    if (item.category === 'Allgemeine digitale Kompetenzen') {
      generalGrid.appendChild(card)
    } else if (item.category === 'Berufsspezifische digitale Kompetenzen') {
      professionalGrid.appendChild(card)
    }
  })
}

function displayCompetencyDescription(item) {
  const descriptionContainer = document.getElementById('competency-description')
  descriptionContainer.innerHTML = `
    <h2>${item.title}</h2>
    <h3>${item.category}</h3>
    <p>${item.description}</p>
  `
}

function highlightSelectedCard(selectedCard) {
  // Remove highlight from all cards
  const cards = document.querySelectorAll('.competency-card')
  cards.forEach((card) => {
    card.classList.remove('selected')
  })

  // Highlight the selected card
  selectedCard.classList.add('selected')
}

document.addEventListener('DOMContentLoaded', generateCompetencyGrid)
