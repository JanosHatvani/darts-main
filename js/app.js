const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const center = 250;
const radius = 250;

let players = [];
let currentPlayerIndex = 0;
let checkoutMode = "single";
let heatmap = [];
let throwHistory = [];
let finishCounter = 0;

const numbers = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

class Player {
  constructor(name){
    this.name = name;
    this.score = 501;
    this.lastScore = 501;  
    this.throws = [];
    this.stats = {};
    this.finishOrder = null; 
    this.finished = false; //alepértelmezett állapot player
    this.roundStartScore = this.score; // kör eleji pontszám
  }

  addThrow(label,score){
    this.throws.push({label,score});
    this.score-=score;
    if(!this.stats[label]) this.stats[label]=0;
    this.stats[label]++;
  }

  getAverage(){
    if (this.throws.length === 0) return "0.00";

    let rounds = [];
    let currentRoundScore = 0;

    this.throws.forEach((t, index) => {
        currentRoundScore += t.score;

        // 3 dobás = 1 kör, vagy ha ez az utolsó dobás
        if ((index + 1) % 3 === 0 || index === this.throws.length - 1) {
        rounds.push(currentRoundScore);
        currentRoundScore = 0;
        }
    });


  const total = rounds.reduce((a, b) => a + b, 0);
  return (total / rounds.length).toFixed(2);
}

  getDoubleCount(){
    return this.throws.filter(t=>t.label.startsWith("D") || t.label==="DB").length;
  }
  getRounds(){
  const rounds = [];
    let current = [];

    this.throws.forEach(t => {
        current.push(t);
        if (current.length === 3) {
        rounds.push(current);
        current = [];
        }
    });

    if (current.length > 0) rounds.push(current);
    return rounds;
    }

  getTripleCount(){
    return this.throws.filter(t=>t.label.startsWith("T")).length;
  }

  getThrowStats(){
    const s={};
    this.throws.forEach(t=>{
      if(!s[t.label]) s[t.label]=0;
      s[t.label]++;
    });
    return s;
  }
}

//kezdőfelület
const startPanel=document.getElementById("startPanel");
const gamePanel=document.getElementById("gamePanel");
const rulesofdarts = document.getElementById("rulesofdarts");

const startGameBtn=document.getElementById("startGame");
const statsContent=document.getElementById("statsContent");

let startingScore = 501; // alapértelmezett

startGameBtn.addEventListener("click", () => {
    players = [];
    const count = parseInt(playerCountInput.value);

    startingScore = parseInt(document.getElementById("startingScore").value); 

    for (let i = 0; i < count; i++) {
        const name = document.getElementById("playerName" + i).value || ("Player" + (i+1));
        const p = new Player(name);
        p.score = startingScore;  // kezdőpont
        players.push(p);
    }

  checkoutMode = document.getElementById("checkoutMode").value;
  currentPlayerIndex = document.getElementById("randomStart").checked
    ? Math.floor(Math.random() * players.length)
    : 0;

  startPanel.style.display = "none";
  gamePanel.style.display = "block";

  initButtons();
  drawBoard();
  updateUI();
  renderRounds();
  updateCheckoutPanel();
});

//ui update sccore+player
function updateUI() {
  document.getElementById("currentScore").textContent =
    players[currentPlayerIndex].score;
  renderPlayersHeader();
  updateCheckoutPanel();
}

//következő játékosra ugrás
function nextPlayer() {
  let tries = 0;

  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    tries++;
  } while (
    players[currentPlayerIndex].finished &&
    tries < players.length
  );

  heatmap = [];
  updateCheckoutPanel();
  updateUI();
}

