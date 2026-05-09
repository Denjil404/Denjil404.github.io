const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const nav = document.querySelector('nav');
const navLinks = document.querySelectorAll('.nav-links a');
const aboutLogo = document.querySelector('.about-visual img');
const aboutSection = document.getElementById('about');
let logoClickCount = 0;
let logoClickTimer = null;
let logoPulseAnimation = null;

function pulseAboutLogo() {
    if (!aboutLogo) {
        return;
    }

    const aboutVisual = aboutLogo.closest('.about-visual');

    logoPulseAnimation?.cancel();
    logoPulseAnimation = aboutVisual?.animate(
        [
            { transform: 'scale(1)' },
            { transform: 'scale(1.06)' },
            { transform: 'scale(0.995)' },
            { transform: 'scale(1)' },
        ],
        {
            duration: 430,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'none',
        }
    );
}

// Toggle mobile menu
mobileMenuBtn?.addEventListener('click', () => {
    nav?.classList.toggle('expanded');
});

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (nav?.classList.contains('expanded')) {
            nav.classList.remove('expanded');
        }
    });
});

function playSecretBeep() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);

    oscillator.onended = () => {
        audioContext.close();
    };
}

function createParticleBurst() {
    if (!aboutLogo) {
        return;
    }

    const aboutVisual = aboutLogo.closest('.about-visual');
    const containerRect = aboutVisual?.getBoundingClientRect() || aboutLogo.getBoundingClientRect();
    const particleCount = 16;
    const baseRadius = Math.max(containerRect.width, containerRect.height) * 0.5 + 6;

    aboutVisual?.classList.add('burst-ring');

    for (let index = 0; index < particleCount; index += 1) {
        const particle = document.createElement('span');
        const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.35;
        const distance = 22 + Math.random() * 20;
        const startX = containerRect.left + containerRect.width / 2 + Math.cos(angle) * baseRadius;
        const startY = containerRect.top + containerRect.height / 2 + Math.sin(angle) * baseRadius;
        const size = 4 + Math.random() * 4;

        particle.className = 'logo-particle';
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        particle.style.setProperty('--delay', `${Math.random() * 0.05}s`);

        document.body.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }

    setTimeout(() => {
        aboutVisual?.classList.remove('burst-ring');
    }, 850);
}

if (aboutLogo && aboutSection) {
    aboutLogo.addEventListener('click', () => {
        logoClickCount += 1;
        pulseAboutLogo();

        if (logoClickTimer) {
            clearTimeout(logoClickTimer);
        }

        logoClickTimer = setTimeout(() => {
            logoClickCount = 0;
        }, 900);

        if (logoClickCount >= 5) {
            logoClickCount = 0;
            aboutSection.classList.add('secret-mode');
            createParticleBurst();

            setTimeout(() => {
                aboutSection.classList.remove('secret-mode');
            }, 1300);
        }
    });
}
