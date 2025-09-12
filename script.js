// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupSmoothScrolling();
    setupScrollAnimations();
    setupHeaderEffects();
    setupMobileMenu();
    setupProjectCardEffects();
    setupTikTokEmbed();
    setupUpdateFeed();
}

// Smooth Scrolling für Navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animationen
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Spezielle Animation für Projekt-Cards
                if (entry.target.classList.contains('project-card')) {
                    setTimeout(() => {
                        entry.target.style.transform = 'translateY(0) scale(1)';
                        entry.target.style.opacity = '1';
                    }, Math.random() * 300);
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Header Effekte beim Scrollen
function setupHeaderEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Header Background Opacity
        if (currentScroll > 100) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.backdropFilter = 'blur(30px)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
            header.style.boxShadow = 'none';
        }
        
        // Header Hide/Show auf Mobile
        if (window.innerWidth <= 768) {
            if (currentScroll > lastScrollTop && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = currentScroll;
    });
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'rgba(10, 10, 10, 0.98)';
                navLinks.style.padding = '2rem';
                navLinks.style.backdropFilter = 'blur(30px)';
                navLinks.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                
                // Animate toggle icon
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                navLinks.style.display = 'none';
                
                // Reset toggle icon
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu when clicking on links
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) {
                    mobileToggle.click();
                }
            });
        });
    }
}

// Projekt Card Hover Effekte
function setupProjectCardEffects() {
    document.querySelectorAll('.project-card, .tutorial-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            
            // Parallax effect für Icon
            const icon = this.querySelector('.project-icon, .tutorial-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            
            const icon = this.querySelector('.project-icon, .tutorial-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
        
        // Click Animation
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            }, 150);
        });
    });
}

// TikTok Embed Setup (Placeholder für echte Integration)
function setupTikTokEmbed() {
    const tiktokContainer = document.querySelector('.tiktok-embed-instructions');
    
    if (tiktokContainer) {
        // Hier würde die echte TikTok API Integration stehen
        // Für jetzt simulieren wir das Loading
        setTimeout(() => {
            const placeholder = tiktokContainer.querySelector('.placeholder-video');
            if (placeholder) {
                placeholder.addEventListener('click', () => {
                    // Simuliere Video-Interaktion
                    const playIcon = placeholder.querySelector('.play-icon');
                    if (playIcon) {
                        playIcon.textContent = playIcon.textContent === '▶️' ? '⏸️' : '▶️';
                        placeholder.style.background = 'rgba(59, 130, 246, 0.1)';
                        
                        setTimeout(() => {
                            placeholder.style.background = 'rgba(255, 255, 255, 0.05)';
                        }, 2000);
                    }
                });
            }
        }, 1000);
    }
}

// Update Feed Simulation
function setupUpdateFeed() {
    const updateItems = document.querySelectorAll('.update-item');
    
    // Animate update items on scroll
    updateItems.forEach((item, index) => {
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }
                });
            });
            
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'all 0.5s ease';
            
            observer.observe(item);
        }, index * 100);
    });
    
    // Simuliere neue Updates (für Demo)
    if (window.location.hash === '#demo') {
        setTimeout(() => {
            addNewUpdate('Gerade eben', 'Neue Funktion getestet! 🔧');
        }, 3000);
    }
}

// Utility: Neues Update hinzufügen
function addNewUpdate(date, message) {
    const updatesContainer = document.querySelector('.latest-updates');
    const newUpdate = document.createElement('div');
    newUpdate.className = 'update-item';
    newUpdate.style.opacity = '0';
    newUpdate.style.transform = 'translateY(-20px)';
    
    newUpdate.innerHTML = `
        <span class="update-date">${date}</span>
        <p>${message}</p>
    `;
    
    const firstUpdate = updatesContainer.querySelector('.update-item');
    if (firstUpdate) {
        updatesContainer.insertBefore(newUpdate, firstUpdate);
    }
    
    // Animate in
    setTimeout(() => {
        newUpdate.style.opacity = '1';
        newUpdate.style.transform = 'translateY(0)';
        newUpdate.style.transition = 'all 0.5s ease';
    }, 100);
    
    // Remove oldest update if more than 5
    const allUpdates = updatesContainer.querySelectorAll('.update-item');
    if (allUpdates.length > 5) {
        allUpdates[allUpdates.length - 1].remove();
    }
}

// Skills Animation
function animateSkills() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach((skill, index) => {
        skill.addEventListener('mouseenter', () => {
            const icon = skill.querySelector('.skill-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(10deg)';
                icon.style.transition = 'all 0.3s ease';
            }
        });
        
        skill.addEventListener('mouseleave', () => {
            const icon = skill.querySelector('.skill-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
}

// Social Links Tracking (für Analytics)
function trackSocialLinks() {
    document.querySelectorAll('.social-link, .footer-social a').forEach(link => {
        link.addEventListener('click', (e) => {
            const platform = link.getAttribute('title') || 'unknown';
            console.log(`Social link clicked: ${platform}`);
            
            // Hier könnte Google Analytics oder ähnliches integriert werden
            // gtag('event', 'click', { event_category: 'social', event_label: platform });
        });
    });
}

// Coming Soon Badge Animation
function animateComingSoonBadges() {
    document.querySelectorAll('.coming-soon-badge').forEach(badge => {
        // Pulsing animation
        badge.style.animation = 'pulse 2s infinite';
        
        // Add CSS for pulse animation if not exists
        if (!document.querySelector('#pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `;
            document.head.appendChild(style);
        }
    });
}

// Lazy Loading für zukünftige Bilder
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Performance Monitoring
function monitorPerformance() {
    // Monitor scroll performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                scrollTimeout = null;
                // Performance check could go here
            }, 100);
        }
    }, { passive: true });
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    animateSkills();
    trackSocialLinks();
    animateComingSoonBadges();
    setupLazyLoading();
    monitorPerformance();
});

// Easter Egg: Konami Code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        // Easter Egg aktiviert!
        document.body.style.animation = 'rainbow 2s linear infinite';
        
        if (!document.querySelector('#rainbow-animation')) {
            const style = document.createElement('style');
            style.id = 'rainbow-animation';
            style.textContent = `
                @keyframes rainbow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
        
        console.log('🎉 Easter Egg gefunden! Du bist ein wahrer Maker! 🎉');
    }
});
