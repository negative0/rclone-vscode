/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/common/config/editorOptions", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform"], function (require, exports, nls_1, editorOptions_1, terminal_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTerminalShellConfiguration = exports.terminalConfiguration = void 0;
    exports.terminalConfiguration = {
        id: 'terminal',
        order: 100,
        title: nls_1.localize('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            'terminal.integrated.automationShell.linux': {
                markdownDescription: nls_1.localize({
                    key: 'terminal.integrated.automationShell.linux',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.linux`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.automationShell.osx': {
                markdownDescription: nls_1.localize({
                    key: 'terminal.integrated.automationShell.osx',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.osx`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.automationShell.windows': {
                markdownDescription: nls_1.localize({
                    key: 'terminal.integrated.automationShell.windows',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.windows`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.shellArgs.linux': {
                markdownDescription: nls_1.localize('terminal.integrated.shellArgs.linux', "The command line arguments to use when on the Linux terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            'terminal.integrated.shellArgs.osx': {
                markdownDescription: nls_1.localize('terminal.integrated.shellArgs.osx', "The command line arguments to use when on the macOS terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                // Unlike on Linux, ~/.profile is not sourced when logging into a macOS session. This
                // is the reason terminals on macOS typically run login shells by default which set up
                // the environment. See http://unix.stackexchange.com/a/119675/115410
                default: ['-l']
            },
            'terminal.integrated.shellArgs.windows': {
                markdownDescription: nls_1.localize('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                'anyOf': [
                    {
                        type: 'array',
                        items: {
                            type: 'string',
                            markdownDescription: nls_1.localize('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).")
                        },
                    },
                    {
                        type: 'string',
                        markdownDescription: nls_1.localize('terminal.integrated.shellArgs.windows.string', "The command line arguments in [command-line format](https://msdn.microsoft.com/en-au/08dfcab2-eb6e-49a4-80eb-87d4076c98c6) to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).")
                    }
                ],
                default: []
            },
            'terminal.integrated.macOptionIsMeta': {
                description: nls_1.localize('terminal.integrated.macOptionIsMeta', "Controls whether to treat the option key as the meta key in the terminal on macOS."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.macOptionClickForcesSelection': {
                description: nls_1.localize('terminal.integrated.macOptionClickForcesSelection', "Controls whether to force selection when using Option+click on macOS. This will force a regular (line) selection and disallow the use of column selection mode. This enables copying and pasting using the regular terminal selection, for example, when mouse mode is enabled in tmux."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.copyOnSelection': {
                description: nls_1.localize('terminal.integrated.copyOnSelection', "Controls whether text selected in the terminal will be copied to the clipboard."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.drawBoldTextInBrightColors': {
                description: nls_1.localize('terminal.integrated.drawBoldTextInBrightColors', "Controls whether bold text in the terminal will always use the \"bright\" ANSI color variant."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.fontFamily': {
                markdownDescription: nls_1.localize('terminal.integrated.fontFamily', "Controls the font family of the terminal, this defaults to `#editor.fontFamily#`'s value."),
                type: 'string'
            },
            // TODO: Support font ligatures
            // 'terminal.integrated.fontLigatures': {
            // 	'description': localize('terminal.integrated.fontLigatures', "Controls whether font ligatures are enabled in the terminal."),
            // 	'type': 'boolean',
            // 	'default': false
            // },
            'terminal.integrated.fontSize': {
                description: nls_1.localize('terminal.integrated.fontSize', "Controls the font size in pixels of the terminal."),
                type: 'number',
                default: editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize
            },
            'terminal.integrated.letterSpacing': {
                description: nls_1.localize('terminal.integrated.letterSpacing', "Controls the letter spacing of the terminal, this is an integer value which represents the amount of additional pixels to add between characters."),
                type: 'number',
                default: terminal_1.DEFAULT_LETTER_SPACING
            },
            'terminal.integrated.lineHeight': {
                description: nls_1.localize('terminal.integrated.lineHeight', "Controls the line height of the terminal, this number is multiplied by the terminal font size to get the actual line-height in pixels."),
                type: 'number',
                default: terminal_1.DEFAULT_LINE_HEIGHT
            },
            'terminal.integrated.minimumContrastRatio': {
                markdownDescription: nls_1.localize('terminal.integrated.minimumContrastRatio', "When set the foreground color of each cell will change to try meet the contrast ratio specified. Example values:\n\n- 1: The default, do nothing.\n- 4.5: [WCAG AA compliance (minimum)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html).\n- 7: [WCAG AAA compliance (enhanced)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast7.html).\n- 21: White on black or black on white."),
                type: 'number',
                default: 1
            },
            'terminal.integrated.fastScrollSensitivity': {
                markdownDescription: nls_1.localize('terminal.integrated.fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`."),
                type: 'number',
                default: 5
            },
            'terminal.integrated.mouseWheelScrollSensitivity': {
                markdownDescription: nls_1.localize('terminal.integrated.mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaY` of mouse wheel scroll events."),
                type: 'number',
                default: 1
            },
            'terminal.integrated.fontWeight': {
                type: 'string',
                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                description: nls_1.localize('terminal.integrated.fontWeight', "The font weight to use within the terminal for non-bold text."),
                default: 'normal'
            },
            'terminal.integrated.fontWeightBold': {
                type: 'string',
                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                description: nls_1.localize('terminal.integrated.fontWeightBold', "The font weight to use within the terminal for bold text."),
                default: 'bold'
            },
            'terminal.integrated.cursorBlinking': {
                description: nls_1.localize('terminal.integrated.cursorBlinking', "Controls whether the terminal cursor blinks."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.cursorStyle': {
                description: nls_1.localize('terminal.integrated.cursorStyle', "Controls the style of terminal cursor."),
                enum: [terminal_1.TerminalCursorStyle.BLOCK, terminal_1.TerminalCursorStyle.LINE, terminal_1.TerminalCursorStyle.UNDERLINE],
                default: terminal_1.TerminalCursorStyle.BLOCK
            },
            'terminal.integrated.cursorWidth': {
                markdownDescription: nls_1.localize('terminal.integrated.cursorWidth', "Controls the width of the cursor when `#terminal.integrated.cursorStyle#` is set to `line`."),
                type: 'number',
                default: 1
            },
            'terminal.integrated.scrollback': {
                description: nls_1.localize('terminal.integrated.scrollback', "Controls the maximum amount of lines the terminal keeps in its buffer."),
                type: 'number',
                default: 1000
            },
            'terminal.integrated.detectLocale': {
                markdownDescription: nls_1.localize('terminal.integrated.detectLocale', "Controls whether to detect and set the `$LANG` environment variable to a UTF-8 compliant option since VS Code's terminal only supports UTF-8 encoded data coming from the shell."),
                type: 'string',
                enum: ['auto', 'off', 'on'],
                markdownEnumDescriptions: [
                    nls_1.localize('terminal.integrated.detectLocale.auto', "Set the `$LANG` environment variable if the existing variable does not exist or it does not end in `'.UTF-8'`."),
                    nls_1.localize('terminal.integrated.detectLocale.off', "Do not set the `$LANG` environment variable."),
                    nls_1.localize('terminal.integrated.detectLocale.on', "Always set the `$LANG` environment variable.")
                ],
                default: 'auto'
            },
            'terminal.integrated.rendererType': {
                type: 'string',
                enum: ['auto', 'canvas', 'dom', 'experimentalWebgl'],
                markdownEnumDescriptions: [
                    nls_1.localize('terminal.integrated.rendererType.auto', "Let VS Code guess which renderer to use."),
                    nls_1.localize('terminal.integrated.rendererType.canvas', "Use the standard GPU/canvas-based renderer."),
                    nls_1.localize('terminal.integrated.rendererType.dom', "Use the fallback DOM-based renderer."),
                    nls_1.localize('terminal.integrated.rendererType.experimentalWebgl', "Use the experimental webgl-based renderer. Note that this has some [known issues](https://github.com/xtermjs/xterm.js/issues?q=is%3Aopen+is%3Aissue+label%3Aarea%2Faddon%2Fwebgl) and this will only be enabled for new terminals (not hot swappable like the other renderers).")
                ],
                default: 'auto',
                description: nls_1.localize('terminal.integrated.rendererType', "Controls how the terminal is rendered.")
            },
            'terminal.integrated.rightClickBehavior': {
                type: 'string',
                enum: ['default', 'copyPaste', 'paste', 'selectWord'],
                enumDescriptions: [
                    nls_1.localize('terminal.integrated.rightClickBehavior.default', "Show the context menu."),
                    nls_1.localize('terminal.integrated.rightClickBehavior.copyPaste', "Copy when there is a selection, otherwise paste."),
                    nls_1.localize('terminal.integrated.rightClickBehavior.paste', "Paste on right click."),
                    nls_1.localize('terminal.integrated.rightClickBehavior.selectWord', "Select the word under the cursor and show the context menu.")
                ],
                default: platform_1.isMacintosh ? 'selectWord' : platform_1.isWindows ? 'copyPaste' : 'default',
                description: nls_1.localize('terminal.integrated.rightClickBehavior', "Controls how terminal reacts to right click.")
            },
            'terminal.integrated.cwd': {
                description: nls_1.localize('terminal.integrated.cwd', "An explicit start path where the terminal will be launched, this is used as the current working directory (cwd) for the shell process. This may be particularly useful in workspace settings if the root directory is not a convenient cwd."),
                type: 'string',
                default: undefined
            },
            'terminal.integrated.confirmOnExit': {
                description: nls_1.localize('terminal.integrated.confirmOnExit', "Controls whether to confirm on exit if there are active terminal sessions."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.enableBell': {
                description: nls_1.localize('terminal.integrated.enableBell', "Controls whether the terminal bell is enabled."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.commandsToSkipShell': {
                markdownDescription: nls_1.localize('terminal.integrated.commandsToSkipShell', "A set of command IDs whose keybindings will not be sent to the shell and instead always be handled by Code. This allows the use of keybindings that would normally be consumed by the shell to act the same as when the terminal is not focused, for example ctrl+p to launch Quick Open. Use the command prefixed with `-` to remove default commands from the list.\nDefault Skipped Commands:\n\n{0}", terminal_1.DEFAULT_COMMANDS_TO_SKIP_SHELL.sort().map(command => `- ${command}`).join('\n')),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            'terminal.integrated.allowChords': {
                markdownDescription: nls_1.localize('terminal.integrated.allowChords', "Whether or not to allow chord keybindings in the terminal. Note that when this is true and the keystroke results in a chord it will bypass `#terminal.integrated.commandsToSkipShell#`, setting this to false is particularly useful when you want ctrl+k to go to your shell (not VS Code)."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.allowMnemonics': {
                markdownDescription: nls_1.localize('terminal.integrated.allowMnemonics', "Whether to allow menubar mnemonics (eg. alt+f) to trigger the open the menubar. Note that this will cause all alt keystrokes will skip the shell when true. This does nothing on macOS."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.inheritEnv': {
                markdownDescription: nls_1.localize('terminal.integrated.inheritEnv', "Whether new shells should inherit their environment from VS Code. This is not supported on Windows."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.env.osx': {
                markdownDescription: nls_1.localize('terminal.integrated.env.osx', "Object with environment variables that will be added to the VS Code process to be used by the terminal on macOS. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.env.linux': {
                markdownDescription: nls_1.localize('terminal.integrated.env.linux', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Linux. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.env.windows': {
                markdownDescription: nls_1.localize('terminal.integrated.env.windows', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Windows. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.environmentChangesIndicator': {
                markdownDescription: nls_1.localize('terminal.integrated.environmentChangesIndicator', "Whether to display the environment changes indicator on each terminal which explains whether extensions have made, or want to make changes to the terminal's environment."),
                type: 'string',
                enum: ['off', 'on', 'warnonly'],
                enumDescriptions: [
                    nls_1.localize('terminal.integrated.environmentChangesIndicator.off', "Disable the indicator."),
                    nls_1.localize('terminal.integrated.environmentChangesIndicator.on', "Enable the indicator."),
                    nls_1.localize('terminal.integrated.environmentChangesIndicator.warnonly', "Only show the warning indicator when a terminal's environment is 'stale', not the information indicator that shows a terminal has had its environment modified by an extension."),
                ],
                default: 'warnonly'
            },
            'terminal.integrated.showExitAlert': {
                description: nls_1.localize('terminal.integrated.showExitAlert', "Controls whether to show the alert \"The terminal process terminated with exit code\" when exit code is non-zero."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.splitCwd': {
                description: nls_1.localize('terminal.integrated.splitCwd', "Controls the working directory a split terminal starts with."),
                type: 'string',
                enum: ['workspaceRoot', 'initial', 'inherited'],
                enumDescriptions: [
                    nls_1.localize('terminal.integrated.splitCwd.workspaceRoot', "A new split terminal will use the workspace root as the working directory. In a multi-root workspace a choice for which root folder to use is offered."),
                    nls_1.localize('terminal.integrated.splitCwd.initial', "A new split terminal will use the working directory that the parent terminal started with."),
                    nls_1.localize('terminal.integrated.splitCwd.inherited', "On macOS and Linux, a new split terminal will use the working directory of the parent terminal. On Windows, this behaves the same as initial."),
                ],
                default: 'inherited'
            },
            'terminal.integrated.windowsEnableConpty': {
                description: nls_1.localize('terminal.integrated.windowsEnableConpty', "Whether to use ConPTY for Windows terminal process communication (requires Windows 10 build number 18309+). Winpty will be used if this is false."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.wordSeparators': {
                description: nls_1.localize('terminal.integrated.wordSeparators', "A string containing all characters to be considered word separators by the double click to select word feature."),
                type: 'string',
                default: ' ()[]{}\',"`─'
            },
            'terminal.integrated.experimentalUseTitleEvent': {
                description: nls_1.localize('terminal.integrated.experimentalUseTitleEvent', "An experimental setting that will use the terminal title event for the dropdown title. This setting will only apply to new terminals."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.enableFileLinks': {
                description: nls_1.localize('terminal.integrated.enableFileLinks', "Whether to enable file links in the terminal. Links can be slow when working on a network drive in particular because each file link is verified against the file system. Changing this will take effect only in new terminals."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.unicodeVersion': {
                type: 'string',
                enum: ['6', '11'],
                enumDescriptions: [
                    nls_1.localize('terminal.integrated.unicodeVersion.six', "Version 6 of unicode, this is an older version which should work better on older systems."),
                    nls_1.localize('terminal.integrated.unicodeVersion.eleven', "Version 11 of unicode, this version provides better support on modern systems that use modern versions of unicode.")
                ],
                default: '11',
                description: nls_1.localize('terminal.integrated.unicodeVersion', "Controls what version of unicode to use when evaluating the width of characters in the terminal. If you experience emoji or other wide characters not taking up the right amount of space or backspace either deleting too much or too little then you may want to try tweaking this setting.")
            },
            'terminal.integrated.experimentalLinkProvider': {
                description: nls_1.localize('terminal.integrated.experimentalLinkProvider', "An experimental setting that aims to improve link detection in the terminal by improving when links are detected and by enabling shared link detection with the editor. Currently this only supports web links."),
                type: 'boolean',
                default: true
            }
        }
    };
    function getTerminalShellConfiguration(getSystemShell) {
        return {
            id: 'terminal',
            order: 100,
            title: nls_1.localize('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
            type: 'object',
            properties: {
                'terminal.integrated.shell.linux': {
                    markdownDescription: getSystemShell
                        ? nls_1.localize('terminal.integrated.shell.linux', "The path of the shell that the terminal uses on Linux (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(2 /* Linux */))
                        : nls_1.localize('terminal.integrated.shell.linux.noDefault', "The path of the shell that the terminal uses on Linux. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                },
                'terminal.integrated.shell.osx': {
                    markdownDescription: getSystemShell
                        ? nls_1.localize('terminal.integrated.shell.osx', "The path of the shell that the terminal uses on macOS (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(1 /* Mac */))
                        : nls_1.localize('terminal.integrated.shell.osx.noDefault', "The path of the shell that the terminal uses on macOS. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                },
                'terminal.integrated.shell.windows': {
                    markdownDescription: getSystemShell
                        ? nls_1.localize('terminal.integrated.shell.windows', "The path of the shell that the terminal uses on Windows (default: {0}). [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).", getSystemShell(3 /* Windows */))
                        : nls_1.localize('terminal.integrated.shell.windows.noDefault', "The path of the shell that the terminal uses on Windows. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                    type: ['string', 'null'],
                    default: null
                }
            }
        };
    }
    exports.getTerminalShellConfiguration = getTerminalShellConfiguration;
});
//# __sourceMappingURL=terminalConfiguration.js.map