// Romania PFA (Persoana Fizică Autorizată) tax rules — 2025
// Sources: ANAF, Romanian Fiscal Code
//
// Income tax: 10% flat on net income (after CAS deduction)
// CAS (pension): 25% — only if annual income ≥ 12× minimum wage
//   Minimum base = 12 × 4,050 RON = 48,600 RON/year → 12,150 RON/year
// CASS (health): 10% on 6× minimum wage = 10% × 24,300 = 2,430 RON/year (fixed minimum)
//   If income > 60× minimum wage: 10% × income, capped at 60× min wage
// Minimum wage 2025: 4,050 RON/month
// Quarterly deadlines: April 25, July 25, October 25 (no Q4 advance)

const MIN_WAGE_MONTHLY = 4050   // RON, 2025
const MIN_WAGE_ANNUAL  = MIN_WAGE_MONTHLY * 12  // 48,600

const CAS_RATE  = 0.25
const CASS_RATE = 0.10
const IT_RATE   = 0.10

function calcTax(totalIncome, totalExpenses, legalForm, options = {}) {
  const { monthsElapsed = new Date().getMonth() + 1 } = options
  if (legalForm === 'just_tracking') return null

  // Scale thresholds to months elapsed for interim estimates
  const scale = monthsElapsed / 12
  const casThreshold  = MIN_WAGE_ANNUAL * scale         // need > this for CAS to apply
  const cassBase      = MIN_WAGE_MONTHLY * 6 * scale    // 24,300 RON/year scaled

  let cas  = 0
  let cass = 0

  if (totalIncome >= casThreshold) {
    cas = MIN_WAGE_ANNUAL * scale * CAS_RATE  // 12,150 RON/year scaled
  }

  // CASS: fixed minimum on 6× min wage, or 10% of income if very high
  const cassHighThreshold = MIN_WAGE_MONTHLY * 60 * scale
  if (totalIncome >= cassHighThreshold) {
    cass = cassHighThreshold * CASS_RATE
  } else {
    cass = cassBase * CASS_RATE  // 2,430 RON/year scaled
  }

  const insurance = cas + cass
  const taxableBase = Math.max(0, totalIncome - cas)
  const incomeTax   = taxableBase * IT_RATE

  return {
    taxableBase,
    incomeTax,
    insurance,
    cas,
    cass,
    total: incomeTax + insurance,
    monthsElapsed,
    rate: 10,
    casRate: CAS_RATE * 100,
    cassRate: CASS_RATE * 100,
  }
}

function getInsuranceRate() {
  // Monthly minimum insurance cost (CAS + CASS) — used for dashboard card
  return Math.round(MIN_WAGE_ANNUAL * CAS_RATE / 12 + MIN_WAGE_MONTHLY * 6 * CASS_RATE / 12)
  // = 1,012.50 + 202.50 = ~1,215 RON/month minimum (when CAS applies)
}

function getQuarterlyDeadlines(year) {
  return [
    { quarter: 'Q1', date: new Date(year, 3, 25) },  // April 25
    { quarter: 'Q2', date: new Date(year, 6, 25) },  // July 25
    { quarter: 'Q3', date: new Date(year, 9, 25) },  // October 25
  ]
}

function getInsuranceDueDay() { return 25 }

function getAnnualDeadline(year) {
  return new Date(year, 4, 25)  // May 25
}

export default {
  id: 'ro',
  name: 'Romania',
  nameLocal: 'România',
  flag: '🇷🇴',
  currency: 'RON',
  currencyCode: 'RON',
  language: 'ro',
  supportsFullTax: true,

  taxAuthority: {
    name: 'ANAF',
    fullName: 'Agenția Națională de Administrare Fiscală',
    url: 'https://anaf.ro',
    portalUrl: 'https://www.anaf.ro/anaf/internet/RO/aplicate',
  },

  legalForms: [
    {
      value: 'pfa',
      label: { en: 'Freelancer (PFA)', ro: 'Persoană Fizică Autorizată' },
      sub: { en: 'Designer, developer, consultant', ro: 'Designer, programator, consultant' },
      desc: { en: 'Authorised individual — most common structure for Romanian freelancers.', ro: 'Forma cea mai comună pentru liber-profesioniști din România.' },
    },
    {
      value: 'ii',
      label: { en: 'Individual Enterprise (II)', ro: 'Întreprindere Individuală' },
      sub: { en: 'Individual enterprise', ro: 'Întreprindere individuală' },
      desc: { en: 'Similar to PFA but can hire employees. Tax treatment is identical.', ro: 'Similar cu PFA, dar poți angaja personal. Impozitare identică.' },
    },
    {
      value: 'just_tracking',
      label: { en: 'Just tracking', ro: 'Doar urmărire' },
      sub: { en: 'I just want to track income and expenses', ro: 'Vreau doar să urmăresc veniturile și cheltuielile' },
      desc: { en: "I don't need tax estimates — just income and expense tracking.", ro: 'Nu am nevoie de estimări fiscale — doar urmărire venituri și cheltuieli.' },
    },
  ],

  calcTax,
  getInsuranceRate,
  getQuarterlyDeadlines,
  getInsuranceDueDay,
  getAnnualDeadline,

  declarationLaw: { en: 'D212 ANAF', ro: 'Declarația 212' },
  annualDeclarationLaw: { en: 'D222 ANAF' },
  penaltyText: {
    en: 'Late filing can result in fines. File your D212 declaration on time through the ANAF portal.',
    ro: 'Depunerea cu întârziere poate duce la amenzi. Depune declarația D212 la timp prin portalul ANAF.',
  },
  clientWithholdingNote: {
    en: 'As a PFA you are responsible for calculating and paying your own taxes quarterly. Your clients do not withhold on your behalf.',
    ro: 'Ca PFA, ești responsabil pentru calculul și plata impozitelor trimestrial. Clienții tăi nu rețin impozitele în numele tău.',
  },

  taxPortalHelp: {
    desc: {
      en: "File D212 (quarterly advance tax) via ANAF's e-Portal using SPV credentials. Payment is by bank transfer to your county ANAF office. CAS and CASS are paid at the same time.",
    },
    items: [
      {
        label: { en: 'File D212 (quarterly advance)' },
        sub: { en: 'Advance income tax — 10% on net income, due quarterly' },
      },
      {
        label: { en: 'CAS + CASS contributions' },
        sub: { en: 'Pension (25%) and health (10%) — paid alongside the D212' },
      },
    ],
  },
}
