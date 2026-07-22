import 'dotenv/config';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';

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
      join(process.cwd(), 'refund-handoff.txt'),
      `Product Description: ${product_description}\nReason: ${reason}\nAmount: ${amount}\nCustomer ID: ${cutomer_id}\n`,
      'utf-8',
    );
    return `Refunded the product ${product_description} to the customer for the reason ${reason} and the amount ${amount}`;
  },
});

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

const refundAgent = new Agent({
  name: 'Refund Agent',
  instructions:
    'You are a internet provider refund agent. You are responsible for refunding the amount to the customer. Talk to customer UNDERSTAND THE REASON  and refund the amount.DO NOT DO OTHER WORK OTHER THAN REFUNDING THE AMOUNT.IF THE CUSTOMER ASKS ABOUT OTHER WORK, SAY THAT YOU ARE NOT AUTHORIZED TO DO THAT WORK.',
  handoffDescription: 'Handles refund enquiries and transactions.',
  tools: [refundProduct],
});

const salesAgent = new Agent({
  name: 'Sales Agent',
  instructions:
    'You are a internet provider sales agent. You are responsible for selling the product to the customer. Talk to customer and explain them prodcuts and plans.',
  handoffDescription: 'Handles product details, plans, and sales enquiries.',
  tools: [
    getProductDetails,
    refundAgent.asTool({
      toolName: 'refundProduct',
      toolDescription: 'Refund the product amount to the customer',
    }),
  ],
});

const enquryAgent = new Agent({
  name: 'Enqury Agent',
  instructions: `${RECOMMENDED_PROMPT_PREFIX} You are a enqury agent. The customer is asking you about product details and plans. You need to forward the customer request to the sales agent. If the customer is asking about refund, you need to forward the customer request to the refund agent. If You dont know the answer, you need to say that you are not authorized to handle that request.`,
  handoffs: [salesAgent, refundAgent],
});

const runAgent = async (query = '') => {
  const result = await run(enquryAgent, query);
  console.log('result', result.finalOutput);
  console.log('History', result.history);
};

runAgent('what is the best internet plan for me ?');
