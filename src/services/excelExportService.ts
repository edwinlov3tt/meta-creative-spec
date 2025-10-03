import ExcelJS from 'exceljs';
import type { SpecExport } from '@/types/creative';
import {
  CREATIVE_SPEC_FIELD_MAPPING,
  EXCEL_SHEET_NAME,
  ExportErrorException
} from '@/types/export';

export class ExcelExportService {
  private templatePath = '/templates/meta-creative-spec-sheet.xlsx';

  /**
   * Load the Excel template file
   */
  private async loadTemplate(): Promise<ExcelJS.Workbook> {
    try {
      const response = await fetch(this.templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      return workbook;
    } catch (error) {
      throw new ExportErrorException({
        code: 'TEMPLATE_LOAD_ERROR',
        message: 'Failed to load Excel template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Map creative spec data to cell values
   */
  private mapSpecData(spec: SpecExport, facebookUrl?: string): Record<string, string> {
    return {
      [CREATIVE_SPEC_FIELD_MAPPING.adName]: spec.refName || spec.adName || 'Untitled Ad',
      [CREATIVE_SPEC_FIELD_MAPPING.postText]: spec.postText || '',
      [CREATIVE_SPEC_FIELD_MAPPING.imageName]: spec.imageName || 'creative-image',
      [CREATIVE_SPEC_FIELD_MAPPING.facebookPageUrl]: facebookUrl || spec.facebookPageUrl || '',
      [CREATIVE_SPEC_FIELD_MAPPING.headline]: spec.headline || '',
      [CREATIVE_SPEC_FIELD_MAPPING.linkDescription]: spec.description || '',
      [CREATIVE_SPEC_FIELD_MAPPING.destinationUrl]: spec.destinationUrl || '',
      [CREATIVE_SPEC_FIELD_MAPPING.displayLink]: spec.displayLink || '',
      [CREATIVE_SPEC_FIELD_MAPPING.callToAction]: spec.cta || ''
    };
  }

  /**
   * Apply data to worksheet cells (supports both single cells and merged ranges)
   */
  private applyDataToSheet(worksheet: ExcelJS.Worksheet, dataMapping: Record<string, string>): void {
    Object.entries(dataMapping).forEach(([cellRef, value]) => {
      if (!value) return; // Skip empty values

      // Handle merged cell ranges (e.g., "D26:H26")
      if (cellRef.includes(':')) {
        const [startCell] = cellRef.split(':');
        const cell = worksheet.getCell(startCell);
        if (cell) {
          cell.value = value;
        }
      } else {
        // Handle single cell
        const cell = worksheet.getCell(cellRef);
        if (cell) {
          cell.value = value;
        }
      }
    });
  }

  /**
   * Generate populated Excel file
   */
  async generateExcel(spec: SpecExport, facebookUrl?: string): Promise<Buffer> {
    try {
      // Load template
      const workbook = await this.loadTemplate();

      // Get the spec sheet (try multiple possible names)
      let specSheet = workbook.getWorksheet(EXCEL_SHEET_NAME);

      // If not found, try the first sheet
      if (!specSheet) {
        specSheet = workbook.worksheets[0];
      }

      if (!specSheet) {
        throw new Error('Could not find worksheet in template');
      }

      // Map and apply data
      const specData = this.mapSpecData(spec, facebookUrl);
      this.applyDataToSheet(specSheet, specData);

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);

    } catch (error) {
      if (error instanceof ExportErrorException) {
        throw error;
      }

      throw new ExportErrorException({
        code: 'EXCEL_GENERATION_ERROR',
        message: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate filename for export
   */
  generateFilename(adName: string, includeTimestamp = true): string {
    const sanitizedName = adName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    return `Meta_Creative_Spec_Sheet_${sanitizedName}${timestamp}.xlsx`;
  }
}
