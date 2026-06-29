/* ========================================= */
/* AGUAKAN ALBUM ENGINE V8.1 */
/* CONECTANDO SANAMENTE 2026 */
/* STORAGE + REALTIME RANKING */
/* DELETE OWN EVIDENCE ENABLED */
/* ADMIN EVIDENCE REVIEW PANEL ENABLED */
/* ========================================= */

import { auth, storage, realtimeDB } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
    ref as realtimeRef,
    update as realtimeUpdate,
    get as realtimeGet,
    remove as realtimeRemove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALBUM ENGINE • CONECTANDO SANAMENTE 2026
STATUS   : ONLINE
MODE     : PREMIUM EXPERIENCE
STORAGE  : CONNECTED
RANKING  : REALTIME DATABASE
VERSION  : V8.1 ADMIN EVIDENCE REVIEW PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

/* ========================================= */
/* ELEMENTOS */
/* ========================================= */

const slots = document.querySelectorAll(".album-slot");
const progressRing = document.getElementById("progress-ring");
const progressText = document.getElementById("progress-text");
const progressDays = document.getElementById("progress-days");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressMiniText = document.getElementById("progress-mini-text");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const closePreview = document.querySelector(".close-preview");
const userName = document.getElementById("user-name");
const profileAvatar = document.querySelector(".profile-avatar");
const rankingButton = document.getElementById("rankingButton") || document.querySelector(".premium-btn");

/* ========================================= */
/* ADMIN PANEL ELEMENTS */
/* ========================================= */

const adminReviewPanel = document.getElementById("adminReviewPanel");
const adminReviewShortcut = document.getElementById("adminReviewShortcut");
const adminReviewerEmail = document.getElementById("adminReviewerEmail");
const adminTotalUsers = document.getElementById("adminTotalUsers");
const adminTotalEvidence = document.getElementById("adminTotalEvidence");
const adminCompletedAlbums = document.getElementById("adminCompletedAlbums");
const adminCurrentDay = document.getElementById("adminCurrentDay");
const adminPendingEvidence = document.getElementById("adminPendingEvidence");
const adminApprovedEvidence = document.getElementById("adminApprovedEvidence");
const adminRejectedEvidence = document.getElementById("adminRejectedEvidence");
const adminReviewSearch = document.getElementById("adminReviewSearch");
const adminReviewFilter = document.getElementById("adminReviewFilter");
const adminReviewDayFilter = document.getElementById("adminReviewDayFilter");
const adminReviewStatusFilter = document.getElementById("adminReviewStatusFilter");
const adminReviewSort = document.getElementById("adminReviewSort");
const adminRefreshReviewBtn = document.getElementById("adminRefreshReviewBtn");
const adminExportReviewBtn = document.getElementById("adminExportReviewBtn");
const adminReviewGrid = document.getElementById("adminReviewGrid");
const adminReviewMatrix = document.getElementById("adminReviewMatrix");
const adminReviewEmpty = document.getElementById("adminReviewEmpty");
const adminReviewTabs = document.querySelectorAll(".admin-review-tab");

const adminEvidenceModal = document.getElementById("adminEvidenceModal");
const adminEvidenceClose = document.getElementById("adminEvidenceClose");
const adminEvidenceModalTitle = document.getElementById("adminEvidenceModalTitle");
const adminEvidenceModalSubtitle = document.getElementById("adminEvidenceModalSubtitle");
const adminEvidenceModalImage = document.getElementById("adminEvidenceModalImage");
const adminEvidenceUserEmail = document.getElementById("adminEvidenceUserEmail");
const adminEvidenceDay = document.getElementById("adminEvidenceDay");
const adminEvidenceStatus = document.getElementById("adminEvidenceStatus");
const adminEvidenceObservation = document.getElementById("adminEvidenceObservation");
const adminApproveEvidenceBtn = document.getElementById("adminApproveEvidenceBtn");
const adminRejectEvidenceBtn = document.getElementById("adminRejectEvidenceBtn");
const adminPendingEvidenceBtn = document.getElementById("adminPendingEvidenceBtn");

/* ========================================= */
/* VARIABLES */
/* ========================================= */

let completed = 0;
const total = 21;
let rankingUnsubscribe = null;
let adminRankingUnsubscribe = null;
let adminReviewsUnsubscribe = null;
let currentUserSession = null;
let currentAdminUser = null;
let currentAdminEvidence = null;
let adminCurrentView = "cards";
let adminRankingData = {};
let adminReviewsData = {};
let adminUsersCache = [];

const AUTHORIZED_ADMIN_EMAILS = [
    "ksanchez@aguakan.com",
    "echan@aguakan.com"
];

const ADMIN_STATUS = {
    pending:"pending",
    approved:"approved",
    rejected:"rejected"
};

const ADMIN_STATUS_LABELS = {
    pending:"Pendiente",
    approved:"Aprobada",
    rejected:"Rechazada"
};

const ADMIN_STATUS_ICONS = {
    pending:"fa-clock",
    approved:"fa-circle-check",
    rejected:"fa-circle-xmark"
};

/* ========================================= */
/* DAILY LOCK CONFIG */
/* ========================================= */

/*
    Fecha oficial de inicio del álbum.
    Día 1: 22 de junio de 2026.
    Día 21: 12 de julio de 2026 si se cuenta estrictamente 21 días naturales.
    Si el cierre operativo es 11 de julio, se recomienda validar calendario interno.
*/

const challengeStartDate = new Date("2026-06-22T00:00:00");

