import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const legacyModules = new Set([
  'src/features/assessments/AssessmentWorkspace.tsx',
  'src/features/assessments/AssessmentsView.tsx',
  'src/features/teacher/SmartMarkScanner.tsx',
  'src/features/cbt/CBTQuizModuleView.tsx',
  'src/routing/LegacyPageAdapter.tsx',
  'src/components/ModuleWorkspace.tsx',
]);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
export function assessmentArchitectureFailures() {
  const errors = [];
  const visited = new Set();
  function inspect(file) {
    if (visited.has(file)) return;
    visited.add(file);
    if (legacyModules.has(file) || file.startsWith('src/legacy/assessment/')) { errors.push(`LEGACY_ASSESSMENT_IMPORT ${file}`); return; }
    if (!fs.existsSync(path.join(root, file))) return;
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const imports = [];
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const specifier of imports.filter(x => x.startsWith('.'))) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      const resolved = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].map(ext => target + ext).find(p => fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).isFile());
      if (resolved && (resolved.startsWith('src/domains/assessment/') || resolved.startsWith('src/legacy/') || legacyModules.has(resolved))) inspect(resolved);
    }
  }
  for (const file of walk('src/domains/assessment').filter(x => /\.tsx?$/.test(x) && !x.includes('.test.'))) {
    inspect(file);
    if (/(?:bg|text|border)-(?:slate|indigo|purple|blue|amber|rose|emerald)-\d/.test(read(file))) errors.push(`RAW_ASSESSMENT_PALETTE ${file}`);
  }
  const adapter = read('src/routing/LegacyPageAdapter.tsx');
  if (/case ['"](?:assessment|cbt)['"]/.test(adapter)) errors.push('LEGACY_ASSESSMENT_ROUTE_OWNERSHIP');
  const pages = read('src/routing/pages.ts');
  if (/AssessmentWorkspace|AssessmentStudio|AssessmentsView|CBTQuizModuleView/.test(pages)) errors.push('LEGACY_ASSESSMENT_LAZY_BINDING');
  const router = read('src/routing/AppRouter.tsx');
  if (!/route\.domain === 'assessment'[\s\S]{0,250}AssessmentDomainWorkspace/.test(router)) errors.push('ASSESSMENT_NATIVE_OWNER_MISSING');
  const shell = read('src/shell/WorkspaceShellChrome.tsx');
  if (!/usesV2Composition[\s\S]{0,500}route\.domain === 'assessment'/.test(shell)) errors.push('ASSESSMENT_LEGACY_SHELL');
  return errors;
}
const failures = assessmentArchitectureFailures();
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Assessment architecture guard passed.');
