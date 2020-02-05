import { DocSection, TSDocConfiguration, DocFencedCode } from '@microsoft/tsdoc';
import { ApiItem, ApiDeclaredItem, ApiPackage } from '@microsoft/api-extractor-model';
import { Utilities } from '../../utils/Utilities';
import { BoldTextAppender } from './BoldTextAppender';

export class ImportAppender {
  private readonly _configuration: TSDocConfiguration;
  private readonly _boldTextAppender: BoldTextAppender;

  public constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
    this._boldTextAppender = new BoldTextAppender(configuration);
  }

  public append(output: DocSection, apiItem: ApiItem): void {
    if (!this._isApiDeclaredItem(apiItem)) {
      return;
    }

    const code: string | undefined = this._importFromItem(apiItem);

    if (!code) {
      return;
    }

    this._boldTextAppender.append(output, 'Import');
    output.appendNode(new DocFencedCode({
      configuration: this._configuration,
      code,
      language: 'typescript'
    }));
  }

  private _isApiDeclaredItem(apiItem: ApiItem): apiItem is ApiDeclaredItem {
    const node: ApiDeclaredItem = apiItem as ApiDeclaredItem;
    return node && node.buildExcerpt !== undefined;
  }

  private _importFromItem(apiItem: ApiDeclaredItem): string | undefined {
    const packageItem: ApiPackage | undefined = apiItem.getAssociatedPackage();
  
    if (!packageItem) {
      return;
    }
  
    return apiItem.getScopedNameWithinPackage()
      .split('.')
      .map((value, index, all) => {
        if (index === 0) {
          return this._generateImport(value, packageItem.displayName);
        }
        return this._generateDestruct(value, all[index - 1]);
      })
      .join('\n');
  }

  private _generateDestruct(path: string, displayName: string): string {
    const escapedPath: string = Utilities.getImportName(path);
    const escapedName: string = Utilities.getImportName(displayName);
    return `const { ${escapedPath} } = ${escapedName};`;
  }

  private _generateImport(path: string, displayName: string): string {
    const escapedPath: string = Utilities.getImportName(path);
    return `import { ${escapedPath} } from '${displayName}';`;
  }
};