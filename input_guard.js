import 'dotenv/config';
import { Agent, run, InputGuardrailTripwireTriggered } from '@openai/agents';
import { z } from 'zod';

/**
 *  Step3: Create a math input agent to check if the query is a math query or not
 */

const mathInputAgent = new Agent({
  name: 'Math Query Checker',
  instructions:
    'You are an input Guardrails agent to check a math query NO THEORY ANWERS. You are responsible for checking if the query is a math query or not. Also Validate it is not programming query or not. DO NOT ALLOW PROGRAMMING QUERY OR CODE WRITE IN ANY LANGUAGE .',
  outputType: z.object({
    isValidQuery: z
      .boolean()
      .describe('Whether the query is a math query or not'),
    reason: z.string().describe('Reason for the validation'),
  }),
});

/**
 *  Step 2: Create a math input guardrails
 */
const mathInputGuardrails = {
  name: 'Math home work checker',
  execute: async ({ input }) => {
    const result = await run(mathInputAgent, input);
    return {
      isValidQuery: result.finalOutput.isValidQuery,
      reason: result.finalOutput.reason,
      tripwireTriggered: !result.finalOutput.isValidQuery,
    };
  },
};

/**
 *  Step 1: Create a math agent
 */
const mathAgent = new Agent({
  name: 'Math Agent',
  instructions:
    'You are a math ai Agent. You are responsible for solving math problems.',
  inputGuardrails: [mathInputGuardrails],
});

const runAgent = async (query = '') => {
  try {
    const result = await run(mathAgent, query);
    return result.finalOutput;
  } catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
      const info = error.result?.output?.reason;
      console.log(`Blocked by guardrail: ${info ?? 'Input not allowed'}`);
      return { blocked: true, reason: info ?? 'Input not allowed' };
    }
    throw error;
  }
};

// runAgent('what square of 5');
// runAgent('what is value of  78*19+100');
// runAgent('write code add two numbers in javascript');

const result = await runAgent('explain how to solve 8*3');
console.log('Final Result **********', result);