function getCurrentChallengeDay(){

    const today = new Date();
    today.setHours(0,0,0,0);

    const start = new Date(challengeStartDate);
    start.setHours(0,0,0,0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if(diffDays < 1){
        return 0;
    }

    if(diffDays > total){
        return total;
    }

    return diffDays;

}

function isDayUnlocked(day){

    const currentDay = getCurrentChallengeDay();

    return Number(day) <= currentDay;

}

function applyDailyLocks(){

    slots.forEach(slot => {

        const day = slot.dataset.day;

        const isCompleted = slot.dataset.completed === "true";

        if(isCompleted){

            slot.classList.remove("locked");
            slot.classList.add("completed");

            return;

        }

        if(!isDayUnlocked(day)){

            slot.classList.add("locked");

        }else{

            slot.classList.remove("locked");

        }

    });

}

/* ========================================= */
/* AUTH STATE */
/* ========================================= */

onAuthStateChanged(auth, async(user) => {

    if(!user){

        stopAdminRealtimeListeners();
        window.location.href = "login.html";

        return;

    }

    currentUserSession = user;

    if(userName){
        userName.innerText = user.email;
    }

    if(profileAvatar){
        profileAvatar.innerText = getInitialFromEmail(user.email);
    }

    await loadAlbum(user);

    setupAdminExperience(user);

});

/* ========================================= */
/* PROGRESS */
/* ========================================= */

function updateProgress(){

    const percent = Math.round((completed / total) * 100);

    if(progressText){
        progressText.innerText = `${percent}%`;
    }

    if(progressDays){
        progressDays.innerText = `${completed} de ${total} completados`;
    }

    if(progressBarFill){
        progressBarFill.style.width = `${percent}%`;
    }

    if(progressMiniText){

        if(completed === 0){
            progressMiniText.innerText = "Comienza subiendo tu primera evidencia.";
        }else if(completed < total){
            progressMiniText.innerText = `Te faltan ${total - completed} retos para completar el álbum.`;
        }else{
            progressMiniText.innerText = "Álbum completado. ¡Excelente participación!";
        }

    }

    if(progressRing){

        const circumference = 377;
        const offset = circumference - (percent / 100) * circumference;

        progressRing.style.strokeDashoffset = offset;

    }

}

/* ========================================= */
/* LOAD ALBUM FROM LOCAL + REALTIME + STORAGE */
/* ========================================= */

async function loadAlbum(user){

    completed = 0;

    slots.forEach(slot => {

        slot.dataset.completed = "";
        slot.classList.remove("completed");
        slot.classList.remove("locked");

    });

    const completedDays = new Set();

    /* ========================================= */
    /* 1. CARGA RÁPIDA DESDE LOCALSTORAGE */
    /* ========================================= */

    slots.forEach(slot => {

        const day = slot.dataset.day;

        const localImage = localStorage.getItem(
            `${user.uid}-day-${day}`
        );

        if(localImage){

            renderStickerImage(
                slot,
                localImage,
                false
            );

            completedDays.add(day);

        }

    });

    completed = completedDays.size;

    updateProgress();

    applyDailyLocks();

    /* ========================================= */
    /* 2. CARGAR DESDE REALTIME DATABASE */
    /* ========================================= */

    try{

        const userRankingRef = realtimeRef(
            realtimeDB,
            `ranking/${user.uid}`
        );

        const snapshot = await realtimeGet(userRankingRef);

        if(snapshot.exists()){

            const data = snapshot.val();

            if(data.days){

                Object.entries(data.days).forEach(([dayKey,imageUrl]) => {

                    const day = dayKey.replace("day","");

                    const slot = document.querySelector(
                        `.album-slot[data-day="${day}"]`
                    );

                    if(slot && imageUrl){

                        localStorage.setItem(
                            `${user.uid}-day-${day}`,
                            imageUrl
                        );

                        renderStickerImage(
                            slot,
                            imageUrl,
                            false
                        );

                        completedDays.add(day);

                    }

                });

            }

            console.log("✅ Álbum cargado desde Realtime Database");

        }

    }catch(error){

        console.warn(
            "⚠️ No se pudo cargar desde Realtime Database. Se usará Storage/local:",
            error
        );

    }

    completed = completedDays.size;

    updateProgress();

    applyDailyLocks();

    /* ========================================= */
    /* 3. RESPALDO DESDE STORAGE */
    /* Solo revisa días desbloqueados para evitar tantos 404 */
    /* ========================================= */

    await Promise.all(

        Array.from(slots).map(async(slot) => {

            const day = slot.dataset.day;

            if(completedDays.has(day)) return;

            if(!isDayUnlocked(day)) return;

            try{

                const storageRef = ref(
                    storage,
                    `usuarios/${user.uid}/dia-${day}.jpg`
                );

                const imageUrl = await getDownloadURL(storageRef);

                localStorage.setItem(
                    `${user.uid}-day-${day}`,
                    imageUrl
                );

                renderStickerImage(
                    slot,
                    imageUrl,
                    false
                );

                completedDays.add(day);

            }catch(error){

                // Normal: ese día todavía no tiene imagen.

            }

        })

    );

    completed = completedDays.size;

    updateProgress();

    applyDailyLocks();

    /* ========================================= */
    /* 4. SINCRONIZAR RANKING EN REALTIME */
    /* ========================================= */

    try{

        await saveFullRankingRealtime(user);

        console.log("✅ Progreso sincronizado con Realtime Database");

    }catch(error){

        console.warn(
            "⚠️ No se pudo sincronizar progreso con Realtime Database:",
            error
        );

    }

    console.log(`✅ Álbum listo: ${completed} de ${total} retos cargados`);

}

/* ========================================= */
/* RENDER IMAGE IN CARD */
/* ========================================= */

function renderStickerImage(slot, imageUrl, animate = true){

    const image = slot.querySelector(".slot-image img");

    if(!image || !imageUrl) return;

    image.classList.add("uploaded-image");

    image.style.display = "block";
    image.style.visibility = "visible";
    image.style.opacity = "1";

    slot.dataset.completed = "true";
    slot.classList.add("completed");
    slot.classList.remove("locked");

    if(animate){

        image.style.transition = "none";
        image.style.opacity = "0";
        image.style.transform = `
            scale(2.2)
            rotate(-18deg)
            translateY(-150px)
        `;
        image.style.filter = `
            blur(18px)
            brightness(2)
            saturate(1.7)
        `;

    }else{

        image.style.transition = "none";
        image.style.opacity = "1";
        image.style.transform = "scale(1)";
        image.style.filter = "none";

    }

    image.onload = () => {

        image.style.display = "block";
        image.style.visibility = "visible";

        if(animate){

            setTimeout(() => {

                image.style.transition = `
                    1s cubic-bezier(.17,.89,.32,1.49)
                `;

                image.style.opacity = "1";
                image.style.transform = `
                    scale(1)
                    rotate(0deg)
                    translateY(0)
                `;
                image.style.filter = `
                    blur(0px)
                    brightness(1)
                    saturate(1)
                `;

            },100);

        }else{

            image.style.opacity = "1";
            image.style.transform = "scale(1)";
            image.style.filter = "none";

        }

    };

    image.onerror = () => {

        console.error("❌ No se pudo cargar la imagen:", imageUrl);

    };

    image.src = imageUrl;

    requestAnimationFrame(() => {

        image.style.opacity = "1";
        image.style.visibility = "visible";
        image.style.display = "block";

    });

}

/* ========================================= */
/* RESET SLOT AFTER DELETE */
/* ========================================= */

function resetSlotToDefault(day){

    const slot = document.querySelector(
        `.album-slot[data-day="${day}"]`
    );

    if(!slot) return;

    const image = slot.querySelector(".slot-image img");

    if(image){

        image.classList.remove("uploaded-image");

        image.style.transition = "none";
        image.style.display = "block";
        image.style.visibility = "visible";
        image.style.opacity = "1";
        image.style.transform = "scale(1)";
        image.style.filter = "none";

        image.src = `img/reto${day}.png`;

    }

    slot.dataset.completed = "";
    slot.classList.remove("completed");
    slot.classList.remove("uploading");

    const input = slot.querySelector(".file-input");

    if(input){
        input.value = "";
    }

}

/* ========================================= */
/* REALTIME DATABASE SAVE */
/* ========================================= */

function getCompletedDaysData(){

    const days = {};
    let count = 0;

    slots.forEach(slot => {

        const day = slot.dataset.day;
        const image = slot.querySelector(".slot-image img");

        if(slot.dataset.completed === "true" && image && image.src){

            days[`day${day}`] = image.src;
            count++;

        }

    });

    return {
        days,
        count
    };

}

async function saveFullRankingRealtime(user){

    const progress = getCompletedDaysData();

    completed = progress.count;

    updateProgress();

    const rankingRef = realtimeRef(
        realtimeDB,
        `ranking/${user.uid}`
    );

    await realtimeUpdate(rankingRef, {
        email:user.email,
        name:user.email.split("@")[0],
        completedCount:progress.count,
        updatedAt:Date.now(),
        days:progress.days
    });

}

async function saveDayRankingRealtime(user, day, imageUrl){

    const progress = getCompletedDaysData();

    const rankingRef = realtimeRef(
        realtimeDB,
        `ranking/${user.uid}`
    );

    await realtimeUpdate(rankingRef, {
        email:user.email,
        name:user.email.split("@")[0],
        completedCount:progress.count,
        updatedAt:Date.now(),
        [`days/day${day}`]:imageUrl
    });

    await markEvidenceAsPendingAfterUpload(
        user,
        day,
        imageUrl
    );

    console.log(
        `✅ Ranking actualizado en Realtime Database: día ${day}`
    );

}

async function markEvidenceAsPendingAfterUpload(user, day, imageUrl){

    try{

        const reviewRef = realtimeRef(
            realtimeDB,
            `reviews/${user.uid}/day${day}`
        );

        await realtimeUpdate(reviewRef, {
            status:ADMIN_STATUS.pending,
            observation:"",
            imageUrl:imageUrl,
            userEmail:user.email,
            day:Number(day),
            uploadedAt:Date.now(),
            reviewedAt:null,
            reviewedBy:""
        });

        console.log(`✅ Evidencia del día ${day} marcada como pendiente de revisión`);

    }catch(error){

        console.warn(
            "⚠️ No se pudo crear/actualizar estado de revisión. La evidencia sí fue cargada:",
            error
        );

    }

}

/* ========================================= */
/* DELETE OWN EVIDENCE SYSTEM */
/* ========================================= */

window.openDeleteEvidenceModal = function(){

    const modal = document.getElementById("deleteEvidenceModal");

    if(modal){

        modal.classList.add("active");

    }

};

window.closeDeleteEvidenceModal = function(){

    const modal = document.getElementById("deleteEvidenceModal");

    if(modal){

        modal.classList.remove("active");

    }

    const select = document.getElementById("deleteDaySelect");

    if(select){

        select.value = "";

    }

};

window.deleteEvidenceByDay = async function(){

    const select = document.getElementById("deleteDaySelect");

    if(!select){

        alert("No se encontró el selector de día.");

        return;

    }

    const day = Number(select.value);

    if(!day){

        alert("Selecciona el día que deseas borrar.");

        return;

    }

    const user = auth.currentUser;

    if(!user){

        alert("Debes iniciar sesión para borrar tu evidencia.");

        window.location.href = "login.html";

        return;

    }

    const slot = document.querySelector(
        `.album-slot[data-day="${day}"]`
    );

    if(!slot){

        alert("No se encontró el reto seleccionado.");

        return;

    }

    const isCompleted = slot.dataset.completed === "true";

    if(!isCompleted){

        alert(`El día ${day} no tiene evidencia cargada.`);

        return;

    }

    const confirmDelete = confirm(
        `¿Seguro que deseas borrar la evidencia del día ${day}? Esta acción no se puede deshacer.`
    );

    if(!confirmDelete){

        return;

    }

    try{

        const uid = user.uid;

        const deleteButton = document.querySelector(".confirm-delete-btn");

        if(deleteButton){

            deleteButton.disabled = true;
            deleteButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Borrando...
            `;

        }

        /* ========================================= */
        /* 1. BORRAR IMAGEN DE STORAGE */
        /* ========================================= */

        const imagePath = `usuarios/${uid}/dia-${day}.jpg`;

        const imageRef = ref(
            storage,
            imagePath
        );

        try{

            await deleteObject(imageRef);

            console.log(
                `✅ Imagen del día ${day} eliminada de Storage`
            );

        }catch(storageError){

            console.warn(
                `⚠️ No se pudo borrar la imagen del día ${day} en Storage. Puede que ya no exista.`,
                storageError
            );

        }

        /* ========================================= */
        /* 2. BORRAR DÍA EN REALTIME DATABASE */
        /* ========================================= */

        const rankingDayRef = realtimeRef(
            realtimeDB,
            `ranking/${uid}/days/day${day}`
        );

        await realtimeRemove(rankingDayRef);

        console.log(
            `✅ Día ${day} eliminado de Realtime Database`
        );

        /* ========================================= */
        /* 2.1 BORRAR REVISIÓN DEL DÍA */
        /* ========================================= */

        try{

            const reviewDayRef = realtimeRef(
                realtimeDB,
                `reviews/${uid}/day${day}`
            );

            await realtimeRemove(reviewDayRef);

            console.log(
                `✅ Revisión del día ${day} eliminada de Realtime Database`
            );

        }catch(reviewError){

            console.warn(
                `⚠️ No se pudo borrar la revisión del día ${day}. Puede que no exista.`,
                reviewError
            );

        }

        /* ========================================= */
        /* 3. BORRAR LOCALSTORAGE */
        /* ========================================= */

        localStorage.removeItem(
            `${uid}-day-${day}`
        );

        /* ========================================= */
        /* 4. LIMPIAR TARJETA VISUAL */
        /* ========================================= */

        resetSlotToDefault(day);

        /* ========================================= */
        /* 5. RECALCULAR PROGRESO */
        /* ========================================= */

        const progress = getCompletedDaysData();

        completed = progress.count;

        updateProgress();

        applyDailyLocks();

        /* ========================================= */
        /* 6. ACTUALIZAR RANKING COMPLETO */
        /* ========================================= */

        await saveFullRankingRealtime(user);

        alert(
            `La evidencia del día ${day} fue eliminada correctamente.`
        );

        window.closeDeleteEvidenceModal();

    }catch(error){

        console.error(
            "❌ Error eliminando evidencia:",
            error
        );

        alert(
            `No se pudo borrar la evidencia: ${error.code || error.message}`
        );

    }finally{

        const deleteButton = document.querySelector(".confirm-delete-btn");

        if(deleteButton){

            deleteButton.disabled = false;
            deleteButton.innerHTML = `
                Borrar evidencia
            `;

        }

    }

};

/* ========================================= */
/* RANKING SYSTEM - REALTIME */
/* ========================================= */

function listenRankingRealtime(callback){

    const rankingRef = realtimeRef(
        realtimeDB,
        "ranking"
    );

    return onValue(rankingRef, (snapshot) => {

        const data = snapshot.val() || {};

        const ranking = Object.entries(data).map(([uid,user]) => {

            return {
                uid,
                name:user.name || user.email || "Participante Aguakan",
                email:user.email || "",
                completed:Number(user.completedCount || 0),
                updatedAt:Number(user.updatedAt || 0)
            };

        }).filter(user => user.completed > 0);

        ranking.sort((a,b) => {

            if(b.completed !== a.completed){

                return b.completed - a.completed;

            }

            return a.updatedAt - b.updatedAt;

        });

        console.log(
            "✅ Ranking cargado en tiempo real:",
            ranking
        );

        callback(ranking);

    }, (error) => {

        console.error(
            "❌ Error leyendo ranking realtime:",
            error
        );

        alert("No se pudo cargar el ranking realtime. Revisa reglas de Realtime Database.");

    });

}

function closeRankingModal(){

    if(rankingUnsubscribe){

        rankingUnsubscribe();

        rankingUnsubscribe = null;

    }

    const modal = document.querySelector(".ranking-modal");

    if(modal){

        modal.classList.remove("show");

        setTimeout(() => {

            modal.remove();

        },300);

    }

}

function renderRankingModal(ranking){

    const existingModal = document.querySelector(".ranking-modal");

    if(existingModal){

        existingModal.remove();

    }

    const modal = document.createElement("div");

    modal.className = "ranking-modal";

    const rankingItems = ranking.map((user,index) => {

        const medal =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        `#${index + 1}`;

        const percent =
        Math.round((user.completed / total) * 100);

        return `
            <div class="ranking-item">
                <div class="ranking-position">${medal}</div>

                <div class="ranking-user">
                    <h3>${escapeHTML(user.name)}</h3>
                    <p>${user.completed} de ${total} retos completados</p>

                    <div class="ranking-progress">
                        <span style="width:${percent}%"></span>
                    </div>
                </div>

                <div class="ranking-score">
                    ${percent}%
                </div>
            </div>
        `;

    }).join("");

    modal.innerHTML = `
        <div class="ranking-content">

            <button class="ranking-close" aria-label="Cerrar ranking">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <div class="ranking-header">
                <span>🏆 Ranking General</span>
                <h2>Álbum de Bienestar</h2>
                <p>Participantes con más retos completados</p>
            </div>

            <div class="ranking-list">
                ${
                    ranking.length > 0
                    ? rankingItems
                    : `<div class="ranking-empty">Aún no hay participantes en el ranking.</div>`
                }
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {

        modal.classList.add("show");

    },50);

    const closeBtn = modal.querySelector(".ranking-close");

    closeBtn.addEventListener("click", () => {

        closeRankingModal();

    });

    modal.addEventListener("click", (e) => {

        if(e.target === modal){

            closeRankingModal();

        }

    });

}

function openRanking(){

    try{

        if(rankingButton){

            rankingButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Cargando...
            `;

        }

        if(rankingUnsubscribe){

            rankingUnsubscribe();

            rankingUnsubscribe = null;

        }

        rankingUnsubscribe = listenRankingRealtime((ranking) => {

            renderRankingModal(ranking);

            if(rankingButton){

                rankingButton.innerHTML = `
                    <i class="fa-solid fa-ranking-star"></i>
                    Ver Ranking
                `;

            }

        });

    }catch(error){

        console.error("Error cargando ranking realtime:", error);

        alert("No se pudo cargar el ranking realtime.");

        if(rankingButton){

            rankingButton.innerHTML = `
                <i class="fa-solid fa-ranking-star"></i>
                Ver Ranking
            `;

        }

    }

}

