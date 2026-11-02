import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';

// Handle ES module / CommonJS interop for @babel/traverse
const traverse = (_traverse as any).default || _traverse;

export interface AuditHit {
  file: string;
  line: number;
  type: string;
  text: string;
}

// Brand names, model names, standard abbreviations, tech terms allowed in Latin
const ALLOWLIST_WORDS = new Set([
  'uc',
  'emi',
  'aa',
  'kfs',
  'upi',
  'bee',
  'rs',
  'voltas',
  'lg',
  'daikin',
  'samsung',
  'whirlpool',
  'ifb',
  'bosch',
  'kent',
  'ao',
  'smith',
  'urban',
  'company',
  'native',
  'aarambh',
  'bank',
  'm1',
  'm2',
  'ro',
  'uv',
  'uf',
  'mtds',
  'copper',
  'alkaline',
  'kg',
  'ton',
  'star',
  'c',
  'rh',
  'aqi',
  'tds',
  'grid',
  'sla',
  'id',
  'gps',
  'en',
  'hi',
  'mr',
  'kn',
]);

// Persona names allowed in Latin
const ALLOWLIST_NAMES = new Set([
  'mahesh',
  'surve',
  'riya',
  'mehta',
  'suresh',
  'nair',
  'imran',
  'khan',
  'sanjay',
  'verma',
  'deepak',
  'more',
  'pooja',
  'sharma',
  'arjun',
  'patel',
  'priya',
  'sharma',
  'vikram',
  'singh',
  'ananya',
  'deshmukh',
  'rahul',
  'verma',
  'sneha',
  'kulkarni',
  'amit',
  'joshi',
  'neha',
  'gupta',
]);

// Enum values or code strings that are not displayed text
const ALLOWLIST_EXACT = new Set([
  'en-IN',
  'button',
  'submit',
  'checkbox',
  'radio',
  'text',
  'number',
  'range',
  'AC',
  'FRIDGE',
  'WASHER',
  'GEYSER',
  'PURIFIER',
  'ALL',
  'FULL',
  'EMI',
  'split',
  'professional',
  'customer',
  'ops',
  'select',
  'boolean',
  'href',
  'download',
  'normal',
  'faulty',
  'Compressor',
  'FULL_UPI',
  'FULL_CARD',
  'FULL_NETBANKING',
  'COMPLAINT',
  'FEEDBACK',
  'NO_COST_EMI',
  'REPAIR',
  'REPLACE',
  'DEFER',
  'BOTH_LEAN_REPAIR',
  'BOTH_LEAN_REPLACE',
  'BOOKED',
  'ASSIGNED',
  'INSPECTED',
  'COMPARISON_SHOWN',
  'REPAIR_CHOSEN',
  'REPLACE_CHOSEN',
  'COMPLETED',
  'CANCELLED',
  'DISPATCHED',
  'DELIVERED',
  'CONFIRMED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'MANUAL_REVIEW',
  'SUBMITTED',
  'DECIDED',
  'DISBURSED',
  'COOLING_OFF',
  'CLOSED',
  'BUREAU',
  'AA',
  'STABLE',
  'MODERATE',
  'SEVERE',
  'HIGH',
  'MEDIUM',
  'LOW',
  'High',
  'Medium',
  'Low',
  'IDLE',
  'BUSY',
  'ON_JOB',
  'YES',
  'MAYBE',
  'NO',
  'NONE',
  'NOT_WORKING',
  'NOISY',
  'HIGH_BILL',
  'FREQUENT_REPAIR',
  'UNDER_1',
  '1_TO_3',
  '3_TO_5',
  '5_TO_8',
  'OVER_8',
  'checkout',
  'exit',
  'services',
  'native',
  'home',
  'book',
  'tracker',
  'marketplace',
  'notifications',
  'consent',
  'exitsurvey',
  'jobs',
  'sales',
  'earnings',
  'loans',
  'demand',
]);

const HTML_TECH_ATTRS = new Set([
  'className',
  'data-testid',
  'key',
  'id',
  'type',
  'target',
  'rel',
  'role',
  'autoComplete',
  'name',
  'stroke',
  'fill',
  'strokeWidth',
  'strokeLinecap',
  'strokeLinejoin',
  'value',
  'viewBox',
  'd',
  'xmlns',
  'style',
  'tabIndex',
  'aria-hidden',
]);