//tábla rajzolása
function drawBoard() {
  ctx.clearRect(0, 0, 500, 500);

  const offset = -Math.PI / 2; // 20 felül legyen, 12 óránál
  const textRadius = 220;

  const blackRed = [20,18,13,10,2,3,7,8,14,12]; // fekete/piros szektorok

  for (let i = 0; i < 20; i++) {
    // Szektor kezdő és végszögének kiszámítása, hogy 20 felül legyen
    const start = ((i * 18 - 9) * Math.PI / 180) + offset; // -9° a szektor középponthoz
    const end = (((i + 1) * 18 - 9) * Math.PI / 180) + offset;

    const number = numbers[i];
    const isBlackRed = blackRed.includes(number);

    // Gyűrűk rajzolása: dupla, külső szimpla, tripla, belső szimpla
    drawSegmentRing(start, end, 170, 190, isBlackRed ? "red" : "green"); // dupla
    drawSegmentRing(start, end, 120, 170, isBlackRed ? "black" : "white"); // külső szimpla
    drawSegmentRing(start, end, 100, 120, isBlackRed ? "red" : "green"); // tripla
    drawSegmentRing(start, end, 25, 100, isBlackRed ? "black" : "white"); // belső szimpla

    // Számok kiírása a külső gyűrűre
    const midAngle = (start + end) / 2; // szektor középső szöge
    const x = center + Math.cos(midAngle) * textRadius;
    const y = center + Math.sin(midAngle) * textRadius + 5;

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(number, x, y);
  }

  //Bull
  circle(25, "green"); // szimpla 25
  circle(12, "red");   // dupla 50

  drawHeatmap();
}

// Segédfüggvény gyűrű rajzolására
function drawSegmentRing(start, end, r1, r2, color) {
  ctx.beginPath();
  ctx.arc(center, center, r2, start, end);
  ctx.arc(center, center, r1, end, start, true);
  ctx.fillStyle = color;
  ctx.fill();
}

// Segédfüggvény kör rajzolására
function circle(r, color) {
  ctx.beginPath();
  ctx.arc(center, center, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}


function drawRing(r1,r2,color){
  ctx.beginPath();
  ctx.arc(center,center,r2,0,2*Math.PI);
  ctx.arc(center,center,r1,0,2*Math.PI,true);
  ctx.fillStyle=color;
  ctx.fill();
}

//heatmap
function drawHeatmap(){
  heatmap.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,2*Math.PI);
    let col="red"; // szimpla
    if(p.label.startsWith("D") || p.label==="DB") col="white";
    if(p.label.startsWith("T")) col="blue";
    ctx.fillStyle=col;
    ctx.fill();
  });
}

//Clicks
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();

  // canvas méret vs CSS méret kezelése
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // kattintás canvas koordinátában
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;

  const dx = cx - center;
  const dy = cy - center;
  const dist = Math.sqrt(dx*dx + dy*dy);

  // SZÖG: UGYANAZ AZ ELTOLÁS, MINT A RAJZOLÁSNÁL
  let angle = Math.atan2(dy, dx);
  angle += Math.PI / 2;       // 20 felül
  if (angle < 0) angle += 2 * Math.PI;

  const sectorSize = 2 * Math.PI / 20;
  const index = Math.floor((angle + sectorSize / 2) / sectorSize) % 20;
  const number = numbers[index];

  let label, score;

  if (dist <= 12) {
    label = "DB"; score = 50;
  } else if (dist <= 25) {
    label = "SB"; score = 25;
  } else if (dist >= 170 && dist <= 190) {
    label = "D" + number; score = number * 2;
  } else if (dist >= 100 && dist <= 120) {
    label = "T" + number; score = number * 3;
  } else if (dist <= 170) {
    label = "S" + number; score = number;
  } else {
    return;
  }

  addThrow(label, score, cx, cy);
  drawHeatmapBlur();
});

//Gombok
const btns = document.getElementById("buttons");