/* ========================================= */
/* ADMIN REVIEW SYSTEM */
/* ========================================= */

function setupAdminExperience(user){

    const isAdmin = isAuthorizedAdmin(user?.email);

    if(!isAdmin){

        currentAdminUser = null;
        hideAdminPanel();
        stopAdminRealtimeListeners();

        return;

    }

    currentAdminUser = user;
    showAdminPanel(user);
    bindAdminEventsOnce();
    startAdminRealtimeListeners();

}

function isAuthorizedAdmin(email){

    if(!email) return false;

    return AUTHORIZED_ADMIN_EMAILS.includes(
        String(email).trim().toLowerCase()
    );

}

function showAdminPanel(user){

    if(adminReviewPanel){
        adminReviewPanel.hidden = false;
        adminReviewPanel.classList.add("admin-review-visible");
    }

    if(adminReviewShortcut){
        adminReviewShortcut.hidden = false;
        adminReviewShortcut.classList.add("admin-review-visible");
    }

    if(adminReviewerEmail){
        adminReviewerEmail.innerText = user.email;
    }

    if(adminCurrentDay){
        adminCurrentDay.innerText = String(getCurrentChallengeDay());
    }

}

function hideAdminPanel(){

    if(adminReviewPanel){
        adminReviewPanel.hidden = true;
        adminReviewPanel.classList.remove("admin-review-visible");
    }

    if(adminReviewShortcut){
        adminReviewShortcut.hidden = true;
        adminReviewShortcut.classList.remove("admin-review-visible");
    }

}

