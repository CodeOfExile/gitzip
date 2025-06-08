/**
 * @author Indie Sewell
 * @copyright 2025 exilecode.com
 * @file Command handlers for GitZip extension
 */

const vscode = require('vscode');
const path = require('path');
const { gzip } = require('pako');
const gzMap = require('./gz-map.json');
const zipUtils = require('./zip-utils');
const sharedApi = require('./shared');

// Global variable for collecting multi-selected files
let selectedFiles = [];
let fileCollectionTimeout = null;
let gzipSelectedFiles = [];
let gzipFileCollectionTimeout = null;
const COLLECTION_TIMEOUT = 300; // Milliseconds

/**
 * Format bytes in human readable form (e.g. 1024 → "1 KB")
 * @param {number} bytes
 * @returns {string}
 */
function prettyBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

class cmds {
  static register() {
    // Register extract command
    vscode.commands.registerCommand('gitZipViewer.extract',  cmds.extractCommand);

    // Register zip command
    vscode.commands.registerCommand('gitZipViewer.zip',  cmds.zipCommand);

    // Register editor command
    vscode.commands.registerCommand('gitZipViewer.openFileWithEditor',  cmds.editorCommand);

    vscode.commands.registerCommand('gitZipViewer.onlyContentZip',  cmds.zipCommand);
    vscode.commands.registerCommand('gitZipViewer.withFolderZip',  cmds.zipCommand);
    vscode.commands.registerCommand('gitZipViewer.customFolderNameZip',  cmds.zipCommand);

    // Register gzip command
    vscode.commands.registerCommand('gitZipViewer.gzip',  cmds.gzipCommand);

    // Register zip file command
    vscode.commands.registerCommand('gitZipViewer.zipFile',  cmds.zipFileCommand);
    
    // Register zip files command (alias for zipFile)
    vscode.commands.registerCommand('gitZipViewer.zipFiles',  cmds.zipFileCommand);
  }

