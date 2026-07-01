import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './services/firebase';
import FirebaseConfigWarning from './components/FirebaseConfigWarning';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProjectsTab from './components/ProjectsTab';
import SettingsTab from './components/SettingsTab';
import ChangeMasterKeyModal from './components/ChangeMasterKeyModal';
import { Key, ShieldAlert, ShieldCheck, LogOut, TrendingUp, X, LayoutDashboard, FolderKanban, Settings } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [dbError, setDbError] = useState(null);

  // App views state
  const [selectedProject, setSelectedProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // In-memory Master Key for AES-256 decryption/encryption
  const [masterKey, setMasterKey] = useState('');
  const [isKeyPromptOpen, setIsKeyPromptOpen] = useState(false);
  const [isMigrateKeyOpen, setIsMigrateKeyOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'projects', 'settings'
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Projects from Firestore in real-time
  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      setProjects([]);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnapshot) => {
        list.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

      // Sort by order asc, fallback to updatedAt desc
      list.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999999;
        const orderB = b.order !== undefined ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });

      setProjects(list);
      setDbError(null);

      // If we currently have a detail modal open, sync its state with real-time updates
      setSelectedProject(current => {
        if (!current) return null;
        return list.find(p => p.id === current.id) || null;
      });
    }, (error) => {
      console.error("Firestore sync error:", error);
      setDbError(error.message);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMasterKeySubmit = (e) => {
    e.preventDefault();
    if (masterKeyInput.trim()) {
      setMasterKey(masterKeyInput.trim());
      setShowKeyConfirm(true);
      setTimeout(() => setShowKeyConfirm(false), 2000);
    }
  };

  const handleClearMasterKey = () => {
    setMasterKey('');
    setMasterKeyInput('');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMasterKey(''); // clear key on logout
      setSelectedProject(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Create or Update Project
  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        // Edit mode
        const projectRef = doc(db, 'projects', editingProject.id);
        await updateDoc(projectRef, {
          ...projectData,
          userId: user.uid
        });
      } else {
        // Create mode
        const orders = projects.map(p => p.order).filter(o => o !== undefined);
        const minOrder = orders.length > 0 ? Math.min(...orders) : 0;

        const projectsRef = collection(db, 'projects');
        await addDoc(projectsRef, {
          ...projectData,
          order: minOrder - 10,
          userId: user.uid
        });
      }
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error("Error saving project doc:", err);
      alert("Failed to save project. Make sure you have authorized access: " + err.message);
    }
  };

  // Reorder project position via Drag and Drop
  const handleReorderProjects = async (draggedIdx, targetIdx, currentList) => {
    if (draggedIdx === targetIdx) return;

    const reorderedList = [...currentList];
    const [movedProject] = reorderedList.splice(draggedIdx, 1);
    reorderedList.splice(targetIdx, 0, movedProject);

    try {
      let newOrder;
      if (reorderedList.length === 1) return;

      const getSafeOrder = (proj, fallbackIndex) => {
        if (proj && proj.order !== undefined) return proj.order;
        return fallbackIndex * 10;
      };

      if (targetIdx === 0) {
        const nextOrder = getSafeOrder(reorderedList[1], 1);
        newOrder = nextOrder - 10;
      } else if (targetIdx === reorderedList.length - 1) {
        const prevOrder = getSafeOrder(reorderedList[reorderedList.length - 2], reorderedList.length - 2);
        newOrder = prevOrder + 10;
      } else {
        const prevOrder = getSafeOrder(reorderedList[targetIdx - 1], targetIdx - 1);
        const nextOrder = getSafeOrder(reorderedList[targetIdx + 1], targetIdx + 1);
        newOrder = (prevOrder + nextOrder) / 2;

        if (Math.abs(newOrder - prevOrder) < 0.01) {
          newOrder = prevOrder + 0.1;
        }
      }

      const projRef = doc(db, 'projects', movedProject.id);
      await updateDoc(projRef, {
        order: newOrder,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error reordering projects:", err);
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handlePromptMasterKeySubmit = (e) => {
    e.preventDefault();
    if (tempKeyInput.trim()) {
      setMasterKey(tempKeyInput.trim());
      setTempKeyInput('');
      setIsKeyPromptOpen(false);
    }
  };

  // Render guards
  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Loading Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => { }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-905/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">AgencyTracker</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Project Ledger</p>
            </div>
          </div>

          {/* Premium Navigation Tabs from Screenshot */}
          <nav className="flex items-center bg-[#0d1527] border border-slate-900/60 p-1.5 rounded-xl space-x-1 shadow-inner">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('projects');
              }}
              className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>All Projects</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Master Key Input Console */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <form onSubmit={handleMasterKeySubmit} className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-brand-500/50 transition-all max-w-[280px] w-full">
              <Key className={`w-4 h-4 mr-2 ${masterKey ? 'text-emerald-400' : 'text-slate-500'}`} />
              <input
                type="password"
                placeholder={masterKey ? "Master Key Configured" : "Enter Master Key"}
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                disabled={!!masterKey}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full focus:ring-0 focus:border-none focus:outline-none"
              />
              {masterKey ? (
                <button
                  type="button"
                  onClick={handleClearMasterKey}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider ml-2 cursor-pointer"
                >
                  Lock
                </button>
              ) : (
                <button
                  type="submit"
                  className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold uppercase tracking-wider ml-2 cursor-pointer"
                >
                  Apply
                </button>
              )}
            </form>

            {masterKey && (
              <button
                type="button"
                onClick={() => setIsMigrateKeyOpen(true)}
                className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-brand-400 font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider whitespace-nowrap"
              >
                Change Key
              </button>
            )}

            {/* Shield Indicator */}
            <div className="flex-shrink-0" title={masterKey ? "Master Key is active. Passwords will decrypt dynamically." : "Master Key is locked. Sensitive credentials cannot be viewed."}>
              {masterKey ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 mt-8 space-y-8">
        {dbError && (
          <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 text-sm rounded-2xl flex items-start space-x-3 shadow-lg">
            <span className="font-semibold flex-shrink-0 text-red-400 text-lg">⚠️</span>
            <div className="flex-grow">
              <strong className="block font-bold mb-0.5 text-white">Database Sync Connection Refused:</strong>
              <p className="text-xs text-red-300/80 leading-relaxed">
                {dbError}. Please verify that your Cloud Firestore Security Rules permit reading/writing to the <code className="font-mono bg-slate-950 px-1 py-0.2 rounded border border-red-900/30">projects</code> collection.
              </p>
            </div>
          </div>
        )}

        {/* Tab Selection Content */}
        {activeTab === 'dashboard' && (
          <Dashboard
            projects={projects}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              setActiveTab('projects');
              setIsFormOpen(false);
            }}
            onCreateProject={() => {
              setEditingProject(null);
              setIsFormOpen(true);
              setActiveTab('projects');
            }}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            editingProject={editingProject}
            setEditingProject={setEditingProject}
            masterKey={masterKey}
            onPromptMasterKey={() => setIsKeyPromptOpen(true)}
            onSaveProject={handleSaveProject}
            onReorderProjects={handleReorderProjects}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            projects={projects}
            masterKey={masterKey}
            onSetMasterKey={(key) => setMasterKey(key)}
            onChangeMasterKeyClick={() => setIsMigrateKeyOpen(true)}
          />
        )}
      </main>

      {/* Key Migration Modal */}
      {isMigrateKeyOpen && (
        <ChangeMasterKeyModal
          projects={projects}
          currentMasterKey={masterKey}
          onKeyMigrated={(newKey) => setMasterKey(newKey)}
          onClose={() => setIsMigrateKeyOpen(false)}
        />
      )}

      {/* Global Master Key Setup Prompt Modal */}
      {isKeyPromptOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <form
            onSubmit={handlePromptMasterKeySubmit}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6"
          >
            <button
              type="button"
              onClick={() => {
                setIsKeyPromptOpen(false);
                setTempKeyInput('');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-brand-400">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">Enter Master Decryption Key</h3>
                <p className="text-xs text-slate-500">Required to view or encrypt credentials</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              This key is held strictly in volatile browser memory and is never sent to Firestore or stored on disk. If correct, all encrypted credentials will unlock.
            </p>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Master Key Phrase</label>
              <input
                type="password"
                required
                autoFocus
                placeholder="e.g., custom-agency-vault-phrase"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsKeyPromptOpen(false);
                  setTempKeyInput('');
                }}
                className="w-1/2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-brand-500/10 cursor-pointer"
              >
                Unlock Dashboard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
