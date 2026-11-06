export interface StockholderDirector {
  id: string;
  name: string;
  tin: string;
  shares: string;
  sharePercentage: string;
  directorRole: string; // e.g. "Chairman", "Member", "Director / Stockholder"
  vote: string; // e.g. "Yes"
  address?: string;
  governmentId?: string;
}

export interface DissolutionFormData {
  // Corporation details
  corporationName: string;
  secRegistrationNo: string;
  principalOfficeAddress: string;
  officialEmail: string;

  // Key officers
  corporateSecretaryName: string;
  corporateSecretaryNationality: string;
  corporateSecretaryAddress: string;
  corporateSecretaryTin: string;
  corporateSecretaryId: string;

  presidentName: string;
  presidentNationality: string;
  presidentAddress: string;
  presidentTin: string;
  presidentId: string;

  treasurerName: string;
  treasurerNationality: string;
  treasurerAddress: string;
  treasurerTin: string;
  treasurerId: string;

  // Authorized Representative for SEC filing (often the Corporate Secretary)
  authorizedRepName: string;
  authorizedRepTitle: string;
  authorizedRepAddress: string;

  // Board of Directors & Stockholders list
  stockholders: StockholderDirector[];

  // Meeting details
  meetingDateFormatted: string; // e.g. "June 25, 2026"
  meetingTime: string; // e.g. "10:00 am"
  meetingPlace: string; // e.g. "in its principal office" or full address
  noticeSentDate: string; // e.g. "January 2, 2026"
  noticeDeliveryMethod: string; // e.g. "by personal delivery, in accordance with the corporation's By-Laws"
  directorsCertDate: string; // e.g. "June 25, 2026"

  // Publication details
  newspaperName: string; // e.g. "PUBLIKO News Publishing"
  publisherName: string; // e.g. "Mark Anthony B. Caiña"
  publisherOfficeAddress: string; // e.g. "Unit 3014 Aurora Arcade, Alabang Zapote Road, Almanza Uno, Las Piñas City, Metro Manila"
  circulationArea: string; // e.g. "General Circulation in the Philippines"
  publicationDates: string; // e.g. "June 8, 15, and 22, 2026"

  // SEC Destination
  secDirectorName: string; // e.g. "GERARDO F. DEL ROSARIO"
  secDepartment: string; // e.g. "Company Registration and Monitoring Department (CRMD)"
  secAddress: string; // e.g. "Securities and Exchange Commission\n7907 Makati Avenue, Salcedo Village,\nBrgy. Bel-Air, Makati City, 1209"

  // Notarial & Execution Details
  executionCity: string; // e.g. "Parañaque City" or blank line
  executionDay: string; // e.g. "___" or specific day
  executionMonthYear: string; // e.g. "2026"
  notaryJurisdiction: string; // e.g. "Parañaque City" or "Makati City"
  docNo: string;
  pageNo: string;
  bookNo: string;
  seriesYear: string;

  // Document Styling Options
  fontFamily: 'Times New Roman' | 'Arial' | 'Bookman Old Style';
  pageSize: 'LETTER' | 'LEGAL' | 'A4';
  autoSyncMatchingNames?: boolean;
}

