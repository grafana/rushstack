import * as path from 'path';

import {
  PackageName,
  FileSystem,
  NewlineKind
} from '@microsoft/node-core-library';
import {
  DocSection,
  DocPlainText,
  DocLinkTag,
  TSDocConfiguration,
  StringBuilder,
  DocNodeKind,
  DocParagraph,
  DocCodeSpan,
  DocFencedCode,
  StandardTags,
  DocBlock,
  DocComment
} from '@microsoft/tsdoc';
import {
  ApiModel,
  ApiItem,
  ApiEnum,
  ApiPackage,
  ApiItemKind,
  ApiReleaseTagMixin,
  ApiDocumentedItem,
  ApiClass,
  ReleaseTag,
  ApiStaticMixin,
  ApiPropertyItem,
  ApiInterface,
  Excerpt,
  ApiParameterListMixin,
  ApiReturnTypeMixin,
  ApiDeclaredItem,
  ApiNamespace
} from '@microsoft/api-extractor-model';

import { CustomDocNodes } from '../nodes/CustomDocNodeKind';
import { DocHeading } from '../nodes/DocHeading';
import { DocTable } from '../nodes/DocTable';
import { DocEmphasisSpan } from '../nodes/DocEmphasisSpan';
import { DocTableRow } from '../nodes/DocTableRow';
import { DocTableCell } from '../nodes/DocTableCell';
import { Utilities } from '../utils/Utilities';
import { GrafanaMarkdownEmitter } from '../markdown/GrafanaMarkdownEmitter';
import { GrafanaDocPageMeta } from '../nodes/grafana/GrafanaDocPageMeta';
import { GrafanaDocHeading } from '../nodes/grafana/GrafanaDocHeading';
import { GrafanaDocWarning } from '../nodes/grafana/GrafanaDocWarning';
import { GrafanaDocPageTitle } from '../nodes/grafana/GrafanaDocPageTitle';

/**
 * Renders API documentation in the Markdown file format.
 * For more info:  https://en.wikipedia.org/wiki/Markdown
 */
export class GrafanaMarkdownDocumenter {
  private readonly _apiModel: ApiModel;
  private readonly _tsdocConfiguration: TSDocConfiguration;
  private readonly _markdownEmitter: GrafanaMarkdownEmitter;
  private readonly _outputFolder: string;

  public constructor(outputFolder: string, apiModel: ApiModel) {
    this._apiModel = apiModel;
    this._tsdocConfiguration = CustomDocNodes.configuration;
    this._markdownEmitter = new GrafanaMarkdownEmitter(this._apiModel);
    this._outputFolder = outputFolder;
  }

  public generateFiles(): void {
    this._deleteOldOutputFiles(this._outputFolder);
    this._writeApiItemPage(this._apiModel);
  }

  private _writeApiItemPage(apiItem: ApiItem): void {
    const configuration = this._tsdocConfiguration;

    const output: DocSection = new DocSection({ configuration });
    output.appendNode(new GrafanaDocPageMeta({ configuration, apiItem}));
    output.appendNode(new GrafanaDocPageTitle({ configuration, apiItem }));
    
    this._writeApiItemContent(output, apiItem);

    const filename: string = path.join(this._outputFolder, this._getFilenameForApiItem(apiItem));
    const stringBuilder: StringBuilder = new StringBuilder();

    this._markdownEmitter.emit(stringBuilder, output, {
      contextApiItem: apiItem,
      onGetFilenameForApiItem: (apiItemForFilename: ApiItem) => {
        return this._getLinkFilenameForApiItem(apiItemForFilename);
      }
    });
    
    FileSystem.writeFile(filename, stringBuilder.toString(), {
      ensureFolderExists: true,
      convertLineEndings: NewlineKind.CrLf
    });
  }

