import 'dotenv/config';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

let sharedHistory = [];

const executeSqlQuery = tool({
  name: 'executeSqlQuery',
  description: 'Execute a SQL query',
  parameters: z.object({
    sqlQuery: z.string().describe('The SQL query to execute'),
  }),
  execute: async ({ sqlQuery }) => {
    console.log('Executing SQL Query **********', sqlQuery);
    return 'Done';
  },
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
});

const main = async (query = '') => {
  sharedHistory.push({ role: 'user', content: query }); // Store message in DB.
  const result = await run(sqlExperAgent, sharedHistory);
  sharedHistory = result.history;
  console.log('Result **********', result.finalOutput);
};

main('Hello My name is John Doe I live in New York City');

main('write a query where city is my city');
