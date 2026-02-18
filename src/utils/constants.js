export const COLORS = {
  navy: '#0B2545',
  navyLight: '#133366',
  gold: '#C5960C',
  goldLight: '#D4A82A',
  red: '#B8352E',
  green: '#22863A',
  white: '#FFFFFF',
  cream: '#F5F1EC',
  gray: '#666666',
  grayLight: '#E8E4DF',
  grayDark: '#333333',
}

export const TIERS = {
  standard: { name: 'Standard', price: 3.50, type: '5Q', color: COLORS.gray },
  refined: { name: 'Refined', price: 5.00, type: '10Q', color: COLORS.navy },
  precision: { name: 'Precision', price: 7.50, type: 'Custom', color: COLORS.gold },
}

export const TRUST_LEVELS = [
  { name: 'New', min: 0, max: 2, color: COLORS.gray },
  { name: 'Active', min: 3, max: 10, color: COLORS.navy },
  { name: 'Trusted', min: 11, max: 25, color: COLORS.gold },
  { name: 'Champion', min: 26, max: Infinity, color: COLORS.green },
]

export const getTrustLevel = (score) => {
  return TRUST_LEVELS.find(l => score >= l.min && score <= l.max) || TRUST_LEVELS[0]
}

export const URGENCY = {
  normal: { label: 'Normal', color: COLORS.gray },
  priority: { label: 'Priority', color: COLORS.gold },
  urgent: { label: 'Urgent', color: COLORS.red },
}

export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming'
]

export const AGE_RANGES = ['18-24','25-34','35-44','45-54','55-64','65+']
