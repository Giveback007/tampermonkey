// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://coliving.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=coliving.com
// @grant        none
// ==/UserScript==

'use strict';

const { log } = console;
// setInterval(() => log(Date.now()), 1000);

const searchNearMeBtn = `<button id="search-near-me" type="button" class="z-20 flex p-3 rounded bg-gray-200 my-1 ml-auto">
    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 my-auto mr-1"><circle cx="12" cy="12" r="4"></circle><path d="M13 4.069V2h-2v2.069A8.01 8.01 0 0 0 4.069 11H2v2h2.069A8.008 8.008 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path></svg>
    <span>Search Near Me</span>
</button>`;

if (window.location.href === 'https://coliving.com/') {
    const searchContainer = document.querySelector("body > div:nth-child(4) > div:nth-child(1) > div.mx-auto > div > div.relative.px-4.py-24.sm\\:px-6.sm\\:py-32.lg\\:pt-96.lg\\:pb-20.lg\\:px-8.text-center > div");
    searchContainer.innerHTML += searchNearMeBtn;

    const el = document.getElementById('search-near-me');
    el.addEventListener('click', () => window.location.assign("https://coliving.com/north-america"));
} else if (window.location.href === 'https://coliving.com/north-america') {
    history.pushState({},"URL Mock","https://coliving.com/map-search");
    document.querySelector("#content > h1").innerText = 'Coliving Near You';

    const extras1 = document.querySelector("#content > div:nth-child(2)");
    if (extras1.innerHTML.includes('Filter on location')) extras1.remove();

    const mapBtn = document.querySelector("#content > div.z-10 > div.flex.bg-white.overflow-auto.shadow-sm.py-3 > div:nth-child(1) > div.mr-3.relative.px-2.px-3.border.border-gray-200.hover\\:border-gray-900.cursor-pointer.inline-flex.items-center.rounded-full.h-9.whitespace-nowrap.text-sm.font-light");
    if (mapBtn) mapBtn.click();

    const content = document.querySelector("#content");
    const mapWrap = document.querySelector("#listings-map-wrap");
    const mapEl = mapWrap.querySelector('.map');

    navigator.geolocation.getCurrentPosition(function(position) {
        if (!L || !map) return console.error('Leaflet vars not set');

        const { latitude, longitude } = position.coords;
        const latLng = [latitude, longitude];

        new L.marker(latLng).addTo(map);

        map.setView(latLng, 8);
        setTimeout(() => map.fireEvent('dragend'), 200);

    });


    // content.className = 'px-4 fixed top-20 left-0 h-screen';
    // content.style.zIndex = 29;
    // content.style.background = 'white';

    // mapWrap.className = 'fixed top-0 left-0 right-0';
    // mapWrap.style.zIndex = 28;

    // mapEl.className += ' h-screen';
}
