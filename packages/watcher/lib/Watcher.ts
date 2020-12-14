import { ILernaPackageManager, ProcessExecutor } from '@lerna-helpers/common';
import { ILogger } from '@rafterjs/logger-plugin';
import { ChildProcess } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import { join } from 'path';
import treeKill from 'tree-kill';
import { PACKAGE_TOKEN } from './WatcherConstants';

export type WatcherConfig = {
  command: string;
  onChange: string;
  options: {
    extension?: string;
    ignore?: Array<string | number>;
    delay?: number;
  };
};

export type Package = {
  name: string;
  version: string;
  path: string;
  isUpdating: boolean;
};

export type PackageConfig = {
  name: string;
  version: string;
  location: string;
  private: boolean;
};

export interface IWatcher {
  start(): Promise<void>;
}

export class Watcher implements IWatcher {
  private readonly lernaPackageManager: ILernaPackageManager;

  private readonly config: WatcherConfig;

  private readonly logger: ILogger;

  private watching?: FSWatcher;

  private process?: ChildProcess;

  private isExecuting = false;

  constructor(lernaPackageManager: ILernaPackageManager, config: WatcherConfig, logger: ILogger) {
    this.lernaPackageManager = lernaPackageManager;
    this.config = config;
    this.logger = logger;
  }

  public async start(): Promise<void> {
    // load up all the lerna packages into the class state
    await this.lernaPackageManager.init();

    // execute the provided command
    await this.executeCommand();

    // watch all the lerna packages for changes
    await this.watch();
  }

  /**
   * TODO move to the Lerna Helpers package eg. executor.command()
   * @private
   */
  private async executeCommand(): Promise<void> {
    const { command } = this.config;
    if (!this.isExecuting) {
      if (this.process) {
        this.logger.info(`❌ Killing the existing process.`);
        treeKill(this.process.pid);
        this.logger.info(`✔ Killed the existing process.`);
        this.process = undefined;
      }

      this.isExecuting = true;
      this.logger.info(`⏳ Executing "${command}". Please wait...`);

      this.process = ProcessExecutor.executeChild(command);

      this.process?.on('close', (code) => {
        this.logger.info(`✔ The process for "${command}" has now completed with code "${code}"`);
      });

      if (this.process?.stdout) {
        this.logger.info(`⏳ Watching stdout from the process "${command}"....`);

        this.process.stdout.setEncoding('utf8');
        this.process.stdout.on('data', (data) => {
          console.log(data.toString());
        });
      }

      if (this.process?.stderr) {
        this.logger.info(`⏳ Watching stderr from the process "${command}"....`);
        this.process.stderr.on('data', (data) => {
          this.logger.error(`❌
          ${data.toString()}`);
        });
      }

      this.isExecuting = false;
      this.logger.info(`✔ Successfully executed "${command}":`);
    } else {
      this.logger.warn(`⏳ The command "${command}' is already executing. Please wait...`);
    }
  }

  private async watch(): Promise<void> {
    if (this.watching) {
      // if we are already watching, ensure that it is closed to prevent duplicate events
      await this.watching.close();
    }

    const { extension = 'ts', ignore = [], delay = 500 } = this.config.options;

    const watchedPaths: string[] = (await this.lernaPackageManager.getPackages()).map(
      (packageData: Package): string => {
        return join(packageData.path, `**/*.${extension}`);
      },
    );

    this.logger.info('👀 Watching the following paths: ', watchedPaths);

    this.watching = chokidar.watch(watchedPaths, {
      ignored: ignore,
      followSymlinks: false,
      usePolling: true,
      interval: delay,
      binaryInterval: delay,
    });

    this.watching.on('change', this.handleOnChange.bind(this));
  }

  private async handleOnChange(path: string): Promise<void> {
    this.logger.info(`⏳ "${path}" has changed`);
    const packageData = this.lernaPackageManager.getPackageByPath(path);

    try {
      if (!packageData.isUpdating) {
        packageData.isUpdating = true;
        const { onChange } = this.config;

        const onChangeCommand = this.getInterpolatedCommand(onChange, packageData.name);
        this.logger.info(`⏳ ${packageData.name} will now run "${onChangeCommand}"... please wait`);

        const onUpdateOutput = ProcessExecutor.execute(onChangeCommand);
        this.logger.debug(onUpdateOutput);

        this.logger.info(`✔ Successfully completed updating ${packageData.name}`);
        packageData.isUpdating = false;

        await this.executeCommand();
      } else {
        this.logger.info(`👀 ${packageData.name} is already in the process of updating`);
      }
    } catch (error) {
      this.logger.error(`❌ Something failed during onChange`, error);
      packageData.isUpdating = false;
    }
  }

  private getInterpolatedCommand(command: string, packageName: string): string {
    return command.replace(PACKAGE_TOKEN, packageName);
  }
}

export function watcherFactory(
  lernaPackageManager: ILernaPackageManager,
  config: WatcherConfig,
  logger: ILogger,
): IWatcher {
  return new Watcher(lernaPackageManager, config, logger);
}
