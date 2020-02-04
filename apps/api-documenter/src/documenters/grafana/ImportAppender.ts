import { DocSection, TSDocConfiguration, DocFencedCode } from '@microsoft/tsdoc';
import { ApiItem, ApiDeclaredItem } from '@microsoft/api-extractor-model';
import { Utilities } from '../../utils/Utilities';
import { BoldTextAppender } from './BoldTextAppender';

export class ImportAppender {
  private readonly _configuration: TSDocConfiguration;
  private readonly _boldTextAppender: BoldTextAppender;

  constructor(configuration: TSDocConfiguration) {
    this._configuration = configuration;
    this._boldTextAppender = new BoldTextAppender(configuration);
  }

  append(output: DocSection, apiItem: ApiItem): void {
    if (!isApiDeclaredItem(apiItem)) {
      return;
    }

    const code = importFromItem(apiItem);

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
};

function importFromItem(apiItem: ApiDeclaredItem): string | undefined {
  const packageItem = apiItem.getAssociatedPackage();

  if (!packageItem) {
    return;
  }

  return apiItem.getScopedNameWithinPackage()
    .split('.')
    .map((value, index, all) => {
      if (index == 0) {
        return generateImport(value, apiItem.displayName);
      }
      return generateDestruct(value, all[index - 1]);
    })
    .join('\n');
}

function generateImport(path: string, displayName: string): string {
  const escapedPath = Utilities.getImportName(path);
  const escapedName = Utilities.getImportName(displayName);
  return `import { ${escapedPath} } from '${escapedName}';`;
}

function generateDestruct(path: string, displayName: string): string {
  const escapedPath = Utilities.getImportName(path);
  const escapedName = Utilities.getImportName(displayName);
  return `const { ${escapedPath} } = ${escapedName};`;
}

function isApiDeclaredItem(apiItem: ApiItem): apiItem is ApiDeclaredItem {
  const node = apiItem as ApiDeclaredItem;
  return node && node.buildExcerpt !== undefined;
}