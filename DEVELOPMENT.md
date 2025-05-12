# GitZip Development Guide

## Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Build the extension: `npm run build`
4.  Run the extension in VS Code:
    *   Press `F5` to launch the extension in a new VS Code window.
    *   Select the "Launch Extension (Watch)" configuration to enable automatic rebuilding on code changes.

## Code Structure

*   `src/`: Contains the source code for the extension.
*   `src/cmds.js`: Contains the command handlers.
*   `src/zip-utils.js`: Contains the utility functions for zipping and unzipping files.
*   `package.json`: Contains the extension manifest and build configuration.

## Contributing

Please follow the [CodeOfExile Team](https://github.com/CodeOfExile) contribution guidelines.

## License

MIT License