function startAdminRealtimeListeners(){

    stopAdminRealtimeListeners();

    renderAdminLoading("Conectando con Firebase...");

    const rankingRef = realtimeRef(
        realtimeDB,
        "ranking"
    );

    const reviewsRef = realtimeRef(
        realtimeDB,
        "reviews"
    );

    adminRankingUnsubscribe = onValue(rankingRef, (snapshot) => {

        adminRankingData = snapshot.val() || {};
        buildAdminUsersCache();
        renderAdminReviewPanel();

    }, (error) => {

        console.error("❌ Error leyendo ranking para panel supervisor:", error);
        renderAdminError("No se pudo cargar el listado de participantes. Revisa permisos de Realtime Database.");

    });

    adminReviewsUnsubscribe = onValue(reviewsRef, (snapshot) => {

        adminReviewsData = snapshot.val() || {};
        buildAdminUsersCache();
        renderAdminReviewPanel();

    }, (error) => {

        console.warn("⚠️ No se pudieron leer los estados de revisión. Se mostrarán evidencias como pendientes:", error);
        adminReviewsData = {};
        buildAdminUsersCache();
        renderAdminReviewPanel();

    });

}

function stopAdminRealtimeListeners(){

    if(adminRankingUnsubscribe){
        adminRankingUnsubscribe();
        adminRankingUnsubscribe = null;
    }

    if(adminReviewsUnsubscribe){
        adminReviewsUnsubscribe();
        adminReviewsUnsubscribe = null;
    }

}

function buildAdminUsersCache(){

    adminUsersCache = Object.entries(adminRankingData || {}).map(([uid,user]) => {

        const days = normalizeDays(user?.days || {});
        const reviews = normalizeReviews(adminReviewsData?.[uid] || {});
        const evidenceCount = Object.keys(days).length;
        const mergedDays = [];

        for(let day = 1; day <= total; day++){

            const dayKey = `day${day}`;
            const imageUrl = days[dayKey] || "";
            const review = reviews[dayKey] || {};
            const status = imageUrl ? (review.status || ADMIN_STATUS.pending) : "empty";

            mergedDays.push({
                day,
                dayKey,
                imageUrl,
                taskTitle:getTaskTitle(day),
                taskDescription:getTaskDescription(day),
                status,
                observation:review.observation || "",
                reviewedBy:review.reviewedBy || "",
                reviewedAt:Number(review.reviewedAt || 0),
                uploadedAt:Number(review.uploadedAt || user?.updatedAt || 0)
            });

        }

        return {
            uid,
            email:user?.email || "",
            name:user?.name || getNameFromEmail(user?.email || "Participante Aguakan"),
            completed:Number(user?.completedCount || evidenceCount || 0),
            updatedAt:Number(user?.updatedAt || 0),
            evidenceCount,
            days:mergedDays,
            raw:user || {}
        };

    });

}

function normalizeDays(days){

    const normalized = {};

    Object.entries(days || {}).forEach(([key,value]) => {

        if(!value) return;

        const dayNumber = String(key).replace("day","");
        normalized[`day${Number(dayNumber)}`] = value;

    });

    return normalized;

}

function normalizeReviews(reviews){

    const normalized = {};

    Object.entries(reviews || {}).forEach(([key,value]) => {

        const dayNumber = String(key).replace("day","");
        normalized[`day${Number(dayNumber)}`] = value || {};

    });

    return normalized;

}

function renderAdminReviewPanel(){

    if(!adminReviewPanel || !currentAdminUser) return;

    const filteredUsers = getFilteredAdminUsers();
    const stats = calculateAdminStats(adminUsersCache);

    updateAdminStats(stats);

    if(adminCurrentView === "matrix"){
        renderAdminMatrix(filteredUsers);
    }else if(adminCurrentView === "pending"){
        renderAdminPending(filteredUsers);
    }else{
        renderAdminCards(filteredUsers);
    }

}

function calculateAdminStats(users){

    let totalEvidence = 0;
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    let completedAlbums = 0;

    users.forEach(user => {

        if(user.completed >= total){
            completedAlbums++;
        }

        user.days.forEach(day => {

            if(!day.imageUrl) return;

            totalEvidence++;

            if(day.status === ADMIN_STATUS.approved){
                approved++;
            }else if(day.status === ADMIN_STATUS.rejected){
                rejected++;
            }else{
                pending++;
            }

        });

    });

    return {
        users:users.length,
        totalEvidence,
        completedAlbums,
        currentDay:getCurrentChallengeDay(),
        pending,
        approved,
        rejected
    };

}

