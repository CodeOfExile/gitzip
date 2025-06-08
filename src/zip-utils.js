/**
 * @author Indie Sewell
 * Zip utility functions for GitZip extension
 * @module zip-utils
 */

const vscode = require('vscode');
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs');
const ignore = require('ignore');

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
 * Check if a directory contains .git directory or .gitignore file
 * @param {string} folderPath - Path to the directory to check
 * @returns {Promise<{hasGit: boolean, hasGitignore: boolean, gitignorePath: string}>} Check results
 */
async function checkGitFiles(folderPath) {
  try {
    const gitDirPath = path.join(folderPath, '.git');
    const gitignorePath = path.join(folderPath, '.gitignore');
    
    const hasGit = await fileExists(gitDirPath);
    const hasGitignore = await fileExists(gitignorePath);
    
    return { hasGit, hasGitignore, gitignorePath };
  } catch (err) {
    console.error('Error checking Git files:', err);
    return { hasGit: false, hasGitignore: false, gitignorePath: '' };
  }
}

/**
 * Check if a file or directory exists
 * @param {string} filePath - Path to file or directory
 * @returns {Promise<boolean>} Whether the file exists
 */
async function fileExists(filePath) {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Parse .gitignore file and create exclusion rules with enhanced compatibility
 * @param {string} gitignorePath - Path to .gitignore file
 * @returns {Promise<import('ignore').Ignore>} ignore instance
 */
async function parseGitignore(gitignorePath) {
  try {
    const gitignoreContent = await vscode.workspace.fs.readFile(vscode.Uri.file(gitignorePath));
    const gitignoreText = Buffer.from(gitignoreContent).toString('utf8');
    
    // Create ignore instance with default options
    const ig = ignore();
    
    // Add the original rules first
    ig.add(gitignoreText);
    
    // Process the gitignore content to enhance compatibility
    const lines = gitignoreText.split('\n');
    const additionalRules = [];
    
    for (const line of lines) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Extract rule part if line contains a comment
      let rulePart = trimmedLine;
      const commentIndex = trimmedLine.indexOf('#');
      if (commentIndex !== -1) {
        rulePart = trimmedLine.substring(0, commentIndex).trim();
        if (!rulePart) {
          continue;
        }
      }
      
      // Handle various formats for better compatibility
      
      // Case 1: rule with trailing slash (e.g., "node_modules/")
      if (rulePart.endsWith('/') && !rulePart.startsWith('/')) {
        additionalRules.push(rulePart.slice(0, -1)); // Add without trailing slash
      }
      
      // Case 2: rule without trailing slash (e.g., "node_modules")
      if (!rulePart.endsWith('/') && !rulePart.startsWith('/')) {
        additionalRules.push(rulePart + '/'); // Add with trailing slash
      }
      
      // Case 3: rule with leading slash (e.g., "/node_modules")
      if (rulePart.startsWith('/') && !rulePart.endsWith('/')) {
        // Remove leading slash and add both with and without trailing slash
        const withoutLeadingSlash = rulePart.substring(1);
        additionalRules.push(withoutLeadingSlash);
        additionalRules.push(withoutLeadingSlash + '/');
      }
      
      // Case 4: rule with both leading and trailing slash (e.g., "/node_modules/")
      if (rulePart.startsWith('/') && rulePart.endsWith('/')) {
        // Remove both slashes
        const withoutSlashes = rulePart.substring(1, rulePart.length - 1);
        additionalRules.push(withoutSlashes);
        // Remove only leading slash
        additionalRules.push(rulePart.substring(1));
        // Remove only trailing slash
        additionalRules.push(rulePart.substring(0, rulePart.length - 1));
      }
    }
    
    // Add additional rules for better compatibility
    if (additionalRules.length > 0) {
      ig.add(additionalRules);
    }
    
    // Log the rules for debugging
    console.log('Original .gitignore rules:', gitignoreText);
    console.log('Additional compatibility rules:', additionalRules);
    
    return ig;
  } catch (err) {
    console.error('Error parsing .gitignore:', err);
    return ignore(); // Return empty ignore instance
  }
}

/**
 * Recursively get all files and directories in a directory, including hidden files and empty directories
 * @param {string} dir - Directory to scan
 * @param {Array<string>} [files=[]] - Accumulated files
 * @param {string} [baseDir=''] - Base directory for relative paths
 * @returns {Promise<Array<{path: string, relativePath: string, isDirectory: boolean}>>} List of file paths
 */
