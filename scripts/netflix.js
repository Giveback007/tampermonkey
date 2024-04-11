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
const btns = {
    Start: null,
    Select: null,

    Down: null,
    Left: null,
    Up: null,
    Right: null,

    B: null,
    A: null,
    Y: null,
    X: null,

    L1: null,
    L2: null,
    R1: null,
    R2: null,
}

window.addEventListener("gamepadconnected", (e) => {
    const tinyGamepad = e.gamepad.id === "Bluetooth Wireless Controller    (Vendor: 2dc8 Product: 3230)";

    if (tinyGamepad) {
        btns.Start = 'button11';
        btns.Select = 'button10';

        btns.Down = 'down0';
        btns.Left = 'left0';
        btns.Up = 'up0';
        btns.Right = 'right0'

        btns.B = 'button1';
        btns.A = 'button0';
        btns.X = 'button3';
        btns.Y = 'l1';

        btns.L2 = 'l2';
        btns.R2 = 'r2';
    } else {
        btns.Start = 'start'

        btns.L1 = 'l1';
        btns.r1 = 'r1';

        btns.l2 = 'l2';
        btns.r2 = 'l2';

        btns.B = 'button0';
        btns.X = 'button3';

        btns.Up = 'button3';
        btns.Down = 'button13';
        btns.Left = 'button14';
        btns.Right = 'button15';
    }
});

gameControl.on('connect', async (gp) => {
    await wait(0);

    const keyMap = new Map(Object.entries({
        ...gameCtrlBtns.reduce((obj, btn) => ({...obj, [btn]: () => log(btn)}), {}),

        [btns.Start]: skipIntro,

        [btns.L1]: () => playerAddTime(-10000),
        [btns.R1]: () => playerAddTime(+10000),

        [btns.L2]: prevSub,
        [btns.R2]: nextSub,

        [btns.B]: togglePlayPause, // B
        [btns.X]: toggleTranslationBlur, // X

        [btns.Up]: wordRepeat, // UP
        [btns.Down]: wordDictClose, // DOWN
        [btns.Left]: wordLeft, // LEFT
        [btns.Right]: wordRight, // RIGHT
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
    "nunca",
    "alguien",
    "feliz",
    "necesidad",
    "pasado",
    "ningún",
    "volver",
    "nada",
    "por",
    "dónde",
    "cosa",
    "toda",
    "le",
    "están",
    "principio",
    "éxito",
    "al",
    "pared",
    "cualquier",
    "propósito",
    "bastante",
    "mi",
    "nombre",
    "cara",
    "paso",
    "se",
    "fuerza",
    "cuando",
    "verdad",
    "muerte",
    "sitio",
    "cuidado",
    "pasa",
    "carrera",
    "idea",
    "luego",
    "público",
    "cuál",
    "cuyo",
    "aunque",
    "desde",
    "me",
    "corto",
    "delgado",
    "espíritu",
    "salida",
    "parece",
    "periódico",
    "imagen",
    "zona",
    "papel",
    "dios",
    "duda",
    "acto",
    "pueblo",
    "aire",
    "equipo",
    "acuerdo",
    "así",
    "relación",
    "carta",
    "estudio",
    "época",
    "campo",
    "tamaño",
    "conjunto",
    "par",
    "carácter",
    "grado",
    "cuántos",
    "dolor",
    "empresa",
    "estaba",
    "hasta",
    "allá",
    "sé",
    "cómo",
    "vidrio",
    "medida",
    "ciencia",
    "falta",
    "casi",
    "reunión",
    "te",
    "cuadro",
    "quiénes",
    "hace",
    "antiguo",
    "seguro",
    "puesto",
    "claro",
    "soy",
    "alegre",
    "tacaño",
    "política",
    "madera",
    "flaco",
    "país",
    "vez",
    "estar",
    "fuego",
    "cierto",
    "dispuesto",
    "jamás",
    "voluntad",
    "estar",
    "lado",
    "seguir",
    "ambos",
    "modo",
    "mayor",
    "siguiente",
    "demás",
    "os",
    "aquellos",
    "alguno",
    "feo",
    "ustedes",
    "digas",
    "acá",
    "allí",
    "bonito",
    "contento",
    "enojado",
    "lindo",
    "sabroso",
    "cuero",
    "lugar",
    "persona",
    "poder",
    "proyecto",
    "partido",
    "a",
    "pobre",
    "verdadero",
    "próximo",
    "personal",
    "muerto",
    "va",
    "nos",
    "usted",
    "ti",
    "aprender",
    "barco",
    "conocer",
    "apredizaje",
    "barato",
    "débil",
    "ni",
    "abrir",
    "quien",
    "puerta",
    "gerente",
    "tema",
    "tarea",
    "como",
    "hacer",
    "antes",
    "buscar",
    "vale",
    "moreno",
    "vida",
    "estado",
    "piedra",
    "su",
    "alto",
    "segundo",
    "anterior",
    "actual",
    "era",
    "algo",
    "he",
    "haber",
    "estoy",
    "este",
    "sueño",
    "brazo",
    "entrada",
    "bajo",
    "si",
    "ese",
    "esos",
    "gordo"
]);
// -- DATA --//