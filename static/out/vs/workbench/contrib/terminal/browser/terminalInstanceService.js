/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, terminal_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInstanceService = void 0;


    function createEvent(){
        const listeners = [];
        const event =   (listener,thisArg)=>{
            listener = thisArg ? listener.bind(thisArg) : listener
            listeners.push(listener)
            return {
                dispose: ()=>{
                    listenersa.splice(listeners.indexOf(listener), 1);
                }
            }
        }
        event.trigger = args=>{
            listeners.forEach(listener=>{
                try{ listener(args); }catch(err){ console.log(err); }
            });
        }
        return event;
    }

    let Terminal;
    let SearchAddon;
    let Unicode11Addon;
    let WebglAddon;
    class TerminalInstanceService {
        constructor() {
            this._onRequestDefaultShellAndArgs = new event_1.Emitter();
        }
        get onRequestDefaultShellAndArgs() { return this._onRequestDefaultShellAndArgs.event; }
        async getXtermConstructor() {
            if (!Terminal) {
                Terminal = (await new Promise((resolve_1, reject_1) => { require(['xterm'], resolve_1, reject_1); })).Terminal;
            }
            return Terminal;
        }
        async getXtermSearchConstructor() {
            if (!SearchAddon) {
                SearchAddon = (await new Promise((resolve_2, reject_2) => { require(['xterm-addon-search'], resolve_2, reject_2); })).SearchAddon;
            }
            return SearchAddon;
        }
        async getXtermUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await new Promise((resolve_3, reject_3) => { require(['xterm-addon-unicode11'], resolve_3, reject_3); })).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async getXtermWebglConstructor() {
            if (!WebglAddon) {
                WebglAddon = (await new Promise((resolve_4, reject_4) => { require(['xterm-addon-webgl'], resolve_4, reject_4); })).WebglAddon;
            }
            return WebglAddon;
        }
        createWindowsShellHelper() {
            return {
                onShellNameChange: createEvent(),
                getShellName: async ()=>'terminal',
                dispose: ()=>{},
            }
        }
        createTerminalProcess() {
            const terminal = {
                onProcessData: createEvent(),
                onProcessExit: createEvent(),
                onProcessReady: createEvent(),
                onProcessTitleChanged: createEvent(),
                onProcessOverrideDimensions: createEvent(),
                onProcessResolvedShellLaunchConfig: createEvent(),
                socket:undefined,
                
                start: ()=>{
                    const socket = terminal.socket = new WebSocket('ws://'+window.location.host+'/console')
                    socket.addEventListener('message',({data})=>{
                        terminal.onProcessData.trigger(data);
                    })
                    console.log('start terminal')
                    setTimeout(()=>{

                        terminal.onProcessReady.trigger({pid:1, cwd:'/'})
                    },100)
                },

                shutdown: (immidiate)=>{
                    console.log('shutdown terminal', immidiate);
                },
                input: (data)=>{
                    terminal.socket.send(data)
                    console.log('input terminal',data);
                    if(data === '\r'){
                        data = '\n\r';
                    }
                    terminal.onProcessData.trigger(data);
                },
                resize: (cols, rows) => {
                    console.log('resizeTerminal');
                },

                getInitialCwd: ()=>{return "/"},
                getCwd: ()=>{return "/"},
                getLatency: async () => 0,
            };
            return terminal;
            // export interface ITerminalChildProcess {
            //     onProcessData: Event<string>;
            //     onProcessExit: Event<number>;
            //     onProcessReady: Event<{ pid: number, cwd: string }>;
            //     onProcessTitleChanged: Event<string>;
            //     onProcessOverrideDimensions?: Event<ITerminalDimensions | undefined>;
            //     onProcessResolvedShellLaunchConfig?: Event<IShellLaunchConfig>;
            
            //     /**
            //      * Shutdown the terminal process.
            //      *
            //      * @param immediate When true the process will be killed immediately, otherwise the process will
            //      * be given some time to make sure no additional data comes through.
            //      */
            //     shutdown(immediate: boolean): void;
            //     input(data: string): void;
            //     resize(cols: number, rows: number): void;
            
            //     getInitialCwd(): Promise<string>;
            //     getCwd(): Promise<string>;
            //     getLatency(): Promise<number>;
            // }

            throw new Error('Not implemented');
        }
        getDefaultShellAndArgs(useAutomationShell) {
            return new Promise(r => this._onRequestDefaultShellAndArgs.fire({
                useAutomationShell,
                callback: (shell, args) => r({ shell, args })
            }));
        }
        async getMainProcessParentEnv() {
            return {};
        }
    }
    exports.TerminalInstanceService = TerminalInstanceService;
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, TerminalInstanceService, true);
});
//# __sourceMappingURL=terminalInstanceService.js.map