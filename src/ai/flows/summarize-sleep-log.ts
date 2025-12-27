'use server';
/**
 * @fileOverview A Genkit flow for summarizing a patient's sleep log over a period.
 *
 * - summarizeSleepLog - A function that takes sleep log data and generates a summary.
 * - SummarizeSleepLogInput - The input type for the summarizeSleepLog function.
 * - SummarizeSleepLogOutput - The output type for the summarizeSleepLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { type SleepLog } from '@/lib/data';

const SleepLogSchema = z.object({
    id: z.string(),
    patientId: z.string(),
    log_date: z.string(),
    hours: z.array(z.enum(['awake', 'asleep'])),
    notes: z.string(),
});

const SummarizeSleepLogInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  sleepLogs: z.array(SleepLogSchema).describe('An array of daily sleep logs for the patient.'),
});
export type SummarizeSleepLogInput = z.infer<typeof SummarizeSleepLogInputSchema>;

const SummarizeSleepLogOutputSchema = z.object({
  summary: z.string().describe('A concise, narrative summary of the patient\'s sleep patterns over the provided period.'),
});
export type SummarizeSleepLogOutput = z.infer<typeof SummarizeSleepLogOutputSchema>;

export async function summarizeSleepLog(input: SummarizeSleepLogInput): Promise<SummarizeSleepLogOutput> {
  return summarizeSleepLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSleepLogPrompt',
  input: {schema: SummarizeSleepLogInputSchema},
  output: {schema: SummarizeSleepLogOutputSchema},
  prompt: `You are an AI assistant for a care facility, specializing in analyzing patient data. Your task is to write a brief, professional summary of a patient's sleep patterns based on a series of daily logs.

  The logs provided are for a patient named {{{patientName}}}. Each log represents a 24-hour period, with an array of 24 entries indicating 'asleep' or 'awake' for each hour.

  Analyze the following logs to identify patterns, inconsistencies, and overall sleep quality. Focus on overnight sleep, which may start in the evening of one log and continue into the morning of the next.

  - Calculate the average total sleep time per night.
  - Identify the typical bedtime and wake-up time.
  - Note any significant periods of wakefulness during the night (sleep fragmentation).
  - Mention any trends, such as improving or declining sleep consistency.
  - Keep the summary concise (2-4 sentences).

  Here are the sleep logs:
  {{{jsonStringify sleepLogs}}}

  Generate a summary based on your analysis.
  Example: "Over the past week, [Patient Name]'s sleep has been inconsistent, with an average of 6.5 hours per night. They typically fall asleep around 11 PM, but frequently experience 1-2 hours of wakefulness in the early morning. Sleep duration has slightly decreased towards the end of the week."
  `,
});

const summarizeSleepLogFlow = ai.defineFlow(
  {
    name: 'summarizeSleepLogFlow',
    inputSchema: SummarizeSleepLogInputSchema,
    outputSchema: SummarizeSleepLogOutputSchema,
  },
  async input => {
    if (input.sleepLogs.length === 0) {
        return { summary: "No sleep data was provided for the selected period." };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
