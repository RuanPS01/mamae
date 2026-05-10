/**
 * Three.js Tribute Site - Ultra Realistic Procedural 3D Envelope
 */

let scene, camera, renderer, raycaster, mouse;
let envelopeGroup, envelopeFlap, letterMesh;
let heartsBackground = [];
let particles = [];
let isLetterOpen = false;

let uiOverlay, btnAmei, finalReveal;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3d0202); // Deeper red for contrast
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true; // Enable shadows
        
        const container = document.getElementById('canvas-container');
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
    } catch (e) {
        return;
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // High-end Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 5, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.PointLight(0xff8888, 1);
    fillLight.position.set(-5, 0, 2);
    scene.add(fillLight);

    uiOverlay = document.getElementById('ui-overlay');
    btnAmei = document.getElementById('btn-amei');
    finalReveal = document.getElementById('final-reveal');

    if (btnAmei) btnAmei.addEventListener('click', onAmeiClick);

    createBackgroundHearts();
    createRealisticEnvelope();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) onDocumentMouseDown(e.touches[0]);
    }, {passive: false});
    
    animate();
}

function createRealisticEnvelope() {
    envelopeGroup = new THREE.Group();

    // High-quality paper materials
    const paperColor = 0xfcf9f2;
    const shadowColor = 0xe8e2d2;
    
    const matBase = new THREE.MeshPhongMaterial({ color: paperColor, shininess: 5, side: THREE.DoubleSide });
    const matShade = new THREE.MeshPhongMaterial({ color: shadowColor, shininess: 2, side: THREE.DoubleSide });

    // 1. Back Plate (with slight thickness)
    const backGeo = new THREE.BoxGeometry(3.6, 2.4, 0.05);
    const back = new THREE.Mesh(backGeo, matBase);
    envelopeGroup.add(back);

    // 2. Pocket Parts (V-fold style)
    const createFold = (shapePoints, color, z) => {
        const shape = new THREE.Shape();
        shape.moveTo(shapePoints[0].x, shapePoints[0].y);
        for(let i=1; i<shapePoints.length; i++) shape.lineTo(shapePoints[i].x, shapePoints[i].y);
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide }));
        mesh.position.z = z;
        return mesh;
    };

    // Left Flap (Inner)
    envelopeGroup.add(createFold([
        {x: -1.8, y: -1.2}, {x: 0, y: 0}, {x: -1.8, y: 1.2}
    ], shadowColor, 0.03));

    // Right Flap (Inner)
    envelopeGroup.add(createFold([
        {x: 1.8, y: -1.2}, {x: 0, y: 0}, {x: 1.8, y: 1.2}
    ], shadowColor, 0.03));

    // Bottom Flap (Overlapping)
    const bottomFold = createFold([
        {x: -1.8, y: -1.2}, {x: 1.8, y: -1.2}, {x: 0, y: 0.2}
    ], paperColor, 0.06);
    envelopeGroup.add(bottomFold);

    // 3. Top Flap with Hinged Pivot
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-1.8, 0);
    flapShape.lineTo(1.8, 0);
    flapShape.lineTo(0, -1.4); // Deep V
    flapShape.lineTo(-1.8, 0);
    
    const flapGeo = new THREE.ShapeGeometry(flapShape);
    envelopeFlap = new THREE.Mesh(flapGeo, matBase);
    
    const flapPivot = new THREE.Group();
    flapPivot.position.y = 1.2;
    flapPivot.position.z = 0.07;
    flapPivot.add(envelopeFlap);
    envelopeGroup.add(flapPivot);
    
    // Store pivot for animation
    envelopeFlap.userData.pivot = flapPivot;

    // 4. Letter (with slight thickness)
    const letterGeo = new THREE.BoxGeometry(3.3, 2.1, 0.02);
    const letterMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x111111 });
    letterMesh = new THREE.Mesh(letterGeo, letterMat);
    letterMesh.position.z = 0.04;
    envelopeGroup.add(letterMesh);

    scene.add(envelopeGroup);

    // Smooth idle animation
    gsap.to(envelopeGroup.position, { y: 0.2, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(envelopeGroup.rotation, { x: 0.05, y: 0.2, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

function openLetter() {
    isLetterOpen = true;
    gsap.killTweensOf(envelopeGroup.position);
    gsap.killTweensOf(envelopeGroup.rotation);

    const tl = gsap.timeline();
    // Rotate the pivot instead of the mesh directly
    tl.to(envelopeFlap.userData.pivot.rotation, { x: Math.PI * 0.85, duration: 1, ease: "back.inOut(1.5)" });
    tl.to(letterMesh.position, { y: 2.8, z: 0.5, duration: 1.2, ease: "power2.out" }, "-=0.4");
    
    tl.to(envelopeGroup.position, { y: -5, z: -2, duration: 1.5, ease: "power2.inOut" }, "-=0.8");
    tl.to(letterMesh.position, { y: 4, z: 3.5, duration: 1.5, ease: "power2.inOut" }, "-=1.5");
    tl.to(letterMesh.scale, { x: 1.7, y: 1.7, duration: 1.5, ease: "power2.inOut" }, "-=1.5");

    tl.call(() => {
        uiOverlay.classList.remove('hidden');
        setTimeout(() => uiOverlay.classList.add('visible'), 50);
    });
}

function onAmeiClick() {
    uiOverlay.classList.remove('visible');
    const tl = gsap.timeline();
    tl.to(letterMesh.scale, { x: 1, y: 1, duration: 1, ease: "power2.in" });
    tl.to(letterMesh.position, { y: 0, z: 0.04, duration: 1, ease: "power2.in" }, "-=1");
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
    heartsBackground.forEach(h => { h.position.y += h.userData.speed; h.rotation.z += 0.01; if(h.position.y > 10) resetHeart(h); });
    for(let i=particles.length-1; i>=0; i--){
        const p = particles[i]; p.position.add(p.userData.velocity); p.rotation.x+=0.02; p.material.opacity-=0.005;
        if(p.material.opacity<=0){ scene.remove(p); particles.splice(i,1); }
    }
    renderer.render(scene, camera);
}

function resetHeart(h) {
    h.position.set((Math.random()-0.5)*20, -10, (Math.random()-0.5)*15);
    h.scale.setScalar(Math.random()*0.2+0.1);
    h.userData.speed = Math.random()*0.02+0.02;
    h.material.opacity = Math.random()*0.4+0.1;
}

function createBackgroundHearts() {
    const s = new THREE.Shape();
    s.moveTo(0,0); s.bezierCurveTo(0,0.5,0.5,1,1,1); s.bezierCurveTo(2,1,2,0,1,-1); s.lineTo(0,-2); s.lineTo(-1,-1); s.bezierCurveTo(-2,0,-2,1,-1,1); s.bezierCurveTo(-0.5,1,0,0.5,0,0);
    const geo = new THREE.ShapeGeometry(s);
    for(let i=0; i<40; i++){
        const h = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({color: 0xff4d4d, transparent: true, opacity: 0.3}));
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
    const s = new THREE.Shape(); s.moveTo(0,0); s.bezierCurveTo(0,0.5,0.5,1,1,1); s.bezierCurveTo(2,1,2,0,1,-1); s.lineTo(0,-2); s.lineTo(-1,-1); s.bezierCurveTo(-2,0,-2,1,-1,1); s.bezierCurveTo(-0.5,1,0,0.5,0,0);
    const hG = new THREE.ShapeGeometry(s); const bG = new THREE.SphereGeometry(0.3, 16, 16);
    for(let i=0; i<100; i++){
        const p = new THREE.Mesh(Math.random()>0.4?hG:bG, new THREE.MeshPhongMaterial({color: colors[Math.floor(Math.random()*colors.length)], transparent: true}));
        p.position.set((Math.random()-0.5)*4, -6, (Math.random()-0.5)*6);
        p.scale.setScalar(Math.random()*0.4+0.2);
        p.userData.velocity = new THREE.Vector3((Math.random()-0.5)*0.1, Math.random()*0.15+0.1, (Math.random()-0.5)*0.1);
        scene.add(p); particles.push(p);
    }
}

window.onload = init;
