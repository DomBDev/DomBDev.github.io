document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');
    
    let tabAccessOrder = JSON.parse(localStorage.getItem('tabAccessOrder')) || [];
    
    const updateTabZIndex = () => {
        const isMobile = window.matchMedia('(max-width: 480px)').matches;
        
        if (isMobile) {
            tabButtons.forEach((button, index) => {
                button.style.zIndex = index < 2 ? index : 10 + index;
            });
        } else {
            tabButtons.forEach((button, index) => {
                const tabName = button.getAttribute('data-tab');
                const orderIndex = tabAccessOrder.indexOf(tabName);
                if (orderIndex !== -1) {
                    button.style.zIndex = 4 + orderIndex;
                } else {
                    button.style.zIndex = index;
                }
            });
        }
    };
    
    const switchTab = (tabName) => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        const targetSection = document.getElementById(tabName);
        
        if (targetButton && targetSection) {
            targetButton.classList.add('active');
            targetSection.classList.add('active');
            localStorage.setItem('activeTab', tabName);
            
            const existingIndex = tabAccessOrder.indexOf(tabName);
            if (existingIndex !== -1) {
                tabAccessOrder.splice(existingIndex, 1);
            }
            tabAccessOrder.push(tabName);
            
            if (tabAccessOrder.length > 10) {
                tabAccessOrder.shift();
            }
            
            localStorage.setItem('tabAccessOrder', JSON.stringify(tabAccessOrder));
            updateTabZIndex();
        }
    };
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    document.querySelectorAll('[data-tab-link]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = el.getAttribute('data-tab-link');
            switchTab(targetTab);
        });
    });
    
    updateTabZIndex();
    
    window.matchMedia('(max-width: 480px)').addEventListener('change', updateTabZIndex);
    
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        switchTab(savedTab);
    }
    
    const profileImage = document.querySelector('.profile-image');
    const profileName = document.querySelector('.profile-name');
    
    const flipProfile = () => {
        if (profileImage) {
            profileImage.classList.add('flipping');
            setTimeout(() => {
                profileImage.classList.remove('flipping');
            }, 1100);
        }
    };
    
    if (profileImage) {
        profileImage.addEventListener('click', flipProfile);
    }
    
    if (profileName) {
        profileName.addEventListener('click', flipProfile);
        profileName.style.cursor = 'pointer';
    }
    
    const copyButton = document.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            const email = copyButton.getAttribute('data-email');
            
            try {
                await navigator.clipboard.writeText(email);
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy email:', err);
            }
        });
    }
    
    const highlightToggles = document.querySelectorAll('.highlight-toggle');
    highlightToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            const techAndToggle = toggle.closest('.tech-and-toggle');
            const projectHighlights = techAndToggle?.nextElementSibling;
            
            toggle.setAttribute('aria-expanded', !isExpanded);
            if (projectHighlights?.classList.contains('project-highlights')) {
                projectHighlights.classList.toggle('expanded');
            }
        });
    });

    const featuredExpandToggles = document.querySelectorAll('.featured-expand-toggle');
    featuredExpandToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            const card = toggle.closest('.project-card-featured');
            const expandedContent = card?.querySelector('.featured-expanded-content');
            
            toggle.setAttribute('aria-expanded', !isExpanded);
            expandedContent?.classList.toggle('expanded');
        });
    });
});
