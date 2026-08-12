/**
 * O1: AI Disaster Scenario Simulator (Choose Your Own Adventure)
 * Web version – same flow as mobile: scenario text, 4 options, consequence, next step or game over.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/lib/api/client';
import { aiApi, ScenarioNextResult } from '@/lib/api/ai';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';

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
  const [stepIndex, setStepIndex] = useState(0);
  const [previousContext, setPreviousContext] = useState<Array<{ scenario: string; choice: string; consequence: string }>>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (accessToken) apiClient.setToken(accessToken);
  }, [isAuthenticated, router, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    loadFirstStep();
  }, [isAuthenticated, accessToken]);

  const applyResponse = (data: ScenarioNextResult) => {
    if (data.consequence != null && data.consequence) setConsequenceToShow(data.consequence);
    setScenarioText(data.nextScenario ?? scenarioText);
    setOptions(Array.isArray(data.options) ? data.options : []);
    setIsGameOver(data.isGameOver ?? false);
    setSafetyScore(data.safetyScoreSentence ?? null);
    setTip(data.tip ?? null);
    setLoading(false);
    setError(null);
  };

  const loadFirstStep = async () => {
    setLoading(true);
    setError(null);
    setConsequenceToShow(null);
    try {
      const result = await aiApi.scenarioNext({ stepIndex: 0, previousContext: [] });
      applyResponse(result);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Failed to load scenario');
    }
  };

  const onChoice = async (choice: string) => {
    const newContext = [
      ...previousContext,
      {
        scenario: scenarioText ?? '',
        choice,
        consequence: consequenceToShow ?? '',
      },
    ];
    setPreviousContext(newContext);
    setLoading(true);
    setConsequenceToShow(null);
    const nextStep = newContext.length;
    try {
      const result = await aiApi.scenarioNext({
        stepIndex: nextStep,
        userChoice: choice,
        previousContext: newContext,
      });
      applyResponse(result);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Failed to continue scenario');
    }
  };

  const playAgain = () => {
    setScenarioText(null);
    setConsequenceToShow(null);
    setOptions([]);
    setIsGameOver(false);
    setSafetyScore(null);
    setTip(null);
    setPreviousContext([]);
    setStepIndex(0);
    loadFirstStep();
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Disaster Scenario</h1>
              <p className="text-gray-600 mb-6">Choose your own adventure. AI generates the story and consequences.</p>

              {loading && !scenarioText && (
                <Card className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading scenario...</p>
                </Card>
              )}

              {error && !scenarioText && (
                <Card className="p-6 border-red-200 bg-red-50">
                  <p className="text-red-700">{error}</p>
                  <Button className="mt-4" onClick={loadFirstStep}>Retry</Button>
                </Card>
              )}

              {scenarioText && (
                <>
                  {consequenceToShow && (
                    <Card className="p-4 mb-4 border-amber-300 bg-amber-50">
                      <p className="font-semibold text-amber-900 mb-1">What happened</p>
                      <p className="text-gray-800">{consequenceToShow}</p>
                    </Card>
                  )}
                  <Card className="p-6 mb-6 border-blue-200 bg-blue-50/50">
                    <p className="font-semibold text-blue-900 mb-2">{isGameOver ? 'The end' : 'What do you do?'}</p>
                    <p className="text-gray-800">{scenarioText}</p>
                  </Card>

                  {loading && <p className="text-center text-gray-500 mb-4">Loading...</p>}

                  {isGameOver && !loading && (
                    <>
                      {safetyScore && (
                        <Card className="p-4 mb-4 border-green-300 bg-green-50">
                          <p className="font-semibold text-green-900 mb-1">Your safety score</p>
                          <p className="text-gray-800">{safetyScore}</p>
                        </Card>
                      )}
                      {tip && (
                        <Card className="p-4 mb-4 border-orange-200 bg-orange-50/50">
                          <p className="font-semibold text-orange-900 mb-1">Safety tip</p>
                          <p className="text-gray-800">{tip}</p>
                        </Card>
                      )}
                      <Button onClick={playAgain} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3">
                        Play again
                      </Button>
                    </>
                  )}

                  {!isGameOver && !loading && options.length > 0 && (
                    <div className="space-y-3">
                      {options.map((opt) => (
                        <Button
                          key={opt}
                          onClick={() => onChoice(opt)}
                          variant="outline"
                          className="w-full justify-center py-4 text-left border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-400"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
