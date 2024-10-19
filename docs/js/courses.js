// courses.js

const competencies = [
  {
    category: 'Allgemeine digitale Kompetenzen',
    items: [
      {
        title: 'Suchen, Verarbeiten und Aufbewahren',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
        iconClass: 'fas fa-search',
      },
      {
        title: 'Kommunikation und Kollaborieren',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen, dabei die Verhaltensnormen in digitalen Umgebungen zu beachten und digitale Technologien zur gesellschaftlichen Teilhabe und Selbstermächtigung zu nutzen.',
        iconClass: 'fas fa-comments',
      },
      {
        title: 'Produzieren und Präsentieren',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren, dabei Urheberrecht und Lizenzen zu berücksichtigen, sowie das Programmieren digitaler Produkte.',
        iconClass: 'fas fa-chalkboard-teacher',
      },
      {
        title: 'Schützen und sicher Agieren',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren bei der Nutzung digitaler Technologien zu vermeiden, und persönliche Daten, Identität sowie Privatsphäre in digitalen Umgebungen verantwortungsvoll zu schützen.',
        iconClass: 'fas fa-shield-alt',
      },
      {
        title: 'Problemlösen und Handeln',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen und kreative technische Lösungen für spezifische Bedürfnisse zu finden. Zudem gehört zum Kompetenzbereich informatisches Denken, also das strategische Lösen komplexer Probleme in digitalen Umgebungen und die kontinuierliche Weiterentwicklung der eigenen digitalen Kompetenzen.',
        iconClass: 'fas fa-lightbulb',
      },
      {
        title: 'Analysieren und Reflektieren',
        description:
          'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren, deren Glaubwürdigkeit und Zuverlässigkeit kritisch zu bewerten sowie Geschäftsaktivitäten in digitalen Umgebungen zu identifizieren und angemessen darauf zu reagieren.',
        iconClass: 'fas fa-chart-line',
      },
    ],
  },
  {
    category: 'Berufsspezifische digitale Kompetenzen',
    items: [
      {
        title: 'Organisation und Administration',
        description:
          'Der Kompetenzbereich umfasst sowohl die Kompetenz, digitale Medien gezielt zu suchen, auszuwählen und anzupassen, um den Anforderungen des Unterrichts gerecht zu werden, als auch die Nutzung solcher Medien. Zudem beinhaltet dieser Bereich das effiziente Management, den Schutz und die gemeinsame Nutzung digitaler Daten.',
        iconClass: 'fas fa-folder-open',
      },
      {
        title: 'Berufliches Engagement außerhalb des Unterrichts',
        description:
          'Der Kompetenzbereich umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation in Schule, z.B. zwischen Lehrenden und Eltern. Weiterhin wird die Nutzung digitaler Medien für das Schulmanagement und die Zusammenarbeit mit Kolleg*innen dazugezählt.',
        iconClass: 'fas fa-users',
      },
      {
        title: 'Lehren und Lernen',
        description:
          'Der Kompetenzbereich umfasst die Nutzung digitaler Medien zur Unterstützung von projektbasiertem, kollaborativen oder selbstregulierten Lernen, zur Unterrichtsdurchführung und Unterstützung der Lernenden.',
        iconClass: 'fas fa-book-open',
      },
      {
        title: 'Lernende fördern',
        description:
          'Der Kompetenzbereich umfasst die Gewährleistung von Barrierefreiheit und Inklusion, indem sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben. Genutzte Strategien sind die Differenzierung und Personalisierung von Lernaktivitäten, die aktive Motivation und die Förderung des Engagements der Schüler*innen.',
        iconClass: 'fas fa-hands-helping',
      },
      {
        title: 'Bewertung',
        description:
          'Der Kompetenzbereich umfasst die Anwendung von digitalen Medien zur Erfassung des Lernfortschrittes der Schüler*innen. Dabei wird Wert auf die kritische Analyse und Interpretation digitaler Informationen gelegt.',
        iconClass: 'fas fa-clipboard-check',
      },
      {
        title: 'Förderung digitalen Kompetenzen der Lernenden',
        description:
          'Der Kompetenzbereich umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht.',
        iconClass: 'fas fa-laptop-code',
      },
    ],
  },
]

function generateAccordions() {
  const container = document.getElementById('competency-accordions')

  competencies.forEach((category) => {
    // Create category heading
    const categoryHeading = document.createElement('h2')
    categoryHeading.textContent = category.category
    container.appendChild(categoryHeading)

    // Create accordion container
    const accordionContainer = document.createElement('div')
    accordionContainer.classList.add('accordion')

    category.items.forEach((item, index) => {
      // Accordion item
      const accordionItem = document.createElement('div')
      accordionItem.classList.add('accordion-item')

      // Accordion header
      const header = document.createElement('button')
      header.classList.add('accordion-header')
      header.setAttribute('aria-expanded', 'false')

      // Icon
      const icon = document.createElement('i')
      icon.className = `${item.iconClass} accordion-icon`

      // Title
      const title = document.createElement('span')
      title.textContent = item.title

      // Append icon and title to header
      header.appendChild(icon)
      header.appendChild(title)

      // Accordion content
      const content = document.createElement('div')
      content.classList.add('accordion-content')
      content.setAttribute('aria-hidden', 'true')

      const description = document.createElement('p')
      description.textContent = item.description

      content.appendChild(description)

      // Event listener for accordion toggle
      header.addEventListener('click', () => {
        const isExpanded = header.getAttribute('aria-expanded') === 'true'
        header.setAttribute('aria-expanded', !isExpanded)
        content.setAttribute('aria-hidden', isExpanded)
        header.classList.toggle('active')
      })

      // Assemble accordion item
      accordionItem.appendChild(header)
      accordionItem.appendChild(content)
      accordionContainer.appendChild(accordionItem)
    })

    container.appendChild(accordionContainer)
  })
}

document.addEventListener('DOMContentLoaded', generateAccordions)
