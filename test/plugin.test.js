import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

import createPlugin from "../plugin.js"

const marker = "<first-principles-learning-os-bootstrap>"

test("registers the absolute bundled skills path once", async () => {
  const hooks = await createPlugin()
  const config = {}

  await hooks.config(config)
  await hooks.config(config)

  assert.equal(config.skills.paths.length, 1)
  assert.equal(path.isAbsolute(config.skills.paths[0]), true)
  assert.match(config.skills.paths[0], /skills$/)
})

test("injects the protocol before the first user message once", async () => {
  const hooks = await createPlugin()
  const output = {
    messages: [
      { info: { role: "assistant" }, parts: [{ type: "text", text: "prior" }] },
      {
        info: { role: "user" },
        parts: [{ type: "text", text: "hello", synthetic: true }],
      },
    ],
  }

  await hooks["experimental.chat.messages.transform"]({}, output)
  await hooks["experimental.chat.messages.transform"]({}, output)

  const parts = output.messages[1].parts
  assert.equal(parts.length, 2)
  assert.equal(parts.filter((part) => part.text?.includes(marker)).length, 1)
  assert.equal(parts[0].type, "text")
  assert.equal(parts[0].synthetic, true)
  assert.match(parts[0].text, /# First-Principles Learning OS/)
  assert.match(parts[0].text, /No consequential answer over consequential unknowns/)
  assert.doesNotMatch(parts[0].text, /name: first-principles-learning-os/)
})

test("leaves messages unchanged without a user message containing parts", async () => {
  const hooks = await createPlugin()
  const outputs = [
    { messages: [{ info: { role: "assistant" }, parts: [] }] },
    { messages: [{ info: { role: "user" }, parts: [] }] },
  ]
  const before = structuredClone(outputs)

  for (const output of outputs) {
    await hooks["experimental.chat.messages.transform"]({}, output)
  }

  assert.deepEqual(outputs, before)
})

test("leaves messages unchanged when the skill cannot be read", async () => {
  const hooks = await createPlugin()
  const output = {
    messages: [{ info: { role: "user" }, parts: [{ type: "text", text: "hello" }] }],
  }
  const before = structuredClone(output.messages)
  const readFileSync = fs.readFileSync
  fs.readFileSync = () => {
    throw new Error("unavailable")
  }

  try {
    await hooks["experimental.chat.messages.transform"]({}, output)
  } finally {
    fs.readFileSync = readFileSync
  }

  assert.deepEqual(output.messages, before)
})
