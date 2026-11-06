import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
  Packer,
  HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';
import { DissolutionFormData, DocumentType } from '../types/dissolution';

// Standard twips conversion (1 inch = 1440 twips)
const MARGIN_TWIPS = 1440; // 1 inch

// Dimensions in twips (Letter: 8.5 x 11 in = 12240 x 15840; Legal: 8.5 x 14 in = 12240 x 20160; A4: 210 x 297 mm = 11906 x 16838)
const PAGE_SIZES = {
  LETTER: { width: 12240, height: 15840 },
  LEGAL: { width: 12240, height: 20160 },
  A4: { width: 11906, height: 16838 },
};

function getSectionProperties(pageSize: 'LETTER' | 'LEGAL' | 'A4' = 'LETTER') {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.LETTER;
  return {
    page: {
      size: {
        width: size.width,
        height: size.height,
      },
      margin: {
        top: MARGIN_TWIPS,
        right: MARGIN_TWIPS,
        bottom: MARGIN_TWIPS,
        left: MARGIN_TWIPS,
      },
    },
  };
}

// Helpers for consistent styling
function createDocHeader(font: string) {
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60, line: 260 },
      children: [
        new TextRun({
          text: 'REPUBLIC OF THE PHILIPPINES',
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 240, line: 260 },
      children: [
        new TextRun({
          text: '                              ) S.S.',
          font,
          size: 24,
        }),
      ],
    }),
  ];
}

function createTitle(text: string, font: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 180, after: 240 },
    children: [
      new TextRun({
        text,
        bold: true,
        font,
        size: 26, // 13pt
      }),
    ],
  });
}

function createBodyPara(text: string, font: string, indent: boolean = false, spaceAfter: number = 180) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: spaceAfter, line: 280 },
    indent: indent ? { firstLine: 720 } : undefined, // 0.5 inch first line indent
    children: [
      new TextRun({
        text,
        font,
        size: 24, // 12pt
      }),
    ],
  });
}

function createNumberedPara(num: string, text: string, font: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 180, line: 280 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({
        text: `${num}. `,
        bold: false,
        font,
        size: 24,
      }),
      new TextRun({
        text,
        font,
        size: 24,
      }),
    ],
  });
}

