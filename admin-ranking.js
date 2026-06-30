/* =========================================================
   ADMIN RANKING + EVIDENCE REVIEW ENGINE
   CONECTANDO SANAMENTE 2026 • AGUAKAN
   VERSION: V2.4 SUPERVISION + USER EVIDENCE VALIDATION + EMAIL ON REJECT

   Mantiene:
   - Validación de acceso supervisor
   - Ranking en tiempo real
   - Ganador global
   - Tabla de participantes
   - Resumen general

   Agrega:
   - Apartado de evidencias por usuario
   - Revisión por día 1 al 21
   - Estados: pendiente, aprobada, rechazada, sin evidencia
   - Observaciones internas
   - Exportación CSV
   - Modal de revisión
========================================================= */

/* =========================================================
   IMPORTS
========================================================= */

import { auth, realtimeDB } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    ref as realtimeRef,
    onValue,
    get,
    update as realtimeUpdate
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================================================
   CONFIG
========================================================= */

const ADMIN_EMAILS = [
    "ksanchez@aguakan.com",
    "echan@aguakan.com"
];

const TOTAL_DAYS = 21;

const DATABASE_PATHS = {
    ranking:"ranking",
    globalWinner:"globalWinner",
    evidenceReviews:"evidenceReviews"
};

/*
    SAFE REVIEW FALLBACK
    -----------------------------------------------------
    Si Firebase bloquea la escritura en evidenceReviews por reglas
    de Realtime Database, el panel ya no se rompe ni lanza alerta
    invasiva. Guarda la revisión en localStorage para que la
    supervisora pueda continuar revisando en ese navegador.

    Para que las revisiones queden compartidas entre Keyla/Edith
    y persistan en cualquier equipo, TI debe permitir escritura
    en la ruta evidenceReviews para las cuentas administradoras.
*/

const LOCAL_REVIEWS_STORAGE_KEY = "aguakanEvidenceReviewsLocalV21";
const PERMISSION_ERROR_CODES = [
    "PERMISSION_DENIED",
    "permission-denied"
];

/*
    EMAIL ON REJECT CONFIG
    -----------------------------------------------------
    1) Crea un Google Apps Script como Web App.
    2) Pega la URL /exec en REJECT_EMAIL_WEB_APP_URL.
    3) Para que el correo salga desde ksanchez@aguakan.com,
       el Apps Script debe estar creado y desplegado desde esa cuenta
       o desde una cuenta con alias de envío configurado.
*/

const REJECT_EMAIL_WEB_APP_URL = "https://script.google.com/a/macros/aguakan.com/s/AKfycbz12csTyhdNIB-zxU3bfx8-zpueZr_hARk8GiEZsgTxlK07xbJum94Nz4Z25Wj7RLy6KA/exec";
const REJECT_EMAIL_ENABLED = true;
const REJECT_EMAIL_FETCH_OPTIONS = {
    method:"POST",
    mode:"no-cors",
    credentials:"include",
    cache:"no-store",
    headers:{
        "Content-Type":"text/plain;charset=utf-8"
    }
};

const REVIEW_STATUS = {
    pending:{
        key:"pending",
        label:"Pendiente",
        className:"pending",
        icon:"fa-clock"
    },
    approved:{
        key:"approved",
        label:"Aprobada",
        className:"approved",
        icon:"fa-circle-check"
    },
    rejected:{
        key:"rejected",
        label:"Rechazada",
        className:"rejected",
        icon:"fa-circle-xmark"
    },
    missing:{
        key:"missing",
        label:"Sin evidencia",
        className:"missing",
        icon:"fa-image-slash"
    }
};

const CHALLENGE_CATALOG = {
    1:{title:"Ordena y limpia", description:"Comparte tu espacio organizado."},
    2:{title:"Hidratación", description:"Comparte tu botella de agua."},
    3:{title:"Tiempo en familia", description:"Comparte tu actividad familiar."},
    4:{title:"Respiración consciente", description:"Comparte tu momento zen."},
    5:{title:"Alimentación saludable", description:"Comparte tu comida saludable."},
    6:{title:"Actividad física", description:"Comparte tu entrenamiento."},
    7:{title:"Lectura positiva", description:"Comparte tu lectura favorita."},
    8:{title:"Música relajante", description:"Comparte una captura de tu playlist."},
    9:{title:"Escribe algo bueno", description:"Comparte una foto de lo que escribiste."},
    10:{title:"Tres cosas positivas", description:"Comparte una foto de tu lista."},
    11:{title:"Afirmaciones", description:"Comparte una frase que te haya inspirado."},
    12:{title:"Llama a alguien", description:"Comparte tu momento de conexión."},
    13:{title:"Cambia pensamientos", description:"Comparte una reflexión positiva."},
    14:{title:"Respiración consciente", description:"Comparte tu momento de calma."},
    15:{title:"Aprende algo nuevo", description:"Comparte una foto de tu capacitación."},
    16:{title:"Logro personal", description:"Comparte algo que te haga sentir orgulloso."},
    17:{title:"Ruta diferente", description:"Comparte una foto de tu nuevo camino."},
    18:{title:"Tiempo creativo", description:"Comparte una foto de tu momento creativo."},
    19:{title:"Camina 10 minutos", description:"Comparte una foto de tu recorrido."},
    20:{title:"Podcast o video", description:"Comparte una recomendación positiva."},
    21:{title:"Sonríe y saluda", description:"Comparte una foto con tus compañeros."}
};

/* =========================================================
   DOM
========================================================= */

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

const dom = {
    adminLoader:$("#adminLoader"),
    adminPage:$("#adminPage"),
    accessModal:$("#accessModal"),

    adminName:$("#adminName"),
    adminEmail:$("#adminEmail"),
    logoutBtn:$("#logoutBtn"),

    totalParticipants:$("#totalParticipants"),
    totalChallenges:$("#totalChallenges"),
    averageProgress:$("#averageProgress"),
    completedAlbums:$("#completedAlbums"),

    rankingList:$("#rankingList"),
    participantsTableBody:$("#participantsTableBody"),
    searchParticipant:$("#searchParticipant"),
    refreshRankingBtn:$("#refreshRankingBtn"),

    winnerBanner:$("#winnerBanner"),
    winnerText:$("#winnerText"),
    winnerCard:$("#winnerCard"),
    winnerStatus:$("#winnerStatus"),

    evidenceSection:$("#evidencias"),
    evidenceWorkspace:$("#evidenceWorkspace"),
    evidenceUsersView:$("#evidenceUsersView"),
    evidenceDaysView:$("#evidenceDaysView"),
    evidencePendingView:$("#evidencePendingView"),
    evidenceRejectedView:$("#evidenceRejectedView"),

    evidenceUserList:$("#evidenceUserList"),
    evidenceUsersCount:$("#evidenceUsersCount"),
    evidenceSearch:$("#evidenceSearch"),
    evidenceUserQuickSearch:$("#evidenceUserQuickSearch"),
    evidenceDayFilter:$("#evidenceDayFilter"),
    evidenceStatusFilter:$("#evidenceStatusFilter"),
    evidenceProgressFilter:$("#evidenceProgressFilter"),
    evidenceSortFilter:$("#evidenceSortFilter"),

    refreshEvidenceBtn:$("#refreshEvidenceBtn"),
    exportEvidenceBtn:$("#exportEvidenceBtn"),
    showOnlyPendingBtn:$("#showOnlyPendingBtn"),
    clearEvidenceFiltersBtn:$("#clearEvidenceFiltersBtn"),
    toggleEvidenceUserListBtn:$("#toggleEvidenceUserListBtn"),

    totalEvidenceImages:$("#totalEvidenceImages"),
    pendingEvidenceCount:$("#pendingEvidenceCount"),
    approvedEvidenceCount:$("#approvedEvidenceCount"),
    rejectedEvidenceCount:$("#rejectedEvidenceCount"),
    missingEvidenceCount:$("#missingEvidenceCount"),

    selectedEvidenceUserCard:$("#selectedEvidenceUserCard"),
    selectedEvidenceUserAvatar:$("#selectedEvidenceUserAvatar"),
    selectedEvidenceUserName:$("#selectedEvidenceUserName"),
    selectedEvidenceUserEmail:$("#selectedEvidenceUserEmail"),
    selectedEvidenceUserProgress:$("#selectedEvidenceUserProgress"),
    selectedEvidenceUserPending:$("#selectedEvidenceUserPending"),
    selectedEvidenceUserApproved:$("#selectedEvidenceUserApproved"),
    selectedEvidenceUserRejected:$("#selectedEvidenceUserRejected"),
    selectedEvidenceProgressLabel:$("#selectedEvidenceProgressLabel"),
    selectedEvidenceProgressPercent:$("#selectedEvidenceProgressPercent"),
    selectedEvidenceProgressBar:$("#selectedEvidenceProgressBar"),
    selectedUserEvidenceGrid:$("#selectedUserEvidenceGrid"),

    evidenceModal:$("#evidenceModal"),
    evidenceModalBackdrop:$("#evidenceModalBackdrop"),
    closeEvidenceModal:$("#closeEvidenceModal"),
    evidenceModalImage:$("#evidenceModalImage"),
    evidenceModalStatus:$("#evidenceModalStatus"),
    evidenceModalSource:$("#evidenceModalSource"),
    evidenceModalTitle:$("#evidenceModalTitle"),
    evidenceModalUser:$("#evidenceModalUser"),
    evidenceModalDay:$("#evidenceModalDay"),
    evidenceModalDayPill:$("#evidenceModalDayPill"),
    evidenceModalEmail:$("#evidenceModalEmail"),
    evidenceModalUpdated:$("#evidenceModalUpdated"),
    evidenceModalChallengeTitle:$("#evidenceModalChallengeTitle"),
    evidenceModalChallengeDescription:$("#evidenceModalChallengeDescription"),
    evidenceReviewNote:$("#evidenceReviewNote"),
    evidenceReviewHistory:$("#evidenceReviewHistory"),
    openEvidenceOriginalBtn:$("#openEvidenceOriginalBtn"),
    approveEvidenceBtn:$("#approveEvidenceBtn"),
    rejectEvidenceBtn:$("#rejectEvidenceBtn"),
    pendingEvidenceBtn:$("#pendingEvidenceBtn")
};

