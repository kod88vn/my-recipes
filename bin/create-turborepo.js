#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');

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

function parseArgs(argv){
  const options = {
    yes: false,
    appName: null,
    target: null,
    useWatt: null,
    doInstall: null,
  };

  for(let i = 0; i < argv.length; i++){
    const arg = argv[i];
    if(arg === '--yes') options.yes = true;
    else if(arg === '--app' && argv[i + 1]) options.appName = argv[++i];
    else if(arg === '--target' && argv[i + 1]) options.target = argv[++i];
    else if(arg === '--use-watt') options.useWatt = true;
    else if(arg === '--no-watt') options.useWatt = false;
    else if(arg === '--install') options.doInstall = true;
    else if(arg === '--no-install') options.doInstall = false;
  }

  return options;
}

async function question(prompt, def){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = await new Promise(resolve => rl.question(`${prompt}${def ? ` (${def})` : ''}: `, ans => { rl.close(); resolve(ans); }));
  return (q || def || '').trim();
}

function scaffold({ appName, target, useWatt, doInstall }){
  const cwd = process.cwd();
  const targetPath = path.resolve(cwd, target);
  const templatePath = path.join(packageRoot, 'templates', 'turborepo-starter');

  console.log('Scaffolding Turborepo at', targetPath);
  fs.mkdirSync(targetPath, { recursive: true });

  // copy template
  if(fs.existsSync(templatePath)){
    try{
      fs.cpSync(templatePath, targetPath, { recursive: true, force: true });
      console.log('Copied template from', templatePath);
      // Template contains apps/consumer; remove it when user selected a custom app name.
      const defaultConsumer = path.join(targetPath, 'apps', 'consumer');
      if(appName !== 'consumer' && fs.existsSync(defaultConsumer)){
        fs.rmSync(defaultConsumer, { recursive: true, force: true });
      }
    }catch(e){ console.error('Failed to copy template:', e.message); }
  } else {
    console.log('Template not found; writing minimal package.json');
    const pkg = { name: 'turborepo-starter', private: true, version: '0.0.0', workspaces: ['packages/*','apps/*'] };
    fs.writeFileSync(path.join(targetPath,'package.json'), JSON.stringify(pkg,null,2));
  }

  // create apps dir and copy consumer starter
  fs.mkdirSync(path.join(targetPath,'apps'), { recursive: true });
  const consumerTemplate = path.join(packageRoot, 'templates', 'turborepo-starter', 'apps', 'consumer');
  const consumerDest = path.join(targetPath, 'apps', appName);
  if(fs.existsSync(consumerTemplate)){
    fs.cpSync(consumerTemplate, consumerDest, { recursive: true, force: true });
    // Keep workspace package names unique and meaningful.
    const consumerPkg = path.join(consumerDest, 'package.json');
    if(fs.existsSync(consumerPkg)){
      try{
        const pkg = JSON.parse(fs.readFileSync(consumerPkg, 'utf8'));
        pkg.name = appName;
        pkg.type = pkg.type || 'module';
        if(pkg.dependencies && pkg.dependencies['ai-skill-library'] === 'workspace:*'){
          pkg.dependencies['ai-skill-library'] = 'file:../ai-skill-library';
        }
        fs.writeFileSync(consumerPkg, JSON.stringify(pkg, null, 2));
      }catch(e){ /* leave template package.json as-is */ }
    }
    console.log('Created consumer app at', consumerDest);
  } else {
    // write minimal consumer
    fs.mkdirSync(consumerDest, { recursive: true });
    fs.writeFileSync(path.join(consumerDest,'package.json'), JSON.stringify({ name: appName, private:true, version:'0.0.0', dependencies: { 'node-fetch': '^3.3.1' }, scripts:{ dev:'node start.js' }}, null, 2));
    fs.writeFileSync(path.join(consumerDest,'start.js'), "console.log('Start script missing template; replace with your app logic')\n");
    console.log('Created minimal consumer app at', consumerDest);
  }

  // clone this repo into apps/ai-skill-library
  const repoUrl = runCapture('git', ['config', '--get', 'remote.origin.url'], { cwd: packageRoot }) || null;
  const aiDest = path.join(targetPath, 'apps', 'ai-skill-library');
  if(useWatt){
    const hasWatt = runCapture('watt', ['--version']);
    if(hasWatt && repoUrl){
      console.log('Attempting watt resolve of', repoUrl);
      const ok = run('watt', ['resolve', repoUrl, '--path', 'apps/ai-skill-library'], { cwd: targetPath });
      if(!ok) console.warn('watt failed, will try git clone');
    }
  }
  // If we're running inside the library repo locally, copy it instead of cloning
  try{
    const localPkgPath = path.join(packageRoot, 'package.json');
    if(fs.existsSync(localPkgPath)){
      const localPkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf8'));
      if(localPkg.name && localPkg.name.includes('ai-skill-library')){
        console.log('Detected local ai-skill-library repo at', packageRoot, '— copying into', aiDest);
        try{
          fs.cpSync(packageRoot, aiDest, { recursive: true, force: true });
          try{ fs.rmSync(path.join(aiDest,'node_modules'), { recursive: true, force: true }); }catch(e){}
        }catch(copyErr){
          console.error('Failed to copy local repo:', copyErr && copyErr.message);
        }
      }
    }
  }catch(e){ console.error('local copy check failed:', e && e.message); }

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

async function main(){
  const options = parseArgs(process.argv.slice(2));
  const appName = options.appName || (options.yes ? 'consumer' : await question('Name of the consumer app', 'consumer'));
  const target = options.target || (options.yes ? `${appName}-monorepo` : await question('Target folder for monorepo', `${appName}-monorepo`));

  let useWatt = options.useWatt;
  if(useWatt == null){
    if(options.yes) useWatt = true;
    else {
      const useWattAns = await question('Use watt resolve when available? (y/n)', 'y');
      useWatt = /^y/i.test(useWattAns);
    }
  }

  let doInstall = options.doInstall;
  if(doInstall == null){
    if(options.yes) doInstall = false;
    else {
      const doInstallAns = await question('Run `npm install` after scaffolding? (y/n)', 'n');
      doInstall = /^y/i.test(doInstallAns);
    }
  }

  scaffold({ appName, target, useWatt, doInstall });
}

// entry
main().catch(err => { console.error(err); process.exit(1); });
