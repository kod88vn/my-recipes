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

const readline = await import('readline');

async function question(prompt, def){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = await new Promise(resolve => rl.question(`${prompt}${def ? ` (${def})` : ''}: `, ans => { rl.close(); resolve(ans); }));
  return (q || def || '').trim();
}

async function mainInteractive(){
  const appName = await question('Name of the consumer app', 'consumer');
  const target = await question('Target folder for monorepo', `${appName}-monorepo`);
  const useWattAns = await question('Use watt resolve when available? (y/n)', 'y');
  const doInstallAns = await question('Run `npm install` after scaffolding? (y/n)', 'n');

  const useWatt = /^y/i.test(useWattAns);
  const doInstall = /^y/i.test(doInstallAns);

  const cwd = process.cwd();
  const targetPath = path.resolve(cwd, target);
  const templatePath = path.resolve(cwd, 'templates', 'turborepo-starter');

  console.log('Scaffolding Turborepo at', targetPath);
  fs.mkdirSync(targetPath, { recursive: true });

  // copy template
  if(fs.existsSync(templatePath)){
    try{
      fs.cpSync(templatePath, targetPath, { recursive: true, force: true });
      console.log('Copied template from', templatePath);
    }catch(e){ console.error('Failed to copy template:', e.message); }
  } else {
    console.log('Template not found; writing minimal package.json');
    const pkg = { name: 'turborepo-starter', private: true, version: '0.0.0', workspaces: ['packages/*','apps/*'] };
    fs.writeFileSync(path.join(targetPath,'package.json'), JSON.stringify(pkg,null,2));
  }

  // create apps dir and copy consumer starter
  fs.mkdirSync(path.join(targetPath,'apps'), { recursive: true });
  const consumerTemplate = path.resolve(cwd, 'templates', 'turborepo-starter', 'apps', 'consumer');
  const consumerDest = path.join(targetPath, 'apps', appName);
  if(fs.existsSync(consumerTemplate)){
    fs.cpSync(consumerTemplate, consumerDest, { recursive: true, force: true });
    console.log('Created consumer app at', consumerDest);
  } else {
    // write minimal consumer
    fs.mkdirSync(consumerDest, { recursive: true });
    fs.writeFileSync(path.join(consumerDest,'package.json'), JSON.stringify({ name: appName, private:true, version:'0.0.0', dependencies: { 'node-fetch': '^3.3.1' }, scripts:{ dev:'node start.js' }}, null, 2));
    fs.writeFileSync(path.join(consumerDest,'start.js'), "console.log('Start script missing template; replace with your app logic')\n");
    console.log('Created minimal consumer app at', consumerDest);
  }

  // clone this repo into apps/ai-skill-library
  const repoUrl = runCapture('git', ['config', '--get', 'remote.origin.url']) || null;
  const aiDest = path.join(targetPath, 'apps', 'ai-skill-library');
  if(useWatt){
    const hasWatt = runCapture('watt', ['--version']);
    if(hasWatt && repoUrl){
      console.log('Attempting watt resolve of', repoUrl);
      const ok = run('watt', ['resolve', repoUrl, '--path', 'apps/ai-skill-library'], { cwd: targetPath });
      if(!ok) console.warn('watt failed, will try git clone');
    }
  }
  if(!fs.existsSync(aiDest) && repoUrl){
    console.log('Cloning', repoUrl, 'to', aiDest);
    const ok = run('git', ['clone', repoUrl, aiDest]);
    if(!ok) console.warn('git clone failed; clone manually to', aiDest);
  }

  // attempt to run link-skills script automatically (so consumer sees skills)
  const linkScript = path.join(consumerDest, 'link-skills.sh');
  if(fs.existsSync(linkScript)){
    console.log('Running link-skills script to connect skills into consumer app');
    const ok = run('sh', [linkScript], { cwd: consumerDest });
    if(!ok) console.warn('link-skills.sh failed; you can run it manually via `npm --prefix', consumerDest, 'run link-skills`');
  } else {
    // fallback: try npm script
    const pkgJson = path.join(consumerDest, 'package.json');
    if(fs.existsSync(pkgJson)){
      try{
        const pkg = JSON.parse(fs.readFileSync(pkgJson,'utf8'));
        if(pkg.scripts && pkg.scripts['link-skills']){
          console.log('Running npm run link-skills to connect skills');
          run('npm', ['--prefix', consumerDest, 'run', 'link-skills']);
        }
      }catch(e){ /* ignore */ }
    }
  }

  console.log('\nDone. Next steps:');
  console.log('  cd', targetPath);
  if(doInstall) console.log('  npm install');
  console.log('  # start the skill server from the cloned app:');
  console.log('  node apps/ai-skill-library/bin/skill-lib.js serve');
  console.log('  # in another terminal start the consumer app:');
  console.log('  npm --prefix apps/' + appName + ' run dev');

  if(doInstall){
    console.log('\nRunning npm install...');
    run('npm', ['install'], { cwd: targetPath });
  }
}

// entry
mainInteractive().catch(err => { console.error(err); process.exit(1); });
