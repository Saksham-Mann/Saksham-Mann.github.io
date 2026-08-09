/* ==========================================================================
   COURSES.JS — DVEL
   Scroll-driven 3D spiral of course cards
   ========================================================================== */

/* ---------- COURSE DATA ---------- */
const COURSES = [
    { id:"python",     title:"Python Fundamentals", desc:"The friendly language powering AI, web backends, and data science. Start from zero.", devicon:"devicon-python-plain colored",       badge:"Beginner",     badgeCls:"",       lessons:24 },
    { id:"html",       title:"HTML",                desc:"Structure beautiful websites. Learn modern semantic markup.",                         devicon:"devicon-html5-plain colored",        badge:"Beginner",     badgeCls:"purple", lessons:10 },
    { id:"css",        title:"CSS",                 desc:"Style beautiful websites. Learn modern layouts with Flexbox and Grid.",               devicon:"devicon-css3-plain colored",         badge:"Beginner",     badgeCls:"purple", lessons:12 },
    { id:"javascript", title:"JavaScript",          desc:"Bring pages to life with interactivity, DOM manipulation, and async programming.",    devicon:"devicon-javascript-plain colored",   badge:"Intermediate", badgeCls:"",       lessons:32 },
    { id:"numpy",      title:"NumPy",               desc:"Fast numerical computation. Master arrays, broadcasting, and vectorized operations.", devicon:"devicon-numpy-plain colored",        badge:"Intermediate", badgeCls:"purple", lessons:15 },
    { id:"pandas",     title:"Pandas",              desc:"Read, clean, and transform real-world datasets. Essential for data science.",          devicon:"devicon-pandas-plain colored",       badge:"Intermediate", badgeCls:"",       lessons:20 },
    { id:"fastapi",    title:"FastAPI",             desc:"Build blazing-fast web APIs in Python with automatic docs and async support.",         devicon:"devicon-fastapi-plain colored",      badge:"Advanced",     badgeCls:"purple", lessons:22 },
    { id:"locked",     title:"Coming Soon",          desc:null, devicon:"material-symbols-outlined", iconTxt:"lock", badge:"Locked", badgeCls:"grey", lessons:null, locked:true },
];

/* ---------- BUILD CARD HTML ---------- */
function cardHTML(c) {
    if (c.locked) {
        return `<div class="course-card locked" id="cc-${c.id}">
            <div class="lock-center">
                <span class="material-symbols-outlined lock-icon">lock</span>
                <div class="lock-label">New courses coming soon</div>
            </div>
        </div>`;
    }
    return `<div class="course-card" id="cc-${c.id}" data-course="${c.id}" tabindex="0" role="button" aria-label="Start ${c.title}">
        <div class="cc-icon-row">
            <i class="${c.devicon} cc-icon" style="font-size: 28px;"></i>
            <span class="cc-badge ${c.badgeCls}">${c.badge}</span>
        </div>
        <div class="cc-title">${c.title}</div>
        <div class="cc-desc">${c.desc}</div>
        <div class="cc-footer">
            <div class="cc-lessons"><span class="material-symbols-outlined">menu_book</span>${c.lessons} lessons</div>
            <button class="cc-start-btn">Start &rarr;</button>
        </div>
    </div>`;
}

/* ---------- PLACE CARDS IN SCENE ---------- */
let cardEls = [];

function buildCards() {
    const scene = document.getElementById("spiral-scene");
    if (!scene) return;

    COURSES.forEach((course, i) => {
        const wrapper = document.createElement("div");
        wrapper.className = "spiral-card-wrapper";
        wrapper.innerHTML = cardHTML(course);
        scene.appendChild(wrapper);
        cardEls.push(wrapper);
    });
}

/* ---------- HELIX CONFIGURATION ---------- */
let HELIX = {
    radius: 400,          // r: radius of the globe/spiral
    heightStep: 150,      // h: vertical distance between cards
    angleStep: -0.8       // theta step: negative to spiral from bottom-right to top-left
};

