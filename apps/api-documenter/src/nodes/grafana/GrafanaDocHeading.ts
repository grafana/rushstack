import { GrafanaDocNode, IGrafanaDocNodeParameters, StandardWriter } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { DocHeading } from "../DocHeading";
import { Utilities } from "../../utils/Utilities";

export class GrafanaDocHeading extends GrafanaDocNode {
  public readonly title: string;

  public constructor(parameters: IGrafanaDocNodeParameters) {
    super(parameters);
    this.title = titleFromItem(parameters.apiItem);
  }

  public get kind(): string {
    return GrafanaDocHeading.name;
  }

  public writeTo(writer: IndentedWriter, standardWriter: StandardWriter): void {
    standardWriter(new DocHeading({
      configuration: this.configuration,
      title: this.title,
      level: 2
    }));
  }
}

function titleFromItem(apiItem: ApiItem): string {
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