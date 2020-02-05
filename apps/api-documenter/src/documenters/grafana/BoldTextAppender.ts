import { DocSection, TSDocConfiguration, DocParagraph, DocPlainText } from '@microsoft/tsdoc';
import { DocEmphasisSpan } from '../../nodes/DocEmphasisSpan';

export class BoldTextAppender {
  private readonly _configuration: TSDocConfiguration;

  public constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  public append(output: DocSection, text: string): void {
    const configuration: TSDocConfiguration = this._configuration;

    output.appendNode(new DocParagraph({ configuration }, [
      new DocEmphasisSpan({ configuration, bold: true}, [
        new DocPlainText({ configuration, text })
      ])
    ]));
  }
};
