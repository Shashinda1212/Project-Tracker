import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Key, Globe, Server, Mail, Save, X, Sparkles, FolderKanban } from 'lucide-react';
import { encryptPassword, decryptPassword } from '../services/crypto';
import DatePicker from './DatePicker';

export default function ProjectForm({ project, onSubmit, onCancel, masterKey, onPromptMasterKey }) {
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    contactName: '',
    startDate: '',
    deliveryDate: '',
    notes: '',
    status: 'ongoing',
    category: 'web',
    webType: 'coding',
    themeName: '',
    themeCost: 0,
    fullValue: 0,
    advancePayment: 0,
    domainPlatform: { platformName: '', username: '', password: '', email: '', cost: '' },
    hostingPlatform: { type: 'shared', provider: '', username: '', password: '', email: '', cost: '' },
    gmail: { email: '', password: '' }
  });

  // Track WordPress plugins locally in form state
  const [pluginsList, setPluginsList] = useState([]);
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginCost, setNewPluginCost] = useState(0);

  // Track payments list
  const [paymentsList, setPaymentsList] = useState([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentDesc, setNewPaymentDesc] = useState('');

  // Track original ciphertexts for passwords so we don't lose them if they are not decrypted
  const [originalCiphers, setOriginalCiphers] = useState({
    domain: '',
    hosting: '',
    gmail: ''
  });

  // Decrypted states or placeholders
  const [decryptedState, setDecryptedState] = useState({
    domain: { unlocked: false, value: '' },
    hosting: { unlocked: false, value: '' },
    gmail: { unlocked: false, value: '' }
  });

  // Load project data if editing
  useEffect(() => {
    if (project) {
      const pData = {
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        contactName: project.contactName || '',
        startDate: project.startDate || '',
        deliveryDate: project.deliveryDate || '',
        notes: project.notes || '',
        status: project.status || 'ongoing',
        category: project.category || 'web',
        webType: project.webType || 'coding',
        themeName: project.themeName || '',
        themeCost: project.themeCost || 0,
        fullValue: project.fullValue || 0,
        advancePayment: project.advancePayment || 0,
        domainPlatform: {
          platformName: project.domainPlatform?.platformName || '',
          username: project.domainPlatform?.username || '',
          password: '',
          email: project.domainPlatform?.email || '',
          cost: project.domainPlatform?.cost || 0
        },
        hostingPlatform: {
          type: project.hostingPlatform?.type || 'shared',
          provider: project.hostingPlatform?.provider || '',
          username: project.hostingPlatform?.username || '',
          password: '',
          email: project.hostingPlatform?.email || '',
          cost: project.hostingPlatform?.cost || 0
        },
        gmail: {
          email: project.gmail?.email || '',
          password: ''
        }
      };

      setFormData(pData);
      setPluginsList(project.pluginsUsed || []);
      setPaymentsList(project.paymentsList || []);

      // Keep reference of original encrypted values
      const ciphers = {
        domain: project.domainPlatform?.password || '',
        hosting: project.hostingPlatform?.password || '',
        gmail: project.gmail?.password || ''
      };
      setOriginalCiphers(ciphers);

      // Attempt immediate decryption if master key exists
      attemptDecryption(ciphers, masterKey);
    } else {
      // Clear forms for new project
      setFormData({
        projectName: '',
        clientName: '',
        contactName: '',
        startDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        notes: '',
        status: 'ongoing',
        category: 'web',
        webType: 'coding',
        themeName: '',
        themeCost: 0,
        fullValue: '',
        advancePayment: '',
        domainPlatform: { platformName: '', username: '', password: '', email: '', cost: '' },
        hostingPlatform: { type: 'shared', provider: '', username: '', password: '', email: '', cost: '' },
        gmail: { email: '', password: '' }
      });
      setPluginsList([]);
      setPaymentsList([]);
      setOriginalCiphers({ domain: '', hosting: '', gmail: '' });
      setDecryptedState({
        domain: { unlocked: true, value: '' },
        hosting: { unlocked: true, value: '' },
        gmail: { unlocked: true, value: '' }
      });
    }
  }, [project, masterKey]);

  // Attempt to decrypt original passwords when master key changes or is input
  const attemptDecryption = (ciphers, mKey) => {
    if (!mKey) {
      setDecryptedState({
        domain: { unlocked: false, value: '' },
        hosting: { unlocked: false, value: '' },
        gmail: { unlocked: false, value: '' }
      });
      return;
    }

    const nextState = { ...decryptedState };

    // Decrypt Domain
    if (ciphers.domain) {
      try {
        const dec = decryptPassword(ciphers.domain, mKey);
        nextState.domain = { unlocked: true, value: dec };
        setFormData(prev => ({
          ...prev,
          domainPlatform: { ...prev.domainPlatform, password: dec }
        }));
      } catch (err) {
        nextState.domain = { unlocked: false, value: '' };
      }
    } else {
      nextState.domain = { unlocked: true, value: '' };
    }

    // Decrypt Hosting
    if (ciphers.hosting) {
      try {
        const dec = decryptPassword(ciphers.hosting, mKey);
        nextState.hosting = { unlocked: true, value: dec };
        setFormData(prev => ({
          ...prev,
          hostingPlatform: { ...prev.hostingPlatform, password: dec }
        }));
      } catch (err) {
        nextState.hosting = { unlocked: false, value: '' };
      }
    } else {
      nextState.hosting = { unlocked: true, value: '' };
    }

    // Decrypt Gmail
    if (ciphers.gmail) {
      try {
        const dec = decryptPassword(ciphers.gmail, mKey);
        nextState.gmail = { unlocked: true, value: dec };
        setFormData(prev => ({
          ...prev,
          gmail: { ...prev.gmail, password: dec }
        }));
      } catch (err) {
        nextState.gmail = { unlocked: false, value: '' };
      }
    } else {
      nextState.gmail = { unlocked: true, value: '' };
    }

    setDecryptedState(nextState);
  };

  // Handle standard input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle nested credential input changes
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // If changing password manually, mark as unlocked and track new plain value
    if (field === 'password') {
      setDecryptedState(prev => ({
        ...prev,
        [section === 'domainPlatform' ? 'domain' : section === 'hostingPlatform' ? 'hosting' : 'gmail']: {
          unlocked: true,
          value: value
        }
      }));
    }
  };

  // WordPress Dynamic Plugins
  const addPlugin = () => {
    if (!newPluginName.trim()) return;
    const newPlugin = {
      id: Date.now().toString(),
      name: newPluginName.trim(),
      cost: parseFloat(newPluginCost) || 0
    };
    setPluginsList([...pluginsList, newPlugin]);
    setNewPluginName('');
    setNewPluginCost(0);
  };

  const removePlugin = (id) => {
    setPluginsList(pluginsList.filter(p => p.id !== id));
  };

  // Payment Tracking Log
  const addPayment = () => {
    const amt = parseFloat(newPaymentAmount);
    if (!amt || amt <= 0) return;
    const newPayment = {
      id: Date.now().toString(),
      date: newPaymentDate,
      amount: amt,
      description: newPaymentDesc.trim() || 'Milestone Payment'
    };
    setPaymentsList([...paymentsList, newPayment]);
    setNewPaymentAmount('');
    setNewPaymentDesc('');
  };

  const removePayment = (id) => {
    setPaymentsList(paymentsList.filter(p => p.id !== id));
  };

  // Financial aggregates
  const fullVal = parseFloat(formData.fullValue) || 0;
  const advPay = parseFloat(formData.advancePayment) || 0;
  const otherPaymentsTotal = paymentsList.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = advPay + otherPaymentsTotal;
  const dueAmount = fullVal - totalPaid;

  // Plugins total cost
  const pluginsTotalCost = pluginsList.reduce((sum, p) => sum + p.cost, 0);

  // Expense and Profit calculations
  const domainCost = parseFloat(formData.domainPlatform.cost) || 0;
  const hostingCost = parseFloat(formData.hostingPlatform.cost) || 0;
  const themeCost = parseFloat(formData.themeCost) || 0;
  const totalExpenses = domainCost + hostingCost + themeCost + pluginsTotalCost;
  const netProfit = fullVal - totalExpenses;

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Verification check: if passwords have been typed or are unlocked, we need a Master Key.
    // Otherwise, we write back original ciphers.
    const requiresEncryptionKey =
      (formData.domainPlatform.password && decryptedState.domain.unlocked) ||
      (formData.hostingPlatform.password && decryptedState.hosting.unlocked) ||
      (formData.gmail.password && decryptedState.gmail.unlocked);

    if (requiresEncryptionKey && !masterKey) {
      alert("Master Key is required to encrypt passwords before saving. Please enter the Master Key in the prompt.");
      if (onPromptMasterKey) onPromptMasterKey();
      return;
    }

    try {
      // Encrypt sensitive passwords if they were unlocked/modified.
      // If still locked, we save the original cipher string to avoid overwriting with blank/asterisks.
      const domainPass = decryptedState.domain.unlocked
        ? (formData.domainPlatform.password ? encryptPassword(formData.domainPlatform.password, masterKey) : '')
        : originalCiphers.domain;

      const hostingPass = decryptedState.hosting.unlocked
        ? (formData.hostingPlatform.password ? encryptPassword(formData.hostingPlatform.password, masterKey) : '')
        : originalCiphers.hosting;

      const gmailPass = decryptedState.gmail.unlocked
        ? (formData.gmail.password ? encryptPassword(formData.gmail.password, masterKey) : '')
        : originalCiphers.gmail;

      const finalProjectData = {
        ...formData,
        fullValue: parseFloat(formData.fullValue) || 0,
        advancePayment: parseFloat(formData.advancePayment) || 0,
        themeCost: parseFloat(formData.themeCost) || 0,
        pluginsUsed: pluginsList,
        paymentsList: paymentsList,
        domainPlatform: {
          ...formData.domainPlatform,
          cost: parseFloat(formData.domainPlatform.cost) || 0,
          password: domainPass
        },
        hostingPlatform: {
          ...formData.hostingPlatform,
          cost: parseFloat(formData.hostingPlatform.cost) || 0,
          password: hostingPass
        },
        gmail: {
          ...formData.gmail,
          password: gmailPass
        },
        updatedAt: new Date().toISOString()
      };

      if (!project) {
        finalProjectData.createdAt = new Date().toISOString();
      }

      onSubmit(finalProjectData);
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{project ? 'Edit Project Details' : 'Create New Project'}</h2>
            <p className="text-xs text-slate-400">Fill in project specs, credentials, and financial logs</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Encryption Warning Banner */}
      {!masterKey && (
        <div className="p-4 bg-amber-950/40 border border-amber-900/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-200 text-sm">
            <Key className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Master Key Required:</strong> Passwords will be saved as plain text if no Master Key is set. Enter a Master Key now to encrypt credentials.
            </span>
          </div>
          <button
            type="button"
            onClick={onPromptMasterKey}
            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            Set Master Key
          </button>
        </div>
      )}

      {/* Grid Layout for General Information */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-brand-400">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Project Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="projectName"
              required
              placeholder="e.g., Enterprise E-Commerce Redesign"
              value={formData.projectName}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Client Name</label>
            <input
              type="text"
              name="clientName"
              placeholder="e.g., Acme Corporation"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Contact Person Name</label>
            <input
              type="text"
              name="contactName"
              placeholder="e.g., John Doe"
              value={formData.contactName}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10 placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Start Date</label>
              <DatePicker
                value={formData.startDate}
                onChange={(dateStr) => setFormData(prev => ({ ...prev, startDate: dateStr }))}
                placeholder="Select Start Date"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Delivery Target</label>
              <DatePicker
                value={formData.deliveryDate}
                onChange={(dateStr) => setFormData(prev => ({ ...prev, deliveryDate: dateStr }))}
                placeholder="Select Target Date"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Project Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10"
            >
              <option value="web">Web Project</option>
              <option value="pos">POS System</option>
              <option value="other">Other Software</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Project Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10"
            >
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Web-Specific Configurations */}
      {formData.category === 'web' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-2 text-brand-400">
            <Globe className="w-5 h-5" />
            <h3 className="text-sm font-semibold tracking-wider uppercase">Web Project Setup</h3>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Platform Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="radio"
                    name="webType"
                    value="coding"
                    checked={formData.webType === 'coding'}
                    onChange={handleChange}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span>Coding (Custom Dev)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="radio"
                    name="webType"
                    value="wordpress"
                    checked={formData.webType === 'wordpress'}
                    onChange={handleChange}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span>WordPress CMS</span>
                </label>
              </div>
            </div>

            {formData.webType === 'wordpress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-900 animate-slideDown">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Theme Name</label>
                  <input
                    type="text"
                    name="themeName"
                    placeholder="e.g., Divi, Astra Pro"
                    value={formData.themeName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10 placeholder-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Theme Cost (LKR)</label>
                  <input
                    type="number"
                    name="themeCost"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.themeCost || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10"
                  />
                </div>

                {/* Plugins dynamic manager */}
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-xs font-semibold text-slate-400">WordPress Plugins & Costs</label>
                  
                  {/* Plugin list display */}
                  {pluginsList.length > 0 ? (
                    <div className="space-y-2 bg-slate-900 border border-slate-800/60 rounded-xl p-4">
                      {pluginsList.map((plugin) => (
                        <div key={plugin.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm">
                          <span className="font-medium text-slate-200">{plugin.name}</span>
                          <div className="flex items-center space-x-3 text-slate-400">
                            <span className="text-emerald-400 font-semibold">LKR {plugin.cost.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => removePlugin(plugin.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold text-slate-400 pt-2 border-t border-slate-800">
                        <span>Total Plugins ({pluginsList.length})</span>
                        <span className="text-emerald-400">LKR {pluginsTotalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-800">No plugins logged for this setup yet.</p>
                  )}

                  {/* Add plugin controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Plugin Name (e.g. Elementor Pro)"
                      value={newPluginName}
                      onChange={(e) => setNewPluginName(e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-[10px] font-semibold">LKR</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={newPluginCost || ''}
                          onChange={(e) => setNewPluginCost(parseFloat(e.target.value) || 0)}
                          className="w-28 bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addPlugin}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Plugin</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <hr className="border-slate-800" />
        </div>
      )}

      {/* Credentials Area (Encrypted fields) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-brand-400">
            <Key className="w-5 h-5" />
            <h3 className="text-sm font-semibold tracking-wider uppercase">Secure Credentials</h3>
          </div>
          <span className="text-[10px] bg-brand-500/10 border border-brand-500/20 text-brand-400 py-1 px-2.5 rounded-full uppercase tracking-wider font-semibold">
            🔒 Client-Side AES-256
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Domain Platform Info */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Domain Platform</span>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Platform Name</label>
              <input
                type="text"
                placeholder="e.g., Namecheap, GoDaddy"
                value={formData.domainPlatform.platformName}
                onChange={(e) => handleNestedChange('domainPlatform', 'platformName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Username/ID</label>
              <input
                type="text"
                placeholder="Platform Username"
                value={formData.domainPlatform.username}
                onChange={(e) => handleNestedChange('domainPlatform', 'username', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Registered Email</label>
              <input
                type="email"
                placeholder="account@email.com"
                value={formData.domainPlatform.email}
                onChange={(e) => handleNestedChange('domainPlatform', 'email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Password</label>
              {decryptedState.domain.unlocked ? (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.domainPlatform.password}
                  onChange={(e) => handleNestedChange('domainPlatform', 'password', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 font-semibold justify-between">
                  <span>[Encrypted Password]</span>
                  <button
                    type="button"
                    onClick={onPromptMasterKey}
                    className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 py-1 px-2 rounded hover:bg-amber-500/20 cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Domain Cost (LKR)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.domainPlatform.cost}
                onChange={(e) => handleNestedChange('domainPlatform', 'cost', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
          </div>

          {/* Hosting Platform Info */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Hosting Platform</span>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hosting Provider</label>
              <input
                type="text"
                placeholder="e.g., Hostinger, GoDaddy, AWS"
                value={formData.hostingPlatform.provider}
                onChange={(e) => handleNestedChange('hostingPlatform', 'provider', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hosting Type</label>
              <select
                value={formData.hostingPlatform.type}
                onChange={(e) => handleNestedChange('hostingPlatform', 'type', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              >
                <option value="shared">Shared Hosting</option>
                <option value="vps">VPS Hosting</option>
                <option value="firebase">Firebase Hosting</option>
                <option value="supabase">Supabase Hosting</option>
                <option value="vercel">Vercel</option>
                <option value="other">Other Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Username/ID</label>
              <input
                type="text"
                placeholder="Platform Username"
                value={formData.hostingPlatform.username}
                onChange={(e) => handleNestedChange('hostingPlatform', 'username', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Registered Email</label>
              <input
                type="email"
                placeholder="account@email.com"
                value={formData.hostingPlatform.email}
                onChange={(e) => handleNestedChange('hostingPlatform', 'email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Password</label>
              {decryptedState.hosting.unlocked ? (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.hostingPlatform.password}
                  onChange={(e) => handleNestedChange('hostingPlatform', 'password', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 font-semibold justify-between">
                  <span>[Encrypted Password]</span>
                  <button
                    type="button"
                    onClick={onPromptMasterKey}
                    className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 py-1 px-2 rounded hover:bg-amber-500/20 cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hosting Cost (LKR)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.hostingPlatform.cost}
                onChange={(e) => handleNestedChange('hostingPlatform', 'cost', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
          </div>

          {/* Gmail Credentials */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
              <Mail className="w-4 h-4 text-violet-400" />
              <span>Project Gmail</span>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Gmail Address</label>
              <input
                type="email"
                placeholder="project.custom@gmail.com"
                value={formData.gmail.email}
                onChange={(e) => handleNestedChange('gmail', 'email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Gmail Password</label>
              {decryptedState.gmail.unlocked ? (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.gmail.password}
                  onChange={(e) => handleNestedChange('gmail', 'password', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 font-semibold justify-between">
                  <span>[Encrypted Password]</span>
                  <button
                    type="button"
                    onClick={onPromptMasterKey}
                    className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 py-1 px-2 rounded hover:bg-amber-500/20 cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Financials & Payments Tracking */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-brand-400">
          <DollarSign className="w-5 h-5" />
          <h3 className="text-sm font-semibold tracking-wider uppercase">Financials & Payments</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 font-medium">Full Project Value (LKR)</label>
            <input
              type="number"
              name="fullValue"
              step="0.01"
              placeholder="0.00"
              value={formData.fullValue}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 font-medium">Advance Payment (LKR)</label>
            <input
              type="number"
              name="advancePayment"
              step="0.01"
              placeholder="0.00"
              value={formData.advancePayment}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 font-medium">Outstanding Balance</label>
            <div className={`w-full bg-slate-950 border rounded-xl py-3 px-4 font-bold text-lg select-none flex items-center ${dueAmount > 0 ? 'border-amber-900/60 text-amber-400' : dueAmount === 0 && fullVal > 0 ? 'border-emerald-900/60 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
              LKR {dueAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Live Profitability Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-xs font-semibold text-slate-300">Live Profitability Summary</span>
            <span className="text-[10px] text-slate-500 font-medium">Auto-calculated from inputs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Total Revenue</span>
              <span className="text-sm font-bold text-white">LKR {fullVal.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Total Expenses</span>
              <span className="text-sm font-bold text-red-400">LKR {totalExpenses.toFixed(2)}</span>
            </div>
            <div className={`border p-3 rounded-lg ${netProfit >= 0 ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-red-950/10 border-red-900/30'}`}>
              <span className="text-[10px] text-slate-500 block">Estimated Net Profit</span>
              <span className={`text-sm font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                LKR {netProfit.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
            <div>
              <span className="text-slate-500">Domain Cost:</span> LKR {domainCost.toFixed(2)}
            </div>
            <div>
              <span className="text-slate-500">Hosting Cost:</span> LKR {hostingCost.toFixed(2)}
            </div>
            {formData.webType === 'wordpress' && (
              <>
                <div>
                  <span className="text-slate-500">Theme Cost:</span> LKR {themeCost.toFixed(2)}
                </div>
                <div>
                  <span className="text-slate-500">Plugins Cost:</span> LKR {pluginsTotalCost.toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detailed Payments Log */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-300">Detailed Payments Ledger</label>
          
          {paymentsList.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {paymentsList.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800/80 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{payment.description}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {payment.date}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-emerald-400 font-bold">LKR {payment.amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removePayment(payment.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-900/40 p-4 rounded-xl border border-dashed border-slate-800">No additional payments logged. Add entries below as payments are received.</p>
          )}

          {/* Add Payment controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-900">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Description (e.g. Midway Delivery)"
                value={newPaymentDesc}
                onChange={(e) => setNewPaymentDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs"
              />
            </div>
            <div className="sm:col-span-3">
              <DatePicker
                value={newPaymentDate}
                onChange={(dateStr) => setNewPaymentDate(dateStr)}
                placeholder="Pay Date"
                dense={true}
              />
            </div>
            <div className="sm:col-span-2 relative">
              <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-500 text-[10px] font-semibold">LKR</span>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-white text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={addPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Log Pay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Additional Notes */}
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-400">Additional Project Notes & Directives</label>
        <textarea
          name="notes"
          rows="4"
          placeholder="Enter specifications, scope additions, custom features requested, server SSH configurations, client quirks etc."
          value={formData.notes}
          onChange={handleChange}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-brand-500 focus:ring-brand-500/10 placeholder-slate-600 text-sm font-normal"
        />
      </div>

      {/* Save / Cancel Controls */}
      <div className="flex items-center justify-end space-x-4 border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl transition-all duration-200 cursor-pointer text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-brand-500/20 transition-all duration-200 flex items-center space-x-2 cursor-pointer text-sm"
        >
          <Save className="w-4 h-4" />
          <span>{project ? 'Save Changes' : 'Create Project'}</span>
        </button>
      </div>
    </form>
  );
}
