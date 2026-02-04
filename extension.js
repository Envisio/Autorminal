

const vscode = require('vscode');
const os = require('os');

function expandHomeDir(path) {
  if (typeof path === 'string' && path.startsWith('~')) {
    return path.replace(/^~(?=$|\/)/, os.homedir());
  }
  return path;
}

async function activate(context) {
  const config = vscode.workspace.getConfiguration('Autorminal');
  const splits = config.get('splits') || {};
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  let activated = false;
  await Promise.all(Object.entries(splits).map(async ([dir, commands]) => {
    const absDir = expandHomeDir(dir);
    if (!Array.isArray(commands) || commands.length === 0) return;
    const match = workspaceFolders.some(folder => folder.uri.fsPath === absDir);
    if (!match) return;
    if (!activated) {
      vscode.window.showInformationMessage('Autorminal Activated');
      activated = true;
    }
    let term = vscode.window.terminals.find(t => t.creationOptions && t.creationOptions.cwd === absDir);
    if (!term) {
      term = vscode.window.createTerminal({ name: `Autorminal ${absDir} #1`, cwd: absDir });
    }
    term.show();
    let currentTerm = term;
    for (let idx = 0; idx < commands.length; idx++) {
      const cmd = commands[idx];
      if (idx === 0) {
        if (cmd && cmd.trim()) {
          currentTerm.sendText(`cd "${absDir}" && ${cmd}`);
        } else {
          currentTerm.sendText(`cd "${absDir}"`);
        }
      } else {
        await vscode.commands.executeCommand('workbench.action.terminal.split');
        const splitTerm = vscode.window.activeTerminal;
        if (splitTerm) {
          if (cmd && cmd.trim()) {
            splitTerm.sendText(`cd "${absDir}" && ${cmd}`);
          } else {
            splitTerm.sendText(`cd "${absDir}"`);
          }
          currentTerm = splitTerm;
        }
      }
    }
  }));
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};