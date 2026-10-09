# Jarvis Skills

This repository is the architecture of a marketplace of customizations for coding LLMs, not a ready-made marketplace. It gives a team the structure (core, catalog, and CLI) to build its own catalog of skills, agents, prompts, and instructions.

The skills, agents, prompts, and instructions that ship here are examples. They exist to demonstrate the end-to-end flow: list, install, update, and publish. Replace them with your team's real content. Delete the examples in `packages/catalog` and add your own.

The CLI lists the catalog and installs each artifact into the project you are working on, in the architecture of the chosen LLM (Claude Code by default, GitHub Copilot, or Cursor). It works even when you run it from another terminal or folder.

The project reproduces the architecture of `agent-skills` (a hexagonal core with ports, adapters, and services; a versioned catalog; a generated registry; a separate CLI), in a lean and fully local form. The catalog stores each artifact once, in a neutral form. On install, the CLI maps it to the directory layout of the active LLM. No skill, rule, or agent came from another project. Only the architecture did.

## Included examples

The catalog ships with one example per type, just to validate the flow:

- `conventional-commits` (skill)
- `pr-reviewer` (agent)
- `gerar-changelog` (prompt)
- `estilo-typescript` (instruction)

Remove these examples when you add your team's artifacts.

## Requirements

- Node.js 20 or later.

## Structure

The repository is a monorepo with npm workspaces:

- `packages/core`: the hexagonal core. `ports/` defines the infrastructure interfaces, `adapters/` holds the Node implementations, and `services/` holds the logic (catalog discovery, registry, installer, lockfile).
- `packages/catalog`: the catalog content. Each artifact type has its own folder, organized by `(category)` folders. The `registry.json` comes from the content in this folder.
- `packages/cli`: the CLI (`jarvis-skills`), with an interactive mode (TUI) and a flag mode.
- `packages/web`: the static catalog site. See the GitHub Pages section.

## Targets (LLMs) and architecture

The active LLM defines the destination architecture. The default target is Claude Code. The target map lives in `packages/core/src/lib/constants.ts` (`TARGETS`). It is the only place to edit to change a path or add a new target.

Source in the catalog (neutral, stored once):

- `catalog/skills/(cat)/<name>/SKILL.md` (folder)
- `catalog/agents/(cat)/<name>.agent.md`
- `catalog/prompts/(cat)/<name>.prompt.md`
- `catalog/instructions/(cat)/<name>.instructions.md`

Destination per target, in the project. Skills are always a folder with `SKILL.md`:

| Type          | Claude Code (default)     | GitHub Copilot                             | Cursor                    |
| ------------- | ------------------------- | ------------------------------------------ | ------------------------- |
| `skill`       | `.claude/skills/<n>/`     | `.github/skills/<n>/`                      | `.cursor/skills/<n>/`     |
| `agent`       | `.claude/agents/<n>.md`   | `.github/agents/<n>.agent.md`              | not supported             |
| `prompt`      | `.claude/commands/<n>.md` | `.github/prompts/<n>.prompt.md`            | `.cursor/commands/<n>.md` |
| `instruction` | `.claude/rules/<n>.md`    | `.github/instructions/<n>.instructions.md` | `.cursor/rules/<n>.mdc`   |

For global destinations, Claude uses `~/.claude/...`, Copilot uses `~/.copilot/...`, and Cursor uses `~/.cursor/...`. The CLI warns about and skips combinations with no destination, such as `agent` on Cursor. It never fails the command.

The CLI maps only the architecture. It installs the artifact content as it is in the catalog, without converting the frontmatter between tools.

## Install (project setup)

```bash
npm install
npm run build
```

To use the `jarvis-skills` command from anywhere, link the CLI package globally:

```bash
npm link --workspace @jarvis/jarvis-skills-cli
```

The `jarvis-skills` binary now exists on your PATH. The CLI finds the catalog by its own location, or by the `JARVIS_SKILLS_CATALOG` variable when it is set. So you can run the CLI from inside any project.

## Usage

The main flow is simple. You open a project in a terminal and run the CLI there. The CLI installs the artifact into the current directory (`cwd`).

### Active target (LLM)

The CLI resolves the active LLM from the first source that exists, in this order: the `--target` flag, the `JARVIS_SKILLS_TARGET` variable, the global config (`~/.jarvis-skills/config.json`), and the `claude-code` default as the last option.

```bash
jarvis-skills targets                      # list targets and supported types
jarvis-skills config                       # show active target and method
jarvis-skills config set target cursor     # set the default target (persistent)
jarvis-skills config set method symlink    # default method: copy (default) or symlink
```

### Interactive mode (TUI)

```bash
cd /path/to/your/project
jarvis-skills
```

Navigation is by type, like folders. The first screen lists the types (Skills, Agents, Prompts, Instructions) with a count for each. When you enter a type, you see only the artifacts of that type. The header shows the active LLM and scope, and marks the types the current LLM does not support.

