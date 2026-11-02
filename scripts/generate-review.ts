import fs from 'fs';
import path from 'path';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { mr } from '../src/i18n/mr';
import { kn } from '../src/i18n/kn';

function getContext(key: string): string {
  if (key.startsWith('p_') || key.startsWith('job_')) return 'Partner';
  if (key.startsWith('survey_') || key.startsWith('age_') || key.startsWith('issue_') || key.startsWith('interest_')) return 'Survey';
  if (key.startsWith('modal_') || key.startsWith('aa_') || key.startsWith('kfs_') || key.startsWith('consent_') || key.startsWith('pay_modal_') || key.startsWith('full_pay_')) return 'Modal';
  if (key.startsWith('prod_') || key.startsWith('cat_') || key.startsWith('buy_') || key.startsWith('hl_') || key.startsWith('filter_') || key.startsWith('sort_') || key.startsWith('orders_') || key.startsWith('shopping_')) return 'Marketplace';
  if (key.startsWith('note_')) return 'Seed';
  if (key.startsWith('lbl_') || key.startsWith('opt_') || key.startsWith('sym_') || key.startsWith('badge_') || key.startsWith('warranty_') || key.startsWith('fault_')) return 'Assumption';
  if (key.startsWith('c_') || key.startsWith('cust_') || key.startsWith('nav_') || key.startsWith('tab_') || key.startsWith('registered_') || key.startsWith('booking_')) return 'Customer';
  return 'Shared';
}

function escapePipes(text: string): string {
  if (!text) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function generateReviewMarkdown(): void {
  const keys = Object.keys(en).sort();
  console.log(`Generating REVIEW.md for ${keys.length} keys...`);

  let md = `# Translation Review Table\n\n`;
  md += `This document provides the complete dictionary across all 4 supported languages: English (\`en\`), Hindi (\`hi\`), Marathi (\`mr\`), and Kannada (\`kn\`).\n\n`;
  md += `Total verified keys: **${keys.length}**\n\n`;
  md += `| Key | Context | en | hi | mr | kn |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const key of keys) {
    const context = getContext(key);
    const enText = escapePipes((en as Record<string, string>)[key] || '');
    const hiText = escapePipes((hi as Record<string, string>)[key] || '');
    const mrText = escapePipes((mr as Record<string, string>)[key] || '');
    const knText = escapePipes((kn as Record<string, string>)[key] || '');

    md += `| \`${key}\` | ${context} | ${enText} | ${hiText} | ${mrText} | ${knText} |\n`;
  }

  const outPath = path.resolve(__dirname, '../src/i18n/REVIEW.md');
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`Successfully written REVIEW.md to ${outPath}`);
}

generateReviewMarkdown();
