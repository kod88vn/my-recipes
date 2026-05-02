Turborepo starter template

How to use:

1. Copy this folder into a new repo (or use as a template)
2. Place your `ai-skill-library` package under `packages/skill-lib` (copy or submodule)
3. Run `npm install` at repo root
4. Start the skill server from the library and run the consumer app:

```bash
# start skill server (from monorepo root)
node packages/skill-lib/bin/skill-lib.js serve

# in another terminal
npm --prefix apps/consumer run dev
```
