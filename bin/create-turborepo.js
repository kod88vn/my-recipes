#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd, args, opts = {}){
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return r.status === 0;
}

function runCapture(cmd, args, opts = {}){
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  if(r.status !== 0) return null;
  return r.stdout.trim();
}

const argv = process.argv.slice(2);
if(argv.includes('--help') || argv.includes('-h')){
  console.log('Usage: create-turborepo <target-dir> [--repo <git-url>] [--use-watt]');
  process.exit(0);
}

const target = argv[0] || 'my-monorepo';
const repoIndex = argv.indexOf('--repo');
const repoArg = repoIndex !== -1 ? argv[repoIndex + 1] : null;
const useWatt = argv.includes('--use-watt');

const cwd = process.cwd();
const targetPath = path.resolve(cwd, target);
const templatePath = path.resolve(cwd, 'templates', 'turborepo-starter');

console.log('Scaffolding Turborepo at', targetPath);
fs.mkdirSync(targetPath, { recursive: true });

// copy template into target (overwrite)
if(fs.existsSync(templatePath)){
  try{
    fs.cpSync(templatePath, targetPath, { recursive: true, force: true });
    console.log('Copied template from', templatePath);
  }catch(e){
    console.error('Failed to copy template:', e.message);
  }
}else{
  console.log('Template not found at', templatePath, '- continuing with minimal scaffold');
  // write a minimal package.json
  const pkg = {
    name: 'turborepo-starter',
    private: true,
    version: '0.0.0',
    workspaces: ['packages/*','apps/*']
  };
  fs.writeFileSync(path.join(targetPath,'package.json'), JSON.stringify(pkg,null,2));
}

// determine repo URL
let repoUrl = repoArg;
if(!repoUrl){
  const out = runCapture('git', ['config', '--get', 'remote.origin.url']);
  if(out) repoUrl = out;
}

// ensure packages dir
fs.mkdirSync(path.join(targetPath, 'packages'), { recursive: true });

// attempt to bring this repo in as packages/skill-lib
const dest = path.join(targetPath, 'packages', 'skill-lib');
if(fs.existsSync(dest)){
  console.log('Destination already exists:', dest);
} else if(useWatt){
  // check watt
  const hasWatt = runCapture('watt', ['--version']);
  if(hasWatt && repoUrl){
    console.log('Using watt to resolve', repoUrl);
    const ok = run('watt', ['resolve', repoUrl, '--path', 'packages/skill-lib'], { cwd: targetPath });
    if(!ok){
      console.warn('watt resolve failed, falling back to git clone');
    }
  }else{
    console.log('watt not available or repo not provided; falling back to git clone');
  }
}

if(!fs.existsSync(dest) && repoUrl){
  console.log('Cloning', repoUrl, 'to', dest);
  const ok = run('git', ['clone', repoUrl, dest]);
  if(!ok) console.warn('git clone failed; you can clone manually to', dest);
}

console.log('\nDone. Next steps:');
console.log('  cd', targetPath);
console.log('  npm install');
console.log('  # start the skill server from the library:');
console.log('  node packages/skill-lib/bin/skill-lib.js serve');
console.log('  # in another terminal start the example app:');
console.log('  npm --prefix apps/consumer run dev');

process.exit(0);