function initButtons() {
  btns.innerHTML = "";
 
  for (let n = 0; n <= 20; n++) {
    const types = n === 0 ? ["S"] : ["S", "D", "T"];

    types.forEach(m => {
      const btn = document.createElement("button");
      btn.textContent = m + n;

      btn.onclick = () => {
        
        const label = m + n;
        const score =
          n * (m === "D" ? 2 : m === "T" ? 3 : 1);

        const pos = getPositionFromLabel(label);
 
        addThrow(label, score, pos.x, pos.y);
      };

      btns.appendChild(btn);
    });
  }

  // SB / DB
  ["SB", "DB"].forEach(label => {
    const btn = document.createElement("button");
    btn.textContent = label;

    btn.onclick = () => {
      const score = label === "DB" ? 50 : 25;
      const pos = getPositionFromLabel(label);

      addThrow(label, score, pos.x, pos.y);
    };

    btns.appendChild(btn);
  });
}


function isDoubleCheckoutPossible(score) {
    if(score === 0) return true;
    if(score === 1) return false;

    // 1 dobásos dupla
    for(const d of DOUBLES){
        if(d.value === score) return true;
    }

    // 2 dobásos kombináció: t + d
    for(const d of DOUBLES){
        for(const t of THROWS){
            if(t.value + d.value === score) return true;
        }
    }

    // 3 dobásos kombináció: t1 + t2 + d
    for(const d of DOUBLES){
        for(const t1 of THROWS){
            for(const t2 of THROWS){
                if(t1.value + t2.value + d.value === score) return true;
            }
        }
    }

    return false; // semmilyen kombinációval nem lehet dupla kiszállóval dobni
}

function addThrow(label, score, x, y) {
    const player = players[currentPlayerIndex];

    const snapshot = {
        playerIndex: currentPlayerIndex,
        label,
        score,
        x,
        y,
        prevScore: player.score,
        roundStartScore: player.roundStartScore,
        wasFinished: player.finished,
        finishOrder: player.finishOrder
    };

    // Kör elején beállítjuk a roundStartScore-t
    if (player.throws.length % 3 === 0) {
        player.roundStartScore = player.score;
    }

    // Dobás hozzáadása
    player.addThrow(label, score);

    let bust = false;

    // ==========================
    // Bust / túllépés
// ==========================
// Bust / túllépés vagy 1 pont maradt dupla kiszállónál
if (
    player.score < 0 ||
    (checkoutMode === "double" && player.score === 1)
) {
    bust = true;
    player.score = player.roundStartScore;

    const throwsToRemove =
        player.throws.length % 3 === 0
            ? 0
            : player.throws.length % 3;

    for (let i = 0; i < throwsToRemove; i++) {
        player.throws.pop();
        heatmap.pop();
    }

    drawBoard();
    updateUI();

    alert(
        player.name +
        (player.score < 0
            ? " túllépte a kör eleji pontját!"
            : " 1 pontra maradt! Dupla kiszálló nem lehetséges!")
    );

    nextActivePlayer();
    updateCheckoutPanel();
    return;
  }

    // ==========================
    // Dupla kiszálló ellenőrzés
    if (checkoutMode === "double" && player.score === 0) {
        if (!label.startsWith("D") && label !== "DB") {
            bust = true;
            player.score = player.roundStartScore;
            player.throws.pop();
            heatmap.pop();

            drawBoard();
            updateUI();
            alert(player.name + " dupla kiszállóval kell kiszállnod!");

            nextActivePlayer();
            updateCheckoutPanel();
            return;
        }
    }

    // ==========================
    // Heatmap és történet
    heatmap.push({ x, y, label, score });
    throwHistory.push(snapshot);

    drawBoard();
    drawHeatmapBlur();
    updateUI();
    renderRounds();

    // ==========================
    // Tényleges kiszállás
    if (player.score === 0 && !bust) {
        player.finished = true;
        finishCounter++;
        player.finishOrder = finishCounter;

        renderPlayersHeader(); // itt jelenik meg az érem

        // Ellenőrizzük minden játékos kiszállt-e
        if (players.every(p => p.finished)) {
            alert("Minden játékos kiszállt! Játék vége.");
            return;
        }

        const continueGame = confirm(`${player.name} kiszállt.\nSzeretnétek folytatni a játékot?`);
        if (continueGame) {
            nextActivePlayer();
            return;
        }

        const startNew = confirm("Új játék kezdés indulhat?");
        if (startNew) resetGame();
        return;
    }

    // ==========================
    // Következő játékos, ha vége a körnek (3 dobás)
    if (player.throws.length % 3 === 0 && !player.finished) {
        nextActivePlayer();
    }

    renderPlayersHeader();
}