function updateAdminStats(stats){

    setText(adminTotalUsers, stats.users);
    setText(adminTotalEvidence, stats.totalEvidence);
    setText(adminCompletedAlbums, stats.completedAlbums);
    setText(adminCurrentDay, stats.currentDay);
    setText(adminPendingEvidence, stats.pending);
    setText(adminApprovedEvidence, stats.approved);
    setText(adminRejectedEvidence, stats.rejected);

}

function getFilteredAdminUsers(){

    const search = (adminReviewSearch?.value || "").trim().toLowerCase();
    const participantFilter = adminReviewFilter?.value || "all";
    const dayFilter = adminReviewDayFilter?.value || "all";
    const statusFilter = adminReviewStatusFilter?.value || "all";
    const sort = adminReviewSort?.value || "progressDesc";

    let users = [...adminUsersCache];

    if(search){

        users = users.filter(user => {

            const haystack = `${user.name} ${user.email}`.toLowerCase();

            return haystack.includes(search);

        });

    }

    users = users.filter(user => {

        if(participantFilter === "withEvidence"){
            return user.evidenceCount > 0;
        }

        if(participantFilter === "withoutEvidence"){
            return user.evidenceCount === 0;
        }

        if(participantFilter === "complete"){
            return user.completed >= total;
        }

        if(participantFilter === "incomplete"){
            return user.completed < total;
        }

        return true;

    });

    if(dayFilter !== "all"){

        const dayNumber = Number(dayFilter);

        users = users.filter(user => {

            const selectedDay = user.days.find(day => day.day === dayNumber);

            if(statusFilter === "all"){
                return true;
            }

            if(statusFilter === "pending"){
                return selectedDay?.imageUrl && selectedDay.status === ADMIN_STATUS.pending;
            }

            return selectedDay?.imageUrl && selectedDay?.status === statusFilter;

        });

    }else if(statusFilter !== "all"){

        users = users.filter(user => {

            return user.days.some(day => {

                if(!day.imageUrl) return false;

                if(statusFilter === "pending"){
                    return day.status === ADMIN_STATUS.pending;
                }

                return day.status === statusFilter;

            });

        });

    }

    users.sort((a,b) => {

        if(sort === "progressAsc"){
            return a.completed - b.completed || a.email.localeCompare(b.email);
        }

        if(sort === "nameAsc"){
            return a.name.localeCompare(b.name) || a.email.localeCompare(b.email);
        }

        if(sort === "updatedDesc"){
            return b.updatedAt - a.updatedAt;
        }

        return b.completed - a.completed || a.email.localeCompare(b.email);

    });

    return users;

}

function getVisibleDaysForAdmin(user){

    const dayFilter = adminReviewDayFilter?.value || "all";
    const statusFilter = adminReviewStatusFilter?.value || "all";

    let days = [...user.days];

    if(dayFilter !== "all"){
        days = days.filter(day => day.day === Number(dayFilter));
    }

    if(statusFilter !== "all"){
        days = days.filter(day => day.imageUrl && day.status === statusFilter);
    }

    return days;

}

function renderAdminCards(users){

    showAdminView("cards");

    if(!adminReviewGrid) return;

    if(users.length === 0){
        renderAdminEmpty();
        return;
    }

    hideAdminEmpty();

    adminReviewGrid.innerHTML = users.map(user => {

        const percent = Math.round((user.completed / total) * 100);
        const visibleDays = getVisibleDaysForAdmin(user);
        const approvedCount = user.days.filter(day => day.imageUrl && day.status === ADMIN_STATUS.approved).length;
        const rejectedCount = user.days.filter(day => day.imageUrl && day.status === ADMIN_STATUS.rejected).length;
        const pendingCount = user.days.filter(day => day.imageUrl && day.status === ADMIN_STATUS.pending).length;

        return `
            <article class="admin-participant-card" data-admin-user="${escapeHTML(user.uid)}">

                <div class="admin-participant-head">

                    <div class="admin-participant-avatar">
                        ${escapeHTML(getInitialFromEmail(user.email || user.name))}
                    </div>

                    <div class="admin-participant-main">
                        <h3>${escapeHTML(user.name || "Participante Aguakan")}</h3>
                        <p>${escapeHTML(user.email || "Correo no disponible")}</p>

                        <div class="admin-participant-progress">
                            <span style="width:${percent}%"></span>
                        </div>
                    </div>

                    <div class="admin-participant-score">
                        <strong>${user.completed}/${total}</strong>
                        <span>${percent}%</span>
                    </div>

                </div>

                <div class="admin-participant-status-row">
                    <span class="admin-chip admin-chip-pending"><i class="fa-solid fa-clock"></i>${pendingCount} pendientes</span>
                    <span class="admin-chip admin-chip-approved"><i class="fa-solid fa-circle-check"></i>${approvedCount} aprobadas</span>
                    <span class="admin-chip admin-chip-rejected"><i class="fa-solid fa-circle-xmark"></i>${rejectedCount} rechazadas</span>
                    <span class="admin-chip"><i class="fa-solid fa-clock-rotate-left"></i>${formatDate(user.updatedAt)}</span>
                </div>

                <div class="admin-evidence-days-grid">
                    ${visibleDays.map(day => renderAdminDayCell(user, day)).join("")}
                </div>

            </article>
        `;

    }).join("");

    bindAdminEvidenceClicks();

}

function renderAdminDayCell(user, day){

    const statusClass = day.imageUrl ? `admin-status-${day.status}` : "admin-status-empty";
    const statusText = day.imageUrl ? ADMIN_STATUS_LABELS[day.status] || "Pendiente" : "Sin evidencia";
    const statusIcon = day.imageUrl ? ADMIN_STATUS_ICONS[day.status] || "fa-clock" : "fa-image";

    if(!day.imageUrl){

        return `
            <div class="admin-day-cell admin-day-empty" data-day="${day.day}">
                <div class="admin-day-number">Día ${day.day}</div>
                <div class="admin-day-empty-box">
                    <i class="fa-regular fa-image"></i>
                    <span>Sin evidencia</span>
                </div>
                <small>${escapeHTML(day.taskTitle)}</small>
            </div>
        `;

    }

    return `
        <button 
            type="button"
            class="admin-day-cell admin-day-with-image ${statusClass}"
            data-admin-evidence-open="true"
            data-uid="${escapeHTML(user.uid)}"
            data-day="${day.day}">

            <div class="admin-day-number">Día ${day.day}</div>

            <div class="admin-day-image-wrap">
                <img src="${escapeAttribute(day.imageUrl)}" alt="Evidencia día ${day.day} de ${escapeAttribute(user.email)}" loading="lazy">
            </div>

            <div class="admin-day-meta">
                <strong>${escapeHTML(day.taskTitle)}</strong>
                <span class="admin-status-pill ${statusClass}">
                    <i class="fa-solid ${statusIcon}"></i>
                    ${statusText}
                </span>
            </div>

        </button>
    `;

}

