const app = {
    data: null,
    currentDay: 1,
};

const CONFIG = {
    START_DATE: new Date(2026, 4, 21),
    TOTAL_DAYS: 100,
    STORAGE_KEY: 'currentDay',
};

/* ===== Initialize ===== */
document.addEventListener('DOMContentLoaded', async () => {
    await loadContent();
    setupEventListeners();
    restoreDay();
    render();
});

/* ===== Load Content ===== */
async function loadContent() {
    try {
        const response = await fetch('content.json');
        app.data = await response.json();
    } catch (error) {
        console.error('Error loading content:', error);
        document.querySelector('.day-article').innerHTML =
            '<p>Error loading content. Please refresh the page.</p>';
    }
}

/* ===== Day Calculation ===== */
function calculateCurrentDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(CONFIG.START_DATE);
    startDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(daysDiff + 1, CONFIG.TOTAL_DAYS));
}

function getCurrentDay() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        const day = parseInt(stored, 10);
        if (day >= 1 && day <= CONFIG.TOTAL_DAYS) return day;
    }
    return calculateCurrentDay();
}

function setCurrentDay(day) {
    if (day >= 1 && day <= CONFIG.TOTAL_DAYS) {
        app.currentDay = day;
        localStorage.setItem(CONFIG.STORAGE_KEY, day);
    }
}

function restoreDay() {
    app.currentDay = getCurrentDay();
}

function resetToToday() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    app.currentDay = calculateCurrentDay();
    closeDayGrid();
    closeMenu();
    render();
}

/* ===== Navigation ===== */
function goToDay(day) {
    if (day < 1 || day > CONFIG.TOTAL_DAYS) return;
    setCurrentDay(day);
    closeDayGrid();
    closeMenu();
    render();
    window.scrollTo(0, 0);
}

function nextDay() {
    if (app.currentDay < CONFIG.TOTAL_DAYS) {
        goToDay(app.currentDay + 1);
    }
}

function prevDay() {
    if (app.currentDay > 1) {
        goToDay(app.currentDay - 1);
    }
}

/* ===== Day Grid ===== */
function openDayGrid() {
    document.getElementById('dayGrid').classList.add('active');
    document.getElementById('gridOverlay').classList.add('active');
    renderDayGrid();
}

function closeDayGrid() {
    document.getElementById('dayGrid').classList.remove('active');
    document.getElementById('gridOverlay').classList.remove('active');
}

