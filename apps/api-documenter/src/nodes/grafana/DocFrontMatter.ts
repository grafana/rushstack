import { GrafanaDocNode, IGrafanaDocNodeParameters } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiItemKind } from "@microsoft/api-extractor-model";

export interface IDocFrontMatterParameters extends IGrafanaDocNodeParameters {
  draft: boolean
};

export class DocFrontMatter extends GrafanaDocNode {
  private static tag: string = "+++";
  private static type: string = "docs";

  private readonly title: string;
  private readonly keywords: string[];
  private readonly draft: boolean;

  public constructor(parameters: IDocFrontMatterParameters) {
    super(parameters);
    this.title = titleFromItem(parameters.apiItem);
    this.keywords = keywordsFromItem(parameters.apiItem);
    this.draft = parameters.draft || false;
  }

  public get kind(): string {
    return DocFrontMatter.name;
  }

  public writeTo(writer: IndentedWriter): void {
    const keywords = this.keywords.map(kw => `"${kw}"`).join(",");

    writer.writeLine(DocFrontMatter.tag);
    writer.writeLine(`title = "${this.title}"`);
    writer.writeLine(`keywords = [${keywords}]`);
    writer.writeLine(`type = "${DocFrontMatter.type}"`);
    if(this.draft) {
      writer.writeLine(`draft = ${this.draft}`);
    }
    writer.writeLine(DocFrontMatter.tag);
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