import React from 'react';
import { ShieldAlert, Terminal, Copy, Check } from 'lucide-react';

export default function FirebaseConfigWarning() {
  const [copied, setCopied] = React.useState(false);
  const sampleEnv = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative z-10 space-y-6">
        <div className="flex items-center space-x-3 text-amber-500">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Firebase Setup Required</h1>
            <p className="text-xs text-amber-400 font-medium">Missing environment configuration</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed">
          The application is ready, but it needs connection details to communicate with your Firebase project. To connect:
        </p>

        <ol className="text-slate-300 text-xs space-y-3.5 list-decimal pl-4">
          <li>Create a new file named <code className="text-brand-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">.env</code> in the project's root folder.</li>
          <li>Paste the environment variable keys listed below.</li>
          <li>Replace the placeholder values with your Firebase SDK details (found in your Firebase Console under <strong className="text-white">Project Settings &gt; General &gt; Your Apps</strong>).</li>
          <li>Restart your local development server (<code className="text-brand-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">npm run dev</code>).</li>
        </ol>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 border-b border-slate-900 pb-2">
            <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> .env template</span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Template</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
            {sampleEnv}
          </pre>
        </div>

        <div className="p-4 bg-slate-950/40 border border-slate-800 text-[11px] text-slate-500 rounded-xl">
          ℹ️ Once the <code className="font-mono text-slate-400 bg-slate-950 px-1 py-0.2 rounded border border-slate-900">.env</code> is recognized, this screen will automatically refresh to load the Login portal.
        </div>
      </div>
    </div>
  );
}
