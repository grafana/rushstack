import { DocSection } from '@microsoft/tsdoc';
import { ApiItem, ApiDeclaredItem } from '@microsoft/api-extractor-model';

export class SummaryAppender {
  public append(output: DocSection, apiItem: ApiItem): void {
    if (!this._isApiDeclaredItem(apiItem)) {
      return;
    }

    if (!apiItem.tsdocComment || !apiItem.tsdocComment.summarySection) {
      return;
    }

    for (const node of apiItem.tsdocComment.summarySection.nodes) {
      output.appendNode(node);
    }
  }

  private _isApiDeclaredItem(apiItem: ApiItem): apiItem is ApiDeclaredItem {
    const node: ApiDeclaredItem = apiItem as ApiDeclaredItem;
    return node && node.tsdocComment !== undefined;
  }
};