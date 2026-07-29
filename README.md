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
