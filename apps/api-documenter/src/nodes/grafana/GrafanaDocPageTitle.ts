import { GrafanaDocNode, IGrafanaDocNodeParameters, StandardWriter } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";
import { DocHeading } from "../DocHeading";

export class GrafanaDocPageTitle extends GrafanaDocNode {
  public readonly title?: string;

  public constructor(parameters: IGrafanaDocNodeParameters) {
    super(parameters);
    this.title = titleFromItem(parameters.apiItem);
  }

  public get kind(): string {
    return GrafanaDocPageTitle.name;
  }

  public writeTo(writer: IndentedWriter, standardWriter: StandardWriter): void {
    if (!this.title) {
      return;
    }

    standardWriter(new DocHeading({
      configuration: this.configuration,
      title: this.title,
      level: 1
    }));
  }
}

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