async function getAllFiles(dir, files = [], baseDir = '') {
  const baseDirToUse = baseDir || dir;
  
  try {
    // Use vscode.workspace.fs to read directory
    const dirUri = vscode.Uri.file(dir);
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    
    // Add the directory itself (except for the root directory)
    if (dir !== baseDirToUse) {
      const relativePath = path.relative(baseDirToUse, dir).replace(/\\/g, '/');
      files.push({
        path: dir,
        relativePath,
        isDirectory: true
      });
    }
    
    for (const [name, type] of entries) {
      const fullPath = path.join(dir, name);
      const fullPathUri = vscode.Uri.file(fullPath);
      
      if (type === vscode.FileType.Directory) {
        // Recursively process subdirectories
        await getAllFiles(fullPath, files, baseDirToUse);
      } else {
        // Add file with its relative path
        const relativePath = path.relative(baseDirToUse, fullPath).replace(/\\/g, '/');
        files.push({
          path: fullPath,
          relativePath,
          isDirectory: false
        });
      }
    }
    
    return files;
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    return files;
  }
}

/**
 * Creates a zip file from a folder with specified options
 * @param {vscode.Uri} folderUri - Folder to zip
 * @param {Object} [options] - Compression options
 * @param {string} [options.mode='With'] - Compression mode (only/With/custom)
 * @param {string} [options.customName] - Custom folder name (for custom mode)
 * @param {string} [options.outputMode='parent'] - Output location (current/parent/custom)
 * @param {string} [options.customPath] - Custom output path (for custom output mode)
 * @param {string} [options.gitExclusionMode='include_all'] - Git handling mode (exclude_git/respect_gitignore/include_all)
 * @returns {Promise<vscode.Uri>} Path to created zip file
 */
