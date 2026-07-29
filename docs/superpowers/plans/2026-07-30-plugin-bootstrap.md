# First-Principles Plugin Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package and publish the first-principles protocol as a private OpenCode plugin that injects its full skill into every model session.

**Architecture:** A zero-dependency ES module registers its bundled skills directory through OpenCode's `config` hook and prepends the full skill body to the first user message through `experimental.chat.messages.transform`. Current machine loads local source; other machines install the same private Git repository over SSH.

**Tech Stack:** JavaScript ES modules, Node.js standard library, Node test runner, OpenCode plugin hooks, GitHub SSH.

---

### Task 1: Package Layout

**Files:**
- Move: `SKILL.md` to `skills/first-principles-learning-os/SKILL.md`
- Create: `package.json`
- Create: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: Move the skill into the distributable skills directory**

Run:

```bash
mkdir -p skills/first-principles-learning-os
mv SKILL.md skills/first-principles-learning-os/SKILL.md
```

Expected: one canonical `SKILL.md` under `skills/first-principles-learning-os/`.

- [ ] **Step 2: Add package metadata**

Create `package.json`:

```json
{
  "name": "first-principles-learning-os",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "plugin.js",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: Add installation documentation**

Create `README.md`:

````markdown
# First-Principles Learning OS

Private OpenCode plugin that injects the bundled first-principles protocol into every session.

## Install

Add to `~/.config/opencode/opencode.json`:

```json
"plugin": [
  "first-principles-learning-os@git+ssh://git@github.com/hungpham3112/first-principles-learning-os.git"
]
```

Restart OpenCode after installation or updates.

## Local Development

Load this checkout directly:

```json
"./skills/first-principles-learning-os/plugin.js"
```

Run `npm test` before pushing.
````

- [ ] **Step 4: Ignore local artifacts**

Create `.gitignore`:

```gitignore
node_modules/
```

- [ ] **Step 5: Commit package layout**

Run:

```bash
git add .gitignore README.md package.json skills/first-principles-learning-os/SKILL.md
git commit -m "chore: structure plugin package"
```

Expected: package metadata and skill are tracked; original root `SKILL.md` is absent.

### Task 2: Bootstrap Plugin

**Files:**
- Create: `test/plugin.test.js`
- Create: `plugin.js`

- [ ] **Step 1: Write failing hook tests**

Create `test/plugin.test.js`:

```js
import assert from "node:assert/strict"
import test from "node:test"

import createPlugin from "../plugin.js"

const marker = "<first-principles-learning-os-bootstrap>"

test("registers bundled skills once", async () => {
  const hooks = await createPlugin()
  const config = { skills: { paths: [] } }

  await hooks.config(config)
  await hooks.config(config)

  assert.equal(config.skills.paths.length, 1)
  assert.match(config.skills.paths[0], /skills$/)
})

