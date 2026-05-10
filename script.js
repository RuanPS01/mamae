/**
 * Three.js Tribute Site - 3D Refactor
 */

// Scene Variables
let scene, camera, renderer, raycaster, mouse;
let envelopeGroup, envelopeFlap, letterMesh;
let heartsBackground = [];
let particles = [];
let isLetterOpen = false;

// UI Elements
const uiOverlay = document.getElementById('ui-overlay');
const btnAmei = document.getElementById('btn-amei');
const finalReveal = document.getElementById('final-reveal');

// Initialize
function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a0404);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 3. Create Objects
    createBackgroundHearts();
    createEnvelope();
    
    // 4. Events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('touchstart', (e) => onDocumentMouseDown(e.touches[0]), {passive: false});
    
    btnAmei.addEventListener('click', onAmeiClick);

    // 5. Animation Loop
    animate();
}

// --- Object Creation Functions ---

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
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide 
    });

    for (let i = 0; i < 40; i++) {
        const heart = new THREE.Mesh(geometry, material.clone());
        resetHeart(heart);
        scene.add(heart);
        heartsBackground.push(heart);
    }
}

function resetHeart(heart) {
    heart.position.set(
        (Math.random() - 0.5) * 15,
        -10 - Math.random() * 10,
        (Math.random() - 0.5) * 10
    );
    heart.scale.setScalar(Math.random() * 0.2 + 0.1);
    heart.userData.speed = Math.random() * 0.02 + 0.01;
    heart.material.opacity = Math.random() * 0.3 + 0.1;
}

function createEnvelope() {
    envelopeGroup = new THREE.Group();

    const envelopeMat = new THREE.MeshPhongMaterial({ color: 0xf5f5dc, side: THREE.DoubleSide });
    const pocketMat = new THREE.MeshPhongMaterial({ color: 0xe6e6c8, side: THREE.DoubleSide });
    const flapMat = new THREE.MeshPhongMaterial({ color: 0xd9d9b1, side: THREE.DoubleSide });

    // Back of envelope
    const backGeo = new THREE.PlaneGeometry(3.5, 2.3);
    const backMesh = new THREE.Mesh(backGeo, envelopeMat);
    envelopeGroup.add(backMesh);

    // Pocket (Bottom & Sides) - Simplified as one plane with slightly different color
    const pocketGeo = new THREE.PlaneGeometry(3.5, 2.3);
    const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
    pocketMesh.position.z = 0.05;
    envelopeGroup.add(pocketMesh);

    // Top Flap
    const flapGeo = new THREE.PlaneGeometry(3.5, 1.8);
    envelopeFlap = new THREE.Mesh(flapGeo, flapMat);
    // Align top of flap to top of envelope and set pivot point
    envelopeFlap.geometry.translate(0, -0.9, 0); 
    envelopeFlap.position.y = 1.15;
    envelopeFlap.position.z = 0.06;
    envelopeGroup.add(envelopeFlap);

    // Letter
    const letterGeo = new THREE.PlaneGeometry(3.2, 2.1);
    const letterMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    letterMesh = new THREE.Mesh(letterGeo, letterMat);
    letterMesh.position.z = 0.02;
    envelopeGroup.add(letterMesh);

    scene.add(envelopeGroup);
    
    // Initial floating animation
    gsap.to(envelopeGroup.position, {
        y: 0.3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });
    
    gsap.to(envelopeGroup.rotation, {
        x: 0.1,
        y: 0.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });
}

// --- Animation & Interaction ---

