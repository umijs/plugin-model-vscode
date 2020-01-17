import * as vscode from 'vscode';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { TextDocumentUtils } from './util/document';
import { QuoteType } from './util/types';
import { sync } from 'glob';

export class ModelProvider implements vscode.DefinitionProvider {

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const filePath = document.uri.fsPath;
    document.positionAt(position.character);
    const documentUtil = new TextDocumentUtils(document);
    let range = documentUtil.getQuoteRange(position, QuoteType.single);
    if (!range) {
      range = documentUtil.getQuoteRange(position, QuoteType.double);
      if(!range) {
        range = documentUtil.getQuoteRange(position, QuoteType.backtick);
      }
      if(!range) {
        return;
      }
    }

    const line = document.lineAt(range.start.line).text;
    if(!line.includes('useModel')){
      return;
    }

    const cwd = vscode.workspace.workspaceFolders![0].uri.path;

    let ProviderPath: string = '';
    try{
      ProviderPath = sync(`!(node_modules)/**/.umi/plugin-model/Provider.tsx`, {
        cwd,
      })[0];
    } catch(e) {
      ProviderPath = '';
    }
    if(!ProviderPath){
      return;
    }
    // get absolute path;
    ProviderPath = join(cwd, ProviderPath);

    const ProviderFile = readFileSync(ProviderPath).toString();
    const namespace = document.getText(range);
    
    const modelsStart = ProviderFile.indexOf('models = {');
    const modelsEnd = ProviderFile.indexOf('};', modelsStart);

    const models = ProviderFile.slice(modelsStart + 9, modelsEnd + 1);
    const keyStart = models.indexOf(namespace);
    const keyEnd = ~models.indexOf(',', keyStart) ? models.indexOf(',', keyStart) : models.indexOf('}', keyStart);

    const importNameRaw = models.slice(keyStart, keyEnd);

    if(!importNameRaw){
      return;
    }
    const aliasIndex = importNameRaw.indexOf(':');
    const importName = importNameRaw.slice(aliasIndex + 1).trim();

    const keyStr = `import ${importName} from`;
    const importPathStart = ProviderFile.indexOf(keyStr) + keyStr.length;
    const importPathEnd = ProviderFile.indexOf(`'`, importPathStart);
    const uriRaw = ProviderFile.slice(importPathStart, importPathEnd).trim();
    const end = uriRaw.lastIndexOf('\"') === -1 ? uriRaw.lastIndexOf('\'') : uriRaw.lastIndexOf('\"');
    const uri = uriRaw.slice(1, end);

    let definitionFile = '';
    if(existsSync(`${uri}.ts`)){
      definitionFile = `${uri}.ts`;
    } else if(existsSync(`${uri}.tsx`)){
      definitionFile = `${uri}.tsx`;
    } else if(existsSync(`${uri}.js`)){
      definitionFile = `${uri}.js`;
    } else if(existsSync(`${uri}.jsx`)){
      definitionFile = `${uri}.jsx`;
    }

    if (existsSync(definitionFile)) {
      return new vscode.Location(vscode.Uri.file(definitionFile), new vscode.Position(0, 0));
    }
  }
}