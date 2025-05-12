/**
 * @author Indie Sewell
 * Zip utility functions for GitZip extension
 * @module zip-utils
 */

const vscode = require('vscode');
const JSZip = require('jszip');
const path = require('path');

/**
 * Safely get the parent directory of a path (fix Windows path issues)
 * @param {string} filePath - The path of the file or directory
 * @returns {string} - The parent directory path
 */
function safePathDirname(filePath) {
  if (!filePath) {
    return '';
  }
  
  // Replace all backslashes with forward slashes to unify the path format
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Find the position of the last slash
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  
  // If a slash is found and not at the beginning, return the part before the slash
  if (lastSlashIndex > 0) {
    // Return the part before the last slash
    return normalizedPath.substring(0, lastSlashIndex);
  }
  
  // If no slash is found or the slash is at the beginning, use path.dirname as an alternative
  // But this should rarely happen because we have handled most cases
  return path.dirname(filePath);
}

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

/**
 * Creates a zip file from a folder with specified options
 * @param {vscode.Uri} folderUri - Folder to zip
 * @param {Object} [options] - Compression options
 * @param {string} [options.mode='With'] - Compression mode (only/With/custom)
 * @param {string} [options.customName] - Custom folder name (for custom mode)
 * @param {string} [options.outputMode='parent'] - Output location (current/parent/custom)
 * @param {string} [options.customPath] - Custom output path (for custom output mode)
 * @returns {Promise<vscode.Uri>} Path to created zip file
 */
