/**
 * Three.js Tribute Site - 3D Refactor (Enhanced Visuals)
 */

// Scene Variables
let scene, camera, renderer, raycaster, mouse;
let envelopeGroup, envelopeFlap, letterMesh;
let heartsBackground = [];
let particles = [];
let isLetterOpen = false;

// UI Elements
let uiOverlay, btnAmei, finalReveal;

// Initialize
function init() {
    console.log("Initializing Three.js scene...");
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a0404);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const container = document.getElementById('canvas-container');
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
    } catch (e) {
        console.error(e);
        return;
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 2. Enhanced Lights - More brightness and directionality
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 4, 5);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xffffff, 0.5);
    rimLight.position.set(-5, -5, -2);
    scene.add(rimLight);

    uiOverlay = document.getElementById('ui-overlay');
    btnAmei = document.getElementById('btn-amei');
    finalReveal = document.getElementById('final-reveal');

    if (btnAmei) btnAmei.addEventListener('click', onAmeiClick);

    createBackgroundHearts();
    createEnvelope();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) onDocumentMouseDown(e.touches[0]);
    }, {passive: false});
    
    animate();
}

function createBackgroundHearts() {
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.5, 0.5, 1, 1, 1);
    heartShape.bezierCurveTo(2, 1, 2, 0, 1, -1);
    heartShape.lineTo(0, -2);
    heartShape.lineTo(-1, -1);
    heartShape.bezierCurveTo(-2, 0, -2, 1, -1, 1);
    heartShape.bezierCurveTo(-0.5, 1, 0, 0.5, 0, 0);

    const geometry = new THREE.ShapeGeometry(heartShape);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xff4d4d, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide 
    });

    for (let i = 0; i < 30; i++) {
        const heart = new THREE.Mesh(geometry, material.clone());
        resetHeart(heart);
        scene.add(heart);
        heartsBackground.push(heart);
    }
}

function resetHeart(heart) {
    heart.position.set((Math.random() - 0.5) * 20, -10 - Math.random() * 10, (Math.random() - 0.5) * 15);
    heart.scale.setScalar(Math.random() * 0.2 + 0.1);
    heart.userData.speed = Math.random() * 0.02 + 0.01;
    heart.material.opacity = Math.random() * 0.3 + 0.1;
}

