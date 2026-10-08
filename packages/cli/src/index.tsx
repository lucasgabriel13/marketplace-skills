#!/usr/bin/env node
import { Command } from 'commander'
import { render } from 'ink'

import { App, createApp } from './app.js'
import { runConfigSetMethod, runConfigSetTarget, runConfigShow, runListTargets } from './cli/config.js'
import { runInstall } from './cli/install.js'
import { runList } from './cli/list.js'
import { runRegistry } from './cli/registry.js'
import { runRemove } from './cli/remove.js'
import { runUpdate } from './cli/update.js'

function launchTui(): void {
  const result = createApp()
  if ('error' in result) {
    console.error(`\n${result.error}\n`)
    process.exit(1)
  }
  render(<App context={result.context} />)
}

const program = new Command()

program
  .name('jarvis-skills')
  .description('Marketplace local de skills, agents, prompts e instructions para múltiplas LLMs (Claude, Copilot, Cursor)')
  .version('0.1.0')

// Sem subcomando → abre a TUI interativa.
program.action(() => {
  launchTui()
})

program
  .command('list')
  .alias('ls')
  .description('Lista artefatos do catálogo (ou instalados com --installed)')
  .option('-t, --type <type>', 'Filtra por tipo (skill, agent, prompt, instruction)')
  .option('-c, --category <category>', 'Filtra por categoria')
  .option('-s, --search <term>', 'Busca por termo no nome/descrição')
  .option('--installed', 'Mostra o que está instalado no diretório atual e no global')
  .option('--json', 'Saída em JSON')
  .action((options) => {
    runList(options)
  })

program
  .command('install <names...>')
  .aliases(['i', 'add'])
  .description('Instala artefato(s) no diretório atual, na arquitetura do alvo ativo — ou global com -g')
  .option('-t, --type <type>', 'Desambigua quando o nome existe em mais de um tipo')
  .option('-T, --target <target>', 'Alvo/LLM (claude-code, github-copilot, cursor). Padrão: config/claude-code')
  .option('--symlink', 'Instala via link simbólico para a origem, em vez de copiar', false)
  .option('-g, --global', 'Instala no escopo global (home)', false)
  .option('-f, --force', 'Sobrescreve se já existir', false)
  .action(async (names: string[], options) => {
    await runInstall(names, options)
  })

program
  .command('remove <names...>')
  .alias('rm')
  .description('Remove artefato(s) instalado(s) no diretório atual — ou global com -g')
  .option('-t, --type <type>', 'Desambigua quando o nome existe em mais de um tipo')
  .option('-T, --target <target>', 'Alvo/LLM de onde remover. Padrão: config/claude-code')
  .option('-g, --global', 'Remove do escopo global', false)
  .action(async (names: string[], options) => {
    await runRemove(names, options)
  })

program
  .command('update [names...]')
  .alias('up')
  .description('Atualiza artefatos instalados cujo conteúdo mudou no catálogo (reinstala em cada alvo original)')
  .option('-g, --global', 'Atualiza no escopo global (home)', false)
  .option('--dry-run', 'Mostra o que seria atualizado, sem alterar nada', false)
  .action(async (names: string[], options) => {
    await runUpdate(names ?? [], options)
  })

// Config: alvo/método padrão e listagem de alvos.
const config = program.command('config').description('Mostra ou altera a configuração (alvo/LLM e método padrão)')

config.action(() => {
  runConfigShow()
})

const configSet = config.command('set').description('Define um valor de configuração')

configSet
  .command('target <id>')
  .description('Define o alvo/LLM padrão (claude-code, github-copilot, cursor)')
  .action((id: string) => {
    runConfigSetTarget(id)
  })

configSet
  .command('method <method>')
  .description('Define o método padrão de instalação (copy|symlink)')
  .action((method: string) => {
    runConfigSetMethod(method)
  })

program
  .command('targets')
  .description('Lista os alvos/LLMs disponíveis e os tipos suportados por cada um')
  .action(() => {
    runListTargets()
  })

program
  .command('registry')
  .description('Regenera o registry.json a partir do catálogo')
  .action(() => {
    runRegistry()
  })

program.parseAsync(process.argv)
