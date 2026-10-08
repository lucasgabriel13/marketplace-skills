'use strict'

const BIN = 'jarvis-skills'
const DEFAULT_TARGET = 'claude-code'

const TYPE_ICON = { skill: '◆', agent: '⬢', prompt: '▲', instruction: '■' }
const TYPE_ORDER = ['skill', 'agent', 'prompt', 'instruction']
const TYPE_PLURAL = { skill: 'Skills', agent: 'Agents', prompt: 'Prompts', instruction: 'Instructions' }

const state = {
  artifacts: [],
  catLabels: {}, // catId -> display name
  targets: [], // [{id,label,artifacts}]
  targetMap: {}, // id -> profile
  query: '',
  type: 'all',
  category: 'all',
  onlySupported: false,
  llm: DEFAULT_TARGET,
}

const el = (id) => document.getElementById(id)

init()

async function init() {
  try {
    const [registry, targets] = await Promise.all([
      fetchJson('registry.json'),
      fetchJson('targets.json').catch(() => []),
    ])
    state.artifacts = Array.isArray(registry.artifacts) ? registry.artifacts : []
    state.catLabels = buildCatLabels(registry.categories || {})
    state.targets = targets.length ? targets : [{ id: DEFAULT_TARGET, label: 'Claude Code', artifacts: {} }]
    state.targetMap = Object.fromEntries(state.targets.map((t) => [t.id, t]))
    if (!state.targetMap[state.llm]) state.llm = state.targets[0].id

    buildLlmSelect()
    bindControls()
    renderTypeFilters()
    renderCategoryFilters()
    render()
  } catch (err) {
    const e = el('error')
    e.textContent = 'Não foi possível carregar o catálogo (registry.json).'
    e.hidden = false
    console.error(err)
  }
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}

function buildCatLabels(categories) {
  const map = {}
  for (const byType of Object.values(categories)) {
    for (const [id, meta] of Object.entries(byType)) {
      if (!map[id]) map[id] = (meta && meta.name) || id
    }
  }
  return map
}

/* ---------- filtros ---------- */

function buildLlmSelect() {
  const sel = el('llm-select')
  sel.innerHTML = ''
  for (const t of state.targets) {
    const opt = document.createElement('option')
    opt.value = t.id
    opt.textContent = t.label
    if (t.id === state.llm) opt.selected = true
    sel.appendChild(opt)
  }
}

function bindControls() {
  el('search').addEventListener('input', (e) => {
    state.query = e.target.value.toLowerCase().trim()
    render()
  })
  el('llm-select').addEventListener('change', (e) => {
    state.llm = e.target.value
    render()
    if (!el('overlay').hidden && openArtifact) renderDetail(openArtifact)
  })
  el('only-supported').addEventListener('change', (e) => {
    state.onlySupported = e.target.checked
    render()
  })
  el('close').addEventListener('click', closeDetail)
  el('overlay').addEventListener('click', (e) => {
    if (e.target === el('overlay')) closeDetail()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail()
  })
}

function countByType(type) {
  return state.artifacts.filter((a) => a.type === type).length
}

function renderTypeFilters() {
  const wrap = el('type-filters')
  wrap.innerHTML = ''
  const add = (value, text) => {
    const b = document.createElement('button')
    b.className = 'chip'
    b.textContent = text
    b.setAttribute('role', 'tab')
    b.setAttribute('aria-selected', String(state.type === value))
    b.addEventListener('click', () => {
      state.type = value
      state.category = 'all'
      renderTypeFilters()
      renderCategoryFilters()
      render()
    })
    wrap.appendChild(b)
  }
  add('all', `Todos (${state.artifacts.length})`)
  for (const t of TYPE_ORDER) {
    const n = countByType(t)
    if (n > 0) add(t, `${TYPE_ICON[t]} ${TYPE_PLURAL[t]} (${n})`)
  }
}

function renderCategoryFilters() {
  const wrap = el('category-filters')
  wrap.innerHTML = ''
  const pool = state.artifacts.filter((a) => state.type === 'all' || a.type === state.type)
  const ids = [...new Set(pool.map((a) => a.category))].sort((a, b) =>
    (state.catLabels[a] || a).localeCompare(state.catLabels[b] || b),
  )
  if (ids.length <= 1) return
  const add = (value, text) => {
    const b = document.createElement('button')
    b.className = 'chip'
    b.textContent = text
    b.setAttribute('aria-selected', String(state.category === value))
    b.addEventListener('click', () => {
      state.category = value
      renderCategoryFilters()
      render()
    })
    wrap.appendChild(b)
  }
  add('all', 'Todas as categorias')
  for (const id of ids) add(id, state.catLabels[id] || id)
}

/* ---------- alvos (LLM) ---------- */

function destForTarget(artifact, targetId) {
  const profile = state.targetMap[targetId]
  const dest = profile && profile.artifacts && profile.artifacts[artifact.type]
  if (!dest) return null
  const leaf = dest.fileExtension ? `${artifact.name}${dest.fileExtension}` : `${artifact.name}/`
  return `${dest.projectDir}/${leaf}`
}

function installCommand(artifact, targetId) {
  const base = `${BIN} install ${artifact.name}`
  return targetId === DEFAULT_TARGET ? base : `${base} --target ${targetId}`
}

/* ---------- render do grid ---------- */