/* =========================================================
   STATE
========================================================= */

const state = {
    rankingData:[],
    reviewsData:{},
    evidenceUsers:[],
    filteredEvidenceUsers:[],
    currentAdmin:null,
    selectedUserId:null,
    selectedEvidence:null,
    activeEvidenceView:"participants",
    unsubscribers:[],
    initialized:false
};

/* =========================================================
   CONSOLE
========================================================= */

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN RANKING PANEL • CONECTANDO SANAMENTE 2026
STATUS   : ONLINE
MODE     : SUPERVISION + EVIDENCE REVIEW
DATABASE : REALTIME DATABASE
VERSION  : V2.4 USER EVIDENCE CENTER + EMAIL ON REJECT
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

    state.currentAdmin = user;

    const email = normalizeEmail(user.email);

    if(!ADMIN_EMAILS.includes(email)){

        console.warn("Acceso denegado para:", email);

        showAccessDenied();

        return;

    }

    console.log("Acceso autorizado para supervisora:", email);

    setupAdminInfo(user);
    setupEvents();
    startRealtimeListeners();
    hideLoader();

});

/* =========================================================
   SETUP ADMIN INFO
========================================================= */

function setupAdminInfo(user){

    const email = normalizeEmail(user.email);
    const displayName = getAdminDisplayName(email);

    if(dom.adminName){
        dom.adminName.innerText = displayName;
    }

    if(dom.adminEmail){
        dom.adminEmail.innerText = email;
    }

    document.title = `Panel de Supervisión | ${displayName}`;

}

function getAdminDisplayName(email){

    if(email === "ksanchez@aguakan.com") return "Keyla Sánchez";
    if(email === "echan@aguakan.com") return "Edith Chan";

    return getNameFromEmail(email);

}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents(){

    if(state.initialized) return;

    state.initialized = true;

    if(dom.logoutBtn){

        dom.logoutBtn.addEventListener("click", async() => {

            try{

                await signOut(auth);
                window.location.href = "login.html";

            }catch(error){

                console.error("Error cerrando sesión:", error);
                alert("No se pudo cerrar sesión.");

            }

        });

    }

    if(dom.refreshRankingBtn){

        dom.refreshRankingBtn.addEventListener("click", async() => {

            await runButtonLoading(
                dom.refreshRankingBtn,
                `<i class="fa-solid fa-spinner fa-spin"></i> Actualizando`,
                `<i class="fa-solid fa-rotate"></i> Actualizar`,
                manualRefresh
            );

        });

    }

    if(dom.refreshEvidenceBtn){

        dom.refreshEvidenceBtn.addEventListener("click", async() => {

            await runButtonLoading(
                dom.refreshEvidenceBtn,
                `<i class="fa-solid fa-spinner fa-spin"></i> Actualizando evidencias`,
                `<i class="fa-solid fa-rotate"></i> Actualizar evidencias`,
                manualRefresh
            );

        });

    }

    if(dom.exportEvidenceBtn){
        dom.exportEvidenceBtn.addEventListener("click", exportEvidenceCSV);
    }

    if(dom.showOnlyPendingBtn){

        dom.showOnlyPendingBtn.addEventListener("click", () => {

            if(dom.evidenceStatusFilter){
                dom.evidenceStatusFilter.value = "pending";
            }

            switchEvidenceView("pending");
            renderEvidenceDashboard();
            scrollToElement(dom.evidenceSection);

        });

    }

    if(dom.clearEvidenceFiltersBtn){
        dom.clearEvidenceFiltersBtn.addEventListener("click", clearEvidenceFilters);
    }

    if(dom.toggleEvidenceUserListBtn && dom.evidenceWorkspace){

        dom.toggleEvidenceUserListBtn.addEventListener("click", () => {

            dom.evidenceWorkspace.classList.toggle("users-collapsed");

            const icon = dom.toggleEvidenceUserListBtn.querySelector("i");

            if(icon){
                icon.className = dom.evidenceWorkspace.classList.contains("users-collapsed")
                    ? "fa-solid fa-angles-right"
                    : "fa-solid fa-angles-left";
            }

        });

    }

    if(dom.searchParticipant){

        dom.searchParticipant.addEventListener("input", () => {

            const term = dom.searchParticipant.value.trim().toLowerCase();
            renderParticipantsTable(filterRanking(term));

        });

    }

    [
        dom.evidenceSearch,
        dom.evidenceUserQuickSearch,
        dom.evidenceDayFilter,
        dom.evidenceStatusFilter,
        dom.evidenceProgressFilter,
        dom.evidenceSortFilter
    ].forEach(input => {

        if(!input) return;

        input.addEventListener("input", renderEvidenceDashboard);
        input.addEventListener("change", renderEvidenceDashboard);

    });

    $$(".evidence-tab").forEach(tab => {

        tab.addEventListener("click", () => {

            const view = tab.dataset.evidenceView || "participants";
            switchEvidenceView(view);
            renderEvidenceDashboard();

        });

    });

    $$(".sidebar-link").forEach(link => {

        link.addEventListener("click", () => {

            $$(".sidebar-link").forEach(item => item.classList.remove("active"));
            link.classList.add("active");

        });

    });

    setupEvidenceModalEvents();

}

function setupEvidenceModalEvents(){

    if(dom.closeEvidenceModal){
        dom.closeEvidenceModal.addEventListener("click", closeEvidenceModal);
    }

    if(dom.evidenceModalBackdrop){
        dom.evidenceModalBackdrop.addEventListener("click", closeEvidenceModal);
    }

    if(dom.evidenceModal){

        dom.evidenceModal.addEventListener("click", (event) => {
            if(event.target === dom.evidenceModal){
                closeEvidenceModal();
            }
        });

    }

    document.addEventListener("keydown", (event) => {

        if(event.key === "Escape" && dom.evidenceModal?.classList.contains("show")){
            closeEvidenceModal();
        }

    });

    if(dom.approveEvidenceBtn){
        dom.approveEvidenceBtn.addEventListener("click", () => saveEvidenceReview("approved"));
    }

    if(dom.rejectEvidenceBtn){
        dom.rejectEvidenceBtn.addEventListener("click", () => saveEvidenceReview("rejected"));
    }

    if(dom.pendingEvidenceBtn){
        dom.pendingEvidenceBtn.addEventListener("click", () => saveEvidenceReview("pending"));
    }

}

