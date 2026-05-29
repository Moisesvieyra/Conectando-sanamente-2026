/* =========================================================
   ADMIN RANKING ENGINE • CONECTANDO SANAMENTE 2026
   AGUAKAN SUPERVISION DASHBOARD V1
========================================================= */

/* =========================================================
   IMPORTS
========================================================= */

import { auth, realtimeDB } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    ref as realtimeRef,
    onValue,
    get
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================================================
   CONFIG
========================================================= */

const ADMIN_EMAIL = "ksanchez@aguakan.com";

const TOTAL_DAYS = 21;

/* =========================================================
   DOM
========================================================= */

const adminLoader = document.getElementById("adminLoader");

const adminPage = document.getElementById("adminPage");

const accessModal = document.getElementById("accessModal");

const adminName = document.getElementById("adminName");

const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");

const totalParticipants = document.getElementById("totalParticipants");

const totalChallenges = document.getElementById("totalChallenges");

const averageProgress = document.getElementById("averageProgress");

const completedAlbums = document.getElementById("completedAlbums");

const rankingList = document.getElementById("rankingList");

const participantsTableBody = document.getElementById("participantsTableBody");

const searchParticipant = document.getElementById("searchParticipant");

const refreshRankingBtn = document.getElementById("refreshRankingBtn");

const winnerBanner = document.getElementById("winnerBanner");

const winnerText = document.getElementById("winnerText");

const winnerCard = document.getElementById("winnerCard");

const winnerStatus = document.getElementById("winnerStatus");

/* =========================================================
   STATE
========================================================= */

let rankingData = [];

let currentAdmin = null;

/* =========================================================
   CONSOLE
========================================================= */

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN RANKING PANEL • CONECTANDO SANAMENTE 2026
STATUS   : ONLINE
MODE     : SUPERVISION DASHBOARD
DATABASE : REALTIME DATABASE
VERSION  : V1 PREMIUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

/* =========================================================
   AUTH VALIDATION
========================================================= */

onAuthStateChanged(auth, async(user) => {

    if(!user){

        console.warn("No hay sesión activa. Redirigiendo a login.");

        window.location.href = "login.html";

        return;

    }

    currentAdmin = user;

    const email = String(user.email || "").trim().toLowerCase();

    if(email !== ADMIN_EMAIL.toLowerCase()){

        console.warn(
            "Acceso denegado para:",
            email
        );

        showAccessDenied();

        return;

    }

    console.log(
        "Acceso autorizado para supervisora:",
        email
    );

    setupAdminInfo(user);

    setupEvents();

    startRealtimeListeners();

    hideLoader();

});

/* =========================================================
   SETUP ADMIN INFO
========================================================= */

