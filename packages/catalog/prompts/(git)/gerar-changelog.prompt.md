---
name: gerar-changelog
description: Gera um changelog agrupado por tipo a partir de uma lista de commits no padrão Conventional Commits.
metadata:
  author: WeFit
  version: '1.0.0'
---

Gere um changelog em Markdown a partir dos commits fornecidos.

Regras:

- Agrupe por seção: `### Features`, `### Fixes`, `### Outros`.
- Use apenas commits `feat` em Features e `fix` em Fixes; o resto vai em Outros.
- Cada item começa com o escopo em negrito quando existir: `**auth:** ...`.
- Liste `BREAKING CHANGE` no topo, em uma seção `### ⚠️ Breaking Changes`.
- Ignore commits de merge.

Ao final, pergunte se devo incluir os hashes curtos de cada commit.
