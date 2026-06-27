export const MOCK_EXERCISES = [
  // A1 - Basics
  {
    id: 'ex_a1_1', lessonId: 'l_a1_1', lessonName: 'Greetings & Basics', level: 'A1', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: 'How do you say "Good morning" in German?',
    options: ['Guten Tag', 'Guten Morgen', 'Gute Nacht', 'Auf Wiedersehen'],
    correctAnswer: 'Guten Morgen',
  },
  {
    id: 'ex_a1_2', lessonId: 'l_a1_1', lessonName: 'Greetings & Basics', level: 'A1', scenario: 'Restaurant',
    type: 'sentence_builder',
    question: 'Translate: "I would like water, please."',
    options: ['Ich', 'Wasser,', 'hätte', 'bitte', 'gerne'],
    correctAnswer: 'Ich hätte gerne Wasser, bitte',
  },
  {
    id: 'ex_a1_3', lessonId: 'l_a1_1', lessonName: 'Greetings & Basics', level: 'A1', scenario: 'Apartment Viewing',
    type: 'fill_blank',
    question: 'Fill in the blank for "Hello": ___ Tag',
    correctAnswer: 'Guten',
  },

  // A2 - Intermediate Basics
  {
    id: 'ex_a2_1', lessonId: 'l_a2_1', lessonName: 'Articles & Cases', level: 'A2', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: '___ Haus (the house)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'das',
  },
  {
    id: 'ex_a2_2', lessonId: 'l_a2_1', lessonName: 'Articles & Cases', level: 'A2', scenario: 'Restaurant',
    type: 'multiple_choice',
    question: '___ Tisch (the table)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'der',
  },
  {
    id: 'ex_a2_3', lessonId: 'l_a2_1', lessonName: 'Articles & Cases', level: 'A2', scenario: 'Immigration Office',
    type: 'translation',
    question: 'Translate: "Where is the registration office?"',
    correctAnswer: 'Wo ist das Einwohnermeldeamt?',
  },
  {
    id: 'ex_a2_4', lessonId: 'l_a2_1', lessonName: 'Articles & Cases', level: 'A2', scenario: 'Office Meeting',
    type: 'sentence_builder',
    question: 'Translate: "The meeting is today."',
    options: ['Das', 'Meeting', 'ist', 'heute'],
    correctAnswer: 'Das Meeting ist heute',
  },

  // B1 - Intermediate
  {
    id: 'ex_b1_1', lessonId: 'l_b1_1', lessonName: 'Professional Context', level: 'B1', scenario: 'Job Interview',
    type: 'fill_blank',
    question: 'Ich interessiere mich ___ diese Position. (for)',
    correctAnswer: 'für',
  },
  {
    id: 'ex_b1_2', lessonId: 'l_b1_1', lessonName: 'Professional Context', level: 'B1', scenario: 'Job Interview',
    type: 'sentence_builder',
    question: 'Translate: "I have three years of experience."',
    options: ['Ich', 'habe', 'drei', 'Jahre', 'Erfahrung'],
    correctAnswer: 'Ich habe drei Jahre Erfahrung',
  },
  {
    id: 'ex_b1_3', lessonId: 'l_b1_2', lessonName: 'Subordinate Clauses', level: 'B1', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: 'Ich bleibe zu Hause, ___ ich krank bin.',
    options: ['weil', 'denn', 'trotzdem', 'obwohl'],
    correctAnswer: 'weil',
  },

  // B2 - Upper Intermediate
  {
    id: 'ex_b2_1', lessonId: 'l_b2_1', lessonName: 'Advanced Grammar & Passive', level: 'B2', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: 'Das Dokument ___ gestern von mir unterschrieben.',
    options: ['wurde', 'worden', 'war', 'ist'],
    correctAnswer: 'wurde',
  },
  {
    id: 'ex_b2_2', lessonId: 'l_b2_1', lessonName: 'Advanced Grammar & Passive', level: 'B2', scenario: 'Job Interview',
    type: 'sentence_builder',
    question: 'Translate: "I am used to working under pressure."',
    options: ['Ich', 'bin', 'es', 'gewohnt,', 'unter', 'Druck', 'zu', 'arbeiten.'],
    correctAnswer: 'Ich bin es gewohnt, unter Druck zu arbeiten.',
  },
  {
    id: 'ex_b2_3', lessonId: 'l_b2_2', lessonName: 'Nuanced Expressions', level: 'B2', scenario: 'Immigration Office',
    type: 'fill_blank',
    question: 'Ich lege großen ___ auf Pünktlichkeit. (value/emphasis)',
    correctAnswer: 'Wert',
  },

  // C1 - Advanced
  {
    id: 'ex_c1_1', lessonId: 'l_c1_1', lessonName: 'Idioms & Complex Syntax', level: 'C1', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: 'Which idiom means "to beat around the bush"?',
    options: ['um den heißen Brei herumreden', 'die Kirche im Dorf lassen', 'Schwein haben', 'ins Fettnäpfchen treten'],
    correctAnswer: 'um den heißen Brei herumreden',
  },
  {
    id: 'ex_c1_2', lessonId: 'l_c1_1', lessonName: 'Idioms & Complex Syntax', level: 'C1', scenario: 'Job Interview',
    type: 'sentence_builder',
    question: 'Form the sentence: "Should questions arise, please contact me."',
    options: ['Sollten', 'sich', 'Fragen', 'ergeben,', 'wenden', 'Sie', 'sich', 'bitte', 'an', 'mich.'],
    correctAnswer: 'Sollten sich Fragen ergeben, wenden Sie sich bitte an mich.',
  },
  {
    id: 'ex_c1_3', lessonId: 'l_c1_2', lessonName: 'Formal Writing', level: 'C1', scenario: 'Apartment Viewing',
    type: 'fill_blank',
    question: 'Bezugnehmend ___ Ihr Schreiben vom 3. Mai... (referring to)',
    correctAnswer: 'auf',
  },

  // C2 - Mastery
  {
    id: 'ex_c2_1', lessonId: 'l_c2_1', lessonName: 'Academic & Abstract Language', level: 'C2', scenario: 'Office Meeting',
    type: 'multiple_choice',
    question: 'Which word best describes a "paradigm shift"?',
    options: ['Paradigmenwechsel', 'Weltanschauung', 'Zusammenhang', 'Meinungsverschiedenheit'],
    correctAnswer: 'Paradigmenwechsel',
  },
  {
    id: 'ex_c2_2', lessonId: 'l_c2_1', lessonName: 'Academic & Abstract Language', level: 'C2', scenario: 'Job Interview',
    type: 'translation',
    question: 'Translate: "The implications of this decision are far-reaching and multifaceted."',
    correctAnswer: 'Die Auswirkungen dieser Entscheidung sind weitreichend und vielschichtig.',
  },
  {
    id: 'ex_c2_3', lessonId: 'l_c2_2', lessonName: 'Extreme Nuance', level: 'C2', scenario: 'Immigration Office',
    type: 'fill_blank',
    question: 'Er hat sich ___ dieser Angelegenheit voll und ganz verschrieben. (to)',
    correctAnswer: 'der',
  }
];
