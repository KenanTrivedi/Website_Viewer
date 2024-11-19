// Define competencies array
const competencies = [
  // General Competencies
  {
    title: 'Suchen',
    fullTitle: 'Suchen, Verarbeiten und Aufbewahren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
    example:
      'Sucht im Internet nach verlässlichen Informationen zu einer Urlaubsreise, nutzt dabei mehrere Websites und vergleicht die Angebote. Um standortunabhängige und neutralere Ergebnisse zu erhalten, verwendet sie den Inkognito-Modus ihres Browsers.',
    iconClass: 'fas fa-search',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Kommunizieren',
    fullTitle: 'Kommunikation und Kollaborieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen.',
    example:
      'Verwendet Soziale Netzwerke, um kompetent und verantwortungsbewusst zu kommunizieren. Beispielsweise nutzt sie Facebook, um in einer lokalen Nachbarschaftsgruppe Hilfe bei einer Reparatur zu suchen.',
    iconClass: 'fas fa-comments',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Produzieren',
    fullTitle: 'Produzieren und Präsentieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren.',
    example:
      'Gestaltet eine Geburtstagspräsentation mit Microsoft PowerPoint, fügt Animationen über die Menüleiste „Übergänge" hinzu und bettet Videos ein.',
    iconClass: 'fas fa-chalkboard-teacher',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Schützen',
    fullTitle: 'Schützen und sicher Agieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren zu vermeiden.',
    example:
      'Erstellt ein starkes Passwort für ihren E-Mail-Account, z. B. "S0mm3r#2024&Fav0rit", und nutzt für verschiedene Social-Media-Accounts unterschiedliche Passwörter.',
    iconClass: 'fas fa-shield-alt',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Problemlösen',
    fullTitle: 'Problemlösen und Handeln',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen.',
    example:
      'Hat ein Problem mit dem WLAN zu Hause. Sie analysiert systematisch die Ursache, überprüft die Router-Anschlüsse, testet die Verbindung mit einem anderen Gerät und recherchiert in Online-Foren nach Lösungen.',
    iconClass: 'fas fa-lightbulb',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Analysieren',
    fullTitle: 'Analysieren und Reflektieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren.',
    example:
      'Analysiert das Geschäftsmodell von Netflix, das darauf ausgelegt ist, durch attraktive Inhalte und benutzerfreundliche Features zunächst unverzichtbar zu wirken.',
    iconClass: 'fas fa-chart-line',
    category: 'Allgemeine digitale Kompetenzen',
  },
  // Professional Competencies
  {
    title: 'Organisieren',
    fullTitle: 'Organisation und Administration',
    description:
      'Der Kompetenzbereich umfasst sowohl die Kompetenz, digitale Medien gezielt zu suchen, auszuwählen und anzupassen, um den Anforderungen des Unterrichts gerecht zu werden, als auch die Nutzung solcher Medien. Zudem beinhaltet dieser Bereich das effiziente Management, den Schutz und die gemeinsame Nutzung digitaler Daten.',
    example:
      'Organisiert Unterrichtsmaterialien in einer strukturierten Cloud-Ablage, teilt diese gezielt mit Kolleg*innen und implementiert ein digitales Backup-System.',
    iconClass: 'fas fa-folder-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Engagement',
    fullTitle: 'Berufliches Engagement außerhalb des Unterrichts',
    description:
      'Der Kompetenzbereich umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation in Schule, z.B. zwischen Lehrenden und Eltern. Weiterhin wird die Nutzung digitaler Medien für das Schulmanagement und die Zusammenarbeit mit Kolleg*innen dazugezählt.',
    example:
      'Nutzt digitale Plattformen für Elternkommunikation, organisiert virtuelle Elternabende und koordiniert Schulprojekte digital mit Kolleg*innen.',
    iconClass: 'fas fa-users',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lehren',
    fullTitle: 'Lehren und Lernen',
    description:
      'Der Kompetenzbereich umfasst die Nutzung digitaler Medien zur Unterstützung von projektbasiertem, kollaborativen oder selbstregulierten Lernen, zur Unterrichtsdurchführung und Unterstützung der Lernenden.',
    example:
      'Setzt interaktive Lernplattformen ein, gestaltet digitale Gruppenarbeiten und entwickelt individualisierte Lernpfade mithilfe digitaler Tools.',
    iconClass: 'fas fa-book-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lernende fördern',
    fullTitle: 'Lernende fördern',
    description:
      'Der Kompetenzbereich umfasst die Gewährleistung von Barrierefreiheit und Inklusion, indem sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben.',
    example:
      'Stellt barrierefreie digitale Materialien bereit, passt Lernmaterialien individuell an und nutzt assistive Technologien zur Unterstützung von Lernenden mit besonderen Bedürfnissen.',
    iconClass: 'fas fa-hands-helping',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Bewertung',
    fullTitle: 'Bewertung',
    description:
      'Der Kompetenzbereich umfasst die Anwendung von digitalen Medien zur Erfassung des Lernfortschrittes der Schüler*innen. Dabei wird Wert auf die kritische Analyse und Interpretation digitaler Informationen gelegt.',
    example:
      'Verwendet digitale Assessment-Tools für formative Bewertungen, erstellt automatisierte Feedback-Systeme und dokumentiert Lernfortschritte digital.',
    iconClass: 'fas fa-clipboard-check',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Förderung',
    fullTitle: 'Förderung digitaler Kompetenzen der Lernenden',
    description:
      'Der Kompetenzbereich umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht.',
    example:
      'Entwickelt Unterrichtseinheiten zur Medienkompetenz, lehrt sicheres Online-Verhalten und fördert kritisches Denken im digitalen Kontext.',
    iconClass: 'fas fa-laptop-code',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
]

// Function to generate competency cards
function generateCompetencyCards() {
  const generalGrid = document.getElementById('general-grid')
  const professionalGrid = document.getElementById('professional-grid')

  competencies.forEach((competency) => {
    const card = document.createElement('div')
    card.classList.add('competency-card')

    // Create icon element
    const icon = document.createElement('i')
    icon.className = `${competency.iconClass} competency-icon`
    card.appendChild(icon)

    // Create title element
    const title = document.createElement('span')
    title.textContent = competency.title
    card.appendChild(title)

    // Add event listener to the card
    card.addEventListener('click', () => {
      displayCompetencyDescription(competency)
      highlightSelectedCard(card)
    })

    // Append card to the appropriate grid
    if (competency.category === 'Allgemeine digitale Kompetenzen') {
      generalGrid.appendChild(card)
    } else if (
      competency.category === 'Berufsspezifische digitale Kompetenzen'
    ) {
      professionalGrid.appendChild(card)
    }
  })
}

// Function to display competency description
function displayCompetencyDescription(competency) {
  const descriptionContainer = document.getElementById('competency-description')

  // Update the heading
  const heading = descriptionContainer.querySelector('h2')
  heading.textContent = competency.fullTitle

  // Update the description content
  const descriptionContent = descriptionContainer.querySelector(
    '.description-content'
  )
  descriptionContent.innerHTML = `<p>${competency.description}</p>`

  // Update the example section
  const exampleSection = descriptionContainer.querySelector('.example-section')
  const exampleText = descriptionContainer.querySelector('.example-text')
  if (competency.example) {
    exampleSection.style.display = 'block'
    exampleText.textContent = competency.example
  } else {
    exampleSection.style.display = 'none'
  }

  // Scroll to the description
  descriptionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Function to highlight the selected card
function highlightSelectedCard(selectedCard) {
  const allCards = document.querySelectorAll('.competency-card')
  allCards.forEach((card) => {
    card.classList.remove('selected')
  })
  selectedCard.classList.add('selected')
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  generateCompetencyCards()
})
