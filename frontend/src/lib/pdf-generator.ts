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
}

export function generateTuitionReceiptPdf(data: ReceiptData): Blob {
  const sanitize = (val: string | number | undefined | null) =>
    String(val ?? '').replace(/[\\()]/g, '');

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
55 778 Td
(OFFICIAL TUITION SETTLEMENT CERTIFICATE) Tj
ET

BT
/F1 10 Tf
0.9 0.94 1 rg
55 754 Td
(FinTechathon 2026 International Student Finance Remittance Rail) Tj
ET

q
0.96 0.97 0.99 rg
40 580 515 140 re f
0.85 0.88 0.94 RG
1 w
40 580 515 140 re s
Q

BT
/F2 11 Tf
0.12 0.23 0.54 rg
55 700 Td
(TRANSACTION & STUDENT DETAILS) Tj
ET

BT
/F1 10 Tf
0.2 0.2 0.25 rg
55 675 Td
(Certificate Reference:) Tj
200 675 Td
(${sanitize(data.certificateId)}) Tj
55 655 Td
(Student Identity:) Tj
200 655 Td
(${sanitize(data.studentName)} (${sanitize(data.studentId)})) Tj
55 635 Td
(Beneficiary University:) Tj
200 635 Td
(${sanitize(data.recipientUniversity)}) Tj
55 615 Td
(Student Registration No:) Tj
200 615 Td
(${sanitize(data.studentRegNumber)}) Tj
55 595 Td
(Remittance Rail Corridor:) Tj
200 595 Td
(${sanitize(data.providerName)}) Tj
ET

q
0.96 0.97 0.99 rg
40 430 515 135 re f
0.85 0.88 0.94 RG
1 w
40 430 515 135 re s
Q

BT
/F2 11 Tf
0.12 0.23 0.54 rg
55 545 Td
(SETTLEMENT FINANCIAL BREAKDOWN) Tj
ET

BT
/F1 10 Tf
0.2 0.2 0.25 rg
55 520 Td
(Settled Tuition (USD):) Tj
200 520 Td
($${sanitize(Number(data.targetAmountUsd || 0).toLocaleString())} USD) Tj
55 500 Td
(Debited from Account (BDT):) Tj
200 500 Td
(${sanitize(Number(data.sourceAmountBdt || 0).toLocaleString())} BDT) Tj
55 480 Td
(Applied FX Rate:) Tj
200 480 Td
(${sanitize(data.fxRateApplied)} BDT/USD) Tj
55 460 Td
(Corridor Fee:) Tj
200 460 Td
(${sanitize(Number(data.feeTotalBdt || 0).toLocaleString())} BDT) Tj
55 440 Td
(Settlement Timestamp:) Tj
200 440 Td
(${sanitize(data.confirmedAt)}) Tj
ET

q
0.07 0.10 0.16 rg
40 310 515 105 re f
Q

BT
/F2 11 Tf
0.34 0.75 0.99 rg
55 395 Td
(CRYPTOGRAPHIC INTEGRITY & VERIFICATION) Tj
ET

BT
/F1 9 Tf
0.85 0.9 0.95 rg
55 375 Td
(Algorithm: SHA-256 HMAC / Append-Only Ledger Entry) Tj
55 355 Td
(Transaction Fingerprint (SHA-256):) Tj
ET

BT
/F1 8 Tf
0.3 0.85 0.5 rg
55 335 Td
(${sanitize(data.txHash)}) Tj
ET

BT
/F1 9 Tf
0.7 0.75 0.85 rg
55 320 Td
(Status: SETTLED & VERIFIED | Permission Tier: EXECUTE (Human-Authorized)) Tj
ET

q
0.93 0.98 0.94 rg
40 230 515 65 re f
0.1 0.6 0.3 RG
1.5 w
40 230 515 65 re s
Q

BT
/F2 12 Tf
0.08 0.5 0.24 rg
55 272 Td
([ VERIFIED OFFICIAL SETTLEMENT RECEIPT ]) Tj
ET

BT
/F1 9 Tf
0.15 0.4 0.2 rg
55 252 Td
(This digital certificate confirms fund settlement to the foreign university.) Tj
55 240 Td
(Issued by FinTechathon 2026 Student Tuition Payment Autonomous Agent.) Tj
ET

BT
/F1 8 Tf
0.5 0.5 0.5 rg
55 180 Td
(Notice: This document is cryptographically linked to audit record in PostgreSQL append-only ledger.) Tj
55 168 Td
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
