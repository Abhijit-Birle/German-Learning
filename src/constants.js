// ============================================================
// App-wide constants — data that never changes at runtime
// ============================================================

export const SCENARIO_TOPICS = {
  interview: [
    { id: 'agentic-ai',   label: 'Agentic AI',        desc: 'LLM agents, tool use, multi-agent systems, RAG' },
    { id: 'backend',      label: 'Backend Engineer',  desc: 'APIs, databases, scalability, microservices' },
    { id: 'frontend',     label: 'Frontend Engineer', desc: 'React/Vue, performance, accessibility, CSS' },
    { id: 'system-design',label: 'System Design',     desc: 'distributed systems, CAP theorem, caching, queues' },
    { id: 'behavioural',  label: 'Behavioural Round', desc: 'STAR method, leadership, conflict, teamwork' },
  ],
  meeting: [
    { id: 'daily-standup', label: 'Daily Standup', desc: "Reporting yesterday's work, today's goals, and blockers" },
    { id: 'project-kickoff', label: 'Project Kickoff', desc: 'Introducing a new project, timelines, and responsibilities' },
    { id: 'performance-review', label: 'Performance Review', desc: 'Discussing achievements, areas of improvement, and goals' },
    { id: 'client-presentation', label: 'Client Presentation', desc: 'Presenting a product demo or pitch to a client' },
  ],
  restaurant: [
    { id: 'ordering-dinner', label: 'Ordering Dinner', desc: 'Reserving a table, asking for recommendations, ordering food and drinks' },
    { id: 'complaining', label: 'Complaining about Food', desc: 'The soup is cold, the steak is undercooked, asking for the manager' },
    { id: 'paying-bill', label: 'Paying the Bill', desc: 'Asking for the check, splitting the bill, leaving a tip' },
    { id: 'dietary-reqs', label: 'Dietary Restrictions', desc: 'Asking about vegan options, gluten allergies, and ingredients' },
  ],
  apartment: [
    { id: 'viewing', label: 'Apartment Viewing', desc: 'Asking about rent, Nebenkosten, heating, and neighborhood' },
    { id: 'contract-signing', label: 'Signing the Lease', desc: 'Discussing the deposit (Kaution), notice period, and rules' },
    { id: 'reporting-issues', label: 'Reporting Issues', desc: 'The heater is broken, there is mold, or neighbors are loud' },
    { id: 'moving-in', label: 'Moving In/Out', desc: 'Handing over keys, reading meters, protocol (Übergabeprotokoll)' },
  ],
  immigration: [
    { id: 'blue-card', label: 'EU Blue Card', desc: 'Applying for or extending an EU Blue Card for highly skilled workers' },
    { id: 'anmeldung', label: 'City Registration (Anmeldung)', desc: 'Registering your address at the Bürgeramt' },
    { id: 'permanent-residency', label: 'Permanent Residency', desc: 'Applying for Niederlassungserlaubnis' },
    { id: 'student-visa', label: 'Student Visa', desc: 'Extending a visa for university studies and part-time work' },
  ],
  doctor: [
    { id: 'cold-flu', label: 'Cold and Flu', desc: 'Describing fever, cough, sore throat, and asking for a sick note (AU)' },
    { id: 'specialist', label: 'Specialist Referral', desc: 'Asking for a referral (Überweisung) to a dermatologist or orthopedist' },
    { id: 'prescription', label: 'Prescription Refill', desc: 'Asking for a refill of regular medication (Rezept)' },
    { id: 'injury', label: 'Sports Injury', desc: 'Sprained ankle, knee pain, explaining how the accident happened' },
  ]
};

export const SCENARIOS = [
  { id: 'interview',   icon: 'Briefcase', title: 'Job Interview',     de: 'Vorstellungsgespräch',  prompt: 'a job interview at a mid-size German tech company; the user is the candidate' },
  { id: 'meeting',     icon: 'Users', title: 'Office Meeting',    de: 'Bürobesprechung',       prompt: 'a weekly team meeting in a German office discussing project status' },
  { id: 'restaurant',  icon: 'Utensils', title: 'Restaurant',        de: 'Im Restaurant',         prompt: 'ordering food and interacting with a waiter at a restaurant in Germany' },
  { id: 'apartment',   icon: 'Home', title: 'Apartment Rental',  de: 'Wohnungsbesichtigung',  prompt: 'viewing and inquiring about renting an apartment with a landlord (Vermieter)' },
  { id: 'immigration', icon: 'Building2', title: 'Immigration Office', de: 'Ausländerbehörde',      prompt: 'a visit to the Ausländerbehörde (immigration office) to extend a residence permit' },
  { id: 'doctor',      icon: 'Stethoscope', title: 'Doctor Visit',      de: 'Beim Arzt',             prompt: 'describing symptoms and talking with a doctor (Arzt) at a clinic' },
];

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const GEMINI_VOICES = [
  { id: 'Kore',    label: 'Kore — warm, female' },
  { id: 'Puck',    label: 'Puck — upbeat, male' },
  { id: 'Charon',  label: 'Charon — calm, male' },
  { id: 'Aoede',   label: 'Aoede — bright, female' },
  { id: 'Fenrir',  label: 'Fenrir — energetic, male' },
  { id: 'Leda',    label: 'Leda — youthful, female' },
  { id: 'Orus',    label: 'Orus — firm, male' },
  { id: 'Sulafat', label: 'Sulafat — soft, female' },
];

export const TABS = [
  { id: 'tutor',    label: 'Pfad',       icon: 'Map' },
  { id: 'vocab',    label: 'Vokabeln',   icon: 'BookOpen' },
  { id: 'mistakes', label: 'Fehler',     icon: 'AlertTriangle' },
  { id: 'writing',  label: 'Schreiben',  icon: 'PenTool' },
  { id: 'lesson',   label: 'Lektion',    icon: 'Layers' },
];
