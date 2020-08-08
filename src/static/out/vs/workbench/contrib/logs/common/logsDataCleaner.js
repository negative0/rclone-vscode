/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/base/common/uri", "vs/platform/lifecycle/common/lifecycle"], function (require, exports, lifecycle_1, files_1, resources_1, environmentService_1, uri_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogsDataCleaner = void 0;
    let LogsDataCleaner = class LogsDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.lifecycleService = lifecycleService;
            this.cleanUpOldLogsSoon();
        }
        cleanUpOldLogsSoon() {
            let handle = setTimeout(async () => {
                handle = undefined;
                const logsPath = uri_1.URI.file(this.environmentService.logsPath).with({ scheme: this.environmentService.logFile.scheme });
                const stat = await this.fileService.resolve(resources_1.dirname(logsPath));
                if (stat.children) {
                    const currentLog = resources_1.basename(logsPath);
                    const allSessions = stat.children.filter(stat => stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name));
                    const oldSessions = allSessions.sort().filter((d, i) => d.name !== currentLog);
                    const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 49));
                    Promise.all(toDelete.map(stat => this.fileService.del(stat.resource, { recursive: true })));
                }
            }, 10 * 1000);
            this.lifecycleService.onWillShutdown(() => {
                if (handle) {
                    clearTimeout(handle);
                    handle = undefined;
                }
            });
        }
    };
    LogsDataCleaner = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, lifecycle_2.ILifecycleService)
    ], LogsDataCleaner);
    exports.LogsDataCleaner = LogsDataCleaner;
});
//# __sourceMappingURL=logsDataCleaner.js.map