/* =========================================================
   REALTIME LISTENERS
========================================================= */

function startRealtimeListeners(){

    listenRanking();
    listenEvidenceReviews();
    listenGlobalWinner();

}

function listenRanking(){

    const rankingRef = realtimeRef(realtimeDB, DATABASE_PATHS.ranking);

    const unsubscribe = onValue(rankingRef, (snapshot) => {

        const data = snapshot.val() || {};

        state.rankingData = normalizeRankingData(data);

        renderDashboard(state.rankingData);

        console.log("Ranking admin actualizado:", state.rankingData);

    }, (error) => {

        console.error("Error leyendo ranking:", error);
        renderRankingError();

    });

    state.unsubscribers.push(unsubscribe);

}

function listenEvidenceReviews(){

    const reviewsRef = realtimeRef(realtimeDB, DATABASE_PATHS.evidenceReviews);

    const unsubscribe = onValue(reviewsRef, (snapshot) => {

        state.reviewsData = snapshot.val() || {};

        renderEvidenceDashboard();

        console.log("Revisiones de evidencias actualizadas:", state.reviewsData);

    }, (error) => {

        console.warn("No se pudieron leer las revisiones de evidencias en Firebase:", error);

        state.reviewsData = loadLocalEvidenceReviews();

        renderEvidenceDashboard();

        showPermissionNoticeOnce(
            "Las revisiones se mostrarán desde este navegador porque Firebase bloqueó la lectura de evidenceReviews."
        );

    });

    state.unsubscribers.push(unsubscribe);

}

function listenGlobalWinner(){

    const winnerRef = realtimeRef(realtimeDB, DATABASE_PATHS.globalWinner);

    const unsubscribe = onValue(winnerRef, (snapshot) => {

        if(snapshot.exists()){
            renderGlobalWinner(snapshot.val());
        }else{
            renderNoWinner();
        }

    }, (error) => {

        console.error("Error leyendo ganador global:", error);
        renderNoWinner();

    });

    state.unsubscribers.push(unsubscribe);

}

/* =========================================================
   MANUAL REFRESH
========================================================= */

async function manualRefresh(){

    try{

        const rankingSnapshot = await get(
            realtimeRef(realtimeDB, DATABASE_PATHS.ranking)
        );

        state.rankingData = normalizeRankingData(rankingSnapshot.val() || {});

        try{

            const reviewsSnapshot = await get(
                realtimeRef(realtimeDB, DATABASE_PATHS.evidenceReviews)
            );

            state.reviewsData = mergeReviewData(
                reviewsSnapshot.val() || {},
                loadLocalEvidenceReviews()
            );

        }catch(reviewError){

            console.warn(
                "No se pudieron actualizar revisiones desde Firebase. Se usará respaldo local:",
                reviewError
            );

            state.reviewsData = loadLocalEvidenceReviews();

            showPermissionNoticeOnce(
                "Firebase bloqueó la lectura/escritura de revisiones. El panel usará respaldo local en este navegador."
            );

        }

        renderDashboard(state.rankingData);
        renderEvidenceDashboard();

        try{

            const winnerSnapshot = await get(
                realtimeRef(realtimeDB, DATABASE_PATHS.globalWinner)
            );

            if(winnerSnapshot.exists()){
                renderGlobalWinner(winnerSnapshot.val());
            }else{
                renderNoWinner();
            }

        }catch(winnerError){

            console.warn("No se pudo actualizar ganador global:", winnerError);
            renderNoWinner();

        }

    }catch(error){

        console.error("Error actualizando manualmente:", error);
        alert("No se pudo actualizar el panel.");

    }

}

/* =========================================================
   NORMALIZE RANKING DATA
========================================================= */

