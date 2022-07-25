// ==UserScript==
// @name         YouTube ZenMode
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

// -- UTILS -- //
const { log } = console;

const resizeEvent = () => window.dispatchEvent(new Event('resize'));
// -- UTILS -- //

const controls = document.querySelector("#movie_player > div.ytp-chrome-bottom.style-scope.ytd-player > div.ytp-chrome-controls.style-scope.ytd-player > div.ytp-right-controls.style-scope.ytd-player");
const video = document.querySelector("#movie_player > div.html5-video-container.style-scope.ytd-player > video");
const page = document.querySelector("#page-manager");;

const style = document.createElement('style');
style.textContent = `
    .fill-screen {
        position: fixed !important;
        z-index: 9999 !important;
        top: 0px !important;
        left: 0px !important;
        background: black !important;
        max-height: initial !important;
        height: 100vh !important;
        width: 100vw !important;
    }
`;
document.getElementsByTagName('head')[0].appendChild(style);

let isFill = false;
document.addEventListener('keydown', (event) => {
    console.log('zen-mode');
    if (event.altKey && event.key === 'z') {
        isFill = !isFill;

        const container = document.querySelector("#player-theater-container");

        document.body.style.overflow = isFill ? 'hidden' : 'initial';
        container.classList[isFill ? 'add' : 'remove']('fill-screen');
        resizeEvent();
    }
});

setInterval(() => {
    if (isFill && document.body.style.overflow !== 'overflow')
        document.body.style.overflow = 'hidden';
}, 1000);