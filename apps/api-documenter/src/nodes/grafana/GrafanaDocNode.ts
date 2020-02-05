import { DocNode, IDocNodeParameters } from "@microsoft/tsdoc";
import { ApiItem } from "@microsoft/api-extractor-model";
import { IndentedWriter } from "../../utils/IndentedWriter";

export interface IGrafanaDocNodeParameters extends IDocNodeParameters {
    apiItem: ApiItem
}

export abstract class GrafanaDocNode extends DocNode {
    abstract writeTo(writer: IndentedWriter);
}