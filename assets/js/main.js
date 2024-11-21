document.addEventListener('DOMContentLoaded', () => {
    // Custom cursor
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, observerOptions);

    // Observe project items as they're added
    const fetchRepos = async () => {
        try {
            const response = await fetch('https://bonannidominic.me/api/projects');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const projects = await response.json();
            const projectList = document.querySelector('.project-list');
            
            if (!Array.isArray(projects)) {
                throw new Error('Received invalid data from API');
            }
            
            projects.forEach(project => {
                const card = createProjectCard(project);
                projectList.appendChild(card);
            });

            initializeFilters();
            animateProjects();
        } catch (error) {
            console.error('Error fetching projects:', error);
            const projectList = document.querySelector('.project-list');
            projectList.innerHTML = `
                <div class="col-span-full text-center py-8 text-accent/60">
                    <p>Unable to load projects at this time. Please try again later.</p>
                </div>
            `;
        }
    };

    fetchRepos();

    // Smooth scroll effect
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Update the observer options for stats cards
    const statsObserverOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                statsObserver.unobserve(entry.target);
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    }, statsObserverOptions);

    // Observe stats cards with new animation
    const statsCards = document.querySelectorAll('.stats-card');
    statsCards.forEach(card => {
        statsObserver.observe(card);
    });
});

const createProjectCard = (project) => {
    const card = document.createElement('div');
    card.className = 'project-card bg-accent-start/5 rounded-lg p-5 backdrop-blur-sm border border-accent/10 opacity-0 transform translate-y-8 flex flex-col gap-3 h-[180px] transition-all duration-300 hover:border-accent/30 hover:bg-accent-start/10';
    card.dataset.category = getProjectCategory(project);

    const emoji = getProjectEmoji(project);

    card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
            <h3 class="font-mono text-base text-accent truncate">${project.title}</h3>
            <span class="text-accent/70 shrink-0">${emoji}</span>
        </div>
        <p class="text-white/70 text-sm line-clamp-3 flex-grow">${project.description}</p>
        <div class="flex items-center justify-between mt-auto pt-2 border-t border-accent/10">
            <div class="flex flex-wrap gap-2 items-center">
                ${project.skills ? project.skills.slice(0, 2).map(skill => 
                    `<span class="text-[10px] px-2 py-0.5 bg-accent/10 rounded-full font-mono text-accent/70">${skill}</span>`
                ).join('') : ''}
            </div>
            ${project.github ? `
                <a href="${project.github}" target="_blank" 
                   class="text-accent/70 hover:text-accent transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12C2 16.991 5.657 21.128 10.438 22V18.657C10.438 18.657 9.875 18.657 9.031 18.657C7.546 18.657 6.938 17.657 6.844 17.157C6.75 16.657 6.375 16.157 6 15.907C5.625 15.657 5.25 15.657 5.438 15.407C6.188 14.907 6.938 15.407 7.688 16.407C8.219 17.157 9.031 17.032 9.438 16.907C9.531 16.407 9.813 15.907 10.188 15.657C7.313 15.157 5.813 13.657 5.813 11.407C5.813 10.407 6.188 9.407 6.938 8.657C6.844 8.407 6.75 7.782 6.75 6.907C6.75 6.407 6.75 5.657 7.125 5.157C7.125 5.157 8.813 5.157 10.438 6.657C11.188 6.407 12.813 6.407 13.563 6.657C15.188 5.157 16.875 5.157 16.875 5.157C17.25 5.657 17.25 6.407 17.25 6.907C17.25 7.907 17.156 8.407 17.063 8.657C17.813 9.407 18.188 10.282 18.188 11.407C18.188 13.657 16.688 15.157 13.813 15.657C14.188 15.907 14.563 16.532 14.563 17.157V22C19.344 21.128 23 16.991 23 12C23 6.477 18.523 2 13 2H12Z"/>
                    </svg>
                </a>
            ` : ''}
        </div>
    `;

    return card;
};

const initializeFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterProjects(filter);
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
};

const filterProjects = (category) => {
    const projectList = document.querySelector('.project-list');
    const projects = document.querySelectorAll('.project-card');
    let hasVisibleProjects = false;
    
    // Get the current height of the container and set it explicitly
    const currentHeight = projectList.offsetHeight;
    projectList.style.height = `${currentHeight}px`;
    
    projects.forEach((project, index) => {
        const shouldShow = category === 'all' || project.dataset.category === category;
        
        project.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        
        if (shouldShow) {
            hasVisibleProjects = true;
            project.style.display = 'flex'; // Keep flex display for card content
            project.style.position = 'relative';
            setTimeout(() => {
                project.style.opacity = '1';
                project.style.transform = 'translateY(0)';
            }, index * 50);
        } else {
            project.style.opacity = '0';
            project.style.transform = 'translateY(20px)';
            project.style.position = 'absolute';
            setTimeout(() => {
                project.style.display = 'none';
            }, 200);
        }
    });

    // Show message if no projects in category
    const noProjectsMsg = document.querySelector('.no-projects-message');
    if (!hasVisibleProjects) {
        if (!noProjectsMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-projects-message col-span-full text-center py-8 text-accent/60';
            msg.textContent = `No projects found in the "${category}" category yet.`;
            projectList.appendChild(msg);
        }
    } else if (noProjectsMsg) {
        noProjectsMsg.remove();
    }
};

const showProjectDetails = (repo) => {
    const popover = document.createElement('div');
    popover.className = 'popover';
    // Add detailed project information here
    
    document.body.appendChild(popover);
    setTimeout(() => popover.classList.add('active'), 10);
    
    const closePopover = (e) => {
        if (e.target === popover) {
            popover.classList.remove('active');
            setTimeout(() => popover.remove(), 300);
        }
    };
    
    popover.addEventListener('click', closePopover);
};

const getProjectCategory = (project) => {
    // Use the category from the API
    const category = project.category?.toLowerCase() || '';
    
    if (category.includes('featured')) return 'website';
    if (category.includes('archived')) return 'website';
    if (category.includes('future')) return 'tools';
    
    return 'website'; // Default category
};

const getProjectEmoji = (project) => {
    const icons = {
        website: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM3.37 12C3.37 7.38 7.38 3.37 12 3.37C13.96 3.37 15.78 3.99 17.28 5.08L5.08 17.28C3.99 15.78 3.37 13.96 3.37 12ZM12 20.63C10.04 20.63 8.22 20.01 6.72 18.92L18.92 6.72C20.01 8.22 20.63 10.04 20.63 12C20.63 16.62 16.62 20.63 12 20.63Z"/>
        </svg>`,
        portfolio: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z"/>
        </svg>`,
        tools: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"/>
        </svg>`
    };
    
    const category = project.category?.toLowerCase() || '';
    const title = project.title?.toLowerCase() || '';
    
    if (category.includes('featured')) return icons.portfolio;
    if (title.includes('tool') || category.includes('future')) return icons.tools;
    return icons.website;
};

// Add this new function to animate projects on load
const animateProjects = () => {
    const projects = document.querySelectorAll('.project-card');
    projects.forEach((project, index) => {
        setTimeout(() => {
            project.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            project.style.opacity = '1';
            project.style.transform = 'translateY(0)';
        }, index * 50);
    });
};
