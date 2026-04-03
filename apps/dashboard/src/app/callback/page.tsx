"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const queryError = searchParams.get('error');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    async function exchangeToken() {
      // 1. Guard against native OAuth exceptions
      if (queryError) {
        setStatus('error');
        setFeedback(`LinkedIn threw explicit map: ${queryError}`);
        return;
      }

      // 2. Await proper payload hooks on load
      if (!code) return;

      console.log("[OAuth Client] Intercepted Code. Dispatching automated token exchange...");

      try {
        // 3. Dispatch to secure proxy API hiding client_secrets from the frontend
        const res = await fetch('/api/linkedin/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await res.json();

        // 4. Update the View safely
        if (data.success) {
          setStatus('success');
          setFeedback('LinkedIn connected successfully');
        } else {
          setStatus('error');
          setFeedback(`Network Exchange Error: ${data.details || data.error}`);
        }

      } catch (err: any) {
        setStatus('error');
        setFeedback(`Local Execution Crash: ${err.message}`);
      }
    }

    exchangeToken();
  }, [code, queryError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3f2] p-6 text-center">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#c5c6d2]">
        {status === 'success' ? (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#001333] mb-2">{feedback}</h2>
            <p className="text-sm font-medium text-[#444650]">
              The OAuth access token has been generated explicitly into node memory seamlessly.
            </p>
          </div>
        ) : status === 'error' ? (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#001333] mb-2">Authorization Failed</h2>
            <p className="text-sm font-medium text-[#444650] break-words">
              {feedback}
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#001333] mb-2">Resolving Token Network...</h2>
            <p className="text-sm font-medium text-[#444650] break-words">
              Executing code exchanges via internal backend APIs privately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f6f3f2]">
        <p>Loading Auth Callback...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
