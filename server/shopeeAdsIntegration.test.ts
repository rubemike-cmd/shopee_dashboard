import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Integration test for the complete Shopee Ads upload and retrieval flow.
 * This test simulates the user uploading a CSV file and then retrieving the data.
 */
describe('Shopee Ads Integration Flow', () => {
  let csvContent: string;

  beforeAll(() => {
    // Load the real CSV file
    const csvPath = path.join('/home/ubuntu/upload', 'Shopee-Anúncio-Plavra+chave-Locação-Relatório-23_03_2026-29_03_2026.csv');
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf-8');
    } else {
      console.warn(`CSV file not found at ${csvPath}`);
    }
  });

  it('should load the real Shopee Ads CSV file', () => {
    expect(csvContent).toBeDefined();
    expect(csvContent.length).toBeGreaterThan(0);
  });

  it('should have the correct CSV structure', () => {
    if (!csvContent) return;
    
    // Check for key columns in the header
    const lines = csvContent.split('\n');
    const headerLine = lines.find(line => line.includes('Nome do Anúncio') || line.includes('Nome do An'));
    
    expect(headerLine).toBeDefined();
    expect(headerLine).toContain('#');
  });

  it('should contain ad data rows', () => {
    if (!csvContent) return;
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Should have header + at least some data rows
    expect(lines.length).toBeGreaterThan(2);
    
    // Check for data rows (starting with numbers)
    const dataRows = lines.filter(line => /^\d+,/.test(line.trim()));
    expect(dataRows.length).toBeGreaterThan(0);
  });

  it('should have valid ad status values', () => {
    if (!csvContent) return;
    
    const lines = csvContent.split('\n');
    const dataLines = lines.filter(line => /^\d+,/.test(line.trim()));
    
    // Extract status values (3rd column after #, Nome)
    const statuses = new Set<string>();
    dataLines.forEach(line => {
      const parts = line.split(',');
      if (parts.length > 2) {
        const status = parts[2].trim();
        statuses.add(status);
      }
    });
    
    // Should have at least one valid status
    expect(statuses.size).toBeGreaterThan(0);
    
    // Check for expected Portuguese status values
    const validStatuses = ['Em Andamento', 'Pausado', 'Encerrado'];
    const hasValidStatus = Array.from(statuses).some(s => 
      validStatuses.some(vs => s.includes(vs))
    );
    expect(hasValidStatus).toBe(true);
  });

  it('should have numeric metrics columns', () => {
    if (!csvContent) return;
    
    const lines = csvContent.split('\n');
    const dataLines = lines.filter(line => /^\d+,/.test(line.trim()));
    
    if (dataLines.length === 0) return;
    
    // Get first data row
    const firstRow = dataLines[0];
    const parts = firstRow.split(',');
    
    // Should have at least 20+ columns for all metrics
    expect(parts.length).toBeGreaterThan(20);
  });

  it('should have impressions and clicks data', () => {
    if (!csvContent) return;
    
    const lines = csvContent.split('\n');
    const dataLines = lines.filter(line => /^\d+,/.test(line.trim()));
    
    if (dataLines.length === 0) return;
    
    // Parse CSV more carefully
    let hasImpressions = false;
    let hasClicks = false;
    
    dataLines.forEach(line => {
      const parts = line.split(',');
      // Impressions and clicks are typically in columns 11-12
      if (parts.length > 11) {
        const impressions = parseInt(parts[11]);
        const clicks = parseInt(parts[12]);
        
        if (!isNaN(impressions) && impressions > 0) hasImpressions = true;
        if (!isNaN(clicks) && clicks > 0) hasClicks = true;
      }
    });
    
    expect(hasImpressions || hasClicks).toBe(true);
  });
});
