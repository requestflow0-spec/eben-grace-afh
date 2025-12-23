'use server';

/**
 * @fileOverview AI flow to suggest improvements to generated reports.
 *
 * - suggestReportImprovements - A function that takes a report as input and suggests improvements.
 * - SuggestReportImprovementsInput - The input type for the suggestReportImprovements function.
 * - SuggestReportImprovementsOutput - The return type for the suggestReportImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReportImprovementsInputSchema = z.object({
  report: z.string().describe('The report content to be improved.'),
});

export type SuggestReportImprovementsInput = z.infer<typeof SuggestReportImprovementsInputSchema>;

const SuggestReportImprovementsOutputSchema = z.object({
  suggestions: z.string().describe('AI-suggested improvements for the report.'),
});

export type SuggestReportImprovementsOutput = z.infer<typeof SuggestReportImprovementsOutputSchema>;

export async function suggestReportImprovements(
  input: SuggestReportImprovementsInput
): Promise<SuggestReportImprovementsOutput> {
  return suggestReportImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReportImprovementsPrompt',
  input: {schema: SuggestReportImprovementsInputSchema},
  output: {schema: SuggestReportImprovementsOutputSchema},
  prompt: `You are an AI assistant that reviews reports and suggests improvements.

  Report to improve: {{{report}}}

  Please provide specific and actionable suggestions to improve the report's clarity, accuracy, and overall quality.
  Focus on suggesting content additions, structural changes, or wording refinements that would make the report more effective for its intended audience.
  `,
});

const suggestReportImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestReportImprovementsFlow',
    inputSchema: SuggestReportImprovementsInputSchema,
    outputSchema: SuggestReportImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
