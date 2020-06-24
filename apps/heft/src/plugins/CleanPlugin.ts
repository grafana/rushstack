// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { FileSystem } from '@rushstack/node-core-library';

import { IHeftPlugin } from '../pluginFramework/IHeftPlugin';
import { HeftSession } from '../pluginFramework/HeftSession';
import { HeftConfiguration } from '../configuration/HeftConfiguration';
import { ICleanActionData } from '../cli/actions/CleanAction';

const PLUGIN_NAME: string = 'CleanPlugin';

export const cleanPlugin: IHeftPlugin = {
  displayName: PLUGIN_NAME,
  apply: (heftSession: HeftSession, heftConfiguration: HeftConfiguration) => {
    heftSession.hooks.clean.tap(PLUGIN_NAME, (clean: ICleanActionData) => {
      clean.hooks.deletePath.tapPromise(PLUGIN_NAME, async (pathToDelete: string) => {
        try {
          FileSystem.deleteFile(pathToDelete, { throwIfNotExists: true });
          heftConfiguration.terminal.writeVerboseLine(`Deleted "${pathToDelete}"`);
        } catch (error) {
          if (FileSystem.exists(pathToDelete)) {
            FileSystem.deleteFolder(pathToDelete);
            heftConfiguration.terminal.writeVerboseLine(`Deleted folder "${pathToDelete}"`);
          }
        }
      });
    });
  }
};
