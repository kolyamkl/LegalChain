'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalysisTabs } from '@/components/AnalysisTabs';
import { getAnalysisById } from '@/lib/api';
import type { ContractAnalysis } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysis_id');
  
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setError('No analysis ID provided');
      setIsLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const result = await getAnalysisById(analysisId);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-slate-600 dark:text-slate-400">Loading analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Failed to Load Analysis
          </h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Analysis Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            The requested analysis could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {analysis.contract_address && (
            <div>
              <span className="text-slate-500">Contract:</span>{' '}
              <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono text-xs">
                {analysis.contract_address}
              </code>
            </div>
          )}
          <div>
            <span className="text-slate-500">Chain:</span>{' '}
            <span className="font-medium">
              {analysis.chain_id === 1 ? 'Ethereum' : `Chain ${analysis.chain_id}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Analyzed:</span>{' '}
            <span className="font-medium">
              {new Date(analysis.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <AnalysisTabs analysis={analysis} />
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
