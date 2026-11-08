import React, { useState, useEffect } from 'react';
import { DissolutionFormData, defaultDragonPuffData } from '../types/dissolution';
import {
  Bookmark,
  Plus,
  Trash2,
  Check,
  X,
  FolderOpen,
  Download,
  Upload,
  Building2,
} from 'lucide-react';

export interface SavedCompanyProfile {
  id: string;
  name: string;
  secRegistrationNo: string;
  updatedAt: string;
  data: DissolutionFormData;
}

const PROFILES_STORAGE_KEY = 'ph_sec_dissolution_saved_profiles_v1';

interface SavedProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormData: DissolutionFormData;
  onLoadProfile: (data: DissolutionFormData, profileName: string) => void;
  onNotify: (msg: string) => void;
}

export const SavedProfilesModal: React.FC<SavedProfilesModalProps> = ({
  isOpen,
  onClose,
  currentFormData,
  onLoadProfile,
  onNotify,
}) => {
  const [profiles, setProfiles] = useState<SavedCompanyProfile[]>(() => {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load saved company profiles:', e);
    }
    return [
      {
        id: 'default-dragon-puff',
        name: 'DRAGON PUFF INC. (Sample)',
        secRegistrationNo: '2024040146113-02',
        updatedAt: 'Sample Template',
        data: defaultDragonPuffData,
      },
    ];
  });

  const [customProfileName, setCustomProfileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomProfileName(currentFormData.corporationName || '');
    }
  }, [isOpen, currentFormData.corporationName]);

  const persistProfiles = (updated: SavedCompanyProfile[]) => {
    setProfiles(updated);
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist company profiles:', e);
    }
  };

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      customProfileName.trim() ||
      currentFormData.corporationName.trim() ||
      'Untitled Corporation';

    const existingIndex = profiles.findIndex(
      (p) => p.name.toLowerCase() === label.toLowerCase()
    );

    const newEntry: SavedCompanyProfile = {
      id: existingIndex >= 0 ? profiles[existingIndex].id : Date.now().toString(),
      name: label,
      secRegistrationNo: currentFormData.secRegistrationNo || 'No SEC No.',
      updatedAt: new Date().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      data: JSON.parse(JSON.stringify(currentFormData)),
    };

    let updated: SavedCompanyProfile[];
    if (existingIndex >= 0) {
      updated = [...profiles];
      updated[existingIndex] = newEntry;
      onNotify(`Updated saved profile "${label}"`);
    } else {
      updated = [newEntry, ...profiles];
      onNotify(`Saved company profile "${label}"`);
    }

    persistProfiles(updated);
  };

  const handleDelete = (id: string, name: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    persistProfiles(updated);
    onNotify(`Removed profile "${name}"`);
  };

  const handleExportProfile = (profile: SavedCompanyProfile) => {
    const jsonStr = JSON.stringify(profile.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfileFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const corpName = parsed.corporationName || file.name.replace('.json', '');
        const importedData: DissolutionFormData = { ...defaultDragonPuffData, ...parsed };
        const newEntry: SavedCompanyProfile = {
          id: Date.now().toString(),
          name: corpName,
          secRegistrationNo: importedData.secRegistrationNo || 'Imported',
          updatedAt: new Date().toLocaleDateString(),
          data: importedData,
        };
        persistProfiles([newEntry, ...profiles]);
        onLoadProfile(importedData, corpName);
        onNotify(`Imported and loaded "${corpName}"`);
      } catch (err) {
        onNotify('Invalid JSON profile file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Saved Company Profiles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save, switch, or backup multiple corporate dissolution filings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Company Bar */}
        <form
          onSubmit={handleSaveCurrent}
          className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2.5"
        >
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Save Current Form as Company Profile
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customProfileName}
              onChange={(e) => setCustomProfileName(e.target.value)}
              placeholder="Enter company or profile name..."
              className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>

        {/* Saved Profiles List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {profiles.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
              No saved company profiles yet. Save your current corporation above!
            </div>
          ) : (
            profiles.map((prof) => {
              const isCurrent =
                prof.data.corporationName.trim().toLowerCase() ===
                currentFormData.corporationName.trim().toLowerCase();

              return (
                <div
                  key={prof.id}
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {prof.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-mono tabular-nums">
                        SEC: {prof.secRegistrationNo}
                      </span>
                      <span aria-hidden="true">&bull;</span>
                      <span>{prof.updatedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadProfile(prof.data, prof.name);
                        onClose();
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Load</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportProfile(prof)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Export JSON file"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(prof.id, prof.name)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with JSON Import */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 pb-safe">
          <label className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import Profile (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportProfileFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