function renderDayGrid() {
    if (!app.data?.sections) return;

    const container = document.getElementById('gridSections');
    container.innerHTML = '';

    app.data.sections.forEach((section) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = `grid-section section-${section.id}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'grid-section-title';
        titleDiv.innerHTML = `
            <div class="grid-section-indicator"></div>
            <span>${section.title}</span>
        `;

        const daysDiv = document.createElement('div');
        daysDiv.className = 'grid-days';

        const [start, end] = section.dayRange;
        for (let day = start; day <= end; day++) {
            const btn = document.createElement('button');
            btn.className = 'day-button';
            if (day === app.currentDay) btn.classList.add('current');
            btn.textContent = day;
            btn.addEventListener('click', () => goToDay(day));
            daysDiv.appendChild(btn);
        }

        sectionDiv.appendChild(titleDiv);
        sectionDiv.appendChild(daysDiv);
        container.appendChild(sectionDiv);
    });
}

/* ===== Menu ===== */
function toggleMenu() {
    document.getElementById('menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function closeMenu() {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

/* ===== Render Recommended Reading ===== */
function renderRecommended(text) {
    const container = document.getElementById('recommended');
    container.innerHTML = '';

    // Map of known books and their links
    const bookMappings = {
        'Brennan Manning - The Ragamuffin Gospel': {
            type: 'pdf',
            icon: '📄',
            title: 'The Ragamuffin Gospel',
            author: 'Brennan Manning',
            url: '/readings/The-Ragamuffin-Gospel-by-Manning-Brennan.pdf',
        },
        'Oyedepo - Satan Get Lost': {
            type: 'pdf',
            icon: '📄',
            title: 'Satan Get Lost',
            author: 'Bishop David Oyedepo',
            url: '/readings/satan get lost - Oyedepo.pdf',
        },
        'Romans': {
            type: 'bible',
            icon: '✝️',
            title: 'Romans',
            author: 'Bible Gateway',
            url: 'https://www.biblegateway.com/passages/search/?search=Romans&version=KJV',
        },
    };

    const mapping = bookMappings[text];

    if (mapping) {
        const link = document.createElement('a');
        link.href = mapping.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'reading-link';

        link.innerHTML = `
            <div class="reading-link-icon">${mapping.icon}</div>
            <div class="reading-link-content">
                <div class="reading-link-title">${mapping.title}</div>
                <div class="reading-link-meta">${mapping.author}</div>
            </div>
        `;

        container.appendChild(link);
    } else {
        // Fallback for unknown recommendations
        container.textContent = text;
    }
}

/* ===== Render ===== */
function render() {
    if (!app.data?.days) return;

    const dayData = app.data.days[app.currentDay.toString()];
    if (!dayData) return;

    // Update header
    document.getElementById('dayNumber').textContent = app.currentDay;

    // Update progress arc
    const progressPercent = (app.currentDay / CONFIG.TOTAL_DAYS) * 100;
    document.querySelector('.arc-progress').style.width = progressPercent + '%';
    document.querySelector('.arc-dot').setAttribute('cx', progressPercent);

    // Update article
    document.getElementById('dayTitle').textContent = dayData.title;

    // Main scripture
    document.querySelector('.scripture').textContent = dayData.mainScripture || '';

    // Supporting scriptures
    const supportingContainer = document.getElementById('supportingScriptures');
    supportingContainer.innerHTML = '';

    if (dayData.supportingScriptures && Array.isArray(dayData.supportingScriptures)) {
        if (dayData.supportingScriptures.length > 0) {
            dayData.supportingScriptures.forEach((scripture) => {
                const div = document.createElement('div');
                div.textContent = scripture;
                supportingContainer.appendChild(div);
            });
            document.getElementById('supportingSection').classList.remove('empty');
        } else {
            document.getElementById('supportingSection').classList.add('empty');
        }
    }

    // Reality
    document.getElementById('reality').textContent = dayData.reality || '';

    // Important
    document.getElementById('important').textContent = dayData.important || '';

    // Recommended
    if (dayData.recommended) {
        renderRecommended(dayData.recommended);
        document.getElementById('recommendedSection').style.display = 'block';
    } else {
        document.getElementById('recommendedSection').style.display = 'none';
    }

    // Navigation buttons
    document.getElementById('prevButton').disabled = app.currentDay === 1;
    document.getElementById('nextButton').disabled = app.currentDay === CONFIG.TOTAL_DAYS;
}

/* ===== Event Listeners ===== */
function setupEventListeners() {
    // Navigation
    document.getElementById('prevButton').addEventListener('click', prevDay);
    document.getElementById('nextButton').addEventListener('click', nextDay);

    // Timeline
    document.getElementById('timelineButton').addEventListener('click', openDayGrid);
    document.getElementById('gridClose').addEventListener('click', closeDayGrid);
    document.getElementById('gridOverlay').addEventListener('click', closeDayGrid);

    // Menu
    document.getElementById('menuToggle').addEventListener('click', toggleMenu);
    document.getElementById('closeMenu').addEventListener('click', closeMenu);
    document.getElementById('overlay').addEventListener('click', closeMenu);
    document.getElementById('resetButton').addEventListener('click', resetToToday);

    // Day input
    document.getElementById('dayInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const day = parseInt(e.target.value, 10);
            if (!isNaN(day)) goToDay(day);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevDay();
        if (e.key === 'ArrowRight') nextDay();
    });
}