function animate() {
    requestAnimationFrame(animate);

    // Background hearts animation
    heartsBackground.forEach(heart => {
        heart.position.y += heart.userData.speed;
        heart.rotation.y += 0.01;
        if (heart.position.y > 10) resetHeart(heart);
    });

    // Particles animation
    particles.forEach((p, i) => {
        p.position.add(p.userData.velocity);
        p.rotation.x += 0.02;
        p.rotation.y += 0.02;
        p.material.opacity -= 0.005;
        if (p.material.opacity <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown(event) {
    if (isLetterOpen) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(envelopeGroup.children, true);

    if (intersects.length > 0) {
        openLetter();
    }
}

function openLetter() {
    isLetterOpen = true;
    
    // Stop floating animation on the group if we want a clean state
    gsap.killTweensOf(envelopeGroup.position);
    gsap.killTweensOf(envelopeGroup.rotation);

    const tl = gsap.timeline();

    // 1. Open Flap
    tl.to(envelopeFlap.rotation, { x: Math.PI * 0.8, duration: 0.8, ease: "power2.inOut" });

    // 2. Slide Letter Up
    tl.to(letterMesh.position, { y: 2.5, z: 0.2, duration: 1, ease: "power2.out" }, "-=0.2");

    // 3. Bring Letter Forward & Move Envelope Down
    tl.to(envelopeGroup.position, { y: -3, duration: 1, ease: "power2.inOut" }, "-=0.5");
    tl.to(letterMesh.position, { y: 3.5, z: 2.5, duration: 1, ease: "power2.inOut" }, "-=1");
    tl.to(letterMesh.scale, { x: 1.5, y: 1.5, duration: 1, ease: "power2.inOut" }, "-=1");

    // 4. Show HTML UI
    tl.call(() => {
        uiOverlay.classList.remove('hidden');
        setTimeout(() => uiOverlay.classList.add('visible'), 50);
    });
}

function onAmeiClick() {
    uiOverlay.classList.remove('visible');
    
    const tl = gsap.timeline();

    // 1. Letter goes back into envelope
    tl.to(letterMesh.scale, { x: 1, y: 1, duration: 0.8, ease: "power2.in" });
    tl.to(letterMesh.position, { y: 0, z: 0.02, duration: 0.8, ease: "power2.in" }, "-=0.8");
    tl.to(envelopeGroup.position, { y: 0, duration: 0.8, ease: "power2.in" }, "-=0.8");

    // 2. Close Flap
    tl.to(envelopeFlap.rotation, { x: 0, duration: 0.5, ease: "power2.inOut" });

    // 3. Envelope Disappears
    tl.to(envelopeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: "back.in(1.7)" });
    tl.to(envelopeGroup.position, { y: -5, duration: 0.8 }, "-=0.8");

    // 4. Burst of Hearts and Balloons
    tl.call(() => {
        createBurst();
        setTimeout(() => {
            finalReveal.classList.remove('hidden');
            setTimeout(() => finalReveal.classList.add('visible'), 50);
        }, 500);
    });
}

function createBurst() {
    const colors = [0xff4d4d, 0xff9999, 0xff1a1a, 0xe60000, 0xff8080];
    
    // Heart Shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.5, 0.5, 1, 1, 1);
    heartShape.bezierCurveTo(2, 1, 2, 0, 1, -1);
    heartShape.lineTo(0, -2);
    heartShape.lineTo(-1, -1);
    heartShape.bezierCurveTo(-2, 0, -2, 1, -1, 1);
    heartShape.bezierCurveTo(-0.5, 1, 0, 0.5, 0, 0);
    const heartGeo = new THREE.ShapeGeometry(heartShape);

    // Balloon Shape (Sphere)
    const balloonGeo = new THREE.SphereGeometry(0.3, 16, 16);

    for (let i = 0; i < 80; i++) {
        const isHeart = Math.random() > 0.4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshPhongMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 1 
        });

        const particle = new THREE.Mesh(isHeart ? heartGeo : balloonGeo, material);
        
        particle.position.set(
            (Math.random() - 0.5) * 2,
            -5,
            (Math.random() - 0.5) * 5
        );
        
        particle.scale.setScalar(Math.random() * 0.5 + 0.2);
        
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.15 + 0.05,
            (Math.random() - 0.5) * 0.1
        );

        scene.add(particle);
        particles.push(particle);
    }
}

// Start
init();