function createEnvelope() {
    envelopeGroup = new THREE.Group();

    // High quality materials with better specularity
    const envelopeMat = new THREE.MeshPhongMaterial({ color: 0xfdf5e6, side: THREE.DoubleSide, shininess: 30 });
    const pocketMat = new THREE.MeshPhongMaterial({ color: 0xeee8aa, side: THREE.DoubleSide, shininess: 10 });
    const flapMat = new THREE.MeshPhongMaterial({ color: 0xf0e68c, side: THREE.DoubleSide, shininess: 40 });

    // 1. Back of envelope (the main body)
    const backGeo = new THREE.PlaneGeometry(3.6, 2.4);
    const backMesh = new THREE.Mesh(backGeo, envelopeMat);
    envelopeGroup.add(backMesh);

    // 2. Detailed Pocket (V-shape triangles to look like a real envelope)
    // Left Triangle
    const leftTriShape = new THREE.Shape();
    leftTriShape.moveTo(-1.8, -1.2);
    leftTriShape.lineTo(0, 0);
    leftTriShape.lineTo(-1.8, 1.2);
    leftTriShape.lineTo(-1.8, -1.2);
    const leftPocket = new THREE.Mesh(new THREE.ShapeGeometry(leftTriShape), pocketMat);
    leftPocket.position.z = 0.1;
    envelopeGroup.add(leftPocket);

    // Right Triangle
    const rightTriShape = new THREE.Shape();
    rightTriShape.moveTo(1.8, -1.2);
    rightTriShape.lineTo(0, 0);
    rightTriShape.lineTo(1.8, 1.2);
    rightTriShape.lineTo(1.8, -1.2);
    const rightPocket = new THREE.Mesh(new THREE.ShapeGeometry(rightTriShape), pocketMat);
    rightPocket.position.z = 0.11;
    envelopeGroup.add(rightPocket);

    // Bottom Triangle
    const bottomTriShape = new THREE.Shape();
    bottomTriShape.moveTo(-1.8, -1.2);
    bottomTriShape.lineTo(1.8, -1.2);
    bottomTriShape.lineTo(0, 0.2);
    bottomTriShape.lineTo(-1.8, -1.2);
    const bottomPocket = new THREE.Mesh(new THREE.ShapeGeometry(bottomTriShape), pocketMat);
    bottomPocket.position.z = 0.12;
    envelopeGroup.add(bottomPocket);

    // 3. Top Flap (Triangle)
    const flapTriShape = new THREE.Shape();
    flapTriShape.moveTo(-1.8, 0);
    flapTriShape.lineTo(1.8, 0);
    flapTriShape.lineTo(0, -1.3);
    flapTriShape.lineTo(-1.8, 0);
    envelopeFlap = new THREE.Mesh(new THREE.ShapeGeometry(flapTriShape), flapMat);
    envelopeFlap.position.y = 1.2;
    envelopeFlap.position.z = 0.13;
    envelopeGroup.add(envelopeFlap);

    // 4. Letter (White paper with slight emissive to not look gray)
    const letterGeo = new THREE.PlaneGeometry(3.3, 2.2);
    const letterMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x222222 });
    letterMesh = new THREE.Mesh(letterGeo, letterMat);
    letterMesh.position.z = 0.05;
    envelopeGroup.add(letterMesh);

    scene.add(envelopeGroup);
    
    // Floating animations
    gsap.to(envelopeGroup.position, { y: 0.3, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(envelopeGroup.rotation, { x: 0.1, y: 0.15, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

function animate() {
    requestAnimationFrame(animate);
    heartsBackground.forEach(heart => {
        heart.position.y += heart.userData.speed;
        heart.rotation.y += 0.01;
        if (heart.position.y > 12) resetHeart(heart);
    });
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.rotation.x += 0.02; p.rotation.y += 0.02;
        p.material.opacity -= 0.005;
        if (p.material.opacity <= 0) { scene.remove(p); particles.splice(i, 1); }
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown(event) {
    if (isLetterOpen || !envelopeGroup) return;
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    if (clientX === undefined) return;
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
    if (intersects.length > 0) openLetter();
}

function openLetter() {
    isLetterOpen = true;
    gsap.killTweensOf(envelopeGroup.position);
    gsap.killTweensOf(envelopeGroup.rotation);
    const tl = gsap.timeline();
    tl.to(envelopeFlap.rotation, { x: Math.PI * 0.9, duration: 0.9, ease: "power2.inOut" });
    tl.to(letterMesh.position, { y: 2.5, z: 0.5, duration: 1, ease: "power2.out" }, "-=0.3");
    tl.to(envelopeGroup.position, { y: -4, duration: 1.2, ease: "power2.inOut" }, "-=0.6");
    tl.to(letterMesh.position, { y: 3.5, z: 3, duration: 1.2, ease: "power2.inOut" }, "-=1.2");
    tl.to(letterMesh.scale, { x: 1.6, y: 1.6, duration: 1.2, ease: "power2.inOut" }, "-=1.2");
    tl.call(() => {
        if (uiOverlay) { uiOverlay.classList.remove('hidden'); setTimeout(() => uiOverlay.classList.add('visible'), 50); }
    });
}

function onAmeiClick() {
    if (uiOverlay) uiOverlay.classList.remove('visible');
    const tl = gsap.timeline();
    tl.to(letterMesh.scale, { x: 1, y: 1, duration: 0.8, ease: "power2.in" });
    tl.to(letterMesh.position, { y: 0, z: 0.05, duration: 0.8, ease: "power2.in" }, "-=0.8");
    tl.to(envelopeGroup.position, { y: 0, duration: 0.8, ease: "power2.in" }, "-=0.8");
    tl.to(envelopeFlap.rotation, { x: 0, duration: 0.6, ease: "power2.inOut" });
    tl.to(envelopeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: "back.in(1.5)" });
    tl.call(() => {
        createBurst();
        setTimeout(() => {
            if (finalReveal) { finalReveal.classList.remove('hidden'); setTimeout(() => finalReveal.classList.add('visible'), 50); }
        }, 600);
    });
}

function createBurst() {
    const colors = [0xff4d4d, 0xff9999, 0xff1a1a, 0xe60000, 0xff8080];
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.5, 0.5, 1, 1, 1);
    heartShape.bezierCurveTo(2, 1, 2, 0, 1, -1);
    heartShape.lineTo(0, -2); heartShape.lineTo(-1, -1);
    heartShape.bezierCurveTo(-2, 0, -2, 1, -1, 1);
    heartShape.bezierCurveTo(-0.5, 1, 0, 0.5, 0, 0);
    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const balloonGeo = new THREE.SphereGeometry(0.3, 16, 16);
    for (let i = 0; i < 80; i++) {
        const isHeart = Math.random() > 0.4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: 1 });
        const particle = new THREE.Mesh(isHeart ? heartGeo : balloonGeo, material);
        particle.position.set((Math.random() - 0.5) * 4, -6, (Math.random() - 0.5) * 6);
        particle.scale.setScalar(Math.random() * 0.4 + 0.2);
        particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.08, Math.random() * 0.15 + 0.08, (Math.random() - 0.5) * 0.08);
        scene.add(particle);
        particles.push(particle);
    }
}

window.onload = init;
