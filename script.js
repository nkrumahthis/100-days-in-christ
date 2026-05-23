/* ===== Application State ===== */
const app = {
    data: null,
    currentDay: 1,
    daysPerPage: 1,
};

/* ===== Configuration ===== */
const CONFIG = {
    START_DATE: new Date(2026, 4, 20), // May 20, 2026 (month is 0-indexed)
    TOTAL_DAYS: 100,
    CONTENT_FILE: 'content.json',
    STORAGE_KEY: 'currentDay',
};

/* ===== DOM Elements ===== */
const dom = {
    dayNumber: document.getElementById('dayNumber'),
    dayTitle: document.getElementById('dayTitle'),
    sectionTitle: document.getElementById('sectionTitle'),
    sectionDescription: document.getElementById('sectionDescription'),
    mainScripture: document.getElementById('mainScripture'),
    supportingScriptures: document.getElementById('supportingScriptures'),
    reality: document.getElementById('reality'),
    important: document.getElementById('important'),
    recommended: document.getElementById('recommended'),
    recommendedBlock: document.getElementById('recommendedBlock'),
    prevButton: document.getElementById('prevButton'),
    nextButton: document.getElementById('nextButton'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    closeMenu: document.getElementById('closeMenu'),
    sectionsList: document.getElementById('sectionsList'),
    dayJump: document.getElementById('dayJump'),
    resetButton: document.getElementById('resetButton'),
    scheduleCurrentDay: document.getElementById('scheduleCurrentDay'),
    dayContent: document.getElementById('dayContent'),
    sectionHeader: document.getElementById('sectionHeader'),
};

/* ===== Initialize Application ===== */
async function init() {
    await loadContent();
    setupEventListeners();
    restoreDayFromStorage();
    render();
}

/* ===== Load Content from JSON ===== */
async function loadContent() {
    try {
        const response = await fetch(CONFIG.CONTENT_FILE);
        if (!response.ok) {
            throw new Error(`Failed to load content: ${response.status}`);
        }
        app.data = await response.json();
    } catch (error) {
        console.error('Error loading content:', error);
        dom.dayContent.innerHTML = '<p>Error loading content. Please refresh the page.</p>';
    }
}

/* ===== Day Calculation ===== */
function calculateCurrentDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(CONFIG.START_DATE);
    startDate.setHours(0, 0, 0, 0);

    const timeDiff = today - startDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Day 1 starts on the start date, so add 1
    let calculatedDay = Math.max(1, daysDiff + 1);

    // Cap at total days
    calculatedDay = Math.min(calculatedDay, CONFIG.TOTAL_DAYS);

    return calculatedDay;
}

/* ===== LocalStorage Management ===== */
function getCurrentDay() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        const day = parseInt(stored, 10);
        if (day >= 1 && day <= CONFIG.TOTAL_DAYS) {
            return day;
        }
    }
    return calculateCurrentDay();
}

function setCurrentDay(day) {
    if (day >= 1 && day <= CONFIG.TOTAL_DAYS) {
        app.currentDay = day;
        localStorage.setItem(CONFIG.STORAGE_KEY, day);
    }
}

function restoreDayFromStorage() {
    app.currentDay = getCurrentDay();
}

function resetToToday() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    app.currentDay = calculateCurrentDay();
    render();
}

/* ===== Get Section Data ===== */
function getSectionForDay(dayNumber) {
    if (!app.data || !app.data.sections) return null;

    for (const section of app.data.sections) {
        const [start, end] = section.dayRange;
        if (dayNumber >= start && dayNumber <= end) {
            return section;
        }
    }
    return null;
}

