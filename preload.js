// const path = require('path')
// const fs = require('fs')

let snippetDataCache = []
let tabListCache = []

window.exports = {
    'search_snippet': {
        mode: 'list',
        args: {
            enter: (action, callbackSetList) => {
                snippetDataCache = []
            },
            search: (action, searchWord, callbackSetList) => {
                if (!searchWord) return callbackSetList()
                searchWord = searchWord.toLowerCase()
                return callbackSetList(snippetDataCache.filter(x => x.lowTitle.includes(searchWord)))
            },
            select: (action, itemData) => {
                window.utools.hideMainWindow()
                shell.openExternal(itemData.description).then(() => {
                    window.utools.outPlugin()
                })
            },
            placeholder: "搜索"
        }
    }
}