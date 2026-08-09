/* ==========================================================================
   MAIN.JS — DVEL Home Page
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initLenis();
    initIntersectionObserver();
    initThreeJS();
    initStartBtn();
});

/* --------------------------------------------------------------------------
   SMOOTH SCROLL — LENIS
   -------------------------------------------------------------------------- */
let lenis;
function initLenis() {
    lenis = new Lenis({
        duration: 1.4,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        mouseMultiplier: 0.8,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

/* --------------------------------------------------------------------------
   SECTION FADE-IN
   -------------------------------------------------------------------------- */
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });

    document.querySelectorAll(".section-content").forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   THREE.JS HOLOGRAM — Globe with orbital rings, travels across sections
   -------------------------------------------------------------------------- */
function initThreeJS() {
    const canvas = document.getElementById("webgl-canvas");
    if (!canvas) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const cL = new THREE.DirectionalLight(0x00dcff, 1.0); cL.position.set(5, 3, 5); scene.add(cL);
    const pL = new THREE.DirectionalLight(0xb060f0, 1.0); pL.position.set(-5, -3, 2); scene.add(pL);

    // Hologram group
    const holo = new THREE.Group();
    scene.add(holo);

    // Inner core
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 1),
        new THREE.MeshPhysicalMaterial({
            color: 0xb060f0, emissive: 0x3a0e6e,
            roughness: 0.2, metalness: 0.8,
            wireframe: true, transparent: true, opacity: 0.65
        })
    );
    holo.add(core);

    // Outer shell
    const outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.4, 2),
        new THREE.MeshPhysicalMaterial({
            color: 0x00dcff, emissive: 0x003344,
            roughness: 0.3, metalness: 0.7,
            wireframe: true, transparent: true, opacity: 0.22
        })
    );
    holo.add(outer);

    // Orbital rings
    function makeRing(r, t, c, o) {
        const m = new THREE.Mesh(
            new THREE.TorusGeometry(r, t, 16, 100),
            new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
        );
        holo.add(m); return m;
    }
    const ring1 = makeRing(1.8, 0.013, 0x00dcff, 0.32);
    const ring2 = makeRing(2.1, 0.010, 0xb060f0, 0.26); ring2.rotation.x = Math.PI / 2;
    const ring3 = makeRing(2.4, 0.007, 0x2ecc71, 0.18); ring3.rotation.y = Math.PI / 4;

    // Particle field
    const N = 160, pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i += 3) {
        const r = 2.5 + Math.random() * 1.5;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i]   = r * Math.sin(ph) * Math.cos(th);
        pos[i+1] = r * Math.sin(ph) * Math.sin(th);
        pos[i+2] = r * Math.cos(ph);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dc = document.createElement("canvas"); dc.width = dc.height = 16;
    const dx = dc.getContext("2d");
    const grd = dx.createRadialGradient(8,8,0,8,8,8);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.3, "rgba(0,220,255,0.6)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    dx.fillStyle = grd; dx.fillRect(0,0,16,16);
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({
        color: 0x00dcff, size: 0.09,
        map: new THREE.CanvasTexture(dc),
        transparent: true, opacity: 0.55,
        depthWrite: false, blending: THREE.AdditiveBlending
    }));
    holo.add(particles);

    // Position by viewport width
    const desktop = () => window.innerWidth >= 768;
    const initPos = () => ({ x: desktop() ? 2.2 : 0, y: 0 });
    const p = initPos();
    holo.position.set(p.x, p.y, 0);
    const sc = desktop() ? 1.0 : 0.6;
    holo.scale.set(sc, sc, sc);

    // GSAP scroll-driven path (home page has 4 sections)
    const tl = gsap.timeline({
        defaults: { ease: "none" }, // Prevents bumping/glitching between timeline steps
        scrollTrigger: {
            trigger: ".scroll-container",
            start: "top top",
            end: "bottom bottom",
            scrub: true // Let Lenis handle the smoothing
        }
    });

    if (desktop()) {
        tl
          .to(holo.position,  { x: -2.2, y: 0.3, z: 0.6,       duration: 1 })
          .to(holo.rotation,  { x: 0.9,  y: 1.6, z: 0.8,        duration: 1 }, "<")
          .to(holo.position,  { x: 2.0,  y: -0.2, z: 1.0,       duration: 1 })
          .to(holo.rotation,  { x: -0.8, y: 3.8, z: 1.0,        duration: 1 }, "<")
          .to(holo.position,  { x: -2.2, y: 0, z: 0,            duration: 1 })
          .to(holo.rotation,  { x: 1.6,  y: 6.3, z: 0,          duration: 1 }, "<");
    } else {
        tl
          .to(holo.position, { x: 0, y: -0.9, z: -1,  duration: 1 })
          .to(holo.rotation, { x: 0.8, y: 1.6,          duration: 1 }, "<")
          .to(holo.position, { x: 0, y: 0.9, z: -0.5,  duration: 1 })
          .to(holo.rotation, { x: -0.8, y: 3.1,         duration: 1 }, "<")
          .to(holo.position, { x: 0, y: -0.6, z: -1,   duration: 1 })
          .to(holo.rotation, { x: 1.6, y: 4.7,          duration: 1 }, "<");
    }

    // Render loop
    const clock = new THREE.Clock();
    (function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        core.rotation.y  = t * 0.12;  core.rotation.x  = t * 0.08;
        outer.rotation.y = -t * 0.06; outer.rotation.z = t * 0.04;
        ring1.rotation.z = t * 0.24;
        ring2.rotation.y = t * 0.19;
        ring3.rotation.x = t * 0.14;
        particles.rotation.y = t * 0.024;
        renderer.render(scene, camera);
    })();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Update globe scale so it resizes back up when window enlarges
        const sc = desktop() ? 1.0 : 0.6;
        holo.scale.set(sc, sc, sc);
    });
}

/* --------------------------------------------------------------------------
   START LEARNING BUTTON — navigates to courses page
   -------------------------------------------------------------------------- */
function initStartBtn() {
    const btn = document.getElementById("fixed-start-btn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "courses.html";
        });
    }
}
