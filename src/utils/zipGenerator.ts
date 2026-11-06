import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DissolutionFormData, DocumentType } from '../types/dissolution';
import { generateDocxBlob } from './docxGenerator';

export async function downloadAllDocumentsZip(
  data: DissolutionFormData,
  onProgress?: (current: number, total: number, docName: string) => void
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
    const { blob, filename } = await generateDocxBlob(type, data);
    zip.file(filename, blob);
  }

  // Also include a README.txt inside the zip explaining the package
  const readmeContent = `PHILIPPINE SEC CORPORATE DISSOLUTION DOCUMENTS
==================================================
Corporation Name: ${data.corporationName}
SEC Registration No: ${data.secRegistrationNo}
Paper Size: ${data.pageSize} (${data.fontFamily})
Generated Date: ${new Date().toLocaleDateString()}

INCLUDED MICROSOFT WORD (.DOCX) FILES:
1. 1_VERIFICATION_AGAINST_FORUM_SHOPPING.docx
   - Page 1: Deposition and Forum Shopping affirmations
   - Page 2: Dedicated Signatory Page & Notarial Jurat

2. 2_SECRETARYS_CERTIFICATE.docx
   - Page 1: Certification regarding no pending intra-corporate dispute
   - Page 2: Dedicated Signatory Page & Notarial Jurat

3. 3_DIRECTORS_CERTIFICATE.docx
   - Page 1: Joint Meeting & Dissolution Resolutions
   - Page 2: Dedicated Signatory Page (Board of Directors & Attestation)
   - Page 3: Notarial Acknowledgment Page

4. 4_AFFIDAVIT_OF_NON_PREJUDICE.docx
   - Page 1: Joint Affidavit of President and Treasurer regarding creditors
   - Page 2: Dedicated Signatory Page, Competent Evidence Table & Notary Jurat

5. 5_VERIFIED_REQUEST_FOR_DISSOLUTION.docx
   - Pages 1-2: 11-Point SEC Petition with Stockholders Voting Table & Publication details
   - Page 3: Dedicated Signatory Page (Authorized Representative)
   - Page 4: Dedicated Verification & Notarial Jurat Page

NOTE ON SIGNATORY PAGES:
As requested, all signatory blocks and notarial jurats / acknowledgments
are strictly placed on subsequent separate pages via standard Word Page Breaks.
`;

  zip.file('README_SEC_DISSOLUTION_PACKAGE.txt', readmeContent);

  const cleanCorp = data.corporationName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `SEC_Dissolution_Docs_${cleanCorp}.zip`);
}
