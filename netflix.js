// ==UserScript==
// @name         Netflix.js
// @namespace    https://github.com/Giveback007/tampermonkey
// @version      0.1
// @description  Language Reactor for Netflix additions
// @author       Giveback007
// @match        https://www.netflix.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=netflix.com
// @require      https://raw.githubusercontent.com/alvaromontoro/gamecontroller.js/master/dist/gamecontroller.min.js
// @grant        none
// ==/UserScript==

'use strict';

// -- GENERAL UTILS -- //
const { log, clear } = console;
clear();
log('hello world')

function debounceTimeOut() {
    let timeoutId = null;

    return (fct, ms) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (fct !== 'cancel')
            timeoutId = setTimeout(fct, ms || 0);
    }
}

const wait = (ms) =>
    new Promise((res) => setTimeout(() => res(), ms));
// -- GENERAL UTILS -- //



// -- APP UTILS -- //
const getPlayer = () => {
    const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
    const playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];
    return videoPlayer.getVideoPlayerBySessionId(playerSessionId);
}

const getWords = () => {
    const newWordsWrap = document.getElementById("lln-subs");
    if (!newWordsWrap || wordsWrapNode === newWordsWrap) return [];

    wordsWrapNode = newWordsWrap;
    selectedWord = -1;
    return [...wordsWrapNode.children]
        .filter(x => x.className.includes('lln-word'));
};

const highLightWords = (elements) => {
    elements.forEach(el => {
        const word = el.innerText.toLowerCase();
        if (wordsToLearn.has(word)) {
            el.style.textDecoration = 'underline';
            el.style.color = 'orange';
        }
    })
}

const onWordsChange = () => {
    words = getWords();
    highLightWords(words);
}
// -- APP UTILS -- //



// -- APP CONTROLS -- //
const wordLeft = () => {
    selectedWord--;
    if (selectedWord < 0) selectedWord = words.length - 1

    wordClick(selectedWord)
}

