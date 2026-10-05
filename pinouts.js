document.addEventListener("DOMContentLoaded", () => {
    initPinoutVisualizer();
});

const initPinoutVisualizer = () => {
    const boardSelect = document.querySelector("#pinout-board-select");
    const legendChips = document.querySelectorAll(".legend-chip");
    const leftCol = document.querySelector("#pin-column-left");
    const rightCol = document.querySelector("#pin-column-right");
    const boardTitle = document.querySelector("#pinout-board-title");
    const boardSub = document.querySelector("#pinout-board-subtitle");
    const detailName = document.querySelector("#selected-pin-name");
    const detailNum = document.querySelector("#selected-pin-num");
    const detailType = document.querySelector("#selected-pin-type");
    const detailDesc = document.querySelector("#selected-pin-desc");
    const tableBody = document.querySelector("#pinout-table-body");
    const detailSafety = document.querySelector("#selected-pin-safety")

    let activeFilter = "all";
    let currentBoard = null;

    const pinColors = {
        power : "var(--pin-power)",
        gnd : "var(--pin-gnd)",
        gpio: "var(--pin-gpio)",
        adc : "var(--pin-adc)",
        i2c : "var(--pin-i2c)",
        spi : "var(--pin-spi)",
        uart : "var(--pin-uart)", 
        pwm : "var(--pin-pwm)",
    };

    const getPinColor = (type) => pinColors[type] ?? "#94a3b8";

    const populateBoardSelect = () => {
        if (!boardSelect) return;
        boardSelect.innerHTML = HARDWARE_DATA.boards.map(({ id, name, architecture}) => `
        <option value = "${id}">${escapeHtml(name)} (${architecture}) </option>
        `).join("");

        const boardParam = new
        URLSearchParams(window.location.search).get("board");
        if (boardParam && HARDWARE_DATA.boards.some((b) => b.id === boardParam)) {
            boardSelect.value = boardParam;
        }
    };

    const loadBoard = (boardId) => {
        currentBoard = HARDWARE_DATA.boards.find((b) => b.id === boardId) ?? HARDWARE_DATA.boards[0];
        if (!currentBoard?.pinout) return;

        if (boardTitle) boardTitle.textContent = currentBoard.name;
        if (boardSub) boardSub.textContent = `${currentBoard.vendor} | ${currentBoard.operatingVoltage} Logic | ${currentBoard.gpioCount} GPIOs`;

        renderDiagram();
        renderTable();

        if (currentBoard.pinout.length>0) {
            selectPin(currentBoard.pinout[0]);
        }
    };

    const createPinElement = (pin, isRight) => {
        const isDimmed =  activeFilter !== "all" && pin.type !==activeFilter;
        const color = getPinColor(pin.type);

        return `
           <div class= "pin-row ${isRight ? `pin-row-right` : ``} ${isDimmed ? `dimmed` : ``}" data-pin="${pin.pin}">
           <div class="pin-indicator"></div>
           <span class="pin-num">${pin.pin}</span>
           <span class="pin-name">${escapeHtml(pin.name)}</span>
           </div>
           `;
    };
    const renderDiagram = () => {
        if (!leftCol || !rightCol  || !currentBoard) return;

        const { pinout } = currentBoard;
        const half = Math.ceil(pinout.length / 2);
        const leftPins = pinout.slice(0, half);
        const rightPins = pinout.slice(half);

        leftCol.innerHTML = leftPins.map((pin) => createPinElement(pin,false)).join("");
        rightCol.innerHTML = rightPins.map((pin) => createPinElement(pin,true)).join("")
        attachPinEvents();

    };

    const renderTable = () => {
        if (!tableBody || !currentBoard) return;

        tableBody.innerHTML = currentBoard.pinout.map((pin) => { 
            const isDimmed = activeFilter !== "all" && pin.type !== activeFilter
            const color = getPinColor(pin.type);

            return `
            <tr class="${isDimmed ? 'dimmed': ''}">
              <td>${pin.pin}</td>
              <td>
               <span></span>
               ${escapeHtml(pin.name)}
              </td>
              <td><span class = "badge"> ${pin.type.toUpperCase()}</span></td>
              <td>${escapeHtml(pin.desc)}</td>
            </tr> 
              `;
        
        }).join("");
    };

    const selectPin = (pin) =>{
        document.querySelectorAll(".pin-row").forEach((el) => {
            el.classList.toggle("selected", parseInt(el.dataset.pin) === pin.pin);
        });

        if (detailName) detailName.textContent = pin.name;
        if (detailNum) detailNum.textContent = `Pin #${pin.pin}`;
        if (detailType) {
            detailType.textContent = pin.type.toUpperCase();
            detailType.style.backgroundColor = getPinColor(pin.type);
        }

    if (detailDesc) detailDesc.textContent = pin.desc;
    if (detailSafety) {
        const safetyRules = {
            power: "Power delivery Pin, Observe strict current limits",
            gnd: "common system reference ground",
            default: currentBoard.operatingVoltage === "5V"
            ? "5.0V TTL Logic Level tolerant."
            : "Standard 3.3V Logic Level. Maximum current sink/source 12-20mA"              
        };
        detailSafety.textContent = safetyRules[pin.type] ??
        safetyRules.default;
    } 
};
    const attachPinEvents = () => {
        document.querySelectorAll(".pin-row").forEach((el) => {
            const handler = () => {
                const pinNum = parseInt(el.dataset.pin);
                const pin = currentBoard.pinout.find((p) => p.pin === pinNum);
                if (pin) selectPin(pin);
            };
        
        el.addEventListener("click", handler);
        el.addEventListener("mouseenter", handler);
        }); 
    };

    legendChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            legendChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.type;
            renderDiagram();
            renderTable();
        });
    });

    boardSelect?.addEventListener("change", (e) => {
        loadBoard(e.target.value);
    });

    populateBoardSelect();
    if (boardSelect?.value) {
        loadBoard(boardSelect.value);
    }
};            