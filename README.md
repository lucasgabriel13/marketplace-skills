# Jarvis Skills

Marketplace **local** e **multi-LLM** de customizações: skills, agents, prompts e
instructions. A CLI lista o catálogo e instala qualquer artefato no diretório do
projeto onde você está trabalhando — na arquitetura da LLM/ferramenta escolhida
(Claude Code por padrão, GitHub Copilot ou Cursor) — mesmo que a CLI seja
executada a partir de outro terminal/pasta.

Este projeto reproduz a **arquitetura** do `agent-skills` (núcleo hexagonal com
ports/adapters/services, catálogo versionado, registry gerado e uma CLI separada),
porém enxuta e rodando 100% local. O catálogo guarda cada artefato uma única vez,
de forma neutra; ao instalar, a CLI mapeia para o padrão de diretórios da LLM
ativa. Nenhuma skill, rule ou agent foi copiado de outro projeto — apenas a
arquitetura.

## Requisitos

- Node.js >= 20

## Estrutura

O repositório é um monorepo simples com workspaces npm:

- `packages/core` — núcleo hexagonal. `ports/` definem as interfaces de
  infraestrutura, `adapters/` as implementações Node, e `services/` a lógica
  (descoberta do catálogo, registry, instalador, lockfile).
- `packages/catalog` — o conteúdo do marketplace. Cada tipo de artefato tem sua
  pasta, organizada por categorias `(categoria)`. O `registry.json` é gerado a
  partir daqui.
- `packages/cli` — a CLI (`jarvis-skills`), com modo interativo (TUI) e modo por
  flags.

## Alvos (LLMs) e arquitetura

A LLM ativa define a arquitetura de destino. O alvo **padrão é o Claude Code**.
O mapa de alvos fica centralizado em `packages/core/src/lib/constants.ts`
(`TARGETS`) — é o único lugar a editar para ajustar um caminho ou **adicionar um
novo alvo**.

Origem no catálogo (neutra, uma vez só):

- `catalog/skills/(cat)/<nome>/SKILL.md` (pasta)
- `catalog/agents/(cat)/<nome>.agent.md`
- `catalog/prompts/(cat)/<nome>.prompt.md`
- `catalog/instructions/(cat)/<nome>.instructions.md`

Destino por alvo (projeto · global). Skills são sempre pasta com `SKILL.md`:

| Tipo          | Claude Code (padrão)      | GitHub Copilot                    | Cursor                   |
| ------------- | ------------------------- | --------------------------------- | ------------------------ |
| `skill`       | `.claude/skills/<n>/`     | `.github/skills/<n>/`             | `.cursor/skills/<n>/`    |
| `agent`       | `.claude/agents/<n>.md`   | `.github/agents/<n>.agent.md`     | — (não suportado)        |
| `prompt`      | `.claude/commands/<n>.md` | `.github/prompts/<n>.prompt.md`   | `.cursor/commands/<n>.md`|
| `instruction` | `.claude/rules/<n>.md`    | `.github/instructions/<n>.instructions.md` | `.cursor/rules/<n>.mdc` |

Globais: Claude em `~/.claude/...`, Copilot em `~/.copilot/...`, Cursor em
`~/.cursor/...`. Combinações não suportadas (ex.: `agent` no Cursor) são apenas
avisadas e puladas, nunca falham o comando.

> Só a arquitetura é mapeada: o **conteúdo do artefato é instalado como está** no
> catálogo (sem converter frontmatter entre ferramentas).

## Instalação (setup do marketplace)

```bash
npm install
npm run build
```

Para usar o comando `jarvis-skills` de qualquer lugar, faça o link global do pacote da CLI:

```bash
npm link --workspace @jarvis/jarvis-skills-cli
```

Isso disponibiliza o binário `jarvis-skills` no seu PATH. A CLI encontra o catálogo
automaticamente pela sua própria localização (ou pela variável
`JARVIS_SKILLS_CATALOG`, se definida), então você pode rodá-la de dentro de
qualquer projeto.

## Uso

O fluxo principal: você abre um projeto qualquer em um terminal e roda a CLI ali.
O artefato é instalado no diretório atual (`cwd`).

### Alvo ativo (LLM)

A LLM ativa é resolvida nesta ordem: flag `--target` → variável
`JARVIS_SKILLS_TARGET` → config global (`~/.jarvis-skills/config.json`) →
`claude-code` (padrão).

```bash
jarvis-skills targets                      # lista alvos e tipos suportados
jarvis-skills config                       # mostra alvo/método ativos
jarvis-skills config set target cursor     # define o alvo padrão (persistente)
jarvis-skills config set method symlink    # método padrão: copy (padrão) ou symlink
```

### Modo interativo (TUI)

```bash
cd /caminho/do/seu/projeto
jarvis-skills
```

A navegação é por tipo, como "pastas": a primeira tela lista os tipos
(Skills, Agents, Prompts, Instructions) com a contagem de cada um; ao entrar em
um tipo, você vê apenas os artefatos daquele tipo. O cabeçalho mostra a LLM e o
escopo ativos; tipos não suportados pela LLM atual são marcados.

Tela de tipos:

- `↑`/`↓` navega entre os tipos
- `Enter` ou `→` abre o tipo
- `t` troca a LLM ativa (persiste na config) · `g` alterna escopo · `q` sai

Dentro de um tipo:

