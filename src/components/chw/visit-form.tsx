'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, User, Calendar, Users, Home, ClipboardList, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { RiskBadge } from '@/components/shared/risk-badge';
import { useLanguage } from '@/providers/language-provider';
import { SCREENING_SIGNALS, RESPONSE_OPTIONS, SIGNAL_KEYS } from '@/lib/signals';
import { cn } from '@/lib/utils';
import type { Household, VisitResponses, SignalValue, ScoreResponse } from '@/lib/types';

interface VisitFormProps {
  households: Household[];
}

type DraftResponses = Partial<Record<keyof VisitResponses, SignalValue>>;

export function VisitForm({ households }: VisitFormProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  
  // Patient Information
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [responses, setResponses] = useState<DraftResponses>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [showFallbackToast, setShowFallbackToast] = useState(false);

  const answeredCount = SIGNAL_KEYS.filter(
    (key) => responses[key as keyof VisitResponses] !== undefined
  ).length;
  const allSignalsAnswered = SIGNAL_KEYS.every(
    (key) => responses[key as keyof VisitResponses] !== undefined
  );
  const progressValue = (answeredCount / SIGNAL_KEYS.length) * 100;

  const handleResponseChange = useCallback((key: keyof VisitResponses, value: SignalValue) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!selectedHousehold) {
      setError(t('visit.selectHousehold') || 'Please select a household');
      return;
    }
    if (!allSignalsAnswered) {
      setError(t('visit.completeAllSignals') || 'Please answer all screening questions');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowFallbackToast(false);

    try {
      const completedResponses = SIGNAL_KEYS.reduce((acc, key) => {
        acc[key as keyof VisitResponses] = responses[key as keyof VisitResponses] as SignalValue;
        return acc;
      }, {} as VisitResponses);

      // Prepend patient info to notes if any patient fields are filled
      let finalNotes = notes;
      if (patientName || patientAge || patientGender) {
        const patientInfo = `[Patient: Name: ${patientName || 'N/A'}, Age: ${patientAge || 'N/A'}, Gender: ${patientGender || 'N/A'}]`;
        finalNotes = notes ? `${patientInfo}\n\n${notes}` : patientInfo;
      }

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: selectedHousehold,
          responses: completedResponses,
          notes: finalNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit visit');
      }

      const data: ScoreResponse = await res.json();
      setResult(data);

      if (data.scoring_method === 'fallback') {
        setShowFallbackToast(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      // Keep form data on network error - don't reset
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setSelectedHousehold('');
    setResponses({});
    setNotes('');
    setResult(null);
    setError(null);
    setShowFallbackToast(false);
  };

  // Get selected household details for mini summary
  const selectedHouseholdDetails = households.find(hh => hh.id === selectedHousehold);

  // Show result after successful submission
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        {showFallbackToast && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
            <AlertCircle className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {t('visit.fallbackToast') || 'AI explanation unavailable. Score calculated using standard screening weights.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('visit.result') || 'Screening Result'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('visit.riskLevel') || 'Risk Level'}</span>
              <RiskBadge level={result.risk_level} score={result.score} showScore size="lg" />
            </div>
            
            <Separator />

            <p className="text-sm text-muted-foreground">
              {locale === 'ne' ? result.explanation_ne : result.explanation_en}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/app')}
          >
            {t('visit.backToHome') || 'Back to Home'}
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push(`/app/visits/${result.visit_id}`)}
          >
            {t('visit.viewDetails') || 'View Full Details'}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={handleReset}
        >
          {t('visit.startNew') || 'Start New Visit'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner variant="compact" className="text-center" />

      {/* Patient Information Section */}
      <Card className="bg-gradient-to-br from-[var(--color-ivory)]/50 to-[var(--color-sage-light)]/10 border-t-4 border-t-[var(--color-sage)]">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--color-sage-dark)]">
            <User className="size-4" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4">
            {/* Name Field - Full width on mobile, then row layout */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="patientName" className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="size-3" />
                  Full Name
                </Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="bg-background/80"
                />
              </div>
            </div>
            
            {/* Age and Gender in a row */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-col gap-1.5 sm:w-28">
                <Label htmlFor="patientAge" className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  Age
                </Label>
                <Input
                  id="patientAge"
                  type="number"
                  min="0"
                  max="150"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Years"
                  className="bg-background/80"
                />
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  Gender
                </Label>
                <RadioGroup
                  value={patientGender}
                  onValueChange={setPatientGender}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <div key={gender}>
                      <RadioGroupItem
                        value={gender}
                        id={`gender-${gender}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`gender-${gender}`}
                        className={cn(
                          'flex items-center justify-center text-center',
                          'rounded-full border px-3 py-2 cursor-pointer',
                          'text-xs font-medium transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                          patientGender === gender && 'bg-primary text-primary-foreground border-primary'
                        )}
                      >
                        {gender}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Selection */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="size-4 text-primary" />
            {t('visit.selectHousehold') || 'Select Household'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col gap-3">
          <Select value={selectedHousehold} onValueChange={setSelectedHousehold}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('visit.chooseHousehold') || 'Choose a household...'} />
            </SelectTrigger>
            <SelectContent>
              {households.map((hh) => {
                const areaDisplay = hh.area_name ? (locale === 'ne' ? hh.area_name_ne : hh.area_name) : null;
                return (
                  <SelectItem key={hh.id} value={hh.id} className="py-3">
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{hh.code}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">{hh.head_name}</span>
                      </div>
                      {areaDisplay && (
                        <span className="text-xs text-muted-foreground">
                          {areaDisplay}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Mini summary card when household is selected */}
          {selectedHouseholdDetails && (
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[var(--color-sage)]/30 bg-[var(--color-sage-light)]/10">
              <div className="flex-shrink-0 size-8 rounded-full bg-[var(--color-sage)]/20 flex items-center justify-center">
                <Home className="size-4 text-[var(--color-sage-dark)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-sage-dark)]">
                    {selectedHouseholdDetails.code}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {selectedHouseholdDetails.head_name}
                  </span>
                </div>
                {selectedHouseholdDetails.area_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === 'ne' ? selectedHouseholdDetails.area_name_ne : selectedHouseholdDetails.area_name}
                  </p>
                )}
              </div>
              <CheckCircle2 className="size-5 text-[var(--color-sage)]" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Card - Sticky and Compact */}
      <Card className="sticky top-4 z-10 border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={progressValue} 
                className="h-1.5 bg-muted"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {progressValue === 100 ? (
                <CheckCircle2 className="size-4 text-green-600" />
              ) : (
                <ClipboardList className="size-4 text-muted-foreground" />
              )}
              <span className={cn(
                "font-medium tabular-nums",
                progressValue === 100 ? "text-green-600" : "text-muted-foreground"
              )}>
                {answeredCount}/{SIGNAL_KEYS.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screening Questions - ALL in ONE Card */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            {t('visit.screeningQuestions') || 'Screening Questions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col">
          {SCREENING_SIGNALS.map((signal, index) => {
            const currentValue = responses[signal.key as keyof VisitResponses];
            const signalLabel = locale === 'ne' ? signal.question_ne : signal.label_en;
            const isLast = index === SCREENING_SIGNALS.length - 1;

            return (
              <div key={signal.key}>
                <div className="flex items-start gap-3 py-3">
                  {/* Question Number Badge */}
                  <span className={cn(
                    "flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-semibold",
                    currentValue !== undefined 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <Label className="text-sm leading-relaxed">
                      {signalLabel}
                    </Label>
                    
                    {/* Response Options - Pill buttons */}
                    <RadioGroup
                      value={currentValue === undefined ? '' : String(currentValue)}
                      onValueChange={(val) => 
                        handleResponseChange(signal.key as keyof VisitResponses, parseInt(val) as SignalValue)
                      }
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                    >
                      {RESPONSE_OPTIONS.map((option) => {
                        const optionLabel = locale === 'ne' ? option.label_ne : option.label_en;
                        const isSelected = currentValue === option.value;

                        return (
                          <div key={option.value}>
                            <RadioGroupItem
                              value={String(option.value)}
                              id={`${signal.key}-${option.value}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`${signal.key}-${option.value}`}
                              className={cn(
                                'flex items-center justify-center text-center',
                                'rounded-full border px-3 py-1.5 cursor-pointer',
                                'text-xs font-medium transition-all',
                                'hover:bg-accent hover:text-accent-foreground',
                                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                                isSelected && 'bg-primary text-primary-foreground border-primary',
                                isSelected && option.value === 3 && 'bg-destructive text-destructive-foreground border-destructive',
                                isSelected && option.value === 0 && 'bg-[var(--color-sage)]/80 text-white border-[var(--color-sage)]'
                              )}
                            >
                              {optionLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>

                {/* Separator between questions */}
                {!isLast && <Separator className="my-0" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            {t('visit.notes') || 'Notes (Optional)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('visit.notesPlaceholder') || 'Add any additional observations...'}
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full bg-primary hover:bg-primary/90"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedHousehold || !allSignalsAnswered}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t('common.syncing') || 'Syncing...'}
          </>
        ) : (
          t('common.submit') || 'Submit'
        )}
      </Button>
    </div>
  );
}
