import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const outputPath = path.join(rootDir, 'THIRD_PARTY_LICENSES.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveLicenseField(licenseField) {
  if (!licenseField) {
    return 'UNKNOWN';
  }

  if (typeof licenseField === 'string') {
    return licenseField;
  }

  if (Array.isArray(licenseField)) {
    const values = licenseField
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.type === 'string') return item.type;
        return null;
      })
      .filter(Boolean);

    return values.length ? values.join(' OR ') : 'UNKNOWN';
  }

  if (typeof licenseField === 'object' && typeof licenseField.type === 'string') {
    return licenseField.type;
  }

  return 'UNKNOWN';
}

function getDependencyInfo(packageName, requestedVersion) {
  const depPkgPath = path.join(rootDir, 'node_modules', packageName, 'package.json');

  if (!fs.existsSync(depPkgPath)) {
    return {
      packageName,
      version: requestedVersion || 'UNKNOWN',
      license: 'UNKNOWN (not installed)'
    };
  }

  const depPkg = readJson(depPkgPath);

  return {
    packageName,
    version: depPkg.version || requestedVersion || 'UNKNOWN',
    license: resolveLicenseField(depPkg.license)
  };
}

function buildRows(dependencies) {
  return Object.entries(dependencies)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, version]) => getDependencyInfo(name, version));
}

function renderTable(rows) {
  const header = '| Package | Version | License |';
  const separator = '|---|---|---|';
  const body = rows.map((row) => `| ${row.packageName} | ${row.version} | ${row.license} |`);
  return [header, separator, ...body].join('\n');
}

function main() {
  const pkg = readJson(packageJsonPath);
  const runtimeDeps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};

  const runtimeRows = buildRows(runtimeDeps);
  const devRows = buildRows(devDeps);

  const generatedAt = new Date().toISOString();

  const content = `# Third-Party Licenses\n\nGenerated automatically from direct dependencies in package.json.\n\nGenerated at: ${generatedAt}\n\n## Runtime Dependencies\n\n${renderTable(runtimeRows)}\n\n## Development Dependencies\n\n${renderTable(devRows)}\n\n## Notes\n\n- This inventory reflects direct dependencies only.\n- For transitive dependencies, review package-lock.json or use a dedicated SBOM/license scanner.\n- If a dependency license appears as UNKNOWN, verify manually in the dependency package metadata.\n`;

  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main();
