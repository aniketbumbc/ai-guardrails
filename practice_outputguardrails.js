import 'dotenv/config';
import { Agent, run, OutputGuardrailTripwireTriggered } from '@openai/agents';
import { z } from 'zod';

const sqlGuard = {
  name: 'SQL Guardrail',
  execute: async ({ agentOutput }) => {
    const result = await run(sqlGuardrailAgent, agentOutput.sqlQuery);
    return {
      tripwireTriggered: !result.finalOutput.isAllowed,
      outputInformation: result.finalOutput.reason,
    };
  },
};

const sqlGuardrailAgent = new Agent({
  name: 'SQL Guardrail',
  instructions: `You are a SQL guardrail. You are responsible for checking if the SQL query is valid. 
    Instructions:
    - The SQL query should be valid.
    - Only Read operations are allowed.
    - Delete and Drop and Modify operations are not allowed.
    `,
  outputType: z.object({
    isAllowed: z
      .boolean()
      .describe('Whether the SQL query is allowed to execute'),
    reason: z.string().describe('Reason for the validity of the SQL query'),
  }),
});

const sqlExperAgent = new Agent({
  name: 'SQL Expert',
  instructions: `You are a SQL expert. You are responsible for writing SQL queries to as per the user\'s request.PostGres Schema:
    -- users table
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    -- orders table
    CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10, 2) NOT NULL,
        order_status VARCHAR(50) NOT NULL
    );
    `,

  outputType: z.object({
    sqlQuery: z
      .string()
      .describe("The SQL query to answer the user's question"),
  }),
  outputGuardrails: [sqlGuard],
});

const main = async (query = '') => {
  try {
    const result = await run(sqlExperAgent, query);
    console.log('Final Output **********', result.finalOutput.sqlQuery);
  } catch (error) {
    if (error instanceof OutputGuardrailTripwireTriggered) {
      const reason = error.result?.output?.outputInformation;
      console.error('Blocked — destructive SQL rejected. Reason:', reason);
      return;
    }
  }
};

main('select all the orders from the orders table');
main('delete all the orders from the orders table');
main('drop the orders table');
main('select user where username is "John Doe"');
