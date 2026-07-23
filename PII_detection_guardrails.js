import 'dotenv/config';
import { Agent, run } from '@openai/agents';
import { z } from 'zod';

const PII_TYPES = [
  'NAME',
  'EMAIL',
  'PHONE',
  'ADDRESS',
  'AADHAAR',
  'PAN',
  'CREDIT_CARD',
  'OTHER',
];

const detectionSchema = z.object({
  entities: z
    .array(
      z.object({
        type: z.enum(PII_TYPES).describe('The category of PII'),
        text: z
          .string()
          .describe('The EXACT substring from the input, copied verbatim'),
      }),
    )
    .describe('All PII spans found. Empty array if none.'),
});

const detectorAgent = new Agent({
  name: 'PII Detector',
  model: 'gpt-4o-mini', // small + cheap: classification is easy, you call it a lot
  instructions: `You detect personally identifiable information (PII) in user text.
   
  For every piece of PII, return its TYPE and the EXACT substring as it appears
  in the input (copied character-for-character — do NOT paraphrase or reformat).
   
  TYPES:
  - NAME: person names
  - EMAIL: email addresses
  - PHONE: phone numbers
  - ADDRESS: postal / street addresses
  - AADHAAR: 12-digit Indian Aadhaar numbers
  - PAN: Indian PAN (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F)
  - CREDIT_CARD: 13-16 digit card numbers
  - OTHER: any other clearly personal identifier
   
  If there is no PII, return an empty entities array. Return only structured output.`,
  outputType: detectionSchema,
});

const detectPIIFromQuery = async (text) => {
  const result = await run(detectorAgent, text);
  return result.finalOutput.entities; // [{ type, text }]
};

const piiGuardrail = {
  name: 'PII Detector Guardrail',
  execute: async ({ input }) => {
    const entities = await detectPIIFromQuery(input);
    return {
      outputInfo: { entities },
      tripwireTriggered: entities.length > 0,
    };
  },
};

const maskEntities = (text, entities) => {
  const map = {}; // token -> original value
  const counts = {};
  let masked = text;

  const sorted = [...entities].sort((a, b) => b.text.length - a.text.length);

  for (const { type, text: value } of sorted) {
    if (!value || !masked.includes(value)) continue; // guard: must exist

    // Reuse the same token if this exact value was already masked
    let token = Object.keys(map).find((k) => map[k] === value);
    if (!token) {
      counts[type] = (counts[type] ?? 0) + 1;
      token = `*****`;
      map[token] = value;
    }
    masked = masked.split(value).join(token); // replaceAll
  }
  return { masked, map };
};

// The agent that actually answers the question — it only ever sees masked text
const assistantAgent = new Agent({
  name: 'Assistant',
  model: 'gpt-4o-mini',
  instructions:
    'Answer the user query. The text may contain placeholders like ' +
    '***** — treat them as opaque labels and keep them ' +
    'as-is in your answer. Never invent real values for them.' +
    'IMPORTANT MASK MUST BE IN ***** FORM ONLY',

  guardrails: [piiGuardrail],
});
('');

const processQuery = async (prompt) => {
  const entities = await detectPIIFromQuery(prompt);
  const { masked } = maskEntities(prompt, entities);
  const result = await run(assistantAgent, masked);
  return result.finalOutput;
};

const result = await processQuery(
  'Hi, I am mike email mike@google.com, call me on 2323232323. what is email of mike?',
);
console.log(result);
