import { GrafanaDocNode, IGrafanaDocNodeParameters, StandardWriter } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";

export class GrafanaDocPageMeta extends GrafanaDocNode {
  private static tag: string = "+++";
  private static type: string = "docs";

  public readonly title: string;
  public readonly keywords: string[];

  public constructor(parameters: IGrafanaDocNodeParameters) {
    super(parameters);
    this.title = titleFromItem(parameters.apiItem);
    this.keywords = keywordsFromItem(parameters.apiItem);
  }

  public get kind(): string {
    return GrafanaDocPageMeta.name;
  }

  public writeTo(writer: IndentedWriter, standardWriter: StandardWriter): void {
    const keywords = this.keywords.map(kw => `"${kw}"`).join(",");

    writer.writeLine(GrafanaDocPageMeta.tag);
    writer.writeLine(`title = "${this.title}"`);
    writer.writeLine(`keywords = [${keywords}]`);
    writer.writeLine(`type = "${GrafanaDocPageMeta.type}"`);
    writer.writeLine(GrafanaDocPageMeta.tag);
  }
}

function titleFromItem(apiItem: ApiItem): string {
    if(apiItem.kind === ApiItemKind.Model) {
        return "API Reference";
    }
    return apiItem.displayName;
}

function keywordsFromItem(apiItem: ApiItem): string[] {
    const keywords = ["grafana", "documentation", "sdk"];
    const packageItem = apiItem.getAssociatedPackage();

    if (packageItem) {
        keywords.push(packageItem.name);
    }

    return keywords;
}