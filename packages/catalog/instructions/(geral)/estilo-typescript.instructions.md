---
name: estilo-typescript
description: Convenções de estilo TypeScript adotadas nos projetos WeFit.
applyTo: "**/*.ts,**/*.tsx"
metadata:
  author: WeFit
  version: '1.0.0'
---

# Estilo TypeScript — WeFit

- Prefira `type` a `interface` para uniões e tipos utilitários; use `interface`
  para contratos de objeto que podem ser estendidos.
- Ative e respeite `strict`; nunca use `any` — prefira `unknown` com narrowing.
- Funções exportadas têm tipo de retorno explícito.
- Evite `export default`; use exports nomeados.
- Nomes em inglês para código, comentários podem ser em português.
- Trate erros de forma explícita; não engula exceções sem log ou tratamento.
