/* ======================================================
   CONECTANDO SANAMENTE 2026 - AGUAKAN
   SISTEMA INTERACTIVO DE ALTO IMPACTO (ENTERPRISE EDITION)
   DESARROLLADO PARA UNA EXPERIENCIA PREMIUM 360°
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* ======================================================
       1. CONFIGURACIÓN CORE Y VARIABLES GLOBALES
    ====================================================== */

    const CONFIG = {
        googleFormsLink: "https://docs.google.com/forms/d/e/1FAIpQLSe4ZsYA6NZZoHLh1Md_9YDPUhOL3gb38Ptpsn2qwXyCN1Tnwg/viewform",
        eventDate: new Date("October 10, 2026 09:00:00").getTime(),
        typingWords: [
            "Bienestar emocional",
            "Salud mental",
            "Empatía organizacional",
            "Liderazgo consciente",
            "Conexión humana",
            "Cultura saludable",
            "Entornos resilientes"
        ],
        animationThreshold: 0.15
    };

    const DOM = {
        body: document.body,
        navbar: document.getElementById("navbar"),
        hero: document.querySelector(".hero"),
        loader: document.querySelector(".loader-wrapper"),
        scrollBtn: document.querySelector(".back-to-top"),
        menu: document.getElementById("menu"),
        menuBtn: document.getElementById("menuToggle"),
        typing: document.querySelector(".typing-text"),
        modal: document.querySelector(".speaker-modal")
    };

    /* ======================================================
       2. UTILIDADES DE ALTO RENDIMIENTO
    ====================================================== */

    const Engine = {
        
        // Selector inteligente
        qs: (s) => document.querySelector(s),
        qsa: (s) => document.querySelectorAll(s),

        // Optimizador de eventos de scroll
        debounce: (func, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        },

        // Generador de números aleatorios para efectos
        random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
    };

    /* ======================================================
       3. SISTEMA DE CARGA Y PROGRESO (PREMIUM)
    ====================================================== */

    // Loader con desvanecimiento elegante
    window.addEventListener("load", () => {
        if (DOM.loader) {
            setTimeout(() => {
                DOM.loader.classList.add("loader-hidden");
                setTimeout(() => DOM.loader.style.display = "none", 1000);
            }, 1500);
        }
        console.info("Aguakan Engine: Sistema cargado al 100%");
    });

    // Barra de progreso de lectura (Dynamic Progress Bar)
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress-bar";
    DOM.body.appendChild(progressBar);

    function updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    }

    /* ======================================================
       4. INTERACCIONES DE CURSOR Y EFECTOS VISUALES
    ====================================================== */

    // Efecto de Cursor Inteligente (Custom Cursor Glow)
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    DOM.body.appendChild(cursor);

    const cursorDot = document.createElement("div");
    cursorDot.className = "custom-cursor-dot";
    DOM.body.appendChild(cursorDot);

    document.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
        cursorDot.style.left = e.clientX + "px";
        cursorDot.style.top = e.clientY + "px";
    });

    // Reacción del cursor a elementos interactivos
    const interactives = Engine.qsa("a, button, .card, .speaker-card, .faq-question");
    interactives.forEach(el => {
        el.addEventListener("mouseenter", () => cursor.classList.add("cursor-hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-hover"));
    });

    /* ======================================================
       5. NAVEGACIÓN Y MENÚS (ENTERPRISE LOGIC)
    ====================================================== */

    function handleNavbar() {
        if (!DOM.navbar) return;
        DOM.navbar.classList.toggle("scrolled", window.scrollY > 70);
        if (DOM.scrollBtn) DOM.scrollBtn.classList.toggle("show", window.scrollY > 500);
    }

    // Menú Responsive con bloqueo de scroll
    if (DOM.menuBtn && DOM.menu) {
        DOM.menuBtn.addEventListener("click", () => {
            DOM.menu.classList.toggle("menu-active");
            DOM.menuBtn.classList.toggle("toggle-active");
            DOM.body.classList.toggle("menu-open");
        });
    }

    // Cerrar menú al navegar
    Engine.qsa(".menu a").forEach(link => {
        link.addEventListener("click", () => {
            DOM.menu?.classList.remove("menu-active");
            DOM.menuBtn?.classList.remove("toggle-active");
            DOM.body.classList.remove("menu-open");
        });
    });

    // Active Link Detection con precisión
    function activeMenuDetection() {
        const sections = Engine.qsa("section[id]");
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 150;
            const sectionId = current.getAttribute("id");
            const link = Engine.qs(`.menu a[href="#${sectionId}"]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                link?.classList.add("active-link");
            } else {
                link?.classList.remove("active-link");
            }
        });
    }

    /* ======================================================
       6. SISTEMA DE PESTAÑAS (MULTIGRUPO INDEPENDIENTE)
    ====================================================== */

    Engine.qsa(".tabs-container").forEach(container => {
        const buttons = container.querySelectorAll(".tab-btn");
        const panes = container.querySelectorAll(".tab-pane");

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                panes.forEach(p => p.classList.remove("active"));
                
                btn.classList.add("active");
                const target = container.querySelector(`#${btn.dataset.tab}`);
                if (target) target.classList.add("active");
            });
        });
    });

    /* ======================================================
       7. ANIMACIONES DE ALTO IMPACTO (3D & REVEAL)
    ====================================================== */

    // Reveal on Scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("active");
        });
    }, { threshold: CONFIG.animationThreshold });

    Engine.qsa(".reveal").forEach(el => revealObserver.observe(el));

    // Efecto 3D Dinámico en Tarjetas
    Engine.qsa(".card, .stat-card, .about-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
        });
    });

    // Contadores Animados con Precisión
    Engine.qsa(".counter").forEach(counter => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const target = +counter.dataset.target;
                let current = 0;
                const increment = target / 100;
                
                const update = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.floor(current);
                        requestAnimationFrame(update);
                    } else {
                        counter.innerText = target;
                    }
                };
                update();
                observer.disconnect();
            }
        });
        observer.observe(counter);
    });

    /* ======================================================
       8. FUNCIONALIDADES DE CONTENIDO (TYPEWRITER & MODAL)
    ====================================================== */

    // Efecto Typewriter Profesional
    if (DOM.typing) {
        let wordIdx = 0, charIdx = 0, isDeleting = false;
        function type() {
            const current = CONFIG.typingWords[wordIdx];
            DOM.typing.textContent = current.substring(0, isDeleting ? charIdx-- : charIdx++);
            
            if (!isDeleting && charIdx > current.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else if (isDeleting && charIdx < 0) {
                isDeleting = false;
                wordIdx = (wordIdx + 1) % CONFIG.typingWords.length;
                setTimeout(type, 500);
            } else {
                setTimeout(type, isDeleting ? 50 : 100);
            }
        }
        type();
    }

    // Modal de Speakers con Inyección Dinámica
    Engine.qsa(".speaker-card").forEach(card => {
        card.addEventListener("click", () => {
            if (!DOM.modal) return;
            Engine.qs(".modal-img").src = card.dataset.img;
            Engine.qs(".modal-name").innerText = card.dataset.name;
            Engine.qs(".modal-role").innerText = card.dataset.role;
            Engine.qs(".modal-desc").innerText = card.dataset.desc;
            DOM.modal.classList.add("open-modal");
            DOM.body.style.overflow = "hidden";
        });
    });

    const closeModal = () => {
        DOM.modal?.classList.remove("open-modal");
        DOM.body.style.overflow = "auto";
    };

    Engine.qs(".close-modal")?.addEventListener("click", closeModal);
    window.addEventListener("click", (e) => e.target === DOM.modal && closeModal());

    /* ======================================================
       9. SISTEMA DE REDIRECCIÓN Y EVENTOS FINALES
    ====================================================== */

    // Redirección Premium Unificada
    Engine.qsa(".nav-btn, .btn-primary, .cta-btn, a[href='#registro']").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = CONFIG.googleFormsLink;
        });
    });

    // Scroll Top Action
    DOM.scrollBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Global Scroll Orchestrator
    window.addEventListener("scroll", Engine.debounce(() => {
        handleNavbar();
        updateScrollProgress();
        activeMenuDetection();
    }, 10));

    /* ======================================================
       10. CONSOLA DE DIAGNÓSTICO PROFESIONAL
    ====================================================== */

    console.log(`
    %c AGUAKAN - CONECTANDO SANAMENTE 2026 %c
    %c SISTEMA DE ALTO IMPACTO ACTIVADO %c
    
    Status: ONLINE
    Experience: PREMIUM
    Engine: V8 INTERACTIVE
    `, 
    "background: #0b5aa7; color: white; font-weight: bold; padding: 5px; border-radius: 3px 0 0 3px;",
    "background: #20c0d8; color: white; font-weight: bold; padding: 5px; border-radius: 0 3px 3px 0;",
    "color: #0b5aa7; font-weight: bold;",
    "color: #20c0d8; font-weight: bold;"
    );

});