function normalizeRankingData(data){

    const ranking = Object.entries(data || {}).map(([uid,user]) => {

        const days = normalizeDaysObject(user?.days || {});

        const completed = Number(
            user?.completedCount ||
            user?.completed ||
            countDays(days) ||
            0
        );

        const email = String(user?.email || "").trim();

        const name = user?.name || getNameFromEmail(email) || "Participante";

        const updatedAt = Number(user?.updatedAt || 0);

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

    ranking.sort(sortRanking);

    return ranking;

}

function normalizeDaysObject(days){

    const normalized = {};

    Object.entries(days || {}).forEach(([rawKey,value]) => {

        if(!value) return;

        const dayNumber = extractDayNumber(rawKey);

        if(!dayNumber || dayNumber < 1 || dayNumber > TOTAL_DAYS) return;

        normalized[`day${dayNumber}`] = typeof value === "string"
            ? value
            : value.url || value.imageUrl || value.downloadURL || value.src || "";

    });

    return normalized;

}

function extractDayNumber(value){

    const match = String(value || "").match(/(\d+)/);

    return match ? Number(match[1]) : 0;

}

function sortRanking(a,b){

    if(b.completed !== a.completed){
        return b.completed - a.completed;
    }

    return a.updatedAt - b.updatedAt;

}

/* =========================================================
   RENDER MAIN DASHBOARD
========================================================= */

function renderDashboard(ranking){

    renderSummary(ranking);
    renderRankingList(ranking);
    renderParticipantsTable(ranking);
    renderEvidenceDashboard();

}

function renderSummary(ranking){

    const participants = ranking.length;

    const challenges = ranking.reduce((sum,user) => sum + user.completed,0);

    const completed = ranking.filter(user => user.completed >= TOTAL_DAYS).length;

    const average = participants > 0
        ? Math.round(ranking.reduce((sum,user) => sum + user.percent,0) / participants)
        : 0;

    if(dom.totalParticipants) animateNumber(dom.totalParticipants, participants);
    if(dom.totalChallenges) animateNumber(dom.totalChallenges, challenges);
    if(dom.averageProgress) dom.averageProgress.innerText = `${average}%`;
    if(dom.completedAlbums) animateNumber(dom.completedAlbums, completed);

}

function renderRankingList(ranking){

    if(!dom.rankingList) return;

    if(ranking.length === 0){

        dom.rankingList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ranking-star"></i>
                <p>Aún no hay participantes en el ranking.</p>
            </div>
        `;

        return;

    }

    const topRanking = ranking.slice(0,10);

    dom.rankingList.innerHTML = topRanking.map((user,index) => {

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
                        <span>${user.completed}/${TOTAL_DAYS}</span>
                        <strong>${user.percent}%</strong>
                    </div>

                    <div class="ranking-progress-bar">
                        <span style="width:${user.percent}%"></span>
                    </div>

                </div>

            </div>
        `;

    }).join("");

}

function renderParticipantsTable(ranking){

    if(!dom.participantsTableBody) return;

    if(ranking.length === 0){

        dom.participantsTableBody.innerHTML = `
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

    dom.participantsTableBody.innerHTML = ranking.map((user,index) => {

        const position = index + 1;

        return `
            <tr>

                <td><strong class="table-position">#${position}</strong></td>

                <td>
                    <div class="table-user">
                        <div class="table-avatar">${getInitial(user.name)}</div>
                        <div>
                            <strong>${escapeHTML(user.name)}</strong>
                            <small>${user.status.label}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(user.email || "Sin correo")}</td>

                <td><strong>${user.completed}</strong> / ${TOTAL_DAYS}</td>

                <td>
                    <div class="table-progress">
                        <div class="table-progress-top"><span>${user.percent}%</span></div>
                        <div class="table-progress-bar"><span style="width:${user.percent}%"></span></div>
                    </div>
                </td>

                <td><span class="status-badge ${user.status.className}">${user.status.label}</span></td>

                <td>${formatDate(user.updatedAt)}</td>

            </tr>
        `;

    }).join("");

}

/* =========================================================
   EVIDENCE DATA MODEL
========================================================= */

function buildEvidenceUsers(){

    return state.rankingData.map(user => {

        const dayItems = [];

        for(let day = 1; day <= TOTAL_DAYS; day++){

            const imageUrl = getUserDayImage(user, day);
            const hasImage = Boolean(imageUrl);
            const review = getReviewForDay(user.uid, day);
            const statusKey = hasImage ? normalizeStatus(review?.status || "pending") : "missing";
            const challenge = CHALLENGE_CATALOG[day] || {
                title:`Reto día ${day}`,
                description:"Revisar que la imagen corresponda al reto solicitado."
            };

            dayItems.push({
                uid:user.uid,
                userName:user.name,
                userEmail:user.email,
                day,
                key:`day${day}`,
                imageUrl,
                hasImage,
                status:statusKey,
                statusInfo:REVIEW_STATUS[statusKey],
                note:review?.note || "",
                reviewedAt:Number(review?.reviewedAt || 0),
                reviewedBy:review?.reviewedBy || "",
                reviewerEmail:review?.reviewerEmail || "",
                updatedAt:Number(review?.uploadedAt || user.updatedAt || 0),
                challengeTitle:challenge.title,
                challengeDescription:challenge.description
            });

        }

        const stats = calculateEvidenceStats(dayItems);

        return {
            ...user,
            evidenceDays:dayItems,
            evidenceStats:stats
        };

    });

}

function getUserDayImage(user, day){

    if(!user?.days) return "";

    const direct = user.days[`day${day}`];
    if(direct) return direct;

    const padded = user.days[`day${String(day).padStart(2,"0")}`];
    if(padded) return padded;

    const dia = user.days[`dia-${day}`] || user.days[`dia${day}`];
    if(dia) return dia;

    return "";

}

function getReviewForDay(uid, day){

    const userReviews = state.reviewsData?.[uid] || {};

    return userReviews[`day${day}`] || userReviews[day] || null;

}

function normalizeStatus(status){

    const clean = String(status || "pending").toLowerCase().trim();

    if(["approved","aprobada","aprobado"].includes(clean)) return "approved";
    if(["rejected","rechazada","rechazado"].includes(clean)) return "rejected";
    if(["missing","sin evidencia"].includes(clean)) return "missing";

    return "pending";

}

function calculateEvidenceStats(days){

    const stats = {
        totalLoaded:0,
        pending:0,
        approved:0,
        rejected:0,
        missing:0
    };

    days.forEach(day => {

        if(day.hasImage) stats.totalLoaded++;

        if(day.status === "pending") stats.pending++;
        if(day.status === "approved") stats.approved++;
        if(day.status === "rejected") stats.rejected++;
        if(day.status === "missing") stats.missing++;

    });

    return stats;

}

/* =========================================================
   RENDER EVIDENCE DASHBOARD
========================================================= */

function renderEvidenceDashboard(){

    if(!dom.evidenceSection) return;

    state.evidenceUsers = buildEvidenceUsers();
    state.filteredEvidenceUsers = filterAndSortEvidenceUsers(state.evidenceUsers);

    renderEvidenceKpis(state.evidenceUsers);
    renderEvidenceUserList(state.filteredEvidenceUsers);
    keepSelectedEvidenceUser();
    renderSelectedEvidenceUser();
    renderEvidenceViews();

}

function filterAndSortEvidenceUsers(users){

    const term = getEvidenceSearchTerm();
    const progressFilter = dom.evidenceProgressFilter?.value || "all";
    const sortFilter = dom.evidenceSortFilter?.value || "progressDesc";
    const statusFilter = dom.evidenceStatusFilter?.value || "all";
    const dayFilter = dom.evidenceDayFilter?.value || "all";

    let filtered = users.filter(user => {

        const searchable = `${user.name || ""} ${user.email || ""}`.toLowerCase();

        if(term && !searchable.includes(term)) return false;

        if(!matchesProgressFilter(user, progressFilter)) return false;

        if(!matchesStatusDayFilter(user, statusFilter, dayFilter)) return false;

        return true;

    });

    filtered.sort((a,b) => {

        if(sortFilter === "progressAsc") return a.completed - b.completed;
        if(sortFilter === "nameAsc") return String(a.name).localeCompare(String(b.name), "es");
        if(sortFilter === "updatedDesc") return b.updatedAt - a.updatedAt;
        if(sortFilter === "pendingDesc") return b.evidenceStats.pending - a.evidenceStats.pending;

        return b.completed - a.completed;

    });

    return filtered;

}

function getEvidenceSearchTerm(){

    const primary = dom.evidenceSearch?.value || "";
    const quick = dom.evidenceUserQuickSearch?.value || "";

    return `${primary} ${quick}`.trim().toLowerCase();

}

function matchesProgressFilter(user, filter){

    const count = Number(user.completed || 0);

    if(filter === "none") return count === 0;
    if(filter === "low") return count >= 1 && count <= 7;
    if(filter === "medium") return count >= 8 && count <= 14;
    if(filter === "high") return count >= 15 && count <= 20;
    if(filter === "complete") return count >= TOTAL_DAYS;

    return true;

}

function matchesStatusDayFilter(user, statusFilter, dayFilter){

    if(statusFilter === "all" && dayFilter === "all") return true;

    return getVisibleEvidenceDays(user).length > 0;

}

function getVisibleEvidenceDays(user){

    const statusFilter = dom.evidenceStatusFilter?.value || "all";
    const dayFilter = dom.evidenceDayFilter?.value || "all";

    return (user.evidenceDays || []).filter(day => {

        if(dayFilter !== "all" && Number(dayFilter) !== day.day) return false;
        if(statusFilter !== "all" && statusFilter !== day.status) return false;

        return true;

    });

}

function renderEvidenceKpis(users){

    const totals = users.reduce((acc,user) => {

        acc.totalLoaded += user.evidenceStats.totalLoaded;
        acc.pending += user.evidenceStats.pending;
        acc.approved += user.evidenceStats.approved;
        acc.rejected += user.evidenceStats.rejected;
        acc.missing += user.evidenceStats.missing;

        return acc;

    }, {
        totalLoaded:0,
        pending:0,
        approved:0,
        rejected:0,
        missing:0
    });

    if(dom.totalEvidenceImages) animateNumber(dom.totalEvidenceImages, totals.totalLoaded);
    if(dom.pendingEvidenceCount) animateNumber(dom.pendingEvidenceCount, totals.pending);
    if(dom.approvedEvidenceCount) animateNumber(dom.approvedEvidenceCount, totals.approved);
    if(dom.rejectedEvidenceCount) animateNumber(dom.rejectedEvidenceCount, totals.rejected);
    if(dom.missingEvidenceCount) animateNumber(dom.missingEvidenceCount, totals.missing);

}

function renderEvidenceUserList(users){

    if(!dom.evidenceUserList) return;

    if(dom.evidenceUsersCount){
        dom.evidenceUsersCount.innerText = `${users.length} ${users.length === 1 ? "usuario" : "usuarios"}`;
    }

    if(users.length === 0){

        dom.evidenceUserList.innerHTML = `
            <div class="empty-state evidence-mini-empty">
                <i class="fa-solid fa-user-slash"></i>
                <p>No se encontraron usuarios con los filtros actuales.</p>
            </div>
        `;

        return;

    }

    dom.evidenceUserList.innerHTML = users.map(user => {

        const active = state.selectedUserId === user.uid ? "active" : "";

        return `
            <button type="button" class="evidence-user-card ${active}" data-user-id="${escapeAttr(user.uid)}">

                <span class="evidence-user-avatar">${getInitial(user.name)}</span>

                <span class="evidence-user-main">
                    <strong>${escapeHTML(user.name)}</strong>
                    <small>${escapeHTML(user.email || "Sin correo")}</small>
                    <span class="evidence-user-progress-line">
                        <i style="width:${user.percent}%"></i>
                    </span>
                    <em>
                        ${user.evidenceStats.pending} pendientes • ${user.evidenceStats.approved} aprobadas • ${user.evidenceStats.rejected} rechazadas
                    </em>
                </span>

                <span class="evidence-user-count">${user.completed}/${TOTAL_DAYS}</span>

            </button>
        `;

    }).join("");

    $$(".evidence-user-card", dom.evidenceUserList).forEach(card => {

        card.addEventListener("click", () => {

            state.selectedUserId = card.dataset.userId;
            switchEvidenceView("participants");
            renderEvidenceDashboard();

        });

    });

}

function keepSelectedEvidenceUser(){

    const currentExists = state.filteredEvidenceUsers.some(user => user.uid === state.selectedUserId);

    if(!currentExists){
        state.selectedUserId = state.filteredEvidenceUsers[0]?.uid || null;
    }

}

function getSelectedEvidenceUser(){

    return state.evidenceUsers.find(user => user.uid === state.selectedUserId) || null;

}

function renderSelectedEvidenceUser(){

    const user = getSelectedEvidenceUser();

    if(!user){

        renderEmptySelectedUser();
        return;

    }

    if(dom.selectedEvidenceUserAvatar){
        dom.selectedEvidenceUserAvatar.innerHTML = getInitial(user.name);
    }

    if(dom.selectedEvidenceUserName){
        dom.selectedEvidenceUserName.innerText = user.name || "Participante";
    }

    if(dom.selectedEvidenceUserEmail){
        dom.selectedEvidenceUserEmail.innerText = user.email || "Sin correo";
    }

    if(dom.selectedEvidenceUserProgress){
        dom.selectedEvidenceUserProgress.innerText = `${user.completed}/${TOTAL_DAYS}`;
    }

    if(dom.selectedEvidenceUserPending){
        dom.selectedEvidenceUserPending.innerText = user.evidenceStats.pending;
    }

    if(dom.selectedEvidenceUserApproved){
        dom.selectedEvidenceUserApproved.innerText = user.evidenceStats.approved;
    }

    if(dom.selectedEvidenceUserRejected){
        dom.selectedEvidenceUserRejected.innerText = user.evidenceStats.rejected;
    }

    if(dom.selectedEvidenceProgressPercent){
        dom.selectedEvidenceProgressPercent.innerText = `${user.percent}%`;
    }

    if(dom.selectedEvidenceProgressLabel){
        dom.selectedEvidenceProgressLabel.innerText = `${user.completed} de ${TOTAL_DAYS} evidencias cargadas`;
    }

    if(dom.selectedEvidenceProgressBar){
        dom.selectedEvidenceProgressBar.style.width = `${user.percent}%`;
    }

    renderSelectedUserEvidenceGrid(user);

}

function renderEmptySelectedUser(){

    if(dom.selectedEvidenceUserAvatar){
        dom.selectedEvidenceUserAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }

    if(dom.selectedEvidenceUserName){
        dom.selectedEvidenceUserName.innerText = "Selecciona un participante";
    }

    if(dom.selectedEvidenceUserEmail){
        dom.selectedEvidenceUserEmail.innerText = "Sus evidencias aparecerán aquí organizadas del día 1 al 21.";
    }

    [
        dom.selectedEvidenceUserProgress,
        dom.selectedEvidenceUserPending,
        dom.selectedEvidenceUserApproved,
        dom.selectedEvidenceUserRejected
    ].forEach(element => {
        if(element) element.innerText = "0";
    });

    if(dom.selectedEvidenceProgressPercent) dom.selectedEvidenceProgressPercent.innerText = "0%";
    if(dom.selectedEvidenceProgressBar) dom.selectedEvidenceProgressBar.style.width = "0%";

    if(dom.selectedUserEvidenceGrid){

        dom.selectedUserEvidenceGrid.innerHTML = `
            <div class="empty-state evidence-empty-state">
                <i class="fa-solid fa-hand-pointer"></i>
                <p>Selecciona un participante para revisar sus imágenes.</p>
            </div>
        `;

    }

}

function renderSelectedUserEvidenceGrid(user){

    if(!dom.selectedUserEvidenceGrid) return;

    const visibleDays = getVisibleEvidenceDays(user);

    if(visibleDays.length === 0){

        dom.selectedUserEvidenceGrid.innerHTML = `
            <div class="empty-state evidence-empty-state">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                <p>Este participante no tiene evidencias que coincidan con los filtros activos.</p>
            </div>
        `;

        return;

    }

    dom.selectedUserEvidenceGrid.innerHTML = visibleDays.map(day => renderEvidenceDayTile(day, "detail")).join("");

    bindEvidenceTiles(dom.selectedUserEvidenceGrid);

}

function renderEvidenceDayTile(day, mode = "detail"){

    const status = day.statusInfo || REVIEW_STATUS.pending;
    const disabledClass = day.hasImage ? "" : "is-missing";
    const clickable = day.hasImage ? "button" : "div";
    const aria = day.hasImage
        ? `aria-label="Abrir evidencia del día ${day.day} de ${escapeAttr(day.userName)}"`
        : "";

    const media = day.hasImage
        ? `<img src="${escapeAttr(day.imageUrl)}" alt="Evidencia día ${day.day} de ${escapeAttr(day.userName)}" loading="lazy">
           <span class="evidence-image-shine"></span>
           <button type="button" class="evidence-day-open" tabindex="-1">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
           </button>`
        : `<div class="evidence-missing-placeholder">
              <i class="fa-solid fa-image-slash"></i>
              <span>Sin imagen</span>
           </div>`;

    return `
        <${clickable}
        class="evidence-day-tile ${status.className} ${disabledClass} evidence-day-tile-${mode}"
        data-user-id="${escapeAttr(day.uid)}"
        data-day="${day.day}"
        data-has-image="${day.hasImage ? "true" : "false"}"
        ${aria}>

            <div class="evidence-day-media">
                ${media}
            </div>

            <div class="evidence-day-info">
                <span>Día ${day.day}</span>
                <strong>${escapeHTML(day.challengeTitle)}</strong>
                <small class="evidence-status-label ${status.className}">
                    <i class="fa-solid ${status.icon}"></i>
                    ${status.label}
                </small>
            </div>

            ${day.note ? `<p class="evidence-note-preview">${escapeHTML(day.note)}</p>` : ""}

        </${clickable}>
    `;

}

function bindEvidenceTiles(context){

    $$(".evidence-day-tile[data-has-image='true']", context).forEach(tile => {

        tile.addEventListener("click", () => {

            const uid = tile.dataset.userId;
            const day = Number(tile.dataset.day);
            openEvidenceModal(uid, day);

        });

    });

}

/* =========================================================
   EVIDENCE AUX VIEWS
========================================================= */

function renderEvidenceViews(){

    switchEvidenceVisibility();
    renderEvidenceUsersView();
    renderEvidenceDaysMatrix();
    renderEvidencePendingView();
    renderEvidenceRejectedView();

}

function switchEvidenceView(view){

    state.activeEvidenceView = view || "participants";

    $$(".evidence-tab").forEach(tab => {

        const active = tab.dataset.evidenceView === state.activeEvidenceView;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");

    });

    switchEvidenceVisibility();

}

function switchEvidenceVisibility(){

    const isParticipants = state.activeEvidenceView === "participants";

    setHidden(dom.evidenceWorkspace, !isParticipants);
    setHidden(dom.evidenceUsersView, state.activeEvidenceView !== "participants");
    setHidden(dom.evidenceDaysView, state.activeEvidenceView !== "days");
    setHidden(dom.evidencePendingView, state.activeEvidenceView !== "pending");
    setHidden(dom.evidenceRejectedView, state.activeEvidenceView !== "rejected");

}

function renderEvidenceUsersView(){

    if(!dom.evidenceUsersView) return;

    const users = state.filteredEvidenceUsers;

    if(users.length === 0){

        dom.evidenceUsersView.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-user-slash"></i>
                <p>No hay usuarios para mostrar con los filtros actuales.</p>
            </div>
        `;

        return;

    }

    dom.evidenceUsersView.innerHTML = `
        <div class="evidence-users-summary-grid">
            ${users.map(user => `
                <article class="evidence-user-summary-card" data-user-id="${escapeAttr(user.uid)}">
                    <div class="evidence-user-summary-head">
                        <span>${getInitial(user.name)}</span>
                        <div>
                            <strong>${escapeHTML(user.name)}</strong>
                            <small>${escapeHTML(user.email || "Sin correo")}</small>
                        </div>
                        <em>${user.completed}/${TOTAL_DAYS}</em>
                    </div>
                    <div class="evidence-user-summary-stats">
                        <span><b>${user.evidenceStats.pending}</b> pendientes</span>
                        <span><b>${user.evidenceStats.approved}</b> aprobadas</span>
                        <span><b>${user.evidenceStats.rejected}</b> rechazadas</span>
                    </div>
                </article>
            `).join("")}
        </div>
    `;

    $$(".evidence-user-summary-card", dom.evidenceUsersView).forEach(card => {

        card.addEventListener("click", () => {

            state.selectedUserId = card.dataset.userId;
            switchEvidenceView("participants");
            renderEvidenceDashboard();
            scrollToElement(dom.evidenceWorkspace);

        });

    });

}

