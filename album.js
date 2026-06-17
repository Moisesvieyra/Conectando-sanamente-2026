/* ========================================= */
/* AGUAKAN ALBUM ENGINE V7 */
/* CONECTANDO SANAMENTE 2026 */
/* STORAGE + REALTIME RANKING */
/* DELETE OWN EVIDENCE ENABLED */
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
VERSION  : V7.1 DELETE OWN EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

/* ========================================= */
/* ELEMENTOS */
/* ========================================= */

const slots = document.querySelectorAll(".album-slot");
const progressRing = document.getElementById("progress-ring");
const progressText = document.getElementById("progress-text");
const progressDays = document.getElementById("progress-days");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const closePreview = document.querySelector(".close-preview");
const userName = document.getElementById("user-name");
const rankingButton = document.querySelector(".premium-btn");

/* ========================================= */
/* VARIABLES */
/* ========================================= */

let completed = 0;
const total = 21;
let rankingUnsubscribe = null;

/* ========================================= */
/* DAILY LOCK CONFIG */
/* ========================================= */

/*
    Cambia esta fecha al día real en que inicia el reto.

    Ejemplo real:
    const challengeStartDate = new Date("2026-06-17T00:00:00");

    Para pruebas:
    - Fecha de hoy = solo Día 1 desbloqueado.
    - Fecha de hace 4 días = Día 1 al Día 5 desbloqueados.
*/

const challengeStartDate = new Date("2026-06-21T00:00:00");

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

        window.location.href = "login.html";

        return;

    }

    if(userName){
        userName.innerText = user.email;
    }

    await loadAlbum(user);

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

    console.log(
        `✅ Ranking actualizado en Realtime Database: día ${day}`
    );

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
                    <h3>${user.name}</h3>
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
/* INIT */
/* ========================================= */

updateProgress();