/* ===== Navigation ===== */
function goToDay(dayNumber) {
    if (dayNumber < 1 || dayNumber > CONFIG.TOTAL_DAYS) return;

    setCurrentDay(dayNumber);
    closeMenu();
    render();
    document.querySelector('.day-content').scrollIntoView({ behavior: 'smooth' });
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

/* ===== Menu Management ===== */
function toggleMenu() {
    dom.sidebar.classList.toggle('active');
    dom.overlay.classList.toggle('active');
}

function closeMenu() {
    dom.sidebar.classList.remove('active');
    dom.overlay.classList.remove('active');
}

function setupMenuToggle() {
    dom.menuToggle.addEventListener('click', toggleMenu);
    dom.closeMenu.addEventListener('click', closeMenu);
    dom.overlay.addEventListener('click', closeMenu);

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

/* ===== Render Content ===== */
function render() {
    if (!app.data || !app.data.days) return;

    const dayData = app.data.days[app.currentDay.toString()];
    if (!dayData) {
        dom.dayContent.innerHTML = '<p>Day not found.</p>';
        return;
    }

    const section = getSectionForDay(app.currentDay);
    if (!section) {
        dom.dayContent.innerHTML = '<p>Section not found.</p>';
        return;
    }

    // Update section header colors
    const sectionColor = section.bgColor || '#f8fafc';
    const textColor = section.textColor || '#0d47a1';
    dom.sectionHeader.style.backgroundColor = sectionColor;
    dom.sectionTitle.style.color = textColor;
    dom.sectionDescription.style.color = textColor;

    // Update day display
    dom.dayNumber.textContent = app.currentDay;
    dom.scheduleCurrentDay.textContent = app.currentDay;

    // Update section info
    dom.sectionTitle.textContent = section.title;
    dom.sectionDescription.textContent = section.description;

    // Update day content
    dom.dayTitle.textContent = dayData.title;
    dom.dayTitle.style.color = textColor;

    // Main Scripture
    dom.mainScripture.innerHTML = escapeHtml(dayData.mainScripture);

    // Supporting Scriptures
    dom.supportingScriptures.innerHTML = '';
    if (dayData.supportingScriptures && Array.isArray(dayData.supportingScriptures)) {
        dayData.supportingScriptures.forEach((scripture) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${escapeHtml(scripture.reference)}:</strong> ${escapeHtml(scripture.text)}`;
            dom.supportingScriptures.appendChild(li);
        });
    }

    // Reality to Master
    dom.reality.innerHTML = escapeHtml(dayData.reality);

    // Important
    dom.important.innerHTML = escapeHtml(dayData.important);

    // Recommended Reading
    if (dayData.recommended) {
        dom.recommended.textContent = dayData.recommended;
        dom.recommendedBlock.style.display = 'block';
    } else {
        dom.recommendedBlock.style.display = 'none';
    }

    // Update navigation button states
    dom.prevButton.disabled = app.currentDay === 1;
    dom.nextButton.disabled = app.currentDay === CONFIG.TOTAL_DAYS;

    // Update day jump input
    dom.dayJump.value = '';
    dom.dayJump.placeholder = `Jump to day (1-${CONFIG.TOTAL_DAYS})`;

    // Update sections list
    renderSectionsList();
}

function renderSectionsList() {
    dom.sectionsList.innerHTML = '';

    if (!app.data || !app.data.sections) return;

    app.data.sections.forEach((section) => {
        const div = document.createElement('div');
        div.className = 'section-item';
        if (getSectionForDay(app.currentDay) === section) {
            div.classList.add('active');
        }

        const [start, end] = section.dayRange;
        div.textContent = `${section.title} (Days ${start}-${end})`;

        div.addEventListener('click', () => {
            goToDay(start);
        });

        dom.sectionsList.appendChild(div);
    });
}

/* ===== Event Listeners ===== */
function setupEventListeners() {
    // Navigation
    dom.prevButton.addEventListener('click', prevDay);
    dom.nextButton.addEventListener('click', nextDay);

    // Menu
    setupMenuToggle();

    // Day Jump
    dom.dayJump.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const day = parseInt(dom.dayJump.value, 10);
            if (!isNaN(day)) {
                goToDay(day);
            }
        }
    });

    // Reset Button
    dom.resetButton.addEventListener('click', resetToToday);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevDay();
        } else if (e.key === 'ArrowRight') {
            nextDay();
        }
    });
}

/* ===== Utility Functions ===== */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

/* ===== Start Application ===== */
document.addEventListener('DOMContentLoaded', init);
