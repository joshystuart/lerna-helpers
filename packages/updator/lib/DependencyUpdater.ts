import { LernaPackageManager, Package, ProcessExecutor } from '@lerna-helpers/common';
import { ILogger } from '@rafterjs/logger-plugin';
import { YARN_COMMANDS } from './DependencyConstants';

export class DependencyUpdater {
  private readonly lernaPackageManager: LernaPackageManager;

  private readonly logger: ILogger;

  constructor(lernaPackageManager: LernaPackageManager, logger: ILogger) {
    this.lernaPackageManager = lernaPackageManager;
    this.logger = logger;
  }

  public async update(): Promise<void> {
    // update root
    await this.updateRoot();

    // update packages
    await this.updatePackages();
  }

  public async updateRoot(): Promise<void> {
    try {
      this.logger.info(`⏳ Running update on the root`);
      const process = ProcessExecutor.execute(`${YARN_COMMANDS.UPGRADE}`);
      this.logger.info(`✔ Successfully updated dependencies in the root project
      -------------------------------
      `);

      this.logger.debug(`
       -------------------------------
      ${process}
       -------------------------------
      `);
    } catch (error) {
      this.logger.error(`❌ Failed to update dependencies for the root project
      `);
      this.logger.debug(`${error}
      
      `);
    }
  }

  public async updatePackages(): Promise<void> {
    const packages = await this.lernaPackageManager.getPackages(true);

    for (const lernaPackage of packages) {
      this.updateDependencies(lernaPackage);
    }
  }

  private async updateDependencies(lernaPackage: Package): Promise<void> {
    try {
      this.logger.info(`⏳ Running update on ${lernaPackage.name}`);

      // run install to ensure there's a yarn.lock then run update

      // const process = ProcessExecutor.execute(`cd ${lernaPackage.path} && ${YARN_COMMANDS.INSTALL}`);
      // const process = ProcessExecutor.execute(`cd ${lernaPackage.path} && ${YARN_COMMANDS.UPGRADE}`);
      // const process = ProcessExecutor.execute(`cd ${lernaPackage.path} && ${YARN_COMMANDS.IMPORT}`);

      this.logger.info(`✔ Successfully updated dependencies for ${lernaPackage.name}
      `);
      this.logger.debug(`${process}
      
      `);
    } catch (error) {
      this.logger.error(`❌ Failed to update dependencies for ${lernaPackage.name}
      `);
      this.logger.debug(`${error}
      
      `);
    }
  }

  private hasLockFile(lernaPackage: Package): boolean {
    console.log(`Looking in ${lernaPackage.path} for lock`);
    return true;
  }
}

export default DependencyUpdater;
