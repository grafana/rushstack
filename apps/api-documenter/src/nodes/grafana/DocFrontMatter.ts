import { GrafanaDocNode, IGrafanaDocNodeParameters } from "./GrafanaDocNode";
import { IndentedWriter } from "../../utils/IndentedWriter";
import { ApiItem, ApiItemKind, ApiPackage } from "@microsoft/api-extractor-model";

export interface IDocFrontMatterParameters extends IGrafanaDocNodeParameters {
  draft: boolean
};

export class DocFrontMatter extends GrafanaDocNode {
  private static _tag: string = "+++";
  private static _type: string = "docs";

  private readonly _title: string;
  private readonly _keywords: string[];
  private readonly _draft: boolean;

  public constructor(parameters: IDocFrontMatterParameters) {
    super(parameters);
    this._title = this._titleFromItem(parameters.apiItem);
    this._keywords = this._keywordsFromItem(parameters.apiItem);
    this._draft = parameters.draft || false;
  }

  public get kind(): string {
    return DocFrontMatter.name;
  }

  public writeTo(writer: IndentedWriter): void {
    const keywords: string = this._keywords.map(kw => `"${kw}"`).join(",");

    writer.writeLine(DocFrontMatter._tag);
    writer.writeLine('# -----------------------------------------------------------------------');
    writer.writeLine('# Do not edit this file. It is automatically generated by API Documenter.');
    writer.writeLine('# -----------------------------------------------------------------------');
    writer.writeLine(`title = "${this._title}"`);
    writer.writeLine(`keywords = [${keywords}]`);
    writer.writeLine(`type = "${DocFrontMatter._type}"`);
    if(this._draft) {
      writer.writeLine(`draft = ${this._draft}`);
    }
    writer.writeLine(DocFrontMatter._tag);
  }

  private _titleFromItem(apiItem: ApiItem): string {
    if(apiItem.kind === ApiItemKind.Model) {
        return "API Reference";
    }
    return apiItem.displayName;
  }

  private _keywordsFromItem(apiItem: ApiItem): string[] {
    const keywords: string[] = ["grafana", "documentation", "sdk"];
    const packageItem: ApiPackage | undefined = apiItem.getAssociatedPackage();

    if (packageItem) {
        keywords.push(packageItem.name);
    }

    return keywords;
  }
}