import { DocSection, TSDocConfiguration, DocParagraph, DocPlainText, DocComment } from '@microsoft/tsdoc';
import { ApiItem, ApiReleaseTagMixin, ReleaseTag, ApiDocumentedItem } from '@microsoft/api-extractor-model';
import { DocNoteBox } from '../../nodes/DocNoteBox';

const unstable: string = 'This API is provided as a preview for developers and may change'
    + ' based on feedback that we receive.  Do not use this API in a production environment.';

const deprecated: string = '';


export class WarningAppender {
  private readonly _configuration: TSDocConfiguration;

  constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  append(output: DocSection, apiItem: ApiItem): void {
    const warning = warningForItem(apiItem);
    const configuration = this._configuration;

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
};

function warningForItem(apiItem: ApiItem): string | undefined {
  if (isDeprecated(apiItem)) {
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

function isDeprecated(apiItem: ApiItem) {
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