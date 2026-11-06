import React, { useState, useMemo } from 'react';
import {
  DissolutionFormData,
  StockholderDirector,
  defaultDragonPuffData,
} from '../types/dissolution';
import {
  extractKnownPersons,
  findPersonByName,
  syncPersonAcrossAllRoles,
  PersonProfile,
} from '../utils/personAutofill';
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  Newspaper,
  Scale,
  Settings,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  Copy,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface FormEditorProps {
  formData: DissolutionFormData;
  onChange: (updated: DissolutionFormData) => void;
  onResetSample: () => void;
  onClear: () => void;
}

type TabType =
  | 'company'
  | 'officers'
  | 'stockholders'
  | 'meeting'
  | 'publication'
  | 'notary'
  | 'settings';

export const FormEditor: React.FC<FormEditorProps> = ({
  formData,
  onChange,
  onResetSample,
  onClear,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);

  // Extract known persons across all fields in the document
  const knownPersons = useMemo(() => extractKnownPersons(formData), [formData]);

  const triggerAutofillNotice = (msg: string) => {
    setAutofillNotice(msg);
    setTimeout(() => setAutofillNotice(null), 4000);
  };

  const handleFieldChange = (field: keyof DissolutionFormData, value: any) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  // -------------------------------------------------------------
  // Smart Autofill when a Name is typed or changed
  // -------------------------------------------------------------
  const handleNameChangeWithAutofill = (
    roleKey: 'corporateSecretary' | 'president' | 'treasurer' | 'authorizedRep',
    newName: string
  ) => {
    const updated = { ...formData };

    if (roleKey === 'corporateSecretary') updated.corporateSecretaryName = newName;
    else if (roleKey === 'president') updated.presidentName = newName;
    else if (roleKey === 'treasurer') updated.treasurerName = newName;
    else if (roleKey === 'authorizedRep') updated.authorizedRepName = newName;

    if (!newName || !newName.trim()) {
      onChange(updated);
      return;
    }

    // Check if this person already has known details encoded elsewhere
    const existing = findPersonByName(newName, formData);
    if (existing) {
      let filledFields: string[] = [];

      if (roleKey === 'corporateSecretary') {
        if (existing.nationality) updated.corporateSecretaryNationality = existing.nationality;
        if (existing.address) { updated.corporateSecretaryAddress = existing.address; filledFields.push('Address'); }
        if (existing.tin) { updated.corporateSecretaryTin = existing.tin; filledFields.push('TIN'); }
        if (existing.governmentId) { updated.corporateSecretaryId = existing.governmentId; filledFields.push('Gov ID'); }
      } else if (roleKey === 'president') {
        if (existing.nationality) updated.presidentNationality = existing.nationality;
        if (existing.address) { updated.presidentAddress = existing.address; filledFields.push('Address'); }
        if (existing.tin) { updated.presidentTin = existing.tin; filledFields.push('TIN'); }
        if (existing.governmentId) { updated.presidentId = existing.governmentId; filledFields.push('Gov ID'); }
      } else if (roleKey === 'treasurer') {
        if (existing.nationality) updated.treasurerNationality = existing.nationality;
        if (existing.address) { updated.treasurerAddress = existing.address; filledFields.push('Address'); }
        if (existing.tin) { updated.treasurerTin = existing.tin; filledFields.push('TIN'); }
        if (existing.governmentId) { updated.treasurerId = existing.governmentId; filledFields.push('Gov ID'); }
      } else if (roleKey === 'authorizedRep') {
        if (existing.address) { updated.authorizedRepAddress = existing.address; filledFields.push('Address'); }
      }

      if (filledFields.length > 0) {
        triggerAutofillNotice(`⚡ Autofilled ${filledFields.join(', ')} for "${newName}" from known records!`);
      }
    }

    onChange(updated);
  };

  // Sync details if user updates TIN or Address of a person whose name appears multiple times
  const handleDetailChangeWithSync = (
    roleKey: 'corporateSecretary' | 'president' | 'treasurer',
    detailKey: 'tin' | 'address' | 'id' | 'nationality',
    value: string
  ) => {
    let personName = '';
    if (roleKey === 'corporateSecretary') personName = formData.corporateSecretaryName;
    else if (roleKey === 'president') personName = formData.presidentName;
    else if (roleKey === 'treasurer') personName = formData.treasurerName;

    if (formData.autoSyncMatchingNames !== false && personName && personName.trim()) {
      const payload: any = {};
      if (detailKey === 'tin') payload.tin = value;
      else if (detailKey === 'address') payload.address = value;
      else if (detailKey === 'id') payload.governmentId = value;
      else if (detailKey === 'nationality') payload.nationality = value;

      const synced = syncPersonAcrossAllRoles(formData, personName, payload);
      onChange(synced);
    } else {
      const fieldMap: Record<string, keyof DissolutionFormData> = {
        'corporateSecretary-tin': 'corporateSecretaryTin',
        'corporateSecretary-address': 'corporateSecretaryAddress',
        'corporateSecretary-id': 'corporateSecretaryId',
        'corporateSecretary-nationality': 'corporateSecretaryNationality',
        'president-tin': 'presidentTin',
        'president-address': 'presidentAddress',
        'president-id': 'presidentId',
        'president-nationality': 'presidentNationality',
        'treasurer-tin': 'treasurerTin',
        'treasurer-address': 'treasurerAddress',
        'treasurer-id': 'treasurerId',
        'treasurer-nationality': 'treasurerNationality',
      };
      const directKey = fieldMap[`${roleKey}-${detailKey}`];
      if (directKey) {
        handleFieldChange(directKey, value);
      }
    }
  };

  // Select a person from known profiles for a specific role
  const handleSelectPersonForRole = (
    roleKey: 'corporateSecretary' | 'president' | 'treasurer' | 'authorizedRep',
    person: PersonProfile
  ) => {
    const updated = { ...formData };
    if (roleKey === 'corporateSecretary') {
      updated.corporateSecretaryName = person.name;
      if (person.nationality) updated.corporateSecretaryNationality = person.nationality;
      if (person.address) updated.corporateSecretaryAddress = person.address;
      if (person.tin) updated.corporateSecretaryTin = person.tin;
      if (person.governmentId) updated.corporateSecretaryId = person.governmentId;
    } else if (roleKey === 'president') {
      updated.presidentName = person.name;
      if (person.nationality) updated.presidentNationality = person.nationality;
      if (person.address) updated.presidentAddress = person.address;
      if (person.tin) updated.presidentTin = person.tin;
      if (person.governmentId) updated.presidentId = person.governmentId;
    } else if (roleKey === 'treasurer') {
      updated.treasurerName = person.name;
      if (person.nationality) updated.treasurerNationality = person.nationality;
      if (person.address) updated.treasurerAddress = person.address;
      if (person.tin) updated.treasurerTin = person.tin;
      if (person.governmentId) updated.treasurerId = person.governmentId;
    } else if (roleKey === 'authorizedRep') {
      updated.authorizedRepName = person.name;
      if (person.address) updated.authorizedRepAddress = person.address;
    }
    triggerAutofillNotice(`⚡ Populated all details for "${person.name}"!`);
    onChange(updated);
  };

  // -------------------------------------------------------------
  // Stockholders handling with Autofill
  // -------------------------------------------------------------
  const handleAddStockholder = () => {
    const newStockholder: StockholderDirector = {
      id: Date.now().toString(),
      name: '',
      tin: '',
      shares: '10,000',
      sharePercentage: '10%',
      directorRole: 'Member',
      vote: 'Yes',
      address: '',
      governmentId: '',
    };
    onChange({
      ...formData,
      stockholders: [...formData.stockholders, newStockholder],
    });
  };

  const handleStockholderNameChange = (index: number, newName: string) => {
    let updated = [...formData.stockholders];
    let member = { ...updated[index], name: newName };

    if (newName && newName.trim()) {
      const existing = findPersonByName(newName, formData);
      if (existing) {
        if (!member.tin && existing.tin) member.tin = existing.tin;
        if (!member.address && existing.address) member.address = existing.address;
        if (!member.governmentId && existing.governmentId) member.governmentId = existing.governmentId;
        triggerAutofillNotice(`⚡ Autofilled TIN (${existing.tin || 'N/A'}) for stockholder "${newName}"!`);
      }
    }

    updated[index] = member;
    onChange({
      ...formData,
      stockholders: updated,
    });
  };

  const handleSelectPersonForStockholder = (index: number, person: PersonProfile) => {
    const updated = [...formData.stockholders];
    updated[index] = {
      ...updated[index],
      name: person.name,
      tin: person.tin || updated[index].tin,
      address: person.address || updated[index].address,
      governmentId: person.governmentId || updated[index].governmentId,
    };
    triggerAutofillNotice(`⚡ Populated "${person.name}" into stockholder table!`);
    onChange({
      ...formData,
      stockholders: updated,
    });
  };

  const handleUpdateStockholder = (index: number, key: keyof StockholderDirector, val: string) => {
    const updated = [...formData.stockholders];
    const memberName = updated[index].name;
    updated[index] = { ...updated[index], [key]: val };

    if (key === 'tin' && formData.autoSyncMatchingNames !== false && memberName && memberName.trim()) {
      const synced = syncPersonAcrossAllRoles(
        { ...formData, stockholders: updated },
        memberName,
        { tin: val }
      );
      onChange(synced);
    } else {
      onChange({
        ...formData,
        stockholders: updated,
      });
    }
  };

  const handleRemoveStockholder = (index: number) => {
    const updated = formData.stockholders.filter((_, i) => i !== index);
    onChange({
      ...formData,
      stockholders: updated,
    });
  };

  // Re-sync all duplicate names in one click
  const handleSyncAllKnownPersons = () => {
    let current = { ...formData };
    for (const person of knownPersons) {
      current = syncPersonAcrossAllRoles(current, person.name, {
        nationality: person.nationality,
        address: person.address,
        tin: person.tin,
        governmentId: person.governmentId,
      });
    }
    onChange(current);
    triggerAutofillNotice(`🔄 Synchronized details across all matching names!`);
  };

  // Copy helpers
  const handleCopySecToAuthRep = () => {
    onChange({
      ...formData,
      authorizedRepName: formData.corporateSecretaryName,
      authorizedRepTitle: 'Corp. Secretary / Authorized Representative',
      authorizedRepAddress: formData.principalOfficeAddress || formData.corporateSecretaryAddress,
    });
  };

  // Export JSON profile
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(formData.corporationName || 'company').replace(/\s+/g, '_')}_dissolution_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON profile
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onChange({ ...defaultDragonPuffData, ...parsed });
        setImportStatus('Loaded successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus('Invalid JSON file format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'company', label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { id: 'officers', label: 'Officers', icon: <Users className="w-4 h-4" /> },
    {
      id: 'stockholders',
      label: 'Board & Stockholders',
      icon: <UserCheck className="w-4 h-4" />,
      badge: formData.stockholders.length,
    },
    { id: 'meeting', label: 'Meeting', icon: <Calendar className="w-4 h-4" /> },
    { id: 'publication', label: 'Publication', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'notary', label: 'SEC & Notary', icon: <Scale className="w-4 h-4" /> },
    { id: 'settings', label: 'Format & Size', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Form Header Toolbar */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Dissolution Form Details
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Fills all 5 documents &bull; Auto-syncs matching names &bull; {formData.pageSize}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetSample}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Load the Dragon Puff Inc sample data from attached SEC PDFs"
          >
            <RotateCcw className="w-3 h-3 text-blue-600" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>

          <button
            onClick={handleExportJson}
            type="button"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Export profile JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Import profile JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Floating or Top Notification for Autofill */}
      {autofillNotice && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-b border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-medium">{autofillNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutofillNotice(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {importStatus && (
        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 pt-2 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-md transition-colors cursor-pointer border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* ========================================================= */}
        {/* TAB 1: COMPANY */}
        {/* ========================================================= */}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              Primary company information registered with the Philippine Securities and Exchange Commission (SEC).
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporation Name *
              </label>
              <input
                type="text"
                value={formData.corporationName}
                onChange={(e) => handleFieldChange('corporationName', e.target.value)}
                placeholder="e.g. DRAGON PUFF INC."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SEC Registration Number *
              </label>
              <input
                type="text"
                value={formData.secRegistrationNo}
                onChange={(e) => handleFieldChange('secRegistrationNo', e.target.value)}
                placeholder="e.g. 2024040146113-02"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal Office Address *
              </label>
              <textarea
                rows={3}
                value={formData.principalOfficeAddress}
                onChange={(e) => handleFieldChange('principalOfficeAddress', e.target.value)}
                placeholder="e.g. 146 Dona Soledad Avenue Corner Peru Street Betterliving Subdivision Don Bosco, Parañaque City, 1700"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                value={formData.officialEmail}
                onChange={(e) => handleFieldChange('officialEmail', e.target.value)}
                placeholder="e.g. liankimdelrosario@gmail.com"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: OFFICERS & AUTHORIZED REPRESENTATIVE */}
        {/* ========================================================= */}
        {activeTab === 'officers' && (
          <div className="space-y-6">
            {/* Quick Person Directory & Auto-Sync Header */}
            {knownPersons.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-lg border border-blue-200/70 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Encoded Persons Directory ({knownPersons.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncAllKnownPersons}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    title="Propagate details (TIN, Address, ID) for every person matching by name across all documents"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync All Matching Names
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {knownPersons.map((p) => (
                    <span
                      key={p.normalizedName}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      <strong className="text-slate-900 dark:text-white">{p.name}</strong>
                      <span className="text-[10px] text-slate-500">
                        ({p.roles.length} {p.roles.length === 1 ? 'role' : 'roles'})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Corporate Secretary */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Corporate Secretary
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Forum Shopping & Sec Cert</span>
                  {knownPersons.length > 0 && (
                    <select
                      onChange={(e) => {
                        const match = knownPersons.find((p) => p.normalizedName === e.target.value);
                        if (match) handleSelectPersonForRole('corporateSecretary', match);
                        e.target.value = '';
                      }}
                      className="text-[10px] py-0.5 px-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Autofill from person...</option>
                      {knownPersons.map((p) => (
                        <option key={p.normalizedName} value={p.normalizedName}>
                          {p.name} ({p.tin || 'No TIN'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Full Name <span className="text-blue-600 text-[10px]">(Autofills on match)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.corporateSecretaryName}
                    onChange={(e) => handleNameChangeWithAutofill('corporateSecretary', e.target.value)}
                    placeholder="Enter or paste name..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.corporateSecretaryNationality}
                    onChange={(e) => handleDetailChangeWithSync('corporateSecretary', 'nationality', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.corporateSecretaryAddress}
                  onChange={(e) => handleDetailChangeWithSync('corporateSecretary', 'address', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">TIN</label>
                  <input
                    type="text"
                    value={formData.corporateSecretaryTin}
                    onChange={(e) => handleDetailChangeWithSync('corporateSecretary', 'tin', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Govt ID / Evidence</label>
                  <input
                    type="text"
                    value={formData.corporateSecretaryId}
                    onChange={(e) => handleDetailChangeWithSync('corporateSecretary', 'id', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* President */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  President
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Signatory for Affidavit</span>
                  {knownPersons.length > 0 && (
                    <select
                      onChange={(e) => {
                        const match = knownPersons.find((p) => p.normalizedName === e.target.value);
                        if (match) handleSelectPersonForRole('president', match);
                        e.target.value = '';
                      }}
                      className="text-[10px] py-0.5 px-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Autofill from person...</option>
                      {knownPersons.map((p) => (
                        <option key={p.normalizedName} value={p.normalizedName}>
                          {p.name} ({p.tin || 'No TIN'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Full Name <span className="text-emerald-600 text-[10px]">(Autofills on match)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.presidentName}
                    onChange={(e) => handleNameChangeWithAutofill('president', e.target.value)}
                    placeholder="Enter or paste name..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.presidentNationality}
                    onChange={(e) => handleDetailChangeWithSync('president', 'nationality', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.presidentAddress}
                  onChange={(e) => handleDetailChangeWithSync('president', 'address', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">TIN</label>
                  <input
                    type="text"
                    value={formData.presidentTin}
                    onChange={(e) => handleDetailChangeWithSync('president', 'tin', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Govt ID Details</label>
                  <input
                    type="text"
                    value={formData.presidentId}
                    onChange={(e) => handleDetailChangeWithSync('president', 'id', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Treasurer */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Treasurer
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Signatory for Affidavit</span>
                  {knownPersons.length > 0 && (
                    <select
                      onChange={(e) => {
                        const match = knownPersons.find((p) => p.normalizedName === e.target.value);
                        if (match) handleSelectPersonForRole('treasurer', match);
                        e.target.value = '';
                      }}
                      className="text-[10px] py-0.5 px-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Autofill from person...</option>
                      {knownPersons.map((p) => (
                        <option key={p.normalizedName} value={p.normalizedName}>
                          {p.name} ({p.tin || 'No TIN'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Full Name <span className="text-purple-600 text-[10px]">(Autofills on match)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.treasurerName}
                    onChange={(e) => handleNameChangeWithAutofill('treasurer', e.target.value)}
                    placeholder="Enter or paste name..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.treasurerNationality}
                    onChange={(e) => handleDetailChangeWithSync('treasurer', 'nationality', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.treasurerAddress}
                  onChange={(e) => handleDetailChangeWithSync('treasurer', 'address', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">TIN</label>
                  <input
                    type="text"
                    value={formData.treasurerTin}
                    onChange={(e) => handleDetailChangeWithSync('treasurer', 'tin', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Govt ID Details</label>
                  <input
                    type="text"
                    value={formData.treasurerId}
                    onChange={(e) => handleDetailChangeWithSync('treasurer', 'id', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Authorized Representative to SEC */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Authorized Representative for SEC Filing
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySecToAuthRep}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Same as Corporate Secretary
                  </button>
                  {knownPersons.length > 0 && (
                    <select
                      onChange={(e) => {
                        const match = knownPersons.find((p) => p.normalizedName === e.target.value);
                        if (match) handleSelectPersonForRole('authorizedRep', match);
                        e.target.value = '';
                      }}
                      className="text-[10px] py-0.5 px-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Autofill person...</option>
                      {knownPersons.map((p) => (
                        <option key={p.normalizedName} value={p.normalizedName}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Name <span className="text-amber-600 text-[10px]">(Autofills on match)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedRepName}
                    onChange={(e) => handleNameChangeWithAutofill('authorizedRep', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={formData.authorizedRepTitle}
                    onChange={(e) => handleFieldChange('authorizedRepTitle', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Office / Mailing Address</label>
                <input
                  type="text"
                  value={formData.authorizedRepAddress}
                  onChange={(e) => handleFieldChange('authorizedRepAddress', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOCKHOLDERS & DIRECTORS TABLE */}
        {/* ========================================================= */}
        {activeTab === 'stockholders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Board of Directors & Stockholders List
                </h4>
                <p className="text-[11px] text-slate-500">
                  Entering an existing person&apos;s name will automatically autofill their TIN & details.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStockholder}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>

            <div className="space-y-3">
              {formData.stockholders.map((person, index) => (
                <div
                  key={person.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      #{index + 1} {person.name || 'Unnamed'}
                    </span>
                    <div className="flex items-center gap-2">
                      {knownPersons.length > 0 && (
                        <select
                          onChange={(e) => {
                            const match = knownPersons.find((p) => p.normalizedName === e.target.value);
                            if (match) handleSelectPersonForStockholder(index, match);
                            e.target.value = '';
                          }}
                          className="text-[10px] py-0.5 px-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>⚡ Autofill from person...</option>
                          {knownPersons.map((p) => (
                            <option key={p.normalizedName} value={p.normalizedName}>
                              {p.name} ({p.tin || 'No TIN'})
                            </option>
                          ))}
                        </select>
                      )}
                      {formData.stockholders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStockholder(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Full Name <span className="text-blue-600 text-[10px]">(Autofills TIN on match)</span>
                      </label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handleStockholderNameChange(index, e.target.value)}
                        placeholder="Enter or paste name..."
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Tax Identification No (TIN)
                      </label>
                      <input
                        type="text"
                        value={person.tin}
                        onChange={(e) => handleUpdateStockholder(index, 'tin', e.target.value)}
                        placeholder="e.g. 773-441-472-000"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Shares</label>
                      <input
                        type="text"
                        value={person.shares}
                        onChange={(e) => handleUpdateStockholder(index, 'shares', e.target.value)}
                        placeholder="e.g. 100,000"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Percent</label>
                      <input
                        type="text"
                        value={person.sharePercentage}
                        onChange={(e) => handleUpdateStockholder(index, 'sharePercentage', e.target.value)}
                        placeholder="e.g. 50%"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Board Role</label>
                      <input
                        type="text"
                        value={person.directorRole}
                        onChange={(e) => handleUpdateStockholder(index, 'directorRole', e.target.value)}
                        placeholder="Chairman / Member"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Vote</label>
                      <input
                        type="text"
                        value={person.vote}
                        onChange={(e) => handleUpdateStockholder(index, 'vote', e.target.value)}
                        placeholder="Yes"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MEETING & RESOLUTIONS */}
        {/* ========================================================= */}
        {activeTab === 'meeting' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
              Joint meeting details approving voluntary dissolution of the corporation.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Date
                </label>
                <input
                  type="text"
                  value={formData.meetingDateFormatted}
                  onChange={(e) => handleFieldChange('meetingDateFormatted', e.target.value)}
                  placeholder="e.g. June 25, 2026"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Time
                </label>
                <input
                  type="text"
                  value={formData.meetingTime}
                  onChange={(e) => handleFieldChange('meetingTime', e.target.value)}
                  placeholder="e.g. 10:00 am"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Venue / Place
              </label>
              <textarea
                rows={2}
                value={formData.meetingPlace}
                onChange={(e) => handleFieldChange('meetingPlace', e.target.value)}
                placeholder="e.g. 146 Dona Soledad Avenue Corner Peru Street..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date Notice Sent to Stockholders
                </label>
                <input
                  type="text"
                  value={formData.noticeSentDate}
                  onChange={(e) => handleFieldChange('noticeSentDate', e.target.value)}
                  placeholder="e.g. January 2, 2026"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Directors Certificate Date
                </label>
                <input
                  type="text"
                  value={formData.directorsCertDate}
                  onChange={(e) => handleFieldChange('directorsCertDate', e.target.value)}
                  placeholder="e.g. June 25, 2026"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notice Delivery Method
              </label>
              <input
                type="text"
                value={formData.noticeDeliveryMethod}
                onChange={(e) => handleFieldChange('noticeDeliveryMethod', e.target.value)}
                placeholder="e.g. by personal delivery, in accordance with the corporation’s By-Laws"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PUBLICATION */}
        {/* ========================================================= */}
        {activeTab === 'publication' && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              Notice of dissolution must be published thrice in a newspaper of general circulation pursuant to the Revised Corporation Code.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Newspaper
                </label>
                <input
                  type="text"
                  value={formData.newspaperName}
                  onChange={(e) => handleFieldChange('newspaperName', e.target.value)}
                  placeholder="e.g. PUBLIKO New Publishing"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Publisher
                </label>
                <input
                  type="text"
                  value={formData.publisherName}
                  onChange={(e) => handleFieldChange('publisherName', e.target.value)}
                  placeholder="e.g. Mark Anthony B. Caiña"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal Office of Publisher
              </label>
              <textarea
                rows={2}
                value={formData.publisherOfficeAddress}
                onChange={(e) => handleFieldChange('publisherOfficeAddress', e.target.value)}
                placeholder="e.g. Unit 3014 Aurora Arcade, Alabang Zapote Road..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Area of Circulation
                </label>
                <input
                  type="text"
                  value={formData.circulationArea}
                  onChange={(e) => handleFieldChange('circulationArea', e.target.value)}
                  placeholder="e.g. General Circulation in the Philippines"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dates of Publication (Thrice)
                </label>
                <input
                  type="text"
                  value={formData.publicationDates}
                  onChange={(e) => handleFieldChange('publicationDates', e.target.value)}
                  placeholder="e.g. June 8, 15, 22, 2026"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SEC & NOTARIAL JURAT */}
        {/* ========================================================= */}
        {activeTab === 'notary' && (
          <div className="space-y-5">
            {/* SEC Addressee */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                SEC Recipient (CRMD)
              </span>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Director / Officer Name
                </label>
                <input
                  type="text"
                  value={formData.secDirectorName}
                  onChange={(e) => handleFieldChange('secDirectorName', e.target.value)}
                  placeholder="e.g. GERARDO F. DEL ROSARIO"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.secDepartment}
                  onChange={(e) => handleFieldChange('secDepartment', e.target.value)}
                  placeholder="Company Registration and Monitoring Department (CRMD)"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">SEC Address</label>
                <textarea
                  rows={2}
                  value={formData.secAddress}
                  onChange={(e) => handleFieldChange('secAddress', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md resize-none"
                />
              </div>
            </div>

            {/* Notarial Details */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Notary Public & Jurat Defaults
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Place of Notarization (City)
                  </label>
                  <input
                    type="text"
                    value={formData.executionCity}
                    onChange={(e) => handleFieldChange('executionCity', e.target.value)}
                    placeholder="Leave blank for line or enter city"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Series Year</label>
                  <input
                    type="text"
                    value={formData.seriesYear}
                    onChange={(e) => handleFieldChange('seriesYear', e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Doc No.</label>
                  <input
                    type="text"
                    value={formData.docNo}
                    onChange={(e) => handleFieldChange('docNo', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Page No.</label>
                  <input
                    type="text"
                    value={formData.pageNo}
                    onChange={(e) => handleFieldChange('pageNo', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Book No.</label>
                  <input
                    type="text"
                    value={formData.bookNo}
                    onChange={(e) => handleFieldChange('bookNo', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: FORMATTING & PAGE SIZE */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Paper Size selector including A4 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Word Paper Size Selection *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange('pageSize', 'A4')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    formData.pageSize === 'A4'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">A4 Size</span>
                    {formData.pageSize === 'A4' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">210 &times; 297 mm</p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mt-1">
                    International Standard
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange('pageSize', 'LETTER')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    formData.pageSize === 'LETTER'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Letter Size</span>
                    {formData.pageSize === 'LETTER' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">8.5 &times; 11 inches</p>
                  <p className="text-[10px] text-slate-500 mt-1">215.9 &times; 279.4 mm</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange('pageSize', 'LEGAL')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    formData.pageSize === 'LEGAL'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Legal Size</span>
                    {formData.pageSize === 'LEGAL' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">8.5 &times; 14 inches</p>
                  <p className="text-[10px] text-slate-500 mt-1">Philippine Long Legal</p>
                </button>
              </div>
            </div>

            {/* Smart Autofill & Sync Toggle */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Auto-Fill & Sync Matching Names
                  </label>
                  <p className="text-[11px] text-slate-500">
                    When the same name is encoded across multiple roles, automatically fill and sync their Address, TIN, and ID details.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoSyncMatchingNames !== false}
                  onChange={(e) => handleFieldChange('autoSyncMatchingNames', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Font family selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Word Document Typography Font
              </label>
              <select
                value={formData.fontFamily}
                onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="Times New Roman">Times New Roman (Standard Legal Font)</option>
                <option value="Bookman Old Style">Bookman Old Style (Philippine Supreme Court Standard)</option>
                <option value="Arial">Arial (Clean Modern)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClear}
                className="w-full py-2 px-3 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                Clear All Fields to Blank
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