function renderEvidenceDaysMatrix(){

    if(!dom.evidenceDaysView) return;

    const dayFilter = dom.evidenceDayFilter?.value || "all";
    const daysToRender = dayFilter === "all"
        ? Array.from({length:TOTAL_DAYS}, (_,index) => index + 1)
        : [Number(dayFilter)];

    const users = state.filteredEvidenceUsers;

    if(users.length === 0){

        dom.evidenceDaysView.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-table-cells"></i>
                <p>No hay evidencias para mostrar en matriz.</p>
            </div>
        `;

        return;

    }

    dom.evidenceDaysView.innerHTML = daysToRender.map(dayNumber => {

        const items = users
            .map(user => user.evidenceDays.find(day => day.day === dayNumber))
            .filter(Boolean)
            .filter(day => {
                const statusFilter = dom.evidenceStatusFilter?.value || "all";
                return statusFilter === "all" || day.status === statusFilter;
            });

        return `
            <section class="evidence-day-matrix-section">
                <div class="evidence-day-matrix-header">
                    <span>Día ${dayNumber}</span>
                    <strong>${escapeHTML(CHALLENGE_CATALOG[dayNumber]?.title || `Reto día ${dayNumber}`)}</strong>
                    <small>${items.filter(item => item.hasImage).length} imágenes cargadas</small>
                </div>
                <div class="evidence-day-matrix-grid">
                    ${items.length > 0
                        ? items.map(item => renderMatrixEvidenceCard(item)).join("")
                        : `<div class="empty-state"><i class="fa-solid fa-image"></i><p>Sin coincidencias para este día.</p></div>`
                    }
                </div>
            </section>
        `;

    }).join("");

    bindEvidenceTiles(dom.evidenceDaysView);

}

function renderMatrixEvidenceCard(day){

    const status = day.statusInfo || REVIEW_STATUS.pending;

    return `
        <article class="evidence-matrix-card ${status.className}">
            <div class="evidence-matrix-user">
                <span>${getInitial(day.userName)}</span>
                <div>
                    <strong>${escapeHTML(day.userName)}</strong>
                    <small>${escapeHTML(day.userEmail || "Sin correo")}</small>
                </div>
            </div>
            ${renderEvidenceDayTile(day, "matrix")}
        </article>
    `;

}

function renderEvidencePendingView(){

    renderStatusSpecificView(dom.evidencePendingView, "pending", {
        icon:"fa-triangle-exclamation",
        empty:"No hay evidencias pendientes con los filtros actuales."
    });

}

function renderEvidenceRejectedView(){

    renderStatusSpecificView(dom.evidenceRejectedView, "rejected", {
        icon:"fa-ban",
        empty:"No hay evidencias rechazadas con los filtros actuales."
    });

}

function renderStatusSpecificView(container, status, options){

    if(!container) return;

    const items = state.filteredEvidenceUsers.flatMap(user => {
        return getVisibleEvidenceDays(user).filter(day => day.status === status && day.hasImage);
    });

    if(items.length === 0){

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid ${options.icon}"></i>
                <p>${options.empty}</p>
            </div>
        `;

        return;

    }

    container.innerHTML = `
        <div class="evidence-status-board">
            ${items.map(item => `
                <article class="evidence-status-card ${item.status}">
                    <div class="evidence-status-card-user">
                        <span>${getInitial(item.userName)}</span>
                        <div>
                            <strong>${escapeHTML(item.userName)}</strong>
                            <small>${escapeHTML(item.userEmail || "Sin correo")}</small>
                        </div>
                    </div>
                    ${renderEvidenceDayTile(item, "status")}
                </article>
            `).join("")}
        </div>
    `;

    bindEvidenceTiles(container);

}