function renderAdminMatrix(users){

    showAdminView("matrix");

    if(!adminReviewMatrix) return;

    if(users.length === 0){
        renderAdminEmpty();
        return;
    }

    hideAdminEmpty();

    const headerDays = Array.from({length:total}, (_,index) => index + 1).map(day => {
        return `<div class="admin-matrix-head-day">${day}</div>`;
    }).join("");

    const rows = users.map(user => {

        const cells = user.days.map(day => {

            if(!day.imageUrl){
                return `<div class="admin-matrix-cell empty" title="Día ${day.day}: sin evidencia">—</div>`;
            }

            const statusIcon = day.status === ADMIN_STATUS.approved ? "✓" : day.status === ADMIN_STATUS.rejected ? "×" : "!";

            return `
                <button 
                    class="admin-matrix-cell has-image status-${day.status}"
                    type="button"
                    data-admin-evidence-open="true"
                    data-uid="${escapeHTML(user.uid)}"
                    data-day="${day.day}"
                    title="${escapeAttribute(user.email)} • Día ${day.day}">
                    <img src="${escapeAttribute(day.imageUrl)}" alt="Día ${day.day}" loading="lazy">
                    <span>${statusIcon}</span>
                </button>
            `;

        }).join("");

        return `
            <div class="admin-matrix-row">
                <div class="admin-matrix-user">
                    <strong>${escapeHTML(user.name)}</strong>
                    <span>${escapeHTML(user.email)}</span>
                    <small>${user.completed}/${total}</small>
                </div>
                <div class="admin-matrix-days">
                    ${cells}
                </div>
            </div>
        `;

    }).join("");

    adminReviewMatrix.innerHTML = `
        <div class="admin-matrix-table">
            <div class="admin-matrix-header">
                <div class="admin-matrix-head-user">Participante</div>
                <div class="admin-matrix-head-days">
                    ${headerDays}
                </div>
            </div>
            ${rows}
        </div>
    `;

    bindAdminEvidenceClicks();

}

function renderAdminPending(users){

    showAdminView("pending");

    if(!adminReviewGrid) return;

    const pendingItems = [];

    users.forEach(user => {

        user.days.forEach(day => {

            if(day.imageUrl && day.status === ADMIN_STATUS.pending){
                pendingItems.push({user, day});
            }

        });

    });

    pendingItems.sort((a,b) => {
        return (b.day.uploadedAt || b.user.updatedAt) - (a.day.uploadedAt || a.user.updatedAt);
    });

    if(pendingItems.length === 0){
        renderAdminEmpty("No hay evidencias pendientes por revisar.");
        return;
    }

    hideAdminEmpty();

    adminReviewGrid.innerHTML = `
        <div class="admin-pending-list">
            ${pendingItems.map(item => `
                <button 
                    type="button"
                    class="admin-pending-item"
                    data-admin-evidence-open="true"
                    data-uid="${escapeHTML(item.user.uid)}"
                    data-day="${item.day.day}">

                    <div class="admin-pending-thumb">
                        <img src="${escapeAttribute(item.day.imageUrl)}" alt="Evidencia pendiente día ${item.day.day}" loading="lazy">
                    </div>

                    <div class="admin-pending-info">
                        <strong>${escapeHTML(item.user.email)}</strong>
                        <span>Día ${item.day.day} • ${escapeHTML(item.day.taskTitle)}</span>
                        <small>Subida/actualizada: ${formatDate(item.day.uploadedAt || item.user.updatedAt)}</small>
                    </div>

                    <div class="admin-pending-action">
                        <i class="fa-solid fa-eye"></i>
                        Revisar
                    </div>

                </button>
            `).join("")}
        </div>
    `;

    bindAdminEvidenceClicks();

}

function showAdminView(view){

    adminCurrentView = view;

    if(adminReviewGrid){
        adminReviewGrid.hidden = view === "matrix";
    }

    if(adminReviewMatrix){
        adminReviewMatrix.hidden = view !== "matrix";
    }

    adminReviewTabs.forEach(tab => {
        tab.classList.toggle("active", tab.dataset.adminView === view);
    });

}

function renderAdminLoading(message = "Cargando evidencias de participantes..."){

    if(!adminReviewGrid) return;

    showAdminView("cards");
    hideAdminEmpty();

    adminReviewGrid.innerHTML = `
        <div class="admin-review-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>${escapeHTML(message)}</span>
        </div>
    `;

}

function renderAdminError(message){

    if(!adminReviewGrid) return;

    showAdminView("cards");
    hideAdminEmpty();

    adminReviewGrid.innerHTML = `
        <div class="admin-review-loading admin-review-error-box">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${escapeHTML(message)}</span>
        </div>
    `;

}

function renderAdminEmpty(message = "No se encontraron evidencias con los filtros actuales."){

    if(adminReviewGrid){
        adminReviewGrid.innerHTML = "";
    }

    if(adminReviewMatrix){
        adminReviewMatrix.innerHTML = "";
    }

    if(adminReviewEmpty){
        adminReviewEmpty.hidden = false;
        const paragraph = adminReviewEmpty.querySelector("p");
        if(paragraph){
            paragraph.innerText = message;
        }
    }

}

function hideAdminEmpty(){

    if(adminReviewEmpty){
        adminReviewEmpty.hidden = true;
    }

}

function bindAdminEventsOnce(){

    if(adminReviewPanel?.dataset.eventsReady === "true") return;

    if(adminReviewPanel){
        adminReviewPanel.dataset.eventsReady = "true";
    }

    if(adminReviewShortcut){
        adminReviewShortcut.addEventListener("click", () => {
            adminReviewPanel?.scrollIntoView({behavior:"smooth", block:"start"});
        });
    }

    [
        adminReviewSearch,
        adminReviewFilter,
        adminReviewDayFilter,
        adminReviewStatusFilter,
        adminReviewSort
    ].forEach(control => {

        if(!control) return;

        control.addEventListener("input", () => {
            renderAdminReviewPanel();
        });

        control.addEventListener("change", () => {
            renderAdminReviewPanel();
        });

    });

    adminReviewTabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const view = tab.dataset.adminView || "cards";
            adminCurrentView = view;
            renderAdminReviewPanel();

        });

    });

    if(adminRefreshReviewBtn){

        adminRefreshReviewBtn.addEventListener("click", async() => {

            adminRefreshReviewBtn.disabled = true;
            adminRefreshReviewBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Actualizando`;

            try{
                await refreshAdminDataOnce();
            }finally{
                adminRefreshReviewBtn.disabled = false;
                adminRefreshReviewBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Actualizar`;
            }

        });

    }

    if(adminExportReviewBtn){

        adminExportReviewBtn.addEventListener("click", () => {
            exportAdminSummaryCSV();
        });

    }

    if(adminEvidenceClose){
        adminEvidenceClose.addEventListener("click", closeAdminEvidenceModal);
    }

    if(adminEvidenceModal){
        adminEvidenceModal.addEventListener("click", (e) => {
            if(e.target === adminEvidenceModal){
                closeAdminEvidenceModal();
            }
        });
    }

    if(adminApproveEvidenceBtn){
        adminApproveEvidenceBtn.addEventListener("click", () => updateCurrentEvidenceReview(ADMIN_STATUS.approved));
    }

    if(adminRejectEvidenceBtn){
        adminRejectEvidenceBtn.addEventListener("click", () => updateCurrentEvidenceReview(ADMIN_STATUS.rejected));
    }

    if(adminPendingEvidenceBtn){
        adminPendingEvidenceBtn.addEventListener("click", () => updateCurrentEvidenceReview(ADMIN_STATUS.pending));
    }

}

async function refreshAdminDataOnce(){

    if(!currentAdminUser) return;

    renderAdminLoading("Actualizando evidencias...");

    try{

        const rankingSnapshot = await realtimeGet(
            realtimeRef(realtimeDB,"ranking")
        );

        const reviewsSnapshot = await realtimeGet(
            realtimeRef(realtimeDB,"reviews")
        );

        adminRankingData = rankingSnapshot.val() || {};
        adminReviewsData = reviewsSnapshot.val() || {};

        buildAdminUsersCache();
        renderAdminReviewPanel();

    }catch(error){

        console.error("❌ Error actualizando panel supervisor:", error);
        renderAdminError("No se pudo actualizar el panel. Revisa conexión o permisos de Firebase.");

    }

}

