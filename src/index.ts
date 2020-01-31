#!/usr/bin/env node
import { CommandLineParser } from '@microsoft/ts-command-line';
import { Logger } from './log';
import { ActionRotate } from './rotate/rotate.action';

export class ActionRotateCommandLine extends CommandLineParser {
    verbose = this.defineFlagParameter({
        parameterLongName: '--verbose',
        parameterShortName: '-v',
        description: 'Show extra logging detail',
    });
    extraVerbose = this.defineFlagParameter({
        parameterLongName: '--vv',
        parameterShortName: '-V',
        description: 'Show extra extra logging detail',
    });

    constructor() {
        super({
            toolFilename: 'aws-actions-rotate',
            toolDescription: 'Rotate AWS credentials for github actions',
        });
        this.addAction(new ActionRotate());
    }

    protected onExecute(): Promise<void> {
        if (this.verbose.value) {
            Logger.level = 'debug';
        } else if (this.extraVerbose.value) {
            Logger.level = 'trace';
        } else {
            Logger.level = 'info';
        }

        return super.onExecute();
    }
    protected onDefineParameters(): void {
        // Nothing
    }
}

new ActionRotateCommandLine().executeWithoutErrorHandling().catch(err => {
    Logger.fatal(err, err.message);
    process.exit(1);
});