- `↑`/`↓` navega · digite para filtrar dentro do tipo
- `Enter` instala o item selecionado no projeto atual · `d` remove
- `←` ou `Esc` volta para a tela de tipos
- `t` troca a LLM · `g` alterna escopo · `q` sai

### Modo por flags

Listar o catálogo:

```bash
jarvis-skills list
jarvis-skills list --type skill
jarvis-skills list --search commit
jarvis-skills list --json
```

Instalar no projeto atual (na arquitetura da LLM ativa):

```bash
jarvis-skills install conventional-commits                 # usa o alvo ativo (padrão Claude)
jarvis-skills install pr-reviewer gerar-changelog          # vários de uma vez
jarvis-skills install estilo-typescript --type instruction
jarvis-skills install conventional-commits --target cursor # força uma LLM nesta chamada
jarvis-skills install pr-reviewer --symlink                # link simbólico p/ a origem
jarvis-skills install conventional-commits --force         # sobrescreve
jarvis-skills install conventional-commits --global        # escopo global (home)
```

Ver o que está instalado e remover:

```bash
jarvis-skills list --installed
jarvis-skills remove conventional-commits
```

Atualizar o que já está instalado quando o catálogo mudar (após um `git pull`):

```bash
jarvis-skills update                     # atualiza tudo que mudou no projeto atual
jarvis-skills update conventional-commits # atualiza apenas os nomes informados
jarvis-skills update --dry-run           # mostra o que mudaria, sem alterar
jarvis-skills update --global            # atualiza no escopo global (home)
```

O `update` compara o hash de conteúdo gravado no lockfile com o do catálogo e
reinstala só o que mudou. Artefatos instalados que não existem mais no catálogo
são apenas sinalizados (não são removidos automaticamente).

> Sem o link global, use `node packages/cli/dist/index.js <comando>` a partir da
> raiz do repositório, ou `npm run jarvis -- <comando>`.

## Colaborando em equipe (via Git)

O catálogo é lido **ao vivo** do disco pela CLI. Ou seja: quem consome só precisa
de `git pull` para receber os novos artefatos — **não é preciso regenerar nada**.
E quem contribui só adiciona os arquivos e abre um PR.

### Para consumir as novidades

```bash
cd /caminho/do/jarvis-skills
git pull
npm install   # só se package.json/lock mudaram
npm run build # só se o código da CLI/core mudou; artefatos do catálogo não exigem build
```

Skills, agents, prompts e instructions novos aparecem imediatamente em
`jarvis-skills list` e ficam disponíveis para instalar.

### Para adicionar um artefato ao catálogo

1. Crie um branch.
2. Adicione a pasta/arquivo no tipo correspondente dentro de `packages/catalog`,
   seguindo o padrão de nome (slug minúsculo com hífens) e o frontmatter
   (`name` e `description` obrigatórios; `version`, `author`, `license` opcionais).
   - Skills: uma pasta com `SKILL.md` (pode ter arquivos de apoio, ex.: `references/`).
   - Agents/prompts/instructions: um arquivo único com a extensão do tipo.
3. Opcional: registre a categoria em `_category.json` do tipo.
4. Confira localmente com `jarvis-skills list` e abra o PR. Não é necessário
   commitar índice algum.

> **Sobre o `registry.json`:** é um export **opcional** do catálogo (gerado por
> `npm run generate:registry` ou `jarvis-skills registry`), útil se um dia o
> catálogo for publicado/servido estaticamente. A CLI **não depende** dele — por
> isso ele é git-ignored, para não desatualizar. No fluxo local você pode ignorá-lo.

## Lockfile

Cada instalação é registrada em `.jarvis-skills-lock.json` (no diretório do projeto
para instalações locais, ou no home para instalações globais), com alvo (LLM),
tipo, nome, categoria, escopo, método, caminho e datas. A chave inclui o alvo, de
modo que o mesmo artefato pode coexistir instalado em LLMs diferentes no mesmo
projeto. O `update` reinstala cada item no seu alvo de origem; instalações por
symlink refletem a origem e não precisam de update.

## Catálogo visual (GitHub Pages)

Há um site estático em `packages/web/` que lista e permite buscar todos os
artefatos por tipo, categoria e LLM, com painel de detalhe (conteúdo renderizado,
comando de instalação e caminho por LLM). Ele lê `registry.json` e `targets.json`
gerados a partir do catálogo — sem framework e sem dependências externas
(`marked` e `dompurify` ficam embutidos em `packages/web/vendor/`).

Publicação automática via GitHub Actions (workflow em
`packages/web/github-pages.workflow.yml`): a cada push na `main` ele gera o índice
e publica o Pages.

Para ativar (uma vez):

1. Copie `packages/web/github-pages.workflow.yml` para `.github/workflows/pages.yml`
   e faça commit.
2. No GitHub, em **Settings → Pages**, defina **Source: GitHub Actions**.
3. Faça push na `main`. O site sobe em `https://<usuario>.github.io/<repo>/`.

Rodar localmente: gere os dados e sirva a pasta.

```bash
npm run build && npm run generate:registry
node packages/cli/dist/index.js targets --json > packages/catalog/targets.json
# sirva packages/web + registry.json + targets.json + as pastas de catálogo
```

## Escopo

Projeto local, multi-LLM, com catálogo versionado, CLI (flags + TUI) e site de
catálogo publicável no GitHub Pages. Fora do escopo por enquanto: publicação em
registry/CDN e servidor MCP.
