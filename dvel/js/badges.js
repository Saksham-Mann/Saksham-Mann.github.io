/* ==========================================================================
   BADGES.JS — DVEL
   Handles the badges modal logic and authentication mock state
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initBadgesModal();
});

function initBadgesModal() {
    // Inject the modal HTML into the body if it doesn't exist
    if (!document.getElementById("badges-modal-overlay")) {
        const modalHtml = `
            <div id="badges-modal-overlay">
                <div class="badges-modal" role="dialog" aria-modal="true" aria-labelledby="badges-modal-header">
                    <button class="badges-modal-close" id="btn-close-badges"><span class="material-symbols-outlined">close</span></button>
                    <div class="badges-modal-header" id="badges-modal-header">
                        <!-- Content injected by JS -->
                    </div>
                    <div id="badges-modal-content">
                        <!-- Actions or Grid injected here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const overlay = document.getElementById("badges-modal-overlay");
    const closeBtn = document.getElementById("btn-close-badges");

    // Bind navigation badge buttons
    document.querySelectorAll(".nav-badges").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            renderBadgesModal();
            overlay.classList.add("show");
        });
    });

    closeBtn.addEventListener("click", () => overlay.classList.remove("show"));
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("show");
    });
}

function renderBadgesModal() {
    const header = document.getElementById("badges-modal-header");
    const content = document.getElementById("badges-modal-content");

    header.innerHTML = `
        <span class="material-symbols-outlined">workspace_premium</span>
        <h2>Your Badges</h2>
        <p>Complete courses to unlock all achievements.</p>
    `;
    
    // Mock badges data (all locked for demo)
    const badges = [
        { id: 'python', name: 'Python Basics', icon: 'code', earned: false },
        { id: 'html', name: 'Web Builder', icon: 'web', earned: false },
        { id: 'js', name: 'JS Wizard', icon: 'bolt', earned: false },
        { id: 'numpy', name: 'Data Cruncher', icon: 'functions', earned: false },
        { id: 'pandas', name: 'Data Master', icon: 'query_stats', earned: false },
        { id: 'fastapi', name: 'API Architect', icon: 'cloud', earned: false }
    ];

    let gridHtml = '<div class="badges-grid">';
    badges.forEach(b => {
        if (b.earned) {
            gridHtml += `
                <div class="badge-item earned">
                    <span class="material-symbols-outlined">${b.icon}</span>
                    <span class="badge-item-title">${b.name}</span>
                    <span class="badge-item-status">Unlocked</span>
                </div>`;
        } else {
            gridHtml += `
                <div class="badge-item locked">
                    <span class="material-symbols-outlined">lock</span>
                    <span class="badge-item-title">${b.name}</span>
                    <span class="badge-item-status">Locked</span>
                </div>`;
        }
    });
    gridHtml += '</div>';
    
    content.innerHTML = gridHtml;
}