function createNotaryBlock(data: DissolutionFormData) {
  const font = data.fontFamily;
  return [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 240, after: 180 },
      children: [
        new TextRun({
          text: 'NOTARY PUBLIC',
          bold: true,
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 260 },
      children: [
        new TextRun({
          text: `Doc. No. ${data.docNo || '____'};`,
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 260 },
      children: [
        new TextRun({
          text: `Page No. ${data.pageNo || '____'};`,
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 260 },
      children: [
        new TextRun({
          text: `Book No. ${data.bookNo || '____'};`,
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 260 },
      children: [
        new TextRun({
          text: `Series of ${data.seriesYear || '2026'}.`,
          font,
          size: 24,
        }),
      ],
    }),
  ];
}

// -------------------------------------------------------------
// 1. Verification and Certification Against Forum Shopping
// -------------------------------------------------------------
export function generateForumShoppingDoc(data: DissolutionFormData): Document {
  const font = data.fontFamily;

  return new Document({
    sections: [
      {
        properties: getSectionProperties(data.pageSize),
        children: [
          // Header
          ...createDocHeader(font),

          // Title
          createTitle('VERIFICATION AND CERTIFICATION AGAINST FORUM SHOPPING', font),

          // Deposition clause
          createBodyPara(
            `I, ${data.corporateSecretaryName}, of legal age, ${data.corporateSecretaryNationality} and with address at ${data.corporateSecretaryAddress}, on oath, state that:`,
            font,
            true,
            240
          ),

          // Paragraph 1
          createNumberedPara(
            '1',
            `I am the Corporate Secretary of ${data.corporationName}, duly authorized to execute this Verification pursuant to my authority as evidenced by the attached Directors Certificate dated ${data.directorsCertDate || data.meetingDateFormatted}.`,
            font
          ),

          // Paragraph 2
          createNumberedPara(
            '2',
            `I have caused the preparation of the foregoing Petition and read all the allegations in the Petition. I attest that the factual allegations therein are true and correct based on my own knowledge and on authentic documents.`,
            font
          ),

          // Paragraph 3
          createNumberedPara(
            '3',
            `That I have not commenced any action or filed any petition involving the same subject matter or issues in any court, tribunal or agency; to the best of my knowledge, no such action is pending therein; (if there is such other pending action, a complete statement of its present status;) and if I should learn that the same or similar action has been filed or is pending, I shall report that fact within five (5) days from such knowledge to the Company Registration and Monitoring Department (CRMD).`,
            font
          ),

          // ========================================================
          // EXPLICIT PAGE BREAK: Signatory Page is on the NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Signatory section (Page 2)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 60 },
            children: [
              new TextRun({
                text: data.corporateSecretaryName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: 'Corporate Secretary',
                font,
                size: 24,
              }),
            ],
          }),

          // Jurat
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240, line: 300 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `SUBSCRIBED AND SWORN to before me in ${data.executionCity || '_________________'}, this ________ day of _______________, ${data.executionMonthYear || '2026'} affiant exhibiting to me her Tax Identification Number ${data.corporateSecretaryTin || '____________________'}.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Notary Public Block
          ...createNotaryBlock(data),
        ],
      },
    ],
  });
}

// -------------------------------------------------------------
// 2. Secretary's Certificate
// -------------------------------------------------------------
export function generateSecretaryCertDoc(data: DissolutionFormData): Document {
  const font = data.fontFamily;

  return new Document({
    sections: [
      {
        properties: getSectionProperties(data.pageSize),
        children: [
          ...createDocHeader(font),

          createTitle("SECRETARY'S CERTIFICATE", font),

          createBodyPara(
            `I, ${data.corporateSecretaryName}, of legal age, ${data.corporateSecretaryNationality} and with address at ${data.corporateSecretaryAddress}, after having been sworn to in accordance with law hereby depose and state that:`,
            font,
            true,
            240
          ),

          createBodyPara(
            `I am the duly elected and qualified Corporate Secretary of ${data.corporationName} a corporation duly registered with the Commission, with principal office at ${data.principalOfficeAddress}.`,
            font,
            true,
            240
          ),

          createBodyPara(
            `To the best of my knowledge, from the date of approval of the dissolution by the Board of Directors in a meeting held on ${data.meetingDateFormatted} and the Stockholders in a meeting held on ${data.meetingDateFormatted} up to the date of filing of dissolution with the Commission, no action or proceeding has been filed or is pending before any Court involving an intra- corporate dispute and/or any claim by any person or group against the board of directors, individual director and/or major corporate officer/s of the Corporation as its duly elected and/or appointed director or officer or vice versa.`,
            font,
            true,
            240
          ),

          // ========================================================
          // EXPLICIT PAGE BREAK: Signatory Page is on the NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // In Witness Whereof
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 360, line: 280 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `IN WITNESS WHEREOF, I hereby signed this _____ day of ____________ 20___ at ${data.executionCity || '____________________________________'}.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Signature
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 180, after: 60 },
            children: [
              new TextRun({
                text: data.corporateSecretaryName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: 'Corporate Secretary',
                font,
                size: 24,
              }),
            ],
          }),

          // Jurat
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240, line: 300 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `SUBSCRIBED AND SWORN to before me on this _____ day of ____________ 20___ in ${data.executionCity || '____________________________________'} affiant/s exhibited to me his/her Identification Documents/Government issued ID/s as follows: ${data.corporateSecretaryId || 'TIN: ' + data.corporateSecretaryTin}.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Notary Public Block
          ...createNotaryBlock(data),
        ],
      },
    ],
  });
}

// -------------------------------------------------------------
// 3. Directors' Certificate
// -------------------------------------------------------------
export function generateDirectorsCertDoc(data: DissolutionFormData): Document {
  const font = data.fontFamily;

  // Build Director Signature blocks for Page 2
  const directorSignatoryCells: TableCell[] = data.stockholders.map((person) => {
    return new TableCell({
      width: { size: Math.floor(100 / Math.min(2, Math.max(1, data.stockholders.length))), type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 40 },
          children: [
            new TextRun({
              text: person.name,
              bold: true,
              font,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: 'Director / Stockholder',
              font,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `TIN: ${person.tin}`,
              font,
              size: 20,
            }),
          ],
        }),
      ],
    });
  });

  // Chunk cells into rows of 2
  const directorRows: TableRow[] = [];
  for (let i = 0; i < directorSignatoryCells.length; i += 2) {
    const rowCells = directorSignatoryCells.slice(i, i + 2);
    // Pad with empty cell if odd
    if (rowCells.length === 1 && directorSignatoryCells.length > 1) {
      rowCells.push(
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [new Paragraph({})],
        })
      );
    }
    directorRows.push(new TableRow({ children: rowCells }));
  }

  const directorsSignatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: directorRows,
  });

  return new Document({
    sections: [
      {
        properties: getSectionProperties(data.pageSize),
        children: [
          createTitle("DIRECTORS' CERTIFICATE", font),

          createBodyPara(
            `We, the undersigned members of the Board of Directors and Corporate Secretary of ${data.corporationName}, a corporation duly organized and existing under the laws of the Republic of the Philippines, with SEC Registration No. ${data.secRegistrationNo} and principal office at ${data.principalOfficeAddress}, do hereby certify:`,
            font,
            true,
            200
          ),

          createBodyPara(
            `That at a joint meeting of the Board of Directors and Stockholders of the Corporation held on ${data.meetingDateFormatted} at ${data.meetingTime} in its principal office, at which a quorum of both the Board of Directors and Stockholders was present and acted throughout, the following resolutions were unanimously adopted:`,
            font,
            true,
            240
          ),

          // Resolutions
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 120, after: 180, line: 280 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: '“RESOLVED, that the Corporation shall be dissolved pursuant to the provisions of the Revised Corporation Code of the Philippines;',
                font,
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 180, line: 280 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: 'RESOLVED FURTHER, that the Stockholders, representing at least two-thirds (2/3) of the outstanding capital stock of the Corporation, have approved and confirmed the foregoing resolution of the Board of Directors to dissolve the Corporation;',
                font,
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240, line: 280 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: `RESOLVED FINALLY, that ${data.authorizedRepName}, with office address at ${data.authorizedRepAddress}, be, as is hereby, designated as the authorized representative of the Corporation to file and process with the Securities and Exchange Commission the Verified Request for Dissolution and to perform all acts necessary and incidental to the said dissolution;”`,
                font,
                size: 24,
              }),
            ],
          }),

          // ========================================================
          // EXPLICIT PAGE BREAK: Signatory Page is on the NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Page 2: In Witness Whereof
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 280, line: 280 },
            children: [
              new TextRun({
                text: `IN WITNESS WHEREOF, we have hereunto set our hands this ______ day of __________, ${data.executionMonthYear || '2026'} at ${data.executionCity || '_______________'}.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Directors Table Signatures
          directorsSignatureTable,

          // Attested By
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 360, after: 180 },
            children: [
              new TextRun({
                text: 'ATTESTED BY:',
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: data.corporateSecretaryName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: 'Corporate Secretary',
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 240, line: 260 },
            children: [
              new TextRun({
                text: `TIN: ${data.corporateSecretaryTin}`,
                font,
                size: 24,
              }),
            ],
          }),

          // ========================================================
          // EXPLICIT PAGE BREAK: Acknowledgment on NEXT PAGE (Page 3)
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Page 3: Acknowledgment
          createTitle('ACKNOWLEDGMENT', font),

          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 60, line: 260 },
            children: [
              new TextRun({
                text: 'REPUBLIC OF THE PHILIPPINES )',
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 240, line: 260 },
            children: [
              new TextRun({
                text: '___________________________ ) S.S.',
                font,
                size: 24,
              }),
            ],
          }),

          createBodyPara(
            `BEFORE ME, a Notary Public for and in the above jurisdiction, this ___ day of _________, ${data.executionMonthYear || '2026'}, personally appeared the above-named persons, known to me and to me known to be the same persons who executed the foregoing instrument and they acknowledged to me that the same is their free and voluntary act and deed as well as of the corporation they represent.`,
            font,
            true,
            240
          ),

          createBodyPara(
            'IN WITNESS WHEREOF, I have hereunto set my hand and affixed my notarial seal on the date and at the place above written.',
            font,
            false,
            240
          ),

          ...createNotaryBlock(data),
        ],
      },
    ],
  });
}

