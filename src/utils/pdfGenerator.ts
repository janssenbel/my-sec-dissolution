import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DissolutionFormData, DocumentType } from '../types/dissolution';

// Page dimensions in points (72 points = 1 inch)
// Letter: 8.5 x 11 in = 612 x 792 pt
// Legal: 8.5 x 14 in = 612 x 1008 pt
// A4: 210 x 297 mm = 595.28 x 841.89 pt
function getFormatName(pageSize: 'LETTER' | 'LEGAL' | 'A4'): 'letter' | 'legal' | 'a4' {
  switch (pageSize) {
    case 'A4':
      return 'a4';
    case 'LEGAL':
      return 'legal';
    case 'LETTER':
    default:
      return 'letter';
  }
}

function getDocumentFilename(type: DocumentType, corpName: string): string {
  const cleanCorp = (corpName || 'DRAGON_PUFF_INC')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/__+/g, '_');

  const baseMap: Record<DocumentType, string> = {
    forum_shopping: '1_VERIFICATION_AGAINST_FORUM_SHOPPING',
    sec_cert: '2_SECRETARYS_CERTIFICATE',
    directors_cert: '3_DIRECTORS_CERTIFICATE',
    affidavit: '4_AFFIDAVIT_OF_NON_PREJUDICE',
    verified_request: '5_VERIFIED_REQUEST_FOR_DISSOLUTION',
  };

  return `${cleanCorp}_${baseMap[type]}.pdf`;
}

/**
 * Prints a paragraph with full justification.
 * If indent > 0, the first line is indented.
 * All intermediate lines are justified across the printable width,
 * and the last line is naturally left-aligned according to standard typography.
 */
function printJustifiedPara(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  indent: number = 0,
  lineHeightFactor: number = 1.35
): number {
  const fontSize = doc.getFontSize();
  const lineHeight = fontSize * lineHeightFactor;

  if (indent > 0) {
    const firstLineArr = doc.splitTextToSize(text, maxWidth - indent);
    if (firstLineArr.length <= 1) {
      doc.text(text, x + indent, y);
      return y + lineHeight;
    }

    const firstLine = firstLineArr[0];
    const remainder = text.slice(firstLine.length).trim();

    doc.text(firstLine, x + indent, y, { align: 'justify', maxWidth: maxWidth - indent });
    y += lineHeight;

    const remainingLines = doc.splitTextToSize(remainder, maxWidth);
    doc.text(remainder, x, y, { align: 'justify', maxWidth: maxWidth, lineHeightFactor });
    return y + remainingLines.length * lineHeight;
  } else {
    const lines = doc.splitTextToSize(text, maxWidth);
    if (lines.length <= 1) {
      doc.text(text, x, y);
      return y + lineHeight;
    }
    doc.text(text, x, y, { align: 'justify', maxWidth: maxWidth, lineHeightFactor });
    return y + lines.length * lineHeight;
  }
}

/**
 * Prints a numbered paragraph where the number (e.g. "1.") sits at x,
 * and the body text is indented by hangingIndent and fully justified across the remaining width.
 */
function printNumberedJustified(
  doc: jsPDF,
  num: string,
  body: string,
  x: number,
  y: number,
  maxWidth: number,
  hangingIndent: number = 22,
  lineHeightFactor: number = 1.35
): number {
  const fontSize = doc.getFontSize();
  const lineHeight = fontSize * lineHeightFactor;
  const textWidth = maxWidth - hangingIndent;

  doc.text(num, x, y);

  const lines = doc.splitTextToSize(body, textWidth);
  if (lines.length <= 1) {
    doc.text(body, x + hangingIndent, y);
    return y + lineHeight;
  }

  doc.text(body, x + hangingIndent, y, { align: 'justify', maxWidth: textWidth, lineHeightFactor });
  return y + lines.length * lineHeight;
}

