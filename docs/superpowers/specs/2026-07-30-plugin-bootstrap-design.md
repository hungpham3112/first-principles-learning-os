# First-Principles Plugin Bootstrap Design

## Goal

Package the existing first-principles skill as a private, reusable OpenCode plugin. Every model session receives the full protocol without relying on the model to call the skill tool first.

## Repository

Use `~/.config/opencode/skills/first-principles-learning-os` as the working tree for private repository `hungpham3112/first-principles-learning-os`.

```text
first-principles-learning-os/
├── package.json
├── plugin.js
├── README.md
└── skills/
    └── first-principles-learning-os/
        └── SKILL.md
```

Current machine loads `plugin.js` by local path. Other machines install the same repository through its SSH Git URL.

## Plugin Behavior

At startup, the plugin registers its bundled `skills` directory through the `config` hook.

Before each model request, `experimental.chat.messages.transform` reads the bundled `SKILL.md`, removes YAML frontmatter, wraps the body in a unique bootstrap marker, and prepends it to the first user message unless already present. The wrapper states that the skill is already loaded and must be applied directly, preventing a redundant skill-tool call.

Failure to read the skill file leaves messages unchanged rather than breaking OpenCode startup.

## Local And Remote Use

Current machine uses:

```json
"./skills/first-principles-learning-os/plugin.js"
```

New machines use:

```json
"first-principles-learning-os@git+ssh://git@github.com/hungpham3112/first-principles-learning-os.git"
```

SSH authentication supplies access to the private repository. No token is stored in OpenCode configuration.

## Existing Instructions

Remove the standing instruction that calls `first-principles-learning-os` before every action. Retain only a short fallback explaining that the injected protocol is authoritative and the skill tool should be used only if bootstrap content is absent.

## Verification

1. Confirm plugin module imports successfully.
2. Confirm config hook registers the bundled skill directory once.
3. Confirm transform injects full protocol once and does not duplicate it.
4. Start a fresh OpenCode session after restart and test underspecified, debugging, and optimization prompts.
5. Confirm the private SSH package can be resolved after the repository is pushed.