function nextActivePlayer() {
  let tries = 0;

  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    tries++;
  } while (players[currentPlayerIndex].finished && tries < players.length);

  heatmap.length = 0;   // 🔥 biztos nullázás
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBoard();
  updateUI();
  updateCheckoutPanel();
}


const playerCountInput = document.getElementById("playerCount");
const playerNamesDiv = document.getElementById("playerNames");
const playerPlus = document.getElementById("playerPlus");
const playerMinus = document.getElementById("playerMinus");

function generatePlayerInputs() {
  playerNamesDiv.innerHTML = "";
  const count = parseInt(playerCountInput.value);
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.id = "playerName" + i;
    input.placeholder = "Játékos " + (i + 1) + " neve";
    input.style.marginBottom = "5px";
    playerNamesDiv.appendChild(input);
    playerNamesDiv.appendChild(document.createElement("br"));
  }
}

function setPlayerCount(value) {
  const v = Math.max(1, Math.min(6, value));
  playerCountInput.value = v;
  generatePlayerInputs();
}

playerPlus.addEventListener("click", () => {
  setPlayerCount(parseInt(playerCountInput.value) + 1);
});

playerMinus.addEventListener("click", () => {
  setPlayerCount(parseInt(playerCountInput.value) - 1);
});

// alapértelmezett generálás
generatePlayerInputs();

// változás esetén frissítés
playerCountInput.addEventListener("change", generatePlayerInputs);

