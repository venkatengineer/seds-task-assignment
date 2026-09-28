'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Orbit, ShieldAlert, ArrowLeft, Mail, Copy, Check, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const [copied, setCopied] = useState(false);
  const adminEmail = 'venkatbadhrinarayanan.pv.2024.cse@rajalakshmi.edu.in';

  const handleCopy = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-1">
            <Orbit className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SEDS REC
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Account Password Recovery
          </p>
        </div>

        {/* Security Policy Panel */}
        <div className="p-6 sm:p-7 bg-white border border-gray-200 rounded-xl shadow-xs space-y-5">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Self-Service Reset Disabled
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                For internal team security, automated password reset emails are restricted. 
                Please request a password reset from your <strong>SEDS Administrator</strong> or <strong>Team Lead</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>How Password Reset Works:</span>
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-1 text-gray-600">
              <li>
                Contact your Platform Administrator or Team Lead with your registered college email.
              </li>
              <li>
                The Administrator will reset your credentials to the default system password (<code className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">Seds@2026</code>).
              </li>
              <li>
                Sign in with <code className="font-mono text-gray-800">Seds@2026</code>, then change your password to your own private secret inside your account settings.
              </li>
            </ol>
          </div>

          {/* Admin Contact Box */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>Platform Administrator Contact</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg">
              <span className="font-mono text-xs text-gray-800 truncate select-all">
                {adminEmail}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer"
                title="Copy email address"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-gray-400 font-medium">
          SEDS REC • Team Platform
        </div>
      </div>
    </div>
  );
}
