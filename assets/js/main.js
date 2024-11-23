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

    // Dropdown functionality
    const projectsDropdown = document.getElementById('projectsDropdown');
    const dropdownContent = document.getElementById('dropdownContent');
    const sections = document.querySelectorAll('.section-content');
    const sectionBtns = document.querySelectorAll('.section-btn');

    projectsDropdown.addEventListener('click', () => {
        dropdownContent.classList.toggle('hidden');
        projectsDropdown.querySelector('svg').classList.toggle('rotate-180');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!projectsDropdown.contains(e.target)) {
            dropdownContent.classList.add('hidden');
            projectsDropdown.querySelector('svg').classList.remove('rotate-180');
        }
    });

    // Section switching
    sectionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section + 'Section';
            const sectionTitle = btn.dataset.title;
            
            // Update the title
            document.getElementById('currentSection').textContent = sectionTitle;
            
            // Switch sections
            sections.forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(sectionId).classList.remove('hidden');
            
            // Close dropdown
            dropdownContent.classList.add('hidden');
            projectsDropdown.querySelector('svg').classList.remove('rotate-180');
            
            // If switching to contributions section, fetch the data
            if (btn.dataset.section === 'contributions') {
                fetchGitHubContributions();
            }
        });
    });

    // GitHub Repos functionality
    async function fetchGitHubRepos() {
        try {
            const response = await fetch('https://api.github.com/users/DomBDev/repos');
            const repos = await response.json();
            const repoList = document.querySelector('.repo-list');
            
            repos.forEach(repo => {
                const repoElement = document.createElement('div');
                repoElement.className = 'bg-accent/5 rounded-lg p-4 hover:bg-accent/10 transition-colors duration-300';
                repoElement.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-mono text-lg text-accent">
                                <a href="${repo.html_url}" target="_blank" class="hover:underline">${repo.name}</a>
                            </h3>
                            <p class="text-sm text-white/70 mt-2">${repo.description || 'No description available'}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span class="text-sm text-accent">${repo.stargazers_count}</span>
                            </div>
                            <div class="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">${repo.language || 'N/A'}</div>
                        </div>
                    </div>
                `;
                repoList.appendChild(repoElement);
            });
        } catch (error) {
            console.error('Error fetching GitHub repos:', error);
        }
    }

    // Call fetchGitHubRepos when the page loads
    fetchGitHubRepos();
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

// Add this new function to fetch and display contributions
async function fetchGitHubContributions() {
    try {
        const username = 'DomBDev';
        const contributionsContent = document.querySelector('.contributions-content');
        
        // First, let's add a loading state
        contributionsContent.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
        `;

        // Fetch the last year of contributions using the GitHub API
        const response = await fetch(`https://api.github.com/users/${username}/events/public`);
        const events = await response.json();

        // Process and group the events
        const contributionData = processGitHubEvents(events);
        
        // Create the contributions display
        contributionsContent.innerHTML = `
            <div class="grid gap-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-accent/5 rounded-lg p-4 border border-accent/10">
                        <h3 class="text-accent font-mono text-sm mb-2">Total Contributions</h3>
                        <p class="text-2xl font-bold">${contributionData.totalContributions}</p>
                    </div>
                    <div class="bg-accent/5 rounded-lg p-4 border border-accent/10">
                        <h3 class="text-accent font-mono text-sm mb-2">Active Repositories</h3>
                        <p class="text-2xl font-bold">${contributionData.activeRepos.size}</p>
                    </div>
                    <div class="bg-accent/5 rounded-lg p-4 border border-accent/10">
                        <h3 class="text-accent font-mono text-sm mb-2">Contribution Streak</h3>
                        <p class="text-2xl font-bold">${contributionData.currentStreak} days</p>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-accent/5 rounded-lg p-6 border border-accent/10">
                    <h3 class="text-accent font-mono text-lg mb-4">Recent Activity</h3>
                    <div class="space-y-4">
                        ${generateRecentActivityHTML(contributionData.recentActivity)}
                    </div>
                </div>

                <!-- Active Repositories -->
                <div class="bg-accent/5 rounded-lg p-6 border border-accent/10">
                    <h3 class="text-accent font-mono text-lg mb-4">Active Repositories</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${generateActiveReposHTML(contributionData.activeRepos)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error fetching GitHub contributions:', error);
        contributionsContent.innerHTML = `
            <div class="text-center py-8 text-accent/60">
                Unable to load contribution data at this time. Please try again later.
            </div>
        `;
    }
}

function processGitHubEvents(events) {
    const data = {
        totalContributions: 0,
        activeRepos: new Set(),
        currentStreak: 0,
        recentActivity: [],
    };

    const today = new Date();
    let lastContributionDate = null;

    events.forEach(event => {
        // Count total contributions
        data.totalContributions++;

        // Track active repositories
        if (event.repo) {
            data.activeRepos.add(event.repo.name);
        }

        // Calculate streak
        const eventDate = new Date(event.created_at);
        if (!lastContributionDate) {
            lastContributionDate = eventDate;
            data.currentStreak = 1;
        } else {
            const dayDiff = Math.floor((lastContributionDate - eventDate) / (1000 * 60 * 60 * 24));
            if (dayDiff <= 1) {
                data.currentStreak++;
            }
            lastContributionDate = eventDate;
        }

        // Track recent activity (last 10 events)
        if (data.recentActivity.length < 10) {
            data.recentActivity.push(event);
        }
    });

    return data;
}

function generateRecentActivityHTML(activities) {
    return activities.map(activity => {
        const date = new Date(activity.created_at);
        const timeAgo = getTimeAgo(date);
        
        return `
            <div class="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                ${getActivityIcon(activity.type)}
                <div class="flex-grow">
                    <p class="text-sm">
                        <span class="text-accent">${formatActivityText(activity)}</span>
                    </p>
                    <p class="text-xs text-accent/60 mt-1">${timeAgo}</p>
                </div>
            </div>
        `;
    }).join('');
}

function generateActiveReposHTML(repos) {
    return Array.from(repos).map(repo => `
        <div class="p-3 rounded-lg hover:bg-accent/10 transition-colors">
            <a href="https://github.com/${repo}" target="_blank" class="text-sm text-accent hover:underline">
                ${repo.split('/')[1]}
            </a>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const iconClass = "w-5 h-5 text-accent";
    const icons = {
        PushEvent: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.53-11.54a.75.75 0 0 0-1.06 0l-2 2a.75.75 0 1 0 1.06 1.06L8 6.06l1.47 1.47a.75.75 0 0 0 1.06-1.06l-2-2z"/>
        </svg>`,
        CreateEvent: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.5-7.5v-3a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
        </svg>`,
        // Add more icons for different event types as needed
    };
    
    return icons[type] || icons.PushEvent;
}

function formatActivityText(activity) {
    switch (activity.type) {
        case 'PushEvent':
            return `Pushed to ${activity.repo.name}`;
        case 'CreateEvent':
            return `Created ${activity.payload.ref_type} in ${activity.repo.name}`;
        case 'IssuesEvent':
            return `${activity.payload.action} issue in ${activity.repo.name}`;
        default:
            return `Activity in ${activity.repo.name}`;
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'just now';
}
