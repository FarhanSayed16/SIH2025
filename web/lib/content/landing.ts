/**
 * Kavach Landing Page — Content Module
 * All copy, data, and content strings in one place.
 */

export const SITE = {
  name: 'Kavach',
  tagline: 'One platform to prevent, detect, and respond.',
  description: 'AI-powered disaster preparedness & school safety platform',
  copyright: `© ${new Date().getFullYear()} Kavach. Built for Smart India Hackathon.`,
  contactEmail: 'kavach.sih2025@gmail.com',
  apkUrl: '/kavach-v1.apk',
  apkVersion: '1.0.0',
  loginUrl: '/login',
  dashboardUrl: '/dashboard',
  privacyUrl: '/privacy',
};

export const HERO = {
  brand: 'KAVACH',
  brandNote: 'School safety platform',
  tagline: 'One platform to prevent, detect, and respond.',
  headline: 'Protect every classroom with preparedness that actually runs.',
  headlineLead: 'Protect every classroom.',
  headlineFollow: 'Preparedness that actually runs.',
  support: 'AI learning, live sensing, drills, and parent alerts — built as one school-safety system.',
  awardLine: 'Smart India Hackathon 2025 · National Award · First Prize',
  kickerPrize: 'National First Prize',
  kickerEvent: 'Smart India Hackathon 2025',
  ctaPrimary: 'Download Android App',
  ctaSecondary: 'Institution Login',
  proof: ['Web console + Android app', 'No IoT hardware required', 'NDMA-aligned modules'],
};

export const RECOGNITION = {
  title: 'Recognised nationally. Designed for real schools.',
  award: {
    name: 'Smart India Hackathon (SIH) 2025',
    achievement: 'National Award — First Prize',
    framing: 'National-level recognition for an end-to-end school disaster preparedness solution',
    theme: 'Disaster Management / School Safety',
  },
  alignment: {
    title: 'Built for India\'s school safety mission',
    body: 'Kavach was designed to help schools move from fragmented drills and paper SOPs to a living system: continuous learning, live sensing where hardware is deployed, and fast communication to teachers and parents. The platform is aligned with the spirit of national disaster preparedness efforts under NDMA, school-safety priorities associated with the Ministry of Education, and practical adoption needs for institutions in states such as Punjab.',
    disclaimer: 'Kavach is an independent technology platform developed for Smart India Hackathon 2025. Mentions of ministries and agencies indicate thematic alignment with publicly known school-safety and disaster-preparedness goals, unless a formal partnership or MoU is separately announced.',
  },
  institutions: [
    {
      name: 'Ministry of Education',
      shortName: 'MoE',
      context: 'School safety, digital education readiness, and institutional preparedness',
      logo: '/landing/ministry-of-education.svg',
    },
    {
      name: 'Government of Punjab',
      shortName: 'Punjab',
      context: 'Regional focus — Punjab schools, local hazard awareness, state education ecosystem',
      logo: '/landing/govt-of-punjab.svg',
    },
    {
      name: 'National Disaster Management Authority',
      shortName: 'NDMA',
      context: 'Disaster awareness, preparedness culture, and school-level readiness themes',
      logo: '/landing/ndma-logo.jpg',
    },
  ],
};

export const PROBLEM = {
  title: 'Paper plans don\'t sense smoke. Chat apps don\'t run drills.',
  subtitle: 'Schools juggle alarms, WhatsApp trees, and binders. Kavach replaces the scatter with one accountable loop.',
  rows: [
    {
      pain: 'Scattered tools',
      today: 'Alarms, WhatsApp, paper logs',
      withKavach: 'One web + mobile + IoT ecosystem',
    },
    {
      pain: 'Weak real-time awareness',
      today: 'Delayed or no sensor signal',
      withKavach: 'ESP32 nodes → alerts & dashboards',
    },
    {
      pain: 'Drill fatigue',
      today: 'Manual attendance & reports',
      withKavach: 'Structured drills, AI summaries, certificates',
    },
    {
      pain: 'Generic safety content',
      today: 'One-size posters',
      withKavach: 'Ask Kavach, tips, scenario games, quizzes',
    },
    {
      pain: 'Slow crisis messaging',
      today: 'Ad-hoc calls/messages',
      withKavach: 'Broadcast + FCM + AI-drafted parent messages',
    },
  ],
};