  static async extractCommand() {
    const config = vscode.workspace.getConfiguration().gitZipViewer;
    const files = await vscode.window.showOpenDialog({
      title: 'Zip File',
      openLabel: 'Extract',
      canSelectFiles: true,
      canSelectFolders: false
    });
    if (!files) return;

    const targetPath = await vscode.window.showOpenDialog({
      title: 'Target Folder',
      canSelectFiles: false,
      canSelectFolders: true
    });
    if (!targetPath) return;

    try {
      const zip = new JSZip();
      const content = await vscode.workspace.fs.readFile(files[0]);
      const zipData = await zip.loadAsync(content);

      for (const [name, file] of Object.entries(zipData.files)) {
        if (!file.dir) {
          const fileContent = await file.async('uint8array');
          const destPath = vscode.Uri.joinPath(
            targetPath[0],
            files[0].path.split('/').pop() + config.unzippedSuffix,
            name
          );
          await vscode.workspace.fs.writeFile(destPath, fileContent);
        }
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to extract: ${err.message}`);
    }
  }

  static async zipCommand(folderToZip) {
    try {
      if (!folderToZip) {
        const selected = await vscode.window.showOpenDialog({
          title: 'Folder to zip',
          canSelectFiles: false,
          canSelectFolders: true
        });
        if (!selected) return;
        folderToZip = selected[0];
      }

      // Select compression mode
      const mode = await vscode.window.showQuickPick(
        ['Only Content (without folder)', 'With Folder (preserve structure)', 'Custom Folder Name (rename)'],
        { placeHolder: 'Select compression mode' }
      );
      if (!mode) return;

      // Get custom name if needed
      let customName;
      if (mode.startsWith('Custom')) {
        customName = await vscode.window.showInputBox({
          prompt: 'Enter custom folder name',
          value: folderToZip.fsPath.replace(/\\/g, '/').split('/').pop()
        });
        if (!customName) return;
      }

      // Select output location
      const outputMode = await vscode.window.showQuickPick(
        ['Current Directory', 'Parent Directory', 'Custom Path'],
        { placeHolder: 'Select output location' }
      );
      if (!outputMode) return;
      
      // Check if .git directory or .gitignore file exists
      const { hasGit, hasGitignore } = await zipUtils.checkGitFiles(folderToZip.fsPath);
      
      // If Git-related files exist, ask user whether to exclude them
      let gitExclusionMode = 'include_all'; // Default: include everything if no choice is made
      if (hasGit || hasGitignore) {
        const gitExcludeChoice = await vscode.window.showQuickPick(
          [
            {
              id: 'exclude_git',
              label: 'Exclude .git & .gitignore',
              description: 'Removes both. Still excludes files in .gitignore.',
              detail: 'Use for clean public releases.'
            },
            {
              id: 'respect_gitignore',
              label: 'Keep .git & .gitignore',
              description: 'Keeps both. Still excludes files in .gitignore.',
              detail: 'Use for clean repository backups.'
            },
            {
              id: 'include_all',
              label: 'Include All (Ignore Rules)',
              description: 'Keeps everything. Ignores rules in .gitignore.',
              detail: 'Use for a complete project snapshot.'
            }
          ],
          {
            placeHolder: 'Git files detected. How should they be handled?',
            title: 'GitZip: Git Handling Mode'
          }
        );
        
        if (!gitExcludeChoice) return;
        gitExclusionMode = gitExcludeChoice.id;
      }

      let customPath;
      if (outputMode === 'Custom Path') {
        customPath = await vscode.window.showInputBox({
          prompt: 'Enter output path',
          value: path.basename(folderToZip.fsPath) + '.zip'
        });
        if (!customPath) return;
      }

      // Create zip with selected options
      const outputPath = await zipUtils.createZipFromFolder(folderToZip, {
        mode: mode.toLowerCase().split(' ')[0],
        customName,
        outputMode: outputMode.toLowerCase().split(' ')[0],
        customPath,
        gitExclusionMode
      });
      
      // Show success message
      const size = (await vscode.workspace.fs.stat(outputPath)).size;
      vscode.window.showInformationMessage(
        `Successfully created ${path.basename(outputPath.fsPath)} (${prettyBytes(size)})`,
        'Open Folder'
      ).then(selection => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('revealFileInOS', outputPath);
        }
      });
    } catch (err) {
      vscode.window.showErrorMessage(`GitZip: ${err.message}`);
    }
  }

  static async editorCommand() {
    const file = await vscode.window.showOpenDialog({
      title: 'Zip file to open',
      canSelectFiles: true,
      canSelectFolders: false
    });
    if (!file) return;

    const editorChoice = await vscode.window.showQuickPick(['Zip', 'GZip'], {
      title: 'Compression Type'
    });
    if (editorChoice) {
      vscode.commands.executeCommand(
        'vscode.openWith',
        file[0],
        `gitZipViewer.${editorChoice}Edit`
      );
    }
  }

  /**
   * Command handler for gitZipViewer.gzip
   * @param {vscode.Uri} fileToZip - The file to gzip (can be undefined if called from command palette)
   * @returns {Promise<void>}
   */
  static async gzipCommand(fileToZip) {
    try {
      let filesToGzip = [];
      
      // If called from the command palette
      if (!fileToZip) {
        // Show file selection dialog
        const selected = await vscode.window.showOpenDialog({
          title: 'Select file(s) to gzip',
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: true
        });
        
        if (!selected || selected.length === 0) return;
        filesToGzip = selected;
      } else {
        // If called from the Explorer context menu
        // Get all files in the current workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          // If no workspace is open, directly compress the current file
          filesToGzip = [fileToZip];
        } else {
          // Get the folder where the current file is located, using the safe path processing function
          const fileDir = zipUtils.safePathDirname(fileToZip.fsPath);
          vscode.window.showInformationMessage(`Reading directory for GZip: ${fileDir}`);
          
          // Use the fs API to directly read the folder content
          const dirUri = vscode.Uri.file(fileDir);
          const dirEntries = await vscode.workspace.fs.readDirectory(dirUri);
          
          // Contains files and folders
          const files = dirEntries.map(([name, type]) => {
            const uri = vscode.Uri.joinPath(dirUri, name);
            return {
              uri,
              isDirectory: type === vscode.FileType.Directory
            };
          });
          
          vscode.window.showInformationMessage(`Found ${files.length} items in directory for GZip`);
          
          // Create QuickPick items
          const items = files.map(({ uri, isDirectory }) => ({
            label: `${isDirectory ? '📁 ' : '📄 '}${path.basename(uri.fsPath)}`,
            description: uri.fsPath,
            picked: uri.fsPath === fileToZip.fsPath, // Select the current file by default
            file: uri,
            isDirectory
          }));
          
          // Show QuickPick
          const selectedItems = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to gzip'
          });
          
          if (!selectedItems || selectedItems.length === 0) return;
          
          // Get the selected files
          filesToGzip = selectedItems.map(item => item.file);
        }
      }
      
      // Show the number of selected files
      vscode.window.showInformationMessage(`Compressing ${filesToGzip.length} file(s) with GZip`);
      
      // Compress files
      gzipFile(filesToGzip);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to gzip: ${err.message}`);
    }
  }