const wordRight = () => {
    selectedWord++
    if (selectedWord > words.length - 1) selectedWord = 0;
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

const toggleTranslationBlur = () => {
    const translations = [...document.querySelectorAll("#lln-translations .translationText")];
    if (!translations.length) return;

    translations.forEach(x => x.style.filter = x.style.filter ? '' : 'blur(0.25em)');
}

const togglePlayPause = () => {
    wordDictClose();
    const player = getPlayer();

    // getPlaying -> check if video is playing
    if (player.getPlaying())
        player.pause();
    else
        player.play();
}

const playerAddTime = (n) => {
    wordDictClose();
    getPlayer().seek(getPlayer().getCurrentTime() + n);
}

// "D" ->
const prevSub = () => {
    wordDictClose();
    document.querySelector("#lln-main-subs > div.lln-main-left.lln-main-aside.lln-autohide-me > div.lln-control-btn.lln-prev-sub-btn.tippy")?.click();
}

// "A" <-
const nextSub = () => {
    wordDictClose();
    document.querySelector("#lln-main-subs > div.lln-main-left.lln-main-aside.lln-autohide-me > div.lln-control-btn.lln-next-sub-btn.tippy")?.click();
}


const skipIntro = () => {
    const btn = document.querySelector("div.watch-video--skip-content > button");
    if (!btn) return;

    btn.click();
}

function toggleIsOnAuto() {
    isOnAuto = !isOnAuto;

    const btn = document.getElementById("auto-play-subs");
    if (isOnAuto) {
        btn.style.background = '';
    } else {
        btn.style.background = 'grey';
    }
}
// -- APP CONTROLS -- //



// -- STATE -- //
let isOnAuto = false;
let options;
let parentNode;
let observer;
let timePaused = null;
let wordsWrapNode;
let selectedWord = -1;
let words = [];
// -- STATE -- //



// -- INTERVAL -- //
setInterval(() => {
    const player = getPlayer();
    if (!player) return;

    const isPaused = player.isPaused();
    skipIntro();

    if (!isPaused)
        timePaused = null;
    else if (isPaused && !timePaused)
        timePaused = Date.now();

    if (isOnAuto && (timePaused + (words.length * 1500) < Date.now())) player.play();

    const newParentNode = document.querySelector("#lln-main-subs");
    if (!newParentNode || parentNode === newParentNode) return;
    parentNode = newParentNode;

    options = document.querySelector("#lln-options-modal");
    if (options && !document.getElementById("auto-play-subs")) {
        options.innerHTML +=
            `<button id="auto-play-subs" class="lln-btn" style="margin-right: 12px; padding: 0 26px; line-height: 36px; background: grey">Auto</button>`;

        const btn = document.getElementById("auto-play-subs");
        if (btn) btn.addEventListener('click', toggleIsOnAuto);
    }

    onWordsChange();

    if (observer) observer.disconnect();
    observer = new MutationObserver(onWordsChange);
    observer.observe(parentNode, { attributes: false, childList: true, subtree: true });
}, 500);
// -- INTERVAL -- //



// -- GAMEPAD -- //
gameControl.on('connect', (gp) => {
    const keyMap = new Map(Object.entries({
        ...gameCtrlBtns.reduce((obj, btn) => ({...obj, [btn]: () => log(btn)}), {}),

        'start': skipIntro,

        'l1': () => playerAddTime(-10000),
        'r1': () => playerAddTime(+10000),

        'l2': prevSub,
        'r2': nextSub,

        'button0': togglePlayPause, // B
        'button3': toggleTranslationBlur, // X

        'button12': wordRepeat, // UP
        'button13': wordDictClose, // DOWN
        'button14': wordLeft, // LEFT
        'button15': wordRight, // RIGHT
    }));

    for (const [gpBtn, fct] of keyMap) {
        let time = null;
        let isPressing = false;
        const debounce = debounceTimeOut();

        let isHolding = false;
        const btnHolding = async () => {
            if (isHolding) return;
            isHolding = true;
            while (isHolding) {
                fct();
                await wait(100)
            }
        }

        gp.on(gpBtn, () => {
            debounce(() => {
                isPressing = false;
                isHolding = false;
                time = null;
            }, 50);

            if (time && time + 350 < Date.now()) {
                btnHolding()
            } else if (!time) {
                time = Date.now();
            }

            if (isPressing) return;

            isPressing = true;
            fct();
        }, 50);
    }
});
// -- GAMEPAD -- //



// -- DATA --//
const gameCtrlBtns = [
    "button0", "button1", "button2", "button3", "button4",
    "button5", "button6", "button7", "button8", "button9",
    "button10", "button11", "button12", "button13", "button14",
    "button15", "button16",

    "up", "down", "right", "left",
    "up0", "down0", "right0", "left0",
    "up1", "down1", "right1", "left1",

    "l1", "l2", "r1", "r2",

    "start", "select", "power",
]

const wordsToLearn = new Set([
    'hecho',   'tan',     'parece',  'trabajo', 'cosas',    'nos',
    'quién',   'estar',   'están',   'alguien', 'estamos',  'uno',
    'padre',   'sin',     'ir',      'sobre',   'siempre',  'cuando',
    'sabe',    'día',     'gente',   'otra',    'ahí',      'sus',
    'noche',   'puedes',  'ni',      'dijo',    'nosotros', 'quiere',
    'nadie',   'mundo',   'estado',  'ellos',   'podría',   'mismo',
    'señor',   'tenía',   'dónde',   'tener',   'poco',     'sea',
    'mira',    'hablar',  'otro',    'madre',   'fuera',    'había',
    'lugar',   'tal',     'oh',      'gran',     'han',
    'visto',   'nuestro', 'cosa',    'gusta',   'sido',     'antes',
    'podemos', 'mis',     'dinero',  'debe',    'allí',     'buena',
    'parte',   'mujer',   'dice',    'momento', 'tienen',   'desde',
    'dios',    'seguro',  'nuestra', 'nuevo',   'amigo',
    'tres',    'hasta',   'será',    'hijo',    'hemos',    'acuerdo',
    'haber',   'hoy',     'después', 'aún',     'hizo',     'menos',
    'familia', 'gracias', 'favor',   'buen',    'pasa',     'realmente',
    'mañana',  'mal',     'dicho',
    "ese",
    "esos",
    "aquellas",
    "antes",
    "le",
    "me",
    "hay",
    "cómo",
    "nada",
    "hacer",
    "estaba",
    "nunca",
    "nos",
    "te",
    "conocer",
    "seguro",
]);
// -- DATA --//