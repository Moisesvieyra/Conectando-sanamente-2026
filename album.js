/* ========================================= */
/* AGUAKAN ALBUM ENGINE V1 */
/* ========================================= */

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALBUM ENGINE • CONECTANDO SANAMENTE 2026
STATUS : ONLINE
MODE   : PREMIUM EXPERIENCE
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

/* ========================================= */
/* VARIABLES */
/* ========================================= */

let completed = 0;

const total = 21;

/* ========================================= */
/* PROGRESS */
/* ========================================= */

function updateProgress(){

    const percent = Math.round((completed / total) * 100);

    progressText.innerText = `${percent}%`;

    progressDays.innerText = `${completed} de ${total} completados`;

    const circumference = 377;

    const offset = circumference - (percent / 100) * circumference;

    progressRing.style.strokeDashoffset = offset;

}

/* ========================================= */
/* SLOT SYSTEM */
/* ========================================= */

slots.forEach(slot => {

    const input = slot.querySelector(".file-input");

    const image = slot.querySelector(".slot-image img");

    /* CLICK EN CARD */

    slot.addEventListener("click", () => {

        input.click();

    });

    /* SUBIR FOTO */

    input.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if(!file) return;

        /* VALIDAR IMAGEN */

        if(!file.type.startsWith("image/")){

            alert("Solo se permiten imágenes.");

            return;

        }

        /* READER */

        const reader = new FileReader();

        reader.onload = function(event){

 /* ========================================= */
/* EFECTO STICKER PREMIUM */
/* ========================================= */

image.style.transition = "none";

image.style.opacity = "0";

image.style.transform = `
scale(2)
rotate(-18deg)
translateY(-120px)
`;

image.style.filter = `
blur(18px)
brightness(2)
`;

setTimeout(() => {

    image.src = event.target.result;

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
    `;

},100);

            /* EFECTO PREMIUM */

slot.classList.remove("completed");

void slot.offsetWidth;

slot.classList.add("completed");

            createParticles(slot);

            playPop();

            /* CONTAR */

            if(!slot.dataset.completed){

                slot.dataset.completed = "true";

                completed++;

                updateProgress();

            }

        };

        reader.readAsDataURL(file);

    });

});

/* ========================================= */
/* PARTICLES */
/* ========================================= */

function createParticles(slot){

    for(let i=0; i<12; i++){

        const particle = document.createElement("span");

        particle.classList.add("particle");

        slot.appendChild(particle);

        const x = Math.random() * 200 - 100;

        const y = Math.random() * 200 - 100;

        particle.style.left = "50%";

        particle.style.top = "50%";

        particle.style.setProperty("--x", `${x}px`);

        particle.style.setProperty("--y", `${y}px`);

        particle.style.animationDelay = `${Math.random() * .3}s`;

        setTimeout(() => {

            particle.remove();

        },1500);

    }

}

/* ========================================= */
/* POP SOUND */
/* ========================================= */

function playPop(){

    const audio = new Audio("sounds/pop.mp3");

    audio.volume = .4;

    audio.play();

}

/* ========================================= */
/* PREVIEW IMAGE */
/* ========================================= */

document.querySelectorAll(".slot-image img").forEach(img => {

    img.addEventListener("dblclick", (e) => {

        e.stopPropagation();

        previewModal.style.display = "flex";

        previewImage.src = img.src;

    });

});

/* ========================================= */
/* CLOSE MODAL */
/* ========================================= */

closePreview.addEventListener("click", () => {

    previewModal.style.display = "none";

});

previewModal.addEventListener("click", (e) => {

    if(e.target === previewModal){

        previewModal.style.display = "none";

    }

});

/* ========================================= */
/* FAKE USER */
/* ========================================= */

const fakeUser = {

    name:"Moisés Vieyra"

};

document.getElementById("user-name").innerText = fakeUser.name;

/* ========================================= */
/* INIT */
/* ========================================= */

updateProgress();

/* ========================================= */
/* PARTICLE STYLE AUTO */
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

        transform:scale(.9);

    }

    50%{

        transform:scale(1.04);

    }

    100%{

        transform:scale(1);

    }

}

`;

document.head.appendChild(style);

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

const observer = new MutationObserver(() => {

    checkLegend();

});

observer.observe(progressText, {

    childList:true

});