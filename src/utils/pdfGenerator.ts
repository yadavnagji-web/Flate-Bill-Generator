import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Building, MonthlyBill, FlatBillEntry } from '../types';
import { formatPdfAmount, formatUnits, formatBillingMonth } from './calculator';

export function generateIndividualFlatPdf(
  building: Building,
  bill: MonthlyBill,
  entry: FlatBillEntry
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedMonth = formatBillingMonth(bill.billingMonth);
  const discomLabel = bill.discomName ? `${bill.discomName} ` : '';

  // Theme colors
  const primaryColor = [30, 41, 59]; // slate-800
  const accentColor = [14, 116, 144]; // cyan-700
  const textColor = [51, 65, 85]; // slate-700
  const lightBg = [241, 245, 249]; // slate-100

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FLAT ELECTRICITY STATEMENT', 105, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const subTitle = discomLabel
    ? `${building.name} - ${discomLabel}Sub-Meter Distribution`
    : `${building.name} - Sub-Meter Distribution`;
  doc.text(subTitle, 105, 26, { align: 'center' });

  // Building & Bill Info Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 42, 182, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Building:', 18, 50);
  doc.text('Address:', 18, 57);
  doc.text('Billing Month:', 115, 50);
  doc.text('Bill Date / Due Date:', 115, 57);
  doc.text(discomLabel ? `${discomLabel}K-Number:` : 'K-Number:', 115, 64);
  doc.text('Manager Contact:', 18, 64);

  doc.setFont('helvetica', 'normal');
  doc.text(building.name, 42, 50);
  doc.text(building.address.slice(0, 45), 42, 57);
  doc.text(`${building.ownerName} (${building.ownerMobile})`, 54, 64);
  doc.text(formattedMonth, 145, 50);
  doc.text(`${bill.billDate || 'N/A'} / ${bill.dueDate || 'N/A'}`, 155, 57);
  doc.text(bill.kNumber || 'N/A', 155, 64);

  // Flat & Tenant Banner
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(14, 82, 182, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Flat No: ${entry.flatNumber}`, 20, 92);
  doc.setFontSize(11);
  doc.text(`Tenant: ${entry.tenantName} (${entry.tenantMobile || 'N/A'})`, 110, 92);

  // Meter Reading Breakdown Table
  let y = 106;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const drawRow = (label: string, value: string, isHeader = false, isBold = false) => {
    if (isHeader) {
      doc.setFillColor(226, 232, 240);
      doc.rect(14, y - 5, 182, 9, 'F');
    }
    doc.setFont('helvetica', isBold || isHeader ? 'bold' : 'normal');
    doc.setFontSize(10.5);
    doc.text(label, 20, y);
    doc.text(value, 190, y, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 3, 196, y + 3);
    y += 10;
  };

  drawRow('METER READING & CONSUMPTION', 'DETAILS', true);
  drawRow('Sub-meter Number', entry.subMeterNumber || 'SM-SubMeter');
  drawRow('Previous Meter Reading', formatUnits(entry.previousReading));
  drawRow('Current Meter Reading', formatUnits(entry.currentReading));
  drawRow('Own Consumed Units', `${formatUnits(entry.usedUnits)} Units`, false, true);

  y += 4;
  const mainDetailsTitle = discomLabel ? `${discomLabel}MAIN BILL & RATE DETAILS` : 'MAIN BILL & RATE DETAILS';
  drawRow(mainDetailsTitle, 'RATE / SHARE', true);
  drawRow(discomLabel ? `Total ${discomLabel}Bill Amount` : 'Total Main Bill Amount', `Rs. ${formatPdfAmount(bill.totalAvvnlBillAmount)}`);
  drawRow('Total Billed Units', `${formatUnits(bill.totalAvvnlBilledUnits)} Units`);
  drawRow('Active Flats Count', `${bill.calculations.activeFlatsCount} Flats`);
  drawRow('Per Unit Electricity Rate', `Rs. ${bill.calculations.perUnitRate.toFixed(2)} / Unit`, false, true);

  y += 4;
  drawRow('BREAKDOWN & CHARGES CALCULATION', 'AMOUNT (RS)', true);
  drawRow(
    `Flat Own Electricity Amount (${formatUnits(entry.usedUnits)} × Rs. ${bill.calculations.perUnitRate.toFixed(2)})`,
    formatPdfAmount(entry.ownAmount)
  );
  drawRow(
    `Common Units Share (${formatUnits(entry.commonUnitsShare)} Units × Rs. ${bill.calculations.perUnitRate.toFixed(2)})`,
    formatPdfAmount(entry.commonAmountShare)
  );

  if (entry.roundingAdjustment && Math.abs(entry.roundingAdjustment) > 0) {
    drawRow(
      `Rounding Adjustment (${entry.roundingAdjustment > 0 ? '+' : ''}${entry.roundingAdjustment.toFixed(2)})`,
      formatPdfAmount(entry.roundingAdjustment)
    );
  }

  // Grand Total Highlight Box
  y += 4;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 182, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TOTAL AMOUNT PAYABLE:', 22, y + 13);
  doc.setFontSize(16);
  doc.text(`Rs. ${formatPdfAmount(entry.finalPayableAmount)}`, 190, y + 13, { align: 'right' });

  // Footer Note
  y += 32;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Please pay the above amount to building management before due date.', 105, y, {
    align: 'center',
  });
  doc.text(
    'Common units represent electricity consumed by water pump, staircase lighting, and distribution loss.',
    105,
    y + 6,
    { align: 'center' }
  );

  doc.save(`Flat_${entry.flatNumber}_Statement_${formattedMonth.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generates all flats combined PDF table with simple, pure font and no broken '¹' artifact
 */
export function generateAllFlatsCombinedPdf(building: Building, bill: MonthlyBill): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedMonth = formatBillingMonth(bill.billingMonth);
  const discomLabel = bill.discomName ? `${bill.discomName} ` : '';
  const primaryColor = [30, 41, 59];
  const textColor = [51, 65, 85];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('ALL FLATS ELECTRICITY DISTRIBUTION', 105, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${building.name} | Month: ${formattedMonth} | ${discomLabel}Total Bill: Rs. ${formatPdfAmount(bill.totalAvvnlBillAmount)}`,
    105,
    24,
    { align: 'center' }
  );

  // Table header
  let y = 42;
  doc.setFillColor(226, 232, 240);
  doc.rect(10, y, 190, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.text('Flat', 12, y + 5.5);
  doc.text('Tenant', 28, y + 5.5);
  doc.text('Own Units', 65, y + 5.5);
  doc.text('Com. Units', 86, y + 5.5);
  doc.text('Total Units', 108, y + 5.5);
  doc.text('Own Amt (Rs)', 130, y + 5.5);
  doc.text('Com. Amt (Rs)', 152, y + 5.5);
  doc.text('Payable (Rs)', 174, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  bill.flatEntries.forEach((f, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y - 4, 190, 7.5, 'F');
    }
    doc.text(String(f.flatNumber), 12, y + 1);
    doc.text(f.tenantName.slice(0, 16), 28, y + 1);
    doc.text(formatUnits(f.usedUnits), 65, y + 1);
    doc.text(formatUnits(f.commonUnitsShare), 86, y + 1);
    doc.text(formatUnits(f.usedUnits + f.commonUnitsShare), 108, y + 1);
    doc.text(formatPdfAmount(f.ownAmount), 130, y + 1);
    doc.text(formatPdfAmount(f.commonAmountShare), 152, y + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfAmount(f.finalPayableAmount), 174, y + 1);
    doc.setFont('helvetica', 'normal');

    y += 8;
  });

  // Summary Row with clean simple amounts
  doc.setFillColor(226, 232, 240);
  doc.rect(10, y, 190, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 12, y + 5.5);
  doc.text(formatUnits(bill.calculations.totalFlatUnits), 65, y + 5.5);
  doc.text(formatUnits(bill.calculations.commonUnits), 86, y + 5.5);
  doc.text(formatUnits(bill.totalAvvnlBilledUnits), 108, y + 5.5);
  doc.text(formatPdfAmount(bill.totalAvvnlBillAmount), 174, y + 5.5);

  // Footer notes
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Per Unit Rate: Rs. ${bill.calculations.perUnitRate.toFixed(2)} / Unit`, 12, y);
  doc.text(
    `Total Flats: ${bill.flatEntries.length} | Active: ${bill.calculations.activeFlatsCount}`,
    12,
    y + 6
  );
  doc.text(
    `Common Units per Flat: ${formatUnits(bill.calculations.commonUnitsPerFlat)} Units`,
    12,
    y + 12
  );
  doc.text(
    `Equal Common Share: Rs. ${formatPdfAmount(bill.calculations.commonAmountPerFlat)}`,
    12,
    y + 18
  );

  doc.save(
    `${building.name.replace(/\s+/g, '_')}_All_Flats_${formattedMonth.replace(/\s+/g, '_')}.pdf`
  );
}

/**
 * Generates Full Bill PDF with clean simple typography and no broken '¹' artifact
 */
export async function generateFullBillPdfWithHindi(
  building: Building,
  bill: MonthlyBill
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '850px';
  container.style.padding = '32px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', 'Helvetica Neue', Arial, sans-serif";
  container.style.boxSizing = 'border-box';

  const formattedMonth = formatBillingMonth(bill.billingMonth);
  const discomTitle = bill.discomName ? `${bill.discomName} ` : '';

  const rowsHtml = bill.flatEntries
    .map(
      (f, idx) => `
    <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 9px 8px; font-weight: 700; color: #1e293b; text-align: center;">${f.flatNumber}</td>
      <td style="padding: 9px 8px; color: #0f172a; font-weight: 600;">${f.tenantName}</td>
      <td style="padding: 9px 8px; text-align: right; color: #334155;">${formatUnits(f.usedUnits)}</td>
      <td style="padding: 9px 8px; text-align: right; color: #64748b;">${formatUnits(f.commonUnitsShare)}</td>
      <td style="padding: 9px 8px; text-align: right; font-weight: 600; color: #0f172a;">${formatUnits(f.usedUnits + f.commonUnitsShare)}</td>
      <td style="padding: 9px 8px; text-align: right; color: #334155;">${formatPdfAmount(f.ownAmount)}</td>
      <td style="padding: 9px 8px; text-align: right; color: #64748b;">${formatPdfAmount(f.commonAmountShare)}</td>
      <td style="padding: 9px 8px; text-align: right; font-weight: 700; color: #0284c7;">${formatPdfAmount(f.finalPayableAmount)}</td>
      <td style="padding: 9px 8px; text-align: center;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; ${
          f.paymentStatus === 'Paid'
            ? 'background-color: #dcfce7; color: #15803d;'
            : 'background-color: #fee2e2; color: #b91c1c;'
        }">${f.paymentStatus === 'Paid' ? 'Paid (जमा)' : 'Pending (बाकी)'}</span>
      </td>
    </tr>`
    )
    .join('');

  container.innerHTML = `
    <div style="border: 2px solid #0284c7; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', sans-serif;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 20px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">${building.name}</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #38bdf8; font-weight: 600;">
          मासिक ${discomTitle}बिजली बिल वितरण विवरणी (Monthly Electricity Bill Distribution)
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
          महीना: <strong>${formattedMonth}</strong> ${bill.billDate ? `| बिल तारीख: ${bill.billDate}` : ''} ${bill.dueDate ? `| अंतिम तिथि: ${bill.dueDate}` : ''} ${bill.kNumber ? `| K-No: ${bill.kNumber}` : ''}
        </p>
      </div>

      <!-- Quick Metrics Strip -->
      <div style="display: flex; justify-content: space-around; background-color: #f1f5f9; padding: 12px 16px; border-bottom: 2px solid #cbd5e1; font-size: 12px;">
        <div><strong>कुल ${discomTitle}बिल:</strong> <span style="color: #b45309; font-weight: 700; font-size: 14px;">Rs. ${formatPdfAmount(bill.totalAvvnlBillAmount)}</span></div>
        <div><strong>कुल यूनिट:</strong> <span style="color: #0284c7; font-weight: 700; font-size: 14px;">${formatUnits(bill.totalAvvnlBilledUnits)} Units</span></div>
        <div><strong>प्रति यूनिट दर:</strong> <span style="font-weight: 700;">Rs. ${bill.calculations.perUnitRate.toFixed(2)} / Unit</span></div>
        <div><strong>समान कॉमन शेयर:</strong> <span style="font-weight: 700;">${formatUnits(bill.calculations.commonUnitsPerFlat)} Units (Rs. ${formatPdfAmount(bill.calculations.commonAmountPerFlat)})</span></div>
      </div>

      <!-- Main Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #0284c7; color: #ffffff; font-size: 11.5px; text-transform: uppercase;">
            <th style="padding: 10px 8px; text-align: center;">फ्लैट (Flat)</th>
            <th style="padding: 10px 8px; text-align: left;">किरायेदार (Tenant)</th>
            <th style="padding: 10px 8px; text-align: right;">खुद की यूनिट (Own)</th>
            <th style="padding: 10px 8px; text-align: right;">कॉमन शेयर (Com.)</th>
            <th style="padding: 10px 8px; text-align: right;">कुल यूनिट (Total)</th>
            <th style="padding: 10px 8px; text-align: right;">खुद का चार्ज (रु.)</th>
            <th style="padding: 10px 8px; text-align: right;">कॉमन चार्ज (रु.)</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 800;">कुल देय राशि (रु.)</th>
            <th style="padding: 10px 8px; text-align: center;">स्थिति (Status)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #e2e8f0; font-weight: 800; border-top: 2px solid #94a3b8; font-size: 12.5px;">
            <td colspan="2" style="padding: 10px 8px; text-align: center; color: #0f172a;">कुल योग (Total)</td>
            <td style="padding: 10px 8px; text-align: right;">${formatUnits(bill.calculations.totalFlatUnits)}</td>
            <td style="padding: 10px 8px; text-align: right;">${formatUnits(bill.calculations.commonUnits)}</td>
            <td style="padding: 10px 8px; text-align: right;">${formatUnits(bill.totalAvvnlBilledUnits)}</td>
            <td colspan="2" style="padding: 10px 8px; text-align: center; color: #64748b;">(Flats: ${bill.calculations.activeFlatsCount})</td>
            <td style="padding: 10px 8px; text-align: right; color: #0284c7; font-size: 14px; font-weight: 800;">Rs. ${formatPdfAmount(bill.totalAvvnlBillAmount)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <!-- Footer Contact -->
      <div style="padding: 14px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
        <div>
          📢 <strong>सूचना:</strong> कृपया अपनी देय राशि नियत तिथि से पूर्व जमा करवाएं।
        </div>
        <div>
          <strong>प्रबंधक:</strong> ${building.ownerName} (${building.ownerMobile})
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(
      `${building.name.replace(/\s+/g, '_')}_Full_Bill_${formattedMonth.replace(/\s+/g, '_')}.pdf`
    );
  } finally {
    document.body.removeChild(container);
  }
}

export function generateMonthlySummaryPdf(building: Building, bill: MonthlyBill): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedMonth = formatBillingMonth(bill.billingMonth);
  const discomLabel = bill.discomName ? `${bill.discomName} ` : '';

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('MONTHLY ELECTRICITY REPORT', 105, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${building.name} - Billing Month: ${formattedMonth}`, 105, 26, { align: 'center' });

  // Summary Metrics Box
  let y = 46;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);

  const drawMetric = (title: string, value: string) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 190, y + 8, { align: 'right' });
    y += 15;
  };

  drawMetric(discomLabel ? `Main Connection (${discomLabel}K-Number)` : 'Main Connection (K-Number)', bill.kNumber || 'N/A');
  drawMetric(discomLabel ? `Total ${discomLabel}Bill Amount` : 'Total Main Bill Amount', `Rs. ${formatPdfAmount(bill.totalAvvnlBillAmount)}`);
  drawMetric('Total Main Billed Units', `${formatUnits(bill.totalAvvnlBilledUnits)} Units`);
  drawMetric('Total Flat-wise Consumed Units', `${formatUnits(bill.calculations.totalFlatUnits)} Units`);
  drawMetric('Total Common Units (Staircase / Pump / Loss)', `${formatUnits(bill.calculations.commonUnits)} Units`);
  drawMetric('Effective Per-Unit Rate', `Rs. ${bill.calculations.perUnitRate.toFixed(2)} / Unit`);
  drawMetric('Common Units Distributed Per Flat', `${formatUnits(bill.calculations.commonUnitsPerFlat)} Units`);
  drawMetric('Common Share Per Flat', `Rs. ${formatPdfAmount(bill.calculations.commonAmountPerFlat)}`);
  drawMetric('Total Distributed Amount', `Rs. ${formatPdfAmount(bill.calculations.totalDistributedAmount)}`);

  // Payment status
  const paidCount = bill.flatEntries.filter((f) => f.paymentStatus === 'Paid').length;
  const pendingCount = bill.flatEntries.length - paidCount;
  const collectedAmount = bill.flatEntries
    .filter((f) => f.paymentStatus === 'Paid')
    .reduce((sum, f) => sum + f.finalPayableAmount, 0);
  const pendingAmount = bill.totalAvvnlBillAmount - collectedAmount;

  drawMetric('Payments Status', `${paidCount} Paid / ${pendingCount} Pending`);
  drawMetric('Total Collected', `Rs. ${formatPdfAmount(collectedAmount)}`);
  drawMetric('Total Pending Collection', `Rs. ${formatPdfAmount(pendingAmount)}`);

  doc.save(`${building.name.replace(/\s+/g, '_')}_Monthly_Report_${formattedMonth.replace(/\s+/g, '_')}.pdf`);
}
