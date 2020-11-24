import colors from 'colors';

import { IResolveDeclarationReferenceResult } from '@microsoft/api-extractor-model';
import { CustomMarkdownEmitter, ICustomMarkdownEmitterOptions } from './CustomMarkdownEmitter';
import { DocNode, DocLinkTag } from '@microsoft/tsdoc';
import { IMarkdownEmitterContext } from './MarkdownEmitter';
import { GrafanaDocNode } from '../nodes/grafana/GrafanaDocNode';
import { IndentedWriter } from '../utils/IndentedWriter';

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

  /** @override */
  protected writeLinkTagWithCodeDestination(
    docLinkTag: DocLinkTag,
    context: IMarkdownEmitterContext<ICustomMarkdownEmitterOptions>
  ): void {
    const options: ICustomMarkdownEmitterOptions = context.options;

    const result: IResolveDeclarationReferenceResult = this._apiModel.resolveDeclarationReference(
      docLinkTag.codeDestination!,
      options.contextApiItem
    );

    if (result.resolvedApiItem) {
      const filename: string | undefined = options.onGetFilenameForApiItem(result.resolvedApiItem);

      if (filename) {
        let linkText: string = docLinkTag.linkText || '';
        if (linkText.length === 0) {
          // Generate a name such as Namespace1.Namespace2.MyClass.myMethod()
          linkText = result.resolvedApiItem.getScopedNameWithinPackage();
        }
        if (linkText.length > 0) {
          const encodedLinkText: string = this.getEscapedText(linkText.replace(/\s+/g, ' '));

          context.writer.write('[');
          context.writer.write(encodedLinkText);
          context.writer.write(`]({{< relref "${filename!}" >}})`);
        } else {
          console.log(colors.yellow('WARNING: Unable to determine link text'));
        }
      }
    } else if (result.errorMessage) {
      console.log(
        colors.yellow(
          `WARNING: Unable to resolve reference "${docLinkTag.codeDestination!.emitAsTsdoc()}": ` +
            result.errorMessage
        )
      );
    }
  }
}
