'use client';

import React, { useState } from 'react';

export function ClientPostCard({ post }: { post: any }) {
  const [status, setStatus] = useState<string>(post.status);
  const [content, setContent] = useState<string>(post.content);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleAction = async (action: 'approve' | 'reject' | 'regenerate' | 'publish') => {
    setIsProcessing(true);
    try {
      if (action === 'approve') {
        const res = await fetch('/api/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        if (res.ok) setStatus('approved');
      } 
      
      else if (action === 'reject') {
        const res = await fetch('/api/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        if (res.ok) setStatus('rejected');
      } 
      
      else if (action === 'regenerate') {
        const res = await fetch('/api/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, topicTitle: post.topics?.title || 'Unknown Topic' })
        });
        if (res.ok) {
          const data = await res.json();
          setContent(data.post.content);
        }
      }
      else if (action === 'publish') {
         if (!window.confirm("Are you totally sure you want to officially publish this to LinkedIn?")) {
            setIsProcessing(false);
            return;
         }
         const res = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id })
         });
         
         if (res.ok) {
            setStatus('published');
         } else {
            const err = await res.json();
            alert(`Publication Exception: ${err.error}`);
            setStatus('publish_failed');
         }
      }
    } catch (e) {
      console.error(`Error processing ${action}:`, e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'published' || status === 'rejected') {
    return null; // Omit terminal states from dashboard natively
  }

  // Parse strings gracefully if saved as JSON strings from the worker
  let rawHashtags = post.hashtags;
  if (typeof rawHashtags === 'string') {
    try { rawHashtags = JSON.parse(rawHashtags); } catch (e) {}
  }

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-[0_12px_40px_-10px_rgba(28,27,27,0.06)] border border-[#c5c6d2]/20 flex flex-col justify-between h-full transition-transform hover:scale-[1.01]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold tracking-tight text-[#001333]">
            {post.topics?.title || 'Unknown Topic'}
          </h3>
          <span className="px-2.5 py-1 bg-[#f0edec] rounded text-[10px] font-bold text-[#444650] uppercase tracking-wider border border-[#c5c6d2]/40">
            v{post.version || 1}
          </span>
        </div>
        
        {post.image_url && (
          <div className="mb-5 rounded-xl overflow-hidden border border-[#c5c6d2]/30 bg-[#fefdfd] relative group">
            <img src={post.image_url} alt="Architectural Diagram" className="w-full object-contain max-h-48 p-2" />
            <div className="absolute inset-0 bg-[#001333]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a href={post.image_url} download={`diagram-${post.id}.png`} className="px-5 py-2.5 bg-white text-[#001333] text-xs font-bold tracking-wide rounded-lg shadow-lg hover:scale-105 transition-transform">
                Download Artifact
              </a>
            </div>
          </div>
        )}

        <div className="text-sm font-sans text-[#444650] leading-relaxed mb-6 whitespace-pre-wrap line-clamp-6">
          {content}
        </div>
        
        {Array.isArray(rawHashtags) && rawHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {rawHashtags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-[#d6e3fc] text-[#0f2750] text-xs font-semibold rounded-full border border-[#b1c6f9]/30">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        {status === 'generated' && (
          <div className="flex space-x-3 w-full border-t border-[#c5c6d2]/30 pt-4 mt-auto">
            <button 
              onClick={() => handleAction('approve')}
              className="flex-1 px-4 py-2 bg-[#001333] tracking-wide text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
              disabled={isProcessing}
            >
              ✓ Approve
            </button>
            <button 
              onClick={() => handleAction('regenerate')}
              className="flex-1 px-4 py-2 bg-[#f0edec] tracking-wide text-[#001333] font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors border border-[#c5c6d2]/50 shadow-sm disabled:opacity-50"
              disabled={isProcessing}
            >
              ⟳ Re-Roll
            </button>
            <button 
              onClick={() => handleAction('reject')}
              className="flex-1 px-4 py-2 bg-red-50 tracking-wide text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors border border-red-200 shadow-sm disabled:opacity-50"
              disabled={isProcessing}
            >
              ✕ Reject
            </button>
          </div>
        )}

        {status === 'ready_to_publish_manual' && (
           <div className="flex space-x-3 w-full border-t border-[#c5c6d2]/30 pt-4 mt-auto">
             <button 
              onClick={() => {
                navigator.clipboard.writeText(content);
                alert("Text copied to clipboard natively! Proceed to LinkedIn.com to paste the buffer.");
              }}
              className="w-full px-4 py-2.5 bg-[#db7e4c] tracking-wide text-white font-bold text-sm rounded-lg hover:bg-[#c06b3e] transition-colors shadow-sm"
            >
              📋 Copy Post Sequence
            </button>
           </div>
        )}

        {(status === 'approved' || status === 'publish_failed') && (
          <div className="flex space-x-3 w-full border-t border-[#c5c6d2]/30 pt-4 mt-auto relative">
            <button 
              onClick={() => handleAction('publish')}
              className={`w-full px-4 py-2 tracking-wide font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${
                status === 'publish_failed' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : status === 'publish_failed' ? (
                <span>⚠️ Retry Publish to LinkedIn</span>
              ) : (
                <span>⇪ Publish to LinkedIn</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
