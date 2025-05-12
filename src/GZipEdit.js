import { ungzip } from "pako";
import GZipDoc from "./GZipDoc.js";
import gzMap from "./gz-map.json";
const vscode = require("vscode");
const sharedApi = require("./shared");

export default class GZipEdit {
  static register() {
    return vscode.window.registerCustomEditorProvider(GZipEdit.viewType, new GZipEdit());
  }

  static viewType = "gitZipViewer.GZipEdit";

  constructor() {}

  async openCustomDocument(uri, _context, _token) {
    return new GZipDoc(uri);
  }

  /**
   * The method called when opening a file with the custom editor
   * @async
   * @param {GZipDoc} document
   * @param {vscode.WebviewPanel} panel
   * @param {vscode.CancellationToken} _token
   */
  async resolveCustomEditor(document, panel, _token) {
    var config = vscode.workspace.getConfiguration().gitZipViewer;
    if (config.gzipEditorEnabled) {
      panel.webview.html = this.htmlList.followPopup;
      doesItExist(document.uri.toString().split("."), document);
    } else {
      panel.webview.html = this.htmlList.editorDisabled;
    }
  }

  htmlList = {
    editorDisabled:
      "<!DOCTYPE html><html><head></head><body><h1>The GZip editor has been disabled.</h1><p>You have disabled the GZip editor. Enable the setting `gitZipViewer.gzipEditorEnabled` to enable the editor.</p></body></html>",
    followPopup: "<!DOCTYPE html><html><head></head><body><h1>Please follow popup instructions.</h1></body></html>",
  };
}

/**
 *
 * @param {vscode.Uri} _uri
 * @param {GZipDoc} document
 */
async function showFile(uri, document) {
  try {
    // Read GZip file content
    const data = await vscode.workspace.fs.readFile(document.uri);
    // Decompress content
    const unzippedData = ungzip(data);
    
    // Get the file extension
    const fileName = document.uri.path.split('/').pop();
    const fileNameParts = fileName.split('.');
    let ext = '';
    
    // Find the mapped extension
    if (fileNameParts.length > 1) {
      const compressedExt = fileNameParts[fileNameParts.length - 1].toLowerCase();
      for (let i = 0; i < gzMap.mappings.length; i++) {
        if (gzMap.mappings[i].compressed === compressedExt) {
          ext = gzMap.mappings[i].inflated;
          break;
        }
      }
    }
    
    // Try to preview in the editor
    try {
      const tempFile = await vscode.workspace.openTextDocument({ content: Buffer.from(unzippedData).toString('utf8') });
      await vscode.window.showTextDocument(tempFile);
      
      // Provide save options
      vscode.window.showInformationMessage(
        `GZip file opened in editor. Would you like to save the uncompressed content?`,
        'Save As...'
      ).then(async (choice) => {
        if (choice === 'Save As...') {
          // Prepare file filters
          const filters = {};
          if (ext) {
            // If there is an extension, add the corresponding filter
            filters[`${ext.toUpperCase()} Files`] = [ext];
          }
          filters['All Files'] = ['*'];
          
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(
              vscode.workspace.workspaceFolders[0].uri,
              `${fileName.substring(0, fileName.lastIndexOf('.'))}${ext ? '.' + ext : ''}`
            ),
            filters: filters
          });
          
          if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, unzippedData);
            vscode.window.showInformationMessage(`File saved to ${saveUri.fsPath}`);
          }
        }
      });
    } catch (err) {
      // If previewing in the editor fails, directly provide save options
      vscode.window.showInformationMessage(
        `This appears to be a binary file. Would you like to save it?`,
        'Save As...'
      ).then(async (choice) => {
        if (choice === 'Save As...') {
          // Prepare file filters
          const filters = {};
          if (ext) {
            // If there is an extension, add the corresponding filter
            filters[`${ext.toUpperCase()} Files`] = [ext];
          }
          filters['Binary Files'] = ['bin'];
          filters['All Files'] = ['*'];
          
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(
              vscode.workspace.workspaceFolders[0].uri,
              `${fileName.substring(0, fileName.lastIndexOf('.'))}${ext ? '.' + ext : '.bin'}`
            ),
            filters: filters
          });
          
          if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, unzippedData);
            vscode.window.showInformationMessage(`File saved to ${saveUri.fsPath}`);
          }
        }
      });
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to open GZip file: ${err.message}`);
  }
}

/**
 * 处理GZip文件的打开
 * @param {String[]} _uri Expects `uri.toString().split(".")`
 * @param {GZipDoc} document The CustomDocument data that needs to be passed on
 */
async function doesItExist(_uri, document) {
  // Directly display the file content, no need to check if the file exists
  showFile(null, document);
}