document.getElementById("backToStart").addEventListener("click", () => {

  // Panelek váltása
  startPanel.style.display = "block";
  gamePanel.style.display = "none";

  // Heatmap teljes nullázás
  heatmap = [];
  throwHistory = [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Játékos adatok nullázása (érmek is)
  players.forEach(p => {
    p.score = startingScore;
    p.throws = [];
    p.stats = {};
    p.finished = false;
    p.finishOrder = null;
    p.roundStartScore = startingScore;
  });

  finishCounter = 0;
  currentPlayerIndex = 0;

  // Round table törlése
  document.getElementById("roundsContainer").innerHTML = "";

  // Header (érmek eltűnnek)
  renderPlayersHeader();

  // UI frissítés
  updateUI();
});

document.getElementById("undoBtn").addEventListener("click", () => {
    if (throwHistory.length === 0) return;

    const last = throwHistory.pop();
    const player = players[last.playerIndex];

    // Aktív játékos visszaállítása
    currentPlayerIndex = last.playerIndex;

    // Score visszaállítása
    player.score = last.prevScore;

    // Dobás törlése
    for (let i = player.throws.length - 1; i >= 0; i--) {
        if (player.throws[i].label === last.label && player.throws[i].score === last.score) {
            player.throws.splice(i, 1);
            break;
        }
    }

    // Heatmap visszavonás
    for (let i = heatmap.length - 1; i >= 0; i--) {
        if (heatmap[i].x === last.x && heatmap[i].y === last.y) {
            heatmap.splice(i, 1);
            break;
        }
    }

    // Ha a dobás miatt a játékos kiszállt, visszavonjuk
    if (player.finished && last.wasFinished === false) {
        player.finished = false;

        // Érmek visszavonása
        if (player.finishOrder && player.finishOrder <= 3) {
            console.log(`${player.name} érmét visszavontuk`);
        }

        finishCounter--;
        player.finishOrder = null;
    }

    drawBoard();
    updateUI();
    renderRounds();
    updateCheckoutPanel();
    renderPlayersHeader();
});

function renderRounds(){
  const container = document.getElementById("roundsContainer");
  container.innerHTML = "";

  const maxRounds = Math.max(
    ...players.map(p => p.getRounds().length)
  );

  for(let r = maxRounds - 1; r >= 0; r--){
    const roundDiv = document.createElement("div");
    roundDiv.className = "roundBlock";

    // Kör cím
    const title = document.createElement("h5");
    title.textContent = `${r + 1}. kör`;
    roundDiv.appendChild(title);

    // Táblázat
    const table = document.createElement("table");
    table.className = "roundTable";

    // Fejléc
    const thead = document.createElement("tr");

    thead.innerHTML = players.map(p => {

      const round = p.getRounds()[r];

      let roundTotal = 0;
      if (round) {
        roundTotal = round.reduce((sum, t) => sum + t.score, 0);
      }

      return `<th>${p.name} ${round ? `(${roundTotal})` : ""}</th>`;

    }).join("");

    table.appendChild(thead);

    // 3 dobás sor
    for(let d = 0; d < 3; d++){
      const row = document.createElement("tr");

      players.forEach(p => {
        const cell = document.createElement("td");
        const round = p.getRounds()[r];
        if(round && round[d]){
          cell.textContent = `${round[d].label} (${round[d].score})`;
        } else {
          cell.textContent = "-";
        }
        row.appendChild(cell);
      });

      table.appendChild(row);
    }

    roundDiv.appendChild(table);
    container.appendChild(roundDiv);
  }
}

document.getElementById("newGameBtn").addEventListener("click", () => {
  if (!confirm("Biztosan új játékot szeretnél indítani?")) return;

  resetGame();
});

function resetGame() {
    heatmap = [];
    throwHistory = [];
    finishCounter = 0;

    players.forEach(p => {
        p.score = startingScore;
        p.lastScore = startingScore;
        p.throws = [];
        p.stats = {};
        p.finished = false;
        p.finishOrder = null;
        p.roundStartScore = startingScore;
    });

    currentPlayerIndex = 0;

    document.getElementById("currentScore").textContent =
        players.length ? players[0].score : "-";

    document.getElementById("roundsContainer").innerHTML = "";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawHeatmapBlur();
    updateUI();
    updateCheckoutPanel();

    // FONTOS: frissítjük a player headert, így a régi érmek is eltűnnek
    renderPlayersHeader();
}


const statsModal = document.getElementById("statsModal");
const closeModal = statsModal.querySelector(".close");
const statsChartCanvas = document.getElementById("statsChart");


//Blur motion a dobásoknál
function drawHeatmapBlur(){
  heatmap.forEach(p => {
    const r = 40;

    const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
    g.addColorStop(0, "rgba(0, 200, 255, 0.65)");
    g.addColorStop(0.5, "rgba(0, 200, 255, 0.35)");
    g.addColorStop(1, "rgba(0, 200, 255, 0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x,p.y,r,0,Math.PI*2);
    ctx.fill();
  });
}

//Checkouts számolás
const THROWS = [];

// Tripla 20–1
for(let i=20;i>=1;i--) THROWS.push({ label:`T${i}`, value:i*3 });

// Szimpla 20–1
for(let i=20;i>=1;i--) THROWS.push({ label:`S${i}`, value:i });

// Bull
THROWS.push({ label:"SB", value:25 });

// Duplák (utolsó dobáshoz)
const DOUBLES = [];
for(let i=20;i>=1;i--) DOUBLES.push({ label:`D${i}`, value:i*2 });
DOUBLES.push({ label:"DB", value:50 });

function calculateCheckout(score){
  if(score > 170 || score < 2) return null;

  // 1️ próbálkozás: 1 dobás (pl. DB, D20)
  for(const d of DOUBLES){
    if(d.value === score){
      return [d.label];
    }
  }

  // 2️ próbálkozás: 2 dobás
  for(const d of DOUBLES){
    const rest = score - d.value;
    if(rest <= 0) continue;

    for(const t of THROWS){
      if(t.value === rest){
        return [t.label, d.label];
      }
    }
  }

  // 3️ próbálkozás: 3 dobás
  for(const d of DOUBLES){
    const rest1 = score - d.value;
    if(rest1 <= 0) continue;

    for(const t1 of THROWS){
      const rest2 = rest1 - t1.value;
      if(rest2 <= 0) continue;

      for(const t2 of THROWS){
        if(t2.value === rest2){
          return [t1.label, t2.label, d.label];
        }
      }
    }
  }

  return null;
}

function updateCheckoutPanel(){
  const panel = document.getElementById("checkoutPanel");
  const content = document.getElementById("checkoutContent");

  if(checkoutMode !== "double"){
    panel.style.display = "none";
    return;
  }

  const player = players[currentPlayerIndex];
  if(!player){
    panel.style.display = "none";
    return;
  }

  const result = calculateCheckout(player.score);

  if(!result){
    panel.style.display = "none";   // csak akkor rejtjük el
    content.innerHTML = "Nincs kiszálló";
    return;
  }

  //VAN KISZÁLLÓ → PANEL LÁTSZIK
  panel.style.display = "block";

  content.innerHTML = result
    .map(t => `<span>${t}</span>`)
    .join("");
}


// Bezárás
closeModal.onclick = () => { statsModal.style.display = "none"; };
window.onclick = (event) => { if(event.target == statsModal) statsModal.style.display = "none"; };

function renderPlayersHeader() {
  const header = document.getElementById("playersHeader");
  header.innerHTML = "";

  const list = document.createElement("div");
  list.className = "playersList";

  players.forEach((p, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "playerName";
    if (i === currentPlayerIndex) wrapper.classList.add("active");
    if (p.finished) wrapper.classList.add("finished");

    // NÉV
    const name = document.createElement("span");
    name.className = "playerNameLabel";
    name.textContent = p.name;

    // PONTSZÁM
    const score = document.createElement("span");
    score.className = "playerScore";
    score.textContent = p.score;

    // ÉRME
    let medal = null;
    if (p.finishOrder && p.finishOrder <= 3) {
      medal = document.createElement("span");
      medal.className = "playerMedal";

      if (p.finishOrder === 1) medal.textContent = "🥇";
      if (p.finishOrder === 2) medal.textContent = "🥈";
      if (p.finishOrder === 3) medal.textContent = "🥉";
    }

    // HOZZÁADÁS SORRENDBEN
    wrapper.appendChild(name);
    wrapper.appendChild(score);
    if (medal) wrapper.appendChild(medal);


    // állapot színezés
    if (p.score <= 170) score.classList.add("danger");
    else if (isCheckoutReady(p)) score.classList.add("checkout");

    list.appendChild(wrapper);
  });

  header.appendChild(list);
}

function isCheckoutReady(player) {
  if (checkoutMode !== "double") return false;
  return player.score <= 170 && player.score > 1;
}

function getPositionFromLabel(label) {
  if (label === "DB") return { x: center, y: center }; // marad középen

  if (label === "SB") {
      // 25-ös szimpla bull: körülötte egy kis sugarú kör
      const rMin = 12; // dupla bull sugara
      const rMax = 25; // szimpla bull külső sugara
      const pos = randomInRing(rMin, rMax); // random pozíció a gyűrűn belül
      return pos;
  }
  const type = label[0];
  const value = parseInt(label.slice(1), 10);
  const index = numbers.indexOf(value);
  if (index === -1) return { x: center, y: center };

  const sectorSize = 2 * Math.PI / 20;
  const offset = -Math.PI / 2; // 20 felül

  // Szektor közép
  const angle = index * sectorSize + sectorSize / 20 + offset;

  // Gyűrű középső sugara
  let r;
  switch(type) {
    case 'D': r = 180; break; // dupla
    case 'T': r = 110; break; // tripla
    case 'S': r = 62; break;  // szimpla
    default: r = 80;
  }

  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r
  };
}


function randomInRing(rMin, rMax) {
  const angle = Math.random() * 2 * Math.PI;
  const r = rMin + Math.random() * (rMax - rMin);

  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r
  };
}

