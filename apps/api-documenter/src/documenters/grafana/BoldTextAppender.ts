import { DocSection, TSDocConfiguration, DocParagraph, DocPlainText } from '@microsoft/tsdoc';
import { DocEmphasisSpan } from '../../nodes/DocEmphasisSpan';

export class BoldTextAppender {
  private readonly _configuration: TSDocConfiguration;

  constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  append(output: DocSection, text: string): void {
    const configuration = this._configuration;

    output.appendNode(new DocParagraph({ configuration }, [
      new DocEmphasisSpan({ configuration, bold: true}, [
        new DocPlainText({ configuration, text })
      ])
    ]));
  }
};
