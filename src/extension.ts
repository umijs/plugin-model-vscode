// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SUPPORT_LANGUAGE } from './constant';
import { get } from 'superagent';
import { ModelProvider } from './definitionProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const defJumper = vscode.languages.registerDefinitionProvider(SUPPORT_LANGUAGE, new ModelProvider());
  context.subscriptions.push(defJumper);
  
  const envCheck = async () => {
    get('https://private-alipayobjects.alipay.com/alipay-rmsdeploy-image/rmsportal/FlPJSPwhzfagtBoHKCbu.png')
    .timeout(20000)
    .end(err => {
    if (!err && !vscode.extensions.getExtension('umijs.bigfish-vscode')) {
			vscode.window.showInformationMessage('检测到处于阿里内网环境，推荐升级到 bigfish vsCode 插件，以实现更多功能', '忽略', '立即升级').then(res => {
				if(res === '立即升级') {
					vscode.env.openExternal(vscode.Uri.parse('vscode:extension/umijs.bigfish-vscode'))
				}
			})
    }
    });
  }
  envCheck();
}

// this method is called when your extension is deactivated
export function deactivate() {}