/* =========================================================
   MODAL + REVIEW ACTIONS
========================================================= */

function openEvidenceModal(uid, day){

    const user = state.evidenceUsers.find(item => item.uid === uid);
    const evidence = user?.evidenceDays.find(item => item.day === day);

    if(!user || !evidence || !evidence.hasImage){
        alert("No se encontró la evidencia seleccionada.");
        return;
    }

    state.selectedEvidence = evidence;

    const status = evidence.statusInfo || REVIEW_STATUS.pending;

    if(dom.evidenceModalImage) dom.evidenceModalImage.src = evidence.imageUrl;
    if(dom.evidenceModalStatus){
        dom.evidenceModalStatus.innerText = status.label;
        dom.evidenceModalStatus.className = `evidence-modal-badge ${status.className}`;
    }
    if(dom.evidenceModalSource) dom.evidenceModalSource.innerText = "Firebase Storage / Realtime DB";
    if(dom.evidenceModalTitle) dom.evidenceModalTitle.innerText = evidence.challengeTitle;
    if(dom.evidenceModalUser) dom.evidenceModalUser.innerText = evidence.userName;
    if(dom.evidenceModalDay) dom.evidenceModalDay.innerText = `Día ${evidence.day}`;
    if(dom.evidenceModalDayPill) dom.evidenceModalDayPill.innerText = `Día ${evidence.day}`;
    if(dom.evidenceModalEmail) dom.evidenceModalEmail.innerText = evidence.userEmail || "Sin correo";
    if(dom.evidenceModalUpdated) dom.evidenceModalUpdated.innerText = `Última actualización: ${formatDate(evidence.updatedAt)}`;
    if(dom.evidenceModalChallengeTitle) dom.evidenceModalChallengeTitle.innerText = evidence.challengeTitle;
    if(dom.evidenceModalChallengeDescription) dom.evidenceModalChallengeDescription.innerText = evidence.challengeDescription;
    if(dom.evidenceReviewNote) dom.evidenceReviewNote.value = evidence.note || "";

    if(dom.openEvidenceOriginalBtn){
        dom.openEvidenceOriginalBtn.href = evidence.imageUrl;
    }

    renderEvidenceReviewHistory(evidence);

    if(dom.evidenceModal){
        dom.evidenceModal.classList.add("show");
        dom.evidenceModal.setAttribute("aria-hidden","false");
        document.body.classList.add("modal-open");
    }

}

function closeEvidenceModal(){

    if(dom.evidenceModal){
        dom.evidenceModal.classList.remove("show");
        dom.evidenceModal.setAttribute("aria-hidden","true");
        document.body.classList.remove("modal-open");
    }

    state.selectedEvidence = null;

}

async function saveEvidenceReview(status){

    const evidence = state.selectedEvidence;

    if(!evidence){
        alert("No hay evidencia seleccionada.");
        return;
    }

    if(!evidence.hasImage){
        alert("No se puede revisar un día sin evidencia.");
        return;
    }

    const cleanStatus = normalizeStatus(status);
    const note = dom.evidenceReviewNote?.value?.trim() || "";
    const reviewedAt = Date.now();
    const reviewerEmail = normalizeEmail(state.currentAdmin?.email);
    const reviewedBy = getAdminDisplayName(reviewerEmail);

    const reviewPayload = {
        status:cleanStatus,
        note,
        reviewedAt,
        reviewedBy,
        reviewerEmail,
        uid:evidence.uid,
        day:evidence.day,
        imageUrl:evidence.imageUrl,
        userName:evidence.userName,
        userEmail:evidence.userEmail,
        challengeTitle:evidence.challengeTitle,
        challengeDescription:evidence.challengeDescription,
        updatedAt:reviewedAt
    };

    try{

        setReviewButtonsLoading(true);

        const reviewRef = realtimeRef(
            realtimeDB,
            `${DATABASE_PATHS.evidenceReviews}/${evidence.uid}/day${evidence.day}`
        );

        await realtimeUpdate(reviewRef, reviewPayload);

        // Actualización local inmediata para que el panel responda sin esperar al listener.
        state.reviewsData[evidence.uid] = state.reviewsData[evidence.uid] || {};
        state.reviewsData[evidence.uid][`day${evidence.day}`] = reviewPayload;

        renderEvidenceDashboard();
        openEvidenceModal(evidence.uid, evidence.day);

        if(cleanStatus === "rejected"){
            await sendRejectedEvidenceEmail(
                evidence,
                note,
                reviewPayload
            );
        }

        flashMessage(`Evidencia del día ${evidence.day} marcada como ${REVIEW_STATUS[cleanStatus].label.toLowerCase()}.`);

    }catch(error){

        console.error("Error guardando revisión de evidencia en Firebase:", error);

        if(isPermissionError(error)){

            reviewPayload.localOnly = true;
            reviewPayload.syncStatus = "local";

            saveLocalEvidenceReview(
                evidence.uid,
                evidence.day,
                reviewPayload
            );

            state.reviewsData[evidence.uid] = state.reviewsData[evidence.uid] || {};
            state.reviewsData[evidence.uid][`day${evidence.day}`] = reviewPayload;

            renderEvidenceDashboard();
            openEvidenceModal(evidence.uid, evidence.day);

            if(cleanStatus === "rejected"){
                await sendRejectedEvidenceEmail(
                    evidence,
                    note,
                    reviewPayload
                );
            }

            flashMessage(
                `Revisión guardada localmente: ${REVIEW_STATUS[cleanStatus].label}.`
            );

            showPermissionNoticeOnce(
                "Firebase no permitió guardar en evidenceReviews. La revisión quedó guardada solo en este navegador."
            );

        }else{

            alert(`No se pudo guardar la revisión: ${error.code || error.message}`);

        }

    }finally{

        setReviewButtonsLoading(false);

    }

}

