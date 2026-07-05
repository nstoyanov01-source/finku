const INSURANCE_BY_YEAR = { 2024: 140, 2025: 147, 2026: 153.08 }

function calcTax(totalIncome, totalExpenses, legalForm, options = {}) {
  const { authorRate = false, monthsElapsed = new Date().getMonth() + 1, year = new Date().getFullYear() } = options
  if (legalForm === 'just_tracking') return null

  const insurancePerMonth = INSURANCE_BY_YEAR[year] || 153.08
  const totalInsurance = insurancePerMonth * monthsElapsed

  if (legalForm === 'ET') {
    const profit = Math.max(0, totalIncome - totalExpenses)
    const insuranceDeduction = Math.min(profit, totalInsurance)
    const taxableBase = Math.max(0, profit - insuranceDeduction)
    const incomeTax = taxableBase * 0.15
    return {
      taxableBase, incomeTax, insurance: totalInsurance,
      total: incomeTax + totalInsurance, monthsElapsed, rate: 15,
      nprRate: 0, profit, insuranceDeduction,
    }
  }

  const nprRate = authorRate ? 0.40 : 0.25
  const npr = totalIncome * nprRate
  const afterNPR = totalIncome - npr
  const insuranceDeduction = Math.min(afterNPR, totalInsurance)
  const taxableBase = Math.max(0, afterNPR - insuranceDeduction)
  const incomeTax = taxableBase * 0.10
  return {
    taxableBase, incomeTax, insurance: totalInsurance,
    total: incomeTax + totalInsurance, monthsElapsed, rate: 10,
    nprRate: nprRate * 100, npr, afterNPR, insuranceDeduction,
  }
}

function getInsuranceRate(year) {
  return INSURANCE_BY_YEAR[year] || 153.08
}

// Returns quarterly deadlines for the year as Date objects
function getQuarterlyDeadlines(year) {
  return [
    { quarter: 'Q1', date: new Date(year, 3, 30) },
    { quarter: 'Q2', date: new Date(year, 6, 31) },
    { quarter: 'Q3', date: new Date(year, 9, 31) },
  ]
}

function getInsuranceDueDay() { return 25 }

function getAnnualDeadline(year) {
  return new Date(year, 3, 30)  // April 30
}

export default {
  id: 'bg',
  name: 'Bulgaria',
  nameLocal: 'България',
  flag: '🇧🇬',
  currency: '€',
  currencyCode: 'EUR',
  language: 'bg',
  supportsFullTax: true,

  taxAuthority: {
    name: 'НАП',
    fullName: 'Национална агенция за приходите',
    url: 'https://nra.bg',
    portalUrl: 'https://inetdec.nra.bg',
  },

  legalForms: [
    {
      value: 'svobodna_profesiya',
      label: { en: 'Freelancer', bg: 'Свободна професия' },
      sub: { en: 'Designer, developer, consultant', bg: 'Дизайнер, разработчик, консултант' },
      desc: { en: 'You invoice clients directly. No registered company.', bg: 'Издаваш фактури директно на клиенти. Нямаш регистрирана фирма.' },
    },
    {
      value: 'ET',
      label: { en: 'Sole trader (ЕТ)', bg: 'ЕТ' },
      sub: { en: 'Registered sole trader', bg: 'Регистриран едноличен търговец' },
      desc: { en: 'You have a registered business with an ЕИК number.', bg: 'Имаш регистриран ЕТ с ЕИК номер от Търговския регистър.' },
    },
    {
      value: 'just_tracking',
      label: { en: 'Just tracking', bg: 'Само проследяване' },
      sub: { en: "I just want to track income and expenses", bg: 'Искам само да проследявам приходи и разходи' },
      desc: { en: "I don't need tax estimates — just income and expense tracking.", bg: 'Не ми трябва данъчна прогноза — само проследяване на приходи и разходи.' },
    },
  ],

  calcTax,
  getInsuranceRate,
  getQuarterlyDeadlines,
  getInsuranceDueDay,
  getAnnualDeadline,

  declarationLaw: { en: 'Art. 55 ЗДДФЛ', bg: 'чл. 55 ЗДДФЛ' },
  annualDeclarationLaw: { en: 'Art. 50 ЗДДФЛ', bg: 'чл. 50 ЗДДФЛ' },
  penaltyText: {
    en: 'Late filing carries a fine up to 500 лв / ~€255 (Art. 80 ЗДДФЛ). File on time.',
    bg: 'Закъснялата декларация носи глоба до 500 лв. (чл. 80 ЗДДФЛ). Подавай навреме.',
  },
  clientWithholdingNote: {
    en: 'If your clients are Bulgarian companies, they withhold and remit the tax for you — you only file the annual return. If you work with foreign clients or individuals, you must file a чл. 55 declaration yourself and pay the advance tax.',
    bg: 'Ако работиш с български фирми, те удържат и внасят данъка вместо теб — ти само подаваш годишна декларация. Ако работиш с чужди клиенти или физически лица, трябва сам да подадеш декларация по чл. 55 ЗДДФЛ и да внесеш авансовия данък.',
  },

  taxPortalHelp: {
    desc: {
      en: 'The чл. 55 declaration is filed online via the НАП portal using ПИК or КЕП. Payment is by bank transfer — IBAN and payment type are shown in your НАП profile after login.',
      bg: 'Декларацията по чл. 55 ЗДДФЛ се подава онлайн в портала на НАП с ПИК или КЕП. Плащането се прави по банков път — IBAN и вид плащане са налични в портала след влизане.',
    },
    items: [
      {
        label: { en: 'File declaration (чл. 55)', bg: 'Подаване на декларация (чл. 55)' },
        sub: { en: 'Advance income tax from self-employment', bg: 'Авансов данък върху дохода от дейността' },
      },
      {
        label: { en: 'Insurance contributions (ДОО + ЗО)', bg: 'Осигурителни вноски (ДОО + ЗО)' },
        sub: { en: 'Pension and health — paid separately from income tax', bg: 'Пенсионно и здравно — плащат се отделно от данъка' },
      },
    ],
  },
}
