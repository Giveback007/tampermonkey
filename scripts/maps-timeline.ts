// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2024-04-10
// @description  try to take over the world!
// @author       You
// @match        https://timeline.google.com/maps/timeline*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

type ArrObj = {id: string, date: string, from: string, to: string, link: string };

// !MARK: State
const s = {
    boxIsOpen: true,
    arr: [] as ArrObj[],
    obj: {} as Partial<ArrObj>,
}

;(window as any).state = s;

function toCSV(table: string[][]) {
    return table.map(row => row.map(cell => {
            // We remove blanks and check if the column contains
            // other whitespace,`,` or `"`.
            // In that case, we need to quote the column.
            if (cell.replace(/ /g, '').match(/[\s,"]/))
                return '"' + cell.replace(/"/g, '""') + '"';
            else
                return cell;
        }).join(',')
    ).join('\n');
}

const wait = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

const randId = () => (Math.random() + '').split('.')[1];

const el = (id: string) => document.getElementById(id);

const elClick = (id: string, callback: () => any) => el(id)!.addEventListener('click', callback);

const { log } = console;

const newBtnHTML = /* html */`
    <div class="gm-style-mtc" style="float: left; position: relative;">
        <button
            draggable="false"
            aria-label="Show street map"
            title="Show street map"
            type="button"
            role="menuitemradio"
            aria-checked="false"
            aria-haspopup="true"
            style="background: none padding-box rgb(255, 255, 255); display: table-cell; border: 0px; margin: 0px; padding: 0px 17px; text-transform: none; appearance: none; position: relative; cursor: pointer; user-select: none; overflow: hidden; text-align: center; height: 40px; vertical-align: middle; color: rgb(86, 86, 86); font-family: Roboto, Arial, sans-serif; font-size: 18px; box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px; min-width: 36px;"
            id="toggle-box"
        >Toggle Box</button>
    </div>`;

const cornerBox = () => {
    return /* html */`
        <div
            id="corner-box"
            style="
                position: fixed;
                top: 0;
                right: 0;
                background-color: white;
                border: 1px solid #000;
                z-index: 10000;
                display: ${s.boxIsOpen ? '' : 'none'};"
        ></div>`;
}

// MARK: renderTable( )
const renderTable = () => {
    let table = '';
    [...s.arr, s.obj].forEach(x => {
        table += /* html */`
        <tr>
            <td><button id=${x?.id || ''}>X</button></td>
            <td>${x?.date || ''}</td>
            <td>${x?.from || ''}</td>
            <td>${x?.to || ''}</td>
            <td><a href=${x?.link || ''}>Link</a></td>
        </tr>`;

        if (!x.id) { debugger; throw 'err' }
        wait(0).then(() => elClick(x.id!, () => {
            if (s.obj.id === x.id) s.obj = { id: randId() };

            const idx = s.arr.findIndex(o => o.id === x.id);
            if (idx > -1) delete s.arr[idx];
            
            s.arr = s.arr.filter(x => x)
            wait(0).then(renderTable);
        }))
    });

    
    const tablehtml = /* html */`
        <table
            id="from-to-table"
            style="table-layout: fixed;border-collapse: collapse;"
        >
            <tr>
                <th>Del</th>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
            </tr>
            ${table}
        </table>
        <button id="export-table-row">Copy CSV to Clipboard</button>`

    const cornerBox = el('corner-box');
    if (!cornerBox) { debugger; throw 'err'; }

    cornerBox.innerHTML = tablehtml;
    wait(0).then(() => el("export-table-row")!.addEventListener('click', () => {
        const arr = s.arr.map(x => [x.date, x.from, x.to, x.link]);
        arr.forEach(a => log(arr));
        navigator.clipboard.writeText(toCSV(arr))
    }))
}



const addBtn = (o: { id: string; }) => /* html */ `
    <button
        id=${o.id}
    >+</button>`;

    // MARK: Bootstrap
wait(0).then(async () => {
    'use strict';

    const boxToggle = (isOpen: boolean = !s.boxIsOpen) => {
        const div = el('corner-box');
        if (!div) { debugger; throw 'err' };
            
        s.boxIsOpen = isOpen;
        div.style.display = isOpen ? '' : 'none';    
    }

    // MARK: on+click( )
    const onPlusClick = (x: {
        elm: HTMLElement;
        locName: string;
        addr: string;
        date: string;
    }) => {
        if (!s.obj.date) {
            s.obj = {
                id: randId(),
                date: x.date,
                from: x.addr
            }
        } else {
            s.obj.to = x.addr;
            s.obj.link = `https://www.google.com/maps/dir/${encodeURI(s.obj.from!)}/${encodeURI(x.addr)}/`;
            s.arr.push(s.obj as any);

            s.obj = { id: randId() };
        }



        renderTable();
    }

    let mapBtn: HTMLButtonElement;
    let mapBtnParent: HTMLButtonElement;

    // MARK: 'toggle-box'
    setInterval(() => {
        if (el('toggle-box')) return;

        mapBtn = Array.from(document.querySelectorAll('button')).find(x => x.innerText === 'Map')!;
        mapBtnParent = mapBtn?.parentElement?.parentElement as any;
        if (!mapBtnParent) return;

        mapBtnParent.insertAdjacentHTML('afterbegin', newBtnHTML);

        const btn: HTMLButtonElement = el('toggle-box') as any;
        btn.addEventListener('click', () => boxToggle());
    }, 750)


    // MARK: '+ btns'
    let btnIds: string[] = [];
    let lastDate: string;
    setInterval(() => {
        const x = document.querySelector('.timeline-wrapper .timeline-content > div');
        const dateElm = document.querySelector('.timeline-subtitle') as HTMLElement;
        if (!x || !dateElm) return;
        
        const date = new Date(dateElm.innerText).toISOString().split('T')[0]!;
        if (lastDate !== date) {
            lastDate = date;
            btnIds.forEach(id => el(id)?.remove());
            btnIds = [];
        }

        const z = Array.from(x.querySelectorAll('.timeline-item-title'))
            .map(a => [a, (a as any).innerText.split('\n')] as any)
            .filter(a => a[1].at(-1).includes('more_vert'))
            .map(([elm, [locName]]: [HTMLDivElement, string[]]) => {
                const parElm = elm.parentElement!;
                const addr = parElm.innerText.split('more_vert').at(-1).trim();

                return { elm: parElm, locName, addr }
            });

        z.forEach((o, i) => {
            const id = `add-csv-${date}` + i;
            if (el(id)) return;
            btnIds.push(id)

            o.elm.insertAdjacentHTML('beforeend', addBtn({ id }));
            el(id)?.addEventListener('click', () => onPlusClick({ date, ...o }))
        });
        
    }, 500)
    
    document.body.insertAdjacentHTML('beforeend', cornerBox());

    // MARK: table css
    const css = `
        #from-to-table {
            table-layout: fixed; /* Makes all columns equal width */
            border-collapse: collapse; /* Removes double borders */
        }
        #from-to-table th, 
        #from-to-table td {
            border: 1px solid black; /* Adds border to table cells */
            text-align: left; /* Aligns text to the left */
            padding: 8px; /* Adds some padding inside cells for better readability */
        }
        #from-to-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }`;

    // Create a new style element
    const styleSheet = document.createElement("style");
    // styleSheet.type = "text/css";
    styleSheet.innerText = css;

    // Append the style element to the head
    document.head.appendChild(styleSheet);

});