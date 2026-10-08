# Tabela de tipos de commit

| Tipo       | Quando usar                                             | Muda versão (semver) |
| ---------- | ------------------------------------------------------- | -------------------- |
| `feat`     | Nova funcionalidade visível ao usuário                  | minor                |
| `fix`      | Correção de um comportamento incorreto                  | patch                |
| `docs`     | Só documentação                                         | nenhuma              |
| `refactor` | Reestruturação sem mudar comportamento externo          | nenhuma              |
| `perf`     | Ganho de performance sem mudar a API                    | patch                |
| `test`     | Adição ou ajuste de testes                              | nenhuma              |
| `build`    | Sistema de build ou dependências                        | nenhuma              |
| `ci`       | Configuração de integração contínua                     | nenhuma              |
| `chore`    | Manutenção geral que não entra nas categorias acima     | nenhuma              |

Um `BREAKING CHANGE:` no rodapé força um incremento **major**, independente do tipo.
