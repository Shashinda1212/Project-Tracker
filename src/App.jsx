import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './services/firebase';
import FirebaseConfigWarning from './components/FirebaseConfigWarning';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import ChangeMasterKeyModal from './components/ChangeMasterKeyModal';
import { Key, ShieldAlert, X } from 'lucide-react';

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
        const projectsRef = collection(db, 'projects');
        await addDoc(projectsRef, {
          ...projectData,
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
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Active Form Mode */}
      {isFormOpen ? (
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <ProjectForm
            project={editingProject}
            onSubmit={handleSaveProject}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingProject(null);
            }}
            masterKey={masterKey}
            onPromptMasterKey={() => setIsKeyPromptOpen(true)}
          />
        </div>
      ) : (
        <Dashboard
          projects={projects}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onCreateProject={() => {
            setEditingProject(null);
            setIsFormOpen(true);
          }}
          onLogout={handleLogout}
          masterKey={masterKey}
          onSetMasterKey={(key) => setMasterKey(key)}
          dbError={dbError}
          onChangeMasterKeyClick={() => setIsMigrateKeyOpen(true)}
        />
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onEdit={(proj) => {
            setSelectedProject(null);
            handleEditClick(proj);
          }}
          onClose={() => setSelectedProject(null)}
          masterKey={masterKey}
          onPromptMasterKey={() => setIsKeyPromptOpen(true)}
        />
      )}

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
