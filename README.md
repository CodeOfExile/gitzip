# GitZip - Smart Compression Tool for Git Projects

**GitZip** is a powerful VSCode extension designed to streamline your compression workflows, with special focus on Git-based projects. This enhanced version of the original *Zip Tools* extension provides intelligent file handling and flexible packaging options for developers.

## ✨ Key Features

- 🔄 **Flexible Compression Modes**:
  - **Only Content**: Zip only the contents of a folder (without the parent folder)
  - **With Folder**: Include the folder itself in the zip
  - **Custom Name**: Package into a folder with a custom name
  
- 📁 **Multiple Output Options**:
  - Current folder (same directory)
  - Parent folder (one level up)
  - Custom path (specify any location)
  
- 🔍 **Intelligent Git Integration**:
  - Auto-detects `.git/` directories and `.gitignore` files
  - Interactive prompt to include or exclude Git-related content
  - Smart parsing of `.gitignore` rules (supports all standard formats)
  - Creates clean distribution-ready archives perfect for sharing
  
- 📂 **Complete Directory Support**:
  - Preserves empty directories in zip files
  - Maintains proper folder structure
  - Handles special paths and characters correctly
  
- 🌐 **Full Internationalization** (i18n)
  - English, Spanish, and more languages supported
  - Localized interface elements and notifications
  
- 🧩 **Convenient Access**:
  - Right-click context menu integration
  - Command palette actions
  - Keyboard shortcuts
  
- 💬 **Helpful Feedback**:
  - Smart notifications with output path
  - Compression statistics (size difference)
  - Operation duration tracking

## 📦 Installation

Search for `GitZip` in the [VSCode Marketplace](https://marketplace.visualstudio.com/) or install manually from this repository:

```bash
# Manual installation
git clone https://github.com/CodeOfExile/gitzip
cd gitzip
npm install
npm run build
```

## 🛠 Usage & Configuration

### Basic Usage

1. **Right-click** on any folder in the Explorer
2. Select **"Zip Folder"** from the context menu
3. Choose your preferred compression options
4. For Git projects, decide whether to exclude Git-related files

### Customization Options

* **Compression Mode**: Control how folders are packaged
* **Output Location**: Determine where zip files are saved
* **Naming Style**: Customize the structure of generated archives
* **Git Handling**: Choose whether to include or exclude Git files

All options are available through the context menu or command palette.

## 💡 Why Choose GitZip?

GitZip is the ideal solution for developers who:

* Need to create **clean distribution packages** of Git projects
* Want to **share code** without including Git history and ignored files
* Require **flexible packaging options** for different deployment scenarios
* Value **efficiency and simplicity** in their development workflow
* Need to **maintain empty directories** in their zip archives
* Work with projects that use **standard Git workflows**

## 🧪 Development & Contribution

We welcome contributions to make GitZip even better! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards in the project
4. Open an issue before submitting large PRs
5. Submit a pull request with clear description of changes

## 📄 License

MIT License
© 2025 Indie Sewell / CodeOfExile Team
[https://exilecode.com](https://exilecode.com)

---

*GitZip: Package your code, not your Git history.*
