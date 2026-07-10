import React, { useState } from 'react';
import { Key, ShieldCheck, ShieldAlert, User, Mail, Database, Lock, Unlock, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { decryptPassword, encryptPassword } from '../services/crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function SettingsTab({
  user,
  projects,
  masterKey,
  onSetMasterKey,
  onChangeMasterKeyClick
}) {
  const [localKeyInput, setLocalKeyInput] = useState('');
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  // Key Migration state
  const [showMigrateForm, setShowMigrateForm] = useState(false);
  const [currentKeyInput, setCurrentKeyInput] = useState(masterKey || '');
  const [newKey, setNewKey] = useState('');
  const [confirmNewKey, setConfirmNewKey] = useState('');
  const [migrateError, setMigrateError] = useState('');
  const [migrateStatus, setMigrateStatus] = useState('idle'); // idle, validating, migrating, completed
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState({ success: 0, failed: 0, skipped: 0 });

  const handleApplyKey = (e) => {
    e.preventDefault();
    if (localKeyInput.trim()) {
      onSetMasterKey(localKeyInput);
      setLocalKeyInput('');
      setShowKeyConfirm(true);
      setTimeout(() => setShowKeyConfirm(false), 2000);
    }
  };

  const handleLockKey = () => {
    onSetMasterKey('');
    setCurrentKeyInput('');
  };

  const handleMigration = async (e) => {
    e.preventDefault();
    if (!currentKeyInput.trim() || !newKey.trim() || !confirmNewKey.trim()) {
      setMigrateError('Please fill in all fields.');
      return;
    }

    if (newKey !== confirmNewKey) {
      setMigrateError('New keys do not match.');
      return;
    }

    if (currentKeyInput === newKey) {
      setMigrateError('New key must be different from current key.');
      return;
    }

    setMigrateError('');
    setMigrateStatus('validating');

    // Validate current key
    let encryptFieldsFound = 0;
    let successfulDecryptions = 0;

    for (const proj of projects) {
      if (proj.domainPlatform?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.domainPlatform.password, currentKeyInput);
          successfulDecryptions++;
        } catch (err) {}
      }
      if (proj.hostingPlatform?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.hostingPlatform.password, currentKeyInput);
          successfulDecryptions++;
        } catch (err) {}
      }
      if (proj.gmail?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.gmail.password, currentKeyInput);
          successfulDecryptions++;
        } catch (err) {}
      }
      if (proj.wpAdmin?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.wpAdmin.password, currentKeyInput);
          successfulDecryptions++;
        } catch (err) {}
      }
      if (proj.cpanel?.password) {
        encryptFieldsFound++;
        try {
          decryptPassword(proj.cpanel.password, currentKeyInput);
          successfulDecryptions++;
        } catch (err) {}
      }
    }

    if (encryptFieldsFound > 0 && successfulDecryptions === 0) {
      setMigrateError('Validation failed. The current Master Key is incorrect.');
      setMigrateStatus('idle');
      return;
    }

    // Migration loop
    setMigrateStatus('migrating');
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
          continue;
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

      // WP Admin Password
      if (proj.wpAdmin?.password) {
        try {
          const plain = decryptPassword(proj.wpAdmin.password, currentKeyInput);
          const cipher = encryptPassword(plain, newKey);
          updatedCredentials.wpAdmin = {
            ...proj.wpAdmin,
            password: cipher
          };
          docNeedsUpdate = true;
        } catch (err) {
          failed++;
          console.error(`Failed to decrypt WP Admin for project: ${proj.projectName}`);
          continue;
        }
      }

      // cPanel Password
      if (proj.cpanel?.password) {
        try {
          const plain = decryptPassword(proj.cpanel.password, currentKeyInput);
          const cipher = encryptPassword(plain, newKey);
          updatedCredentials.cpanel = {
            ...proj.cpanel,
            password: cipher
          };
          docNeedsUpdate = true;
        } catch (err) {
          failed++;
          console.error(`Failed to decrypt cPanel for project: ${proj.projectName}`);
          continue;
        }
      }

      if (docNeedsUpdate) {
        try {
          const docRef = doc(db, 'projects', proj.id);
          await updateDoc(docRef, updatedCredentials);
          migrated++;
        } catch (err) {
          failed++;
          console.error(`Firestore update error for project: ${proj.projectName}`, err);
        }
      } else {
        skipped++;
      }
    }

    setSummary({ success: migrated, failed, skipped });
    setMigrateStatus('completed');
    onSetMasterKey(newKey); // Update global memory state with new key
  };

  const handleResetMigrationState = () => {
    setNewKey('');
    setConfirmNewKey('');
    setMigrateStatus('idle');
    setMigrateError('');
    setShowMigrateForm(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure credentials keys and manage session variables</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Memory Key Management Card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Decryption Master Key</h3>
              <p className="text-[10px] text-slate-500">Volatile in-memory key context</p>
            </div>
          </div>

          {masterKey ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Master Key Active & Loaded</span>
                </div>
                <button
                  onClick={handleLockKey}
                  className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  Clear & Lock
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your key phrase is stored in local memory. Sensitive password ciphers will automatically decrypt in the details ledger.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-amber-500 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Memory Cryptography Inactive</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                No Master Key is configured. Passwords will show as locked (🔒) and cannot be decrypted.
              </p>
              <form onSubmit={handleApplyKey} className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="Enter Master Decryption Key"
                  value={localKeyInput}
                  onChange={(e) => setLocalKeyInput(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Unlock
                </button>
              </form>
            </div>
          )}

          {/* Master Key Migration Console */}
          {masterKey && !showMigrateForm && (
            <div className="pt-2">
              <button
                onClick={() => setShowMigrateForm(true)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-brand-400 hover:text-brand-300 font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Change / Migrate Master Key</span>
              </button>
            </div>
          )}

          {/* Inline Key Migration Form */}
          {showMigrateForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 animate-slideDown">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Change Encryption Key</h4>
                <button
                  onClick={handleResetMigrationState}
                  disabled={migrateStatus === 'validating' || migrateStatus === 'migrating'}
                  className="text-slate-500 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {migrateError && (
                <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 text-xs rounded-lg">
                  {migrateError}
                </div>
              )}

              {migrateStatus === 'idle' && (
                <form onSubmit={handleMigration} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Current Key Phrase</label>
                      <input
                        type="password"
                        required
                        value={currentKeyInput}
                        onChange={(e) => setCurrentKeyInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">New Key Phrase</label>
                      <input
                        type="password"
                        required
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">Confirm New Key Phrase</label>
                    <input
                      type="password"
                      required
                      value={confirmNewKey}
                      onChange={(e) => setConfirmNewKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Start Cryptographic Migration
                  </button>
                </form>
              )}

              {(migrateStatus === 'validating' || migrateStatus === 'migrating') && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                  <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100">
                      {migrateStatus === 'validating' ? 'Validating Current Master Key...' : 'Migrating Firestore Documents...'}
                    </p>
                    {migrateStatus === 'migrating' && (
                      <p className="text-[10px] text-slate-500">
                        Processing: {progress.current} of {progress.total} projects
                      </p>
                    )}
                  </div>
                </div>
              )}

              {migrateStatus === 'completed' && (
                <div className="py-4 space-y-4 text-center">
                  <div className="flex justify-center text-emerald-400">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">Migration Complete!</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                      All encrypted fields have been successfully re-encrypted with your new Master Key.
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 max-w-xs mx-auto text-xs grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500 block">Migrated</span>
                      <strong className="text-slate-100">{summary.success}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Skipped</span>
                      <strong className="text-slate-400">{summary.skipped}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Failed</span>
                      <strong className="text-red-400">{summary.failed}</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleResetMigrationState}
                    className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    Finish
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Connection Info */}
        <div className="space-y-6">
          {/* User Account Session Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-white">
              <User className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-xs">Active Session</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Firestore Connection Status</span>
              </div>
              <div className="flex items-center space-x-1.5 pl-5.5 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected & Syncing</span>
              </div>
            </div>
          </div>

          {/* Cryptography disclaimer info */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🔒 Client-Side Cryptography</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Passwords are encrypted client-side using <strong>AES-256</strong>. Only the decrypted credentials are shown in the ledger, unlocked temporarily in memory.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ensure you do not lose your Master Key phrase, as it is never saved to the cloud and cannot be reset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
