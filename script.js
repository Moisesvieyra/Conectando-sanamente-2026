/**
 * ============================================================================
 * CONECTANDO SANAMENTE 2026 - AGUAKAN
 * ENTERPRISE ULTRA-INTERACTIVE ENGINE (V8 MASTER EDITION)
 * ----------------------------------------------------------------------------
 * Desarrollado para una experiencia de usuario de alto impacto y rendimiento.
 * Este motor gestiona animaciones, física de partículas, interactividad 3D 
 * y la lógica de negocio del Congreso de Salud Mental.
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /**
     * @namespace CONFIG
     * @description Configuración centralizada del sistema.
     */
    const CONFIG = {
        googleFormsLink: "https://docs.google.com/forms/d/e/1FAIpQLSe4ZsYA6NZZoHLh1Md_9YDPUhOL3gb38Ptpsn2qwXyCN1Tnwg/viewform",
        typingWords: [
            "Bienestar emocional",
            "Salud mental",
            "Empatía organizacional",
            "Liderazgo consciente",
            "Conexión humana",
            "Cultura saludable",
            "Entornos resilientes"
        ],
        particles: {
            count: 60,
            color: "#0b5aa7",
            speed: 0.5,
            size: 2
        },
        magneticStrength: 0.35,
        animationThreshold: 0.1,
        debug: true
    };

    /**
     * @namespace DOM
     * @description Cache de elementos del DOM para optimizar el rendimiento.
     */
    const DOM = {
        body: document.body,
        html: document.documentElement,
        navbar: document.getElementById("navbar"),
        hero: document.querySelector(".hero"),
        loader: document.querySelector(".loader-wrapper"),
        scrollBtn: document.querySelector(".back-to-top"),
        menu: document.getElementById("menu"),
        menuBtn: document.getElementById("menuToggle"),
        typing: document.querySelector(".typing-text"),
        modal: document.querySelector(".speaker-modal"),
        mainCanvas: null
    };

    /**
     * @namespace CoreEngine
     * @description Utilidades de bajo nivel para gestión de eventos y cálculos.
     */
    const CoreEngine = {
        qs: (s) => document.querySelector(s),
        qsa: (s) => document.querySelectorAll(s),
        
        /**
         * @method debounce
         * @description Limita la frecuencia de ejecución de una función.
         */
        debounce: (func, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        },

        /**
         * @method lerp
         * @description Interpolación lineal para movimientos suaves.
         */
        lerp: (start, end, amt) => (1 - amt) * start + amt * end,

        /**
         * @method getDistance
         * @description Calcula la distancia entre dos puntos.
         */
        getDistance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
    };

    /**
     * @class NotificationSystem
     * @description Sistema de notificaciones Toast personalizado.
     */
    class NotificationSystem {
        constructor() {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            DOM.body.appendChild(this.container);
            
            // Estilos dinámicos para el sistema de notificaciones
            const style = document.createElement('style');
            style.textContent = `
                .toast-container { position: fixed; bottom: 30px; left: 30px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-left: 5px solid var(--primary); display: flex; align-items: center; gap: 15px; transform: translateX(-120%); transition: 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); font-weight: 600; color: var(--primary-dark); }
                .toast.show { transform: translateX(0); }
                .toast i { color: var(--secondary); font-size: 1.2rem; }
            `;
            document.head.appendChild(style);
        }

        show(message, icon = 'fa-info-circle') {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
            this.container.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }
    }

    const Notifications = new NotificationSystem();

    /**
     * @namespace ParticleEngine
     * @description Motor de fondo dinámico basado en HTML5 Canvas.
     */
    const ParticleEngine = {
        canvas: null,
        ctx: null,
        particles: [],

        init() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'particle-canvas';
            this.canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:none; opacity:0.6;';
            DOM.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            this.animate();
            window.addEventListener('resize', () => this.resize());
        },

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticles() {
            for (let i = 0; i < CONFIG.particles.count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * CONFIG.particles.speed,
                    vy: (Math.random() - 0.5) * CONFIG.particles.speed,
                    size: Math.random() * CONFIG.particles.size + 1
                });
            }
        },

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = CONFIG.particles.color;
            
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });

            requestAnimationFrame(() => this.animate());
        }
    };

    /**
     * @namespace InteractiveCursor
     * @description Gestión del cursor personalizado y efectos magnéticos.
     */
    const InteractiveCursor = {
        cursor: null,
        dot: null,
        pos: { x: 0, y: 0 },
        mouse: { x: 0, y: 0 },

        init() {
            if (window.innerWidth < 1024) return;
            
            this.cursor = document.createElement('div');
            this.dot = document.createElement('div');
            this.cursor.className = 'custom-cursor';
            this.dot.className = 'custom-cursor-dot';
            DOM.body.appendChild(this.cursor);
            DOM.body.appendChild(this.dot);

            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            this.render();
            this.setupInteractions();
        },

        render() {
            this.pos.x = CoreEngine.lerp(this.pos.x, this.mouse.x, 0.15);
            this.pos.y = CoreEngine.lerp(this.pos.y, this.mouse.y, 0.15);

            this.cursor.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
            this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;

            requestAnimationFrame(() => this.render());
        },

        setupInteractions() {
            const targets = CoreEngine.qsa('a, button, .card, .stat-card, .speaker-card, .tab-btn');
            targets.forEach(el => {
                el.addEventListener('mouseenter', () => this.cursor.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => this.cursor.classList.remove('cursor-hover'));
                
                // Efecto Magnético
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const deltaX = (e.clientX - centerX) * CONFIG.magneticStrength;
                    const deltaY = (e.clientY - centerY) * CONFIG.magneticStrength;
                    
                    el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                });
                
                el.addEventListener('mouseleave', () => {
                    el.style.transform = `translate(0, 0)`;
                });
            });
        }
    };

    /**
     * @namespace UIManager
     * @description Gestión de la interfaz de usuario: Navbar, Scroll, Pestañas.
     */
    const UIManager = {
        init() {
            this.setupScrollProgress();
            this.setupNavbar();
            this.setupTabs();
            this.setupReveal();
            this.setupCounters();
            this.setupTypewriter();
            this.setupModals();
            this.setupRegistration();
        },

        setupScrollProgress() {
            const bar = document.createElement('div');
            bar.className = 'scroll-progress-bar';
            DOM.body.appendChild(bar);

            window.addEventListener('scroll', CoreEngine.debounce(() => {
                const scrolled = (window.scrollY / (DOM.html.scrollHeight - window.innerHeight)) * 100;
                bar.style.width = `${scrolled}%`;
                
                if (DOM.scrollBtn) {
                    DOM.scrollBtn.classList.toggle('show', window.scrollY > 500);
                }
                
                if (DOM.navbar) {
                    DOM.navbar.classList.toggle('scrolled', window.scrollY > 50);
                }
            }, 10));
        },

        setupNavbar() {

    if (!DOM.menuBtn || !DOM.menu) return;

    const closeMobileMenu = () => {

        DOM.menu.classList.remove('menu-active');
        DOM.menu.classList.remove('active');

        DOM.menuBtn.classList.remove('toggle-active');
        DOM.menuBtn.classList.remove('active');

        DOM.body.classList.remove('menu-open');

        const icon = DOM.menuBtn.querySelector('i');

        if (icon) {

            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');

        }

        DOM.menuBtn.setAttribute('aria-expanded', 'false');

    };

    const openMobileMenu = () => {

        DOM.menu.classList.add('menu-active');
        DOM.menu.classList.add('active');

        DOM.menuBtn.classList.add('toggle-active');
        DOM.menuBtn.classList.add('active');

        DOM.body.classList.add('menu-open');

        const icon = DOM.menuBtn.querySelector('i');

        if (icon) {

            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');

        }

        DOM.menuBtn.setAttribute('aria-expanded', 'true');

    };

    DOM.menuBtn.setAttribute('type', 'button');
    DOM.menuBtn.setAttribute('aria-label', 'Abrir menú');
    DOM.menuBtn.setAttribute('aria-expanded', 'false');

    DOM.menuBtn.addEventListener('click', (e) => {

        e.preventDefault();
        e.stopPropagation();

        const isOpen =
        DOM.menu.classList.contains('menu-active') ||
        DOM.menu.classList.contains('active');

        if (isOpen) {

            closeMobileMenu();

        } else {

            openMobileMenu();

        }

    });

    DOM.menu.querySelectorAll('a').forEach(link => {

        link.addEventListener('click', () => {

            closeMobileMenu();

        });

    });

    document.addEventListener('click', (e) => {

        const clickInsideMenu = DOM.menu.contains(e.target);
        const clickOnButton = DOM.menuBtn.contains(e.target);

        if (!clickInsideMenu && !clickOnButton) {

            closeMobileMenu();

        }

    });

    window.addEventListener('resize', CoreEngine.debounce(() => {

        if (window.innerWidth > 992) {

            closeMobileMenu();

        }

    }, 150));

},

        setupTabs() {
            CoreEngine.qsa('.tabs-container').forEach(container => {
                const buttons = container.querySelectorAll('.tab-btn');
                const panes = container.querySelectorAll('.tab-pane');

                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        buttons.forEach(b => b.classList.remove('active'));
                        panes.forEach(p => p.classList.remove('active'));
                        
                        btn.classList.add('active');
                        const target = container.querySelector(`#${btn.dataset.tab}`);
                        if (target) {
                            target.classList.add('active');
                            Notifications.show(`Sección actualizada: ${btn.innerText}`, 'fa-calendar-check');
                        }
                    });
                });
            });
        },

        setupReveal() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, { threshold: CONFIG.animationThreshold });

            CoreEngine.qsa('.reveal').forEach(el => observer.observe(el));
        },

        setupCounters() {
            CoreEngine.qsa('.counter').forEach(counter => {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        const target = +counter.dataset.target;
                        let current = 0;
                        const inc = target / 100;
                        
                        const update = () => {
                            current += inc;
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
        },

        setupTypewriter() {
            if (!DOM.typing) return;
            let wordIdx = 0, charIdx = 0, isDeleting = false;
            
            const type = () => {
                const currentWord = CONFIG.typingWords[wordIdx];
                DOM.typing.textContent = currentWord.substring(0, isDeleting ? charIdx-- : charIdx++);
                
                let typeSpeed = isDeleting ? 50 : 150;
                
                if (!isDeleting && charIdx > currentWord.length) {
                    typeSpeed = 2000;
                    isDeleting = true;
                } else if (isDeleting && charIdx < 0) {
                    isDeleting = false;
                    wordIdx = (wordIdx + 1) % CONFIG.typingWords.length;
                    typeSpeed = 500;
                }
                
                setTimeout(type, typeSpeed);
            };
            type();
        },

        setupModals() {
            CoreEngine.qsa('.speaker-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (!DOM.modal) return;
                    const mImg = CoreEngine.qs('.modal-img');
                    const mName = CoreEngine.qs('.modal-name');
                    const mRole = CoreEngine.qs('.modal-role');
                    const mDesc = CoreEngine.qs('.modal-desc');

                    if (mImg) mImg.src = card.dataset.img || '';
                    if (mName) mName.innerText = card.dataset.name || '';
                    if (mRole) mRole.innerText = card.dataset.role || '';
                    if (mDesc) mDesc.innerText = card.dataset.desc || '';

                    DOM.modal.classList.add('open-modal');
                    DOM.body.style.overflow = 'hidden';
                    Notifications.show(`Perfil de ${card.dataset.name} cargado`, 'fa-user-tie');
                });
            });

            const close = () => {
                DOM.modal?.classList.remove('open-modal');
                DOM.body.style.overflow = 'auto';
            };

            CoreEngine.qs('.close-modal')?.addEventListener('click', close);
            window.addEventListener('click', (e) => e.target === DOM.modal && close());
        },

        setupRegistration() {
            CoreEngine.qsa('.nav-btn, .btn-primary, .cta-btn, a[href="#registro"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Notifications.show("Redirigiendo al formulario de registro...", "fa-paper-plane");
                    setTimeout(() => {
                        window.location.href = CONFIG.googleFormsLink;
                    }, 800);
                });
            });
        }
    };

    /**
     * @namespace DiagnosticEngine
     * @description Sistema de diagnóstico y bienvenida en consola.
     */
    const DiagnosticEngine = {
        init() {
            const start = performance.now();
            window.addEventListener('load', () => {
                const end = performance.now();
                const loadTime = (end - start).toFixed(2);
                
                console.log(`
%c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
%c  AGUAKAN ENTERPRISE ENGINE V8.2 - CONECTANDO SANAMENTE 2026
%c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
%c  [STATUS]    : ONLINE
%c  [LOAD TIME] : ${loadTime}ms
%c  [EXPERIENCE]: ULTRA-PREMIUM
%c  [MODULES]   : Particles, Magnetic, Tabs, Modal, Typewriter, Scroll
%c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                `, 
                "color: #0b5aa7; font-weight: bold;",
                "color: #ffffff; background: #0b5aa7; font-weight: bold; padding: 4px;",
                "color: #0b5aa7; font-weight: bold;",
                "color: #2ecc71; font-weight: bold;",
                "color: #20c0d8; font-weight: bold;",
                "color: #ffb347; font-weight: bold;",
                "color: #6b7280; font-weight: bold;",
                "color: #0b5aa7; font-weight: bold;"
                );

                if (DOM.loader) {
                    setTimeout(() => {
                        DOM.loader.classList.add('loader-hidden');
                        setTimeout(() => DOM.loader.style.display = 'none', 1000);
                    }, 1500);
                }
            });
        }
    };

    // Inicialización de todos los módulos del motor
    DiagnosticEngine.init();
    ParticleEngine.init();
    InteractiveCursor.init();
    UIManager.init();

    /* ========================================= */
/* MODAL INFO KEYLA */
/* ========================================= */

const infoBtn = document.querySelector('.info-btn');
const infoModal = document.getElementById('infoModal');
const closeInfoModal = document.getElementById('closeInfoModal');

if(infoBtn){

    infoBtn.addEventListener('click', () => {

        infoModal.classList.add('active');

    });
}

if(closeInfoModal){

    closeInfoModal.addEventListener('click', () => {

        infoModal.classList.remove('active');

    });
}

window.addEventListener('click', (e) => {

    if(e.target === infoModal){

        infoModal.classList.remove('active');
    }
});

    // Evento de Scroll Top
    DOM.scrollBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
