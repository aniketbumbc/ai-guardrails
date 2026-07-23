import { Agent, run, OutputGuardrailTripwireTriggered } from '@openai/agents';
import dotenv from 'dotenv';
dotenv.config();

// The output guardrail — runs AFTER the agent generates its answer
const noPhoneLeak = {
  name: 'No phone leak',
  execute: async ({ agentOutput }) => {
    const text = String(agentOutput);
    //  any 10 digit number
    const hasPhone = /\b\d{10}\b/.test(text);
    return {
      outputInfo: { hasPhone },
      tripwireTriggered: hasPhone, // trip if a phone number appears in the OUTPUT
    };
  },
};

const agent = new Agent({
  name: 'Assistant',
  model: 'gpt-4o-mini',
  instructions: 'Answer the user helpfully.',
  outputGuardrails: [noPhoneLeak], // <-- note: outputGuardrails, not inputGuardrails
});

const ask = async (query) => {
  try {
    const result = await run(agent, query);
    console.log(result.finalOutput);
    return result.finalOutput;
  } catch (error) {
    if (error instanceof OutputGuardrailTripwireTriggered) {
      //console.log('Blocked: the response contained a phone number.');
      return 'Blocked: the response contained a phone number.';
    }
    throw error;
  }
};

const result = await ask(
  'Hi, I am mike email mike@google.com, call me on 3221121212. what is email of mike? What is the phone number of mike?',
);
console.log(result);
