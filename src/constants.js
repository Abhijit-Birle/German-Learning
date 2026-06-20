// ============================================================
// App-wide constants — data that never changes at runtime
// ============================================================

export const INTERVIEW_TOPICS = [
  { id: 'agentic-ai',   icon: '🤖', label: 'Agentic AI',        desc: 'LLM agents, tool use, multi-agent systems, RAG' },
  { id: 'backend',      icon: '⚙️',  label: 'Backend Engineer',  desc: 'APIs, databases, scalability, microservices' },
  { id: 'frontend',     icon: '🖥️',  label: 'Frontend Engineer', desc: 'React/Vue, performance, accessibility, CSS' },
  { id: 'system-design',icon: '🏗️',  label: 'System Design',     desc: 'distributed systems, CAP theorem, caching, queues' },
  { id: 'behavioural',  icon: '🧠',  label: 'Behavioural Round', desc: 'STAR method, leadership, conflict, teamwork' },
];

export const SCENARIOS = [
  { id: 'interview',   icon: '💼', title: 'Job Interview',     de: 'Vorstellungsgespräch',  prompt: 'a job interview at a mid-size German tech company; the user is the candidate' },
  { id: 'meeting',     icon: '🗂️', title: 'Office Meeting',    de: 'Bürobesprechung',       prompt: 'a weekly team meeting in a German office discussing project status' },
  { id: 'restaurant',  icon: '🍽️', title: 'Restaurant',        de: 'Im Restaurant',         prompt: 'ordering food and interacting with a waiter at a restaurant in Germany' },
  { id: 'apartment',   icon: '🏠', title: 'Apartment Rental',  de: 'Wohnungsbesichtigung',  prompt: 'viewing and inquiring about renting an apartment with a landlord (Vermieter)' },
  { id: 'immigration', icon: '🛂', title: 'Immigration Office', de: 'Ausländerbehörde',      prompt: 'a visit to the Ausländerbehörde (immigration office) to extend a residence permit' },
  { id: 'doctor',      icon: '🩺', title: 'Doctor Visit',      de: 'Beim Arzt',             prompt: 'describing symptoms and talking with a doctor (Arzt) at a clinic' },
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
  { id: 'tutor',    label: 'Pfad',       icon: '📍' },
  { id: 'vocab',    label: 'Vokabeln',   icon: '🗂️' },
  { id: 'mistakes', label: 'Fehler',     icon: '🧠' },
  { id: 'writing',  label: 'Schreiben',  icon: '✍️' },
  { id: 'lesson',   label: 'Lektion',    icon: '📚' },
];
