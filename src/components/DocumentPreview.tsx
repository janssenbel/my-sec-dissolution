import React, { useState } from 'react';
import { DissolutionFormData, DocumentType, DOCUMENTS_LIST } from '../types/dissolution';
import { downloadDocx } from '../utils/docxGenerator';
import { downloadCurrentPreviewAsPdf } from '../utils/pdfGenerator';
import { FileDown, Printer, Copy, Check, FileText, Layers, Sparkles } from 'lucide-react';

interface DocumentPreviewProps {
  currentDoc: DocumentType;
  formData: DissolutionFormData;
  onSelectDoc: (doc: DocumentType) => void;
  onUpdatePageSize?: (size: 'LETTER' | 'LEGAL' | 'A4') => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  currentDoc,
  formData,
  onSelectDoc,
  onUpdatePageSize,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const docMeta = DOCUMENTS_LIST.find((d) => d.id === currentDoc)!;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadDocx(currentDoc, formData);
    } catch (err) {
      console.error('Failed to download document:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadCurrentPreviewAsPdf(null, formData, currentDoc);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyText = () => {
    // Collect text from preview
    const previewEl = document.getElementById('legal-doc-preview');
    if (previewEl) {
      navigator.clipboard.writeText(previewEl.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const pageSizeLabel =
    formData.pageSize === 'A4'
      ? 'A4 (210 × 297 mm)'
      : formData.pageSize === 'LEGAL'
      ? 'Legal (8.5 × 14 in)'
      : 'Letter (8.5 × 11 in)';

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Top Preview Action Bar */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
              {docMeta.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Preview</span>
              <span>&bull;</span>
              {onUpdatePageSize ? (
                <div className="inline-flex items-center rounded border border-slate-300 dark:border-slate-700 text-[11px] overflow-hidden">
                  {(['LETTER', 'LEGAL', 'A4'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onUpdatePageSize(sz)}
                      className={`px-1.5 py-0.5 font-medium transition-colors cursor-pointer ${
                        formData.pageSize === sz
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="font-semibold text-slate-700 dark:text-slate-300">{pageSizeLabel}</span>
              )}
              <span>&bull;</span>
              <span>{formData.fontFamily}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyText}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Copy plain text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Print or Save as PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          {/* DOWNLOAD PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Download this document in PDF format"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            {downloadingPdf ? 'Exporting PDF...' : 'Download PDF'}
          </button>

          {/* DOWNLOAD WORD */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Download this document in Microsoft Word (.docx) format"
          >
            <FileDown className="w-3.5 h-3.5" />
            {downloading ? 'Generating...' : 'Download Word'}
          </button>
        </div>
      </div>

      {/* Notice Banner about Signatory Separation */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Signatory Page Separated:</strong> In compliance with requirements, the signatory block and notarial jurat are strictly placed on subsequent separate page(s) via Word Page Breaks.
        </span>
      </div>

      {/* Scrollable Document Sheet Preview Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-8">
        <div id="legal-doc-preview" className="w-full max-w-3xl flex flex-col gap-8 print:p-0">
          {renderDocumentContent(currentDoc, formData)}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Render Document Pages
// ============================================================================
export function renderDocumentContent(docType: DocumentType, data: DissolutionFormData) {
  const fontStyle = {
    fontFamily:
      data.fontFamily === 'Times New Roman'
        ? '"Times New Roman", Times, serif'
        : data.fontFamily === 'Bookman Old Style'
        ? '"Bookman Old Style", Georgia, serif'
        : 'Arial, Helvetica, sans-serif',
  };

  switch (docType) {
    case 'forum_shopping':
      return renderForumShoppingPages(data, fontStyle);
    case 'sec_cert':
      return renderSecretaryCertPages(data, fontStyle);
    case 'directors_cert':
      return renderDirectorsCertPages(data, fontStyle);
    case 'affidavit':
      return renderAffidavitPages(data, fontStyle);
    case 'verified_request':
      return renderVerifiedRequestPages(data, fontStyle);
    default:
      return null;
  }
}

// -------------------------------------------------------------
// Helper: Page Container styling
// -------------------------------------------------------------
function PageSheet({
  pageNumber,
  totalEstimate,
  children,
  fontStyle,
  isSignatoryPage = false,
}: {
  pageNumber: number;
  totalEstimate: number;
  children: React.ReactNode;
  fontStyle: React.CSSProperties;
  isSignatoryPage?: boolean;
}) {
  return (
    <div
      style={fontStyle}
      className={`page-sheet relative bg-white text-slate-900 shadow-md rounded-sm border border-slate-200 p-8 sm:p-14 min-h-[960px] text-[15px] leading-relaxed select-text print:shadow-none print:border-none print:p-8 ${
        isSignatoryPage ? 'ring-2 ring-blue-500/30' : ''
      }`}
    >
      {/* Page Header Badge for Clarity */}
      <div className="absolute top-3 right-4 flex items-center gap-2 text-[11px] font-sans tracking-wide uppercase text-slate-400 print:hidden select-none">
        {isSignatoryPage && (
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[10px]">
            Signatory Page (Page Break)
          </span>
        )}
        <span>
          Page {pageNumber} of {totalEstimate}
        </span>
      </div>

      {children}
    </div>
  );
}

// -------------------------------------------------------------
// Helper: Page Break Divider Banner
// -------------------------------------------------------------
function PageBreakDivider({ title = 'PAGE BREAK — SIGNATORY PAGE ON NEXT PAGE' }: { title?: string }) {
  return (
    <div className="relative flex items-center justify-center my-1 print:hidden select-none">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-dashed border-blue-400/60 dark:border-blue-600/60" />
      </div>
      <div className="relative bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs">
        <Layers className="w-3.5 h-3.5" />
        <span>{title}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Helper: Notary Public Block
// -------------------------------------------------------------
function NotaryBlock({ data }: { data: DissolutionFormData }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="text-right pr-4 font-bold tracking-wider">
        NOTARY PUBLIC
      </div>
      <div className="pt-4 text-xs sm:text-sm space-y-1 text-slate-800">
        <p>Doc. No. {data.docNo || '____'};</p>
        <p>Page No. {data.pageNo || '____'};</p>
        <p>Book No. {data.bookNo || '____'};</p>
        <p>Series of {data.seriesYear || '2026'}.</p>
      </div>
    </div>
  );
}

// ============================================================================
// 1. Forum Shopping Pages
// ============================================================================
function renderForumShoppingPages(data: DissolutionFormData, fontStyle: React.CSSProperties) {
  return (
    <>
      {/* PAGE 1: Deposition and Allegations */}
      <PageSheet pageNumber={1} totalEstimate={2} fontStyle={fontStyle}>
        <div className="text-left leading-tight mb-8">
          <p>REPUBLIC OF THE PHILIPPINES</p>
          <p className="pl-12">) S.S.</p>
        </div>

        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          VERIFICATION AND CERTIFICATION AGAINST FORUM SHOPPING
        </h2>

        <p className="text-justify indent-10 mb-6">
          I, <strong>{data.corporateSecretaryName || '[Corporate Secretary Name]'}</strong>, of legal age, {data.corporateSecretaryNationality || 'Filipino'} and with address at {data.corporateSecretaryAddress || '[Corporate Secretary Address]'}, on oath, state that:
        </p>

        <div className="space-y-5 text-justify pl-4">
          <div className="flex gap-3">
            <span className="font-semibold">1.</span>
            <p>
              I am the Corporate Secretary of <strong>{data.corporationName || '[Corporation Name]'}</strong>, duly authorized to execute this Verification pursuant to my authority as evidenced by the attached Directors Certificate dated {data.directorsCertDate || data.meetingDateFormatted || '[Date]'}.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="font-semibold">2.</span>
            <p>
              I have caused the preparation of the foregoing Petition and read all the allegations in the Petition. I attest that the factual allegations therein are true and correct based on my own knowledge and on authentic documents.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="font-semibold">3.</span>
            <p>
              That I have not commenced any action or filed any petition involving the same subject matter or issues in any court, tribunal or agency; to the best of my knowledge, no such action is pending therein; (if there is such other pending action, a complete statement of its present status;) and if I should learn that the same or similar action has been filed or is pending, I shall report that fact within five (5) days from such knowledge to the Company Registration and Monitoring Department (CRMD).
            </p>
          </div>
        </div>
      </PageSheet>

      {/* PAGE BREAK INDICATOR */}
      <PageBreakDivider title="PAGE BREAK — SIGNATORY PAGE SEPARATED ON NEXT PAGE" />

      {/* PAGE 2: Dedicated Signatory Page */}
      <PageSheet pageNumber={2} totalEstimate={2} fontStyle={fontStyle} isSignatoryPage={true}>
        <div className="pt-6">
          <div className="flex flex-col items-end mb-16 pr-4">
            <div className="w-72 text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 font-bold">
                {data.corporateSecretaryName || 'LIAN KIM PADIT DEL ROSARIO'}
              </div>
              <div className="text-sm">Corporate Secretary</div>
            </div>
          </div>

          <div className="text-justify indent-10 leading-relaxed mb-10">
            SUBSCRIBED AND SWORN to before me in {data.executionCity || '_________________'}, this ________ day of _______________, {data.executionMonthYear || '2026'} affiant exhibiting to me her Tax Identification Number {data.corporateSecretaryTin || '____________________'}.
          </div>

          <NotaryBlock data={data} />
        </div>
      </PageSheet>
    </>
  );
}

// ============================================================================
// 2. Secretary's Certificate Pages
// ============================================================================
function renderSecretaryCertPages(data: DissolutionFormData, fontStyle: React.CSSProperties) {
  return (
    <>
      {/* PAGE 1: Recital */}
      <PageSheet pageNumber={1} totalEstimate={2} fontStyle={fontStyle}>
        <div className="text-left leading-tight mb-8">
          <p>Republic of the Philippines</p>
          <p className="pl-12">) S.S.</p>
        </div>

        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          SECRETARY&apos;S CERTIFICATE
        </h2>

        <p className="text-justify indent-10 mb-6">
          I, <strong>{data.corporateSecretaryName || '[Corporate Secretary Name]'}</strong>, of legal age, {data.corporateSecretaryNationality || 'Filipino'} and with address at {data.corporateSecretaryAddress || '[Address]'}, after having been sworn to in accordance with law hereby depose and state that:
        </p>

        <p className="text-justify indent-10 mb-6">
          I am the duly elected and qualified Corporate Secretary of <strong>{data.corporationName || '[Corporation Name]'}</strong> a corporation duly registered with the Commission, with principal office at {data.principalOfficeAddress || '[Principal Address]'}.
        </p>

        <p className="text-justify indent-10 mb-6">
          To the best of my knowledge, from the date of approval of the dissolution by the Board of Directors in a meeting held on <u>{data.meetingDateFormatted || '[Meeting Date]'}</u> and the Stockholders in a meeting held on <u>{data.meetingDateFormatted || '[Meeting Date]'}</u> up to the date of filing of dissolution with the Commission, no action or proceeding has been filed or is pending before any Court involving an intra- corporate dispute and/or any claim by any person or group against the board of directors, individual director and/or major corporate officer/s of the Corporation as its duly elected and/or appointed director or officer or vice versa.
        </p>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — SIGNATORY PAGE SEPARATED ON NEXT PAGE" />

      {/* PAGE 2: Signatory Page */}
      <PageSheet pageNumber={2} totalEstimate={2} fontStyle={fontStyle} isSignatoryPage={true}>
        <div className="pt-6">
          <p className="text-justify indent-10 mb-16">
            IN WITNESS WHEREOF, I hereby signed this _____ day of ____________ 20___ at {data.executionCity || '____________________________________'}.
          </p>

          <div className="flex flex-col items-end mb-16 pr-4">
            <div className="w-80 text-center">
              <div className="border-b border-slate-900 pb-1 mb-1 font-bold">
                {data.corporateSecretaryName || 'LIAN KIM PADIT DEL ROSARIO'}
              </div>
              <div className="text-sm">Corporate Secretary</div>
            </div>
          </div>

          <p className="text-justify indent-10 mb-10 leading-relaxed">
            SUBSCRIBED AND SWORN to before me on this _____ day of ____________ 20___ in {data.executionCity || '_________________________'} affiant/s exhibited to me his/her Identification Documents/Government issued ID/s as follows: {data.corporateSecretaryId || data.corporateSecretaryTin || 'TIN: ____________'}.
          </p>

          <NotaryBlock data={data} />
        </div>
      </PageSheet>
    </>
  );
}

// ============================================================================
// 3. Directors' Certificate Pages
// ============================================================================
function renderDirectorsCertPages(data: DissolutionFormData, fontStyle: React.CSSProperties) {
  return (
    <>
      {/* PAGE 1: Resolutions */}
      <PageSheet pageNumber={1} totalEstimate={3} fontStyle={fontStyle}>
        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          DIRECTORS’ CERTIFICATE
        </h2>

        <p className="text-justify indent-10 mb-6">
          We, the undersigned members of the Board of Directors and Corporate Secretary of <strong>{data.corporationName}</strong>, a corporation duly organized and existing under the laws of the Republic of the Philippines, with SEC Registration No. {data.secRegistrationNo} and principal office at {data.principalOfficeAddress}, do hereby certify:
        </p>

        <p className="text-justify indent-10 mb-6">
          That at a joint meeting of the Board of Directors and Stockholders of the Corporation held on <strong>{data.meetingDateFormatted}</strong> at <strong>{data.meetingTime}</strong> in its principal office, at which a quorum of both the Board of Directors and Stockholders was present and acted throughout, the following resolutions were unanimously adopted:
        </p>

        <div className="space-y-4 pl-8 pr-4 italic text-justify">
          <p>
            “RESOLVED, that the Corporation shall be dissolved pursuant to the provisions of the Revised Corporation Code of the Philippines;
          </p>
          <p>
            RESOLVED FURTHER, that the Stockholders, representing at least two-thirds (2/3) of the outstanding capital stock of the Corporation, have approved and confirmed the foregoing resolution of the Board of Directors to dissolve the Corporation;
          </p>
          <p>
            RESOLVED FINALLY, that <strong>{data.authorizedRepName}</strong>, with office address at {data.authorizedRepAddress}, be, as is hereby, designated as the authorized representative of the Corporation to file and process with the Securities and Exchange Commission the Verified Request for Dissolution and to perform all acts necessary and incidental to the said dissolution;”
          </p>
        </div>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — SIGNATORY PAGE SEPARATED ON NEXT PAGE" />

      {/* PAGE 2: Directors & Stockholders Signatures */}
      <PageSheet pageNumber={2} totalEstimate={3} fontStyle={fontStyle} isSignatoryPage={true}>
        <div className="pt-4">
          <p className="text-justify mb-10">
            IN WITNESS WHEREOF, we have hereunto set our hands this ______ day of __________, {data.executionMonthYear || '2026'} at {data.executionCity || '_______________'}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
            {data.stockholders.map((s) => (
              <div key={s.id} className="text-center border-t border-slate-900 pt-2">
                <p className="font-bold text-sm sm:text-base">{s.name}</p>
                <p className="text-xs text-slate-600">Director / Stockholder</p>
                <p className="text-xs text-slate-500">TIN: {s.tin}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="font-semibold text-xs mb-3">ATTESTED BY:</p>
            <div className="w-72">
              <p className="font-bold border-b border-slate-900 pb-1">{data.corporateSecretaryName}</p>
              <p className="text-xs text-slate-600 mt-1">Corporate Secretary</p>
              <p className="text-xs text-slate-500">TIN: {data.corporateSecretaryTin}</p>
            </div>
          </div>
        </div>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — NOTARIAL ACKNOWLEDGMENT ON PAGE 3" />

      {/* PAGE 3: Acknowledgment */}
      <PageSheet pageNumber={3} totalEstimate={3} fontStyle={fontStyle}>
        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          ACKNOWLEDGMENT
        </h2>

        <div className="text-left leading-tight mb-8">
          <p>REPUBLIC OF THE PHILIPPINES )</p>
          <p>___________________________ ) S.S.</p>
        </div>

        <p className="text-justify indent-10 mb-5">
          BEFORE ME, a Notary Public for and in the above jurisdiction, this ___ day of _________, {data.executionMonthYear || '2026'}, personally appeared the following persons with their respective Competent Evidence of Identity:
        </p>

        {/* Competent Evidence Table */}
        <div className="border border-slate-300 rounded overflow-hidden mb-6">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border-r border-slate-300 p-2 text-left font-bold">Name</th>
                <th className="border-r border-slate-300 p-2 text-center font-bold">
                  Competent Evidence of Identity (TIN)
                </th>
                <th className="p-2 text-center font-bold">Date / Place Issued</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: { name: string; tin: string }[] = [];
                const seen = new Set<string>();
                for (const s of data.stockholders) {
                  const norm = (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
                  if (norm && !seen.has(norm)) {
                    seen.add(norm);
                    rows.push({ name: s.name, tin: s.tin });
                  }
                }
                if (data.corporateSecretaryName) {
                  const normSec = data.corporateSecretaryName.trim().toLowerCase().replace(/\s+/g, ' ');
                  if (normSec && !seen.has(normSec)) {
                    seen.add(normSec);
                    rows.push({ name: data.corporateSecretaryName, tin: data.corporateSecretaryTin });
                  }
                }
                return rows.map((person, idx) => (
                  <tr key={idx} className="border-b border-slate-300 last:border-none">
                    <td className="border-r border-slate-300 p-2 font-medium">{person.name}</td>
                    <td className="border-r border-slate-300 p-2 text-center">TIN: {person.tin}</td>
                    <td className="p-2 text-center"></td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        <p className="text-justify mb-6">
          known to me and to me known to be the same persons who executed the foregoing instrument and they acknowledged to me that the same is their free and voluntary act and deed as well as of the corporation they represent.
        </p>

        <p className="text-justify mb-8">
          IN WITNESS WHEREOF, I have hereunto set my hand and affixed my notarial seal on the date and at the place above written.
        </p>

        <NotaryBlock data={data} />
      </PageSheet>
    </>
  );
}

// ============================================================================
// 4. Affidavit Pages
// ============================================================================
function renderAffidavitPages(data: DissolutionFormData, fontStyle: React.CSSProperties) {
  return (
    <>
      {/* PAGE 1: Deposition */}
      <PageSheet pageNumber={1} totalEstimate={2} fontStyle={fontStyle}>
        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          AFFIDAVIT
        </h2>

        <p className="text-justify indent-10 mb-6">
          We, <strong>{data.presidentName}</strong>, of legal age, {data.presidentNationality}, and residing at {data.presidentAddress}, in my capacity as the President, and <strong>{data.treasurerName}</strong>, of legal age, {data.treasurerNationality}, and residing at {data.treasurerAddress}, in my capacity as the Treasurer, of <strong>{data.corporationName}</strong>, a corporation duly organized and existing under Philippine laws with principal office at {data.principalOfficeAddress}, after having been duly sworn to in accordance with law, do hereby depose and state that:
        </p>

        <div className="space-y-4 pl-4 text-justify">
          <div className="flex gap-3">
            <span className="font-semibold">1.</span>
            <p>The dissolution of the corporation is not prejudicial to the interest of the creditors of the corporation;</p>
          </div>

          <div className="flex gap-3">
            <span className="font-semibold">2.</span>
            <p>From the time of publication of the notice of dissolution up to the filing of the dissolution with the Securities and Exchange Commission, there has been no opposition from any of the creditors of the corporation.</p>
          </div>
        </div>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — SIGNATORY PAGE SEPARATED ON NEXT PAGE" />

      {/* PAGE 2: Signatory Page & Evidence Table */}
      <PageSheet pageNumber={2} totalEstimate={2} fontStyle={fontStyle} isSignatoryPage={true}>
        <div className="pt-4">
          <p className="text-justify indent-10 mb-12">
            IN WITNESS WHEREOF, we have hereunto set our hands this ___ day of _______, 20___ at {data.executionCity || '________________'}, Philippines.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold">{data.presidentName}</p>
              <p className="text-sm text-slate-600">President</p>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold">{data.treasurerName}</p>
              <p className="text-sm text-slate-600">Treasurer</p>
            </div>
          </div>

          <p className="text-justify mb-4">
            SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiants exhibiting to me their competent evidence of identity:
          </p>

          {/* Table */}
          <div className="border border-slate-300 rounded overflow-hidden mb-8">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="border-r border-slate-300 p-2 text-left font-bold">Name</th>
                  <th className="border-r border-slate-300 p-2 text-left font-bold">TIN/ID no</th>
                  <th className="p-2 text-left font-bold">Date and Place Issued</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="border-r border-slate-300 p-2 font-medium">{data.presidentName}</td>
                  <td className="border-r border-slate-300 p-2">{data.presidentTin}</td>
                  <td className="p-2">{data.presidentId || ''}</td>
                </tr>
                <tr>
                  <td className="border-r border-slate-300 p-2 font-medium">{data.treasurerName}</td>
                  <td className="border-r border-slate-300 p-2">{data.treasurerTin}</td>
                  <td className="p-2">{data.treasurerId || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <NotaryBlock data={data} />
        </div>
      </PageSheet>
    </>
  );
}

// ============================================================================
// 5. Verified Request Pages
// ============================================================================
function renderVerifiedRequestPages(data: DissolutionFormData, fontStyle: React.CSSProperties) {
  return (
    <>
      {/* PAGE 1: SEC Request Header & Points 1-5 */}
      <PageSheet pageNumber={1} totalEstimate={4} fontStyle={fontStyle}>
        <div className="mb-6 leading-tight">
          <p className="font-bold text-base">{data.corporationName}</p>
          <p className="text-xs sm:text-sm text-slate-600">{data.principalOfficeAddress}</p>
        </div>

        <h2 className="text-center font-bold text-lg mb-6 tracking-wide">
          VERIFIED REQUEST FOR DISSOLUTION
        </h2>

        <div className="mb-6 text-xs sm:text-sm space-y-1">
          <p className="font-semibold">To:</p>
          <p className="font-bold">{data.secDirectorName}</p>
          <p>{data.secDepartment}</p>
          <div className="whitespace-pre-line text-slate-600">{data.secAddress}</div>
        </div>

        <p className="text-justify indent-10 mb-5">
          I, the undersigned authorized representative of <strong>{data.corporationName}</strong> respectfully request the voluntary dissolution of the corporation and state under oath as follows:
        </p>

        <div className="space-y-4 text-justify pl-4 text-xs sm:text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="font-semibold">1.</span>
            <p>
              The corporation <strong>{data.corporationName}</strong> with SEC Registration Number {data.secRegistrationNo} has its principal Office at {data.principalOfficeAddress} and official email address at {data.officialEmail}.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">2.</span>
            <p>
              I am {data.authorizedRepName}, director / corporate secretary of the corporation with office address at {data.authorizedRepAddress} is authorized by the corporation to file its verified request for dissolution.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">3.</span>
            <p>
              The corporation requests its voluntary dissolution and affirms that no creditor is affected, and the dissolution does not prejudice the rights of any creditor having a claim against the corporation.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">4.</span>
            <p>
              The dissolution of the corporation is due to the cessation of business operations and the mutual decision of the stockholders, who have determined that the continuation of the corporation is no longer viable or necessary. This decision was made after due consideration of the corporation’s current business condition and future prospects.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">5.</span>
            <div>
              <p>
                Notice of the meeting to approve the dissolution was sent to all stockholders on {data.noticeSentDate}, at least twenty (20) days prior to the meeting, {data.noticeDeliveryMethod}. The notice included the time, place and object of the meeting and was published thrice on {data.publicationDates} in <strong>{data.newspaperName}</strong>, a newspaper of general circulation in the Philippines. The notice stated that the purpose of the meeting was to vote on the dissolution of the corporation and included:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-0.5">
                <li>The agenda of the meeting;</li>
                <li>A proxy form; and</li>
                <li>The procedures for attendance and voting via remote communication or in absentia, if applicable.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageSheet>

      {/* PAGE 2: Points 6-11 with Stockholders Table & Publication Info */}
      <PageSheet pageNumber={2} totalEstimate={4} fontStyle={fontStyle}>
        <div className="space-y-4 text-justify pl-4 text-xs sm:text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="font-semibold">6.</span>
            <p>
              That on {data.meetingDateFormatted}, a joint meeting by the board of directors and stockholders was held at {data.meetingTime} on {data.meetingPlace}.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">7.</span>
            <p>
              Majority of the directors or trustees and the stockholders owning or controlling at least a majority of the outstanding capital stock including the holder of non-voting shares or majority of the members voted for the dissolution.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">8.</span>
            <div className="w-full">
              <p className="mb-2">The following stockholders and directors approved the dissolution:</p>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-left">Name</th>
                      <th className="p-2 border-r border-slate-300 text-center">Number of Shares (Shareholder)</th>
                      <th className="p-2 border-r border-slate-300 text-center">Director</th>
                      <th className="p-2 text-center">Vote on Dissolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stockholders.map((s) => (
                      <tr key={s.id} className="border-b border-slate-200 last:border-none">
                        <td className="p-2 border-r border-slate-200 font-medium">{s.name}</td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          {s.shares} ({s.sharePercentage})
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">{s.directorRole}</td>
                        <td className="p-2 text-center font-semibold text-emerald-700">{s.vote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">9.</span>
            <p>
              The aforementioned stockholders and directors are the duly elected and serving officers and stockholders of record as of the meeting date.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">10.</span>
            <div>
              <p className="mb-1">The following publication details are as follows:</p>
              <div className="pl-4 space-y-1">
                <p>a) Name of Newspaper: <strong>{data.newspaperName}</strong></p>
                <p>b) Name of Publisher: {data.publisherName}</p>
                <p>c) Principal Office of Publisher: {data.publisherOfficeAddress}</p>
                <p>d) Area of Circulation: {data.circulationArea}</p>
                <p>e) Date of Publication: {data.publicationDates}</p>
                <p>f) Contents of Notice: Please see attached copy of publication</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="font-semibold">11.</span>
            <p>The corporation affirms that it has no pending case involving intra-corporate disputes.</p>
          </div>
        </div>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — SIGNATORY PAGE SEPARATED ON NEXT PAGE" />

      {/* PAGE 3: Signatory Block for Verified Request */}
      <PageSheet pageNumber={3} totalEstimate={4} fontStyle={fontStyle} isSignatoryPage={true}>
        <div className="pt-6">
          <p className="text-justify mb-16">
            IN WITNESS WHEREOF, I have hereunto set my hand this ___ day of ___________, 20___ at {data.executionCity || '___________'}.
          </p>

          <div className="border-t border-slate-900 pt-2 w-80">
            <p className="font-bold">{data.authorizedRepName}</p>
            <p className="text-sm text-slate-600">{data.authorizedRepTitle || 'Corp. Secretary / Authorized Representative'}</p>
            <p className="text-sm font-semibold">{data.corporationName}</p>
          </div>
        </div>
      </PageSheet>

      <PageBreakDivider title="PAGE BREAK — DEDICATED VERIFICATION & NOTARIAL JURAT PAGE" />

      {/* PAGE 4: Dedicated Verification Page */}
      <PageSheet pageNumber={4} totalEstimate={4} fontStyle={fontStyle} isSignatoryPage={true}>
        <h2 className="text-center font-bold text-lg mb-8 tracking-wide">
          VERIFICATION
        </h2>

        <p className="text-justify indent-10 mb-6">
          I, <strong>{data.authorizedRepName}</strong>, of legal age, Filipino, and residing at {data.corporateSecretaryAddress}, after having been duly sworn in accordance with law, depose and state:
        </p>

        <div className="space-y-4 pl-4 text-justify mb-8">
          <div className="flex gap-3">
            <span className="font-semibold">1.</span>
            <p>I am the corporate secretary of <strong>{data.corporationName}</strong>, and authorized to file this Verified Request for Dissolution;</p>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold">2.</span>
            <p>I have read and understood the contents of this Verified Request, and the same are true and correct of my own personal knowledge and/or based on authentic documents.</p>
          </div>
        </div>

        <p className="text-justify mb-12">
          IN WITNESS WHEREOF, I have hereunto set my hand this __________, at {data.executionCity || '________________'}.
        </p>

        <div className="flex flex-col items-end mb-12 pr-4">
          <div className="w-80 text-center">
            <div className="border-b border-slate-900 pb-1 mb-1 font-bold">
              {data.authorizedRepName}
            </div>
            <div className="text-sm">Corporate Secretary</div>
          </div>
        </div>

        <p className="text-justify mb-2">
          SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiant having exhibited to me a valid government-issued ID:
        </p>
        <p className="mb-6">
          ID No. {data.corporateSecretaryTin || '_______________'}; Date/Place Issued: _________________________.
        </p>

        <NotaryBlock data={data} />
      </PageSheet>
    </>
  );
}