  // Keep this method for compatibility with possible calls
  static async processGzip(fileUri) {
    gzipFile(Array.isArray(fileUri) ? fileUri : [fileUri]);
  }

  /**
   * Command handler for gitZipViewer.zipFile
   * @param {vscode.Uri} fileToZip - The file to zip (can be undefined if called from command palette)
   * @returns {Promise<void>}
   */
  static async zipFileCommand(fileToZip) {
    try {
      let filesToZip = [];
      
      // If called from the command palette
      if (!fileToZip) {
        // Show file selection dialog
        const selected = await vscode.window.showOpenDialog({
          title: 'Select file(s) to zip',
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: true
        });
        
        if (!selected || selected.length === 0) return;
        filesToZip = selected;
      } else {
        // If called from the Explorer context menu
        // Get all files in the current workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          // If no workspace is open, directly compress the current file
          filesToZip = [fileToZip];
        } else {
          // Get the folder where the current file is located, using the safe path processing function
          const fileDir = zipUtils.safePathDirname(fileToZip.fsPath);
          vscode.window.showInformationMessage(`Reading directory: ${fileDir}`);
          
          // Use the fs API to directly read the folder content
          const dirUri = vscode.Uri.file(fileDir);
          const dirEntries = await vscode.workspace.fs.readDirectory(dirUri);
          
          // Contains files and folders
          const files = dirEntries.map(([name, type]) => {
            const uri = vscode.Uri.joinPath(dirUri, name);
            return {
              uri,
              isDirectory: type === vscode.FileType.Directory
            };
          });
          
          vscode.window.showInformationMessage(`Found ${files.length} items in directory`);
          
          // Create QuickPick items
          const items = files.map(({ uri, isDirectory }) => ({
            label: `${isDirectory ? '📁 ' : '📄 '}${path.basename(uri.fsPath)}`,
            description: uri.fsPath,
            picked: uri.fsPath === fileToZip.fsPath, // Select the current file by default
            file: uri,
            isDirectory
          }));
          
          // Show QuickPick
          const selectedItems = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to zip'
          });
          
          if (!selectedItems || selectedItems.length === 0) return;
          
          // Get the selected files
          filesToZip = selectedItems.map(item => item.file);
        }
      }
      
      // Show the number of selected files
      vscode.window.showInformationMessage(`Compressing ${filesToZip.length} file(s)`);
      
      // Compress files
      await zipUtils.createZipFromFiles(filesToZip);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to create zip: ${err.message}`);
    }
  }

}

/**
 * Compresses files with GZip
 * @param {vscode.Uri[]} filesToZip The files to compress
 * @returns {Promise<void>}
 */
async function gzipFile(filesToZip) {
  try {
    const config = vscode.workspace.getConfiguration().gitZipViewer;

    // Show the number of selected files
    vscode.window.showInformationMessage(`GZipping ${filesToZip.length} file(s)`);
    
    // Process each file
    for (const fileUri of filesToZip) {
      const fileName = path.basename(fileUri.fsPath);
      const fileNameParts = fileName.split(".");
      
      // Determine extension
      let ext;
      if (!config.useLegacyGzipNamingConvention) {
        ext = fileNameParts[fileNameParts.length - 1];
      } else {
        ext = fileNameParts.pop();
      }
      
      // Find mapped extension
      let newExt = "gz";
      for (let i = 0; i < gzMap.mappings.length; i++) {
        if (gzMap.mappings[i].inflated === ext) {
          newExt = gzMap.mappings[i].compressed;
          break;
        }
      }
      
      // Create default output filename - preserve original filename
      const defaultOutputName = `${fileName}.${newExt}`;
      
      // Show progress
      const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: `Compressing ${fileName}...`,
        cancellable: true
      };
      
      await vscode.window.withProgress(progressOptions, async (progress) => {
        progress.report({ message: 'Preparing file...' });
        
        // Ask user for output path
        const input = await vscode.window.showInputBox({
          prompt: 'Enter output gzip file path',
          value: defaultOutputName
        });
        
        if (!input) throw new Error('No output path specified');
        
        // Determine output path
        let outputPath;
        // Normalize input to ensure it has the correct extension
        let normalizedInput = input;
        
        // Always ensure the input has the correct extension
        if (!normalizedInput.toLowerCase().endsWith(`.${newExt}`)) {
          normalizedInput += `.${newExt}`;
        }
        
        vscode.window.showInformationMessage(`GZip normalized input: ${normalizedInput}`);
        
        if (path.isAbsolute(normalizedInput) || normalizedInput.includes('/') || normalizedInput.includes('\\')) {
          // Input is a path, use it directly
          outputPath = vscode.Uri.file(
            path.normalize(normalizedInput)
          );
        } else {
          // Input is just a filename, save in the same directory as the original file
          const fileDir = zipUtils.safePathDirname(fileUri.fsPath);
          outputPath = vscode.Uri.file(
            path.join(fileDir, normalizedInput)
          );
        }
        
        // Log the output path
        vscode.window.showInformationMessage(`GZip output path: ${outputPath.fsPath}`);
        
        progress.report({ message: 'Reading file...', increment: 30 });
        
        // Read file
        const data = await vscode.workspace.fs.readFile(fileUri);
        
        progress.report({ message: 'Compressing...', increment: 30 });
        
        // Compress file
        const compressedData = gzip(data);
        
        progress.report({ message: 'Saving file...', increment: 30 });
        
        // Write compressed file
        await vscode.workspace.fs.writeFile(outputPath, compressedData);
        
        // Delete original file if configured
        if (config.deleteOldFileWhenGzipping) {
          await vscode.workspace.fs.delete(fileUri);
        }
        
        vscode.window.showInformationMessage(`Successfully created ${path.basename(outputPath.fsPath)}`);
      });
    }
  } catch (err) {
    if (err.message !== 'No output path specified') {
      vscode.window.showErrorMessage(`Failed to gzip: ${err.message}`);
    }
  }
}

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Recursively checks if a file exists and appends underscore if it does
 * @param {string[]} _uri - URI parts
 * @returns {Promise<string[]>} - Modified URI parts
 */
async function ifExists(_uri) {
  return sharedApi.fs.fileExists(vscode.Uri.parse(_uri.join("/"))).then(async function (exists) {
    if (exists) {
      _uri[_uri.length - 1] += "_";
      return await ifExists(_uri);
    }
    return _uri;
  });
}

module.exports = cmds;
