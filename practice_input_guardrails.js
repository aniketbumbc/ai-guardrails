import {
  Agent,
  run,
  tool,
  InputGuardrailTripwireTriggered,
} from '@openai/agents';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const getAllCoursesDetails = tool({
  name: 'getAllCoursesDetails',
  description: 'Get the details of the all courses',
  parameters: z.object({}),
  execute: async () => [
    {
      name: 'BCA',
      description: 'BCA is a 3 year course',
      fees: 1000,
    },
    {
      name: 'BBA',
      description: 'BBA is a 3 year course',
      fees: 2000,
    },
    {
      name: 'B.Tech',
      description: 'B.Tech is a 4 year course',
      fees: 3000,
    },
    {
      name: 'MBA',
      description: 'MBA is a 2 year course',
      fees: 4000,
    },
    {
      name: 'MCA',
      description: 'MCA is a 2 year course',
      fees: 5000,
    },
    {
      name: 'M.Tech',
      description: 'M.Tech is a 2 year course',
      fees: 6000,
    },
    {
      name: 'M.Com',
      description: 'M.Com is a 2 year course',
      fees: 7000,
    },
    {
      name: 'M.Sc',
      description: 'M.Sc is a 2 year course',
      fees: 8000,
    },
    {
      name: 'M.A',
      description: 'M.A is a 2 year course',
      fees: 9000,
    },
    {
      name: 'LLB',
      description: 'LLB is a 3 year course',
      fees: 10000,
    },
  ],
});

const inputGuardrailsAgent = new Agent({
  name: 'Input Guardrails Agent',
  instructions: `You validate whether a user query can be answered using ONLY the getAllCoursesDetails tool.

RULES:
1. First call getAllCoursesDetails to get the exact list of available courses name and description and fees.
2. A query is VALID only if BOTH are true:
   a. It is about course description or fees and name (NOT syllabus, location, faculty, admission dates, placements, or anything else).
   b. It concerns a course that EXISTS in the tool's returned list.
   c. Based on course description understand the query and return the correct answer.
3. If the query mentions a course NOT in the list (e.g. MBBS, when the list has no MBBS), it is INVALID — even if it's a real course elsewhere.
4. If the query asks for anything other than course details or fees, it is INVALID.

Set isValidQuery accordingly and give a short reason.`,
  tools: [getAllCoursesDetails],
  outputType: z.object({
    isValidQuery: z.boolean(),
    reason: z.string(),
  }),
});

const universityInputGuardrails = {
  name: 'University Input Guardrails',
  execute: async ({ input }) => {
    const result = await run(inputGuardrailsAgent, input);
    return {
      isValidQuery: result.finalOutput.isValidQuery,
      reason: result.finalOutput.reason,
      tripwireTriggered: !result.finalOutput.isValidQuery,
    };
  },
};

const univserityAdminAgent = new Agent({
  name: 'University Admin Agent',
  instructions:
    'You are a university admin agent. You are responsible for managing the university operations like fees and course details.',
  tools: [getAllCoursesDetails],
  inputGuardrails: [universityInputGuardrails],
});

const runAgent = async (query = '') => {
  try {
    const result = await run(univserityAdminAgent, query);
    console.log(result.finalOutput);
  } catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
      const info = error.result?.output?.reason;
      console.log(
        'Off-topic — I can only help with courses, fees, and admissions.' +
          (info ? ` Reason: ${info}` : ''),
      );
    } else {
      throw error;
    }
  }
};
//runAgent('What is the fees of BCA?');
//runAgent('Where is the university located?');
//runAgent('What is the fees of MBA?');

//runAgent('Can you tell me about the university courses and fees?');
//runAgent('can you help me with a typical Hotel Management syllabus overview.');

runAgent('List of course more than 10 years duration');
