# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-06-09

### Added
- **One-Click Extraction**: Added "Extract to Folder" and "Extract Here" buttons in the Zip Editor for instant unpacking of the entire archive, significantly improving user experience.

### Fixed
- **UI Bug**: Fixed an issue where the "Extract to <Zip Name> Folder" button did not dynamically display the actual name of the zip file.

### Changed
- **Documentation**: Updated `README.md` to reflect the new one-click extraction feature and corrected the build instructions.

## [2.1.0] - 2025-06-09

### Added
- **Advanced Git Handling**: Introduced three distinct Git handling modes for compression:
  1.  **Exclude .git & .gitignore**: For clean public releases.
  2.  **Keep .git & .gitignore**: For clean repository backups.
  3.  **Include All**: For complete project snapshots.

### Changed
- **User Interface**: Replaced the simple Git exclusion prompt with a clearer, more powerful three-option menu.
- **Documentation**: Updated `README.md` with details on the new Git handling modes, added more keywords for better search visibility (SEO), and expanded the target user descriptions.

## [2.0.0] - 2025-05-14

### Added
- Git-aware compression with intelligent `.gitignore` support
- Option to include or exclude Git-related files when compressing
- Support for empty directories in zip files
- Enhanced path handling for absolute and relative paths
- Improved compatibility with various `.gitignore` rule formats

### Changed
- Renamed `createZip` to `createZipFromFolder` for better clarity
- Updated README with detailed feature descriptions
- Improved error handling and logging
- Enhanced code organization and documentation

### Fixed
- Fixed "files is not defined" error in compression process
- Fixed issue with empty directories not being included in zip files
- Fixed path handling errors for files outside the target directory
- Fixed issues with `.gitignore` rule parsing and application

## [1.0.0] - 2025-05-13

### Features
- Initial release of GitZip extension
- Support for multiple compression modes:
  - Only Content: Zip only the contents of a folder
  - With Folder: Include the folder itself
  - Custom Name: Zip into a folder with a custom name
- Flexible output paths:
  - Current folder
  - Parent folder
  - Custom path
- Full internationalization support (i18n)
- Right-click context menu for fast actions
- Smart notifications: output path, size diff, duration

---

[_back to top_](#changelog)