// Helper to draw Notary Block in PDF
function drawNotaryBlock(doc: jsPDF, data: DissolutionFormData, startY: number, margin: number, contentWidth: number): number {
  let y = startY;
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';

  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text('NOTARY PUBLIC', margin + contentWidth, y, { align: 'right' });
  y += 24;

  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text(`Doc. No. ${data.docNo || '____'};`, margin, y);
  y += 15;
  doc.text(`Page No. ${data.pageNo || '____'};`, margin, y);
  y += 15;
  doc.text(`Book No. ${data.bookNo || '____'};`, margin, y);
  y += 15;
  doc.text(`Series of ${data.seriesYear || '2026'}.`, margin, y);
  y += 20;

  return y;
}

// -------------------------------------------------------------
// 1. Forum Shopping PDF
// -------------------------------------------------------------
function buildForumShoppingPdf(data: DissolutionFormData): jsPDF {
  const format = getFormatName(data.pageSize);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';
  const margin = 60;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  // PAGE 1: Header, Title, Deposition, Points 1-3
  let y = 70;
  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  doc.text('REPUBLIC OF THE PHILIPPINES', margin, y);
  y += 16;
  doc.text('                              ) S.S.', margin, y);
  y += 36;

  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text('VERIFICATION AND CERTIFICATION AGAINST FORUM SHOPPING', doc.internal.pageSize.getWidth() / 2, y, {
    align: 'center',
  });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  const preamble = `I, ${data.corporateSecretaryName}, of legal age, ${data.corporateSecretaryNationality} and with address at ${data.corporateSecretaryAddress}, on oath, state that:`;
  y = printJustifiedPara(doc, preamble, margin, y, contentWidth, 30);
  y += 14;

  const p1 = `I am the Corporate Secretary of ${data.corporationName}, duly authorized to execute this Verification pursuant to my authority as evidenced by the attached Directors Certificate dated ${data.directorsCertDate || data.meetingDateFormatted}.`;
  y = printNumberedJustified(doc, '1.', p1, margin, y, contentWidth);
  y += 14;

  const p2 = `I have caused the preparation of the foregoing Petition and read all the allegations in the Petition. I attest that the factual allegations therein are true and correct based on my own knowledge and on authentic documents.`;
  y = printNumberedJustified(doc, '2.', p2, margin, y, contentWidth);
  y += 14;

  const p3 = `That I have not commenced any action or filed any petition involving the same subject matter or issues in any court, tribunal or agency; to the best of my knowledge, no such action is pending therein; (if there is such other pending action, a complete statement of its present status;) and if I should learn that the same or similar action has been filed or is pending, I shall report that fact within five (5) days from such knowledge to the Company Registration and Monitoring Department (CRMD).`;
  y = printNumberedJustified(doc, '3.', p3, margin, y, contentWidth);

  // =========================================================
  // PAGE 2: SEPARATED SIGNATORY PAGE
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  // Affiant signature on right
  const sigX = margin + contentWidth - 10;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text(data.corporateSecretaryName, sigX, y, { align: 'right' });
  y += 15;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('Corporate Secretary', sigX, y, { align: 'right' });
  y += 45;

  // Jurat (Justified)
  const jurat = `SUBSCRIBED AND SWORN to before me in ${data.executionCity || '_________________'}, this ________ day of _______________, ${data.executionMonthYear || '2026'} affiant exhibiting to me her Tax Identification Number ${data.corporateSecretaryTin || '____________________'}.`;
  y = printJustifiedPara(doc, jurat, margin, y, contentWidth, 30);
  y += 28;

  drawNotaryBlock(doc, data, y, margin, contentWidth);

  return doc;
}

