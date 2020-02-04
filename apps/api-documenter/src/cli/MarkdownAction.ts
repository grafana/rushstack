// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiDocumenterCommandLine } from './ApiDocumenterCommandLine';
import { BaseAction } from './BaseAction';
import { MarkdownDocumenter } from '../documenters/MarkdownDocumenter';
import { ApiModel } from '@microsoft/api-extractor-model';
import { CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { GrafanaMarkdownDocumenter } from '../documenters/GrafanaMarkdownDocumenter';

export class MarkdownAction extends BaseAction {
  private _grafanaParameter: CommandLineFlagParameter;

  public constructor(parser: ApiDocumenterCommandLine) {
    super({
      actionName: 'markdown',
      summary: 'Generate documentation as Markdown files (*.md)',
      documentation: 'Generates API documentation as a collection of files in'
        + ' Markdown format, suitable for example for publishing on a GitHub site.'
    });
  }

  protected onDefineParameters(): void {
    super.onDefineParameters();
    this._grafanaParameter = this.defineFlagParameter({
      parameterLongName: '--grafana',
      description: `Enables some additional features specific to Grafana.com documentation`
    });
  }

  protected onExecute(): Promise<void> { // override
    const apiModel: ApiModel = this.buildApiModel();

    if (this._grafanaParameter.value) {
      new GrafanaMarkdownDocumenter(this.outputFolder, apiModel).generateFiles();
      return Promise.resolve();
    }

    const markdownDocumenter: MarkdownDocumenter = new MarkdownDocumenter(apiModel, undefined);
    markdownDocumenter.generateFiles(this.outputFolder);
    return Promise.resolve();
  }
}