// -------------------------------------------------------------
// 4. Affidavit (Non-Prejudice to Creditors)
// -------------------------------------------------------------
export function generateAffidavitDoc(data: DissolutionFormData): Document {
  const font = data.fontFamily;

  return new Document({
    sections: [
      {
        properties: getSectionProperties(data.pageSize),
        children: [
          createTitle('AFFIDAVIT', font),

          createBodyPara(
            `We, ${data.presidentName}, of legal age, ${data.presidentNationality}, and residing at ${data.presidentAddress}, in my capacity as the President, and ${data.treasurerName}, of legal age, ${data.treasurerNationality}, and residing at ${data.treasurerAddress}, in my capacity as the Treasurer, of ${data.corporationName}, a corporation duly organized and existing under Philippine laws with principal office at ${data.principalOfficeAddress}, after having been duly sworn to in accordance with law, do hereby depose and state that:`,
            font,
            true,
            240
          ),

          createNumberedPara(
            '1',
            'The dissolution of the corporation is not prejudicial to the interest of the creditors of the corporation;',
            font
          ),

          createNumberedPara(
            '2',
            'From the time of publication of the notice of dissolution up to the filing of the dissolution with the Securities and Exchange Commission, there has been no opposition from any of the creditors of the corporation.',
            font
          ),

          // ========================================================
          // EXPLICIT PAGE BREAK: Signatory Page is on the NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Page 2: In Witness Whereof
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 280, line: 280 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `IN WITNESS WHEREOF, we have hereunto set our hands this ___ day of _______, 20___ at ${data.executionCity || '________________'}, Philippines.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Signatures (President & Treasurer)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 120, line: 240 },
                        children: [
                          new TextRun({
                            text: data.presidentName,
                            bold: true,
                            font,
                            size: 22,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'President',
                            font,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 120, line: 240 },
                        children: [
                          new TextRun({
                            text: data.treasurerName,
                            bold: true,
                            font,
                            size: 22,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Treasurer',
                            font,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Subscribed and Sworn
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 280, after: 180, line: 280 },
            children: [
              new TextRun({
                text: 'SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiants exhibiting to me their competent evidence of identity:',
                font,
                size: 24,
              }),
            ],
          }),

          // Affiants Evidence Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'Name', bold: true, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'TIN/ID no', bold: true, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'Date and Place Issued', bold: true, font, size: 22 })],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.presidentName, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.presidentTin, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.presidentId || '', font, size: 22 })],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.treasurerName, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.treasurerTin, font, size: 22 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: data.treasurerId || '', font, size: 22 })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          ...createNotaryBlock(data),
        ],
      },
    ],
  });
}

// -------------------------------------------------------------
// 5. Verified Request for Dissolution
// -------------------------------------------------------------
export function generateVerifiedRequestDoc(data: DissolutionFormData): Document {
  const font = data.fontFamily;

  // Stockholders voting table
  const votingTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Name', bold: true, font, size: 22 })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Number of Shares (Shareholder)', bold: true, font, size: 22 })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Director', bold: true, font, size: 22 })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Vote on Dissolution', bold: true, font, size: 22 })] })],
        }),
      ],
    }),
    ...data.stockholders.map((s) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: s.name, font, size: 22 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${s.shares} (${s.sharePercentage})`, font, size: 22 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.directorRole, font, size: 22 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.vote, font, size: 22 })] })],
          }),
        ],
      });
    }),
  ];

  return new Document({
    sections: [
      {
        properties: getSectionProperties(data.pageSize),
        children: [
          // Letterhead
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: data.corporationName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 200, line: 260 },
            children: [
              new TextRun({
                text: data.principalOfficeAddress,
                font,
                size: 22,
              }),
            ],
          }),

          // Title
          createTitle('VERIFIED REQUEST FOR DISSOLUTION', font),

          // Addressee
          new Paragraph({
            spacing: { before: 100, line: 260 },
            children: [new TextRun({ text: 'To:', font, size: 24 })],
          }),
          new Paragraph({
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: data.secDirectorName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 260 },
            children: [new TextRun({ text: data.secDepartment, font, size: 24 })],
          }),
          ...data.secAddress.split('\n').map((line) => {
            return new Paragraph({
              spacing: { line: 260 },
              children: [new TextRun({ text: line, font, size: 24 })],
            });
          }),

          // Preamble
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 180, line: 280 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `I, the undersigned authorized representative of ${data.corporationName} respectfully request the voluntary dissolution of the corporation and state under oath as follows:`,
                font,
                size: 24,
              }),
            ],
          }),

          // 1. Corporation Details
          createNumberedPara(
            '1',
            `The corporation ${data.corporationName} with SEC Registration Number ${data.secRegistrationNo} has its principal Office at ${data.principalOfficeAddress} and official email address at ${data.officialEmail}.`,
            font
          ),

          // 2. Representative Authority
          createNumberedPara(
            '2',
            `I am ${data.authorizedRepName}, director / corporate secretary of the corporation with office address at ${data.authorizedRepAddress} is authorized by the corporation to file its verified request for dissolution.`,
            font
          ),

          // 3. Voluntary Dissolution affirmation
          createNumberedPara(
            '3',
            'The corporation requests its voluntary dissolution and affirms that no creditor is affected, and the dissolution does not prejudice the rights of any creditor having a claim against the corporation.',
            font
          ),

          // 4. Cause of Dissolution
          createNumberedPara(
            '4',
            'The dissolution of the corporation is due to the cessation of business operations and the mutual decision of the stockholders, who have determined that the continuation of the corporation is no longer viable or necessary. This decision was made after due consideration of the corporation’s current business condition and future prospects.',
            font
          ),

          // 5. Notice Details
          createNumberedPara(
            '5',
            `Notice of the meeting to approve the dissolution was sent to all stockholders on ${data.noticeSentDate}, at least twenty (20) days prior to the meeting, ${data.noticeDeliveryMethod}. The notice included the time, place and object of the meeting and was published thrice on ${data.publicationDates} in ${data.newspaperName}, a newspaper of general circulation in the Philippines. The notice stated that the purpose of the meeting was to vote on the dissolution of the corporation and included:\n` +
              'a. The agenda of the meeting;\n' +
              'b. A proxy form; and\n' +
              'c. The procedures for attendance and voting via remote communication or in absentia, if applicable.',
            font
          ),

          // 6. Meeting Held
          createNumberedPara(
            '6',
            `That on ${data.meetingDateFormatted}, a joint meeting by the board of directors and stockholders was held at ${data.meetingTime} on ${data.meetingPlace}.`,
            font
          ),

          // 7. Majority Vote
          createNumberedPara(
            '7',
            'Majority of the directors or trustees and the stockholders owning or controlling at least a majority of the outstanding capital stock including the holder of non-voting shares or majority of the members voted for the dissolution.',
            font
          ),

          // 8. Stockholder Table
          new Paragraph({
            spacing: { before: 120, after: 120, line: 260 },
            children: [
              new TextRun({
                text: '8. The following stockholders and directors approved the dissolution:',
                font,
                size: 24,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: votingTableRows,
          }),

          // 9. Officers of Record
          new Paragraph({
            spacing: { before: 180 },
            children: [],
          }),
          createNumberedPara(
            '9',
            'The aforementioned stockholders and directors are the duly elected and serving officers and stockholders of record as of the meeting date.',
            font
          ),

          // 10. Publication Details
          new Paragraph({
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({
                text: '10. The following publication details are as follows:',
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: `a) Name of Newspaper: ${data.newspaperName}`, font, size: 24 })],
          }),
          new Paragraph({
            spacing: { line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: `b) Name of Publisher: ${data.publisherName}`, font, size: 24 })],
          }),
          new Paragraph({
            spacing: { line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: `c) Principal Office of Publisher: ${data.publisherOfficeAddress}`, font, size: 24 })],
          }),
          new Paragraph({
            spacing: { line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: `d) Area of Circulation: ${data.circulationArea}`, font, size: 24 })],
          }),
          new Paragraph({
            spacing: { line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: `e) Date of Publication: ${data.publicationDates}`, font, size: 24 })],
          }),
          new Paragraph({
            spacing: { after: 180, line: 260 },
            indent: { left: 720 },
            children: [new TextRun({ text: 'f) Contents of Notice: Please see attached copy of publication', font, size: 24 })],
          }),

          // 11. No Pending Case
          createNumberedPara(
            '11',
            'The corporation affirms that it has no pending case involving intra-corporate disputes.',
            font
          ),

          // ========================================================
          // EXPLICIT PAGE BREAK: Signatory Page is on the NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Page 3: In Witness Whereof & Signature
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 360, line: 280 },
            children: [
              new TextRun({
                text: `IN WITNESS WHEREOF, I have hereunto set my hand this ___ day of ___________, 20___ at ${data.executionCity || '___________'}.`,
                font,
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 360, line: 260 },
            children: [
              new TextRun({
                text: data.authorizedRepName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: data.authorizedRepTitle || 'Corp. Secretary / Authorized Representative',
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 360, line: 260 },
            children: [
              new TextRun({
                text: data.corporationName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),

          // ========================================================
          // EXPLICIT PAGE BREAK: Dedicated VERIFICATION on NEXT PAGE!
          // ========================================================
          new Paragraph({
            children: [new PageBreak()],
          }),

          // Page 4: VERIFICATION
          createTitle('VERIFICATION', font),

          createBodyPara(
            `I, ${data.authorizedRepName}, of legal age, Filipino, and residing at ${data.corporateSecretaryAddress}, after having been duly sworn in accordance with law, depose and state:`,
            font,
            true,
            200
          ),

          createNumberedPara(
            '1',
            `I am the corporate secretary of ${data.corporationName}, and authorized to file this Verified Request for Dissolution;`,
            font
          ),

          createNumberedPara(
            '2',
            'I have read and understood the contents of this Verified Request, and the same are true and correct of my own personal knowledge and/or based on authentic documents.',
            font
          ),

          // In Witness Whereof for Verification
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 240, line: 280 },
            children: [
              new TextRun({
                text: `IN WITNESS WHEREOF, I have hereunto set my hand this __________, at ${data.executionCity || '________________'}.`,
                font,
                size: 24,
              }),
            ],
          }),

          // Signatory line
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, line: 260 },
            children: [
              new TextRun({
                text: data.authorizedRepName,
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240, line: 260 },
            children: [
              new TextRun({
                text: 'Corporate Secretary',
                font,
                size: 24,
              }),
            ],
          }),

          // Jurat
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 280 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `SUBSCRIBED AND SWORN to before me this ___ day of ________, 20___, affiant having exhibited to me a valid government-issued ID:`,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 240, line: 280 },
            children: [
              new TextRun({
                text: `ID No. ${data.corporateSecretaryTin || '_______________'}; Date/Place Issued: _________________________.`,
                font,
                size: 24,
              }),
            ],
          }),

          ...createNotaryBlock(data),
        ],
      },
    ],
  });
}

