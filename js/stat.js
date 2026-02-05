let statsChart = null;

//STATISZTIKA GOMB
document.getElementById("showStats").addEventListener("click", () => {
  if (!players || players.length === 0) {
    alert("Nincsenek dobások a statisztikához!");
    return;
  }

  // Labels feltöltése
  const labels = [];
  for (let i = 0; i <= 20; i++) labels.push("S" + i);
  for (let i = 1; i <= 20; i++) labels.push("D" + i);
  for (let i = 1; i <= 20; i++) labels.push("T" + i);
  labels.push("SB", "DB");

  // Ellenőrzés, hogy van-e bármilyen statisztikai adat
  const hasData = players.some(player => {
    const stats = player.getThrowStats();
    return labels.some(label => stats[label] > 0);
  });

  if (!hasData) {
    alert("Nincsenek dobások a statisztikához!");
    return; // modal **nem nyílik meg**
  }

  // Csak ha van adat, nyitjuk a modalt
  const statsModal = document.getElementById("statsModal");
  statsModal.style.display = "block";

  renderStats(players);
});


//MODAL BEZÁRÁS
document.querySelector(".close").onclick = () => {
  document.getElementById("statsModal").style.display = "none";
};

window.onclick = (event) => {
  const modal = document.getElementById("statsModal");
  if (event.target === modal) modal.style.display = "none";
};

//STATISZTIKA KIRAJZOLÁS
function renderStats(players) {
  const statsText = document.getElementById("modalStatsContent");
  const canvas = document.getElementById("statsChart");
  const statsModal = document.getElementById("statsModal");
  const ctx = canvas.getContext("2d");

  statsText.innerHTML = "";

  // X tengely (fix sorrend)
  const labels = [];
 

  for (let i = 0; i <= 20; i++) labels.push("S" + i);
  for (let i = 1; i <= 20; i++) labels.push("D" + i);
  for (let i = 1; i <= 20; i++) labels.push("T" + i);

  labels.push("SB", "DB");
  

  // PLAYER CARDS CONTAINER
  const gridContainer = document.createElement("div");
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))"; 
  gridContainer.style.gap = "15px";
  gridContainer.style.marginBottom = "20px";
  statsText.appendChild(gridContainer);

  //játékosonkénti stat szöveg + dataset
  const datasets = players.map(player => {
    // player card
    const div = document.createElement("div");
    div.className = "playerCard";
    div.innerHTML = `
      <h4 style="margin:0 0 8px 0; font-size:18px;">${player.name}</h4>
      Átlag: <b>${player.getAverage()}</b> |
      Duplák: <b>${player.getDoubleCount()}</b> |
      Triplák: <b>${player.getTripleCount()}</b>
    `;
    gridContainer.appendChild(div);

    // diagram adatok
    const stats = player.getThrowStats();
    return {
      label: player.name,
      data: labels.map(l => stats[l] || 0),
      backgroundColor: randomColor(),
      barPercentage: 2,
      categoryPercentage: 1
    };
  });

  // előző chart törlése
  if (statsChart) statsChart.destroy();

  // Chart.js oszlopdiagram
  statsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: true,
        mode: 'nearest'
      },
      plugins: {
        legend: {
          labels: { 
            color: "white",
            font: { size: 16 }
          }
        },
        title: {
          display: true,
          text: "Dobások előfordulása",
          color: "white",
          font: { size: 22 }
        },
        tooltip: {
          enabled: true,
          bodyFont: { size: 16 },
          titleFont: { size: 16 }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "white",
            font: { size: 14 },
            autoSkip: false,
            maxRotation: 90,
            minRotation: 90
          },
          offset: true
        },
        y: {
          beginAtZero: true,
          ticks: { color: "white", font: { size: 16 } },
          title: {
            display: true,
            text: "Előfordulások száma",
            color: "white",
            font: { size: 18 }
          }
        }
      }
    }
  });
}

//Helper!VÉLETLEN SZÍN 
function randomColor() {
  const r = Math.floor(Math.random() * 200 + 30);
  const g = Math.floor(Math.random() * 200 + 30);
  const b = Math.floor(Math.random() * 200 + 30);
  return `rgb(${r},${g},${b})`;
}