async function createZip(folderUri, options = {}) {
  const { mode = 'With', customName, outputMode = 'parent', customPath } = options;
  
  try {
    const folderPath = folderUri.fsPath;
    const folderAbsPath = path.normalize(folderPath);
    const relativePath = folderPath;

    // Define and process folderName
    const folderName = path.basename(folderAbsPath);
    const normalizedPath = folderAbsPath.replace(/\\/g, '/');
    
    // Check if key variables are defined
    if (!folderName || !normalizedPath) {
      throw new Error('Critical variables are not properly initialized');
    }
    
    // Get the last level folder name
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    const safeFolderName = lastSlashIndex >= 0
      ? normalizedPath.substring(lastSlashIndex + 1)
      : normalizedPath;
      
    const baseName = `${safeFolderName}.zip`;
    
    
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Compressing ${folderName}...`,
      cancellable: true
    }, async (progress) => {
      progress.report({ message: `Preparing to create zip: ${baseName}` });
    });
    
    // Process paths based on compression mode
    function processPath(originalPath) {
      let relativePath = path.relative(folderAbsPath, originalPath);
      
      // Remove any parent directory references (../) and drive letters (e:/)
      relativePath = relativePath.replace(/\.\.(\/|\\)/g, '');
      relativePath = relativePath.replace(/^[a-zA-Z]:(\/|\\)/g, '');
      
      // Normalize path separators to forward slashes for zip
      let normalizedPath = relativePath.split(path.sep).join(path.posix.sep);
      
      switch (mode) {
        case 'only': { // Only Content (without folder)
          let relativePath = originalPath.substring(folderAbsPath.length);
          relativePath = relativePath.replace(/^[\\/]+/, '');
          return relativePath;
        }
        case 'custom': { // Custom Folder Name (rename)
          // Get the name of the currently selected folder (fix Windows path issues)
          const normalizedFolderPath = folderAbsPath.replace(/\\/g, '/');
          const folderName = normalizedFolderPath.split('/').pop();

          // Get the path of the file relative to the selected folder
          let relativePath = originalPath.substring(folderAbsPath.length);
          relativePath = relativePath.replace(/^[\\/]+/, '');

          // Combine into "customName/relativePath" format
          const result = (customName || folderName) + (relativePath ? path.sep + relativePath : '');

          return result;
        }
        default: { // With Folder (preserve structure)
          // Get the name of the currently selected folder (fix Windows path issues)
          const normalizedFolderPath = folderAbsPath.replace(/\\/g, '/');
          const folderName = normalizedFolderPath.split('/').pop();
          
          // Get the path of the file relative to the selected folder
          let relativePath = originalPath.substring(folderAbsPath.length);
          relativePath = relativePath.replace(/^[\\/]+/, '');
          
          // Combine into "folderName/relativePath" format
          const result = folderName + (relativePath ? path.sep + relativePath : '');
          
          return result;
        }
      }
    }


    // Show progress
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: `Compressing ${folderName}...`,
      cancellable: true
    };
    
    return await vscode.window.withProgress(progressOptions, async (progress) => {
      progress.report({ message: 'Preparing files...' });
      
      // Get output path based on mode
      let outputPath;
      // Get the parent directory (fix Windows path issues)
      const normalizedFolderPath = folderAbsPath.replace(/\\/g, '/');
      const lastSlashIndex = normalizedFolderPath.lastIndexOf('/');
      const parentDir = lastSlashIndex > 0
        ? normalizedFolderPath.substring(0, lastSlashIndex)
        : safePathDirname(folderAbsPath);

      switch(outputMode) {
        case 'custom':
          if (!customPath) {
            const input = await vscode.window.showInputBox({
              prompt: 'Enter output zip file path',
              value: folderName
            });
            if (!input) throw new Error('No output path specified');
            outputPath = vscode.Uri.file(
              path.normalize(input.endsWith('.zip') ? input : `${input}.zip`)
            );
          } else {
            outputPath = vscode.Uri.file(
              path.normalize(customPath.endsWith('.zip') ? customPath : `${customPath}.zip`)
            );
          }
          break;
          
        case 'current':
          // For current directory mode, use the folder path directly
          outputPath = vscode.Uri.file(
            path.join(folderAbsPath, baseName)
          );

          // More robust path validation
          const fsPath = outputPath.fsPath;
          if (!fsPath || fsPath.trim() === '') {
            throw new Error('Output path cannot be empty');
          }
          
          // Handle Windows path format
          const normalizedPath = fsPath.replace(/\\/g, '/');
          if (!normalizedPath.match(/^[a-zA-Z]:\/.+/)) {
            throw new Error(`Invalid path format: ${fsPath}`);
          }
          
          break;
          
        default: // parent mode
          // Ensure output path is based on selected folder's parent directory
          outputPath = vscode.Uri.file(
            path.join(safePathDirname(folderAbsPath), baseName)
          );
      }

      // Verify output path is valid
      if (!outputPath.fsPath) {
        throw new Error('Invalid output path');
      }
      
      // Ensure parent directory exists
      const outputDir = safePathDirname(outputPath.fsPath);
      if (outputDir && outputDir !== '.') {
        try {
          await vscode.workspace.fs.createDirectory(vscode.Uri.file(outputDir)).catch(e => {
            console.error("mkdir error", e)
          });
        } catch (err) {
          if (err.code !== 'EEXIST') {
            console.error("mkdir error", err)
            throw new Error(`Failed to create output directory: ${err.message}`);
          }
        }
      }

      progress.report({ message: 'Creating zip file...', increment: 30 });

      // Create zip
      const zip = new JSZip();
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folderAbsPath, '**/*')
      );

      let processed = 0;
      
      for (const file of files) {
        if (progress.token && progress.token.isCancellationRequested) {
          throw new Error('Compression cancelled');
        }
        
        let zipPath = processPath(file.fsPath);
        const content = await vscode.workspace.fs.readFile(file);
        
        if (mode === 'flat') {
          zipPath = path.basename(zipPath);
        }
        
        zip.file(zipPath, content);
        
        processed++;
        progress.report({
          message: `Adding files (${processed}/${files.length})`,
          increment: 70/files.length
        });
      }

      progress.report({ message: 'Finalizing...', increment: 10 });
      let zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      vscode.window.showInformationMessage(`Zip content length: ${zipContent.length}`);
      await vscode.workspace.fs.writeFile(outputPath, zipContent);
      
      return outputPath;
    });
  } catch (err) {
    throw new Error(`Failed to create zip: ${err.message}`);
  }
}

/**
 * Create a zip file from a list of files
 * @param {vscode.Uri[]} filesToZip - Array of file URIs to zip
 * @param {Object} options - Options for zip creation
 * @returns {Promise<vscode.Uri>} - URI of the created zip file
 */
async function createZipFromFiles(filesToZip, options = {}) {
  try {
    if (!filesToZip || filesToZip.length === 0) {
      throw new Error('No files to zip');
    }

    // Get the first file's name as default zip name
    const firstFile = filesToZip[0];
    const firstFileName = path.basename(firstFile.fsPath, path.extname(firstFile.fsPath));
    
    // Show progress
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: `Compressing ${filesToZip.length} file(s)...`,
      cancellable: true
    };
    
    return await vscode.window.withProgress(progressOptions, async (progress) => {
      progress.report({ message: 'Preparing files...' });
      
      // Get output path
      let outputPath;
      
      // Ask user for output path
      const input = await vscode.window.showInputBox({
        prompt: 'Enter output zip file path',
        value: firstFileName + '.zip'
      });
      
      if (!input) throw new Error('No output path specified');
      
      // Determine if input is absolute or relative path
      let normalizedInput = input;
      
      // Always ensure the input has .zip extension
      if (!normalizedInput.toLowerCase().endsWith('.zip')) {
        normalizedInput += '.zip';
      }
      
      //console.log(`Normalized input: ${normalizedInput}`);
      
      if (path.isAbsolute(normalizedInput) || normalizedInput.includes('/') || normalizedInput.includes('\\')) {
        // Input is a path, use it directly
        outputPath = vscode.Uri.file(
          path.normalize(normalizedInput)
        );
      } else {
        // Input is just a filename, save in the same directory as the first file
        const firstFileDir = safePathDirname(firstFile.fsPath);
        outputPath = vscode.Uri.file(
          path.join(firstFileDir, normalizedInput)
        );
      }
      
      // Log the output path for debugging
      //console.log(`Output path: ${outputPath.fsPath}`);
      
      // Verify output path is valid
      if (!outputPath.fsPath) {
        throw new Error('Invalid output path');
      }
      
      // Ensure parent directory exists
      const outputDir = safePathDirname(outputPath.fsPath);
      if (outputDir && outputDir !== '.') {
        try {
          await vscode.workspace.fs.createDirectory(vscode.Uri.file(outputDir));
        } catch (err) {
          if (err.code !== 'EEXIST') {
            throw new Error(`Failed to create output directory: ${err.message}`);
          }
        }
      }
      
      progress.report({ message: 'Creating zip file...', increment: 30 });
      
      // Create zip
      const zip = new JSZip();
      let processed = 0;
      
      // Create a common folder for all files if there are multiple files
      const useCommonFolder = filesToZip.length > 1;
      const commonFolderName = path.basename(outputPath.fsPath, '.zip');
      
      //console.log(`Number of files to zip: ${filesToZip.length}`);
      //console.log(`Using common folder: ${useCommonFolder ? 'Yes' : 'No'}`);
      //console.log(`Common folder name: ${commonFolderName}`);
      
      for (const file of filesToZip) {
        if (progress.token && progress.token.isCancellationRequested) {
          throw new Error('Compression cancelled');
        }
        
        // Get file name
        const fileName = path.basename(file.fsPath);
        
        try {
          const content = await vscode.workspace.fs.readFile(file);
          
          // Add file to zip with appropriate path
          if (useCommonFolder) {
            // If using common folder, add files inside that folder
            //console.log(`Adding file to common folder: ${commonFolderName}/${fileName}`);
            zip.file(`${commonFolderName}/${fileName}`, content);
          } else {
            // If single file, add directly to root
            //console.log(`Adding file to root: ${fileName}`);
            zip.file(fileName, content);
          }
          
          processed++;
          progress.report({
            message: `Adding files (${processed}/${filesToZip.length})`,
            increment: 60/filesToZip.length
          });
        } catch (err) {
          console.error(`Error reading file ${fileName}: ${err.message}`);
          vscode.window.showWarningMessage(`Skipped file ${fileName}: ${err.message}`);
        }
      }
      
      progress.report({ message: 'Finalizing...', increment: 10 });
      let zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      await vscode.workspace.fs.writeFile(outputPath, zipContent);
      
      vscode.window.showInformationMessage(`Successfully created ${path.basename(outputPath.fsPath)}`);
      return outputPath;
    });
  } catch (err) {
    throw new Error(`Failed to create zip: ${err.message}`);
  }
}

module.exports = {
  createZip,
  createZipFromFiles,
  safePathDirname
};