function bindAdminEvidenceClicks(){

    document.querySelectorAll("[data-admin-evidence-open='true']").forEach(button => {

        if(button.dataset.bound === "true") return;

        button.dataset.bound = "true";

        button.addEventListener("click", (e) => {

            e.preventDefault();
            e.stopPropagation();

            const uid = button.dataset.uid;
            const day = Number(button.dataset.day);

            openAdminEvidenceModal(uid, day);

        });

    });

}

function openAdminEvidenceModal(uid, dayNumber){

    const user = adminUsersCache.find(item => item.uid === uid);

    if(!user){
        alert("No se encontró el participante seleccionado.");
        return;
    }

    const day = user.days.find(item => item.day === Number(dayNumber));

    if(!day || !day.imageUrl){
        alert("Este día no tiene evidencia cargada.");
        return;
    }

    currentAdminEvidence = {
        uid:user.uid,
        user,
        day
    };

    if(adminEvidenceModalTitle){
        adminEvidenceModalTitle.innerText = `Evidencia del día ${day.day}`;
    }

    if(adminEvidenceModalSubtitle){
        adminEvidenceModalSubtitle.innerText = `${user.email} • ${day.taskTitle}`;
    }

    if(adminEvidenceModalImage){
        adminEvidenceModalImage.src = day.imageUrl;
        adminEvidenceModalImage.alt = `Evidencia del día ${day.day} de ${user.email}`;
    }

    if(adminEvidenceUserEmail){
        adminEvidenceUserEmail.innerText = user.email || "Correo no disponible";
    }

    if(adminEvidenceDay){
        adminEvidenceDay.innerText = `Día ${day.day} • ${day.taskTitle}`;
    }

    if(adminEvidenceStatus){
        adminEvidenceStatus.innerText = ADMIN_STATUS_LABELS[day.status] || "Pendiente";
        adminEvidenceStatus.dataset.status = day.status;
    }

    if(adminEvidenceObservation){
        adminEvidenceObservation.value = day.observation || "";
    }

    if(adminEvidenceModal){
        adminEvidenceModal.hidden = false;
        requestAnimationFrame(() => {
            adminEvidenceModal.classList.add("show");
        });
    }

}

function closeAdminEvidenceModal(){

    if(!adminEvidenceModal) return;

    adminEvidenceModal.classList.remove("show");

    setTimeout(() => {
        adminEvidenceModal.hidden = true;
        currentAdminEvidence = null;
    },250);

}

async function updateCurrentEvidenceReview(status){

    if(!currentAdminEvidence || !currentAdminUser){
        alert("No hay evidencia seleccionada para revisar.");
        return;
    }

    const { uid, user, day } = currentAdminEvidence;
    const observation = adminEvidenceObservation?.value?.trim() || "";

    if(status === ADMIN_STATUS.rejected && !observation){

        const confirmWithoutObservation = confirm(
            "Vas a rechazar esta evidencia sin observación. ¿Deseas continuar?"
        );

        if(!confirmWithoutObservation) return;

    }

    const buttons = [
        adminApproveEvidenceBtn,
        adminRejectEvidenceBtn,
        adminPendingEvidenceBtn
    ];

    buttons.forEach(button => {
        if(button) button.disabled = true;
    });

    try{

        const reviewRef = realtimeRef(
            realtimeDB,
            `reviews/${uid}/day${day.day}`
        );

        await realtimeUpdate(reviewRef, {
            status,
            observation,
            imageUrl:day.imageUrl,
            userEmail:user.email,
            day:day.day,
            taskTitle:day.taskTitle,
            reviewedBy:currentAdminUser.email,
            reviewedAt:Date.now(),
            updatedAt:Date.now()
        });

        console.log(
            `✅ Evidencia revisada: ${user.email} día ${day.day} → ${status}`
        );

        if(adminEvidenceStatus){
            adminEvidenceStatus.innerText = ADMIN_STATUS_LABELS[status] || "Pendiente";
            adminEvidenceStatus.dataset.status = status;
        }

        currentAdminEvidence.day.status = status;
        currentAdminEvidence.day.observation = observation;
        currentAdminEvidence.day.reviewedBy = currentAdminUser.email;
        currentAdminEvidence.day.reviewedAt = Date.now();

        showAdminToast(
            `Evidencia del día ${day.day} marcada como ${ADMIN_STATUS_LABELS[status].toLowerCase()}.`
        );

        renderAdminReviewPanel();

    }catch(error){

        console.error("❌ Error actualizando revisión:", error);
        alert(`No se pudo actualizar la revisión: ${error.code || error.message}`);

    }finally{

        buttons.forEach(button => {
            if(button) button.disabled = false;
        });

    }

}

