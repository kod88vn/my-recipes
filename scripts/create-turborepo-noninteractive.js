#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function run(cmd, args, opts = {}){
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return r.status === 0;
}

function copyRecursive(src, dest){
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

const appName = process.argv[2] || 'consumer';
const target = process.argv[3] || `${appName}-monorepo`;
const cwd = process.cwd();
const targetPath = path.resolve(cwd, target);

console.log('Scaffolding non-interactive Turborepo at', targetPath);
fs.mkdirSync(targetPath, { recursive: true });

const templatePath = path.resolve(cwd, 'templates', 'turborepo-starter');
if(fs.existsSync(templatePath)){
  try{ copyRecursive(templatePath, targetPath); console.log('Copied template'); }catch(e){ console.error('copy template failed', e.message); }
} else {
  fs.writeFileSync(path.join(targetPath,'package.json'), JSON.stringify({ name: 'turborepo-starter', private: true, version: '0.0.0', workspaces: ['packages/*','apps/*'] }, null, 2));
}

// create apps dir and copy consumer starter
fs.mkdirSync(path.join(targetPath,'apps'), { recursive: true });
const consumerTemplate = path.resolve(cwd, 'templates', 'turborepo-starter', 'apps', 'consumer');
const consumerDest = path.join(targetPath, 'apps', appName);
if(fs.existsSync(consumerTemplate)){
  copyRecursive(consumerTemplate, consumerDest);
  console.log('Created consumer app at', consumerDest);
} else {
  fs.mkdirSync(consumerDest, { recursive: true });
  fs.writeFileSync(path.join(consumerDest,'package.json'), JSON.stringify({ name: appName, private:true, version:'0.0.0', dependencies: { 'node-fetch': '^3.3.1' }, scripts:{ dev:'node start.js' }}, null, 2));
  fs.writeFileSync(path.join(consumerDest,'start.js'), "console.log('Start script missing template; replace with your app logic')\n");
  console.log('Created minimal consumer app at', consumerDest);
}

// copy local library (if running inside it)
let gitTop = null;
try{ gitTop = spawnSync('git', ['rev-parse','--show-toplevel'], { encoding:'utf8' }).stdout.trim(); }catch(e){}
if(gitTop && fs.existsSync(path.join(gitTop,'package.json'))){
  try{
    const pkg = JSON.parse(fs.readFileSync(path.join(gitTop,'package.json'),'utf8'));
    if(pkg.name && pkg.name.includes('ai-skill-library')){
      const aiDest = path.join(targetPath,'apps','ai-skill-library');
      console.log('Copying local ai-skill-library from', gitTop, 'to', aiDest);
      copyRecursive(gitTop, aiDest);
      try{ fs.rmSync(path.join(aiDest,'node_modules'), { recursive:true, force:true }); }catch(e){}
    }
  }catch(e){ console.error('local copy failed', e.message); }
}

// run link-skills if present
const linkScript = path.join(consumerDest, 'link-skills.sh');
if(fs.existsSync(linkScript)){
  console.log('Running link-skills script');
  run('sh', [linkScript], { cwd: consumerDest });
} else {
  const pkgJson = path.join(consumerDest,'package.json');
  if(fs.existsSync(pkgJson)){
    try{
      const pj = JSON.parse(fs.readFileSync(pkgJson,'utf8'));
      if(pj.scripts && pj.scripts['link-skills']){
        run('npm', ['--prefix', consumerDest, 'run', 'link-skills']);
      }
    }catch(e){}
  }
}

console.log('Done.');
