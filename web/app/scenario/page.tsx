/**
 * O1: AI Disaster Scenario Simulator — WB8 / WD17 honest progression
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/lib/api/client';
import { aiApi, ScenarioNextResult } from '@/lib/api/ai';
import {
  ScenarioHistoryEntry,
  appendAcceptedStep,
  feedbackSectionTitle,
  isQuotaLimited,
  isValidScenarioAdvance,
  normalizeScenarioOptions,
} from '@/lib/api/wb8-scenario';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PendingTransition = {
  scenario: string;
  choice: string;
  stepIndex: number;
  contextSnapshot: ScenarioHistoryEntry[];
};

export default function ScenarioPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [scenarioText, setScenarioText] = useState<string | null>(null);
  const [consequenceToShow, setConsequenceToShow] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [safetyScore, setSafetyScore] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [acceptedHistory, setAcceptedHistory] = useState<ScenarioHistoryEntry[]>([]);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const sessionRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (accessToken) apiClient.setToken(accessToken);
  }, [isAuthenticated, router, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    startSession();
  }, [isAuthenticated, accessToken]);

  const applyAccepted = (data: ScenarioNextResult, opts?: { appendPending?: PendingTransition | null }) => {
    const optsList = normalizeScenarioOptions(data.options);
    setScenarioText(data.nextScenario);
    setOptions(optsList);
    setIsGameOver(Boolean(data.isGameOver));
    setSafetyScore(data.safetyScoreSentence ?? null);
    setTip(data.tip ?? null);
    if (data.consequence != null && String(data.consequence).trim()) {
      setConsequenceToShow(String(data.consequence));
    } else if (!opts?.appendPending) {
      setConsequenceToShow(null);
    } else {
      setConsequenceToShow(data.consequence ? String(data.consequence) : null);
    }

    if (opts?.appendPending) {
      setAcceptedHistory((prev) =>
        appendAcceptedStep(prev, opts.appendPending!, data.consequence)
      );
    }

    setPending(null);
    setSelectedChoice(null);
    setQuotaBlocked(false);
    setError(null);
    setLoading(false);
    inFlightRef.current = false;
  };

  const startSession = async () => {
    const session = ++sessionRef.current;
    inFlightRef.current = false;
    setLoading(true);
    setError(null);
    setQuotaBlocked(false);
    setConsequenceToShow(null);
    setScenarioText(null);
    setOptions([]);
    setIsGameOver(false);
    setSafetyScore(null);
    setTip(null);
    setAcceptedHistory([]);
    setPending(null);
    setSelectedChoice(null);
    setShowHistory(false);

    try {
      const result = await aiApi.scenarioNext({ stepIndex: 0, previousContext: [] });
      if (session !== sessionRef.current) return;

      if (isQuotaLimited(result)) {
        setLoading(false);
        setQuotaBlocked(true);
        setError('AI practice is temporarily unavailable (quota). Your prior state was not replaced.');
        return;
      }
      if (!isValidScenarioAdvance(result)) {
        setLoading(false);
        setError('Scenario step unavailable — response had no usable choices. Retry to start again.');
        return;
      }
      applyAccepted(result);
    } catch (e: any) {
      if (session !== sessionRef.current) return;
      setLoading(false);
      setError(e?.message || 'Failed to load scenario');
      inFlightRef.current = false;
    }
  };

  const runTransition = async (transition: PendingTransition) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const session = sessionRef.current;
    setPending(transition);
    setLoading(true);
    setError(null);
    setQuotaBlocked(false);

    try {
      const result = await aiApi.scenarioNext({
        stepIndex: transition.stepIndex,
        userChoice: transition.choice,
        previousContext: transition.contextSnapshot,
      });
      if (session !== sessionRef.current) return;

      if (isQuotaLimited(result)) {
        setLoading(false);
        setQuotaBlocked(true);
        setError('AI practice temporarily unavailable. Your last accepted step was kept — retry the same choice.');
        inFlightRef.current = false;
        return;
      }

      if (!isValidScenarioAdvance(result)) {
        setLoading(false);
        setError('Next step unavailable (no choices and not complete). Retry the same transition.');
        inFlightRef.current = false;
        return;
      }

      applyAccepted(result, { appendPending: transition });
    } catch (e: any) {
      if (session !== sessionRef.current) return;
      setLoading(false);
      setError(e?.message || 'Failed to continue scenario');
      inFlightRef.current = false;
    }
  };

  const onContinue = () => {
    if (!selectedChoice || !scenarioText || loading || inFlightRef.current) return;
    const transition: PendingTransition = {
      scenario: scenarioText,
      choice: selectedChoice,
      stepIndex: acceptedHistory.length + 1,
      contextSnapshot: acceptedHistory,
    };
    void runTransition(transition);
  };

  const retryPendingOrStart = () => {
    if (pending) {
      void runTransition(pending);
      return;
    }
    void startSession();
  };

  const playAgain = () => {
    void startSession();
  };

  const acceptedStepNumber = acceptedHistory.length + (scenarioText && !isGameOver ? 1 : 0);
  const displayStep = isGameOver
    ? Math.max(acceptedHistory.length, 1)
    : Math.max(acceptedStepNumber, scenarioText ? 1 : 0);

  return (
    <ProtectedRoute>
      <AppShell title="Safety scenario practice">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Safety scenario practice</h1>
          <p className="text-gray-600 mb-2 text-sm">
            AI-generated practice story — not live emergency instructions or dispatch.
          </p>
          {scenarioText && (
            <p className="text-sm text-gray-500 mb-6">
              Step {displayStep}
              {acceptedHistory.length > 0 ? ` · ${acceptedHistory.length} choice(s) accepted` : ''}
            </p>
          )}

          {loading && !scenarioText && !quotaBlocked && (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading scenario…</p>
            </Card>
          )}

          {quotaBlocked && !scenarioText && (
            <Card className="p-6 border-amber-200 bg-amber-50">
              <p className="font-semibold text-amber-900 mb-2">AI practice temporarily unavailable</p>
              <p className="text-amber-900 text-sm mb-4">
                {error || 'Quota or cooldown — try again shortly. No practice progress was recorded.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={retryPendingOrStart}>Retry</Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Exit
                </Button>
              </div>
            </Card>
          )}

          {error && !scenarioText && !quotaBlocked && (
            <Card className="p-6 border-red-200 bg-red-50">
              <p className="text-red-700">{error}</p>
              <Button className="mt-4" onClick={startSession}>
                Retry
              </Button>
            </Card>
          )}

          {scenarioText && (
            <>
              {consequenceToShow && (
                <Card className="p-4 mb-4 border border-gray-200 bg-white">
                  <p className="font-semibold text-gray-900 mb-1">What happened</p>
                  <p className="text-gray-800 text-sm">{consequenceToShow}</p>
                </Card>
              )}

              <Card className="p-6 mb-4 border border-gray-200 bg-white">
                <p className="font-semibold text-gray-900 mb-2">
                  {isGameOver ? 'Scenario complete' : 'Current situation'}
                </p>
                <p className="text-gray-800">{scenarioText}</p>
              </Card>

              {loading && (
                <p className="text-center text-gray-500 mb-4 text-sm" aria-live="polite">
                  Generating next step… Selected choice kept.
                </p>
              )}

              {(error || quotaBlocked) && (
                <Card className="p-4 mb-4 border border-amber-200 bg-amber-50">
                  <p className="text-sm text-amber-950 mb-3">
                    {quotaBlocked
                      ? 'AI practice temporarily unavailable. Accepted history was not advanced.'
                      : error}
                  </p>
                  {pending && (
                    <p className="text-xs text-amber-900 mb-3">
                      Pending choice: <span className="font-medium">{pending.choice}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={retryPendingOrStart} disabled={loading}>
                      Retry
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')} disabled={loading}>
                      Exit
                    </Button>
                  </div>
                </Card>
              )}

              {isGameOver && !loading && (
                <div className="space-y-4 mb-4">
                  <Card className="p-4 border border-gray-200 bg-white">
                    <p className="font-semibold text-gray-900 mb-2">Debrief</p>
                    {safetyScore ? (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">{feedbackSectionTitle()}</p>
                        <p className="text-gray-800 text-sm">{safetyScore}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Narrative feedback only — not a numeric score, XP, or official preparedness rating.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">No choice feedback sentence was returned.</p>
                    )}
                    {tip ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Learning takeaway</p>
                        <p className="text-gray-800 text-sm">{tip}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Generated practice text — not reviewed official guidance unless cited by a content contract.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No takeaway tip was returned for this run.</p>
                    )}
                  </Card>

                  {showHistory && acceptedHistory.length > 0 && (
                    <Card className="p-4 border border-gray-200">
                      <p className="font-semibold text-gray-900 mb-3">Your choices</p>
                      <ol className="space-y-3 list-decimal list-inside text-sm text-gray-800">
                        {acceptedHistory.map((h, i) => (
                          <li key={`${i}-${h.choice}`}>
                            <span className="font-medium">{h.choice}</span>
                            {h.consequence ? (
                              <p className="ml-5 text-gray-600 mt-1">{h.consequence}</p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </Card>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {acceptedHistory.length > 0 && (
                      <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
                        {showHistory ? 'Hide choices' : 'Review choices'}
                      </Button>
                    )}
                    <Button onClick={playAgain}>Try another scenario</Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                      Return
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Session is in-memory only — it does not resume after logout or reload.
                  </p>
                </div>
              )}

              {!isGameOver && !loading && options.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Choose one option, then continue</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Scenario choices">
                    {options.map((opt) => {
                      const selected = selectedChoice === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={Boolean(pending && error)}
                          onClick={() => setSelectedChoice(opt)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            selected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full"
                    onClick={onContinue}
                    disabled={!selectedChoice || loading}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