function exportAdminSummaryCSV(){

    if(adminUsersCache.length === 0){
        alert("No hay información para exportar.");
        return;
    }

    const rows = [
        [
            "correo",
            "nombre",
            "dia",
            "reto",
            "tiene_evidencia",
            "estado",
            "observacion",
            "revisado_por",
            "fecha_revision",
            "url_evidencia"
        ]
    ];

    adminUsersCache.forEach(user => {

        user.days.forEach(day => {

            rows.push([
                user.email,
                user.name,
                `Día ${day.day}`,
                day.taskTitle,
                day.imageUrl ? "Sí" : "No",
                day.imageUrl ? (ADMIN_STATUS_LABELS[day.status] || "Pendiente") : "Sin evidencia",
                day.observation || "",
                day.reviewedBy || "",
                day.reviewedAt ? formatDate(day.reviewedAt) : "",
                day.imageUrl || ""
            ]);

        });

    });

    const csv = rows.map(row => {
        return row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(",");
    }).join("\n");

    const blob = new Blob([csv], {
        type:"text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `revision-evidencias-album-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);

}

/* ========================================= */
/* SLOT SYSTEM */
/* ========================================= */

slots.forEach(slot => {

    const input = slot.querySelector(".file-input");

    if(!input) return;

    slot.addEventListener("click", () => {

        const day = slot.dataset.day;

        if(!isDayUnlocked(day)){

            alert(`🔒 El reto del día ${day} aún no está desbloqueado.`);

            return;

        }

        input.click();

    });

    input.addEventListener("change", async(e) => {

        const file = e.target.files[0];

        if(!file) return;

        if(!file.type.startsWith("image/")){

            alert("Solo se permiten imágenes.");

            input.value = "";

            return;

        }

        const user = auth.currentUser;

        if(!user){

            alert("Debes iniciar sesión.");

            input.value = "";

            return;

        }

        const day = slot.dataset.day;

        if(!isDayUnlocked(day)){

            alert(`🔒 El reto del día ${day} aún no está disponible.`);

            input.value = "";

            return;

        }

        const wasCompleted = slot.dataset.completed === "true";

        let downloadURL = null;

        try{

            slot.classList.add("uploading");

            console.log(`⏳ Iniciando subida del día ${day}...`);

            /* ========================================= */
            /* 1. SUBIR A STORAGE */
            /* ========================================= */

            const storageRef = ref(
                storage,
                `usuarios/${user.uid}/dia-${day}.jpg`
            );

            await uploadBytes(storageRef, file);

            downloadURL = await getDownloadURL(storageRef);

            localStorage.setItem(
                `${user.uid}-day-${day}`,
                downloadURL
            );

            console.log(
                `✅ Imagen del día ${day} subida a Storage:`,
                downloadURL
            );

            /* ========================================= */
            /* 2. ACTUALIZAR PROGRESO LOCAL */
            /* ========================================= */

            if(!wasCompleted){

                completed++;

            }

            slot.dataset.completed = "true";

            updateProgress();

            applyDailyLocks();

            /* ========================================= */
            /* 3. MOSTRAR IMAGEN */
            /* ========================================= */

            renderStickerImage(
                slot,
                downloadURL,
                true
            );

            slot.classList.remove("completed");

            void slot.offsetWidth;

            slot.classList.add("completed");

            createParticles(slot);

            playPop();

            console.log(
                `✅ Imagen del día ${day} pintada en el álbum`
            );

            /* ========================================= */
            /* 4. GUARDAR RANKING EN REALTIME DATABASE */
            /* ========================================= */

            await saveDayRankingRealtime(
                user,
                day,
                downloadURL
            );

            console.log(
                `✅ Día ${day} guardado en ranking realtime`
            );

        }catch(error){

            console.error(
                "❌ Error completo al subir/guardar imagen:",
                error
            );

            alert(
                `Error guardando la imagen: ${error.code || error.message}`
            );

        }finally{

            slot.classList.remove("uploading");

            input.value = "";

            applyDailyLocks();

        }

    });

});

/* ========================================= */
/* PARTICLES */
/* ========================================= */

function createParticles(slot){

    for(let i = 0; i < 14; i++){

        const particle = document.createElement("span");

        particle.classList.add("particle");

        slot.appendChild(particle);

        const x = Math.random() * 260 - 130;
        const y = Math.random() * 260 - 130;

        particle.style.left = "50%";
        particle.style.top = "50%";

        particle.style.setProperty("--x", `${x}px`);
        particle.style.setProperty("--y", `${y}px`);

        particle.style.animationDelay = `${Math.random() * .25}s`;

        setTimeout(() => {

            particle.remove();

        },1500);

    }

}

/* ========================================= */
/* SOUND */
/* ========================================= */

function playPop(){

    const audio = new Audio("sounds/pop.mp3");

    audio.volume = .35;

    audio.play().catch(() => {

        console.log("Audio bloqueado por el navegador o archivo no encontrado.");

    });

}

/* ========================================= */
/* PREVIEW IMAGE */
/* ========================================= */

document.querySelectorAll(".slot-image img").forEach(img => {

    img.addEventListener("dblclick", (e) => {

        e.stopPropagation();

        if(previewModal && previewImage){

            previewModal.style.display = "flex";
            previewImage.src = img.src;

        }

    });

});

/* ========================================= */
/* CLOSE MODAL */
/* ========================================= */

if(closePreview){

    closePreview.addEventListener("click", () => {

        if(previewModal){
            previewModal.style.display = "none";
        }

    });

}

if(previewModal){

    previewModal.addEventListener("click", (e) => {

        if(e.target === previewModal){
            previewModal.style.display = "none";
        }

    });

}

/* ========================================= */
/* DELETE MODAL CLOSE BY BACKDROP */
/* ========================================= */

const deleteEvidenceModal = document.getElementById("deleteEvidenceModal");

if(deleteEvidenceModal){

    deleteEvidenceModal.addEventListener("click", (e) => {

        if(e.target === deleteEvidenceModal){

            window.closeDeleteEvidenceModal();

        }

    });

}

/* ========================================= */
/* LEGEND DETECTION */
/* ========================================= */

function checkLegend(){

    if(completed === total){

        setTimeout(() => {

            alert("🏆 ¡FELICIDADES! HAS COMPLETADO EL ÁLBUM.");

        },800);

    }

}

/* ========================================= */
/* WATCH PROGRESS */
/* ========================================= */

if(progressText){

    const observer = new MutationObserver(() => {

        checkLegend();

    });

    observer.observe(progressText, {
        childList:true
    });

}

/* ========================================= */
/* AUTO STYLE */
/* ========================================= */

const style = document.createElement("style");

style.innerHTML = `

.particle{

    position:absolute;
    width:12px;
    height:12px;
    border-radius:50%;
    background:white;
    pointer-events:none;
    animation:particle 1.2s forwards ease;
    z-index:50;
    box-shadow:
    0 0 12px rgba(255,255,255,.9),
    0 0 22px rgba(17,192,243,.8);

}

@keyframes particle{

    0%{

        opacity:1;
        transform:translate(0,0) scale(1);

    }

    100%{

        opacity:0;
        transform:translate(var(--x),var(--y)) scale(0);

    }

}

.completed{

    animation:successPulse .8s ease;

}

@keyframes successPulse{

    0%{

        transform:scale(.96);

    }

    50%{

        transform:scale(1.035);

    }

    100%{

        transform:scale(1);

    }

}

.uploading{

    pointer-events:none;
    position:relative;
    overflow:hidden;

}

.uploading::before{

    content:"";

    position:absolute;
    inset:0;
    background:
    linear-gradient(
        120deg,
        transparent,
        rgba(255,255,255,.45),
        transparent
    );
    z-index:20;
    animation:loadingShine 1s infinite;

}

@keyframes loadingShine{

    0%{

        transform:translateX(-120%);

    }

    100%{

        transform:translateX(180%);

    }

}

.album-slot.locked{

    opacity:.45;
    filter:grayscale(1);
    cursor:not-allowed;

}

.album-slot.locked::before{

    content:"🔒 BLOQUEADO";
    position:absolute;
    inset:0;
    display:flex;
    justify-content:center;
    align-items:center;
    background:rgba(0,45,90,.72);
    color:white;
    font-size:.85rem;
    font-weight:900;
    letter-spacing:1px;
    z-index:30;
    text-align:center;

}

.album-slot.locked:hover{

    transform:none;
    box-shadow:none;

}

`;

document.head.appendChild(style);

/* ========================================= */
/* RANKING BUTTON */
/* ========================================= */

if(rankingButton){

    rankingButton.addEventListener("click", (e) => {

        e.stopPropagation();

        openRanking();

    });

}

/* ========================================= */
/* HELPERS */
/* ========================================= */

function getTaskTitle(day){

    const slot = document.querySelector(`.album-slot[data-day="${day}"]`);

    return slot?.querySelector(".slot-content h3")?.innerText?.trim() || `Reto día ${day}`;

}

function getTaskDescription(day){

    const slot = document.querySelector(`.album-slot[data-day="${day}"]`);

    return slot?.querySelector(".slot-content p")?.innerText?.trim() || "Evidencia del reto.";

}

function escapeHTML(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}

function escapeAttribute(value){

    return escapeHTML(value).replace(/`/g,"&#096;");

}

function setText(element, value){

    if(element){
        element.innerText = String(value);
    }

}

function getNameFromEmail(email){

    if(!email) return "Participante Aguakan";

    return String(email).split("@")[0] || "Participante Aguakan";

}

function getInitialFromEmail(email){

    const source = getNameFromEmail(email);

    return source.charAt(0).toUpperCase() || "A";

}

function formatDate(timestamp){

    if(!timestamp) return "Sin fecha";

    try{

        return new Intl.DateTimeFormat("es-MX", {
            day:"2-digit",
            month:"short",
            year:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        }).format(new Date(timestamp));

    }catch(error){

        return "Sin fecha";

    }

}

function showAdminToast(message){

    const existing = document.querySelector(".admin-toast");

    if(existing){
        existing.remove();
    }

    const toast = document.createElement("div");
    toast.className = "admin-toast";
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    },50);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(),300);
    },3200);

}

/* ========================================= */
/* INIT */
/* ========================================= */

updateProgress();
