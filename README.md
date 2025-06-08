# GitZip - Smart Compression Tool for All Developers

**GitZip** is a powerful and flexible VSCode **zip extension** and **archive tool** designed to simplify file and **folder compression** workflows. As a smart **zip tool**, it's perfect for developers working in Git-based projects. Whether you need to **compress a folder**, create a release **bundle**, or **archive a project** while respecting your `.gitignore`, GitZip helps you **package** your code cleanly and efficiently.

Originally inspired by the limitations of existing zip extensions, GitZip extends the standard functionality with developer-centric options, smart Git awareness, and complete structural control.

## ✨ Key Features

* 🔄 **Flexible Compression Modes**:

  * **Only Content**: Zip only the contents of a folder (without the parent folder)
  * **With Folder**: Include the folder itself in the zip
  * **Custom Name**: Package into a folder with a custom name

* 📁 **Multiple Output Options**:

  * Current folder (same directory)
  * Parent folder (one level up)
  * Custom path (specify any location)

* 🧠 **Advanced Git Handling Modes**:

  * **Auto-detects Git projects** (`.git` and `.gitignore`).
  * **Offers three clear handling modes** for precise packaging:
    1.  **Exclude .git & .gitignore**: Perfect for clean public releases. Removes Git history but still respects `.gitignore` rules to exclude unwanted files (like `node_modules`).
    2.  **Keep .git & .gitignore**: Ideal for clean repository backups. Keeps Git history and the `.gitignore` file, but still excludes all files listed in `.gitignore`.
    3.  **Include All**: Creates a full project snapshot, ignoring all `.gitignore` rules and including every file.

* 📂 **Project Structure Preservation**:

  * Retains empty directories
  * Maintains accurate folder hierarchy
  * Handles edge cases like special characters and paths

* 🌐 **Full Internationalization (i18n)**:

  * English, Spanish, and more supported
  * Localized UI and notifications

* ⚡ **One-Click Extraction**:

  * **Extract to Folder**: Instantly unpacks the entire archive into a new folder named after the zip file.
  * **Extract Here**: Unpacks all contents directly into the current directory.
  * No need to manually select files first.

* 🚀 **Fast Access Options**:

  * Context menu on folders
  * Command palette shortcuts
  * Keyboard binding support

* 💬 **Clear Output & Feedback**:

  * Path to saved archive
  * Compression ratio and file size diff
  * Duration of the operation

## 📦 Installation

Search for `GitZip` in the [VSCode Marketplace](https://marketplace.visualstudio.com/) or install manually:

```bash
# Build from Source
git clone https://github.com/CodeOfExile/gitzip
cd gitzip
npm install
npx vsce package # This will compile the code and create a .vsix file
```
Then, go to the VSCode Extensions view, click the `...` menu, and select `Install from VSIX...` to install the generated `gitzip-*.vsix` file.

## 🛠 Usage & Configuration

### Basic Usage

1. Right-click any folder in the VSCode Explorer.
2. Choose **"GitZip: Compress"**.
3. Select your compression mode and output path.
4. If a `.git` directory is detected, choose one of the three Git Handling Modes to package your project exactly as you need.

### Configurable Options

* **Compression Mode**: Only contents / With folder / Custom name
* **Output Directory**: Current / Parent / Custom
* **Folder Naming**: Rename compressed folder in zip
* **Git Handling**: Choose how to package `.git`, `.gitignore`, and ignored files.

All options are accessible through context menu or command palette.

## 💡 Who is GitZip For?

This zip tool is built for any developer who needs more control over their compression workflow. It's especially powerful for:

*   **WordPress Plugin & Theme Developers**: Easily package your plugins and themes for the official repository or for clients, automatically excluding development files.
*   **Frontend & Node.js Developers**: Create clean, production-ready bundles of your React, Vue, or Node.js applications, leaving out `node_modules` and other dev dependencies.
*   **Game Modders & Developers**: Package your game mods or web game builds, ensuring only the necessary assets and scripts are included.
*   **VSCode Extension Authors**: Streamline the process of bundling your extension for the Marketplace.
*   **Students & Educators**: Submit or share clean, lightweight project assignments without bulky dependency folders.
*   **Anyone Creating Project Archives**: If you need to create a zip for distribution, backup, or sharing, GitZip's `.gitignore` integration ensures you only package what's necessary.

Whether you're delivering a clean project archive, uploading a plugin, or saving a version snapshot, GitZip gives you complete control.

## 🔑 Keywords

`zip`, `unzip`, `compress`, `archive`, `decompress`, `zip tool`, `compression tool`, `archive tool`, `git zip`, `zip git`, `git archive`, `.gitignore`, `ignore files`, `package`, `bundle`, `release`, `folder zip`, `zip folder`, `vscode zip`, `zip extension`

## 🧪 Development & Contribution

We welcome contributions!

1. Fork the repository
2. Create a feature branch
3. Follow coding standards and submit descriptive pull requests
4. Open an issue to discuss major ideas or features

## 📄 License

MIT License © 2025 Indie Sewell / CodeOfExile Team
[https://exilecode.com](https://exilecode.com)

---

*GitZip: Package your code, not your Git history. Designed for all developers.*