function isTailwindCssString(text: string): boolean {
  // Check if string consists purely of typical Tailwind tokens
  const tokens = text.trim().split(/\s+/);
  if (tokens.length === 0) return true;
  const tailwindPrefixes = [
    'bg-', 'text-', 'border-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
    'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-', 'w-', 'h-', 'min-', 'max-',
    'flex', 'grid', 'items-', 'justify-', 'gap-', 'rounded', 'shadow', 'font-',
    'truncate', 'transition', 'cursor-', 'hover:', 'focus:', 'group-', 'space-',
    'col-', 'row-', 'relative', 'absolute', 'fixed', 'inset-', 'top-', 'bottom-',
    'left-', 'right-', 'z-', 'overflow-', 'hidden', 'block', 'inline', 'select-',
    'opacity-', 'animate-', 'leading-', 'tracking-', 'capitalize', 'uppercase',
    'lowercase', 'whitespace-', 'border', 'ring-', 'outline-', 'shrink-', 'grow-',
  ];

  return tokens.every((token) => {
    if (!token) return true;
    return tailwindPrefixes.some((p) => token.startsWith(p) || token.includes(':'));
  });
}

function isTranslationKey(val: string): boolean {
  return (
    val.includes('.') ||
    val.startsWith('p_') ||
    val.startsWith('tab_') ||
    val.startsWith('q_') ||
    val.startsWith('app_') ||
    val.startsWith('appliance_') ||
    val.startsWith('city_') ||
    val.startsWith('zone_') ||
    val.startsWith('fault_') ||
    val.startsWith('status_') ||
    val.startsWith('lbl_') ||
    val.startsWith('msg_') ||
    val.startsWith('sub_') ||
    val.startsWith('age_') ||
    val.startsWith('issue_') ||
    val.startsWith('interest_') ||
    val.startsWith('survey_') ||
    val.startsWith('kfs_') ||
    val.startsWith('consent_') ||
    val.startsWith('nudge_') ||
    val.startsWith('sym_') ||
    val.startsWith('note_') ||
    val.startsWith('badge_') ||
    val.startsWith('warranty_') ||
    val.startsWith('cfg_') ||
    val.startsWith('opt_')
  );
}

function isAllowedText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[\d\s.,/\\()\-:;!?*★%₹#+–—'"]+$/.test(trimmed)) return true;
  if (ALLOWLIST_EXACT.has(trimmed)) return true;
  if (isTranslationKey(trimmed)) return true;

  // Split into words and check if all meaningful words are in allowlist
  const words = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w));

  if (words.length === 0) return true;

  return words.every((w) => ALLOWLIST_WORDS.has(w) || ALLOWLIST_NAMES.has(w));
}

export function isRenderedRawIdentifier(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Flag identifiers: snake_case, UPPER_SNAKE, lowerCamelCase tokens, zone- / sr- ids, and _label suffix
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(trimmed)) return true;
  if (/^[A-Z]+(_[A-Z0-9]+)+$/.test(trimmed)) return true;
  if (/^[a-z]+[A-Z][a-zA-Z0-9]*$/.test(trimmed)) return true;
  if (/^zone-[a-z0-9-]+$/.test(trimmed)) return true;
  if (/^sr-[a-z0-9-]+$/.test(trimmed)) return true;
  if (/_label$/.test(trimmed)) return true;
  return false;
}

// In-scope files to inspect for i18n translations
const IN_SCOPE_FILES = [
  'src/components/AAConsentModal.tsx',
  'src/components/ComparisonScreen.tsx',
  'src/components/ConsentToggles.tsx',
  'src/components/KfsModal.tsx',
  'src/components/MobileNotificationBanner.tsx',
  'src/components/PartnerDemoSelector.tsx',
  'src/components/PhoneFrame.tsx',
  'src/components/SurveyForm.tsx',
  'src/views/customer/CustomerApp.tsx',
  'src/views/professional/ProfessionalApp.tsx',
  'src/views/marketplace/MarketplaceView.tsx',
  'src/config/appliances.ts',
  'src/config/assumptions.ts',
  'src/data/seed.ts',
];

export const IDENTIFIER_AUDIT_FILES = [
  ...IN_SCOPE_FILES,
  'src/views/ops/OpsDashboard.tsx',
  'src/components/CityHeatMap.tsx',
  'src/components/DemoPersonaSwitcher.tsx',
];