async function sendRejectedEvidenceEmail(evidence, note, reviewPayload){

    if(!REJECT_EMAIL_ENABLED) return;

    if(!REJECT_EMAIL_WEB_APP_URL || REJECT_EMAIL_WEB_APP_URL.includes("PEGA_AQUI")){

        console.warn("No se configuró REJECT_EMAIL_WEB_APP_URL. No se envió correo de rechazo.");
        flashMessage("Rechazo guardado. Falta configurar la URL de Apps Script para enviar correo.");

        return;

    }

    const payload = {
        userEmail:evidence.userEmail || reviewPayload?.userEmail || "",
        userName:evidence.userName || reviewPayload?.userName || "Participante",
        day:evidence.day || reviewPayload?.day || "",
        challengeTitle:evidence.challengeTitle || reviewPayload?.challengeTitle || "Reto del álbum",
        challengeDescription:evidence.challengeDescription || reviewPayload?.challengeDescription || "",
        note:note || "La evidencia no corresponde al reto solicitado.",
        imageUrl:evidence.imageUrl || reviewPayload?.imageUrl || "",
        reviewedBy:reviewPayload?.reviewedBy || getAdminDisplayName(normalizeEmail(state.currentAdmin?.email)),
        reviewerEmail:reviewPayload?.reviewerEmail || normalizeEmail(state.currentAdmin?.email),
        reviewedAt:reviewPayload?.reviewedAt || Date.now(),
        source:"Conectando Sanamente 2026 - Panel de Evidencias"
    };

    if(!payload.userEmail){

        console.warn("No se envió correo: la evidencia no tiene userEmail.", payload);
        flashMessage("Rechazo guardado, pero no se encontró correo del participante.");

        return;

    }

    try{

        const emailRequestId = [
            payload.userEmail,
            `day${payload.day}`,
            payload.reviewedAt || Date.now()
        ].join("-").replace(/[^a-zA-Z0-9@._-]/g,"");

        const emailPayload = {
            ...payload,
            requestId:emailRequestId
        };

        await fetch(REJECT_EMAIL_WEB_APP_URL, {
            ...REJECT_EMAIL_FETCH_OPTIONS,
            body:JSON.stringify(emailPayload)
        });

        console.log(
            "Solicitud de correo de rechazo enviada a Apps Script:",
            payload.userEmail,
            emailPayload
        );

        flashMessage(`Solicitud de correo enviada a ${payload.userEmail}.`);

    }catch(error){

        console.warn("No se pudo solicitar el envío del correo de rechazo:", error);
        flashMessage("Rechazo guardado, pero no se pudo solicitar el correo.");

    }

}

function setReviewButtonsLoading(isLoading){

    [dom.approveEvidenceBtn, dom.rejectEvidenceBtn, dom.pendingEvidenceBtn].forEach(button => {

        if(!button) return;

        button.disabled = isLoading;
        button.classList.toggle("loading", isLoading);

    });

}

function renderEvidenceReviewHistory(evidence){

    if(!dom.evidenceReviewHistory) return;

    if(!evidence.reviewedAt){

        dom.evidenceReviewHistory.innerHTML = `
            <span>Historial de revisión</span>
            <p>Sin movimientos registrados todavía.</p>
        `;

        return;

    }

    dom.evidenceReviewHistory.innerHTML = `
        <span>Historial de revisión</span>
        <p>
            ${evidence.statusInfo.label} por <strong>${escapeHTML(evidence.reviewedBy || "Supervisión")}</strong><br>
            <small>${formatDate(evidence.reviewedAt)}</small>
            ${evidence.localOnly ? `<br><em>Guardado localmente por permisos de Firebase.</em>` : ""}
        </p>
    `;

}

/* =========================================================
   EXPORT CSV
========================================================= */

