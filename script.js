document.addEventListener('DOMContentLoaded', () => {
    const backgroundHearts = document.getElementById('background-hearts');
    const envelope = document.getElementById('envelope');
    const btnAmei = document.getElementById('btn-amei');
    const finalReveal = document.getElementById('final-reveal');
    const envelopeWrapper = document.getElementById('envelope-wrapper');

    // 1. Generate background hearts
    function createBgHeart() {
        const heartContainer = document.createElement('div');
        heartContainer.classList.add('bg-heart');
        
        const heart = document.createElement('div');
        heart.classList.add('heart-shape');
        
        const size = Math.random() * 20 + 10;
        heart.style.width = `${size}px`;
        heart.style.height = `${size}px`;
        
        heartContainer.style.left = `${Math.random() * 100}%`;
        heartContainer.style.setProperty('--speed', `${Math.random() * 5 + 5}s`);
        
        heartContainer.appendChild(heart);
        backgroundHearts.appendChild(heartContainer);
        
        setTimeout(() => {
            heartContainer.remove();
        }, 10000);
    }

    setInterval(createBgHeart, 500);

    // 2. Handle envelope click
    envelope.addEventListener('click', () => {
        if (!envelope.classList.contains('open')) {
            envelope.classList.add('open');
        }
    });

    // 3. Handle "Amei" button click
    btnAmei.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        // Reverse envelope/letter animation
        envelope.classList.remove('open');
        
        setTimeout(() => {
            // Fade out envelope
            envelopeWrapper.style.opacity = '0';
            envelopeWrapper.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
                envelopeWrapper.classList.add('hidden');
                
                // Show final reveal
                finalReveal.classList.remove('hidden');
                setTimeout(() => {
                    finalReveal.classList.add('visible');
                    createBurst();
                }, 100);
            }, 1000);
        }, 800);
    });

    // 4. Create burst of balloons and hearts
    function createBurst() {
        const colors = ['#ff4d4d', '#ff9999', '#ff1a1a', '#e60000', '#ff8080'];
        
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const isHeart = Math.random() > 0.4;
                const particle = document.createElement('div');
                
                if (isHeart) {
                    particle.classList.add('heart-shape', 'particle');
                    const size = Math.random() * 15 + 20;
                    particle.style.width = `${size}px`;
                    particle.style.height = `${size}px`;
                    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                } else {
                    particle.classList.add('particle', 'balloon');
                    const sizeW = Math.random() * 20 + 30;
                    particle.style.width = `${sizeW}px`;
                    particle.style.height = `${sizeW * 1.2}px`;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.backgroundColor = color;
                    particle.style.color = color;
                }
                
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.setProperty('--drift', `${(Math.random() - 0.5) * 600}px`);
                
                finalReveal.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 4000);
            }, i * 80);
        }
    }
});
