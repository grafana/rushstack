import { DocSection, TSDocConfiguration, DocParagraph, DocPlainText, DocComment } from '@microsoft/tsdoc';
import { ApiItem, ApiReleaseTagMixin, ReleaseTag, ApiDocumentedItem } from '@microsoft/api-extractor-model';
import { DocNoteBox } from '../../nodes/DocNoteBox';

const unstable: string = 'This API is provided as a preview for developers and may change'
    + ' based on feedback that we receive.  Do not use this API in a production environment.';

const deprecated: string = '';


export class WarningAppender {
  private readonly _configuration: TSDocConfiguration;

  public constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  public append(output: DocSection, apiItem: ApiItem): void {
    const warning: string | undefined = this._warningForItem(apiItem);
    const configuration: TSDocConfiguration = this._configuration;

    if (!warning) {
      return;
    }

    output.appendNode(new DocNoteBox({ configuration }, [
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: warning })
        ])
      ])
    );
  }

  private _warningForItem(apiItem: ApiItem): string | undefined {
    if (this._isDeprecated(apiItem)) {
      return deprecated;
    }
  
    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
        switch (apiItem.releaseTag) {
          case ReleaseTag.Alpha:
          case ReleaseTag.Beta:
          case ReleaseTag.None:
            return unstable;
        }
    }
  }
  
  private _isDeprecated(apiItem: ApiItem): boolean {
    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;
  
      if (!tsdocComment) {
        return false;
      }
  
      if (tsdocComment.deprecatedBlock) {
        return true;
      }
    }
  
    return false;
  }
};