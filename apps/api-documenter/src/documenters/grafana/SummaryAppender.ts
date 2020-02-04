import { DocSection } from '@microsoft/tsdoc';
import { ApiItem, ApiDeclaredItem } from '@microsoft/api-extractor-model';

export class SummaryAppender {
  append(output: DocSection, apiItem: ApiItem): void {
    if (!isApiDeclaredItem(apiItem)) {
      return;
    }

    if (!apiItem.tsdocComment || !apiItem.tsdocComment.summarySection) {
      return;
    }

    for (const node of apiItem.tsdocComment.summarySection.nodes) {
      output.appendNode(node);
    }
  }
};

function isApiDeclaredItem(apiItem: ApiItem): apiItem is ApiDeclaredItem {
  const node = apiItem as ApiDeclaredItem;
  return node && node.buildExcerpt !== undefined;
}