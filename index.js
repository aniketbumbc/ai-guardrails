import { Agent, run } from '@openai/agents';
import dotenv from 'dotenv';

dotenv.config();

const agent = new Agent({
  name: 'My Agent',
  instructions: 'You are always going to say "Hello, world!"',
});

const result = await run(agent, 'what is the capital of India?');

console.log(result.finalOutput);