function matches(a) {
  if (state.type !== 'all' && a.type !== state.type) return false
  if (state.category !== 'all' && a.category !== state.category) return false
  if (state.onlySupported && !destForTarget(a, state.llm)) return false
  if (state.query) {
    const hay = `${a.name} ${a.description} ${state.catLabels[a.category] || a.category}`.toLowerCase()
    if (!hay.includes(state.query)) return false
  }
  return true
}

function render() {
  const grid = el('grid')
  const list = state.artifacts
    .filter(matches)
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.name.localeCompare(b.name))

  grid.innerHTML = ''
  el('empty').hidden = list.length > 0
  el('count').textContent = `${list.length} ${list.length === 1 ? 'item' : 'itens'}`

  for (const a of list) {
    grid.appendChild(renderCard(a))
  }
}

function renderCard(a) {
  const card = document.createElement('button')
  card.className = 'card'
  card.type = 'button'

  const head = document.createElement('div')
  head.className = 'card-head'
  head.innerHTML = `
    <span class="type-icon type-${a.type}">${TYPE_ICON[a.type]}</span>
    <span class="card-name"></span>
    <span class="badge">${a.type}</span>`
  head.querySelector('.card-name').textContent = a.name
  card.appendChild(head)

  const desc = document.createElement('p')
  desc.className = 'card-desc'
  desc.textContent = a.description || ''
  card.appendChild(desc)

  const meta = document.createElement('div')
  meta.className = 'card-meta'
  const parts = [state.catLabels[a.category] || a.category]
  if (a.version) parts.push(`v${a.version}`)
  meta.textContent = parts.join(' · ')
  card.appendChild(meta)

  if (!destForTarget(a, state.llm)) {
    const u = document.createElement('div')
    u.className = 'card-unsupported'
    u.textContent = `não suportado por ${state.targetMap[state.llm]?.label || state.llm}`
    card.appendChild(u)
  }

  card.addEventListener('click', () => openDetail(a))
  return card
}

/* ---------- detalhe ---------- */

let openArtifact = null

function openDetail(a) {
  openArtifact = a
  el('overlay').hidden = false
  document.body.style.overflow = 'hidden'
  renderDetail(a)
}

function closeDetail() {
  el('overlay').hidden = true
  document.body.style.overflow = ''
  openArtifact = null
}

function renderDetail(a) {
  const d = el('detail')
  const label = state.targetMap[state.llm]?.label || state.llm
  const dest = destForTarget(a, state.llm)
  const cmd = installCommand(a, state.llm)

  d.innerHTML = ''

  const head = document.createElement('div')
  head.className = 'detail-head'
  head.innerHTML = `<span class="type-icon type-${a.type}">${TYPE_ICON[a.type]}</span><h2 id="detail-name"></h2>`
  head.querySelector('h2').textContent = a.name
  d.appendChild(head)

  const sub = document.createElement('p')
  sub.className = 'detail-sub'
  const subParts = [a.type, state.catLabels[a.category] || a.category]
  if (a.version) subParts.push(`v${a.version}`)
  if (a.author) subParts.push(a.author)
  sub.textContent = subParts.join(' · ')
  d.appendChild(sub)

  const descr = document.createElement('p')
  descr.textContent = a.description || ''
  d.appendChild(descr)

  // bloco de instalação
  const install = document.createElement('div')
  install.className = 'install'
  const row = document.createElement('div')
  row.className = 'install-row'
  const code = document.createElement('code')
  code.textContent = cmd
  const copy = document.createElement('button')
  copy.className = 'copy-btn'
  copy.textContent = 'Copiar'
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cmd)
      copy.textContent = 'Copiado!'
      setTimeout(() => (copy.textContent = 'Copiar'), 1400)
    } catch {
      copy.textContent = 'Erro'
    }
  })
  row.append(code, copy)
  install.appendChild(row)

  const pathLine = document.createElement('div')
  pathLine.className = 'install-path'
  if (dest) {
    pathLine.innerHTML = `Em <strong>${label}</strong> instala em <code></code>`
    pathLine.querySelector('code').textContent = dest
  } else {
    pathLine.innerHTML = `<strong>${label}</strong> não suporta o tipo <code>${a.type}</code>.`
  }
  install.appendChild(pathLine)
  d.appendChild(install)

  // conteúdo do artefato
  const content = document.createElement('div')
  content.className = 'detail-content'
  content.innerHTML = '<p class="detail-loading">Carregando conteúdo…</p>'
  d.appendChild(content)
  loadContent(a, content)
}

async function loadContent(a, container) {
  const file = a.type === 'skill' ? `${a.path}/SKILL.md` : a.path
  try {
    const res = await fetch(`catalog/${encodeURI(file)}`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    const body = stripFrontmatter(raw)
    let html
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      html = DOMPurify.sanitize(marked.parse(body))
    } else {
      // Fallback sem libs: mostra o markdown cru de forma segura.
      const pre = document.createElement('pre')
      pre.textContent = body
      html = pre.outerHTML
    }
    // Só atualiza se ainda for o artefato aberto
    if (openArtifact === a) container.innerHTML = html
  } catch (err) {
    if (openArtifact === a) {
      container.innerHTML = '<p class="detail-loading">Não foi possível carregar o conteúdo deste artefato.</p>'
    }
    console.error(err)
  }
}

function stripFrontmatter(md) {
  const m = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? md.slice(m[0].length) : md
}