  private _writeApiItemContent(output: DocSection, apiItem: ApiItem, appendImport: boolean = false): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    output.appendNode(new GrafanaDocWarning({ configuration, apiItem }));
    output.appendNode(new GrafanaDocHeading({configuration, apiItem }));

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        this._appendSection(output, tsdocComment.summarySection);
      }
    }

    if (apiItem instanceof ApiDeclaredItem) {
      if (apiItem.excerpt.text.length > 0) {
        output.appendNode(this._writeBoldText(configuration, 'Signature'));
        output.appendNode(new DocFencedCode({ 
            configuration, 
            code: apiItem.getExcerptWithModifiers(), 
            language: 'typescript' 
        }));
      }

      const importCode = appendImport && this._formatImport(apiItem);

        if (importCode) {
            output.appendNode(this._writeBoldText(configuration, 'Import'));
            output.appendNode(new DocFencedCode({ 
              configuration, 
              code: importCode, 
              language: 'typescript' 
            }));
        }
    }

    let appendRemarks: boolean = true;

    switch (apiItem.kind) {
      case ApiItemKind.Class:
      case ApiItemKind.Interface:
      case ApiItemKind.Namespace:
      case ApiItemKind.Package:
        this._writeRemarksSection(output, apiItem);
        appendRemarks = false;
        break;
    }

    switch (apiItem.kind) {
      case ApiItemKind.Class:
        this._writeClassTables(output, apiItem as ApiClass);
        break;
      case ApiItemKind.Enum:
        this._writeEnumTables(output, apiItem as ApiEnum);
        break;
      case ApiItemKind.Interface:
        this._writeInterfaceTables(output, apiItem as ApiInterface);
        break;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
      case ApiItemKind.Function:
        this._writeParameterTables(output, apiItem as ApiParameterListMixin);
        this._writeThrowsSection(output, apiItem);
        break;
      case ApiItemKind.Namespace:
        this._writePackageOrNamespaceTables(output, apiItem as ApiNamespace);
        break;
      case ApiItemKind.Model:
        this._writeModelTable(output, apiItem as ApiModel);
        break;
      case ApiItemKind.Package:
        this._writePackageOrNamespaceTables(output, apiItem as ApiPackage);
        break;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        break;
      case ApiItemKind.TypeAlias:
        break;
      case ApiItemKind.Variable:
        break;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }

    if (appendRemarks) {
        this._writeRemarksSection(output, apiItem);
    }
  };

  private _writeRemarksSection(output: DocSection, apiItem: ApiItem): void {
    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @remarks block
        if (tsdocComment.remarksBlock) {
          output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Remarks' }));
          this._appendSection(output, tsdocComment.remarksBlock.content);
        }

        // Write the @example blocks
        const exampleBlocks: DocBlock[] = tsdocComment.customBlocks.filter(x => x.blockTag.tagNameWithUpperCase
          === StandardTags.example.tagNameWithUpperCase);

        let exampleNumber: number = 1;
        for (const exampleBlock of exampleBlocks) {
          const heading: string = exampleBlocks.length > 1 ? `Example ${exampleNumber}` : 'Example';

          output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: heading }));

          this._appendSection(output, exampleBlock.content);

          ++exampleNumber;
        }
      }
    }
  }

  private _writeThrowsSection(output: DocSection, apiItem: ApiItem): void {
    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @throws blocks
        const throwsBlocks: DocBlock[] = tsdocComment.customBlocks.filter(x => x.blockTag.tagNameWithUpperCase
          === StandardTags.throws.tagNameWithUpperCase);

        if (throwsBlocks.length > 0) {
          const heading: string = 'Exceptions';
          output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: heading }));

          for (const throwsBlock of throwsBlocks) {
            this._appendSection(output, throwsBlock.content);
          }
        }
      }
    }
  }

  /**
   * GENERATE PAGE: MODEL
   */
  private _writeModelTable(output: DocSection, apiModel: ApiModel): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const packagesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Package', 'Description' ]
    });

    for (const apiMember of apiModel.members) {

      const row: DocTableRow = new DocTableRow({ configuration }, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember)
      ]);

      switch (apiMember.kind) {
        case ApiItemKind.Package:
          packagesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (packagesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Packages', level: 2 }));
      output.appendNode(packagesTable);
    }
  }

  /**
   * GENERATE PAGE: PACKAGE or NAMESPACE
   */
  private _writePackageOrNamespaceTables(output: DocSection, apiContainer: ApiPackage | ApiNamespace): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const classesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Class', 'Description' ]
    });

    const enumerationsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Enumeration', 'Description' ]
    });

    const functionsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Function', 'Description' ]
    });

    const interfacesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Interface', 'Description' ]
    });

    const namespacesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Namespace', 'Description' ]
    });

    const variablesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Variable', 'Description' ]
    });

    const typeAliasesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Type Alias', 'Description' ]
    });

    const apiMembers: ReadonlyArray<ApiItem> = apiContainer.kind === ApiItemKind.Package ?
      (apiContainer as ApiPackage).entryPoints[0].members
      : (apiContainer as ApiNamespace).members;

    for (const apiMember of apiMembers) {

      const row: DocTableRow = new DocTableRow({ configuration }, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember)
      ]);

      switch (apiMember.kind) {
        case ApiItemKind.Class:
          classesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Enum:
          enumerationsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Interface:
          interfacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Namespace:
          namespacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Function:
          functionsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.TypeAlias:
          typeAliasesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Variable:
          variablesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (classesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Classes' }));
      output.appendNode(classesTable);
    }

    if (enumerationsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Enumerations' }));
      output.appendNode(enumerationsTable);
    }
    if (functionsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Functions' }));
      output.appendNode(functionsTable);
    }

    if (interfacesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Interfaces' }));
      output.appendNode(interfacesTable);
    }

    if (namespacesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Namespaces' }));
      output.appendNode(namespacesTable);
    }

    if (variablesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Variables' }));
      output.appendNode(variablesTable);
    }

    if (typeAliasesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Type Aliases' }));
      output.appendNode(typeAliasesTable);
    }
  }

  /**
   * GENERATE PAGE: CLASS
   */
  private _writeClassTables(output: DocSection, apiClass: ApiClass): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const eventsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Property', 'Modifiers', 'Type', 'Description' ]
    });

    const constructorsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Constructor', 'Modifiers', 'Description' ]
    });

    const constructorsSection: DocSection = new DocSection({ configuration });

    const propertiesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Property', 'Modifiers', 'Type', 'Description' ]
    });

    const propertiesSection: DocSection = new DocSection({ configuration });

    const methodsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Method', 'Modifiers', 'Description' ]
    });

    const methodsSection: DocSection = new DocSection({ configuration });

    for (const apiMember of apiClass.members) {

      switch (apiMember.kind) {
        case ApiItemKind.Constructor: {
          constructorsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember)
            ])
          );

          this._writeApiItemContent(constructorsSection, apiMember);
          break;
        }
        case ApiItemKind.Method: {
          methodsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember)
            ])
          );

          this._writeApiItemContent(methodsSection, apiMember);
          break;
        }
        case ApiItemKind.Property: {

          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember)
              ])
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember)
              ])
            );
          }

          this._writeApiItemContent(propertiesSection, apiMember);
          break;
        }

      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Events'));
      output.appendNode(eventsTable);
    }

    if (constructorsTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Constructors'));
      output.appendNode(constructorsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Properties'));
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Methods'));
      output.appendNode(methodsTable);
    }

    this._appendSection(output, constructorsSection);
    this._appendSection(output, propertiesSection);
    this._appendSection(output, methodsSection);
  }

  /**
   * GENERATE PAGE: ENUM
   */
  private _writeEnumTables(output: DocSection, apiEnum: ApiEnum): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const enumMembersTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Member', 'Value', 'Description' ]
    });

    for (const apiEnumMember of apiEnum.members) {
      enumMembersTable.addRow(
        new DocTableRow({ configuration }, [

          new DocTableCell({ configuration }, [
            new DocParagraph({ configuration }, [
              new DocPlainText({ configuration, text: Utilities.getConciseSignature(apiEnumMember) })
            ])
          ]),

          new DocTableCell({ configuration }, [
            new DocParagraph({ configuration }, [
              new DocCodeSpan({ configuration, code: apiEnumMember.initializerExcerpt.text })
            ])
          ]),

          this._createDescriptionCell(apiEnumMember)
        ])
      );
    }

    if (enumMembersTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration: this._tsdocConfiguration, title: 'Enumeration Members' }));
      output.appendNode(enumMembersTable);
    }
  }

  /**
   * GENERATE PAGE: INTERFACE
   */
  private _writeInterfaceTables(output: DocSection, apiClass: ApiInterface): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const eventsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Property', 'Type', 'Description' ]
    });

    const propertiesTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Property', 'Type', 'Description' ]
    });

    const properitesSection: DocSection = new DocSection({ configuration });

    const methodsTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Method', 'Description' ]
    });

    const methodsSection: DocSection = new DocSection({ configuration });

    for (const apiMember of apiClass.members) {

      switch (apiMember.kind) {
        case ApiItemKind.ConstructSignature:
        case ApiItemKind.MethodSignature: {
          methodsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createDescriptionCell(apiMember)
            ])
          );

          this._writeApiItemContent(methodsSection, apiMember);
          break;
        }
        case ApiItemKind.PropertySignature: {

          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember)
              ])
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember)
              ])
            );
          }

          this._writeApiItemContent(properitesSection, apiMember);
          break;
        }

      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Events'));
      output.appendNode(eventsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Properties'));
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Methods'));
      output.appendNode(methodsTable);
    }

    this._appendSection(output, properitesSection);
    this._appendSection(output, methodsSection);
  }

  /**
   * GENERATE PAGE: FUNCTION-LIKE
   */
  private _writeParameterTables(output: DocSection, apiParameterListMixin: ApiParameterListMixin): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const parametersTable: DocTable = new DocTable({ configuration,
      headerTitles: [ 'Parameter', 'Type', 'Description' ]
    });

    for (const apiParameter of apiParameterListMixin.parameters) {
      const parameterDescription: DocSection = new DocSection({ configuration } );
      if (apiParameter.tsdocParamBlock) {
        this._appendSection(parameterDescription, apiParameter.tsdocParamBlock.content);
      }

      parametersTable.addRow(
        new DocTableRow({ configuration }, [
          new DocTableCell({configuration}, [
            new DocParagraph({ configuration }, [
              new DocPlainText({ configuration, text: apiParameter.name })
            ])
          ]),
          new DocTableCell({configuration}, [
            new DocParagraph({ configuration }, [
              new DocCodeSpan({ configuration, code: apiParameter.parameterTypeExcerpt.text })
            ])
          ]),
          new DocTableCell({configuration}, parameterDescription.nodes)
        ])
      );
    }

    if (parametersTable.rows.length > 0) {
      output.appendNode(this._writeBoldText(configuration, 'Parameters'));
      output.appendNode(parametersTable);
    }

    if (ApiReturnTypeMixin.isBaseClassOf(apiParameterListMixin)) {
      const returnTypeExcerpt: Excerpt = apiParameterListMixin.returnTypeExcerpt;
      output.appendNode(
        new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true}, [
            new DocPlainText({ configuration, text: 'Returns:' })
          ])
        ])
      );

      output.appendNode(
        new DocParagraph({ configuration }, [
          new DocCodeSpan({ configuration, code: returnTypeExcerpt.text.trim() || '(not declared)' })
        ])
      );

      if (apiParameterListMixin instanceof ApiDocumentedItem) {
        if (apiParameterListMixin.tsdocComment && apiParameterListMixin.tsdocComment.returnsBlock) {
          this._appendSection(output, apiParameterListMixin.tsdocComment.returnsBlock.content);
        }
      }
    }
  }

  private _createTitleCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    return new DocTableCell({ configuration }, [
      new DocParagraph({ configuration }, [
        new DocLinkTag({
          configuration,
          tagName: '@link',
          linkText: Utilities.getConciseSignature(apiItem),
          urlDestination: this._getUrlDestination(apiItem)
        })
      ])
    ]);
  }


  private _getUrlDestination(apiItem: ApiItem) {
    switch (apiItem.kind) {
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature: {
        const link = Utilities.getSafeFilenameForName(apiItem.displayName);
        return `#${link}-method`;
      }

      case ApiItemKind.Package: {
        const signature = PackageName.getUnscopedName(apiItem.displayName);
        const link = Utilities.getSafeFilenameForName(signature);
        return `./${link}`;
      }

      case ApiItemKind.Property: {
        const link = Utilities.getSafeFilenameForName(apiItem.displayName);
        return `#${link}-property`;
      }

      case ApiItemKind.Method:
      case ApiItemKind.TypeAlias:
      case ApiItemKind.Enum:
      case ApiItemKind.Variable:
      case ApiItemKind.Function:
      case ApiItemKind.Interface:
      case ApiItemKind.Namespace:
      case ApiItemKind.Class: {
        const link = Utilities.getSafeFilenameForName(apiItem.displayName);
        return `./${link}`;
      }
    
      default:
        return this._getLinkFilenameForApiItem(apiItem)
    }
  }

  /**
   * This generates a DocTableCell for an ApiItem including the summary section and "(BETA)" annotation.
   *
   * @remarks
   * We mostly assume that the input is an ApiDocumentedItem, but it's easier to perform this as a runtime
   * check than to have each caller perform a type cast.
   */
  private _createDescriptionCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
      if (apiItem.releaseTag === ReleaseTag.Beta) {
        section.appendNodesInParagraph([
          new DocEmphasisSpan({ configuration, bold: true, italic: true }, [
            new DocPlainText({ configuration, text: '(BETA)' })
          ]),
          new DocPlainText({ configuration, text: ' ' })
        ]);
      }
    }

    if (apiItem instanceof ApiDocumentedItem) {
      if (apiItem.tsdocComment !== undefined) {
        this._appendAndMergeSection(section, apiItem.tsdocComment.summarySection);
      }
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _createModifiersCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (ApiStaticMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isStatic) {
        section.appendNodeInParagraph(new DocCodeSpan({ configuration, code: 'static' }));
      }
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _createPropertyTypeCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (apiItem instanceof ApiPropertyItem) {
      section.appendNodeInParagraph(new DocCodeSpan({ configuration, code: apiItem.propertyTypeExcerpt.text }));
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _appendSection(output: DocSection, docSection: DocSection): void {
    for (const node of docSection.nodes) {
      output.appendNode(node);
    }
  }

  private _appendAndMergeSection(output: DocSection, docSection: DocSection): void {
    let firstNode: boolean = true;
    for (const node of docSection.nodes) {
      if (firstNode) {
        if (node.kind === DocNodeKind.Paragraph) {
          output.appendNodesInParagraph(node.getChildNodes());
          firstNode = false;
          continue;
        }
      }
      firstNode = false;

      output.appendNode(node);
    }
  }

  private _writeBoldText(configuration: TSDocConfiguration, text: string): DocParagraph {
      return new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ configuration, bold: true}, [
          new DocPlainText({ configuration, text })
        ])
      ])
  }

  private _getFilenameForApiItem(apiItem: ApiItem): string {
    if (apiItem.kind === ApiItemKind.Model) {
      return 'index.md';
    }

    if (apiItem.kind === ApiItemKind.Package) {
      const unscopedName = PackageName.getUnscopedName(apiItem.displayName);
      const baseName = Utilities.getSafeFilenameForName(unscopedName);

      return `${baseName}/index.md`;
    }

    let baseName: string = '';
    for (const hierarchyItem of apiItem.getHierarchy()) {
      // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
      let qualifiedName: string = Utilities.getSafeFilenameForName(hierarchyItem.displayName);
      if (ApiParameterListMixin.isBaseClassOf(hierarchyItem)) {
        if (hierarchyItem.overloadIndex > 1) {
          // Subtract one for compatibility with earlier releases of API Documenter.
          // (This will get revamped when we fix GitHub issue #1308)
          qualifiedName += `_${hierarchyItem.overloadIndex - 1}`;
        }
      }

      switch (hierarchyItem.kind) {
        case ApiItemKind.Model:
        case ApiItemKind.EntryPoint:
          break;
        case ApiItemKind.Package:
          baseName = Utilities.getSafeFilenameForName(PackageName.getUnscopedName(hierarchyItem.displayName));
          break;
        default:
          baseName += '/' + qualifiedName;
          break;
      }
    }
    return baseName + '.md';
  }

  private _getLinkFilenameForApiItem(apiItem: ApiItem): string {
    return './' + this._getFilenameForApiItem(apiItem);
  }

  private _deleteOldOutputFiles(outputFolder: string): void {
    console.log('Deleting old output from ' + outputFolder);
    FileSystem.ensureEmptyFolder(outputFolder);
  }

  private _formatImport(apiItem: ApiDeclaredItem): string | null {
    const pkg = apiItem.getAssociatedPackage();
    if (!pkg) {
      return null;
    }
    const toImport = apiItem.getScopedNameWithinPackage();
    if (toImport.indexOf('.') < 0) {
      return `import { ${Utilities.getImportName(toImport)} } from '${pkg.displayName}';`
    }
    const parts = toImport.split('.');
    return `import { ${Utilities.getImportName(parts[0])} } from '${pkg.displayName}';\nconst { ${Utilities.getImportName(parts[1])} } = ${Utilities.getImportName(parts[0])};`;
  }
}