// -------------------------------------------------------------
// Dispatcher: generates blob and triggers download
// -------------------------------------------------------------
export async function downloadDocx(type: DocumentType, data: DissolutionFormData): Promise<void> {
  let doc: Document;
  let filename = '';

  switch (type) {
    case 'forum_shopping':
      doc = generateForumShoppingDoc(data);
      filename = `${cleanFilename(data.corporationName)}_1_VERIFICATION_AGAINST_FORUM_SHOPPING.docx`;
      break;
    case 'sec_cert':
      doc = generateSecretaryCertDoc(data);
      filename = `${cleanFilename(data.corporationName)}_2_SECRETARYS_CERTIFICATE.docx`;
      break;
    case 'directors_cert':
      doc = generateDirectorsCertDoc(data);
      filename = `${cleanFilename(data.corporationName)}_3_DIRECTORS_CERTIFICATE.docx`;
      break;
    case 'affidavit':
      doc = generateAffidavitDoc(data);
      filename = `${cleanFilename(data.corporationName)}_4_AFFIDAVIT_OF_NON_PREJUDICE.docx`;
      break;
    case 'verified_request':
      doc = generateVerifiedRequestDoc(data);
      filename = `${cleanFilename(data.corporationName)}_5_VERIFIED_REQUEST_FOR_DISSOLUTION.docx`;
      break;
  }

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export async function generateDocxBlob(type: DocumentType, data: DissolutionFormData): Promise<{ blob: Blob; filename: string }> {
  let doc: Document;
  let filename = '';

  switch (type) {
    case 'forum_shopping':
      doc = generateForumShoppingDoc(data);
      filename = `1_VERIFICATION_AGAINST_FORUM_SHOPPING.docx`;
      break;
    case 'sec_cert':
      doc = generateSecretaryCertDoc(data);
      filename = `2_SECRETARYS_CERTIFICATE.docx`;
      break;
    case 'directors_cert':
      doc = generateDirectorsCertDoc(data);
      filename = `3_DIRECTORS_CERTIFICATE.docx`;
      break;
    case 'affidavit':
      doc = generateAffidavitDoc(data);
      filename = `4_AFFIDAVIT_OF_NON_PREJUDICE.docx`;
      break;
    case 'verified_request':
      doc = generateVerifiedRequestDoc(data);
      filename = `5_VERIFIED_REQUEST_FOR_DISSOLUTION.docx`;
      break;
  }

  const blob = await Packer.toBlob(doc);
  return { blob, filename };
}

function cleanFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_');
}