function updateHelixConfig() {
    if (window.innerWidth < 768) {
        HELIX.radius = 160;
        HELIX.heightStep = 180;
    } else {
        HELIX.radius = 400;
        HELIX.heightStep = 150;
    }
    // Force a re-render if ScrollTrigger exists
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}
updateHelixConfig();
window.addEventListener('resize', updateHelixConfig);

/* ---------- UPDATE CARD POSITIONS (called on every scroll tick) ---------- */
function updateSpiral(progress) {
    /* progress: 0 → first card centred, COURSES.length-1 → last card centred */
    cardEls.forEach((el, i) => {
        const offset = i - progress;           // distance from active card
        const absOffset = Math.abs(offset);
        
        // --- 3D Helix coordinates ---
        // theta: angle of the card. offset = 0 -> PI/2 (front center)
        const theta = offset * HELIX.angleStep + (Math.PI / 2);
        
        // X position (left/right): x = r * cos(theta)
        const x = HELIX.radius * Math.cos(theta);
        // Z position (depth/scale): z = r * sin(theta)
        const z = HELIX.radius * Math.sin(theta);
        
        // Y position (up/down): y = h * theta (based on offset)
        const y = HELIX.heightStep * offset;

        // --- Rotation: cards tilt to face outward from the spiral ---
        const ryDeg = -(theta - (Math.PI / 2)) * (180 / Math.PI); 

        // --- Z-Index and Depth Illusion ---
        const normalizedZ = z / HELIX.radius; // from -1 (back) to 1 (front)
        
        // Scale decreases as z goes negative (scaled down by ~20% to avoid header overlap)
        const s = Math.max(0.35, 0.55 + (normalizedZ * 0.25));
        
        // Opacity drops slightly so focus remains on the front
        const op = Math.max(0, 0.4 + (normalizedZ * 0.6));
        
        // Z-Index drops so globe and front cards overlap correctly
        const zIndex = Math.round(50 + z);

        el.style.transform =
            `translate(-50%, -50%)
             translate3d(${x}px, ${y}px, ${z}px)
             rotateY(${ryDeg}deg)
             scale(${s})`;
        el.style.opacity = op;
        el.style.zIndex = zIndex;
        
        // --- Center Only Click Logic ---
        // Default pointer-events to none (handled below)
        // Track which card is closest to y = 0 and has a positive z value
        if (Math.abs(y) < (HELIX.heightStep * 0.5) && z > 0) {
            el.style.pointerEvents = "auto";
            el.classList.add("active");
        } else {
            el.style.pointerEvents = "none";
            el.classList.remove("active");
        }
    });
}

/* ---------- SCROLL-DRIVEN ANIMATION (GSAP) ---------- */
function initSpiralScroll() {
    gsap.registerPlugin(ScrollTrigger);

    // Proxy object whose `value` property GSAP will tween from 0 → N-1
    const proxy = { value: 0 };

    // Initial render
    updateSpiral(0);

    gsap.to(proxy, {
        value: COURSES.length - 1,
        ease: "none",
        scrollTrigger: {
            trigger: "#spiral-stage",
            pin: "#spiral-viewport", // Use GSAP pinning instead of CSS sticky
            start: "top top",
            end: "bottom bottom",
            scrub: true, // Let Lenis handle the smoothing; avoiding GSAP scrub lag
            onUpdate(self) {
                updateSpiral(proxy.value);
                // Fade scroll hint
                const hint = document.getElementById("scroll-hint");
                if (hint) hint.style.opacity = self.progress < 0.05 ? 1 : 0;
            }
        }
    });
}

/* ---------- CARD CLICKS → EDITOR ---------- */
function initCardClicks() {
    document.querySelectorAll(".course-card:not(.locked)").forEach(card => {
        const handler = () => {
            const courseId = card.getAttribute("data-course");
            if (courseId) window.location.href = `editor.html?course=${courseId}`;
        };
        card.addEventListener("click", handler);
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") handler(); });
    });

    // Locked card shake
    document.querySelectorAll(".course-card.locked").forEach(card => {
        card.addEventListener("click", () => {
            gsap.fromTo(card, { x: 0 },
                { x: 6, yoyo: true, repeat: 5, duration: 0.06, ease: "power2.inOut",
                  onComplete: () => gsap.set(card, { x: 0 }) });
        });
    });
}