// -------------------------------------------------------------
// 2. Secretary's Certificate PDF
// -------------------------------------------------------------
function buildSecretaryCertPdf(data: DissolutionFormData): jsPDF {
  const format = getFormatName(data.pageSize);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';
  const margin = 60;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  // PAGE 1
  let y = 70;
  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  doc.text('Republic of the Philippines', margin, y);
  y += 16;
  doc.text('                              ) S.S.', margin, y);
  y += 36;

  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text("SECRETARY'S CERTIFICATE", doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  const p1 = `I, ${data.corporateSecretaryName}, of legal age, ${data.corporateSecretaryNationality} and with address at ${data.corporateSecretaryAddress}, after having been sworn to in accordance with law hereby depose and state that:`;
  y = printJustifiedPara(doc, p1, margin, y, contentWidth, 30);
  y += 16;

  const p2 = `I am the duly elected and qualified Corporate Secretary of ${data.corporationName} a corporation duly registered with the Commission, with principal office at ${data.principalOfficeAddress}.`;
  y = printJustifiedPara(doc, p2, margin, y, contentWidth, 30);
  y += 16;

  const p3 = `To the best of my knowledge, from the date of approval of the dissolution by the Board of Directors in a meeting held on ${data.meetingDateFormatted} and the Stockholders in a meeting held on ${data.meetingDateFormatted} up to the date of filing of dissolution with the Commission, no action or proceeding has been filed or is pending before any Court involving an intra- corporate dispute and/or any claim by any person or group against the board of directors, individual director and/or major corporate officer/s of the Corporation as its duly elected and/or appointed director or officer or vice versa.`;
  y = printJustifiedPara(doc, p3, margin, y, contentWidth, 30);

  // =========================================================
  // PAGE 2: SEPARATED SIGNATORY PAGE
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  const witness = `IN WITNESS WHEREOF, I hereby signed this _____ day of ____________ 20___ at ${data.executionCity || '____________________________________'}.`;
  y = printJustifiedPara(doc, witness, margin, y, contentWidth, 30);
  y += 40;

  const sigX = margin + contentWidth - 10;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text(data.corporateSecretaryName, sigX, y, { align: 'right' });
  y += 15;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('Corporate Secretary', sigX, y, { align: 'right' });
  y += 45;

  const jurat = `SUBSCRIBED AND SWORN to before me on this _____ day of ____________ 20___ in ${data.executionCity || '_________________________'} affiant/s exhibited to me his/her Identification Documents/Government issued ID/s as follows: ${data.corporateSecretaryId || data.corporateSecretaryTin}.`;
  y = printJustifiedPara(doc, jurat, margin, y, contentWidth, 30);
  y += 28;

  drawNotaryBlock(doc, data, y, margin, contentWidth);

  return doc;
}

// -------------------------------------------------------------
// 3. Directors' Certificate PDF
// -------------------------------------------------------------
function buildDirectorsCertPdf(data: DissolutionFormData): jsPDF {
  const format = getFormatName(data.pageSize);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';
  const margin = 60;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  // PAGE 1: Joint Meeting & Resolutions
  let y = 70;
  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text("DIRECTORS' CERTIFICATE", doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  const p1 = `We, the undersigned members of the Board of Directors and Corporate Secretary of ${data.corporationName}, a corporation duly organized and existing under the laws of the Republic of the Philippines, with SEC Registration No. ${data.secRegistrationNo} and principal office at ${data.principalOfficeAddress}, do hereby certify:`;
  y = printJustifiedPara(doc, p1, margin, y, contentWidth, 30);
  y += 16;

  const p2 = `That at a joint meeting of the Board of Directors and Stockholders of the Corporation held on ${data.meetingDateFormatted} at ${data.meetingTime} in its principal office, at which a quorum of both the Board of Directors and Stockholders was present and acted throughout, the following resolutions were unanimously adopted:`;
  y = printJustifiedPara(doc, p2, margin, y, contentWidth, 30);
  y += 20;

  const r1 = `“RESOLVED, that the Corporation shall be dissolved pursuant to the provisions of the Revised Corporation Code of the Philippines;`;
  y = printJustifiedPara(doc, r1, margin + 20, y, contentWidth - 20);
  y += 14;

  const r2 = `RESOLVED FURTHER, that the Stockholders, representing at least two-thirds (2/3) of the outstanding capital stock of the Corporation, have approved and confirmed the foregoing resolution of the Board of Directors to dissolve the Corporation;`;
  y = printJustifiedPara(doc, r2, margin + 20, y, contentWidth - 20);
  y += 14;

  const r3 = `RESOLVED FINALLY, that ${data.authorizedRepName}, with office address at ${data.authorizedRepAddress}, be, as is hereby, designated as the authorized representative of the Corporation to file and process with the Securities and Exchange Commission the Verified Request for Dissolution and to perform all acts necessary and incidental to the said dissolution;”`;
  y = printJustifiedPara(doc, r3, margin + 20, y, contentWidth - 20);

  // =========================================================
  // PAGE 2: SEPARATED SIGNATORY PAGE (Board Signatures)
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  const witness = `IN WITNESS WHEREOF, we have hereunto set our hands this ______ day of __________, ${data.executionMonthYear || '2026'} at ${data.executionCity || '_______________'}.`;
  y = printJustifiedPara(doc, witness, margin, y, contentWidth);
  y += 40;

  // Directors Grid
  const colWidth = contentWidth / 2;
  data.stockholders.forEach((s, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cellX = margin + col * colWidth + (col === 0 ? 0 : 20);
    const cellY = y + row * 65;

    doc.setFont(font, 'bold');
    doc.setFontSize(11);
    doc.text(s.name, cellX, cellY);
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.text('Director / Stockholder', cellX, cellY + 14);
    doc.text(`TIN: ${s.tin}`, cellX, cellY + 28);
  });

  const numRows = Math.ceil(data.stockholders.length / 2);
  y += numRows * 65 + 30;

  // Attested By Corporate Secretary
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text('ATTESTED BY:', margin, y);
  y += 24;
  doc.text(data.corporateSecretaryName, margin, y);
  y += 14;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('Corporate Secretary', margin, y);
  y += 14;
  doc.text(`TIN: ${data.corporateSecretaryTin}`, margin, y);

  // =========================================================
  // PAGE 3: SEPARATED NOTARIAL ACKNOWLEDGMENT
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text('ACKNOWLEDGMENT', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  doc.text('REPUBLIC OF THE PHILIPPINES )', margin, y);
  y += 16;
  doc.text('___________________________ ) S.S.', margin, y);
  y += 28;

  const ackIntro = `BEFORE ME, a Notary Public for and in the above jurisdiction, this ___ day of _________, ${data.executionMonthYear || '2026'}, personally appeared the following persons with their respective Competent Evidence of Identity:`;
  y = printJustifiedPara(doc, ackIntro, margin, y, contentWidth, 30);
  y += 16;

  // Competent Evidence Table (TIN)
  const col1 = margin;
  const col2 = margin + 210;
  const col3 = margin + 365;
  doc.setFont(font, 'bold');
  doc.setFontSize(10);
  doc.text('Name', col1, y);
  doc.text('Competent Evidence (TIN)', col2, y);
  doc.text('Date / Place Issued', col3, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 16;

  doc.setFont(font, 'normal');
  const seen = new Set<string>();
  const evidenceRows: { name: string; tin: string }[] = [];
  for (const s of data.stockholders) {
    const norm = (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      evidenceRows.push({ name: s.name, tin: s.tin });
    }
  }
  if (data.corporateSecretaryName) {
    const normSec = data.corporateSecretaryName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normSec && !seen.has(normSec)) {
      seen.add(normSec);
      evidenceRows.push({ name: data.corporateSecretaryName, tin: data.corporateSecretaryTin });
    }
  }

  evidenceRows.forEach((person) => {
    doc.text(person.name, col1, y);
    doc.text(`TIN: ${person.tin || ''}`, col2, y);
    doc.text('', col3, y);
    y += 18;
  });

  doc.line(margin, y - 4, margin + contentWidth, y - 4);
  y += 20;

  doc.setFontSize(11);
  const ackBody = `known to me and to me known to be the same persons who executed the foregoing instrument and they acknowledged to me that the same is their free and voluntary act and deed as well as of the corporation they represent.`;
  y = printJustifiedPara(doc, ackBody, margin, y, contentWidth);
  y += 18;

  const ack2 = `IN WITNESS WHEREOF, I have hereunto set my hand and affixed my notarial seal on the date and at the place above written.`;
  y = printJustifiedPara(doc, ack2, margin, y, contentWidth);
  y += 30;

  drawNotaryBlock(doc, data, y, margin, contentWidth);

  return doc;
}

// -------------------------------------------------------------
// 4. Affidavit PDF
// -------------------------------------------------------------
function buildAffidavitPdf(data: DissolutionFormData): jsPDF {
  const format = getFormatName(data.pageSize);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';
  const margin = 60;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  // PAGE 1
  let y = 70;
  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text('AFFIDAVIT', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  const p1 = `We, ${data.presidentName}, of legal age, ${data.presidentNationality}, and residing at ${data.presidentAddress}, in my capacity as the President, and ${data.treasurerName}, of legal age, ${data.treasurerNationality}, and residing at ${data.treasurerAddress}, in my capacity as the Treasurer, of ${data.corporationName}, a corporation duly organized and existing under Philippine laws with principal office at ${data.principalOfficeAddress}, after having been duly sworn to in accordance with law, do hereby depose and state that:`;
  y = printJustifiedPara(doc, p1, margin, y, contentWidth, 30);
  y += 18;

  const num1 = `The dissolution of the corporation is not prejudicial to the interest of the creditors of the corporation;`;
  y = printNumberedJustified(doc, '1.', num1, margin, y, contentWidth);
  y += 16;

  const num2 = `From the time of publication of the notice of dissolution up to the filing of the dissolution with the Securities and Exchange Commission, there has been no opposition from any of the creditors of the corporation.`;
  y = printNumberedJustified(doc, '2.', num2, margin, y, contentWidth);

  // =========================================================
  // PAGE 2: SEPARATED SIGNATORY PAGE
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  const witness = `IN WITNESS WHEREOF, we have hereunto set our hands this ___ day of _______, 20___ at ${data.executionCity || '________________'}, Philippines.`;
  y = printJustifiedPara(doc, witness, margin, y, contentWidth, 30);
  y += 40;

  // President and Treasurer Signatures side by side
  const colW = contentWidth / 2;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text(data.presidentName, margin, y);
  doc.text(data.treasurerName, margin + colW, y);
  y += 14;

  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('President', margin, y);
  doc.text('Treasurer', margin + colW, y);
  y += 36;

  const jurat = `SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiants exhibiting to me their competent evidence of identity:`;
  y = printJustifiedPara(doc, jurat, margin, y, contentWidth);
  y += 16;

  // Clean evidence table
  const col1 = margin;
  const col2 = margin + 180;
  const col3 = margin + 320;
  doc.setFont(font, 'bold');
  doc.setFontSize(10);
  doc.text('Name', col1, y);
  doc.text('TIN/ID no', col2, y);
  doc.text('Date and Place Issued', col3, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 16;

  doc.setFont(font, 'normal');
  doc.text(data.presidentName, col1, y);
  doc.text(data.presidentTin || '', col2, y);
  doc.text(data.presidentId || '', col3, y);
  y += 18;

  doc.text(data.treasurerName, col1, y);
  doc.text(data.treasurerTin || '', col2, y);
  doc.text(data.treasurerId || '', col3, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 30;

  drawNotaryBlock(doc, data, y, margin, contentWidth);

  return doc;
}

// -------------------------------------------------------------
// 5. Verified Request for Dissolution PDF
// -------------------------------------------------------------
function buildVerifiedRequestPdf(data: DissolutionFormData): jsPDF {
  const format = getFormatName(data.pageSize);
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const font = data.fontFamily === 'Arial' ? 'helvetica' : 'times';
  const margin = 54;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  // PAGE 1: Header, Addressee, Points 1-5
  let y = 60;
  doc.setFont(font, 'bold');
  doc.setFontSize(12);
  doc.text(data.corporationName, margin, y);
  y += 14;
  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  doc.text(data.principalOfficeAddress, margin, y);
  y += 24;

  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text('VERIFIED REQUEST FOR DISSOLUTION', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 26;

  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('To:', margin, y);
  y += 14;
  doc.setFont(font, 'bold');
  doc.text(data.secDirectorName, margin, y);
  y += 14;
  doc.setFont(font, 'normal');
  doc.text(data.secDepartment, margin, y);
  y += 14;
  const secLines = doc.splitTextToSize(data.secAddress.replace(/\n/g, ', '), contentWidth);
  for (const sl of secLines) {
    doc.text(sl, margin, y);
    y += 13;
  }
  y += 14;

  const pre = `I, the undersigned authorized representative of ${data.corporationName} respectfully request the voluntary dissolution of the corporation and state under oath as follows:`;
  y = printJustifiedPara(doc, pre, margin, y, contentWidth, 25);
  y += 12;

  const pt1 = `The corporation ${data.corporationName} with SEC Registration Number ${data.secRegistrationNo} has its principal Office at ${data.principalOfficeAddress} and official email address at ${data.officialEmail}.`;
  y = printNumberedJustified(doc, '1.', pt1, margin, y, contentWidth);
  y += 10;

  const pt2 = `I am ${data.authorizedRepName}, director / corporate secretary of the corporation with office address at ${data.authorizedRepAddress} is authorized by the corporation to file its verified request for dissolution.`;
  y = printNumberedJustified(doc, '2.', pt2, margin, y, contentWidth);
  y += 10;

  const pt3 = `The corporation requests its voluntary dissolution and affirms that no creditor is affected, and the dissolution does not prejudice the rights of any creditor having a claim against the corporation.`;
  y = printNumberedJustified(doc, '3.', pt3, margin, y, contentWidth);
  y += 10;

  const pt4 = `The dissolution of the corporation is due to the cessation of business operations and the mutual decision of the stockholders, who have determined that the continuation of the corporation is no longer viable or necessary. This decision was made after due consideration of the corporation’s current business condition and future prospects.`;
  y = printNumberedJustified(doc, '4.', pt4, margin, y, contentWidth);
  y += 10;

  const pt5 = `Notice of the meeting to approve the dissolution was sent to all stockholders on ${data.noticeSentDate}, at least twenty (20) days prior to the meeting, ${data.noticeDeliveryMethod}. The notice included the time, place and object of the meeting and was published thrice on ${data.publicationDates} in ${data.newspaperName}, a newspaper of general circulation in the Philippines. The notice stated that the purpose of the meeting was to vote on the dissolution of the corporation and included:`;
  y = printNumberedJustified(doc, '5.', pt5, margin, y, contentWidth);
  y += 6;
  doc.text('   a. The agenda of the meeting;', margin + 22, y);
  y += 14;
  doc.text('   b. A proxy form; and', margin + 22, y);
  y += 14;
  doc.text('   c. The procedures for attendance and voting via remote communication or in absentia, if applicable.', margin + 22, y);
  y += 14;

  // =========================================================
  // PAGE 2: Points 6-11 with Stockholders Table & Publication
  // =========================================================
  doc.addPage(format, 'p');
  y = 60;

  const pt6 = `That on ${data.meetingDateFormatted}, a joint meeting by the board of directors and stockholders was held at ${data.meetingTime} on ${data.meetingPlace}.`;
  y = printNumberedJustified(doc, '6.', pt6, margin, y, contentWidth);
  y += 10;

  const pt7 = `Majority of the directors or trustees and the stockholders owning or controlling at least a majority of the outstanding capital stock including the holder of non-voting shares or majority of the members voted for the dissolution.`;
  y = printNumberedJustified(doc, '7.', pt7, margin, y, contentWidth);
  y += 12;

  doc.text('8. The following stockholders and directors approved the dissolution:', margin, y);
  y += 16;

  // Table
  const tCol1 = margin;
  const tCol2 = margin + 170;
  const tCol3 = margin + 310;
  const tCol4 = margin + 410;

  doc.setFont(font, 'bold');
  doc.setFontSize(9);
  doc.text('Name', tCol1, y);
  doc.text('Number of Shares (Shareholder)', tCol2, y);
  doc.text('Director', tCol3, y);
  doc.text('Vote on Dissolution', tCol4, y);
  y += 5;
  doc.line(margin, y, margin + contentWidth, y);
  y += 14;

  doc.setFont(font, 'normal');
  data.stockholders.forEach((s) => {
    doc.text(s.name, tCol1, y);
    doc.text(`${s.shares} (${s.sharePercentage})`, tCol2, y);
    doc.text(s.directorRole, tCol3, y);
    doc.text(s.vote, tCol4, y);
    y += 16;
  });
  doc.line(margin, y - 2, margin + contentWidth, y - 2);
  y += 14;

  const pt9 = `The aforementioned stockholders and directors are the duly elected and serving officers and stockholders of record as of the meeting date.`;
  y = printNumberedJustified(doc, '9.', pt9, margin, y, contentWidth);
  y += 12;

  doc.text('10. The following publication details are as follows:', margin, y);
  y += 14;
  doc.text(`   a) Name of Newspaper: ${data.newspaperName}`, margin, y);
  y += 14;
  doc.text(`   b) Name of Publisher: ${data.publisherName}`, margin, y);
  y += 14;
  doc.text(`   c) Principal Office of Publisher: ${data.publisherOfficeAddress}`, margin, y);
  y += 14;
  doc.text(`   d) Area of Circulation: ${data.circulationArea}`, margin, y);
  y += 14;
  doc.text(`   e) Date of Publication: ${data.publicationDates}`, margin, y);
  y += 14;
  doc.text('   f) Contents of Notice: Please see attached copy of publication', margin, y);
  y += 16;

  const pt11 = `The corporation affirms that it has no pending case involving intra-corporate disputes.`;
  y = printNumberedJustified(doc, '11.', pt11, margin, y, contentWidth);

  // =========================================================
  // PAGE 3: SEPARATED SIGNATORY PAGE
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  const witness = `IN WITNESS WHEREOF, I have hereunto set my hand this ___ day of ___________, 20___ at ${data.executionCity || '___________'}.`;
  y = printJustifiedPara(doc, witness, margin, y, contentWidth);
  y += 40;

  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text(data.authorizedRepName, margin, y);
  y += 14;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text(data.authorizedRepTitle || 'Corp. Secretary / Authorized Representative', margin, y);
  y += 14;
  doc.setFont(font, 'bold');
  doc.text(data.corporationName, margin, y);

  // =========================================================
  // PAGE 4: DEDICATED VERIFICATION & NOTARIAL JURAT PAGE
  // =========================================================
  doc.addPage(format, 'p');
  y = 80;

  doc.setFont(font, 'bold');
  doc.setFontSize(13);
  doc.text('VERIFICATION', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 32;

  doc.setFont(font, 'normal');
  doc.setFontSize(11);
  const ver1 = `I, ${data.authorizedRepName}, of legal age, Filipino, and residing at ${data.corporateSecretaryAddress}, after having been duly sworn in accordance with law, depose and state:`;
  y = printJustifiedPara(doc, ver1, margin, y, contentWidth, 30);
  y += 16;

  const verPt1 = `I am the corporate secretary of ${data.corporationName}, and authorized to file this Verified Request for Dissolution;`;
  y = printNumberedJustified(doc, '1.', verPt1, margin, y, contentWidth);
  y += 14;

  const verPt2 = `I have read and understood the contents of this Verified Request, and the same are true and correct of my own personal knowledge and/or based on authentic documents.`;
  y = printNumberedJustified(doc, '2.', verPt2, margin, y, contentWidth);
  y += 30;

  const verWitness = `IN WITNESS WHEREOF, I have hereunto set my hand this __________, at ${data.executionCity || '________________'}.`;
  y = printJustifiedPara(doc, verWitness, margin, y, contentWidth);
  y += 40;

  const vSigX = margin + contentWidth - 10;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text(data.authorizedRepName, vSigX, y, { align: 'right' });
  y += 14;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.text('Corporate Secretary', vSigX, y, { align: 'right' });
  y += 40;

  const verJurat = `SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiant having exhibited to me a valid government-issued ID:\nID No. ${data.corporateSecretaryTin || '_______________'}; Date/Place Issued: _________________________.`;
  y = printJustifiedPara(doc, verJurat, margin, y, contentWidth, 30);
  y += 24;

  drawNotaryBlock(doc, data, y, margin, contentWidth);

  return doc;
}

// -------------------------------------------------------------
// Generator Dispatcher
// -------------------------------------------------------------
export function generatePdfDocument(type: DocumentType, data: DissolutionFormData): jsPDF {
  switch (type) {
    case 'forum_shopping':
      return buildForumShoppingPdf(data);
    case 'sec_cert':
      return buildSecretaryCertPdf(data);
    case 'directors_cert':
      return buildDirectorsCertPdf(data);
    case 'affidavit':
      return buildAffidavitPdf(data);
    case 'verified_request':
      return buildVerifiedRequestPdf(data);
  }
}

/**
 * Downloads a single document as a crisp vector PDF with justified text
 */
export async function downloadCurrentPreviewAsPdf(
  _previewContainer: HTMLElement | null,
  data: DissolutionFormData,
  docType: DocumentType
): Promise<void> {
  const doc = generatePdfDocument(docType, data);
  const filename = getDocumentFilename(docType, data.corporationName);
  doc.save(filename);
}

/**
 * Generates all 5 documents as PDFs with justified text and packages them in a ZIP archive
 */
export async function downloadAllDocumentsPdfZip(
  data: DissolutionFormData,
  _renderDocToElements?: any,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<void> {
  const zip = new JSZip();

  const docTypes: DocumentType[] = [
    'forum_shopping',
    'sec_cert',
    'directors_cert',
    'affidavit',
    'verified_request',
  ];

  const total = docTypes.length;

  for (let i = 0; i < docTypes.length; i++) {
    const type = docTypes[i];
    if (onProgress) {
      onProgress(i + 1, total, type);
    }

    const doc = generatePdfDocument(type, data);
    const filename = getDocumentFilename(type, data.corporationName);
    const pdfBlob = doc.output('blob');
    zip.file(filename, pdfBlob);
  }

  // Add README
  const readme = `PHILIPPINE SEC CORPORATE DISSOLUTION PDF PACKAGE
==================================================
Corporation Name: ${data.corporationName}
SEC Registration No: ${data.secRegistrationNo}
Paper Format: ${data.pageSize} (${data.fontFamily})
Alignment: Fully Justified (Legal Standard)
Generated Date: ${new Date().toLocaleDateString()}

INCLUDED PDF DOCUMENTS:
1. 1_VERIFICATION_AGAINST_FORUM_SHOPPING.pdf
   - Page 1: Deposition and Allegations (Justified)
   - Page 2: Dedicated Signatory Page & Jurat (Justified)

2. 2_SECRETARYS_CERTIFICATE.pdf
   - Page 1: Certification regarding no intra-corporate dispute (Justified)
   - Page 2: Dedicated Signatory Page & Jurat (Justified)

3. 3_DIRECTORS_CERTIFICATE.pdf
   - Page 1: Joint Meeting & Dissolution Resolutions (Justified)
   - Page 2: Dedicated Signatory Page (Board of Directors & Attestation)
   - Page 3: Dedicated Notarial Acknowledgment Page (Justified)

4. 4_AFFIDAVIT_OF_NON_PREJUDICE.pdf
   - Page 1: Joint Affidavit of President and Treasurer regarding creditors (Justified)
   - Page 2: Dedicated Signatory Page, Competent Evidence Table & Jurat (Justified)

5. 5_VERIFIED_REQUEST_FOR_DISSOLUTION.pdf
   - Pages 1-2: 11-Point SEC Petition with Stockholders Voting Table & Publication details (Justified)
   - Page 3: Dedicated Signatory Page (Authorized Representative)
   - Page 4: Dedicated Verification & Notarial Jurat Page (Justified)

All documents feature full legal justification and separated signatory pages.
`;
  zip.file('README_SEC_PDF_PACKAGE.txt', readme);

  const cleanCorp = (data.corporationName || 'DRAGON_PUFF_INC')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/__+/g, '_');

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `SEC_Dissolution_PDFs_${cleanCorp}.zip`);
}
