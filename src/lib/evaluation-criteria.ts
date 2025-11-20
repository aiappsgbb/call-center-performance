import { EvaluationCriterion } from '@/types/call';

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 1,
    type: 'Must Do',
    name: 'Introduce self and company name',
    definition: 'Caller must clearly introduce name and company, product name (CashNow / SNPL / EasyCash) should match record.',
    evaluationCriteria: 'Caller must clearly introduce name and company, product name (CashNow / SNPL / EasyCash) should match record.',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      "I'm calling from CashNow.",
      "I'm calling from Botim.",
      "Good afternoon, this is John from CashNow.",
    ],
  },
  {
    id: 2,
    type: 'Must Do',
    name: 'Polite and timely greeting',
    definition: 'Greeting must appear at call start (e.g., "Good morning / afternoon").',
    evaluationCriteria: 'Greeting must appear at call start (e.g., "Good morning / afternoon").',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      "Good afternoon, this is John from CashNow.",
    ],
  },
  {
    id: 3,
    type: 'Must Do',
    name: 'Mention "This call is recorded"',
    definition: 'Caller must inform the customer before any data-related discussion.',
    evaluationCriteria: 'Caller must inform the customer before any data-related discussion.',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      "This call is recorded for quality and training purposes.",
      "This call is recorded.",
    ],
  },
  {
    id: 4,
    type: 'Must Do',
    name: "Verify borrower's name / identity",
    definition: "Confirm borrower name as per record before discussing details.",
    evaluationCriteria: "Confirm borrower name as per record before discussing details.",
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      "May I speak to Mr. Ahmad?",
    ],
  },
  {
    id: 5,
    type: 'Must Do',
    name: 'Disclose correct lending details (OPD days and/or amount)',
    definition: 'Verify borrower → release accurate overdue days & amount as per system.',
    evaluationCriteria: 'Verify borrower → release accurate overdue days & amount as per system.',
    scoringStandard: {
      passed: 10,
      partial: 5,
      failed: 0,
    },
    examples: [
      "Your due amount is AED 500, 5 days overdue.",
    ],
  },
  {
    id: 6,
    type: 'Must Do',
    name: 'Mark correct collection status',
    definition: 'The conversation outcome should match the follow-up stage (e.g., promise to pay, refuse to pay).',
    evaluationCriteria: 'The conversation outcome should match the follow-up stage (e.g., promise to pay, refuse to pay).',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      'Tag as "Promise to Pay" if borrower commits.',
    ],
  },
  {
    id: 7,
    type: 'Must Do',
    name: 'Script aligned with stage',
    definition: "Ensure speech content match borrower's DPD stage (soft / mid / hard).",
    evaluationCriteria: "Ensure speech content match borrower's DPD stage (soft / mid / hard).",
    scoringStandard: {
      passed: 10,
      partial: 5,
      failed: 0,
    },
    examples: [
      'Consequences.xlsx',
    ],
  },
  {
    id: 8,
    type: 'Must Not Do',
    name: 'Avoid rude, sarcastic, or aggressive tone',
    definition: 'No sarcasm, slang, or interruptions; remain professional.',
    evaluationCriteria: 'No sarcasm, slang, or interruptions; remain professional.',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      '"Why didn\'t you pay yet?"',
      '"Could you please check your payment?"',
    ],
  },
  {
    id: 9,
    type: 'Must Do',
    name: 'End call with summary or confirmation',
    definition: 'Caller should summarize agreement or next step before hanging up.',
    evaluationCriteria: 'Caller should summarize agreement or next step before hanging up.',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      '"So you\'ll make the payment by Friday, correct?"',
    ],
  },
  {
    id: 10,
    type: 'Must Do',
    name: 'Negotiation',
    definition: 'If the customer says they will not pay or will pay later without giving a clear payment date, the caller must understand the reason for non-payment and attempt to negotiate and convince the customer to make a payment.',
    evaluationCriteria: 'If the customer says they will not pay or will pay later without giving a clear payment date, the caller must understand the reason for non-payment and attempt to negotiate and convince the customer to make a payment.',
    scoringStandard: {
      passed: 10,
      failed: 0,
    },
    examples: [
      'Can you please share what\'s stopping you from paying now?',
      'You can make even a partial payment today to avoid extra charges',
    ],
  },
];

export const getMaxScore = () => {
  return EVALUATION_CRITERIA.reduce((sum, criterion) => sum + criterion.scoringStandard.passed, 0);
};

export const getCriterionById = (id: number) => {
  return EVALUATION_CRITERIA.find(c => c.id === id);
};