/* ---------- THREE.JS HOLOGRAM BACKGROUND ---------- */
function initHologram() {
    const canvas = document.getElementById("webgl-canvas");
    if (!canvas) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.10));
    const cL = new THREE.DirectionalLight(0x00dcff, 0.4); cL.position.set(4,3,5); scene.add(cL);
    const pL = new THREE.DirectionalLight(0xb060f0, 0.4); pL.position.set(-4,-2,2); scene.add(pL);

    const holo = new THREE.Group();
    // Centered the globe
    holo.position.set(0, 0, -3);
    holo.scale.set(2.6, 2.6, 2.6); // Increased scale even more
    scene.add(holo);

    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 1),
        new THREE.MeshPhysicalMaterial({ color:0xb060f0, emissive:0x2a0555, roughness:0.2, metalness:0.8, wireframe:true, transparent:true, opacity:0.2 })
    );
    holo.add(core);

    const outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.4, 2),
        new THREE.MeshPhysicalMaterial({ color:0x00dcff, emissive:0x002233, roughness:0.3, metalness:0.7, wireframe:true, transparent:true, opacity:0.06 })
    );
    holo.add(outer);

    function ring(r,t,c,o){ const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,16,100), new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o})); holo.add(m); return m; }
    const r1=ring(1.8,0.012,0x00dcff,0.1);
    const r2=ring(2.1,0.009,0xb060f0,0.08); r2.rotation.x=Math.PI/2;
    const r3=ring(2.4,0.007,0x2ecc71,0.05); r3.rotation.y=Math.PI/4;

    const N=120, pos=new Float32Array(N*3);
    for(let i=0;i<N*3;i+=3){ const ra=2.5+Math.random()*1.4, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1); pos[i]=ra*Math.sin(ph)*Math.cos(th); pos[i+1]=ra*Math.sin(ph)*Math.sin(th); pos[i+2]=ra*Math.cos(ph); }
    const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const dc=document.createElement("canvas"); dc.width=dc.height=16; const dx=dc.getContext("2d");
    const grd=dx.createRadialGradient(8,8,0,8,8,8); grd.addColorStop(0,"rgba(255,255,255,1)"); grd.addColorStop(0.3,"rgba(0,220,255,0.5)"); grd.addColorStop(1,"rgba(0,0,0,0)"); dx.fillStyle=grd; dx.fillRect(0,0,16,16);
    const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0x00dcff,size:0.08,map:new THREE.CanvasTexture(dc),transparent:true,opacity:0.2,depthWrite:false,blending:THREE.AdditiveBlending}));
    holo.add(pts);

    const clock=new THREE.Clock();
    (function animate(){
        requestAnimationFrame(animate);
        const t=clock.getElapsedTime();
        core.rotation.y=t*0.1; core.rotation.x=t*0.07;
        outer.rotation.y=-t*0.05; outer.rotation.z=t*0.03;
        r1.rotation.z=t*0.2; r2.rotation.y=t*0.16; r3.rotation.x=t*0.12;
        pts.rotation.y=t*0.02;
        holo.position.y=Math.sin(t*1.0)*0.1;
        renderer.render(scene,camera);
    })();

    addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
}

/* ---------- LENIS SMOOTH SCROLL ---------- */
function initLenis() {
    const lenis = new Lenis({ duration:1.3, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)), smooth:true, mouseMultiplier:0.75, smoothTouch:false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

/* ---------- BOOT ---------- */
document.addEventListener("DOMContentLoaded", () => {
    initLenis();
    buildCards();
    initSpiralScroll();
    initCardClicks();
    initHologram();
});
