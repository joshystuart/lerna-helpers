#!/usr/bin/env node
import { LernaPackageManager } from '@lerna-helpers/common';
import { loggerFactory, LogLevel } from '@rafterjs/logger-plugin';
import { DependencyUpdater } from './lib/DependencyUpdater';

const logger = loggerFactory({ logger: { level: LogLevel.DEBUG } });

const lernaPackageManager = new LernaPackageManager(logger);
const dependencyUpdator = new DependencyUpdater(lernaPackageManager, logger);

async function run() {
  logger.info('⏳ Starting to update dependencies in all lerna packages');
  await dependencyUpdator.update();
  logger.info('✔ Completed updating dependencies');
}

run();