function exportEvidenceCSV(){

    const users = state.evidenceUsers;

    if(users.length === 0){
        alert("No hay evidencias para exportar.");
        return;
    }

    const rows = [[
        "Usuario",
        "Correo",
        "Día",
        "Reto esperado",
        "Tiene evidencia",
        "Estado revisión",
        "URL imagen",
        "Observación",
        "Revisado por",
        "Fecha revisión"
    ]];

    users.forEach(user => {

        user.evidenceDays.forEach(day => {

            rows.push([
                user.name,
                user.email,
                `Día ${day.day}`,
                day.challengeTitle,
                day.hasImage ? "Sí" : "No",
                day.statusInfo.label,
                day.imageUrl || "",
                day.note || "",
                day.reviewedBy || "",
                day.reviewedAt ? formatDate(day.reviewedAt) : ""
            ]);

        });

    });

    const csv = rows.map(row => row.map(toCSVCell).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-evidencias-conectando-sanamente-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

}

function toCSVCell(value){

    const clean = String(value ?? "").replaceAll('"','""');

    return `"${clean}"`;

}

/* =========================================================
   FILTER CONTROLS
========================================================= */

function clearEvidenceFilters(){

    [dom.evidenceSearch, dom.evidenceUserQuickSearch].forEach(input => {
        if(input) input.value = "";
    });

    if(dom.evidenceDayFilter) dom.evidenceDayFilter.value = "all";
    if(dom.evidenceStatusFilter) dom.evidenceStatusFilter.value = "all";
    if(dom.evidenceProgressFilter) dom.evidenceProgressFilter.value = "all";
    if(dom.evidenceSortFilter) dom.evidenceSortFilter.value = "progressDesc";

    switchEvidenceView("participants");
    renderEvidenceDashboard();

}

/* =========================================================
   LOCAL REVIEW FALLBACK
========================================================= */

function isPermissionError(error){

    const code = String(error?.code || "");
    const message = String(error?.message || "");

    return PERMISSION_ERROR_CODES.some(item => {
        return code.includes(item) || message.includes(item);
    });

}

function loadLocalEvidenceReviews(){

    try{

        const raw = localStorage.getItem(LOCAL_REVIEWS_STORAGE_KEY);

        if(!raw) return {};

        const parsed = JSON.parse(raw);

        return parsed && typeof parsed === "object" ? parsed : {};

    }catch(error){

        console.warn("No se pudo leer respaldo local de revisiones:", error);
        return {};

    }

}

function saveLocalEvidenceReview(uid, day, payload){

    try{

        const localReviews = loadLocalEvidenceReviews();

        localReviews[uid] = localReviews[uid] || {};
        localReviews[uid][`day${day}`] = payload;

        localStorage.setItem(
            LOCAL_REVIEWS_STORAGE_KEY,
            JSON.stringify(localReviews)
        );

    }catch(error){

        console.error("No se pudo guardar revisión local:", error);
        alert("Firebase bloqueó la revisión y tampoco se pudo guardar respaldo local.");

    }

}

function mergeReviewData(remoteReviews = {}, localReviews = {}){

    const merged = structuredCloneSafe(remoteReviews);

    Object.entries(localReviews || {}).forEach(([uid,days]) => {

        merged[uid] = merged[uid] || {};

        Object.entries(days || {}).forEach(([dayKey,localReview]) => {

            const remoteReview = merged[uid][dayKey];

            if(!remoteReview){
                merged[uid][dayKey] = localReview;
                return;
            }

            const remoteTime = Number(remoteReview.reviewedAt || remoteReview.updatedAt || 0);
            const localTime = Number(localReview.reviewedAt || localReview.updatedAt || 0);

            if(localTime > remoteTime){
                merged[uid][dayKey] = localReview;
            }

        });

    });

    return merged;

}

function structuredCloneSafe(value){

    try{

        return JSON.parse(JSON.stringify(value || {}));

    }catch(error){

        return {};

    }

}

let permissionNoticeAlreadyShown = false;

function showPermissionNoticeOnce(message){

    if(permissionNoticeAlreadyShown) return;

    permissionNoticeAlreadyShown = true;

    console.warn(message);

    const notice = document.createElement("div");
    notice.className = "admin-toast warning";
    notice.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(notice);

    requestAnimationFrame(() => notice.classList.add("show"));

    setTimeout(() => {
        notice.classList.remove("show");
        setTimeout(() => notice.remove(),300);
    },6200);

}

/* =========================================================
   GLOBAL WINNER
========================================================= */

function renderGlobalWinner(winner){

    const name = winner.name || getNameFromEmail(winner.email) || "Participante";
    const email = winner.email || "Sin correo";
    const message = winner.message || `🏆 ${name} completó primero el álbum de bienestar`;

    if(dom.winnerBanner) dom.winnerBanner.classList.add("active");
    if(dom.winnerText) dom.winnerText.innerText = message;

    if(dom.winnerStatus){
        dom.winnerStatus.innerText = "Definido";
        dom.winnerStatus.classList.add("success");
    }

    if(dom.winnerCard){

        dom.winnerCard.innerHTML = `
            <div class="winner-profile">

                <div class="winner-crown"><i class="fa-solid fa-crown"></i></div>
                <div class="winner-avatar">${getInitial(name)}</div>

                <h4>${escapeHTML(name)}</h4>
                <p>${escapeHTML(email)}</p>

                <div class="winner-stats">
                    <div><strong>${winner.completedCount || TOTAL_DAYS}</strong><span>retos</span></div>
                    <div><strong>100%</strong><span>avance</span></div>
                </div>

                <small>Completado el ${formatDate(winner.completedAt)}</small>

            </div>
        `;

    }

}

function renderNoWinner(){

    if(dom.winnerBanner) dom.winnerBanner.classList.remove("active");
    if(dom.winnerText) dom.winnerText.innerText = "Aún no hay ganador del álbum de bienestar";

    if(dom.winnerStatus){
        dom.winnerStatus.innerText = "Pendiente";
        dom.winnerStatus.classList.remove("success");
    }

    if(dom.winnerCard){

        dom.winnerCard.innerHTML = `
            <div class="winner-placeholder">
                <div class="winner-big-icon"><i class="fa-solid fa-crown"></i></div>
                <h4>Aún no hay ganador</h4>
                <p>El primer participante que complete los 21 retos aparecerá aquí automáticamente.</p>
            </div>
        `;

    }

}

/* =========================================================
   ERROR STATES
========================================================= */

function renderRankingError(){

    if(dom.rankingList){

        dom.rankingList.innerHTML = `
            <div class="empty-state error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>No se pudo cargar el ranking.</p>
            </div>
        `;

    }

    if(dom.participantsTableBody){

        dom.participantsTableBody.innerHTML = `
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

function showAccessDenied(){

    hideLoader();

    if(dom.accessModal){
        dom.accessModal.classList.add("show");
    }else{
        alert("Acceso restringido.");
        window.location.href = "album.html";
    }

}

/* =========================================================
   LOADER
========================================================= */

function hideLoader(){

    if(!dom.adminLoader) return;

    setTimeout(() => {

        dom.adminLoader.classList.add("hidden");

        setTimeout(() => {

            dom.adminLoader.style.display = "none";

            if(dom.adminPage){
                dom.adminPage.classList.add("ready");
            }

        },500);

    },600);

}

/* =========================================================
   FILTER
========================================================= */

function filterRanking(term){

    if(!term) return state.rankingData;

    return state.rankingData.filter(user => {

        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();

        return name.includes(term) || email.includes(term);

    });

}

/* =========================================================
   HELPERS
========================================================= */

function countDays(days){

    if(!days || typeof days !== "object") return 0;

    return Object.values(days).filter(Boolean).length;

}

function calculatePercent(completed){

    const percent = Math.round((Number(completed || 0) / TOTAL_DAYS) * 100);

    if(percent < 0) return 0;
    if(percent > 100) return 100;

    return percent;

}

function getUserStatus(completed){

    const value = Number(completed || 0);

    if(value >= TOTAL_DAYS) return {label:"Completado", className:"completed"};
    if(value >= 14) return {label:"Avanzado", className:"advanced"};
    if(value >= 7) return {label:"En progreso", className:"progress"};
    if(value > 0) return {label:"Iniciado", className:"started"};

    return {label:"Sin avance", className:"empty"};

}

function getMedal(position){

    if(position === 1) return "🥇";
    if(position === 2) return "🥈";
    if(position === 3) return "🥉";

    return `#${position}`;

}

function getInitial(name){

    if(!name) return "A";

    return String(name).trim().charAt(0).toUpperCase();

}

function getNameFromEmail(email){

    if(!email) return "Participante";

    const clean = String(email)
        .split("@")[0]
        .replace(/[._-]/g," ")
        .trim();

    return clean
        .split(" ")
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

}

function formatDate(timestamp){

    if(!timestamp) return "Sin registro";

    const date = new Date(Number(timestamp));

    if(isNaN(date.getTime())) return "Sin registro";

    return date.toLocaleString("es-MX", {
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
    });

}

function animateNumber(element,value){

    if(!element) return;

    const finalValue = Number(value || 0);
    const currentValue = Number(element.dataset.value || 0);

    element.dataset.value = finalValue;

    if(currentValue === finalValue){
        element.innerText = finalValue;
        return;
    }

    const duration = 600;
    const startTime = performance.now();

    const update = (now) => {

        const progress = Math.min((now - startTime) / duration,1);
        const current = Math.round(currentValue + (finalValue - currentValue) * progress);

        element.innerText = current;

        if(progress < 1){
            requestAnimationFrame(update);
        }

    };

    requestAnimationFrame(update);

}

function normalizeEmail(email){

    return String(email || "").trim().toLowerCase();

}

function escapeHTML(value){

    return String(value || "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}

function escapeAttr(value){

    return escapeHTML(value).replaceAll("`","&#096;");

}

function setHidden(element, hidden){

    if(!element) return;

    element.hidden = hidden;
    element.classList.toggle("active", !hidden);

}

function scrollToElement(element){

    if(!element) return;

    element.scrollIntoView({
        behavior:"smooth",
        block:"start"
    });

}

async function runButtonLoading(button, loadingHTML, normalHTML, callback){

    if(!button || typeof callback !== "function") return;

    try{

        button.classList.add("loading");
        button.disabled = true;
        button.innerHTML = loadingHTML;

        await callback();

    }finally{

        setTimeout(() => {
            button.classList.remove("loading");
            button.disabled = false;
            button.innerHTML = normalHTML;
        },600);

    }

}

function flashMessage(message){

    const toast = document.createElement("div");
    toast.className = "admin-toast";
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(),300);
    },2800);

}

/* =========================================================
   SMALL RUNTIME STYLES
========================================================= */

(function injectRuntimeStyles(){

    if(document.getElementById("adminRuntimeEvidenceStyles")) return;

    const style = document.createElement("style");
    style.id = "adminRuntimeEvidenceStyles";
    style.textContent = `
        .admin-toast.warning{
            background:linear-gradient(135deg,#fff7ed,#fff1f2);
            color:#9a3412;
            border:1px solid rgba(251,146,60,.35);
        }
        .admin-toast.warning i{
            color:#f97316;
        }
        .evidence-review-history em,
        #evidenceReviewHistory em{
            display:inline-block;
            margin-top:4px;
            color:#b7791f;
            font-style:normal;
            font-weight:800;
        }
    `;

    document.head.appendChild(style);

})();

/* =========================================================
   INITIAL PAINT
========================================================= */

renderEvidenceDashboard();
