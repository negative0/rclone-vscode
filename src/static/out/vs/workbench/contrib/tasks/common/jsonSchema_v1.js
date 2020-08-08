/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/workbench/contrib/tasks/common/problemMatcher", "./jsonSchemaCommon"], function (require, exports, nls, Objects, problemMatcher_1, jsonSchemaCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schema = {
        oneOf: [
            {
                allOf: [
                    {
                        type: 'object',
                        required: ['version'],
                        properties: {
                            version: {
                                type: 'string',
                                enum: ['0.1.0'],
                                deprecationMessage: nls.localize('JsonSchema.version.deprecated', 'Task version 0.1.0 is deprecated. Please use 2.0.0'),
                                description: nls.localize('JsonSchema.version', 'The config\'s version number')
                            },
                            _runner: {
                                deprecationMessage: nls.localize('JsonSchema._runner', 'The runner has graduated. Use the offical runner property')
                            },
                            runner: {
                                type: 'string',
                                enum: ['process', 'terminal'],
                                default: 'process',
                                description: nls.localize('JsonSchema.runner', 'Defines whether the task is executed as a process and the output is shown in the output window or inside the terminal.')
                            },
                            windows: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.windows', 'Windows specific command configuration')
                            },
                            osx: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.mac', 'Mac specific command configuration')
                            },
                            linux: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.linux', 'Linux specific command configuration')
                            }
                        }
                    },
                    {
                        $ref: '#/definitions/taskRunnerConfiguration'
                    }
                ]
            }
        ]
    };
    const shellCommand = {
        type: 'boolean',
        default: true,
        description: nls.localize('JsonSchema.shell', 'Specifies whether the command is a shell command or an external program. Defaults to false if omitted.')
    };
    schema.definitions = Objects.deepClone(jsonSchemaCommon_1.default.definitions);
    let definitions = schema.definitions;
    definitions['commandConfiguration']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    definitions['taskDescription']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    definitions['taskRunnerConfiguration']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    Object.getOwnPropertyNames(definitions).forEach(key => {
        let newKey = key + '1';
        definitions[newKey] = definitions[key];
        delete definitions[key];
    });
    function fixReferences(literal) {
        if (Array.isArray(literal)) {
            literal.forEach(fixReferences);
        }
        else if (typeof literal === 'object') {
            if (literal['$ref']) {
                literal['$ref'] = literal['$ref'] + '1';
            }
            Object.getOwnPropertyNames(literal).forEach(property => {
                let value = literal[property];
                if (Array.isArray(value) || typeof value === 'object') {
                    fixReferences(value);
                }
            });
        }
    }
    fixReferences(schema);
    problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
        try {
            let matcherIds = problemMatcher_1.ProblemMatcherRegistry.keys().map(key => '$' + key);
            definitions.problemMatcherType1.oneOf[0].enum = matcherIds;
            definitions.problemMatcherType1.oneOf[2].items.anyOf[1].enum = matcherIds;
        }
        catch (err) {
            console.log('Installing problem matcher ids failed');
        }
    });
    exports.default = schema;
});
//# __sourceMappingURL=jsonSchema_v1.js.map