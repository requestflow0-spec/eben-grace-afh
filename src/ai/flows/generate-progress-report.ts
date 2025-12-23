'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating patient progress reports.
 *
 * The flow takes patient data and generates a progress report, including a summary.
 *
 * @remarks
 * The `generateProgressReport` function is the main entry point for generating reports.
 * It uses the `generateProgressReportFlow` internally.
 *
 * @exports generateProgressReport - The main function to generate a progress report.
 * @exports GenerateProgressReportInput - The input type for the generateProgressReport function.
 * @exports GenerateProgressReportOutput - The output type for the generateProgressReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProgressReportInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  medicalHistory: z.string().describe('The medical history of the patient.'),
  carePlan: z.string().describe('The care plan for the patient.'),
  dailyActivities: z.string().describe('A summary of the patient\'s daily activities.'),
  medicationAdministration: z.string().describe('Details of medication administration.'),
  relevantObservations: z.string().describe('Any relevant observations about the patient.'),
});
export type GenerateProgressReportInput = z.infer<typeof GenerateProgressReportInputSchema>;

const GenerateProgressReportOutputSchema = z.object({
  report: z.string().describe('The generated progress report.'),
  progress: z.string().describe('A one-sentence summary of progress.'),
});
export type GenerateProgressReportOutput = z.infer<typeof GenerateProgressReportOutputSchema>;

export async function generateProgressReport(input: GenerateProgressReportInput): Promise<GenerateProgressReportOutput> {
  return generateProgressReportFlow(input);
}

const progressReportPrompt = ai.definePrompt({
  name: 'progressReportPrompt',
  input: {schema: GenerateProgressReportInputSchema},
  output: {schema: GenerateProgressReportOutputSchema},
  prompt: `You are an AI assistant that specializes in generating progress reports for patients in a care facility.

  Based on the provided information, generate a comprehensive progress report.

  Include a summary of the patient's condition, progress made, and any noteworthy observations.
  Also include a one-sentence summary of their progress in the 'progress' field.

  Patient Name: {{{patientName}}}
  Medical History: {{{medicalHistory}}}
  Care Plan: {{{carePlan}}}
  Daily Activities: {{{dailyActivities}}}
  Medication Administration: {{{medicationAdministration}}}
  Relevant Observations: {{{relevantObservations}}}
  `,
});

const generateProgressReportFlow = ai.defineFlow(
  {
    name: 'generateProgressReportFlow',
    inputSchema: GenerateProgressReportInputSchema,
    outputSchema: GenerateProgressReportOutputSchema,
  },
  async input => {
    const {output} = await progressReportPrompt(input);
    return output!;
  }
);