export const SOLUTION = {
  title: 'Prevent. Detect. Respond.',
  oneLiner: 'Kavach unifies IoT hazard sensing, AI-assisted learning & drafting, and institution-wide drill & alert management so students, teachers, admins, and parents stay in one loop.',
  pillars: [
    {
      name: 'Prevent',
      description: 'Modules, quizzes, games, preparedness scoring',
      icon: 'shield',
    },
    {
      name: 'Detect',
      description: 'IoT sensors (fire / flood / shake), thresholds, live health',
      icon: 'radar',
    },
    {
      name: 'Respond',
      description: 'Drills, SOS fan-out, broadcasts, crisis dashboards, parent notify',
      icon: 'zap',
    },
  ],
};

export const ROLES = [
  {
    role: 'Students',
    icon: 'graduation-cap',
    points: [
      'Learn NDMA-aligned safety modules and earn certificates',
      'Practice with scenario games & quizzes (preparedness score)',
      'Receive drill instructions and push alerts on the phone',
      'Ask Kavach (text/voice) for calm, age-appropriate guidance',
    ],
  },
  {
    role: 'Teachers',
    icon: 'book-open',
    points: [
      'Run and track class drills; see participation',
      'Manage classes, approvals, student linkage',
      'Use AI to draft alerts and summarise incidents/drills',
      'Monitor devices / incidents from the web console',
    ],
  },
  {
    role: 'School Admins',
    icon: 'building-2',
    points: [
      'Institution-level users, devices, reports, analytics',
      'Broadcast critical messages across channels',
      'Crisis dashboard for situational awareness',
      'Audit-friendly reports instead of scattered spreadsheets',
    ],
  },
  {
    role: 'Parents',
    icon: 'heart',
    points: [
      'Linked-child visibility and notifications',
      'Calmer, clearer crisis messaging (AI-assisted)',
      'Web parent flows; mobile for on-the-go alerts',
    ],
  },
];

export const CAPABILITIES = [
  {
    band: 'Learning & Preparedness',
    icon: 'book-open',
    features: [
      'Learning modules & video progress',
      'Quizzes, badges, leaderboards',
      'Preparedness score',
      'Disaster scenario games',
      'Accessibility settings (web + mobile)',
    ],
  },
  {
    band: 'AI (Google Gemini)',
    icon: 'brain',
    features: [
      'Ask Kavach Q&A (+ voice on mobile)',
      'Daily safety tip',
      'Hazard analysis & evacuation assist',
      'Draft alert & parent crisis messages',
      'Drill / incident summarisation',
    ],
  },
  {
    band: 'Operations & Communication',
    icon: 'radio',
    features: [
      'Drill lifecycle (schedule → execute → report)',
      'Multi-channel broadcast (push + email)',
      'FCM real-time notifications',
      'Parent–student–teacher linkage',
      'Role-based web dashboards',
    ],
  },
  {
    band: 'IoT & Sensing',
    icon: 'cpu',
    features: [
      'ESP32 multi-sensor nodes',
      'Telemetry, thresholds, health monitoring',
      'Live Socket.io updates to dashboards',
      'Enabled per deployment when hardware is ready',
    ],
  },
];

export const ARCHITECTURE = {
  title: 'How the system works',
  subtitle: 'One backbone connecting learning, sensing, and alerts across every surface.',
  surfaces: [
    {
      title: 'Students & parents',
      note: 'Android app for learning, drill instructions, and push alerts.',
    },
    {
      title: 'School staff',
      note: 'Web console for people, drills, broadcasts, and reports.',
    },
    {
      title: 'Classroom sensors',
      note: 'Optional ESP32 nodes streaming live hazard signals.',
    },
  ],
};