export function auditFile(filePath: string): AuditHit[] {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, 'utf8');
  let ast: any;
  try {
    ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    return [];
  }

  const hits: AuditHit[] = [];
  const isComponent = filePath.endsWith('.tsx');

  traverse(ast, {
    // 1. JSXText (e.g. <span>Hello World</span>)
    JSXText(p: any) {
      const val = p.node.value;
      const trimmed = val.trim();
      if (!trimmed) return;
      if (isRenderedRawIdentifier(trimmed) && !ALLOWLIST_EXACT.has(trimmed)) {
        hits.push({
          file: filePath,
          line: p.node.loc?.start.line || 0,
          type: 'RawIdentifierInJSXText',
          text: trimmed,
        });
        return;
      }
      if (/[a-zA-Z]{2,}/.test(val) && !isAllowedText(val)) {
        hits.push({
          file: filePath,
          line: p.node.loc?.start.line || 0,
          type: 'JSXText',
          text: val.trim(),
        });
      }
    },

    // 2. JSXAttribute with user-facing strings (title, placeholder, aria-label, alt)
    JSXAttribute(p: any) {
      const name = p.node.name.name;
      if (['title', 'placeholder', 'aria-label', 'alt'].includes(name)) {
        const val = p.node.value;
        if (val && val.type === 'StringLiteral') {
          if (/[a-zA-Z]{2,}/.test(val.value) && !isAllowedText(val.value)) {
            hits.push({
              file: filePath,
              line: p.node.loc?.start.line || 0,
              type: `JSXAttribute[${name}]`,
              text: val.value,
            });
          }
        }
      }
    },

    // 3. StringLiterals in JSX expression containers or returned UI objects
    StringLiteral(p: any) {
      // Check if inside JSX expression container: <span>{'Hello'}</span> or {cond ? 'Foo' : 'Bar'}
      const isInsideJSX = p.findParent((parent: any) => parent.isJSXElement?.() || parent.isJSXFragment?.());
      const val = p.node.value;

      // Ignore CSS classes, import paths, HTML tag names, object keys
      if (p.parentPath.isImportDeclaration?.() || p.parentPath.isExportDeclaration?.()) return;
      if (p.parentPath.isJSXAttribute?.() && p.parentPath.node.name.name === 'className') return;
      if (p.parentPath.isObjectProperty?.() && p.parentPath.node.key === p.node) return;

      // If in JSX or in config/data/domain with human text
      if (isInsideJSX) {
        // Exclude testids, standard HTML attributes, props
        const attr = p.findParent((parent: any) => parent.isJSXAttribute?.());
        if (attr) {
          const attrName = attr.node.name.name;
          if (HTML_TECH_ATTRS.has(attrName)) {
            return;
          }
        }

        // Exclude Tailwind strings
        if (isTailwindCssString(val)) return;

        // Exclude call arguments like toLocaleString('en-IN') or includes('...') or setTab('home')
        if (p.parentPath.isCallExpression?.()) {
          const callee = p.parentPath.node.callee;
          const calleeName = callee.name || callee.property?.name;
          if (['includes', 'startsWith', 'endsWith', 'find', 'filter', 'map', 'get', 'set', 'toLocaleString', 'useState', 'useStore', 't', 'navigate', 'push'].includes(calleeName)) {
            return;
          }
        }

        if (/[a-zA-Z]{2,}/.test(val) && !isAllowedText(val)) {
          // Check if it's already a translation key
          if (
            val.includes('.') ||
            val.startsWith('p_') ||
            val.startsWith('tab_') ||
            val.startsWith('q_') ||
            val.startsWith('app_') ||
            val.startsWith('appliance_') ||
            val.startsWith('city_') ||
            val.startsWith('zone_') ||
            val.startsWith('fault_') ||
            val.startsWith('status_') ||
            val.startsWith('lbl_') ||
            val.startsWith('msg_') ||
            val.startsWith('sub_') ||
            val.startsWith('age_') ||
            val.startsWith('issue_') ||
            val.startsWith('interest_') ||
            val.startsWith('survey_') ||
            val.startsWith('kfs_') ||
            val.startsWith('consent_') ||
            val.startsWith('nudge_') ||
            val.startsWith('sym_') ||
            val.startsWith('note_')
          ) {
            return;
          }
          hits.push({
            file: filePath,
            line: p.node.loc?.start.line || 0,
            type: 'JSXStringLiteral',
            text: val,
          });
        }
      } else if (!isComponent) {
        // Data/config/domain files: check for user-facing string properties
        const prop = p.parentPath.isObjectProperty?.() ? p.parentPath.node.key.name || p.parentPath.node.key.value : '';
        const userFacingProps = [
          'headline',
          'reasons',
          'notes',
          'description',
          'question',
          'label',
          'symptom',
          'highlights',
          'badge',
          'warranty',
          'title',
          'body',
          'reason',
        ];

        if (userFacingProps.includes(prop) || (Array.isArray(p.parentPath.node) && userFacingProps.includes(p.parentPath.parentPath?.node?.key?.name))) {
          if (/[a-zA-Z]{2,}/.test(val) && !isAllowedText(val)) {
            hits.push({
              file: filePath,
              line: p.node.loc?.start.line || 0,
              type: `ConfigProperty[${prop}]`,
              text: val,
            });
          }
        }
      }
    },

    // 4. Template literals in JSX
    TemplateLiteral(p: any) {
      const isInsideJSX = p.findParent((parent: any) => parent.isJSXElement?.() || parent.isJSXFragment?.());
      if (isInsideJSX) {
        // Exclude classNames or technical attrs
        const attr = p.findParent((parent: any) => parent.isJSXAttribute?.());
        if (attr && HTML_TECH_ATTRS.has(attr.node.name.name)) {
          return;
        }

        const raw = p.node.quasis.map((q: any) => q.value.raw).join('{}');
        if (isTailwindCssString(raw)) return;

        if (/[a-zA-Z]{2,}/.test(raw) && !isAllowedText(raw)) {
          hits.push({
            file: filePath,
            line: p.node.loc?.start.line || 0,
            type: 'JSXTemplateLiteral',
            text: raw,
          });
        }
      }
    },
  });

  return hits;
}

