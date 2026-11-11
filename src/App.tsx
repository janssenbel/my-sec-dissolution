import { useState, useEffect } from 'react';
import {
  DissolutionFormData,
  DocumentType,
  DOCUMENTS_LIST,
  defaultDragonPuffData,
} from './types/dissolution';
import { FormEditor } from './components/FormEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { StandaloneHtmlModal } from './components/StandaloneHtmlModal';
import { SavedProfilesModal, SavedCompanyProfile } from './components/SavedProfilesModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { downloadAllDocumentsZip } from './utils/zipGenerator';
import { downloadAllDocumentsPdfZip } from './utils/pdfGenerator';
import {
  Archive,
  FileCheck2,
  Columns,
  Maximize2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Bookmark,
  Moon,
  Sun,
  Eye,
  PenSquare,
} from 'lucide-react';

const STORAGE_KEY = 'ph_sec_dissolution_form_state_v1';
const PROFILES_STORAGE_KEY = 'ph_sec_dissolution_saved_profiles_v1';
const THEME_STORAGE_KEY = 'ph_sec_theme_dark_v1';

export default function App() {
  const [formData, setFormData] = useState<DissolutionFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved dissolution state:', e);
    }
    return defaultDragonPuffData;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  const [currentDoc, setCurrentDoc] = useState<DocumentType>('forum_shopping');
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [mobilePane, setMobilePane] = useState<'form' | 'preview'>('form');
  const [zipDownloading, setZipDownloading] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [pdfZipDownloading, setPdfZipDownloading] = useState(false);
  const [pdfZipProgress, setPdfZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [profilesModalOpen, setProfilesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Dark Mode class on <html> and update iOS status bar theme-color to solid color
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#0f172a';
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#0f172a';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#ffffff';
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', darkMode ? '#0f172a' : '#ffffff');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, String(darkMode));
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  }, [darkMode]);

  // Prevent iOS WKScrollView root scrolling which triggers iOS 26 status-bar blur overlay
  useEffect(() => {
    const resetRootScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', resetRootScroll, { passive: true });
    return () => window.removeEventListener('scroll', resetRootScroll);
  }, []);

  // Auto-save active form state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [formData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleQuickSaveProfile = () => {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      const list: SavedCompanyProfile[] = raw
        ? JSON.parse(raw)
        : [
            {
              id: 'default-dragon-puff',
              name: 'DRAGON PUFF INC. (Sample)',
              secRegistrationNo: '2024040146113-02',
              updatedAt: 'Sample Template',
              data: defaultDragonPuffData,
            },
          ];

      const label = formData.corporationName.trim() || 'Untitled Corporation';
      const existingIdx = list.findIndex(
        (p) => p.name.toLowerCase() === label.toLowerCase()
      );

      const entry: SavedCompanyProfile = {
        id: existingIdx >= 0 ? list[existingIdx].id : Date.now().toString(),
        name: label,
        secRegistrationNo: formData.secRegistrationNo || 'No SEC No.',
        updatedAt: new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        data: JSON.parse(JSON.stringify(formData)),
      };

      if (existingIdx >= 0) {
        list[existingIdx] = entry;
      } else {
        list.unshift(entry);
      }

      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
      showToast(`Saved company profile: "${label}"`);
    } catch (e) {
      console.error('Failed to save profile:', e);
      showToast('Could not save profile to local storage.');
    }
  };

  const handleResetSample = () => {
    setFormData(defaultDragonPuffData);
    showToast('Loaded Dragon Puff Inc. sample data.');
  };

  const handleClear = () => {
    setFormData({
      corporationName: '',
      secRegistrationNo: '',
      principalOfficeAddress: '',
      officialEmail: '',
      corporateSecretaryName: '',
      corporateSecretaryNationality: 'Filipino',
      corporateSecretaryAddress: '',
      corporateSecretaryTin: '',
      corporateSecretaryId: '',
      presidentName: '',
      presidentNationality: 'Filipino',
      presidentAddress: '',
      presidentTin: '',
      presidentId: '',
      treasurerName: '',
      treasurerNationality: 'Filipino',
      treasurerAddress: '',
      treasurerTin: '',
      treasurerId: '',
      authorizedRepName: '',
      authorizedRepTitle: 'Corp. Secretary / Authorized Representative',
      authorizedRepAddress: '',
      stockholders: [
        {
          id: '1',
          name: '',
          tin: '',
          shares: '',
          sharePercentage: '',
          directorRole: 'Chairman',
          vote: 'Yes',
        },
      ],
      meetingDateFormatted: '',
      meetingTime: '',
      meetingPlace: '',
      noticeSentDate: '',
      noticeDeliveryMethod: 'by personal delivery, in accordance with the corporation’s By-Laws',
      directorsCertDate: '',
      newspaperName: '',
      publisherName: '',
      publisherOfficeAddress: '',
      circulationArea: 'General Circulation in the Philippines',
      publicationDates: '',
      secDirectorName: 'GERARDO F. DEL ROSARIO',
      secDepartment: 'Company Registration and Monitoring Department (CRMD)',
      secAddress: 'Securities and Exchange Commission\n7907 Makati Avenue, Salcedo Village,\nBrgy. Bel-Air, Makati City, 1209',
      executionCity: '',
      executionDay: '',
      executionMonthYear: '2026',
      notaryJurisdiction: '',
      docNo: '_____',
      pageNo: '_____',
      bookNo: '_____',
      seriesYear: '2026',
      fontFamily: 'Times New Roman',
      pageSize: 'LETTER',
    });
    showToast('Cleared all form fields.');
  };

  const handleDownloadAllZip = async () => {
    try {
      setZipDownloading(true);
      await downloadAllDocumentsZip(formData, (current, total, name) => {
        setZipProgress({ current, total, name });
      });
      showToast('All 5 Word (.docx) files downloaded as ZIP!');
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      showToast('Error downloading Word ZIP archive.');
    } finally {
      setZipDownloading(false);
      setZipProgress(null);
    }
  };

  const handleDownloadAllPdfZip = async () => {
    try {
      setPdfZipDownloading(true);
      await downloadAllDocumentsPdfZip(
        formData,
        undefined,
        (current, total, name) => {
          setPdfZipProgress({ current, total, name });
        }
      );
      showToast('All 5 PDF documents downloaded as ZIP!');
    } catch (err) {
      console.error('Failed to export PDF ZIP:', err);
      showToast('Error generating PDF ZIP archive.');
    } finally {
      setPdfZipDownloading(false);
      setPdfZipProgress(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* ========================================================= */}
      {/* TOP BAR */}
      {/* ========================================================= */}
      <div
        role="region"
        aria-label="Application Top Bar"
        className="min-h-14 sm:h-16 px-3 sm:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Red Stop Symbol Vector Icon (Borderless, matches Home Screen icon) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0"
            aria-label="Red Stop Symbol"
          >
            <polygon
              points="154,16 358,16 496,154 496,358 358,496 154,496 16,358 16,154"
              fill="#dc2626"
            />
            <rect x="176" y="176" width="160" height="160" rx="18" fill="#ffffff" />
          </svg>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                SEC Dissolution Generator
              </h1>
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Signatory Page Separated
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {formData.corporationName || 'Corporate Dissolution'} &bull; Word &amp; PDF
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop View Mode Toggle */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Split View: Form on Left, Document on Right"
            >
              <Columns className="w-3.5 h-3.5" />
              Split
            </button>
            <button
              onClick={() => setViewMode('form')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Form View Only"
            >
              <FileText className="w-3.5 h-3.5" />
              Form
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Preview View Only"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>

          {/* Saved Company Profiles Button */}
          <button
            onClick={() => setProfilesModalOpen(true)}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            title="Save or load company profiles"
          >
            <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Profiles</span>
          </button>

          {/* Add to Home Screen (PWA / iPhone Guide) */}
          <PWAInstallButton />

          {/* Standalone index.html Modal Button */}
          <button
            onClick={() => setHtmlModalOpen(true)}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            title="Copy or download standalone index.html"
          >
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">index.html</span>
          </button>

          {/* Dark Mode Toggle Button */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            type="button"
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex items-center justify-center min-h-[38px] min-w-[38px] p-2 text-slate-700 dark:text-amber-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop Download All as PDF ZIP */}
          <button
            onClick={handleDownloadAllPdfZip}
            disabled={pdfZipDownloading || zipDownloading}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Download all 5 documents in PDF format inside a ZIP archive"
          >
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden md:inline">
              {pdfZipDownloading
                ? `PDF ZIP (${pdfZipProgress?.current || 0}/5)...`
                : 'All PDFs (.ZIP)'}
            </span>
            <span className="md:hidden">
              {pdfZipDownloading ? 'PDF...' : 'PDF ZIP'}
            </span>
          </button>

          {/* Desktop Download All as Word (.docx) ZIP */}
          <button
            onClick={handleDownloadAllZip}
            disabled={zipDownloading || pdfZipDownloading}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download all 5 documents in Word .docx format packed in a ZIP file"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden md:inline">
              {zipDownloading
                ? `Word ZIP (${zipProgress?.current || 0}/5)...`
                : 'All Word (.ZIP)'}
            </span>
            <span className="md:hidden">
              {zipDownloading ? 'Word...' : 'Word ZIP'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DOCUMENT TABS BAR */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-6 py-1.5 sm:py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 mr-1 hidden md:inline">
          Documents:
        </span>
        {DOCUMENTS_LIST.map((doc, idx) => {
          const isActive = currentDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setCurrentDoc(doc.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {idx + 1}
              </span>
              <span>{doc.shortTitle}</span>
              {isActive && <FileCheck2 className="w-3.5 h-3.5 hidden sm:inline" />}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA (Desktop Split/Toggle + iPhone Single Pane) */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Form Editor Pane */}
        <div
          className={`h-full overflow-hidden transition-all ${
            mobilePane === 'form' ? 'block w-full' : 'hidden'
          } ${
            viewMode === 'split'
              ? 'lg:block lg:w-[460px] xl:w-[500px] lg:shrink-0'
              : viewMode === 'form'
              ? 'lg:block lg:w-full'
              : 'lg:hidden'
          }`}
        >
          <FormEditor
            formData={formData}
            onChange={setFormData}
            onResetSample={handleResetSample}
            onClear={handleClear}
            onOpenSavedProfiles={() => setProfilesModalOpen(true)}
            onQuickSaveProfile={handleQuickSaveProfile}
          />
        </div>

        {/* Live Document Preview Pane */}
        <div
          className={`flex-1 h-full overflow-hidden ${
            mobilePane === 'preview' ? 'block w-full' : 'hidden'
          } ${
            viewMode === 'split' || viewMode === 'preview' ? 'lg:block' : 'lg:hidden'
          }`}
        >
          <DocumentPreview
            currentDoc={currentDoc}
            formData={formData}
            onSelectDoc={setCurrentDoc}
            onUpdatePageSize={(size) => {
              setFormData((prev) => ({ ...prev, pageSize: size }));
              showToast(`Paper size switched to ${size}`);
            }}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE / IPHONE BOTTOM NAVIGATION BAR (< lg) */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 pt-1.5 pb-safe shrink-0 z-30 grid grid-cols-5 gap-1"
      >
        <button
          type="button"
          onClick={() => setMobilePane('form')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
            mobilePane === 'form'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <PenSquare className="w-4 h-4 mb-0.5" />
          <span>Edit Form</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
            mobilePane === 'preview'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4 mb-0.5" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setProfilesModalOpen(true)}
          className="flex flex-col items-center justify-center min-h-[48px] rounded-xl py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <Bookmark className="w-4 h-4 mb-0.5" />
          <span>Profiles</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadAllPdfZip}
          disabled={pdfZipDownloading || zipDownloading}
          className="flex flex-col items-center justify-center min-h-[48px] rounded-xl py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>{pdfZipDownloading ? `${pdfZipProgress?.current || 0}/5` : 'PDF ZIP'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadAllZip}
          disabled={zipDownloading || pdfZipDownloading}
          className="flex flex-col items-center justify-center min-h-[48px] rounded-xl py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Archive className="w-4 h-4 mb-0.5" />
          <span>{zipDownloading ? `${zipProgress?.current || 0}/5` : 'Word ZIP'}</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* SAVED COMPANY PROFILES MODAL */}
      {/* ========================================================= */}
      <SavedProfilesModal
        isOpen={profilesModalOpen}
        onClose={() => setProfilesModalOpen(false)}
        currentFormData={formData}
        onLoadProfile={(loadedData, name) => {
          setFormData(loadedData);
          showToast(`Loaded company profile: "${name}"`);
        }}
        onNotify={showToast}
      />

      {/* ========================================================= */}
      {/* STANDALONE INDEX.HTML MODAL */}
      {/* ========================================================= */}
      <StandaloneHtmlModal
        isOpen={htmlModalOpen}
        onClose={() => setHtmlModalOpen(false)}
      />

      {/* ========================================================= */}
      {/* TOAST NOTIFICATION */}
      {/* ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-5 right-4 sm:right-5 left-4 sm:left-auto z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
