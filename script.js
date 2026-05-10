/**
 * Three.js Tribute Site - Ultra Realistic Procedural 3D Envelope
 * TOON SHADING + STROKE LINES
 */

let scene, camera, renderer, raycaster, mouse, clock;
let envelopeGroup, envelopeFlap, letterMesh;
let heartsBackground = [];
let particles = [];
let isLetterOpen = false;

let uiOverlay, btnAmei, finalReveal;

// Toon Materials
let toonMatBase, toonMatShade, toonMatLetter, toonMatOutline;

function init() {
    scene = new THREE.Scene();
    
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
        return;
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    clock = new THREE.Clock();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 5, 5);
    scene.add(sunLight);

    uiOverlay = document.getElementById('ui-overlay');
    btnAmei = document.getElementById('btn-amei');
    finalReveal = document.getElementById('final-reveal');

    if (btnAmei) btnAmei.addEventListener('click', onAmeiClick);

    setupToonMaterials();
    createBackgroundHearts();
    createRealisticEnvelope();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) onDocumentMouseDown(e.touches[0]);
    }, {passive: false});
    
    animate();
}

function setupToonMaterials() {
    const paperColor = 0xfcf9f2;
    const shadowColor = 0xe8e2d2;

    toonMatBase = new THREE.MeshToonMaterial({ color: paperColor, side: THREE.DoubleSide });
    toonMatShade = new THREE.MeshToonMaterial({ color: shadowColor, side: THREE.DoubleSide });
    toonMatLetter = new THREE.MeshToonMaterial({ color: 0xffffff });
    toonMatOutline = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
}

// Improved Outline using EdgesGeometry for crisp cartoon lines
function addStrokeLines(mesh) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    mesh.add(line);
}

