/**
 * Resources / Guidelines page – B5 Long guideline summariser
 * Paste NDMA/NDRF or other long safety text; AI returns 5–7 bullet points for teachers.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/lib/api/client';
import { aiApi } from '@/lib/api/ai';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function ResourcesPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [guidelineText, setGuidelineText] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [isSummarising, setIsSummarising] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null); // G2
  const [isSimplifying, setIsSimplifying] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (accessToken) {
      apiClient.setToken(accessToken);
    }
  }, [isAuthenticated, router, accessToken]);

  const handleSummarise = async () => {
    const text = guidelineText.trim();
    if (!text) {
      showToast('Paste or type guideline text first.', 'info');
      return;
    }
    setIsSummarising(true);
    setBullets([]);
    try {
      const result = await aiApi.summariseGuideline(text);
      const list = result?.bullets ?? [];
      setBullets(list);
      if (list.length) showToast('Summary ready.', 'success');
      else showToast('No summary generated.', 'info');
    } catch (e: any) {
      showToast(e?.message || 'Summarise failed', 'error');
    } finally {
      setIsSummarising(false);
    }
  };

  const handleSimplify = async () => {
    const text = guidelineText.trim();
    if (!text) {
      showToast('Paste or type text first.', 'info');
      return;
    }
    setIsSimplifying(true);
    setSimplifiedText(null);
    try {
      const result = await aiApi.simplify(text, 10);
      const simplified = result?.simplified ?? '';
      setSimplifiedText(simplified || null);
      if (simplified) showToast('Simple version ready.', 'success');
      else showToast('No simplified text generated.', 'info');
    } catch (e: any) {
      showToast(e?.message || 'Simplify failed', 'error');
    } finally {
      setIsSimplifying(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Safety guidelines</h1>
              <p className="text-gray-600 mb-6">
                Paste long safety or guideline text (e.g. NDMA/NDRF). AI will summarise it into 5–7 bullet points for teachers.
              </p>

              <Card className="p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste guideline text</label>
                <textarea
                  value={guidelineText}
                  onChange={(e) => setGuidelineText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                  rows={10}
                  placeholder="Paste or type long safety guidelines here..."
                />
                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                  <Button
                    onClick={handleSummarise}
                    disabled={isSummarising || !guidelineText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSummarising ? 'Summarising…' : 'Summarise with AI'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSimplify}
                    disabled={isSimplifying || !guidelineText.trim()}
                  >
                    {isSimplifying ? '…' : 'Simple version (for students)'}
                  </Button>
                </div>
              </Card>

              {simplifiedText && (
                <Card className="p-6 mb-6 border-2 border-amber-100 bg-amber-50/50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Simple version (for lower grades)</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{simplifiedText}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setSimplifiedText(null)}>
                    Close
                  </Button>
                </Card>
              )}

              {bullets.length > 0 && (
                <Card className="p-6 border-2 border-blue-100 bg-blue-50/30">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary for teachers</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
