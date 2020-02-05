import { DocSection, TSDocConfiguration, DocFencedCode } from '@microsoft/tsdoc';
import { ApiItem, ApiDeclaredItem } from '@microsoft/api-extractor-model';
import { BoldTextAppender } from './BoldTextAppender';

export class SignatureAppender {
  private readonly _configuration: TSDocConfiguration;
  private readonly _boldTextAppender: BoldTextAppender;

  public constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
    this._boldTextAppender = new BoldTextAppender(configuration);
  }

  public append(output: DocSection, apiItem: ApiItem): void {
    if (!this._isApiDeclaredItem(apiItem)) {
      return;
    }

    if (apiItem.excerpt.text.length <= 0) {
      return;
    }

    const configuration: TSDocConfiguration = this._configuration;
    this._boldTextAppender.append(output, 'Signature');

    output.appendNode(new DocFencedCode({
        configuration,
        code: apiItem.getExcerptWithModifiers(),
        language: 'typescript'
    }));
  }

  private _isApiDeclaredItem(apiItem: ApiItem): apiItem is ApiDeclaredItem {
    const node: ApiDeclaredItem = apiItem as ApiDeclaredItem;
    return node && node.buildExcerpt !== undefined;
  }
};