function createRealisticEnvelope() {
    envelopeGroup = new THREE.Group();

    // 1. Back Plate (The Foundation)
    const backGeo = new THREE.BoxGeometry(3.6, 2.4, 0.1);
    const back = new THREE.Mesh(backGeo, toonMatBase);
    addStrokeLines(back);
    envelopeGroup.add(back);

    // 2. Pocket Parts - Using distinct Z positions to kill Z-fighting
    const createFold = (shapePoints, color, zOffset) => {
        const shape = new THREE.Shape();
        shape.moveTo(shapePoints[0].x, shapePoints[0].y);
        for(let i=1; i<shapePoints.length; i++) shape.lineTo(shapePoints[i].x, shapePoints[i].y);
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: color, side: THREE.DoubleSide }));
        mesh.position.z = 0.05 + zOffset; // Offset from back plate
        addStrokeLines(mesh);
        return mesh;
    };

    // Left Flap
    envelopeGroup.add(createFold([
        {x: -1.8, y: -1.2}, {x: 0, y: 0}, {x: -1.8, y: 1.2}
    ], 0xe8e2d2, 0.02));

    // Right Flap
    envelopeGroup.add(createFold([
        {x: 1.8, y: -1.2}, {x: 0, y: 0}, {x: 1.8, y: 1.2}
    ], 0xe8e2d2, 0.04));

    // Bottom Flap (On top of sides)
    const bottomFold = createFold([
        {x: -1.8, y: -1.2}, {x: 1.8, y: -1.2}, {x: 0, y: 0.2}
    ], 0xfcf9f2, 0.06);
    envelopeGroup.add(bottomFold);

    // 3. Top Flap with Hinged Pivot
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-1.8, 0);
    flapShape.lineTo(1.8, 0);
    flapShape.lineTo(0, -1.4);
    flapShape.lineTo(-1.8, 0);
    
    envelopeFlap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), toonMatBase);
    addStrokeLines(envelopeFlap);
    
    const flapPivot = new THREE.Group();
    flapPivot.position.y = 1.2;
    flapPivot.position.z = 0.12; // Far enough to not fight
    flapPivot.add(envelopeFlap);
    envelopeGroup.add(flapPivot);
    envelopeFlap.userData.pivot = flapPivot;

    // 4. Letter
    const letterGeo = new THREE.BoxGeometry(3.3, 2.1, 0.02);
    letterMesh = new THREE.Mesh(letterGeo, toonMatLetter);
    addStrokeLines(letterMesh);
    letterMesh.position.z = 0.03; // Inside the pocket
    envelopeGroup.add(letterMesh);

    scene.add(envelopeGroup);

    gsap.to(envelopeGroup.position, { y: 0.2, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(envelopeGroup.rotation, { x: 0.05, y: 0.2, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

function openLetter() {
    isLetterOpen = true;
    const hint = document.getElementById('hint-text');
    if (hint) {
        hint.style.opacity = '0';
        setTimeout(() => hint.style.display = 'none', 500);
    }
    gsap.killTweensOf(envelopeGroup.position);
    gsap.killTweensOf(envelopeGroup.rotation);

    const tl = gsap.timeline();
    tl.to(envelopeFlap.userData.pivot.rotation, { x: Math.PI * 0.85, duration: 1, ease: "back.inOut(1.5)" });
    tl.to(letterMesh.position, { y: 2.8, z: 0.5, duration: 1.2, ease: "power2.out" }, "-=0.4");
    
    tl.to(envelopeGroup.position, { y: -5, z: -2, duration: 1.5, ease: "power2.inOut" }, "-=0.8");
    tl.to(letterMesh.position, { y: 4, z: 3.5, duration: 1.5, ease: "power2.inOut" }, "-=1.5");
    tl.to(letterMesh.scale, { x: 1.7, y: 1.7, duration: 1.5, ease: "power2.inOut" }, "-=1.5");
tl.call(() => {
    if (uiOverlay) {
        uiOverlay.classList.remove('hidden');
        setTimeout(() => {
            uiOverlay.classList.add('visible');

            // Show/hide scroll indicator based on actual content height
            const scrollArea = uiOverlay.querySelector('.scroll-area');
            const indicator = document.getElementById('scroll-indicator');
            if (scrollArea && indicator) {
                if (scrollArea.scrollHeight > scrollArea.clientHeight) {
                    indicator.style.display = 'block';
                } else {
                    indicator.style.display = 'none';
                }

                scrollArea.addEventListener('scroll', () => {
                    if (scrollArea.scrollTop > 20) {
                        indicator.style.opacity = '0';
                    } else {
                        indicator.style.opacity = '1';
                    }
                });
            }
        }, 50);
    }
});
}
function onAmeiClick() {
    uiOverlay.classList.remove('visible');
    const tl = gsap.timeline();
    tl.to(letterMesh.scale, { x: 1, y: 1, duration: 1, ease: "power2.in" });
    tl.to(letterMesh.position, { y: 0, z: 0.03, duration: 1, ease: "power2.in" }, "-=1");
    tl.to(envelopeGroup.position, { y: 0, z: 0, duration: 1, ease: "power2.in" }, "-=1");
    tl.to(envelopeFlap.userData.pivot.rotation, { x: 0, duration: 0.7, ease: "power2.inOut" });
    tl.to(envelopeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: "back.in(1.2)" });
    tl.call(() => {
        createBurst();
        setTimeout(() => {
            finalReveal.classList.remove('hidden');
            setTimeout(() => finalReveal.classList.add('visible'), 50);
        }, 600);
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const timeFactor = Math.min(delta * 60, 2);

    heartsBackground.forEach(h => { 
        h.position.y += h.userData.speed * timeFactor; 
        h.rotation.z += 0.005 * timeFactor;
        if(h.position.y > 10) resetHeart(h); 
    });
    
    for(let i=particles.length-1; i>=0; i--){
        const p = particles[i]; 
        p.position.x += p.userData.velocity.x * timeFactor;
        p.position.y += p.userData.velocity.y * timeFactor;
        p.position.z += p.userData.velocity.z * timeFactor;
        p.rotation.x += p.userData.rotationSpeed * timeFactor;
        p.rotation.y += p.userData.rotationSpeed * timeFactor;
        p.material.opacity -= 0.002 * timeFactor;
        if(p.material.opacity <= 0){ scene.remove(p); particles.splice(i,1); }
    }
    renderer.render(scene, camera);
}

function resetHeart(h) {
    h.position.set((Math.random()-0.5)*20, -10, (Math.random()-0.5)*15);
    h.scale.setScalar(Math.random()*0.2+0.1);
    h.userData.speed = Math.random()*0.02+0.01;
    h.material.opacity = Math.random()*0.4+0.1;
}

function createBackgroundHearts() {
    const s = new THREE.Shape();
    s.moveTo(0,0); s.bezierCurveTo(0,0.5,0.5,1,1,1); s.bezierCurveTo(2,1,2,0,1,-1); s.lineTo(0,-2); s.lineTo(-1,-1); s.bezierCurveTo(-2,0,-2,1,-1,1); s.bezierCurveTo(-0.5,1,0,0.5,0,0);
    const geo = new THREE.ShapeGeometry(s);
    for(let i=0; i<40; i++){
        const h = new THREE.Mesh(geo, new THREE.MeshToonMaterial({color: 0xff4d4d, transparent: true, opacity: 0.3}));
        resetHeart(h); scene.add(h); heartsBackground.push(h);
    }
}

function onWindowResize() { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

function onDocumentMouseDown(e) {
    if(isLetterOpen) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    if(x === undefined) return;
    mouse.x = (x/window.innerWidth)*2-1; mouse.y = -(y/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
    if(intersects.length > 0) openLetter();
}

function createBurst() {
    const colors = [0xff4d4d, 0xff9999, 0xff1a1a, 0xe60000];
    const s = new THREE.Shape(); 
    s.moveTo(0,0); s.bezierCurveTo(0,0.5,0.5,1,1,1); s.bezierCurveTo(2,1,2,0,1,-1); s.lineTo(0,-2); s.lineTo(-1,-1); s.bezierCurveTo(-2,0,-2,1,-1,1); s.bezierCurveTo(-0.5,1,0,0.5,0,0);
    const hG = new THREE.ShapeGeometry(s); const bG = new THREE.SphereGeometry(0.3, 16, 16);
    
    for(let i=0; i<120; i++){
        const isHeart = Math.random() > 0.4;
        const p = new THREE.Mesh(isHeart ? hG : bG, new THREE.MeshToonMaterial({color: colors[Math.floor(Math.random()*colors.length)], transparent: true, opacity: 1}));
        p.position.set((Math.random()-0.5)*2, -5, (Math.random()-0.5)*3);
        p.scale.setScalar(Math.random()*0.3 + 0.1);
        p.userData.velocity = new THREE.Vector3((Math.random()-0.5)*0.03, Math.random()*0.03+0.015, (Math.random()-0.5)*0.03);
        p.userData.rotationSpeed = (Math.random()-0.5)*0.015;
        scene.add(p); particles.push(p);
    }
}

window.onload = init;
