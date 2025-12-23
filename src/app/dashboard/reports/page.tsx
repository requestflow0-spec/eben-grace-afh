'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  generateProgressReport,
  GenerateProgressReportInput,
  GenerateProgressReportOutput,
} from '@/ai/flows/generate-progress-report';
import {
  suggestReportImprovements,
  SuggestReportImprovementsOutput,
} from '@/ai/flows/suggest-report-improvements';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { patients } from '@/lib/data';
import { Loader2, Wand2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient.'),
  dailyActivities: z.string().min(1, 'Daily activities are required.'),
  medicationAdministration: z.string().min(1, 'Medication details are required.'),
  relevantObservations: z.string().min(1, 'Observations are required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReportsPage() {
  const [reportResult, setReportResult] = useState<GenerateProgressReportOutput | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestReportImprovementsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      dailyActivities: '',
      medicationAdministration: '',
      relevantObservations: '',
    },
  });

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      form.setValue('patientId', patientId);
    }
  };

  const handleGenerateReport: SubmitHandler<FormValues> = async (data) => {
    setIsGenerating(true);
    setReportResult(null);
    setSuggestions(null);
    const patient = patients.find(p => p.id === data.patientId);

    if (!patient) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected patient not found.',
      });
      setIsGenerating(false);
      return;
    }

    const input: GenerateProgressReportInput = {
      patientName: patient.name,
      medicalHistory: patient.medicalHistory,
      carePlan: patient.carePlan,
      dailyActivities: data.dailyActivities,
      medicationAdministration: data.medicationAdministration,
      relevantObservations: data.relevantObservations,
    };

    try {
      const result = await generateProgressReport(input);
      setReportResult(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: 'An error occurred while generating the report.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestImprovements = async () => {
    if (!reportResult) return;

    setIsSuggesting(true);
    setSuggestions(null);

    try {
      const result = await suggestReportImprovements({ report: reportResult.report });
      setSuggestions(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'An error occurred while fetching suggestions.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Progress Report</CardTitle>
            <CardDescription>
              Fill in the details below to generate an AI-powered progress report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateReport)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select onValueChange={handlePatientChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyActivities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Activities</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Morning walk, read a book, socialized..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicationAdministration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Administration</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Insulin 10 units at 8am, Aspirin 81mg at 9am." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relevantObservations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relevant Observations</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Patient reported feeling energetic." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate Report
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {reportResult && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Generated Report</CardTitle>
                  <CardDescription>{reportResult.progress}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => form.requestSubmit()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{reportResult.report}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSuggestImprovements} disabled={isSuggesting}>
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Suggest Improvements
              </Button>
            </CardFooter>
          </Card>
        )}
        {suggestions && (
          <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertTitle>AI Suggestions</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {suggestions.suggestions}
            </AlertDescription>
          </Alert>
        )}
        {!reportResult && !isGenerating && (
          <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No report generated yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Fill out the form to generate a new report.</p>
          </div>
        )}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Generating Report...</h3>
            <p className="mt-1 text-sm text-muted-foreground">The AI is crafting the progress report. Please wait.</p>
          </div>
        )}
      </div>
    </div>
  );
}
