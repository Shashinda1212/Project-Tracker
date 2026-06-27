import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { decryptPassword, encryptPassword } from '../services/crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function ChangeMasterKeyModal({ projects, currentMasterKey, onKeyMigrated, onClose }) {
  const [currentKeyInput, setCurrentKeyInput] = useState(currentMasterKey || '');
  const [newKey, setNewKey] = useState('');
  const [confirmNewKey, setConfirmNewKey] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle, validating, migrating, completed
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState({ success: 0, failed: 0, skipped: 0 });

  const handleMigration = async (e) => {
    e.preventDefault();
    if (!currentKeyInput.trim() || !newKey.trim() || !confirmNewKey.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (newKey !== confirmNewKey) {
      setError('New keys do not match.');
      return;
    }

    if (currentKeyInput === newKey) {
      setError('New key must be different from current key.');
      return;
    }

    setError('');
    setStatus('validating');

    // 1. Validate current key
    // We try to decrypt at least one encrypted credential in the database.
    // If decryption fails for all credentials that exist, the current key is likely wrong.
    let encryptFieldsFound = 0;
    let successfulDecryptions = 0;

    for (const proj of projects) {
      if (proj.domainPlatform?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.domainPlatform.password, currentKeyInput);
          successfulDecryptions++;
        } catch (e) {}
      }
      if (proj.hostingPlatform?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.hostingPlatform.password, currentKeyInput);
          successfulDecryptions++;
        } catch (e) {}
      }
      if (proj.gmail?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.gmail.password, currentKeyInput);
          successfulDecryptions++;
        } catch (e) {}
      }
    }

    // If there are encrypted fields in the DB, but we couldn't decrypt any of them:
    if (encryptFieldsFound > 0 && successfulDecryptions === 0) {
      setError('Validation failed. The current Master Key is incorrect.');
      setStatus('idle');
      return;
    }

    // 2. Perform Migration Loop
    setStatus('migrating');
    const totalProjects = projects.length;
    setProgress({ current: 0, total: totalProjects });

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < totalProjects; i++) {
      const proj = projects[i];
      setProgress({ current: i + 1, total: totalProjects });

      let docNeedsUpdate = false;
      const updatedCredentials = {};

      // Domain Password
      if (proj.domainPlatform?.password) {
        try {
          const plain = decryptPassword(proj.domainPlatform.password, currentKeyInput);
          const cipher = encryptPassword(plain, newKey);
          updatedCredentials.domainPlatform = {
            ...proj.domainPlatform,
            password: cipher
          };
          docNeedsUpdate = true;
        } catch (err) {
          failed++;
          console.error(`Failed to decrypt domain for project: ${proj.projectName}`);
          continue; // Skip this document if it fails to prevent corruption
        }
      }

      // Hosting Password
      if (proj.hostingPlatform?.password) {
        try {
          const plain = decryptPassword(proj.hostingPlatform.password, currentKeyInput);
          const cipher = encryptPassword(plain, newKey);
          updatedCredentials.hostingPlatform = {
            ...proj.hostingPlatform,
            password: cipher
          };
          docNeedsUpdate = true;
        } catch (err) {
          failed++;
          console.error(`Failed to decrypt hosting for project: ${proj.projectName}`);
          continue;
        }
      }

      // Gmail Password
      if (proj.gmail?.password) {
        try {
          const plain = decryptPassword(proj.gmail.password, currentKeyInput);
          const cipher = encryptPassword(plain, newKey);
          updatedCredentials.gmail = {
            ...proj.gmail,
            password: cipher
          };
          docNeedsUpdate = true;
        } catch (err) {
          failed++;
          console.error(`Failed to decrypt gmail for project: ${proj.projectName}`);
          continue;
        }
      }

      if (docNeedsUpdate) {
        try {
          const docRef = doc(db, 'projects', proj.id);
          await updateDoc(docRef, {
            ...updatedCredentials,
            updatedAt: new Date().toISOString()
          });
          migrated++;
        } catch (dbErr) {
          failed++;
          console.error(`Firestore save error on project: ${proj.projectName}`, dbErr);
        }
      } else {
        skipped++;
      }
    }

    setSummary({ success: migrated, failed, skipped });
    setStatus('completed');
    if (onKeyMigrated) {
      onKeyMigrated(newKey);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
        
        {status !== 'migrating' && status !== 'validating' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-3 text-brand-400">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
            <RefreshCw className={`w-5 h-5 ${(status === 'migrating' || status === 'validating') ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">Rotate Master Decryption Key</h3>
            <p className="text-xs text-slate-500">Re-encrypts all database records</p>
          </div>
        </div>

        {status === 'idle' && (
          <form onSubmit={handleMigration} className="space-y-4">
            <div className="p-4 bg-amber-950/30 border border-amber-900/40 text-amber-300 text-xs rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Changing the Master Key decodes all passwords in memory and re-saves them. Do not close this browser tab once the process starts.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800/40 text-red-200 text-xs rounded-xl">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Current Master Key</label>
              <input
                type="password"
                required
                placeholder="Enter current master key phrase"
                value={currentKeyInput}
                onChange={(e) => setCurrentKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">New Master Key</label>
              <input
                type="password"
                required
                placeholder="Enter new master key phrase"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Confirm New Master Key</label>
              <input
                type="password"
                required
                placeholder="Re-enter new master key phrase"
                value={confirmNewKey}
                onChange={(e) => setConfirmNewKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel Rotation
              </button>
              <button
                type="submit"
                className="w-1/2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-brand-500/10 cursor-pointer"
              >
                Migrate Database
              </button>
            </div>
          </form>
        )}

        {(status === 'validating' || status === 'migrating') && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
            <div>
              <h4 className="font-bold text-white text-sm">
                {status === 'validating' ? 'Validating current master key...' : 'Re-encrypting Firestore files...'}
              </h4>
              {status === 'migrating' && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Processed project {progress.current} of {progress.total}
                </p>
              )}
            </div>
            
            {status === 'migrating' && (
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {status === 'completed' && (
          <div className="py-4 space-y-5 text-center">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle className="w-12 h-12" />
            </div>
            
            <div>
              <h4 className="font-bold text-white text-sm">Key Rotation Complete!</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                All credentials have been re-encrypted with your new Master Key and saved successfully to Firestore.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left text-xs text-slate-500 space-y-1">
              <div>✅ Migrated Projects: <strong className="text-slate-300">{summary.success}</strong></div>
              <div>⏩ Skips (no passwords): <strong className="text-slate-300">{summary.skipped}</strong></div>
              {summary.failed > 0 && (
                <div className="text-red-400 font-semibold">❌ Failed Updates: <strong>{summary.failed}</strong></div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-brand-500/10"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
