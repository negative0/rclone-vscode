/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors"], function (require, exports, files_1, event_1, lifecycle_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });


    // 2: "FileReadWrite"
    // 4: "FileOpenReadWriteClose"
    // 8: "FileFolderCopy"
    // 16: "FileReadStream"
    // 1024: "PathCaseSensitive"
    // 2048: "Readonly"
    window.files_1 = files_1
    const filePaths = [
        '/fs/.vscode/settings.json',
        '/fs/.vscode/tasks.json',
        '/fs/.vscode/launch.json',
    ];
    const AUTH_KEY = "authKey";
    const IP_ADDRESS_KEY = "ipAddress";
    const VS_FILE_SYSTEM_KEY = "vsFileSystem";

    const rcloneAuth = 'Basic ' + localStorage.getItem(AUTH_KEY);
    const ipAddress = localStorage.getItem(IP_ADDRESS_KEY);
    // const fileSystem = localStorage.getItem(VS_FILE_SYSTEM_KEY) ;

    const params = new URLSearchParams(window.location.search)
    const fileSystem = params.has('fs') ? params.get('fs') : '';
    const remoteBasePath = params.has('remote') ? params.get('remote') : '';
    console.log("fileSystem", fileSystem, ipAddress, rcloneAuth);

    class FetchFileSystemProvider {
        constructor() {
            this.capabilities = 2 + 4 + 8 + 16 + 1014;// 2048 /* Readonly */ + 2 /* FileReadWrite */ + 1024 /* PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            this.openFiles = {};
            this.nextId = 0;
        }
        // working implementations
        async readFile(resource) {
            // console.log('FS.readFile', resource)
            try {
                const res = await fetch(resource.toString(true));
                if (res.status === 200) {
                    return new Uint8Array(await res.arrayBuffer());
                }
                throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
            }
            catch (err) {
                throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        // fake implementations
        async stat(resource, ...other) {
            // console.log('FS.stat', resource, other)
            if (filePaths.includes(resource.path) || resource.path.includes('/static-extension/')) {
                return {
                    type: files_1.FileType.File,
                    size: 0,
                    mtime: 0,
                    ctime: 0
                }
            }
            if (resource.path === '/fs') {
                return {
                    type: files_1.FileType.Directory,
                    size: 0,
                    mtime: 0,
                    ctime: 0
                }
            }
            let dirPath = resource.path.substr(4);
            if(remoteBasePath){
                dirPath = `${remoteBasePath}${dirPath ? '/' : ''}${dirPath}`;
            }
            // console.log("FilePath: ", dirPath);
            let actualPath = "";
            dirPath = dirPath.split("/");
            for(let i=0;i<dirPath.length-1;i++) {
                actualPath += dirPath[i];
                actualPath += "/";
            }
            if(actualPath.charAt(actualPath.length - 1) === "/") actualPath = actualPath.substr(0, actualPath.length-1);
            console.log("Actual Path", actualPath);


            const res = await fetch(`${ipAddress}operations/list?remote=${actualPath}&fs=${fileSystem}`, {
                method: 'POST',
                mode: "cors",
                headers: {
                    // 'Content-Type': 'application/json',
                    'Authorization': rcloneAuth
                }
            });
            // const res = await fetch('/fileStat' + resource.path);// resource.toString(true)
            if (res.status === 200) {
                let filePath = resource.path.substr(4);
                if(remoteBasePath)
                    filePath = `${remoteBasePath}${filePath ? '/' : ''}${filePath}`;

                const allFiles = await res.json();
                console.log('stat:', resource.path);
                const filtered = allFiles.list.filter((ele) => ele.Path === filePath);
                console.log('statArray:', filtered);

                if (filtered.length === 0) {
                    throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.FileNotFound);
                    // throw vscode_1.FileSystemError.FileNotFound(uri);
                    //throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                return {
                    type: filtered[0].IsDir ? files_1.FileType.Directory : files_1.FileType.File,
                    size: filtered[0].Size,
                    mtime: 0,
                    ctime: 0
                };
                // return {
                //     type: files_1.FileType.File,
                //     size: 4096,
                //     mtime: 0,
                //     ctime: 0
                // }
            }
            throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
        }
        watch(...args) {
            // console.log('FS.watch', ...args)
            return lifecycle_1.Disposable.None;
        }
        // error implementations
        writeFile(resource, _content, _opts) {
            // console.log('FS.writeFile', resource.path)
            throw new errors_1.NotImplementedError();
        }
        async readdir(resource) {
            // console.log('FS.readdir', resource.path)
            let actualPath = resource.path.substr(4);
            console.log("actual path:", actualPath);
            if(remoteBasePath){
                actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;
            }
            console.log("actual path:", actualPath);

            try {
                const res = await fetch(`${ipAddress}operations/list?remote=${actualPath}&fs=${fileSystem}`, {
                    method: 'POST',
                    mode: "cors",
                    headers: {
                        // 'Content-Type': 'application/json',
                        'Authorization': rcloneAuth
                    }
                });// resource.toString(true)
                if (res.status === 200) {
                    const r = await res.json();
                    console.log("Status --- ", res, r);
                    let out = [];
                    r.list.map(element => {
                        const isDir = element.IsDir ? files_1.FileType.Directory : files_1.FileType.File;
                        out.push([element.Name, isDir]);
                        // console.log(out);
                    });
                    return out;
                }
                throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
            }
            catch (err) {
                throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        readFileStream(resource) {
            const listenerMap = {}
            var stream = {
                on: (name, handler) => {
                    //console.log('readFileStream,on:',name)
                    if (!listenerMap[name]) { listenerMap[name] = []; }
                    listenerMap[name].push(handler)
                },
                trigger: (name, data) => {
                    listenerMap[name].forEach(handler => handler(data));
                }
            };
            (async () => {
                console.log('FS.readFileStream', resource.path);
                let actualPath = resource.path.substr(4);
                if(remoteBasePath){
                    actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;
                }

                try {
                    const res = await fetch(`${ipAddress}[${fileSystem}]/${actualPath}`,{
                        method: 'GET',
                        mode: "cors",
                        headers: {
                            // 'Content-Type': 'application/json',
                            'Authorization': rcloneAuth
                        }
                    });
                    if (res.status === 200) {
                        const data = new Uint8Array(await res.arrayBuffer());
                        stream.trigger('data', data);
                        stream.trigger('end');
                        return;
                    }
                    throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
                }
                catch (err) {
                    // console.log(err)
                    stream.trigger('error', err)
                    throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
                }

            })()
            return stream;
        }
        async mkdir(resource) {
            console.log('FS.mkdir', resource.path);
            let actualPath = resource.path.substr(4);
            actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;

            await fetch(`${ipAddress}operations/mkdir`,{
                method: 'POST',
                headers: {
                    'Authorization': rcloneAuth,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fs: `${fileSystem}`,
                    remote: actualPath,
                })
            })
        }
        async delete(resource, opts) {
            let actualPath = resource.path.substr(4);
            actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;
            console.log("Delete File", resource, opts);

            // use rclone deletefile to delete the file
            await fetch(`${ipAddress}operations/purge`, {
                method: 'POST',
                headers: {
                    'Authorization': rcloneAuth,
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({
                    fs: `${fileSystem}`,
                    remote: actualPath
                })
            })
            return;
        }
        async rename(from, to, opts) {
            // console.log('FS.rename', from, to)

            // await fetch('/rename', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         from, to, opts
            //     })
            // });
            throw new errors_1.NotImplementedError();
        }
        async open(resource, mode) {
            var id = this.nextId++;
            // console.log('FS.open', { resource, mode })
            this.openFiles[id] = {
                resource,
                mode,
            }
            return id;
        }
        async write(id, a, content, b, c) {
            let file = this.openFiles[id];
            const filePath = file.resource.path.substr(4);

            let formData = new FormData();
            const filePathSplits = filePath.split("/");
            formData.append('file', new Blob([content.buffer], {type:'text/plain'}), filePathSplits[filePathSplits.length-1]);

            this.openFiles[id].written = true;
            let actualPath = "";
            for(let i=0;i<filePathSplits.length-1;i++) {
                actualPath += filePathSplits[i];
                actualPath += "/";
            }
            // if(actualPath.charAt(actualPath.length - 1) === "/") actualPath = actualPath.substr(0, actualPath.length-1);
            console.log("Actual Path", actualPath);
            if(remoteBasePath){
                actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;
            }
            await fetch(`${ipAddress}operations/uploadfile?remote=${actualPath}&fs=${fileSystem}`, {
                method: 'POST',
                headers: {
                    'Authorization': rcloneAuth,
                },
                body: formData
            });
            // console.log('FS.write',...args)
        }
        async close(id) {
            // console.log('FS.close', id, this.openFiles[id])
            if (!this.openFiles[id].written) {
                let file = this.openFiles[id];
                const filePath = file.resource.path.substr(4);

                let formData = new FormData();
                const filePathSplits = filePath.split("/");
                formData.append('file', new Blob([content.buffer], {type:'text/plain'}), filePathSplits[filePathSplits.length-1]);

                this.openFiles[id].written = true;
                let actualPath = "";
                for(let i=0;i<filePathSplits.length-1;i++) {
                    actualPath += filePathSplits[i];
                    actualPath += "/";
                }
                // if(actualPath.charAt(actualPath.length - 1) === "/") actualPath = actualPath.substr(0, actualPath.length-1);
                console.log("Actual Path", actualPath);
                if(remoteBasePath){
                    actualPath = `${remoteBasePath}${actualPath ? '/' : ''}${actualPath}`;
                }
                await fetch(`${ipAddress}operations/uploadfile?remote=${actualPath}&fs=${fileSystem}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': rcloneAuth,
                    },
                    body: formData
                });
            }
            delete this.openFiles[id];
            return 1;
        }
    }
    exports.FetchFileSystemProvider = FetchFileSystemProvider;
});
//# __sourceMappingURL=webWorkerFileSystemProvider.js.map

//Unable to open 'testFile.js (read-only)': Unable to read file 'http:/fs/testFile.js' (TypeError: provider.readFileStream is not a function).