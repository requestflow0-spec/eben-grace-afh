'use server';
/**
 * @fileOverview A Genkit flow for generating a summary comment for a patient behavior log.
 *
 * - generateBehaviorComment - A function that takes behavior details and generates a comment.
 * - GenerateBehaviorCommentInput - The input type for the generateBehaviorComment function.
 * - GenerateBehaviorCommentOutput - The output type for the generateBehaviorComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBehaviorCommentInputSchema = z.object({
  behavior: z.array(z.string()).describe('The type of behavior observed.'),
  intensity: z.string().describe('The intensity of the behavior (e.g., low, medium, high).'),
  activity: z.string().describe('The activity the patient was engaged in.'),
  setting: z.string().describe('The setting where the behavior occurred.'),
  antecedent: z.string().describe('What happened immediately before the behavior.'),
  response: z.string().describe('The intervention or response from staff.'),
});
export type GenerateBehaviorCommentInput = z.infer<typeof GenerateBehaviorCommentInputSchema>;

const GenerateBehaviorCommentOutputSchema = z.object({
  comment: z.string().describe('A concise, editable summary of the behavior event.'),
});
export type GenerateBehaviorCommentOutput = z.infer<typeof GenerateBehaviorCommentOutputSchema>;

export async function generateBehaviorComment(input: GenerateBehaviorCommentInput): Promise<GenerateBehaviorCommentOutput> {
  return generateBehaviorCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBehaviorCommentPrompt',
  input: {schema: GenerateBehaviorCommentInputSchema},
  output: {schema: GenerateBehaviorCommentOutputSchema},
  prompt: `You are an AI assistant for a care facility. Your task is to write a brief, objective, and professional summary comment based on a behavior log entry.

  The comment should be suitable for a patient's record. Combine the following details into a single, flowing paragraph.

  - Behavior(s) observed: {{{behavior}}}
  - Intensity: {{{intensity}}}
  - Current Activity: {{{activity}}}
  - Setting: {{{setting}}}
  - Antecedent (what happened before): {{{antecedent}}}
  - Staff Response/Intervention: {{{response}}}

  Generate a comment that summarizes these points clearly.
  Example: "During a leisure activity in the living area, the patient exhibited wandering of medium intensity after a peer interaction. Staff responded with verbal redirection."
  `,
});

const generateBehaviorCommentFlow = ai.defineFlow(
  {
    name: 'generateBehaviorCommentFlow',
    inputSchema: GenerateBehaviorCommentInputSchema,
    outputSchema: GenerateBehaviorCommentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
