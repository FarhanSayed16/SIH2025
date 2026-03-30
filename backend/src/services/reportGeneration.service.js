/**
 * Phase 3.4.1: Report Generation Service
 * Generates PDF, Excel, and CSV reports from analytics data
 */

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import csvWriter from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDrillPerformanceMetrics,
  getStudentProgressMetrics,
  getInstitutionAnalytics,
  getModuleCompletionRates,
  getGamePerformanceAnalytics,
  getQuizAccuracyTrends
} from './analytics.service.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create reports directory if it doesn't exist
const REPORTS_DIR = path.join(__dirname, '../../uploads/reports');
try {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
} catch (err) {
  logger.warn('Reports directory creation failed:', err.message);
}

/**
 * Generate PDF report
 * @param {Object} options - Report options
 * @param {string} options.reportType - Type of report (drills, students, institution, modules, games, quizzes, comprehensive)
 * @param {string} options.institutionId - Institution ID
 * @param {Object} options.dateRange - Date range {start: Date, end: Date}
 * @param {Object} options.filters - Additional filters
 * @returns {Promise<Object>} Report file path and metadata
 */
export const generatePDFReport = async (options) => {
  try {
    const { reportType, institutionId, dateRange, filters = {} } = options;

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(reportType, institutionId, dateRange, filters);

    // Generate filename with Edusafe branding
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `Edusafe_report_${reportType}_${timestamp}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
    const fileUrl = `/uploads/reports/${filename}`;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add header
    doc.fontSize(20)
      .fillColor('#1a1a1a')
      .text('Edusafe Analytics Report', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(12)
      .fillColor('#666666')
      .text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

    if (dateRange) {
      doc.moveDown(0.5);
      doc.text(`Date Range: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Add content based on report type
    await addPDFContent(doc, reportType, analyticsData);

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          filename,
          filepath,
          fileUrl,
          size: fs.statSync(filepath).size,
          type: 'application/pdf'
        });
      });

      stream.on('error', reject);
    });
  } catch (error) {
    logger.error('Generate PDF report error:', error);
    throw error;
  }
};

/**
 * Generate Excel report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report file path and metadata
 */
