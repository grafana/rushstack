import { DocSection, TSDocConfiguration } from '@microsoft/tsdoc';
import { ApiItem, ApiItemKind } from '@microsoft/api-extractor-model';
import { DocHeading } from '../../nodes/DocHeading';

export class PageTitleAppender {
  private readonly _configuration: TSDocConfiguration;

  constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  append(output: DocSection, apiItem: ApiItem): void {
    const title = titleFromItem(apiItem);

    if (!title) {
      return;
    }

    output.appendNode(new DocHeading({
      configuration: this._configuration,
      title,
      level: 1
    }));
  }
};

function titleFromItem(apiItem: ApiItem): string | undefined {
  const scopedName: string = apiItem.getScopedNameWithinPackage();

  switch (apiItem.kind) {
    case ApiItemKind.Class:
        return `${scopedName} class`;
    case ApiItemKind.Enum:
      return `${scopedName} enum`;
    case ApiItemKind.Interface:
      return `${scopedName} interface`
    case ApiItemKind.Function:
      return `${scopedName} function`;
    case ApiItemKind.Model:
      return `API Reference`;
    case ApiItemKind.Namespace:
      return `${scopedName} namespace`;
    case ApiItemKind.Package:
      return `${apiItem.displayName} package`;
    case ApiItemKind.TypeAlias:
      return `${scopedName} type`;
    case ApiItemKind.Variable:
      return `${scopedName} variable`;
  }

  return;
}