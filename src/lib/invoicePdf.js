import { jsPDF } from 'jspdf';
import dejavuSansUrl from '@/assets/fonts/DejaVuSans.ttf?url';
import { calculateInvoiceTotals, formatDateHu, formatMoneyHu } from './invoice';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
  navy: [17, 38, 65],
  orange: [235, 104, 35],
  gray: [93, 105, 120],
  line: [218, 224, 231],
  pale: [245, 247, 250],
};

async function loadFontBase64() {
  const response = await fetch(dejavuSansUrl);
  if (!response.ok) throw new Error('A számla PDF betűtípusát nem sikerült betölteni.');

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function addWatermark(doc) {
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(24);
  doc.setTextColor(238, 240, 243);
  doc.text('MINTA - NEM VALÓDI SZÁMLA', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
    align: 'center',
    angle: 32,
  });
  doc.setTextColor(...COLORS.navy);
}

function addFooter(doc, pageNumber, pageCount) {
  doc.setDrawColor(...COLORS.line);
  doc.line(MARGIN, PAGE_HEIGHT - 17, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 17);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text('MINTA - NEM VALÓDI SZÁMLA - nem alkalmas könyvelési vagy adózási célra', MARGIN, PAGE_HEIGHT - 11);
  doc.text(`${pageNumber} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 11, { align: 'right' });
}

function addPageHeader(doc, invoiceNumber, issueDate) {
  addWatermark(doc);
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_WIDTH, 35, 'F');
  doc.setFillColor(...COLORS.orange);
  doc.rect(0, 35, PAGE_WIDTH, 2, 'F');
  doc.setFont('DejaVuSans', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('PROFI AUTÓSZERVIZ', MARGIN, 15);
  doc.setFontSize(9);
  doc.text('SZÁMLA MINTA', MARGIN, 23);
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8);
  doc.text(`Azonosító: ${invoiceNumber}`, PAGE_WIDTH - MARGIN, 15, { align: 'right' });
  doc.text(`Kiállítás dátuma: ${issueDate}`, PAGE_WIDTH - MARGIN, 23, { align: 'right' });

  doc.setFillColor(255, 242, 231);
  doc.roundedRect(MARGIN, 41, CONTENT_WIDTH, 10, 2, 2, 'F');
  doc.setFont('DejaVuSans', 'bold');
  doc.setTextColor(...COLORS.orange);
  doc.setFontSize(9);
  doc.text('MINTA - NEM VALÓDI SZÁMLA', PAGE_WIDTH / 2, 47.5, { align: 'center' });
  doc.setTextColor(...COLORS.navy);
}

function addTableHeader(doc, y) {
  const columns = [
    { title: 'Megnevezés', width: 49, align: 'left' },
    { title: 'Menny.', width: 13, align: 'right' },
    { title: 'Egys. ár', width: 24, align: 'right' },
    { title: 'ÁFA %', width: 13, align: 'right' },
    { title: 'Nettó', width: 26, align: 'right' },
    { title: 'ÁFA', width: 24, align: 'right' },
    { title: 'Bruttó', width: 33, align: 'right' },
  ];
  doc.setFillColor(...COLORS.navy);
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 9, 'F');
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let x = MARGIN;
  columns.forEach((column) => {
    const textX = column.align === 'left' ? x + 2 : x + column.width - 2;
    doc.text(column.title, textX, y + 1, { align: column.align });
    x += column.width;
  });

  doc.setTextColor(...COLORS.navy);
  return columns;
}

export async function createInvoicePdf(invoice) {
  const fontBase64 = await loadFontBase64();
  const doc = new jsPDF({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');
  doc.setFont('DejaVuSans', 'normal');

  const issueDate = formatDateHu(invoice.issueDate || new Date());
  addPageHeader(doc, invoice.invoiceNumber, issueDate);
  doc.setFontSize(8);

  doc.setFillColor(...COLORS.pale);
  doc.roundedRect(MARGIN, 58, 88, 31, 2, 2, 'F');
  doc.roundedRect(108, 58, 88, 31, 2, 2, 'F');
  doc.setFont('DejaVuSans', 'bold');
  doc.text('Kibocsátó (minta)', MARGIN + 4, 65);
  doc.text('Vásárló', 112, 65);
  doc.setFont('DejaVuSans', 'normal');
  doc.text('Profi Autószerviz', MARGIN + 4, 72);
  doc.text('Demonstrációs dokumentum', MARGIN + 4, 78);
  doc.text('Jogi és adózási adatok nincsenek feltüntetve.', MARGIN + 4, 84);
  doc.text(invoice.customerName || '–', 112, 72);
  doc.text(invoice.customerEmail || '–', 112, 78);
  doc.text(invoice.customerPhone || '–', 112, 84);

  doc.setFont('DejaVuSans', 'bold');
  doc.text('Jármű / foglalás', MARGIN, 98);
  doc.setFont('DejaVuSans', 'normal');
  const vehicle = [invoice.car, invoice.licensePlate].filter(Boolean).join(' · ');
  doc.text(vehicle || 'Nincs megadva', MARGIN + 34, 98);

  let y = 110;
  const columns = addTableHeader(doc, y);
  y += 9;
  const totals = calculateInvoiceTotals(invoice.items);

  totals.lines.forEach((line) => {
    const description = doc.splitTextToSize(line.name || 'Szerviztetel', columns[0].width - 4);
    const rowHeight = Math.max(9, description.length * 3.8 + 4);
    if (y + rowHeight > PAGE_HEIGHT - 28) {
      doc.addPage();
      addPageHeader(doc, invoice.invoiceNumber, issueDate);
      y = 62;
      addTableHeader(doc, y);
      y += 9;
    }

    doc.setDrawColor(...COLORS.line);
    doc.line(MARGIN, y + rowHeight - 1, PAGE_WIDTH - MARGIN, y + rowHeight - 1);
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(7);
    doc.text(description, MARGIN + 2, y + 3);

    const values = [
      line.quantity.toLocaleString('hu-HU'),
      formatMoneyHu(line.grossUnitPrice),
      `${Math.round(line.vatRate * 100)}%`,
      formatMoneyHu(line.netTotal),
      formatMoneyHu(line.vatTotal),
      formatMoneyHu(line.grossTotal),
    ];
    let x = MARGIN + columns[0].width;
    values.forEach((value, index) => {
      const column = columns[index + 1];
      doc.text(value, x + column.width - 2, y + 3, { align: 'right' });
      x += column.width;
    });
    y += rowHeight;
  });

  y += 10;
  if (y > PAGE_HEIGHT - 55) {
    doc.addPage();
    addPageHeader(doc, invoice.invoiceNumber, issueDate);
    y = 64;
  }

  const vatGroups = totals.lines.reduce((groups, line) => {
    const rate = Math.round(line.vatRate * 100);
    const group = groups.get(rate) || { net: 0, vat: 0 };
    group.net += line.netTotal;
    group.vat += line.vatTotal;
    groups.set(rate, group);
    return groups;
  }, new Map());

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(8);
  doc.text('ÁFA-összesítő', MARGIN, y);
  y += 5;
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(7);
  for (const [rate, group] of vatGroups.entries()) {
    doc.text(`${rate}% ÁFA alap: ${formatMoneyHu(group.net)}   ÁFA: ${formatMoneyHu(group.vat)}`, MARGIN, y);
    y += 4;
  }

  const totalX = PAGE_WIDTH - MARGIN;
  const totalRows = [
    ['Nettó összesen', totals.net, false],
    ['ÁFA összesen', totals.vat, false],
    ['Fizetendő (bruttó)', totals.gross, true],
  ];
  let totalY = y - Math.max(0, vatGroups.size - 1) * 4;
  totalRows.forEach(([label, amount, isGross]) => {
    if (isGross) {
      doc.setFillColor(...COLORS.navy);
      doc.roundedRect(108, totalY - 5, 88, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(...COLORS.navy);
    }
    doc.setFont('DejaVuSans', isGross ? 'bold' : 'normal');
    doc.setFontSize(isGross ? 9 : 8);
    doc.text(label, 112, totalY + 1);
    doc.text(formatMoneyHu(amount), totalX - 3, totalY + 1, { align: 'right' });
    totalY += 11;
  });

  if (invoice.notes) {
    const notesY = Math.max(y + 7, totalY + 3);
    const noteLines = doc.splitTextToSize(invoice.notes, CONTENT_WIDTH);
    if (notesY + noteLines.length * 4 > PAGE_HEIGHT - 25) {
      doc.addPage();
      addPageHeader(doc, invoice.invoiceNumber, issueDate);
      y = 64;
    } else {
      y = notesY;
    }
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(8);
    doc.text('Megjegyzés', MARGIN, y);
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(7);
    doc.text(noteLines, MARGIN, y + 5);
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    addFooter(doc, page, pageCount);
  }

  const dataUri = doc.output('datauristring');
  const pdfBase64 = dataUri.slice(dataUri.indexOf(',') + 1);
  return { pdfBase64, totals };
}
