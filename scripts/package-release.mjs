// Creates the zip you upload to Gumroad: release/clinic-patient-manager-v<version>.zip
// It packages exactly what is committed to git (never node_modules, dist, .env or local files).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';

const { name, version } = JSON.parse(readFileSync('package.json', 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const pending = git('status', '--porcelain');
if (pending) {
  console.error('Commit your changes first. Uncommitted files would not be in the release:\n' + pending);
  process.exit(1);
}

mkdirSync('release', { recursive: true });
const out = `release/${name}-v${version}.zip`;
git('archive', '--format=zip', `--prefix=${name}-v${version}/`, '-o', out, 'HEAD');

const files = git('ls-files').split('\n').length;
const sizeKb = Math.round(statSync(out).size / 1024);
console.log(`Created ${out} (${files} files, ${sizeKb} KB) from commit ${git('rev-parse', '--short', 'HEAD')}.`);
