const surveyData = [
  {
    title: 'Persönliche Angaben',
    questions: [
      {
        text: 'Welches Geschlecht haben Sie?',
        type: 'radio',
        options: ['Weiblich', 'Männlich', 'Divers'],
      },
      {
        text: 'In welchem Jahr sind Sie geboren?',
        type: 'number',
        min: 1900,
        max: new Date().getFullYear(),
      },
    ],
  },
  {
    title: 'Suchen, Verarbeiten und Aufbewahren',
    questions: [
      {
        text: 'Ich kann auf Grundlage meiner Suchinteressen relevante Quellen in digitalen Umgebungen identifizieren und nutzen, z. B. Suchmaschinen aufgrund der inhaltlichen Ausrichtung meiner Suche auswählen.',
        type: 'scale',
      },
      {
        text: 'Ich kann verschiedene Suchstrategien im digitalen Raum nutzen, z. B. passende Suchbegriffe und Operatoren für meine Suche auswählen.',
        type: 'scale',
      },
      {
        text: 'Ich kann Informationen, Informationsquellen und Daten im digitalen Raum kritisch bewerten, z. B. kann ich bewerten, inwieweit Suchergebnisse meinen Interessen entsprechend individualisiert oder werbegeleitet sind.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Informationen und Daten sicher speichern, z. B. mache ich regelmäßig Back-Ups.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Informationen und Daten zweckgebunden organisieren und re-organisieren, z. B. sortiere ich Daten themenbezogen oder nach Dateiformat (z. B. Fotos, Audio und Videos).',
        type: 'scale',
      },
      {
        text: 'Ich kann Informationen, die ich gespeichert habe, von verschiedenen Orten abrufen, z. B. vom Smartphone auf Clouds zugreifen, um Fotos anzusehen.',
        type: 'scale',
      },
    ],
  },

  {
    title: 'Kommunikation und Kollaborieren',
    questions: [
      {
        text: 'Ich kann mithilfe verschiedener digitaler Medien kommunizieren, z. B. via E-Mail, Telefonate, Chats und Videokonferenztools.',
        type: 'scale',
      },
      {
        text: 'Ich kann verschiedene digitale Medien zur Kommunikation passend in unterschiedlichen Situationen wählen, z. B. Telefonate bei spontanen Nachfragen oder Videokonferenzen für die Kommunikation mit mehreren Beteiligten.',
        type: 'scale',
      },
      {
        text: 'Ich kann individuell anpassen, mit wem ich Daten und Informationen online teile, z. B. einstellen, wer Zugriff auf Dateien in der Cloud hat oder Fotos auf Social Media sehen kann.',
        type: 'scale',
      },
      {
        text: 'Ich kann Informationen und Dateien aus dem digitalen Raum zitieren und nutze anerkannte Regelwerke, z. B. Bildrechte, Creative Common Lizenzen.',
        type: 'scale',
      },
      {
        text: 'Ich kann mithilfe digitaler Medien aktiv an der Gesellschaft teilhaben, z. B. nutze ich Online-Services zur Terminbuchung oder Online-Banking.',
        type: 'scale',
      },
      {
        text: 'Ich kann meine Medienerfahrungen in Interaktion mit anderen weitergeben, z. B. schreibe ich über Erfahrungen mit Technologien und unterstütze andere, die Hilfe im Umgang mit Technologien benötigen.',
        type: 'scale',
      },
      {
        text: 'Ich kann Strategien nutzen, um unangemessene Inhalte und Verhaltensweisen, z. B. Fake News und Hate Speech, zu melden.',
        type: 'scale',
      },
    ],
  },
  {
    title: 'Produzieren und Präsentieren',
    questions: [
      {
        text: 'Ich kann die Einstellungen meines Internet-Browsers konfigurieren, um Cookies zu verhindern oder einzuschränken.',
        type: 'scale',
      },
      {
        text: 'Ich kann eigene digitale Produkte in verschiedenen Formaten erstellen, z. B. Textdokumente, Video- und Audiodateien.',
        type: 'scale',
      },
      {
        text: 'Ich kann eigene digitale Produkte in verschiedenen Formaten bearbeiten, z. B. Formatierung von Textdokumenten, Video- und Audiodateien schneiden.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Inhalte in verschiedenen Formaten zusammenführen, z. B. Word- und PDF-Dateien zu einer Datei zusammenfügen oder ein Video aus verschiedenen Fragmenten produzieren.',
        type: 'scale',
      },
      {
        text: 'Ich kann erkennen, wenn digitale Inhalte illegal zur Verfügung gestellt werden, z. B. Software, Filme, Musik, Bücher, Fernsehen.',
        type: 'scale',
      },
      {
        text: 'Ich kann mir einen Programmcode ansehen und den Zweck der einzelnen Befehle im Programmcode herleiten und erklären.',
        type: 'scale',
      },
      {
        text: 'Ich kann mithilfe einer Programmiersprache (z. B. Python, Visual Basic, Java) Skripte, Makros und einfache Anwendungen schreiben, um Aufgaben zu instruieren, z. B. Prozesse zu automatisieren.',
        type: 'scale',
      },
    ],
  },
  {
    title: 'Schützen und sicher agieren',
    questions: [
      {
        text: 'Ich kann die Gefahren und Risiken in digitalen Umgebungen beachten, z. B. erkennen, dass E-Mails von unbekannten Absendern Viren weiterleiten können, dass digitale Medien negativ die mentale Gesundheit beeinflussen können und dass Falschmeldungen schnell verbreitet werden.',
        type: 'scale',
      },
      {
        text: 'Ich kann meine Sicherheitseinstellungen auf meinen digitalen Geräten regelmäßig aktualisieren, z. B. installiere ich Programmupdates oder aktualisiere Passwörter.',
        type: 'scale',
      },
      {
        text: 'Ich kann Risiken und Gefahren meiner persönlichen Daten bei der Verknüpfung digitaler Funktionen erkennen, z. B. bei der Nutzung von Face ID oder der Freigabe meines Standortes.',
        type: 'scale',
      },
      {
        text: 'Ich kann in digitalen Umgebungen meine privaten Informationen durch geeignete Maßnahmen schützen, z. B. lehne ich Cookies ab, unterbinde Tracking und teile wenig private Informationen öffentlich.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Technologien gesundheitsbewusst nutzen, z. B. überprüfe und beschränke ich meine Nutzungsdauer.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Technologien umweltbewusst nutzen, z. B. Reparatur kaputter Geräte, Prüfung und Regulation des ökologischen Fußabdrucks durch Apps.',
        type: 'scale',
      },
    ],
  },
  {
    title: 'Problemlösen und Handeln',
    questions: [
      {
        text: 'Ich kann Lösungen für technische Probleme entwickeln, indem ich Schritt für Schritt das Problem identifiziere, z. B. wenn sich meine Geräte nicht mit dem WLAN verbinden oder Programme nicht gestartet werden.',
        type: 'scale',
      },
      {
        text: 'Ich kann Lösungen für technische Probleme online recherchieren und dann selbstständig Lösungsvorschläge umsetzen, z. B. wenn der Drucker nicht druckt oder ein Gerät nicht funktioniert.',
        type: 'scale',
      },
      {
        text: 'Ich kann digitale Werkzeuge zum persönlichen Gebrauch anpassen, z. B. die Formatierung bei Textprogrammen langfristig ändern.',
        type: 'scale',
      },
      {
        text: 'Ich kann herausfinden, ob es eine technologische Lösung gibt, die mir helfen könnte, einen persönlichen oder beruflichen Bedarf zu decken, z. B. für die Kommunikation und Organisation meines Alltags oder meiner Gesundheit.',
        type: 'scale',
      },
      {
        text: 'Ich kann Online-Lernwerkzeuge nutzen, um meine digitalen Kompetenzen weiterzuentwickeln, z. B. Video-Tutorials, Online-Kurse.',
        type: 'scale',
      },
      {
        text: 'Ich kann algorithmische Strukturen bei genutzten Tools erklären, z. B. wie beim Scannen eines QR-Codes eine Website aufgerufen wird oder bei der Einstellung einer Uhrzeit die App ein Signal äußert (Wecker).',
        type: 'scale',
      },
      {
        text: 'Ich kann Funktionsweisen und grundlegende Prinzipien des digitalen Raumes erklären, z. B. was ein Binärcode ist und wie ein Computer arbeitet.',
        type: 'scale',
      },
    ],
  },
  {
    title: 'Analysieren und Reflektieren',
    questions: [
      {
        text: 'Ich kann die Wirkung von Medien im digitalen Raum analysieren, z. B. welchen Einfluss die Nutzung von Medien auf Gesundheit und Gesellschaftsentwicklung hat.',
        type: 'scale',
      },
      {
        text: 'Ich kann eine interessengeleitete Verbreitung und die Dominanz von Themen im digitalen Raum beurteilen, z. B. dass Themen durch finanzierte Werbung verbreitet werden.',
        type: 'scale',
      },
      {
        text: 'Ich kann Chancen und Risiken der Nutzung digitaler Medien für meinen eigenen Mediengebrauch reflektieren, z. B. Abhängigkeiten von sozialen Netzwerken oder Chancen zur beruflichen Neuorientierung.',
        type: 'scale',
      },
      {
        text: 'Ich kann Vorteile von Geschäftsaktivitäten und Services im digitalen Raum analysieren, z. B. globale Vernetzung, die Digitalisierung von Dienstleistungen, innovative Arbeitsmodelle.',
        type: 'scale',
      },
      {
        text: 'Ich kann Risiken von Geschäftsaktivitäten und Services im digitalen Raum analysieren, z. B. Cyberkriminalität, Stress, Vernachlässigung persönlicher Kontakte.',
        type: 'scale',
      },
      {
        text: 'Ich kann Informationen, Informationsquellen und Daten im digitalen Raum als falsch identifizieren, z. B. Fake News.',
        type: 'scale',
      },
    ],
  },
]
