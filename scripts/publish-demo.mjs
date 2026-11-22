// Builds the public demo and publishes ONLY the compiled site (no source code) to the public
// GitHub repo that serves it with GitHub Pages.
//   npm run publish:demo
// Needs: git, and GitHub access for the account that owns DEMO_REPO.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEMO_REPO = process.env.DEMO_REPO || 'kaysodesu/Clinic-Patient-Dashboard';
const [owner, name] = DEMO_REPO.split('/');
const SITE = `https://${owner.toLowerCase()}.github.io/${name}/`;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npm', ...opts });

run('npm', ['run', 'build:demo']);

const dir = mkdtempSync(join(tmpdir(), 'cpd-demo-'));
cpSync('dist-demo', dir, { recursive: true });
writeFileSync(join(dir, '.nojekyll'), '');
writeFileSync(join(dir, 'README.md'), `# Clinic Patient Dashboard: live demo

**Try it:** ${SITE}

A clinic management dashboard covering patients, visits & clinical notes, prescriptions, secure messages and
after-visit summaries, intake, patient portal, outreach, billing codes and an AI code reviewer.

- The free preview runs for 20 minutes in your browser with **fictional patients only**. Nothing is sent to a server.
- Want more time? Join the Discord and ask for an access code: https://discord.gg/jNRRuj6gg
- Get the full version (staff accounts, your own database, no time limit): https://kcasontechsolutions.gumroad.com/

This repository contains only the compiled demo site. Developed by Cason Point Network.
`);

const git = (...args) => run('git', args, { cwd: dir });
git('init', '-q', '-b', 'main');
git('config', 'user.name', 'kaysodesu');
git('config', 'user.email', '88466039+kaysodesu@users.noreply.github.com');
git('add', '-A');
git('commit', '-q', '-m', `Demo build ${new Date().toISOString().slice(0, 10)}`);
git('push', '-q', '-f', `https://github.com/${DEMO_REPO}.git`, 'main');
rmSync(dir, { recursive: true, force: true });

console.log(`\nPublished. The live demo updates in about a minute: ${SITE}`);
