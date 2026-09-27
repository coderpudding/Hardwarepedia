document.addEventListener("DOMContentLoaded", () => {
    initCompareMatrix();
});

const initCompareMatrix = () => {
    const select1 = document.querySelector("#compare-board-1");
    const select2 = document.querySelector("#compare-board-2");
    const select3 = document.querySelector("#compare-board-3");
    const matrixContainer = document.querySelector("#compare-matrix-container");  
    
    if (!select1 || !select2 || !matrixContainer) return;

    const populateSelects = () => {
        const optionsHtml = HARDWARE_DATA.boards.map(({ id, name }) =>  `<option value= "${id}">${escapeHtml(name)}</option>`).join("");
        select1.innerHTML = optionsHtml;
        select2.innerHTML = optionsHtml;
        if (select3) {
            select3.innerHTML = `<option value="">-- None (2-way compare) --</option>${optionsHtml}`;
        }

        const params = new URLSearchParams(window.location.search);
        const b1 = params.get("b1") || "esp32-wroom-32";
        const b2 = params.get("b2") || "raspberry-pi-pico-w";
        const b3 = params.get("b3") || "";

        if (HARDWARE_DATA.boards.some((b) => b.id === b1)) select1.value = b1;
        if (HARDWARE_DATA.boards.some((b) => b.id === b2)) select2.value = b2;
        if (select3 && b3 && HARDWARE_DATA.boards.some((b)=> b.id === b3))select3.value = b3;
    };

    const renderMatrix = () => {
        const board1 = HARDWARE_DATA.boards.find(({ id }) => id === select1.value) ?? HARDWARE_DATA.boards[0];
        const board2 = HARDWARE_DATA.boards.find(({ id }) => id === select2.value) ?? HARDWARE_DATA.boards[1];
        const board3 = select3?.value ? HARDWARE_DATA.boards.find(({ id }) => id === select3.value) : null;
        const activeBoards = [board1, board2, board3].filter(Boolean);

        const attributes = [
            { key: "vendor", label: "Manufacturer / Vendor"},
            { key: "category", label: "Device Category", transform: (v) => v.toUpperCase()},
            { key: "architecture", label: "CPU Architecture"},
            { key: "cores", label: "Processing Cores", transform: (v) => `${v} Core(s)`},
            { key: "clockSpeed", label: "Clock Frequency" },
            { key: "sram", label: "SRAM Memory" },
            { key: "flash", label: "Flash Memory" },
            { key: "psram", label: "PSRAM (External)" },
            { key: "operatingVoltage", label: "Logic Voltage" },
            { key: "inputVoltage", label: "Input Voltage Range" },
            { key: "activeCurrent", label: "Active Current" },
            { key: "sleepCurrent", label: "Deep Sleep Current" },
            { key: "wifi", label: "Wi-Fi Networking" },
            { key: "bluetooth", label: "Bluetooth" },
            { key: "gpioCount", label: "Total GPIO Count", transform: (v) => `${v} Pins`},
            { key: "adcChannels", label: "ADC Channels" },
            { key: "dacChannels", label: "DAC Channels" }
        ];

        const theadHtml =  `
        <thead>
        <tr>
         <th> Specification Feature</th>
         ${activeBoards.map(({id, name, vendor}) =>`
         <th>
             <div>${escapeHtml(name)}</div>
             <div>${escapeHtml(vendor)}</div>
             <a href="board-detail.html?id=${encodeURIComponent(id)}" class="btn btn-secondary btn-sm">Datasheet</a>
         </th>
          `).join("")}
        </tr>
        </thead>
        `; 

        const tbodyHtml = attributes.map(({key, label, transform}) => {
            const values = activeBoards.map((b) => {
                const raw = b[key];
                return transform ? transform(raw) : raw;
            });

            const isDiff = new Set(values).size > 1;
            return `
            <tr>
              <td>${escapeHtml(label)}</td>
              ${values.map((v) => `
                <td>
                ${escapeHtml(v)}
                </td>
                `).join("")}
            </tr>
            `;
        }).join("");

        matrixContainer.innerHTML = `
        <table class="compare-matrix-table">
         ${theadHtml}
         <tbody>
          ${tbodyHtml}
          </tbody>
        </table>
        `;
    };

    populateSelects()
    renderMatrix();

    [select1, select2, select3].forEach((sel) =>sel?.addEventListener("change", renderMatrix));
};