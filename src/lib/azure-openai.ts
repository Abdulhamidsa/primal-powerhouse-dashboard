import { AzureOpenAI } from 'openai';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

export const AZURE_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;
export const AZURE_IMAGE_DEPLOYMENT = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT;

if (!endpoint) {
  throw new Error('Missing AZURE_OPENAI_ENDPOINT');
}

if (!apiKey) {
  throw new Error('Missing AZURE_OPENAI_API_KEY');
}

if (!AZURE_CHAT_DEPLOYMENT) {
  throw new Error('Missing AZURE_OPENAI_CHAT_DEPLOYMENT');
}

export const azureOpenAI = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
});
