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
