const fs = require('fs')
const electron = require('electron')
const child_process = require("child_process")
const os = require('os');
const path = require("path")

ctlKey = utools.isMacOs() ? 'command' : 'control'


let toSleepShellCode = ms => {
    var cmd, tempFilePath
    if (utools.isWindows()) {
        tempFilePath = getShellTempFile('vbs')
        cmd = `echo set ws=CreateObject("Wscript.Shell") > ${tempFilePath} && echo Wscript.sleep ${ms} >> ${tempFilePath} && cscript /nologo ${tempFilePath}`
    } else {
        cmd = `sleep ${ms / 1000}`
    }
    return cmd
}


getShellTempFile = ext => {
    return path.join(os.tmpdir(), `snippetShellTemp.${ext}`)
}


let func = {
    readClip: () => {
        return electron.clipboard.readText();
    },

    writeClip: (text) => {
        electron.clipboard.writeText(text);
    },

    // 模拟粘贴操作
    simulatePaste: () => {
        utools.simulateKeyboardTap('v', ctlKey);
    },

    includesAll: (raw, kws) => {
        for (let k of kws) {
            if (!raw.includes(k)) {
                return false;
            }
        }
        return true;
    },

    sleep: (ms) => {
        var start = new Date().getTime()
        try {
            // node 16.13.1
            child_process.execSync(toSleepShellCode(ms), {timeout: ms, windowsHide: true})
        } catch (ex) {
        }
        var end = new Date().getTime()
        return (end - start)
    },
}

let snippetDataCache = []


window.exports = {
    'snippet_search': {
        mode: 'list',
        args: {
            enter: (action, callbackSetList) => {
                let mdPath = utools.dbStorage.getItem('markdown_path');
                if (!mdPath) {
                    let choice = utools.showOpenDialog({
                        filters: [{ 'name': 'snippet', extensions: ['md'] }],
                        properties: ['openFile']
                    });
                    if (!choice){
                        return;
                    }
                    mdPath = choice[0]
                }

                let raw = "";
                try {
                    raw = fs.readFileSync(mdPath, { encoding: 'utf8' });
                } catch (e) {
                    callbackSetList([{
                        title: "Failed to read file, is it utf-8 encoding ?" + e,
                        description: mdPath
                    }])
                    return;
                }

                utools.dbStorage.setItem('markdown_path', mdPath);

                let blocks = raw.split(/#\s/)
                    .filter(i => i.trim() !== "");

                snippetDataCache = blocks.map(b => {
                    let rows = b.split(/\n/).filter(r => !r.startsWith("```"));
                    return {
                        title: rows[0],
                        description: rows.slice(1).join("\n")
                    }
                });

                callbackSetList(snippetDataCache)
            },
            search: (action, searchWord, callbackSetList) => {
                if (!searchWord) {
                    return callbackSetList(snippetDataCache)
                }
                searchWord = searchWord.toLowerCase()
                let kws = searchWord.split(/\s/).filter(i => i.trim() !== "");
                return callbackSetList(snippetDataCache.filter(item => func.includesAll(item.title, kws)))
            },
            select: (action, item) => {
                try {
                    let oldClip = func.readClip();
                    func.writeClip(item.description);
                    utools.hideMainWindow()
                    func.simulatePaste();
                    func.sleep(300)
                    func.writeClip(oldClip);
                } catch (e) {
                    utools.showNotification(JSON.stringify(e))
                }

            },
            placeholder: "Search"
        }
    },
    'snippet_setting': {
        mode: 'list',
        args: {
            enter: (action, callbackSetList) => {
                let subInput = "";
                utools.setSubInput(({text}) => {
                    subInput = text;
                }, "Markdown file path");

                document.addEventListener('keydown', event => {
                    if (event.keyCode === 13) {
                        try {
                            fs.readFileSync(subInput, {encoding: 'utf8'});
                            utools.dbStorage.setItem('markdown_path', subInput);
                            utools.hideMainWindow();
                        } catch (e) {
                            callbackSetList([
                                {
                                    title: "Failed to read file, is it utf-8 encoding ?",
                                    description: subInput
                                },
                                {
                                    description: e.toString()
                                }
                            ])
                        }
                    }
                });

            }
        }
    }
}






