# GitZip - Smart Compression Tool for All Developers

**GitZip** is a powerful and flexible VSCode extension designed to simplify file and folder compression workflows for all kinds of developers—especially those working in Git-based projects and modern version-controlled environments. Whether you're building WordPress plugins, frontend components, Node.js modules, or distributing simple project archives, GitZip helps you package your code cleanly and efficiently.

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

* 🧠 **Smart Git-Aware Exclusions**:

  * Auto-detects `.git/` directories and `.gitignore` files
  * Interactive prompt to include or exclude Git-related content
  * Parses `.gitignore` rules to cleanly exclude unwanted files
  * Great for generating release zips or upload-ready distributions

* 📂 **Project Structure Preservation**:

  * Retains empty directories
  * Maintains accurate folder hierarchy
  * Handles edge cases like special characters and paths

* 🌐 **Full Internationalization (i18n)**:

  * English, Spanish, and more supported
  * Localized UI and notifications

* ⚡ **Fast Access Options**:

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
# Manual installation
git clone https://github.com/CodeOfExile/gitzip
cd gitzip
npm install
npm run build
```

## 🛠 Usage & Configuration

### Basic Usage

1. Right-click any folder in the VSCode Explorer
2. Choose **"GitZip: Compress"**
3. Select your compression mode and output path
4. (If applicable) Decide whether to exclude Git-related files

### Configurable Options

* **Compression Mode**: Only contents / With folder / Custom name
* **Output Directory**: Current / Parent / Custom
* **Folder Naming**: Rename compressed folder in zip
* **Git Exclusions**: Toggle `.git/` and `.gitignore` awareness

All options are accessible through context menu or command palette.

## 💡 Why Choose GitZip?

GitZip is ideal for:

* Developers packaging **WordPress plugins/themes**
* Creating **clean zip bundles** for upload or distribution
* Avoiding the inclusion of unnecessary Git and config files
* Teams working in **modular frontend/backend projects**
* Ensuring **empty folders** are kept (often needed for frameworks)
* Anyone needing **more than just "right-click → zip"**

Whether you're delivering a clean project archive, uploading a plugin, or saving a version snapshot, GitZip gives you complete control.

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
