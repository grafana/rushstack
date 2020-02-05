import { DocSection, TSDocConfiguration } from '@microsoft/tsdoc';
import { ApiItem, ApiItemKind } from '@microsoft/api-extractor-model';
import { DocHeading } from '../../nodes/DocHeading';
import { Utilities } from '../../utils/Utilities';

export class HeadingAppender {
  private readonly _configuration: TSDocConfiguration;

  public constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
  }

  public append(output: DocSection, apiItem: ApiItem): void {
    const title: string = this._titleFromItem(apiItem);

    if (!title) {
      return;
    }

    output.appendNode(new DocHeading({
      configuration: this._configuration,
      title,
      level: 2
    }));
  }

  private _titleFromItem(apiItem: ApiItem): string {
    const scopedName: string = apiItem.getScopedNameWithinPackage();
  
    switch (apiItem.kind) {
      case ApiItemKind.Enum:
        return `${scopedName} enum`;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
        return Utilities.getConciseSignature(apiItem);
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
        return `${apiItem.displayName} method`;
      case ApiItemKind.Function:
        return `${scopedName} function`;
      case ApiItemKind.Namespace:
        return `${scopedName} namespace`;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        return `${apiItem.displayName} property`;
      case ApiItemKind.TypeAlias:
        return `${scopedName} type`;
      case ApiItemKind.Variable:
        return `${scopedName} variable`;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }
  }
};