export const generateExcelReport = async (options) => {
  try {
    const { reportType, institutionId, dateRange, filters = {} } = options;

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(reportType, institutionId, dateRange, filters);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Edusafe Analytics';
    workbook.created = new Date();

    // Generate filename with Edusafe branding
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `Edusafe_report_${reportType}_${timestamp}.xlsx`;
    const filepath = path.join(REPORTS_DIR, filename);
    const fileUrl = `/uploads/reports/${filename}`;

    // Add content based on report type
    await addExcelContent(workbook, reportType, analyticsData, dateRange);

    // Write file
    await workbook.xlsx.writeFile(filepath);

    return {
      filename,
      filepath,
      fileUrl,
      size: fs.statSync(filepath).size,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    logger.error('Generate Excel report error:', error);
    throw error;
  }
};

/**
 * Generate CSV report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report file path and metadata
 */
export const generateCSVReport = async (options) => {
  try {
    const { reportType, institutionId, dateRange, filters = {} } = options;

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(reportType, institutionId, dateRange, filters);

    // Generate filename with Edusafe branding
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `Edusafe_report_${reportType}_${timestamp}.csv`;
    const filepath = path.join(REPORTS_DIR, filename);
    const fileUrl = `/uploads/reports/${filename}`;

    // Prepare CSV data
    const csvData = prepareCSVData(reportType, analyticsData);

    // Create CSV writer
    const writer = csvWriter.createObjectCsvWriter({
      path: filepath,
      header: csvData.headers
    });

    // Write data
    await writer.writeRecords(csvData.records);

    return {
      filename,
      filepath,
      fileUrl,
      size: fs.statSync(filepath).size,
      type: 'text/csv'
    };
  } catch (error) {
    logger.error('Generate CSV report error:', error);
    throw error;
  }
};

/**
 * Fetch analytics data based on report type
 */
async function fetchAnalyticsData(reportType, institutionId, dateRange, filters) {
  switch (reportType) {
    case 'drills':
      return await getDrillPerformanceMetrics(institutionId, filters.drillId, dateRange);
    
    case 'students':
      return await getStudentProgressMetrics(institutionId, filters.classId, filters.userId, dateRange);
    
    case 'institution':
      return await getInstitutionAnalytics(institutionId, dateRange);
    
    case 'modules':
      return await getModuleCompletionRates(institutionId, dateRange);
    
    case 'games':
      return await getGamePerformanceAnalytics(institutionId, filters.gameType, dateRange);
    
    case 'quizzes':
      return await getQuizAccuracyTrends(institutionId, filters.moduleId, dateRange);
    
    case 'comprehensive':
      // Fetch all analytics
      return {
        drills: await getDrillPerformanceMetrics(institutionId, null, dateRange),
        students: await getStudentProgressMetrics(institutionId, null, null, dateRange),
        institution: await getInstitutionAnalytics(institutionId, dateRange),
        modules: await getModuleCompletionRates(institutionId, dateRange),
        games: await getGamePerformanceAnalytics(institutionId, null, dateRange),
        quizzes: await getQuizAccuracyTrends(institutionId, null, dateRange)
      };
    
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

/**
 * Add content to PDF based on report type
 */
async function addPDFContent(doc, reportType, data) {
  doc.fontSize(14).fillColor('#1a1a1a');

  switch (reportType) {
    case 'drills':
      doc.text('Drill Performance Metrics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Total Participants: ${data.totalParticipants || 0}`);
      doc.text(`Average Evacuation Time: ${Math.round(data.avgEvacuationTime || 0)}s`);
      doc.text(`Min Time: ${Math.round(data.minEvacuationTime || 0)}s`);
      doc.text(`Max Time: ${Math.round(data.maxEvacuationTime || 0)}s`);
      doc.text(`Average Score: ${Math.round(data.avgScore || 0)}%`);
      break;

    case 'students':
      doc.text('Student Progress Metrics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Total Students: ${data.summary?.totalStudents || 0}`);
      doc.text(`Avg Modules Completed: ${data.summary?.avgModulesCompleted || 0}`);
      doc.text(`Avg Preparedness Score: ${data.summary?.avgPreparednessScore || 0}%`);
      doc.text(`Avg Login Streak: ${data.summary?.avgLoginStreak || 0} days`);
      break;

    case 'institution':
      doc.text('Institution Analytics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Institution: ${data.institution?.name || 'Unknown'}`);
      doc.text(`Total Users: ${data.institution?.totalUsers || 0}`);
      doc.text(`Total Classes: ${data.institution?.totalClasses || 0}`);
      doc.text(`Total Quizzes: ${data.activities?.totalQuizzes || 0}`);
      doc.text(`Total Games: ${data.activities?.totalGames || 0}`);
      break;

    case 'modules':
      doc.text('Module Completion Rates', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      if (Array.isArray(data)) {
        data.slice(0, 10).forEach(module => {
          doc.text(`${module.moduleTitle}: ${module.completionRate}% (${module.completedCount}/${module.totalStudents})`);
        });
      }
      break;

    case 'games':
      doc.text('Game Performance Analytics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      if (data.byGameType && Array.isArray(data.byGameType)) {
        data.byGameType.forEach(game => {
          doc.text(`${game.gameType}: ${game.totalGames} games, Avg Score: ${game.avgScore}`);
        });
      }
      break;

    case 'quizzes':
      doc.text('Quiz Accuracy Trends', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      if (data.byModule && Array.isArray(data.byModule)) {
        data.byModule.slice(0, 10).forEach(module => {
          doc.text(`${module.moduleTitle}: ${module.avgScore}% avg, ${module.passRate}% pass rate`);
        });
      }
      break;

    case 'comprehensive':
      // Add all sections
      Object.keys(data).forEach(key => {
        doc.addPage();
        doc.fontSize(14).fillColor('#1a1a1a');
        doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)} Analytics`, { underline: true });
        doc.moveDown(1);
      });
      break;
  }
}

/**
 * Add content to Excel workbook
 */
async function addExcelContent(workbook, reportType, data, dateRange) {
  let worksheet;

  switch (reportType) {
    case 'drills':
      worksheet = workbook.addWorksheet('Drill Performance');
      worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      worksheet.addRow({ metric: 'Total Participants', value: data.totalParticipants || 0 });
      worksheet.addRow({ metric: 'Avg Evacuation Time (s)', value: Math.round(data.avgEvacuationTime || 0) });
      worksheet.addRow({ metric: 'Min Time (s)', value: Math.round(data.minEvacuationTime || 0) });
      worksheet.addRow({ metric: 'Max Time (s)', value: Math.round(data.maxEvacuationTime || 0) });
      worksheet.addRow({ metric: 'Avg Score (%)', value: Math.round(data.avgScore || 0) });
      break;

    case 'students':
      worksheet = workbook.addWorksheet('Student Progress');
      worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      worksheet.addRow({ metric: 'Total Students', value: data.summary?.totalStudents || 0 });
      worksheet.addRow({ metric: 'Avg Modules Completed', value: data.summary?.avgModulesCompleted || 0 });
      worksheet.addRow({ metric: 'Avg Preparedness Score', value: `${data.summary?.avgPreparednessScore || 0}%` });
      worksheet.addRow({ metric: 'Avg Login Streak', value: `${data.summary?.avgLoginStreak || 0} days` });
      break;

    case 'modules':
      worksheet = workbook.addWorksheet('Module Completion');
      worksheet.columns = [
        { header: 'Module', key: 'module', width: 40 },
        { header: 'Completed', key: 'completed', width: 15 },
        { header: 'Total Students', key: 'total', width: 15 },
        { header: 'Completion Rate (%)', key: 'rate', width: 20 }
      ];
      if (Array.isArray(data)) {
        data.forEach(module => {
          worksheet.addRow({
            module: module.moduleTitle,
            completed: module.completedCount,
            total: module.totalStudents,
            rate: module.completionRate
          });
        });
      }
      break;

    case 'comprehensive':
      // Add multiple worksheets
      Object.keys(data).forEach(key => {
        const ws = workbook.addWorksheet(key.charAt(0).toUpperCase() + key.slice(1));
        // Add summary data
        ws.columns = [{ header: 'Key', key: 'key' }, { header: 'Value', key: 'value' }];
        ws.addRow({ key: 'Report Type', value: key });
        ws.addRow({ key: 'Generated', value: new Date().toISOString() });
      });
      break;

    default:
      worksheet = workbook.addWorksheet('Report');
      worksheet.addRow({ A: 'Report Data', B: JSON.stringify(data, null, 2) });
  }

  // Style header row
  if (worksheet) {
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
}

/**
 * Prepare CSV data
 */
function prepareCSVData(reportType, data) {
  switch (reportType) {
    case 'drills':
      return {
        headers: [
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' }
        ],
        records: [
          { metric: 'Total Participants', value: data.totalParticipants || 0 },
          { metric: 'Avg Evacuation Time (s)', value: Math.round(data.avgEvacuationTime || 0) },
          { metric: 'Min Time (s)', value: Math.round(data.minEvacuationTime || 0) },
          { metric: 'Max Time (s)', value: Math.round(data.maxEvacuationTime || 0) },
          { metric: 'Avg Score (%)', value: Math.round(data.avgScore || 0) }
        ]
      };

    case 'modules':
      return {
        headers: [
          { id: 'module', title: 'Module' },
          { id: 'completed', title: 'Completed' },
          { id: 'total', title: 'Total Students' },
          { id: 'rate', title: 'Completion Rate (%)' }
        ],
        records: Array.isArray(data) ? data.map(m => ({
          module: m.moduleTitle,
          completed: m.completedCount,
          total: m.totalStudents,
          rate: m.completionRate
        })) : []
      };

    default:
      return {
        headers: [{ id: 'data', title: 'Data' }],
        records: [{ data: JSON.stringify(data) }]
      };
  }
}

