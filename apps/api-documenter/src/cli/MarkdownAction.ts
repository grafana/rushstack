// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiDocumenterCommandLine } from './ApiDocumenterCommandLine';
import { BaseAction } from './BaseAction';
import { MarkdownDocumenter } from '../documenters/MarkdownDocumenter';
import { ApiModel } from '@microsoft/api-extractor-model';
import { CommandLineFlagParameter } from '@rushstack/ts-command-line';
import { HugoMarkdownDocumenter } from '../documenters/grafana/HugoMarkdownDocumenter';

export class MarkdownAction extends BaseAction {
  private _hugoParameter: CommandLineFlagParameter;
  private _hugoDraftParameter: CommandLineFlagParameter;

  public constructor(parser: ApiDocumenterCommandLine) {
    super({
      actionName: 'markdown',
      summary: 'Generate documentation as Markdown files (*.md)',
      documentation:
        'Generates API documentation as a collection of files in' +
        ' Markdown format, suitable for example for publishing on a GitHub site.'
    });
  }

  protected onDefineParameters(): void {
    super.onDefineParameters();
    this._hugoParameter = this.defineFlagParameter({
      parameterLongName: '--hugo',
      description: `Enables some additional features specific to Grafana.com documentation.`
    });
    this._hugoDraftParameter = this.defineFlagParameter({
      parameterLongName: '--draft',
      description: `The documentation generated will be marked as draft.`
    });
  }

  protected onExecute(): Promise<void> {
    // override
    const apiModel: ApiModel = this.buildApiModel();

    if (this._hugoParameter.value) {
      const markdownDocumenter: HugoMarkdownDocumenter = new HugoMarkdownDocumenter({
        model: apiModel,
        draft: this._hugoDraftParameter.value || false,
        output: this.outputFolder
      });

      markdownDocumenter.generateFiles();
      return Promise.resolve();
    }

    const markdownDocumenter: MarkdownDocumenter = new MarkdownDocumenter(apiModel, undefined);
    markdownDocumenter.generateFiles(this.outputFolder);
    return Promise.resolve();
  }
}