Types screen:

- `↑`/`↓` moves between types
- `Enter` or `→` opens the type
- `t` switches the active LLM (persisted in the config) · `g` toggles the scope · `q` quits

Inside a type:

- `↑`/`↓` moves · type to filter
- `Enter` installs the selected item into the current project · `d` removes it
- `←` or `Esc` goes back to the types screen
- `t` switches the LLM · `g` toggles the scope · `q` quits

### Flag mode

List the catalog:

```bash
jarvis-skills list
jarvis-skills list --type skill
jarvis-skills list --search commit
jarvis-skills list --json
```

Install into the current project, in the active LLM's architecture:

```bash
jarvis-skills install conventional-commits                 # uses the active target (Claude by default)
jarvis-skills install pr-reviewer gerar-changelog          # several at once
jarvis-skills install estilo-typescript --type instruction
jarvis-skills install conventional-commits --target cursor # force an LLM for this call
jarvis-skills install pr-reviewer --symlink                # symlink to the source
jarvis-skills install conventional-commits --force         # overwrite
jarvis-skills install conventional-commits --global        # global scope (home)
```

See what is installed and remove it:

```bash
jarvis-skills list --installed
jarvis-skills remove conventional-commits
```

Update what is already installed when the catalog changes, after a `git pull`:

```bash
jarvis-skills update                      # update everything that changed in the current project
jarvis-skills update conventional-commits # update only the given names
jarvis-skills update --dry-run            # show what would change, without applying
jarvis-skills update --global             # update in the global scope (home)
```

The `update` command compares the content hash stored in the lockfile with the one in the catalog and reinstalls only what changed. Artifacts that left the catalog are only flagged. The CLI does not remove them on its own.

Without the global link, run `node packages/cli/dist/index.js <command>` from the repository root, or `npm run jarvis -- <command>`.

## Collaborating as a team (via Git)

The CLI reads the catalog live from disk. Consumers only need `git pull` to receive the new artifacts, with nothing to regenerate. Contributors add the files and open a PR.

### To get the updates

```bash
cd /path/to/jarvis-skills
git pull
npm install   # only if package.json or the lock changed
npm run build # only if the CLI or core code changed; the catalog needs no build
```

New skills, agents, prompts, and instructions show up right away in `jarvis-skills list` and are ready to install.

### To add an artifact to the catalog

Remember that the current examples should go when you add your own.

1. Create a branch.
2. Add the folder or file under the matching type in `packages/catalog`, following the name pattern (lowercase slug with hyphens) and the frontmatter (`name` and `description` required; `version`, `author`, and `license` optional).
   - Skills: a folder with `SKILL.md`, which may include support files, for example under `references/`.
   - Agents, prompts, and instructions: a single file with the type's extension.
3. If you want, register the category in the type's `_category.json`.
4. Check with `jarvis-skills list` and open the PR. You do not need to commit any index.

About `registry.json`: it is an optional export of the catalog, generated by `npm run generate:registry` or `jarvis-skills registry`. It helps if you ever serve the catalog statically. The CLI does not depend on it, so it stays git-ignored and never goes stale. In the local flow you can ignore it.

## Lockfile

The CLI records each install in `.jarvis-skills-lock.json`, in the project directory for local installs or in the home directory for global installs. The record stores the target (LLM), type, name, category, scope, method, path, and dates. The key includes the target, so the same artifact can coexist installed in different LLMs in the same project. The `update` command reinstalls each item in its original target. Symlink installs reflect the source and need no update.

## Visual catalog (GitHub Pages)

The static site in `packages/web/` lists and searches all artifacts by type, category, and LLM. Each item opens a detail panel with the rendered content, the install command, and the path per LLM. The site reads the `registry.json` and `targets.json` generated from the catalog. It uses no framework and no external dependency, because `marked` and `dompurify` are vendored in `packages/web/vendor/`.

Publishing is automatic through GitHub Actions. The workflow is in `packages/web/github-pages.workflow.yml`. On every push to `main`, it generates the index and publishes the Pages site.

To enable it the first time:

1. Copy `packages/web/github-pages.workflow.yml` to `.github/workflows/pages.yml` and commit it.
2. On GitHub, under Settings and then Pages, set Source to GitHub Actions.
3. Push to `main`. The site goes live at `https://<user>.github.io/<repo>/`.

To run it locally, generate the data and serve the folder:

```bash
npm run build && npm run generate:registry
node packages/cli/dist/index.js targets --json > packages/catalog/targets.json
# serve packages/web plus registry.json, targets.json, and the catalog folders
```

## Scope

The project is local and multi-LLM. It ships the versioned catalog, the CLI (flags and TUI), and the catalog site that publishes to GitHub Pages. Out of scope for now: publishing to a registry or CDN, and an MCP server.