async function createZipFromFolder(folderUri, options = {}) {
  const {
    mode = 'With',
    customName,
    outputMode = 'parent',
    customPath,
    gitExclusionMode = 'include_all'
  } = options;
  
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
      // Check if originalPath is an absolute path
      if (path.isAbsolute(originalPath)) {
        let relativePath = path.relative(folderAbsPath, originalPath);
        
        // If the path starts with ".." or contains a drive letter, it's outside the folder
        if (relativePath.startsWith('..') || /^[a-zA-Z]:/.test(relativePath)) {
          // For paths outside the folder, use the basename
          return path.basename(originalPath);
        }
        
        // Normalize path separators to forward slashes for zip
        relativePath = relativePath.split(path.sep).join(path.posix.sep);
        return relativePath;
      }
      
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

      // Check if .git directory and .gitignore file exist
      let ignoreRules = null;
      let gitFiles = { hasGit: false, hasGitignore: false };
      
      // Parse .gitignore if needed for exclusion or respecting rules
      if (gitExclusionMode === 'exclude_git' || gitExclusionMode === 'respect_gitignore') {
        gitFiles = await checkGitFiles(folderAbsPath);
        
        if (gitFiles.hasGitignore) {
          ignoreRules = await parseGitignore(gitFiles.gitignorePath);
        }
      }

      // Create zip
      const zip = new JSZip();
      
      // Get all files
      let allFiles = [];
      
      // Get all files and directories using getAllFiles
      allFiles = await getAllFiles(folderAbsPath);
      
      let processed = 0;
      let skipped = 0;
      
      for (const file of allFiles) {
        if (progress.token && progress.token.isCancellationRequested) {
          throw new Error('Compression cancelled');
        }
        
        const { path: filePath, relativePath, isDirectory } = file;
        
        // Check if this file should be excluded when excludeGitFiles is true
        // Check for exclusions based on the selected Git handling mode
        if (gitExclusionMode !== 'include_all') {
          // For 'exclude_git' mode, explicitly remove .git and .gitignore files
          if (gitExclusionMode === 'exclude_git') {
            if (gitFiles.hasGit && (relativePath === '.git' || relativePath.startsWith('.git/'))) {
              skipped++;
              continue;
            }
            if (gitFiles.hasGitignore && relativePath === '.gitignore') {
              skipped++;
              continue;
            }
          }

          // For both 'exclude_git' and 'respect_gitignore', use the ignore rules
          if (ignoreRules && ignoreRules.ignores(relativePath)) {
            skipped++;
            continue;
          }
        }
        
        let zipPath = processPath(filePath);
        
        // If it's a directory, add it with a trailing slash
        if (isDirectory) {
          zip.folder(zipPath);
          processed++;
          continue;
        }
        
        // For files, read the content and add to zip
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        
        if (mode === 'flat') {
          zipPath = path.basename(zipPath);
        }
        
        zip.file(zipPath, content);
        
        processed++;
        progress.report({
          message: `Adding files (${processed}/${allFiles.length - skipped})`,
          increment: 70/allFiles.length
        });
      }
      
      if (skipped > 0) {
        vscode.window.showInformationMessage(`Skipped ${skipped} files based on Git exclusion rules`);
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
 * @param {boolean} [options.excludeGitFiles=false] - Whether to exclude .git directory and files ignored by .gitignore
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
      
      // Check if .git directory and .gitignore file exist
      let ignoreRules = null;
      let gitFiles = { hasGit: false, hasGitignore: false };
      let folderPath = '';
      
      if (options.excludeGitFiles && filesToZip.length > 0) {
        // Get the directory of the first file
        folderPath = safePathDirname(filesToZip[0].fsPath);
        gitFiles = await checkGitFiles(folderPath);
        
        if (gitFiles.hasGitignore) {
          ignoreRules = await parseGitignore(gitFiles.gitignorePath);
        }
      }

      // Create zip
      const zip = new JSZip();
      let processed = 0;
      let skipped = 0;
      
      // Create a common folder for all files if there are multiple files
      const useCommonFolder = filesToZip.length > 1;
      const commonFolderName = path.basename(outputPath.fsPath, '.zip');
      
      // If not excluding Git files and there are Git files in the directory,
      // we need to manually add them since they might not be included in filesToZip
      if (!options.excludeGitFiles && folderPath) {
        const gitDir = path.join(folderPath, '.git');
        const gitignoreFile = path.join(folderPath, '.gitignore');
        
        // Check if .git directory exists
        if (await fileExists(gitDir)) {
          // Get all files in .git directory
          const gitFiles = await getAllFiles(gitDir, [], folderPath);
          
          for (const gitFile of gitFiles) {
            if (progress.token && progress.token.isCancellationRequested) {
              throw new Error('Compression cancelled');
            }
            
            try {
              const content = await vscode.workspace.fs.readFile(vscode.Uri.file(gitFile.path));
              
              // Add file to zip with appropriate path
              const zipPath = useCommonFolder
                ? `${commonFolderName}/.git/${gitFile.relativePath.substring(4)}` // Remove '.git/' prefix
                : `.git/${gitFile.relativePath.substring(4)}`; // Remove '.git/' prefix
              
              zip.file(zipPath, content);
              processed++;
            } catch (err) {
              console.error(`Error reading Git file ${gitFile.path}:`, err);
            }
          }
        }
        
        // Check if .gitignore file exists
        if (await fileExists(gitignoreFile)) {
          try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(gitignoreFile));
            
            // Add .gitignore to zip
            const zipPath = useCommonFolder
              ? `${commonFolderName}/.gitignore`
              : '.gitignore';
            
            zip.file(zipPath, content);
            processed++;
          } catch (err) {
            console.error('Error reading .gitignore file:', err);
          }
        }
      }
      
      // Process the selected files
      for (const file of filesToZip) {
        if (progress.token && progress.token.isCancellationRequested) {
          throw new Error('Compression cancelled');
        }
        
        // Check if this file should be excluded when excludeGitFiles is true
        if (options.excludeGitFiles && folderPath) {
          const relativePath = path.relative(folderPath, file.fsPath).replace(/\\/g, '/');
          
          // Always exclude .git directory
          if (gitFiles.hasGit && (relativePath === '.git' || relativePath.startsWith('.git/'))) {
            skipped++;
            continue;
          }
          
          // Always exclude .gitignore file itself
          if (gitFiles.hasGitignore && relativePath === '.gitignore') {
            skipped++;
            continue;
          }
          
          // Exclude files based on .gitignore rules
          if (gitFiles.hasGitignore && ignoreRules && ignoreRules.ignores(relativePath)) {
            skipped++;
            continue;
          }
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
  createZipFromFolder,
  createZipFromFiles,
  safePathDirname,
  checkGitFiles,
  parseGitignore,
  fileExists,
  getAllFiles
};