function addThrowWithBlur(label, score, basePos, samples = 8, spread = 6) {
  for (let i = 0; i < samples; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * spread;

    const x = basePos.x + Math.cos(angle) * r;
    const y = basePos.y + Math.sin(angle) * r;

    addThrow(label, score, x, y, i > 0);
  }
}

// Szabályok modal
const rulesBtn = document.getElementById("rulesofdarts");
const rulesModal = document.getElementById("rulesModal");
const rulesClose = rulesModal.querySelector(".close");

// Megnyitás
rulesBtn.addEventListener("click", () => {
  rulesModal.style.display = "block";
});

// Bezárás a × gombra
rulesClose.addEventListener("click", () => {
  rulesModal.style.display = "none";
});

// Bezárás ha a háttérre kattintanak
window.addEventListener("click", (e) => {
  if (e.target === rulesModal) {
    rulesModal.style.display = "none";
  }
});

// statisztika és grafikon be-letöltése

const statthrowsdlBtn = document.getElementById("statthrowsdl");

statthrowsdlBtn.addEventListener("click", () => {
  if (!players || players.length === 0) {
    alert("Nincsenek dobások a mentéshez!");
    return;
  }

  const wb = XLSX.utils.book_new();

  // Sheet: Dobások
  const throwData = [];
  players.forEach(player => {
    player.getRounds().forEach((round, roundIndex) => {
      round.forEach((t, throwIndex) => {
        throwData.push({
          "Játékos": player.name,
          "Kör": roundIndex + 1,
          "Dobás": throwIndex + 1,
          "Label": t.label,
          "Pont": t.score
        });
      });
    });
  });
  const wsThrows = XLSX.utils.json_to_sheet(throwData);
  XLSX.utils.book_append_sheet(wb, wsThrows, "Dobások");

  //Sheet: Statisztika
  const statsData = players.map(p => {
    const stats = p.getThrowStats();
    return {
      Játékos: p.name,
      Átlag: p.getAverage(),
      Duplák: p.getDoubleCount(),
      Triplák: p.getTripleCount(),
      SB: stats["SB"] || 0,
      DB: stats["DB"] || 0,
      ...Object.fromEntries(
        Array.from({length:20},(_,i)=>i+1)
          .flatMap(n => [`S${n}`, `D${n}`, `T${n}`].map(l => [l, stats[l] || 0]))
      )
    };
  });
  const wsStats = XLSX.utils.json_to_sheet(statsData);
  XLSX.utils.book_append_sheet(wb, wsStats, "Statisztika");

  //Mentés
  const now = new Date();

  //yyyy-MM-dd_HH-mm
  const dateStr = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + "_" +
    String(now.getHours()).padStart(2, "0") + "-" +
    String(now.getMinutes()).padStart(2, "0");

  XLSX.writeFile(wb, `darts_game_${dateStr}.xlsx`);

});

const statthrowsulBtn = document.getElementById("statthrowsul");

statthrowsulBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls";
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = evt => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });

      // Dobások sheet
      const ws = wb.Sheets["Dobások"];
      if(!ws) { alert("Dobások sheet nem található!"); return; }
      const json = XLSX.utils.sheet_to_json(ws);

      // Játékosok inicializálása
      const playerNames = [...new Set(json.map(r => r["Játékos"]))];
      players = playerNames.map(name => new Player(name));

      // Pontszámok nullázása és dobások betöltése
      players.forEach(p => {
        p.score = startingScore;
        p.throws = [];
        p.stats = {};
        p.finished = false;
      });

      json.forEach(r => {
        const player = players.find(p => p.name === r["Játékos"]);
        player.addThrow(r["Label"], r["Pont"]);
      });

      currentPlayerIndex = 0;
      heatmap = [];
      drawBoard();
      drawHeatmapBlur();
      updateUI();
      renderRounds();
      updateCheckoutPanel();
      if(gamePanel.style.display === "none"){
        startPanel.style.display = "none";
        gamePanel.style.display = "block";
      }
      alert("Dobások betöltve!");
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
});