export const TEAM = [
  {
    name: 'Farhan Sayed',
    role: 'Core Developer — Frontend, Backend & IoT Systems Designer',
    summary: 'End-to-end product architecture; Next.js web; Node API; ESP32/IoT integration design; deployment & platform wiring',
  },
  {
    name: 'Manas Sawant',
    role: 'ML, Game Engine & AR/VR Developer',
    summary: 'Machine-learning / AI feature collaboration; game engine experiences; AR/VR direction for immersive safety learning',
  },
  {
    name: 'Om Parab',
    role: 'UI/UX, Testing & Design',
    summary: 'Interface & experience design; visual consistency; usability testing; quality and polish across surfaces',
  },
];

export const EXTENDED_TEAM = [
  {
    name: 'Jayprakash Morya',
    role: 'Co-Developer',
    summary: 'Assisted with website frontend components and development support.',
  },
  {
    name: 'Divyashree Gudla',
    role: 'Research & Presentation',
    summary: 'Conducted project research and prepared presentation materials.',
  },
  {
    name: 'Madhura Navele',
    role: 'Documentation',
    summary: 'Managed project documentation and compiled comprehensive reports.',
  },
];

export const MENTORS = [
  {
    name: 'Dr. Geeta Sahu',
    role: 'Mentor',
    summary: 'Strategic guidance, domain expertise, and continuous academic support.',
    img: '/team/Geeta_Sahu.jpg',
  },
  {
    name: 'Dr. Umesh Koyande',
    role: 'Mentor',
    summary: 'Technical architecture guidance, implementation oversight, and project execution strategy.',
    img: '/team/Dr.-Umesh-Koyande-Dept.jpg',
  },
];

export const FAQ = [
  {
    q: 'Is Kavach an official MoE/NDMA product?',
    a: 'No — it\'s an SIH-built platform aligned with school-safety & preparedness goals.',
  },
  {
    q: 'Who downloads the APK?',
    a: 'Students, teachers, and parents on Android.',
  },
  {
    q: 'Who uses the website login?',
    a: 'Institution staff (admin/teacher) and parent web flows.',
  },
  {
    q: 'Does it replace fire brigade / police / NDRF?',
    a: 'No — it improves school preparedness and communication.',
  },
  {
    q: 'Is IoT required?',
    a: 'No — learning, drills, and alerts work without sensors. IoT adds live detection.',
  },
  {
    q: 'Is my school data secure?',
    a: 'Production deploy uses HTTPS, auth, role-based access. See our Privacy page.',
  },
];

export const IMPACT_INTRO = {
  title: 'What changes once Kavach is running',
  subtitle:
    'Not projections — these are the outcomes the platform is explicitly designed to produce inside a school.',
};

export const IMPACT = [
  { theme: 'Higher drill readiness', support: 'Structured drills + participation tracking' },
  { theme: 'Faster awareness', support: 'Push + broadcast + optional sensors' },
  { theme: 'Better learning retention', support: 'Games, quizzes, Ask Kavach AI' },
  { theme: 'Parent peace of mind', support: 'Linked alerts & clear messaging' },
  { theme: 'Admin visibility', support: 'Dashboards, reports, incident views' },
];

export const INSTITUTIONS_CTA = {
  title: 'Ready to bring Kavach to your school?',
  subtitle: 'Whether you\'re a school, college campus, or training institute — Kavach is built to scale with your preparedness needs.',
  ctaPrimary: 'Request a Pilot',
  ctaSecondary: 'Staff Login',
  mailto: 'mailto:kavach.sih2025@gmail.com?subject=Kavach%20School%20Pilot',
};

export const DOWNLOAD = {
  title: 'Carry Kavach in every backpack.',
  subtitle: 'Download the Android app for learning, drills, and alerts. Staff dashboards stay on the web.',
  button: 'Download APK',
  meta: {
    version: '1.0.0',
    minAndroid: 'Android 8.0+',
  },
  installNote: 'Android may ask to allow installs from this source.',
  iosNote: 'iOS via TestFlight — coming soon',
  staffNote: 'Institution dashboards: use Login on web.',
};

export const NAV_LINKS = [
  { label: 'Recognition', href: '#recognition' },
  { label: 'Roles', href: '#roles' },
  { label: 'Impact', href: '#impact' },
  { label: 'Platform', href: '#capabilities' },
  { label: 'For Schools', href: '#institutions' },
  { label: 'Team', href: '#team' },
];
