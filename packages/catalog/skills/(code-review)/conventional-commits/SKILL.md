---
name: conventional-commits
description: Ajuda a escrever mensagens de commit no padrão Conventional Commits. Use quando o usuário for commitar, pedir para redigir uma mensagem de commit, revisar o histórico ou padronizar commits de um repositório. Cobre os tipos (feat, fix, docs, refactor, etc.), escopo, breaking changes e corpo do commit.
license: MIT
metadata:
  author: WeFit
  version: '1.0.0'
---

# Conventional Commits

Você ajuda a escrever mensagens de commit claras seguindo a especificação
Conventional Commits. Sempre produza a mensagem final em um bloco de código para
o usuário copiar.

## Formato

```
<tipo>(<escopo opcional>): <descrição curta no imperativo>

<corpo opcional explicando o quê e o porquê>

<rodapé opcional: BREAKING CHANGE, refs de issues>
```

## Tipos aceitos

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: apenas documentação
- `style`: formatação sem mudança de lógica
- `refactor`: refatoração sem mudança de comportamento
- `perf`: melhoria de performance
- `test`: testes
- `build`: build ou dependências
- `ci`: pipeline de CI
- `chore`: tarefas gerais
- `revert`: reversão de commit

## Regras

1. A descrição usa o imperativo ("adiciona", não "adicionado").
2. A primeira linha tem no máximo 72 caracteres.
3. Escopo é opcional, minúsculo e entre parênteses.
4. Breaking changes vão no rodapé com `BREAKING CHANGE:` e explicação.
5. Referencie issues no rodapé quando existirem (ex.: `Refs #123`).

## Exemplos

```
feat(auth): adiciona login via SSO corporativo
```

```
fix(checkout): corrige cálculo de frete para CEPs do interior

O arredondamento estava truncando centavos em pedidos acima de R$ 1.000.

Refs #482
```

Consulte `references/tipos.md` para uma tabela detalhada de quando usar cada tipo.
