import { describe, expect, it } from '@jest/globals';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

describe('Patched dependency compatibility', () => {
  it('round-trips an Excel export through the overridden UUID dependency', async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Users').addRow(['Name', 'Student']);
    const bytes = await workbook.xlsx.writeBuffer();
    const restored = new ExcelJS.Workbook();
    await restored.xlsx.load(bytes);
    expect(restored.getWorksheet('Users').getCell('B1').value).toBe('Student');
  });
  it('encodes an uploaded image using the patched native Sharp library', async () => {
    const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
    expect(await sharp(bytes).metadata()).toMatchObject({ format: 'png', width: 2, height: 2 });
  });
  it('generates email locally without SMTP or external delivery', async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const result = await transport.sendMail({ from: 'test@example.com', to: 'recipient@example.com', subject: 'Test', text: 'Reset notification' });
    expect(result.message.toString()).toContain('Reset notification');
  });
  it('creates a PDF with the client report library', () => {
    const doc = new jsPDF();
    doc.text('Kavach report', 10, 10);
    expect(doc.output()).toContain('%PDF-');
  });
});
