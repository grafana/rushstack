import { CustomMarkdownEmitter } from "./CustomMarkdownEmitter";
import { DocNode } from "@microsoft/tsdoc";
import { IMarkdownEmitterContext } from "./MarkdownEmitter";
import { GrafanaDocNode } from "../nodes/grafana/GrafanaDocNode";
import { IndentedWriter } from "../utils/IndentedWriter";

export class GrafanaMarkdownEmitter extends CustomMarkdownEmitter {
    protected writeNode(docNode: DocNode, context: IMarkdownEmitterContext, docNodeSiblings: boolean): void {
        const writer: IndentedWriter = context.writer;

        if (this._isGrafanaNode(docNode)) {
            return docNode.writeTo(writer);
        }

        super.writeNode(docNode, context, docNodeSiblings);
    }

    private _isGrafanaNode(docNode: DocNode): docNode is GrafanaDocNode {
        const node: GrafanaDocNode = docNode as GrafanaDocNode;
        return node && node.writeTo !== undefined;
    }
}