test("injects the full protocol once", async () => {
  const hooks = await createPlugin()
  const output = {
    messages: [
      {
        info: { role: "user" },
        parts: [{ type: "text", text: "hello" }],
      },
    ],
  }

  await hooks["experimental.chat.messages.transform"]({}, output)
  await hooks["experimental.chat.messages.transform"]({}, output)

  assert.equal(output.messages[0].parts.length, 2)
  assert.match(output.messages[0].parts[0].text, new RegExp(marker))
  assert.match(output.messages[0].parts[0].text, /# First-Principles Learning OS/)
  assert.match(output.messages[0].parts[0].text, /No consequential answer over consequential unknowns/)
})

test("leaves messages unchanged when no user text exists", async () => {
  const hooks = await createPlugin()
  const output = { messages: [{ info: { role: "assistant" }, parts: [] }] }

  await hooks["experimental.chat.messages.transform"]({}, output)

  assert.deepEqual(output.messages, [{ info: { role: "assistant" }, parts: [] }])
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `plugin.js`.

- [ ] **Step 3: Implement the minimal plugin**

Create `plugin.js`:

```js
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.join(root, "skills")
const skillPath = path.join(skillsDir, "first-principles-learning-os", "SKILL.md")
const marker = "<first-principles-learning-os-bootstrap>"

function getBootstrap() {
  try {
    const body = fs
      .readFileSync(skillPath, "utf8")
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
      .trim()

    return `${marker}
The first-principles-learning-os skill is already loaded below. Apply it before every response or action. Do not call the skill tool to reload it.

${body}
</first-principles-learning-os-bootstrap>`
  } catch {
    return null
  }
}

export default async function firstPrinciplesPlugin() {
  return {
    config: async (config) => {
      config.skills ??= {}
      config.skills.paths ??= []
      if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir)
    },

    "experimental.chat.messages.transform": async (_input, output) => {
      const bootstrap = getBootstrap()
      if (!bootstrap) return

      const firstUser = output.messages.find((message) => message.info.role === "user")
      if (!firstUser?.parts.length) return
      if (firstUser.parts.some((part) => part.type === "text" && part.text.includes(marker))) return

      firstUser.parts.unshift({ ...firstUser.parts[0], type: "text", text: bootstrap })
    },
  }
}
```

- [ ] **Step 4: Run tests and verify success**

Run: `npm test`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Confirm module loading**

Run:

```bash
node -e "import('./plugin.js').then(async ({default: p}) => console.log(Object.keys(await p())))"
```

Expected output includes `config` and `experimental.chat.messages.transform`.

- [ ] **Step 6: Commit plugin and tests**

Run:

```bash
git add plugin.js test/plugin.test.js
git commit -m "feat: inject first-principles bootstrap"
```

### Task 3: Migrate Global OpenCode Configuration

**Files:**
- Modify: `/home/alice/.config/opencode/opencode.json`
- Modify: `/home/alice/.config/opencode/AGENTS.md`

- [ ] **Step 1: Register the local plugin**

Add the local entry while preserving existing plugins:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "./plugins/caveman/plugin.js",
    "@dietrichgebert/ponytail",
    "./skills/first-principles-learning-os/plugin.js"
  ]
}
```

- [ ] **Step 2: Remove redundant skill-tool bootstrap instruction**

Replace the first-principles block in `AGENTS.md` with:

```markdown
<!-- first-principles-learning-os-begin -->
The `first-principles-learning-os` plugin injects its complete protocol into every session. Apply injected protocol directly; do not reload it with skill tool.
<!-- first-principles-learning-os-end -->
```

- [ ] **Step 3: Validate configuration syntax**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('/home/alice/.config/opencode/opencode.json', 'utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 4: Verify a separate OpenCode process loads the plugin**

Run:

```bash
opencode run --print-logs "Explain TCP/IP" 2>&1
```

Expected: no plugin import/config errors; response follows direct-answer path without calling `first-principles-learning-os`.

### Task 4: Publish Private Repository

**Files:**
- No additional files.

- [ ] **Step 1: Verify repository state before publication**

Run:

```bash
git status --short
git diff
git log --oneline -10
gh auth status
```

Expected: only intended plan/config-independent repository changes remain; GitHub account has repository scope.

- [ ] **Step 2: Create the private GitHub repository**

Run:

```bash
gh repo create hungpham3112/first-principles-learning-os --private --source=. --remote=origin
git remote set-url origin git@github.com:hungpham3112/first-principles-learning-os.git
git push -u origin main
```

Expected: private repository exists and `main` tracks `origin/main` over SSH.

- [ ] **Step 3: Verify remote package access**

Run:

```bash
git ls-remote git@github.com:hungpham3112/first-principles-learning-os.git HEAD
```

Expected: command returns a commit hash.

- [ ] **Step 4: Document restart requirement**

Quit and restart OpenCode. Existing process retains old config and plugin modules until restart.
