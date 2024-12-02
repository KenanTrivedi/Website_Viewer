// courses.js

// Define competencies array
const competencies = [
  // General Competencies
  {
    title: 'Suchen, Verarbeiten und Aufbewahren',
    fullTitle: 'Suchen, Verarbeiten und Aufbewahren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen.',
    example:
      'Sucht im Internet nach verlässlichen Informationen zu einer Urlaubsreise, nutzt dabei mehrere Websites und vergleicht die Angebote. Um standortunabhängige und neutralere Ergebnisse zu erhalten, verwendet sie den Inkognito-Modus ihres Browsers. Speichert die Informationen und wichtigen Dokumente wie Flugtickets und Hotelbuchungen in einer Cloud mit deutscher Server-Standortoption, sodass jederzeit online- und offline darauf zugegriffen werden kann.',
    iconClass: 'fas fa-search',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Kommunikation und Kollaborieren',
    fullTitle: 'Kommunikation und Kollaborieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen.',
    example:
      'Verwendet Soziale Netzwerke, um kompetent und verantwortungsbewusst zu kommunizieren. Beispielsweise nutzt sie Facebook, um in einer lokalen Nachbarschaftsgruppe Hilfe bei einer Reparatur zu suchen. Sie überprüft zunächst, ob die Gruppe vertrauenswürdig ist, formuliert ihren Beitrag klar und respektvoll und antwortet auf Kommentare konstruktiv. Dabei achtet sie darauf, keine persönlichen Daten wie ihre genaue Adresse öffentlich zu teilen. Zudem überprüft sie die Glaubwürdigkeit von Empfehlungen und Profilen, indem sie Profile der Kommentierenden betrachtet und weitere unabhängige Informationen einholt.',
    iconClass: 'fas fa-comments',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Produzieren und Präsentieren',
    fullTitle: 'Produzieren und Präsentieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren.',
    example:
      'Gestaltet eine Geburtstagspräsentation mit Microsoft PowerPoint, fügt Animationen über die Menüleiste „Übergänge" hinzu und bettet Videos ein, indem sie „Einfügen" -> „Video" wählt. Alle Inhalte werden lokal auf dem genutzten Gerät gespeichert, um die Präsentation offline nutzen zu können.',
    iconClass: 'fas fa-chalkboard-teacher',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Schützen und sicher Agieren',
    fullTitle: 'Schützen und sicher Agieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Geräte und Inhalte zu schützen, Gesundheits- und Umweltgefahren zu vermeiden.',
    example:
      'Erstellt ein starkes Passwort für ihren E-Mail-Account, z. B. "S0mm3r#2024&Fav0rit", und nutzt für verschiedene Social-Media-Accounts unterschiedliche Passwörter. Sie aktiviert die Zwei-Faktor-Authentifizierung, um zusätzlichen Schutz zu gewährleisten, da ein Angreifer selbst mit dem richtigen Passwort ohne den zweiten Faktor (z. B. einen SMS-Code oder eine Authenticator-App) keinen Zugriff erhält.',
    iconClass: 'fas fa-shield-alt',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Problemlösen und Handeln',
    fullTitle: 'Problemlösen und Handeln',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen.',
    example:
      'Hat ein Problem mit dem WLAN zu Hause. Sie analysiert systematisch die Ursache, überprüft die Router-Anschlüsse, testet die Verbindung mit einem anderen Gerät und recherchiert in Online-Foren nach Lösungen. Mithilfe eines Video-Tutorials aktualisiert sie die Firmware des Routers. Wenn keine der Maßnahmen erfolgreich ist, kontaktiert sie einen Techniker, um das Problem zu beheben.',
    iconClass: 'fas fa-lightbulb',
    category: 'Allgemeine digitale Kompetenzen',
  },
  {
    title: 'Analysieren und Reflektieren',
    fullTitle: 'Analysieren und Reflektieren',
    description:
      'Umfasst das Wissen, die Motivation und Fähigkeiten, die Auswirkungen und Verbreitung digitaler Medien und Inhalte zu analysieren.',
    example:
      'Analysiert das Geschäftsmodell von Netflix, das darauf ausgelegt ist, durch attraktive Inhalte und benutzerfreundliche Features zunächst unverzichtbar zu wirken. Nachdem die Plattform eine breite Nutzerbasis aufgebaut hat, erhöht sie schrittweise die Abo-Preise und schränkt Funktionen wie das Teilen von Accounts ein. Die Person überprüft, wie sich diese Änderungen auf ihr eigenes Nutzungsverhalten auswirken, und entscheidet, ob sie ihr Abo weiterführt oder kündigt, da die höheren Kosten den wahrgenommenen Nutzen nicht mehr rechtfertigen.',
    iconClass: 'fas fa-chart-line',
    category: 'Allgemeine digitale Kompetenzen',
  },
  // Professional Competencies
  {
    title: 'Organisation und Administration',
    fullTitle: 'Organisation und Administration',
    description:
      'Umfasst das Suchen, Auswählen, Anpassen und die Nutzung von digitalen Medien, Informationen und Ressourcen zur Vorbereitung des eigenen Unterrichts. Zudem beinhaltet dieser Bereich das effiziente Management, den Schutz und die gemeinsame Nutzung digitaler Daten.',
    example:
      'Organisiert ihre Unterrichtsmaterialien digital in einem strukturierten Ordnersystem, das z.B. nach Fach und Klassenstufe sortiert ist. Zur Speicherung nutzt sie ein datenschutzkonformes Cloud-System, das idealerweise auch von den Kolleg*innen an der Schule verwendet wird. Dadurch kann die Lehrkraft jederzeit und mit verschiedenen Geräten auf die Materialien zugreifen und diese bei Bedarf anpassen oder aktualisieren. Zudem ermöglicht das Cloud-System eine einfache Zusammenarbeit und den Austausch von Materialien mit Kolleg*innen, um eine kontinuierliche Weiterentwicklung des Unterrichts sicherzustellen.',
    iconClass: 'fas fa-folder-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Berufliches Engagement außerhalb des Unterrichts',
    fullTitle: 'Berufliches Engagement außerhalb des Unterrichts',
    description:
      'Umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation und der Zusammenarbeit in Schule, z.B. mit Schüler*innen und Eltern. Weiterhin wird die Nutzung digitaler Medien für das Schulmanagement und die Zusammenarbeit mit Kolleg*innen dazugezählt.',
    example:
      'Bespricht mit den Eltern, welche Kommunikationskanäle für unterschiedliche Zwecke am besten geeignet sind, und entscheiden sich für einen – z. B. E-Mail oder Chatportal. Sie stellt sicher, dass alle Eltern Zugang zum gewählten Kommunikationskanal haben und die Funktionen sicher nutzen können, indem sie gegebenenfalls kurze Anleitungen zur Handhabung bereitstellt, sodass alle Eltern jederzeit Zugang zu den Unterlagen und Mitteilungen haben. Dabei achtet die Lehrkraft darauf, dass alle relevanten Informationen datenschutzkonform gespeichert werden.',
    iconClass: 'fas fa-users',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lehren und Lernen',
    fullTitle: 'Lehren und Lernen',
    description:
      'Umfasst die gezielte Nutzung digitaler Medien zur Unterstützung von projektbasierten, kollaborativen oder selbstregulierten Lernen sowie zur effektiven Durchführung des Unterrichts.',
    example:
      'Nutzt ein durch die Schule bereitgestelltes Lernmanagementsystem (LMS) zur Unterrichtsorganisation. Für jede Klasse richtet sie einen Kurs ein, in dem sie den Lernenden alle relevanten Materialien und Aufgaben digital zur Verfügung stellt. Dabei legt sie verschiedene Lernpfade für Schüler*innen an und differenziert die Aufgaben so, dass die Lernenden sie entsprechend ihrem Kenntnisstand selbstreguliert bearbeiten können. Sie agiert hierbei als Lernbegleiterin, indem sie via LMS regelmäßige Rückmeldungen gibt und die Lernenden bei Bedarf unterstützt.',
    iconClass: 'fas fa-book-open',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Lernende fördern',
    fullTitle: 'Lernende fördern',
    description:
      'Umfasst die Gewährleistung von Barrierefreiheit und Inklusion, indem sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben.',
    example:
      'Sorgt dafür, dass alle Schüler*innen Zugang zu digitalen Portalen und Lernressourcen haben, indem sie Tools auswählt die bspw. auf unterschiedlichen Geräten ohne Anmeldung funktionieren. Sie bietet differenzierte digitale Materialien an, darunter Texte, Videos, Podcasts und interaktive Übungen, die je nach Bedarf und Lernstand angepasst sind. Diese unterschiedlichen Formate ermöglichen eine individuelle, auf ihre Bedürfnisse zugeschnittene Auseinandersetzung mit dem Lerngegenstand.',
    iconClass: 'fas fa-hands-helping',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Bewertung',
    fullTitle: 'Bewertung',
    description:
      'Umfasst die Verwendung von digitalen Medien zur Erfassung und Bewertung des Lernfortschrittes. Weiterhin werden Feedbackprozesse durch den gezielten Einsatz digitaler Technologien effizient gestaltet.',
    example:
      'Die Schüler*innen bearbeiten über das Lernmanagementsystem (LMS) Quizze, laden Aufgabenlösungen hoch und führen Lerntagebuch. Die Lehrkraft erhält Echtzeit-Feedback zu den Lernfortschritten, erkennt, an welcher Stelle im Lernpfad die Schüler*innen stehen und welche Unterstützung sie benötigen. Die Entwicklung der Lernenden wird durch die Auswertung der Lerndaten im LMS kontinuierlich beobachtet und analysiert.',
    iconClass: 'fas fa-clipboard-check',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
  {
    title: 'Förderung digitaler Kompetenzen der Lernenden',
    fullTitle: 'Förderung digitaler Kompetenzen der Lernenden',
    description:
      'Umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht.',
    example:
      'Wählt gezielt digitale Kompetenzen aus dem KMK-Kompetenzrahmen aus, die im Deutschunterricht gefördert werden können. Sie zeigt den Schüler*innen, wie sie mithilfe von digitalen Medien, wie Online-Datenbanken, Enzyklopädien oder wissenschaftlichen Suchmaschinen, Informationen zu literarischen oder sprachlichen Themen recherchieren. Außerdem vermittelt sie, wie man digitale Quellen auf ihre Validität prüft und verschiedene Perspektiven auf Texte oder Themen durch Online-Diskussionen und multimediale Inhalte einnimmt.',
    iconClass: 'fas fa-laptop-code',
    category: 'Berufsspezifische digitale Kompetenzen',
  },
]

// Competency descriptions
const competencyDescriptions = {
  'suchen-verarbeiten-und-aufbewahren': {
    title: "Suchen, Verarbeiten und Aufbewahren",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, gezielt nach digitalen Daten und Inhalten zu suchen, diese effektiv zu organisieren, zu speichern und abzurufen."
  },
  'kommunikation-und-kollaborieren': {
    title: "Kommunikation und Kollaborieren",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, mithilfe digitaler Technologien effektiv zu interagieren, zu kollaborieren und Informationen auszutauschen."
  },
  'produzieren-und-präsentieren': {
    title: "Produzieren und Präsentieren",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte in verschiedenen Formaten zu erstellen, zu bearbeiten und zu integrieren."
  },
  'schützen-und-sicher-agieren': {
    title: "Schützen und sicher Agieren",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, digitale Inhalte und Geräte zu schützen, Gesundheits- und Umweltgefahren zu vermeiden."
  },
  'problemlösen-und-handeln': {
    title: "Problemlösen und Handeln",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, technische Probleme zu erkennen und zu lösen."
  },
  'analysieren-und-reflektieren': {
    title: "Analysieren und Reflektieren",
    description: "Umfasst das Wissen, die Motivation und Fähigkeiten, über die Auswirkungen und Verwendung digitaler Medien und Inhalte zu analysieren."
  },
  'organisation-und-administration': {
    title: "Organisation und Administration",
    description: "Umfasst das Suchen, Auswählen, Anpassen und die Nutzung von digitalen Werkzeugen, Medien und Ressourcen zur Vorbereitung des eigenen Unterrichts."
  },
  'lehren-und-lernen': {
    title: "Lehren und Lernen",
    description: "Umfasst die gezielte Nutzung digitaler Medien zur Unterstützung von projektbasiertem, kollaborativem oder selbstreguliertem Lernen sowie die effektive Durchführung des Unterrichts."
  },
  'lernende-fördern': {
    title: "Lernende fördern",
    description: "Umfasst die Gewährleistung von Barrierefreiheit und Inklusion, damit sichergestellt wird, dass alle Schüler*innen gleichberechtigten Zugang zu digitalen Medien und Lernressourcen haben."
  },
  'berufliches-engagement-außerhalb-des-unterrichts': {
    title: "Berufliches Engagement außerhalb des Unterrichts",
    description: "Umfasst die Nutzung von digitalen Medien zur Verbesserung der Kommunikation und professionellen Zusammenarbeit in Schule, z.B. mit Schüler*innen und Eltern."
  },
  'bewertung': {
    title: "Bewertung",
    description: "Umfasst die Verwendung von digitalen Medien zur Erfassung und Bewertung von Lernfortschritten. Weiterhin werden Feedbackprozesse durch den gezielten Einsatz digitaler Technologien effizient gestaltet."
  },
  'förderung-digitaler-kompetenzen-der-lernenden': {
    title: "Förderung digitaler Kompetenzen der Lernenden",
    description: "Umfasst die Vermittlung von grundlegenden digitalen Kompetenzen im Unterricht."
  }
};

document.addEventListener('DOMContentLoaded', () => {
    const competencyCards = document.querySelectorAll('.competency-card');
    const titleElement = document.querySelector('.selected-competency-title');
    const descriptionElement = document.querySelector('.selected-competency-description');
    const exampleElement = document.querySelector('.selected-competency-example');

    function updateActiveCard(clickedCard) {
        // Remove active class from all cards
        competencyCards.forEach(card => card.classList.remove('active'));
        // Add active class to clicked card
        clickedCard.classList.add('active');
    }

    competencyCards.forEach(card => {
        card.addEventListener('click', () => {
            // Get the competency type from the card's data attribute
            const competencyType = card.dataset.competency;
            const title = card.querySelector('.competency-title').textContent;
            
            // Find the matching competency data
            const competency = competencies.find(c => c.title === title);
            
            if (competency) {
                // Update the display area
                titleElement.textContent = competency.fullTitle || competency.title;
                descriptionElement.textContent = competency.description || 'Beschreibung wird geladen...';
                exampleElement.textContent = competency.example || 'Beispiel wird geladen...';
                
                // Update active state
                updateActiveCard(card);
            }
        });
    });
    
    // Trigger click on first card to show initial content
    if (competencyCards.length > 0) {
        competencyCards[0].click();
    }
});