export const defaultDragonPuffData: DissolutionFormData = {
  corporationName: 'DRAGON PUFF INC.',
  secRegistrationNo: '2024040146113-02',
  principalOfficeAddress: '146 Dona Soledad Avenue Corner Peru Street Betterliving Subdivision Don Bosco, Parañaque City, 1700',
  officialEmail: 'liankimdelrosario@gmail.com',

  corporateSecretaryName: 'Lian Kim Padit Del Rosario',
  corporateSecretaryNationality: 'Filipino',
  corporateSecretaryAddress: 'B3 L6 Guijo St. Camella Sorrento Habay I, Bacoor City',
  corporateSecretaryTin: '773-441-472-000',
  corporateSecretaryId: 'TIN: 773-441-472-000',

  presidentName: 'DIANNE MARIE BALATAY SUAREZ',
  presidentNationality: 'Filipino',
  presidentAddress: 'Lot 8 Unit 8 El Dorado St. Betterliving Subd. Don Bosco Parañaque City',
  presidentTin: '240-455-785-000',
  presidentId: 'TIN: 240-455-785-000',

  treasurerName: 'LIAN KIM PADIT DEL ROSARIO',
  treasurerNationality: 'Filipino',
  treasurerAddress: 'B3 L6 Guijo St. Camella Sorrento Habay I, Bacoor City',
  treasurerTin: '773-441-472-000',
  treasurerId: 'TIN: 773-441-472-000',

  authorizedRepName: 'Lian Kim Padit Del Rosario',
  authorizedRepTitle: 'Corp. Secretary / Authorized Representative',
  authorizedRepAddress: '146 Dona Soledad Avenue Corner Peru Street Betterliving Subdivision Don Bosco, Parañaque City, 1700',

  stockholders: [
    {
      id: '1',
      name: 'DIANNE MARIE BALATAY SUAREZ',
      tin: '240-455-785-000',
      shares: '100,000',
      sharePercentage: '50%',
      directorRole: 'Chairman',
      vote: 'Yes',
      address: 'Lot 8 Unit 8 El Dorado St. Betterliving Subd. Don Bosco Parañaque City',
      governmentId: 'TIN: 240-455-785-000',
    },
    {
      id: '2',
      name: 'LIAN KIM PADIT DEL ROSARIO',
      tin: '773-441-472-000',
      shares: '100,000',
      sharePercentage: '50%',
      directorRole: 'Member',
      vote: 'Yes',
      address: 'B3 L6 Guijo St. Camella Sorrento Habay I, Bacoor City',
      governmentId: 'TIN: 773-441-472-000',
    },
  ],

  meetingDateFormatted: 'June 25, 2026',
  meetingTime: '10:00 am',
  meetingPlace: '146 Dona Soledad Avenue Corner Peru Street Betterliving Subdivision Don Bosco, Parañaque City, 1700',
  noticeSentDate: 'January 2, 2026',
  noticeDeliveryMethod: 'by personal delivery, in accordance with the corporation’s By-Laws',
  directorsCertDate: 'June 25, 2026',

  newspaperName: 'PUBLIKO New Publishing',
  publisherName: 'Mark Anthony B. Caiña',
  publisherOfficeAddress: 'Unit 3014 Aurora Arcade, Alabang Zapote Road, Almanza Uno, Las Piñas City, Metro Manila',
  circulationArea: 'General Circulation in the Philippines',
  publicationDates: 'June 8, 15, 22, 2026',

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
  autoSyncMatchingNames: true,
};

export type DocumentType =
  | 'forum_shopping'
  | 'sec_cert'
  | 'directors_cert'
  | 'affidavit'
  | 'verified_request';

export interface DocumentMeta {
  id: DocumentType;
  title: string;
  shortTitle: string;
  filename: string;
  description: string;
  signatoryPageDescription: string;
}

export const DOCUMENTS_LIST: DocumentMeta[] = [
  {
    id: 'forum_shopping',
    title: 'Verification and Certification Against Forum Shopping',
    shortTitle: 'Forum Shopping Cert',
    filename: 'VERIFICATION_AGAINST_FORUM_SHOPPING.docx',
    description: 'Affidavit affirming that no similar petition is pending before any court or tribunal.',
    signatoryPageDescription: 'Page 2: Affiant signature line and Notary Public Jurat section.',
  },
  {
    id: 'sec_cert',
    title: "Secretary's Certificate (No Intra-Corporate Dispute)",
    shortTitle: "Secretary's Certificate",
    filename: 'SECRETARYS_CERTIFICATE.docx',
    description: 'Corporate Secretary certification affirming no pending intra-corporate dispute.',
    signatoryPageDescription: 'Page 2: In Witness Whereof, Corporate Secretary signature line and Notary Public Jurat.',
  },
  {
    id: 'directors_cert',
    title: "Directors' Certificate for Dissolution",
    shortTitle: "Directors' Certificate",
    filename: 'DIRECTORS_CERTIFICATE.docx',
    description: 'Board & Stockholder resolutions approving dissolution and appointing authorized representative.',
    signatoryPageDescription: 'Page 2: Board & Stockholder signatures + Attestation; Page 3: Notarial Acknowledgment.',
  },
  {
    id: 'affidavit',
    title: 'Affidavit of Non-Prejudice to Creditors',
    shortTitle: 'Affidavit (Creditors)',
    filename: 'AFFIDAVIT_OF_NON_PREJUDICE_TO_CREDITORS.docx',
    description: 'Joint affidavit by President and Treasurer stating no creditor prejudice or opposition.',
    signatoryPageDescription: 'Page 2: President & Treasurer signature block, competent evidence of identity table, and Notary Jurat.',
  },
  {
    id: 'verified_request',
    title: 'Verified Request for Voluntary Dissolution',
    shortTitle: 'Verified Request',
    filename: 'VERIFIED_REQUEST_FOR_DISSOLUTION.docx',
    description: 'Complete 11-point petition to SEC CRMD with shareholder voting table and publication details.',
    signatoryPageDescription: 'Page 3: Signatory block for Authorized Representative; Page 4: Dedicated Verification & Jurat page.',
  },
];
