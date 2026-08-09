/* ==========================================================================
   AUTH.JS — DVEL
   Handles Firebase Authentication, Modal Injection, and Profile Dropdown
   ========================================================================== */

let isLoginMode = false;

const authHTML = `
<div id="auth-modal-overlay">
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="auth-close" id="btn-auth-close">
            <span class="material-symbols-outlined">close</span>
        </button>
        
        <div class="auth-tabs">
            <button class="auth-tab active" id="tab-signup">Sign Up</button>
            <button class="auth-tab" id="tab-login">Log In</button>
        </div>

        <div class="auth-header">
            <h2 id="auth-title">Create Your Account</h2>
        </div>

        <form id="auth-form">
            <div class="auth-form-grid" id="auth-form-grid">
                <div class="auth-form-group signup-only">
                    <label for="auth-name">Full Name</label>
                    <div class="input-icon-wrapper">
                        <span class="material-symbols-outlined">person</span>
                        <input type="text" id="auth-name" placeholder="Jane Doe" autocomplete="name">
                    </div>
                </div>
                
                <div class="auth-form-group">
                    <label for="auth-email">Email Address</label>
                    <div class="input-icon-wrapper">
                        <span class="material-symbols-outlined">mail</span>
                        <input type="email" id="auth-email" placeholder="jane.doe@email.com" required autocomplete="email">
                    </div>
                </div>

                <div class="auth-form-row">
                    <div class="auth-form-group">
                        <label for="auth-password">Password</label>
                        <div class="input-icon-wrapper">
                            <span class="material-symbols-outlined">lock</span>
                            <input type="password" id="auth-password" placeholder="••••••••" required autocomplete="new-password">
                        </div>
                    </div>
                    
                    <div class="auth-form-group signup-only">
                        <label for="auth-confirm">Confirm Password</label>
                        <div class="input-icon-wrapper">
                            <span class="material-symbols-outlined">lock</span>
                            <input type="password" id="auth-confirm" placeholder="••••••••" autocomplete="new-password">
                        </div>
                    </div>
                </div>
            </div>

            <div id="auth-error" class="auth-error"></div>
            
            <button type="submit" class="auth-btn-submit" id="auth-submit-btn">Sign Up</button>
            
            <div class="auth-divider"><span>or</span></div>
            
            <button type="button" class="auth-btn-google" id="btn-google-auth">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo">
                Continue with Google
            </button>
        </form>
        
        <div class="auth-switch">
            <span id="auth-switch-text">Already have an account?</span>
            <a id="auth-switch-link">Log In</a>
        </div>
    </div>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML('beforeend', authHTML);

    const overlay = document.getElementById("auth-modal-overlay");
    const btnClose = document.getElementById("btn-auth-close");
    const form = document.getElementById("auth-form");
    const switchLink = document.getElementById("auth-switch-link");
    const btnGoogle = document.getElementById("btn-google-auth");
    
    // Tabs
    const tabSignup = document.getElementById("tab-signup");
    const tabLogin = document.getElementById("tab-login");

    // UI Elements
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const switchText = document.getElementById("auth-switch-text");
    const errorEl = document.getElementById("auth-error");
    const signupOnlyFields = document.querySelectorAll(".signup-only");

    window.openAuthModal = (mode = 'signup') => {
        isLoginMode = (mode === 'login');
        errorEl.style.display = 'none';
        form.reset();
        
        if (isLoginMode) {
            tabSignup.classList.remove('active');
            tabLogin.classList.add('active');
            title.textContent = "Welcome Back";
            submitBtn.textContent = "Log In";
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = "Sign Up";
            signupOnlyFields.forEach(el => el.style.display = 'none');
            document.getElementById("auth-name").removeAttribute('required');
            document.getElementById("auth-confirm").removeAttribute('required');
        } else {
            tabLogin.classList.remove('active');
            tabSignup.classList.add('active');
            title.textContent = "Create Your Account";
            submitBtn.textContent = "Sign Up";
            switchText.textContent = "Already have an account?";
            switchLink.textContent = "Log In";
            signupOnlyFields.forEach(el => el.style.display = 'block');
            document.getElementById("auth-name").setAttribute('required', 'true');
            document.getElementById("auth-confirm").setAttribute('required', 'true');
        }
        overlay.classList.add("active");
    };

    window.closeAuthModal = () => {
        overlay.classList.remove("active");
    };

    btnClose.addEventListener("click", window.closeAuthModal);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) window.closeAuthModal();
    });

    tabSignup.addEventListener("click", () => window.openAuthModal('signup'));
    tabLogin.addEventListener("click", () => window.openAuthModal('login'));
    switchLink.addEventListener("click", () => window.openAuthModal(isLoginMode ? 'signup' : 'login'));

    // Handle Email/Password Form Submit
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("auth-name").value;
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const confirm = document.getElementById("auth-confirm").value;
        
        errorEl.style.display = 'none';

        if (!isLoginMode && password !== confirm) {
            errorEl.textContent = "Passwords do not match.";
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        // Simulate network request
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? "Log In" : "Sign Up";
            window.mockUser = {
                displayName: isLoginMode ? "Demo User" : (name || "Demo User"),
                email: email
            };
            window.closeAuthModal();
            updateAuthState();
        }, 800);
    });

    // Handle Google Auth
    btnGoogle.addEventListener("click", () => {
        errorEl.style.display = 'none';
        btnGoogle.innerHTML = `<span class="material-symbols-outlined spin">sync</span> Connecting...`;
        setTimeout(() => {
            btnGoogle.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo"> Continue with Google`;
            window.mockUser = {
                displayName: "Demo User",
                email: "demo@gmail.com"
            };
            window.closeAuthModal();
            updateAuthState();
        }, 800);
    });

    window.logout = () => {
        window.mockUser = null;
        updateAuthState();
    };

    window.mockUser = null; // null means not logged in

    function updateAuthState() {
        const user = window.mockUser;
        const navActions = document.querySelector(".nav-actions");
        if (!navActions) return;

        // Remove existing dynamic auth elements
        const existingAuthTriggers = document.querySelectorAll(".btn-auth-trigger, .nav-profile-container");
        existingAuthTriggers.forEach(el => el.remove());

        if (user) {
            // User is signed in -> Inject Circular Profile Dropdown
            const photoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || "User") + "&background=0D8ABC&color=fff";
            
            const profileHTML = `
                <div class="nav-profile-container" id="nav-profile-container">
                    <button class="nav-profile-btn" id="nav-profile-btn">
                        <img src="${photoUrl}" alt="Profile" class="nav-profile-img">
                    </button>
                    <div class="nav-dropdown" id="nav-dropdown">
                        <div class="nav-dropdown-header">
                            <p class="dropdown-name">${user.displayName}</p>
                            <p class="dropdown-email">${user.email}</p>
                        </div>
                        <div class="nav-dropdown-divider"></div>
                        <a href="#" class="nav-dropdown-item"><span class="material-symbols-outlined">person</span> Profile</a>
                        <a href="#" class="nav-dropdown-item"><span class="material-symbols-outlined">settings</span> Settings</a>
                        <div class="nav-dropdown-divider"></div>
                        <button class="nav-dropdown-item text-danger" onclick="window.logout()"><span class="material-symbols-outlined">logout</span> Log Out</button>
                    </div>
                </div>
            `;
            navActions.insertAdjacentHTML('beforeend', profileHTML);

            // Handle Dropdown Toggle
            const profileBtn = document.getElementById("nav-profile-btn");
            const dropdown = document.getElementById("nav-dropdown");
            
            profileBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdown.classList.toggle("show");
            });

            document.addEventListener("click", (e) => {
                if (dropdown.classList.contains("show") && !e.target.closest("#nav-profile-container")) {
                    dropdown.classList.remove("show");
                }
            });

        } else {
            // No user is signed in -> Inject Sign In / Sign Up Button
            const authBtnHTML = `<button class="btn-nav btn-auth-trigger">Sign Up | Log In</button>`;
            navActions.insertAdjacentHTML('beforeend', authBtnHTML);
            
            document.querySelector(".btn-auth-trigger").onclick = () => window.openAuthModal('signup');
        }
    }

    // Initialize mock state
    updateAuthState();
});
