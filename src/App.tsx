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
import { downloadAllDocumentsZip } from './utils/zipGenerator';
import { downloadAllDocumentsPdfZip } from './utils/pdfGenerator';
import {
  Archive,
  FileCheck2,
  Columns,
  Maximize2,
  FileText,
  ShieldCheck,
  Building,
  CheckCircle2,
  Code2,
} from 'lucide-react';

const STORAGE_KEY = 'ph_sec_dissolution_form_state_v1';

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

  const [currentDoc, setCurrentDoc] = useState<DocumentType>('forum_shopping');
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [zipDownloading, setZipDownloading] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [pdfZipDownloading, setPdfZipDownloading] = useState(false);
  const [pdfZipProgress, setPdfZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [formData]);

  const handleResetSample = () => {
    setFormData(defaultDragonPuffData);
    showToast('Loaded Dragon Puff Inc. sample data from attached PDFs.');
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDownloadAllZip = async () => {
    try {
      setZipDownloading(true);
      await downloadAllDocumentsZip(formData, (current, total, name) => {
        setZipProgress({ current, total, name });
      });
      showToast('All 5 Word (.docx) files downloaded successfully as ZIP!');
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
      showToast('All 5 PDF documents downloaded successfully as ZIP!');
    } catch (err) {
      console.error('Failed to export PDF ZIP:', err);
      showToast('Error generating PDF ZIP archive.');
    } finally {
      setPdfZipDownloading(false);
      setPdfZipProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ========================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================= */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                SEC Dissolution Document Generator
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                Signatory Page Separated
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
              {formData.corporationName || 'Corporate Dissolution Documents'} &bull; Word (.docx) &amp; PDF Export
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* View Mode Toggle */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Preview View Only"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>

          {/* Get index.html Code / Download */}
          <button
            onClick={() => setHtmlModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-all cursor-pointer"
            title="Copy or download the standalone index.html file"
          >
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">index.html</span>
          </button>

          {/* Download All as PDF ZIP */}
          <button
            onClick={handleDownloadAllPdfZip}
            disabled={pdfZipDownloading || zipDownloading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Download all 5 documents in PDF format inside a ZIP archive"
          >
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">
              {pdfZipDownloading
                ? `Building PDF ZIP (${pdfZipProgress?.current || 0}/5)...`
                : 'All PDFs (.ZIP)'}
            </span>
            <span className="sm:hidden">
              {pdfZipDownloading ? 'PDF...' : 'PDF ZIP'}
            </span>
          </button>

          {/* Download All as Word (.docx) ZIP */}
          <button
            onClick={handleDownloadAllZip}
            disabled={zipDownloading || pdfZipDownloading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            title="Download all 5 documents in Word .docx format packed in a ZIP file"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">
              {zipDownloading
                ? `Building Word ZIP (${zipProgress?.current || 0}/5)...`
                : 'All Word (.ZIP)'}
            </span>
            <span className="sm:hidden">
              {zipDownloading ? 'Word...' : 'Word ZIP'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* DOCUMENT TABS BAR */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 mr-2 hidden md:inline">
          Documents:
        </span>
        {DOCUMENTS_LIST.map((doc, idx) => {
          const isActive = currentDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setCurrentDoc(doc.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {idx + 1}
              </span>
              <span>{doc.shortTitle}</span>
              {isActive && <FileCheck2 className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Editor Pane */}
        {(viewMode === 'split' || viewMode === 'form') && (
          <div
            className={`h-full overflow-hidden transition-all ${
              viewMode === 'split' ? 'w-full lg:w-[460px] xl:w-[500px] shrink-0' : 'w-full'
            }`}
          >
            <FormEditor
              formData={formData}
              onChange={setFormData}
              onResetSample={handleResetSample}
              onClear={handleClear}
            />
          </div>
        )}

        {/* Live Document Preview Pane */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex-1 h-full overflow-hidden">
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
        )}
      </div>

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
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
