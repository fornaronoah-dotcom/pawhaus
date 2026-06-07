import "server-only";

import { GoogleGenAI } from "@google/genai";

/**
 * Officiële Google Generative AI SDK (@google/genai). Gebruikt GEMINI_API_KEY.
 * De client is enkel server-side; de sleutel komt nooit in de browser.
 */

const apiKey = process.env.GEMINI_API_KEY;

export const isAiConfigured = Boolean(apiKey);

export const GEMINI_MODEL = "gemini-2.5-flash";

export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;
