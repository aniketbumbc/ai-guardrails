import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import dotenv from 'dotenv';
import axios from 'axios';
import nodemailer from 'nodemailer';

dotenv.config();

const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const getWeatherResultSchema = z.object({
  city: z.string().describe('The city name'),
  weather: z.string().describe('The weather in the city'),
  temperature: z.number().describe('The temperature in Celsius'),
  humidity: z.number().describe('The humidity in percentage'),
  wind: z.number().describe('The wind speed in km/h'),
  visibility: z.number().describe('The visibility in km'),
  advice: z.string().describe('The advice for the user based on the weather'),
});

const getWeather = tool({
  name: 'get_weather',
  description: 'Get the weather of a given city',
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t+%w+%m`;
    const response = await axios.get(url, { responseType: 'text' });
    return `The weather of ${city} is ${response.data}`;
  },
});

const sendEmail = tool({
  name: 'send_email',
  description: 'Send an email to a given email address',
  parameters: z.object({
    email: z.string().describe('The email address to send the email to'),
    subject: z.string().describe('The subject of the email'),
    body: z.string().describe('The body of the email'),
  }),
  execute: async ({ email, subject, body }) => {
    // send mail to mailtrap.io
    await transport.sendMail({
      from: 'weather@agent.com',
      to: email,
      subject,
      text: body,
    });
    return 'Email sent successfully';
  },
});

const agent = new Agent({
  name: 'Weather and Email Agent',
  instructions:
    'You are a weather agent that can tell the weather of a given city. and send mail to the user based on the weather. and mail the user what to wear based on the weather a given email address.',
  tools: [getWeather, sendEmail],
  outputType: getWeatherResultSchema,
});

const main = async () => {
  const result = await run(
    agent,
    'what is the weather of New York Baltimore and Mumbai? and send to an email to john@doe.com',
  );
  console.log(result.finalOutput);
};

main();