function setupAdminInfo(user){

    const email = user.email || ADMIN_EMAIL;

    const name = getNameFromEmail(email);

    if(adminName){

        adminName.innerText = "Keyla Sánchez";

    }

    if(adminEmail){

        adminEmail.innerText = email;

    }

    document.title =
    `Panel de Supervisión | ${name}`;

}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents(){

    if(logoutBtn){

        logoutBtn.addEventListener("click", async() => {

            try{

                await signOut(auth);

                window.location.href = "login.html";

            }catch(error){

                console.error(
                    "Error cerrando sesión:",
                    error
                );

                alert("No se pudo cerrar sesión.");

            }

        });

    }

    if(refreshRankingBtn){

        refreshRankingBtn.addEventListener("click", async() => {

            refreshRankingBtn.classList.add("loading");

            refreshRankingBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Actualizando
            `;

            await manualRefresh();

            setTimeout(() => {

                refreshRankingBtn.classList.remove("loading");

                refreshRankingBtn.innerHTML = `
                    <i class="fa-solid fa-rotate"></i>
                    Actualizar
                `;

            },600);

        });

    }

    if(searchParticipant){

        searchParticipant.addEventListener("input", () => {

            const term = searchParticipant.value.trim().toLowerCase();

            renderParticipantsTable(
                filterRanking(term)
            );

        });

    }

    document.querySelectorAll(".sidebar-link").forEach(link => {

        link.addEventListener("click", () => {

            document.querySelectorAll(".sidebar-link").forEach(item => {

                item.classList.remove("active");

            });

            link.classList.add("active");

        });

    });

}

/* =========================================================
   REALTIME LISTENERS
========================================================= */

function startRealtimeListeners(){

    listenRanking();

    listenGlobalWinner();

}

/* =========================================================
   LISTEN RANKING
========================================================= */

function listenRanking(){

    const rankingRef = realtimeRef(
        realtimeDB,
        "ranking"
    );

    onValue(rankingRef, (snapshot) => {

        const data = snapshot.val() || {};

        rankingData = normalizeRankingData(data);

        renderDashboard(rankingData);

        console.log(
            "Ranking admin actualizado:",
            rankingData
        );

    }, (error) => {

        console.error(
            "Error leyendo ranking:",
            error
        );

        renderRankingError();

    });

}

/* =========================================================
   LISTEN GLOBAL WINNER
========================================================= */

function listenGlobalWinner(){

    const winnerRef = realtimeRef(
        realtimeDB,
        "globalWinner"
    );

    onValue(winnerRef, (snapshot) => {

        if(snapshot.exists()){

            const winner = snapshot.val();

            renderGlobalWinner(winner);

        }else{

            renderNoWinner();

        }

    }, (error) => {

        console.error(
            "Error leyendo ganador global:",
            error
        );

        renderNoWinner();

    });

}

/* =========================================================
   MANUAL REFRESH
========================================================= */

async function manualRefresh(){

    try{

        const rankingRef = realtimeRef(
            realtimeDB,
            "ranking"
        );

        const snapshot = await get(rankingRef);

        const data = snapshot.val() || {};

        rankingData = normalizeRankingData(data);

        renderDashboard(rankingData);

        const winnerRef = realtimeRef(
            realtimeDB,
            "globalWinner"
        );

        const winnerSnapshot = await get(winnerRef);

        if(winnerSnapshot.exists()){

            renderGlobalWinner(
                winnerSnapshot.val()
            );

        }else{

            renderNoWinner();

        }

    }catch(error){

        console.error(
            "Error actualizando manualmente:",
            error
        );

        alert("No se pudo actualizar el panel.");

    }

}

/* =========================================================
   NORMALIZE RANKING DATA
========================================================= */

function normalizeRankingData(data){

    const ranking = Object.entries(data).map(([uid,user]) => {

        const completed =
        Number(
            user.completedCount ||
            user.completed ||
            countDays(user.days) ||
            0
        );

        const email =
        String(user.email || "").trim();

        const name =
        user.name ||
        getNameFromEmail(email) ||
        "Participante";

        const updatedAt =
        Number(user.updatedAt || 0);

        const days =
        user.days || {};

        return {
            uid,
            name,
            email,
            completed,
            percent:calculatePercent(completed),
            updatedAt,
            days,
            status:getUserStatus(completed)
        };

    });

    ranking.sort((a,b) => {

        if(b.completed !== a.completed){

            return b.completed - a.completed;

        }

        return a.updatedAt - b.updatedAt;

    });

    return ranking;

}

/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard(ranking){

    renderSummary(ranking);

    renderRankingList(ranking);

    renderParticipantsTable(ranking);

}

/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary(ranking){

    const participants = ranking.length;

    const challenges = ranking.reduce((sum,user) => {

        return sum + user.completed;

    },0);

    const completed = ranking.filter(user => {

        return user.completed >= TOTAL_DAYS;

    }).length;

    const average = participants > 0
        ? Math.round(
            ranking.reduce((sum,user) => sum + user.percent,0) / participants
        )
        : 0;

    if(totalParticipants){

        animateNumber(
            totalParticipants,
            participants
        );

    }

    if(totalChallenges){

        animateNumber(
            totalChallenges,
            challenges
        );

    }

    if(averageProgress){

        averageProgress.innerText = `${average}%`;

    }

    if(completedAlbums){

        animateNumber(
            completedAlbums,
            completed
        );

    }

}

/* =========================================================
   RENDER RANKING LIST
========================================================= */

function renderRankingList(ranking){

    if(!rankingList) return;

    if(ranking.length === 0){

        rankingList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ranking-star"></i>
                <p>Aún no hay participantes en el ranking.</p>
            </div>
        `;

        return;

    }

    const topRanking = ranking.slice(0,10);

    rankingList.innerHTML = topRanking.map((user,index) => {

        const position = index + 1;

        const medal = getMedal(position);

        return `
            <div class="ranking-row ${position <= 3 ? "top-rank" : ""}">

                <div class="ranking-position">
                    ${medal}
                </div>

                <div class="ranking-person">

                    <div class="ranking-avatar">
                        ${getInitial(user.name)}
                    </div>

                    <div>
                        <h4>${escapeHTML(user.name)}</h4>
                        <p>${escapeHTML(user.email || "Sin correo")}</p>
                    </div>

                </div>

                <div class="ranking-progress-box">

                    <div class="ranking-progress-info">

                        <span>
                            ${user.completed}/${TOTAL_DAYS}
                        </span>

                        <strong>
                            ${user.percent}%
                        </strong>

                    </div>

                    <div class="ranking-progress-bar">

                        <span style="width:${user.percent}%"></span>

                    </div>

                </div>

            </div>
        `;

    }).join("");

}

/* =========================================================
   RENDER PARTICIPANTS TABLE
========================================================= */

function renderParticipantsTable(ranking){

    if(!participantsTableBody) return;

    if(ranking.length === 0){

        participantsTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state table-empty">
                        <i class="fa-solid fa-users"></i>
                        <p>No hay participantes para mostrar.</p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    participantsTableBody.innerHTML = ranking.map((user,index) => {

        const position = index + 1;

        return `
            <tr>

                <td>
                    <strong class="table-position">
                        #${position}
                    </strong>
                </td>

                <td>

                    <div class="table-user">

                        <div class="table-avatar">
                            ${getInitial(user.name)}
                        </div>

                        <div>
                            <strong>${escapeHTML(user.name)}</strong>
                            <small>${user.status.label}</small>
                        </div>

                    </div>

                </td>

                <td>
                    ${escapeHTML(user.email || "Sin correo")}
                </td>

                <td>
                    <strong>${user.completed}</strong> / ${TOTAL_DAYS}
                </td>

                <td>

                    <div class="table-progress">

                        <div class="table-progress-top">

                            <span>${user.percent}%</span>

                        </div>

                        <div class="table-progress-bar">

                            <span style="width:${user.percent}%"></span>

                        </div>

                    </div>

                </td>

                <td>

                    <span class="status-badge ${user.status.className}">
                        ${user.status.label}
                    </span>

                </td>

                <td>
                    ${formatDate(user.updatedAt)}
                </td>

            </tr>
        `;

    }).join("");

}

/* =========================================================
   RENDER GLOBAL WINNER
========================================================= */

function renderGlobalWinner(winner){

    const name =
    winner.name ||
    getNameFromEmail(winner.email) ||
    "Participante";

    const email =
    winner.email ||
    "Sin correo";

    const message =
    winner.message ||
    `🏆 ${name} completó primero el álbum de bienestar`;

    if(winnerBanner){

        winnerBanner.classList.add("active");

    }

    if(winnerText){

        winnerText.innerText = message;

    }

    if(winnerStatus){

        winnerStatus.innerText = "Definido";

        winnerStatus.classList.add("success");

    }

    if(winnerCard){

        winnerCard.innerHTML = `
            <div class="winner-profile">

                <div class="winner-crown">
                    <i class="fa-solid fa-crown"></i>
                </div>

                <div class="winner-avatar">
                    ${getInitial(name)}
                </div>

                <h4>
                    ${escapeHTML(name)}
                </h4>

                <p>
                    ${escapeHTML(email)}
                </p>

                <div class="winner-stats">

                    <div>
                        <strong>
                            ${winner.completedCount || TOTAL_DAYS}
                        </strong>
                        <span>
                            retos
                        </span>
                    </div>

                    <div>
                        <strong>
                            100%
                        </strong>
                        <span>
                            avance
                        </span>
                    </div>

                </div>

                <small>
                    Completado el ${formatDate(winner.completedAt)}
                </small>

            </div>
        `;

    }

}

/* =========================================================
   RENDER NO WINNER
========================================================= */

function renderNoWinner(){

    if(winnerBanner){

        winnerBanner.classList.remove("active");

    }

    if(winnerText){

        winnerText.innerText =
        "Aún no hay ganador del álbum de bienestar";

    }

    if(winnerStatus){

        winnerStatus.innerText = "Pendiente";

        winnerStatus.classList.remove("success");

    }

    if(winnerCard){

        winnerCard.innerHTML = `
            <div class="winner-placeholder">

                <div class="winner-big-icon">

                    <i class="fa-solid fa-crown"></i>

                </div>

                <h4>
                    Aún no hay ganador
                </h4>

                <p>
                    El primer participante que complete los 21 retos aparecerá aquí automáticamente.
                </p>

            </div>
        `;

    }

}

/* =========================================================
   RENDER ERROR
========================================================= */

function renderRankingError(){

    if(rankingList){

        rankingList.innerHTML = `
            <div class="empty-state error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>No se pudo cargar el ranking.</p>
            </div>
        `;

    }

    if(participantsTableBody){

        participantsTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state table-empty error">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>No se pudo cargar la información de participantes.</p>
                    </div>
                </td>
            </tr>
        `;

    }

}

/* =========================================================
   ACCESS DENIED
========================================================= */

function showAccessDenied(){

    hideLoader();

    if(accessModal){

        accessModal.classList.add("show");

    }else{

        alert("Acceso restringido.");

        window.location.href = "album.html";

    }

}

/* =========================================================
   LOADER
========================================================= */

function hideLoader(){

    if(!adminLoader) return;

    setTimeout(() => {

        adminLoader.classList.add("hidden");

        setTimeout(() => {

            adminLoader.style.display = "none";

            if(adminPage){

                adminPage.classList.add("ready");

            }

        },500);

    },600);

}

/* =========================================================
   FILTER
========================================================= */

function filterRanking(term){

    if(!term){

        return rankingData;

    }

    return rankingData.filter(user => {

        const name =
        String(user.name || "").toLowerCase();

        const email =
        String(user.email || "").toLowerCase();

        return name.includes(term) ||
        email.includes(term);

    });

}

/* =========================================================
   HELPERS
========================================================= */

function countDays(days){

    if(!days || typeof days !== "object"){

        return 0;

    }

    return Object.values(days).filter(Boolean).length;

}

function calculatePercent(completed){

    const percent =
    Math.round((Number(completed || 0) / TOTAL_DAYS) * 100);

    if(percent < 0) return 0;

    if(percent > 100) return 100;

    return percent;

}

function getUserStatus(completed){

    const value = Number(completed || 0);

    if(value >= TOTAL_DAYS){

        return {
            label:"Completado",
            className:"completed"
        };

    }

    if(value >= 14){

        return {
            label:"Avanzado",
            className:"advanced"
        };

    }

    if(value >= 7){

        return {
            label:"En progreso",
            className:"progress"
        };

    }

    if(value > 0){

        return {
            label:"Iniciado",
            className:"started"
        };

    }

    return {
        label:"Sin avance",
        className:"empty"
    };

}

function getMedal(position){

    if(position === 1){

        return "🥇";

    }

    if(position === 2){

        return "🥈";

    }

    if(position === 3){

        return "🥉";

    }

    return `#${position}`;

}

function getInitial(name){

    if(!name){

        return "A";

    }

    return String(name)
    .trim()
    .charAt(0)
    .toUpperCase();

}

function getNameFromEmail(email){

    if(!email){

        return "Participante";

    }

    const clean =
    String(email)
    .split("@")[0]
    .replace(/[._-]/g," ")
    .trim();

    return clean
    .split(" ")
    .filter(Boolean)
    .map(word => {

        return word.charAt(0).toUpperCase() +
        word.slice(1);

    })
    .join(" ");

}

function formatDate(timestamp){

    if(!timestamp){

        return "Sin registro";

    }

    const date = new Date(Number(timestamp));

    if(isNaN(date.getTime())){

        return "Sin registro";

    }

    return date.toLocaleString("es-MX", {
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
    });

}

function animateNumber(element,value){

    const finalValue = Number(value || 0);

    const currentValue =
    Number(element.dataset.value || 0);

    element.dataset.value = finalValue;

    if(currentValue === finalValue){

        element.innerText = finalValue;

        return;

    }

    const duration = 600;

    const startTime = performance.now();

    const update = (now) => {

        const progress =
        Math.min((now - startTime) / duration,1);

        const current =
        Math.round(
            currentValue +
            (finalValue - currentValue) * progress
        );

        element.innerText = current;

        if(progress < 1){

            requestAnimationFrame(update);

        }

    };

    requestAnimationFrame(update);

}

function escapeHTML(value){

    return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}
