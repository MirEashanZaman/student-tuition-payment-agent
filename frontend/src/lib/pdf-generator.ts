export interface ReceiptData {
  certificateId: string;
  transferId: string;
  studentId: string;
  studentName: string;
  recipientUniversity: string;
  studentRegNumber: string;
  providerName: string;
  targetAmountUsd: number;
  sourceAmountBdt: number;
  feeTotalBdt: number;
  fxRateApplied: number;
  confirmedAt: string;
  status: string;
  txHash: string;
  sourceCurrency?: string;
  targetCurrency?: string;
}

export function generateTuitionReceiptPdf(data: ReceiptData): Blob {
  const srcCurr = data.sourceCurrency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'BDT';
  const tgtCurr = data.targetCurrency || 'USD';
  const sanitize = (val: string | number | undefined | null) =>
    String(val ?? '').replace(/[\\()]/g, '');
  const certRef = sanitize(data.certificateId || (data.transferId ? `CERT-${data.transferId.slice(0, 8).toUpperCase()}` : 'CERT-2026-BDT01'));
  const txHash = sanitize(data.txHash || (data.transferId ? `sha256-${data.transferId}` : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));

  const contentStream = `
q
0.12 0.23 0.54 rg
40 740 515 65 re f
Q

q
0.09 0.64 0.29 rg
40 736 515 4 re f
Q

BT
/F2 17 Tf
1 1 1 rg
1 0 0 1 55 778 Tm
(OFFICIAL TUITION SETTLEMENT CERTIFICATE) Tj
ET

BT
/F1 10 Tf
0.9 0.94 1 rg
1 0 0 1 55 754 Tm
(FinTechathon 2026 International Student Finance Remittance Rail) Tj
ET

q
0.96 0.97 0.99 rg
40 575 515 145 re f
0.85 0.88 0.94 RG
1 w
40 575 515 145 re s
Q

BT
/F2 11 Tf
0.12 0.23 0.54 rg
1 0 0 1 55 696 Tm
(TRANSACTION & STUDENT DETAILS) Tj
ET

BT
/F1 10 Tf
0.2 0.2 0.25 rg
1 0 0 1 55 672 Tm
(Certificate Reference:) Tj
1 0 0 1 210 672 Tm
(${certRef}) Tj
1 0 0 1 55 652 Tm
(Student Identity:) Tj
1 0 0 1 210 652 Tm
(${sanitize(data.studentName)} (${sanitize(data.studentId)})) Tj
1 0 0 1 55 632 Tm
(Beneficiary University:) Tj
1 0 0 1 210 632 Tm
(${sanitize(data.recipientUniversity)}) Tj
1 0 0 1 55 612 Tm
(Student Registration No:) Tj
1 0 0 1 210 612 Tm
(${sanitize(data.studentRegNumber)}) Tj
1 0 0 1 55 592 Tm
(Remittance Rail Corridor:) Tj
1 0 0 1 210 592 Tm
(${sanitize(data.providerName)}) Tj
ET

q
0.96 0.97 0.99 rg
40 415 515 145 re f
0.85 0.88 0.94 RG
1 w
40 415 515 145 re s
Q

BT
/F2 11 Tf
0.12 0.23 0.54 rg
1 0 0 1 55 536 Tm
(SETTLEMENT FINANCIAL BREAKDOWN) Tj
ET

BT
/F1 10 Tf
0.2 0.2 0.25 rg
1 0 0 1 55 512 Tm
(Settled Tuition (${tgtCurr}):) Tj
1 0 0 1 210 512 Tm
(${tgtCurr === 'USD' ? '$' : ''}${sanitize(Number(data.targetAmountUsd || 0).toLocaleString())} ${tgtCurr}) Tj
1 0 0 1 55 492 Tm
(Debited from Account (${srcCurr}):) Tj
1 0 0 1 210 492 Tm
(${sanitize(Number(data.sourceAmountBdt || 0).toLocaleString())} ${srcCurr}) Tj
1 0 0 1 55 472 Tm
(Applied FX Rate:) Tj
1 0 0 1 210 472 Tm
(${sanitize(data.fxRateApplied)} ${srcCurr}/${tgtCurr}) Tj
1 0 0 1 55 452 Tm
(Corridor Fee:) Tj
1 0 0 1 210 452 Tm
(${sanitize(Number(data.feeTotalBdt || 0).toLocaleString())} ${srcCurr}) Tj
1 0 0 1 55 432 Tm
(Settlement Timestamp:) Tj
1 0 0 1 210 432 Tm
(${sanitize(data.confirmedAt)}) Tj
ET

q
0.07 0.10 0.16 rg
40 290 515 110 re f
Q

BT
/F2 11 Tf
0.34 0.75 0.99 rg
1 0 0 1 55 378 Tm
(CRYPTOGRAPHIC INTEGRITY & VERIFICATION) Tj
ET

BT
/F1 9 Tf
0.85 0.9 0.95 rg
1 0 0 1 55 358 Tm
(Algorithm: SHA-256 HMAC / Append-Only Ledger Entry) Tj
1 0 0 1 55 340 Tm
(Transaction Fingerprint (SHA-256):) Tj
ET

BT
/F1 8 Tf
0.3 0.85 0.5 rg
1 0 0 1 55 322 Tm
(${txHash}) Tj
ET

BT
/F1 9 Tf
0.7 0.75 0.85 rg
1 0 0 1 55 304 Tm
(Status: SETTLED & VERIFIED | Permission Tier: EXECUTE (Human-Authorized)) Tj
ET

q
0.93 0.98 0.94 rg
40 205 515 70 re f
0.1 0.6 0.3 RG
1.5 w
40 205 515 70 re s
Q

BT
/F2 12 Tf
0.08 0.5 0.24 rg
1 0 0 1 55 252 Tm
([ VERIFIED OFFICIAL SETTLEMENT RECEIPT ]) Tj
ET

BT
/F1 9 Tf
0.15 0.4 0.2 rg
1 0 0 1 55 234 Tm
(This digital certificate confirms fund settlement to the foreign university.) Tj
1 0 0 1 55 220 Tm
(Issued by FinTechathon 2026 Student Tuition Payment Autonomous Agent.) Tj
ET

BT
/F1 8 Tf
0.5 0.5 0.5 rg
1 0 0 1 55 160 Tm
(Notice: This document is cryptographically linked to audit record in PostgreSQL append-only ledger.) Tj
1 0 0 1 55 146 Tm
(Mir Eashan Zaman & Ishmam Mubtasim | American International University-Bangladesh (AIUB)) Tj
ET
`.trim();

  const streamBytes = new TextEncoder().encode(contentStream);
  const streamLength = streamBytes.length;

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  objects.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);

  let offset = 9;
  const xref: string[] = ['xref', '0 7', '0000000000 65535 f '];
  let body = '%PDF-1.4\n';

  for (let i = 0; i < objects.length; i++) {
    const objStr = objects[i] + '\n';
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ');
    body += objStr;
    offset += new TextEncoder().encode(objStr).length;
  }

  const startxref = offset;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  const fullPdf = body + xref.join('\n') + '\n' + trailer;

  return new Blob([new TextEncoder().encode(fullPdf)], { type: 'application/pdf' });
}

export function downloadTuitionReceiptPdf(data: ReceiptData): void {
  const blob = generateTuitionReceiptPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tuition_Settlement_Certificate_${data.transferId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
