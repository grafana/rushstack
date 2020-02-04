import { GrafanaDocNode, IGrafanaDocNodeParameters, StandardWriter } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiDocumentedItem, ApiReleaseTagMixin, ReleaseTag } from "@microsoft/api-extractor-model";
import { DocNoteBox } from "../DocNoteBox";
import { DocComment, DocParagraph, DocPlainText } from "@microsoft/tsdoc";

const unstable: string = 'This API is provided as a preview for developers and may change'
    + ' based on feedback that we receive.  Do not use this API in a production environment.';

const deprecated: string = '';

export class GrafanaDocWarning extends GrafanaDocNode {
  public readonly warning?: string;

  public constructor(parameters: IGrafanaDocNodeParameters) {
    super(parameters);
    this.warning = warningForItem(parameters.apiItem);
  }

  public get kind(): string {
    return GrafanaDocWarning.name;
  }

  public writeTo(writer: IndentedWriter, stdWriter: StandardWriter): void {
    if (!this.warning) {
      return;
    }

    const { configuration } = this;

    stdWriter(new DocNoteBox({ configuration }, [
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: this.warning })
        ])
      ])
    );
  }
}

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