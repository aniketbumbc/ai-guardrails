import 'dotenv/config';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import fs from 'node:fs/promises';
import { join } from 'node:path';

/**
 *  Manager agent as to manage the agents and the tools
 */

const getProductDetails = tool({
  name: 'getProductDetails',
  description: 'Get the details of a product for internet marketing',
  parameters: z.object({}),
  execute: async () => {
    return [
      {
        product_id: 1,
        product_name: 'Best-100',
        Description:
          'Best-100 is a product that is used for internet marketing which 100 mbps speed and 1000 GB data per month',
      },
      {
        product_id: 2,
        product_name: 'Best-100',
        Description:
          'Best-200 is a product that is used for internet download which 200 mbps speed and 2000 GB data per month',
      },
      {
        product_id: 3,
        product_name: 'Best-300',
        Description:
          'Best-300 is a product that is used for internet upload and online streaming and gaming which 300 mbps speed and 3000 GB data per month',
      },
    ];
  },
});

const refundProduct = tool({
  name: 'refundProduct',
  description: 'Refund the product amount to the customer',
  parameters: z.object({
    product_description: z.string().describe('The description of the product'),
    reason: z.string().describe('The reason for refund'),
    amount: z.number().describe('The amount to be refunded'),
    cutomer_id: z.string().describe('The id of the customer'),
  }),
  execute: async ({ product_description, reason, amount, cutomer_id }) => {
    fs.appendFile(
      join(process.cwd(), 'refund.txt'),
      `Product Description: ${product_description}\nReason: ${reason}\nAmount: ${amount}\nCustomer ID: ${cutomer_id}\n`,
      'utf-8',
    );
    return `Refunded the product ${product_description} to the customer for the reason ${reason} and the amount ${amount}`;
  },
});

const refundAgent = new Agent({
  name: 'Refund Agent',
  instructions:
    'You are a internet provider refund agent. You are responsible for refunding the amount to the customer. Talk to customer UNDERSTAND THE REASON  and refund the amount.DO NOT DO OTHER WORK OTHER THAN REFUNDING THE AMOUNT.IF THE CUSTOMER ASKS ABOUT OTHER WORK, SAY THAT YOU ARE NOT AUTHORIZED TO DO THAT WORK.',
  tools: [refundProduct],
});

const salesAgent = new Agent({
  name: 'Sales Agent',
  instructions:
    'You are a internet provider sales agent. You are responsible for selling the product to the customer. Talk to customer and explain them prodcuts and plans.',
  tools: [
    getProductDetails,
    refundAgent.asTool({
      toolName: 'refundProduct',
      toolDescription: 'Refund the product amount to the customer',
    }),
  ],
});

const runAgent = async (query = '') => {
  const result = await run(salesAgent, query);
  console.log(result.finalOutput);
};

runAgent(
  'Inetrnet is not working for a week now. Can you give me refund for the amount $105 for the product Best-100 ? My Customer Id is A-101',
);