export function auditIdentifiersForFile(filePath: string): AuditHit[] {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, 'utf8');
  let ast: any;
  try {
    ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch {
    return [];
  }

  const hits: AuditHit[] = [];
  traverse(ast, {
    JSXText(p: any) {
      const val = p.node.value.trim();
      if (!val) return;
      if (isRenderedRawIdentifier(val) && !ALLOWLIST_EXACT.has(val)) {
        hits.push({
          file: filePath,
          line: p.node.loc?.start.line || 0,
          type: 'RawIdentifier',
          text: val,
        });
      }
    },
    StringLiteral(p: any) {
      if (!p.parentPath.isJSXExpressionContainer?.()) return;
      const jsxParent = p.parentPath.parentPath;
      if (!jsxParent?.isJSXElement?.() && !jsxParent?.isJSXFragment?.()) return;
      const val = p.node.value.trim();
      if (!val) return;
      if (isRenderedRawIdentifier(val) && !ALLOWLIST_EXACT.has(val)) {
        hits.push({
          file: filePath,
          line: p.node.loc?.start.line || 0,
          type: 'RawIdentifierString',
          text: val,
        });
      }
    },
  });

  return hits;
}

export function runAudit(): { totalHits: number; hitsByFile: Record<string, AuditHit[]> } {
  let totalHits = 0;
  const hitsByFile: Record<string, AuditHit[]> = {};

  for (const file of IN_SCOPE_FILES) {
    const fileHits = auditFile(file);
    if (fileHits.length > 0) {
      hitsByFile[file] = fileHits;
      totalHits += fileHits.length;
    }
  }

  for (const file of IDENTIFIER_AUDIT_FILES) {
    const idHits = auditIdentifiersForFile(file);
    if (idHits.length > 0) {
      hitsByFile[file] = [...(hitsByFile[file] || []), ...idHits];
      totalHits += idHits.length;
    }
  }

  return { totalHits, hitsByFile };
}

export function runAndPrintAudit(): void {
  console.log('Running i18n audit across in-scope files...');
  const { totalHits, hitsByFile } = runAudit();

  let output = `Total untranslated hits: ${totalHits}\n\n`;
  for (const [file, hits] of Object.entries(hitsByFile)) {
    output += `--- ${file} (${hits.length} hits) ---\n`;
    for (const hit of hits) {
      output += `  Line ${hit.line} [${hit.type}]: "${hit.text}"\n`;
    }
    output += '\n';
  }

  console.log(output);

  // Write to i18n-audit-before.txt if not existing
  const beforeFile = path.resolve(process.cwd(), 'i18n-audit-before.txt');
  if (!fs.existsSync(beforeFile)) {
    fs.writeFileSync(beforeFile, output, 'utf8');
    console.log(`Saved baseline audit to i18n-audit-before.txt`);
  }

  fs.writeFileSync(path.resolve(process.cwd(), 'i18n-audit-current.txt'), output, 'utf8');

  if (totalHits > 0) {
    process.exit(1);
  } else {
    console.log('Audit passed with 0 untranslated hits!');
    process.exit(0);
  }
}

// Always run when script is executed
runAndPrintAudit();
