#!/usr/bin/env node
import { lernaPackageManagerFactory } from '@lerna-helpers/common';
import loggerFactory, { LogLevel } from '@rafterjs/logger-plugin';
import yargs, { Argv } from 'yargs';
import { WatcherConfig, watcherFactory } from './lib/Watcher';
import { DEFAULT_COMMANDS, DEFAULT_DELAY, DEFAULT_EXTENSION, DEFAULT_IGNORE } from './lib/WatcherConstants';

// CLI script
const { argv } = yargs(process.argv.slice(2))
  .scriptName('watch')
  .usage('Usage $0 [options] <command>')
  .command(
    '* <command>',
    'Executes a command every time a file changes in one of the Lerna packages. Once that has completed, the' +
      ' <command> will be executed',
    (thisYargs: Argv) => {
      thisYargs
        .positional('command', {
          describe: `The command to run after the <change> command has run eg. "${DEFAULT_COMMANDS.START}"`,
          type: 'string',
          demandOption: true,
        })
        .option('change', {
          alias: 'c',
          type: 'string',
          demandOption: false,
          default: DEFAULT_COMMANDS.BUILD,
          describe: `The command that runs when a file has been updated. By default it is: "${DEFAULT_COMMANDS.BUILD}`,
        })
        .option('extension', {
          alias: ['e', 'ext'],
          type: 'string',
          demandOption: false,
          default: DEFAULT_EXTENSION,
          describe: `Which extensions to watch for changes on. The default is ${DEFAULT_EXTENSION}`,
        })
        .option('ignore', {
          alias: ['i'],
          type: 'array',
          demandOption: false,
          default: DEFAULT_IGNORE,
          describe: `Which files and directories (GLOB) to ignore from being watched. The default is ${DEFAULT_IGNORE}`,
        })
        .option('delay', {
          alias: ['d'],
          type: 'number',
          demandOption: false,
          default: DEFAULT_DELAY,
          describe:
            `The delay between polling for changes. This can prevent double triggering if you have things like ` +
            `IDE file watchers etc. The default is ${DEFAULT_DELAY}`,
        });
    },
  )
  .help('h')
  .alias('h', 'help');

const config: WatcherConfig = {
  command: argv.command as string,
  onChange: argv.change as string,
  options: {
    extension: argv.extension as string,
    ignore: argv.ignore as Array<string | number>,
    delay: argv.delay as number,
  },
};

const logger = loggerFactory({
  logger: {
    level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  },
});

const lernaPackageManager = lernaPackageManagerFactory(logger);
const watcher = watcherFactory(lernaPackageManager, config, logger);

async function run() {
  logger.info(`Starting Rafter Watcher`);
  logger.debug(`With config`, config);

  await watcher.start();
}

run();
