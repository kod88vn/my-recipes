#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function exists(p){ try{ return fs.existsSync(p); } catch(e){ return false } }
function isSymlink(p){ try{ return fs.lstatSync(p).isSymbolicLink(); } catch(e){ return false } }

function check(root){
  const report = { ok: true, missing: [] };

  const pkg = path.join(root, 'package.json');
  if(!exists(pkg)) { report.ok = false; report.missing.push('root package.json'); }
  else {
    try{
      const pj = JSON.parse(fs.readFileSync(pkg,'utf8'));
      const ws = pj.workspaces || [];
      if(!ws.some(w => w.includes('apps'))) { report.ok = false; report.missing.push('workspaces: apps/* in root package.json'); }
    }catch(e){ report.ok = false; report.missing.push('root package.json (invalid JSON)'); }
  }

  const apps = path.join(root, 'apps');
  if(!exists(apps)) { report.ok = false; report.missing.push('apps/ folder'); return report; }

  const libApp = path.join(apps,'ai-skill-library');
  if(!exists(libApp)){ report.ok = false; report.missing.push('apps/ai-skill-library'); }
  else {
    if(!exists(path.join(libApp,'bin','skill-lib.js'))) { report.ok = false; report.missing.push('apps/ai-skill-library/bin/skill-lib.js'); }
    if(!exists(path.join(libApp,'lib'))) { report.ok = false; report.missing.push('apps/ai-skill-library/lib/'); }
    if(!exists(path.join(libApp,'skills'))) { report.ok = false; report.missing.push('apps/ai-skill-library/skills/'); }
    if(!exists(path.join(libApp,'ui','app.py'))) { report.ok = false; report.missing.push('apps/ai-skill-library/ui/app.py'); }
  }

  // find consumer (any folder in apps other than ai-skill-library)
  const children = fs.readdirSync(apps).filter(n => n !== 'ai-skill-library');
  if(children.length === 0){ report.ok = false; report.missing.push('consumer app in apps/ (e.g., apps/virtual-tutor)'); }
  else {
    const consumer = path.join(apps, children[0]);
    const linkScript = path.join(consumer,'link-skills.sh');
    const pkgJson = path.join(consumer,'package.json');
    let hasLinkScript = exists(linkScript);
    let hasPkgLink = false;
    if(exists(pkgJson)){
      try{
        const pj = JSON.parse(fs.readFileSync(pkgJson,'utf8'));
        hasPkgLink = !!(pj.scripts && pj.scripts['link-skills']);
      }catch(e){}
    }
    if(!hasLinkScript && !hasPkgLink){ report.ok = false; report.missing.push(`consumer app ${children[0]} missing link-skills script or npm script`); }
  }

  const rootSkillsLink = path.join(root, '.github', 'skills');
  if(!exists(rootSkillsLink)){
    report.ok = false;
    report.missing.push('root .github/skills (expected symlink)');
  } else if(!isSymlink(rootSkillsLink)){
    report.ok = false;
    report.missing.push('root .github/skills is not a symlink');
  }

  return report;
}

const target = process.argv[2] || process.cwd();
const r = check(target);
if(r.ok){
  console.log('VALID: scaffold appears to meet requirements');
  process.exit(0);
} else {
  console.error('INVALID: missing artifacts:');
  r.missing.forEach(m => console.error(' -', m));
  process.exit(2);
}
