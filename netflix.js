// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.netflix.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=netflix.com
// @require      https://raw.githubusercontent.com/alvaromontoro/gamecontroller.js/master/dist/gamecontroller.min.js
// @grant        none
// ==/UserScript==

'use strict';
const { log, clear } = console;

// -- INIT -- //
let parentNode;
let observer;

setInterval(() => {

    const node = document.querySelector("#lln-main-subs");
    if (!node || parentNode === node) return;
    log('Start-Controls');
    parentNode = node;
    observerCallback();

    if (observer) observer.disconnect();
    observer = new MutationObserver(observerCallback);
    observer.observe(parentNode, { attributes: false, childList: true, subtree: true });
}, 1000);
// -- INIT -- //

let wordsWrapNode;
let selectedWord = -1;
let words = [];

const observerCallback = () => {
    const newWordsWrap = document.getElementById("lln-subs");
    if (!newWordsWrap || wordsWrapNode === newWordsWrap) return;

    wordsWrapNode = newWordsWrap;
    selectedWord = -1;
    words = [...wordsWrapNode.children]
        .filter(x => x.className.includes('lln-word'));
};

const wordLeft = () => {
    if (selectedWord > 0) selectedWord--;
    wordClick(selectedWord)
}

const wordRight = () => {
    if (selectedWord < words.length - 1) selectedWord++;
    wordClick(selectedWord)
}

const wordRepeat = () => {
    if (selectedWord < 0 || selectedWord > words.length - 1) return;
    wordClick(selectedWord)
}

const wordClick = (idx) => {
    if (!words[idx]) return;
    words[idx].click();
}

const wordDictClose = () => {
    const closeBtn = document.querySelector("#appMountPoint > div > div > div.watch-video > div.lln-full-dict-wrap > div > div.close-dict");
    if (closeBtn) closeBtn.click();
}

const togglePlayPause = () => {
    wordDictClose();

    const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
    const playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];
    const player = videoPlayer.getVideoPlayerBySessionId(playerSessionId);

    // getPlaying -> check if video is playing
    if (player.getPlaying())
        player.pause();
    else
        player.play();
}

gameControl.on('connect', (gp) => {
    const keyMap = new Map(Object.entries({
        'button0': togglePlayPause,
        'button12': wordRepeat,
        'button13': wordDictClose,
        'button14': wordLeft,
        'button15': wordRight,
    }));

    for (const [gpBtn, fct] of keyMap) {
        let didPress = false;
        const debounce = debounceTimeOut();

        gp.on(gpBtn, () => {
            debounce(() => didPress = false, 50);
            if (didPress) return;

            didPress = true;
            fct();
        }, 50);
    }
});

function debounceTimeOut() {
    let timeoutId = null;

    return (fct, ms) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (fct !== 'cancel')
            timeoutId = setTimeout(fct, ms || 0);
    }
}
