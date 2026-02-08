/**
 * Tech-Image AI - Frontend Script (MongoDB Integrated & UI Optimized)
 */

import { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from './firebase-config.js';

import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Elegant Toast Notifications
 */
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else if (type === 'warning') {
        icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => { toast.remove(); });
    };

    const timeout = setTimeout(removeToast, duration);
    toast.onclick = () => {
        clearTimeout(timeout);
        removeToast();
    };
}


const profileTrigger = document.getElementById('profileTrigger');

// DOM Elements - Navigation
const navLoginBtn = document.getElementById('navLoginBtn');
const navGenerateLink = document.getElementById('navGenerateLink');
const navPricingLink = document.getElementById('navPricingLink');
const logoToHome = document.getElementById('logoToHome');
const getStartedBtn = document.getElementById('getStartedBtn');
const logoutBtn = document.getElementById('logoutBtn');
const customizeProfileLink = document.getElementById('customizeProfileLink');
const viewHistoryLink = document.getElementById('viewHistoryLink');

// DOM Elements - Sections
const landingSection = document.getElementById('landingSection');
const authSection = document.getElementById('authSection');
const generatorSection = document.getElementById('generatorSection');
const customizeSection = document.getElementById('customizeSection');
const historySection = document.getElementById('historySection');

// DOM Elements - User UI
const userProfile = document.getElementById('userProfile');
const userNameDisplay = document.getElementById('userName');
const userPfp = document.getElementById('userPfp');
const settingsPfp = document.getElementById('settingsPfp');

// DOM Elements - Customize Profile
const displayNameInput = document.getElementById('displayNameInput');
const editDisplayNameBtn = document.getElementById('editDisplayNameBtn');
const pfpFileInput = document.getElementById('pfpFileInput');
const pfpUploadBtn = document.getElementById('pfpUploadBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// DOM Elements - History/Settings
const historyList = document.getElementById('historyList');
const aiTrainingToggle = document.getElementById('aiTrainingToggle');
const notificationsToggle = document.getElementById('notificationsToggle');

// DOM Elements - Generator
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const randomPromptBtn = document.getElementById('randomPromptBtn');
const ratioDropdown = document.getElementById('ratioDropdown');
const imageDisplay = document.getElementById('imageDisplay');
const loadingState = document.getElementById('loadingState');
const placeholder = document.getElementById('placeholder');
const downloadContainer = document.getElementById('downloadContainer');
const downloadBtn = document.getElementById('downloadBtn');

// DOM Elements - Loading Features
const topProgressBar = document.getElementById('topProgressBar');
const historyLoading = document.getElementById('historyLoading');

// DOM Elements - Credits & Pricing
const userCreditsDisplay = document.getElementById('userCreditsDropdown');
const navUserCredits = document.getElementById('navUserCredits');
const navCreditsWrapper = document.getElementById('navCredits');
const pricingSection = document.getElementById('pricingSection');
const creditWarningBanner = document.getElementById('creditWarningBanner');
const pricingRedirectBanner = document.getElementById('pricingRedirectBanner');
const usernameWarningBanner = document.getElementById('usernameWarningBanner');

// DOM Elements - Sync Overlay
const syncOverlay = document.getElementById('syncOverlay');
const syncStatusText = document.getElementById('syncStatus');
const syncDetailText = document.getElementById('syncDetail');
const redirectCounter = document.getElementById('redirectCounter');
const countDownSpan = document.getElementById('countDown');
const syncBackHome = document.getElementById('syncBackHome');

// DOM Elements - Admin Panel
const navAdminBtn = document.getElementById('navAdminBtn');
const adminSection = document.getElementById('adminSection');

// DOM Elements - Username Setup
const usernameSetupOverlay = document.getElementById('usernameSetupOverlay');
const usernameSetupInput = document.getElementById('usernameSetupInput');
const usernameSetupStatus = document.getElementById('usernameSetupStatus');
const confirmUsernameBtn = document.getElementById('confirmUsernameBtn');
const usernameDisplayWrapper = document.getElementById('usernameDisplayWrapper');
const usernameSetWrapper = document.getElementById('usernameSetWrapper');
const currentUsernameDisplay = document.getElementById('currentUsernameDisplay');
const usernameInput = document.getElementById('usernameInput');
const usernameStatus = document.getElementById('usernameStatus');
const setUsernameBtn = document.getElementById('setUsernameBtn');

// DOM Elements - Chat Section
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatTyping = document.getElementById('chatTyping');
const navChatLink = document.getElementById('navChatLink');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryBtn = document.getElementById('chatHistoryBtn');
const goToGeneratorBtn = document.getElementById('goToGeneratorBtn');
const chatHistorySidebar = document.getElementById('chatHistorySidebar');
const chatHistoryList = document.getElementById('chatHistoryList');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const generateImageBtn = document.getElementById('generateImageBtn');

// Mobile navigation elements
const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileNavSidebar = document.getElementById('mobileNavSidebar');
const mobileNavClose = document.getElementById('mobileNavClose');
const mobileGenerateLink = document.getElementById('mobileGenerateLink');
const mobileChatLink = document.getElementById('mobileChatLink');
const mobilePricingLink = document.getElementById('mobilePricingLink');
const mobileAdminBtn = document.getElementById('mobileAdminBtn');

let currentImgUrl = null;
let pendingBase64Pfp = null; 
let userCredits = null; 
let isSyncing = true; // Flag for initial load
let pendingGenerator = false; // Flag if user clicked generate while syncing
let adminUsersCache = []; // Store users for admin lookups
let currentUsername = null; // User's username
let currentUserType = 'user'; // 'user' or 'admin'
let isBlocked = false; // Block status
let chatHistory = []; // Store current chat conversation history
let isChatSending = false; // Flag for chat sending state
let allChatSessions = []; // Store all chat sessions
let currentChatId = null; // Current active chat session ID


/**
 * Premium Progress Bar Logic
 */
function startProgress() {
    topProgressBar.classList.remove('finished');
    topProgressBar.classList.add('active');
    topProgressBar.style.width = '30%';
    setTimeout(() => { if (topProgressBar.classList.contains('active')) topProgressBar.style.width = '70%'; }, 500);
}

function finishProgress() {
    topProgressBar.style.width = '100%';
    topProgressBar.classList.remove('active');
    topProgressBar.classList.add('finished');
    setTimeout(() => { topProgressBar.style.width = '0'; }, 1000);
}

/**
 * Section Switcher (exposed globally for inline onclick e.g. Pricing "Return to Home")
 * Now also drives client-side routing (clean URLs) unless invoked from router.
 */
function showSection(sectionId, isRedirected = false, fromRouter = false) {
    // close mobile nav defensively
    if (document.body.classList.contains('mobile-nav-open')) mobileNavClose?.click();
    // ensure any leftover mobile backdrop/sidebar are hidden (prevents click-blocking on small viewports)
    const _backdrop = document.getElementById('mobileNavBackdrop');
    const _sidebar = document.getElementById('mobileNavSidebar');
    if (_backdrop) { _backdrop.classList.remove('visible'); _backdrop.classList.add('hidden'); _backdrop.setAttribute('aria-hidden', 'true'); }
    if (_sidebar) { _sidebar.classList.remove('visible'); _sidebar.classList.add('hidden'); _sidebar.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('mobile-nav-open');
    startProgress();
    [landingSection, authSection, generatorSection, customizeSection, historySection, adminSection, chatSection].forEach(section => {
        if (section) section.classList.add('hidden');
    });

    pricingSection.classList.add('hidden'); // Always hide pricing first

    if (sectionId === 'landing') landingSection.classList.remove('hidden');
    else if (sectionId === 'auth') authSection.classList.remove('hidden');
    else if (sectionId === 'generator') {
        if (isSyncing) {
            pendingGenerator = true;
            showSyncScreen("Syncing Studio", "Please wait while we verify your account credits.", true);
            return;
        }
        // Allow access to generator even with 0 credits
        generatorSection.classList.remove('hidden');
        // Always ensure the credit banner state is handled
        updateCreditsUI();
    }
    else if (sectionId === 'customize') {
        customizeSection.classList.remove('hidden');
        loadProfileData();
    }
    else if (sectionId === 'history') {
        historySection.classList.remove('hidden');
        fetchHistory();
    }
    else if (sectionId === 'pricing') {
        pricingSection.classList.remove('hidden');
        // Handle specialized redirect message
        if (pricingRedirectBanner) {
            if (isRedirected) pricingRedirectBanner.classList.remove('hidden');
            else pricingRedirectBanner.classList.add('hidden');
        }
    }
    else if (sectionId === 'admin') {
        if (currentUserType !== 'admin') {
            alert('Access denied. Admin privileges required.');
            showSection('landing');
            return;
        }
        adminSection.classList.remove('hidden');
        loadAdminData();
    }
    else if (sectionId === 'chat') {
        if (!auth.currentUser) {
            showSection('auth');
            return;
        }
        chatSection.classList.remove('hidden');
        // Load chat history when opening chat section
        loadChatSessions();
        // Focus on input when opening chat
        setTimeout(() => chatInput?.focus(), 300);
    }
    
    // window.scrollTo({ top: 0, behavior: 'smooth' }); // Disabled auto-scroll to top when switching sections per user request
    if (sectionId !== 'history' && sectionId !== 'admin') setTimeout(finishProgress, 400);

    // Update URL for user-driven navigation (router passes fromRouter = true)
    if (!fromRouter) {
        updateBrowserUrlForSection(sectionId);
    }
}
window.showSection = showSection;

/**
 * Map sections to pretty URLs and manage chat IDs in the URL
 */
function getUrlForSection(sectionId) {
    let path = '/home';
    let search = '';

    switch (sectionId) {
        case 'landing':
            path = '/home';
            break;
        case 'auth':
            path = '/auth';
            break;
        case 'generator':
            path = '/image-generations';
            break;
        case 'pricing':
            path = '/pricing';
            break;
        case 'customize':
            path = '/settings';
            break;
        case 'history':
            path = '/history';
            break;
        case 'admin':
            path = '/admin';
            break;
        case 'chat':
            path = '/chat';
            // Ensure we always have a stable ID for the active chat
            if (!currentChatId) {
                currentChatId = Date.now().toString();
            }
            search = `?chat=${encodeURIComponent(currentChatId)}`;
            break;
        default:
            path = '/home';
    }

    return { path, search };
}

function updateBrowserUrlForSection(sectionId) {
    const { path, search } = getUrlForSection(sectionId);
    const newUrl = `${path}${search}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (newUrl === currentUrl) return;

    window.history.pushState(
        { sectionId, chatId: currentChatId || null },
        '',
        newUrl
    );
}

/**
 * Profile Management (MongoDB)
 */
async function loadProfileData() {
    const user = auth.currentUser;
    if (user) {
        if (displayNameInput) displayNameInput.value = "Loading...";
        try {
            const res = await fetch(`/api/user/history/${user.uid}`);
            const data = await res.json();
            
            if (data.success) {
                // Update basic profile info from DB, fallback to Firebase
                const dbName = data.displayName || user.displayName || "";
                const dbPfp = data.photoURL || user.photoURL || null;
                
                if (displayNameInput) displayNameInput.value = dbName;
                pendingBase64Pfp = dbPfp;
                updatePfpUI(dbPfp, dbName);
                
                // Update Credits
                if (data.credits !== undefined) {
                    userCredits = data.credits;
                    updateCreditsUI();
                }

                // Update Username & Admin Status
                if (data.username !== undefined) {
                    currentUsername = data.username;
                    currentUserType = data.userType || 'user';
                    updateUsernameUI();
                }

                // Reset Display Name Edit button state
                if (displayNameInput && editDisplayNameBtn) {
                    displayNameInput.disabled = true;
                    editDisplayNameBtn.classList.remove('active');
                    editDisplayNameBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Change
                    `;
                }
            }
        } catch (e) {
            console.error("Profile load error:", e);
        }
    }
}

pfpUploadBtn.onclick = () => pfpFileInput.click();
pfpFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please keep it under 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        pendingBase64Pfp = reader.result;
        updatePfpUI(reader.result, auth.currentUser.displayName);
    };
    reader.readAsDataURL(file);
};

async function handleSaveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    startProgress();
    const newName = displayNameInput.value.trim();
    const newPfp = pendingBase64Pfp;

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    try {
        // 1. Update Firebase (Name only)
        await updateProfile(user, { displayName: newName });
        
        // 2. Update MongoDB
        console.log(`[UpdateProfile] Sending to MongoDB. Name: ${newName}, CustomPFP: ${!!newPfp}`);
        const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, displayName: newName, photoURL: newPfp })
        });
        
        const data = await res.json();
        console.log(`[UpdateProfile] Response:`, data);
        if (data.success) {
            userNameDisplay.textContent = newName;
            updatePfpUI(newPfp, newName);
            showToast("Profile updated successfully!");
            showSection('generator');
        }
    } catch (e) {
        console.error("Save error:", e);
        alert("Save failed: " + e.message);
    } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save Changes";
        finishProgress();
    }
}

function updatePfpUI(url, name) {
    const initial = name ? name[0].toUpperCase() : "?";
    [userPfp, settingsPfp].forEach(pfpEl => {
        if (!pfpEl) return;
        if (url) {
            pfpEl.style.backgroundImage = `url(${url})`;
            pfpEl.classList.add('has-image');
            pfpEl.innerHTML = "";
        } else {
            pfpEl.style.backgroundImage = 'var(--gradient-luxury)';
            pfpEl.classList.remove('has-image');
            pfpEl.innerHTML = `<span style="color: white; font-weight: bold;">${initial}</span>`;
        }
    });
}

/**
 * Settings & History (MongoDB)
 */
async function fetchHistory() {
    const user = auth.currentUser;
    if (!user) return;

    historyList.classList.add('hidden');
    historyLoading.classList.remove('hidden');

    try {
        const res = await fetch(`/api/user/history/${user.uid}`);
        const data = await res.json();
        
        if (data.success) {
            renderHistory(data.history);
            if (data.settings) {
                aiTrainingToggle.checked = data.settings.aiTraining;
                notificationsToggle.checked = data.settings.notifications;
            }
            if (data.credits !== undefined) {
                userCredits = data.credits;
                updateCreditsUI();
            }
        }
    } catch (e) {
        console.error("History fetch error:", e);
    } finally {
        historyLoading.classList.add('hidden');
        historyList.classList.remove('hidden');
        finishProgress();
    }
}

function renderHistory(history) {
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">Your generation history will appear here.</p>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-content">
                <img src="${item.imageUrl}" class="history-img" alt="Gen Art">
                <div class="history-details">
                    <p class="history-prompt">"${item.prompt}"</p>
                    <span class="history-date">${new Date(item.date).toLocaleString()}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-action-btn view-btn" onclick="openImageModal('${item.imageUrl}')">VIEW FULL</button>
                <a href="${item.imageUrl}" download="tech-image-${Date.now()}.png" class="history-action-btn download-btn">DOWNLOAD</a>
            </div>
        </div>
    `).join('');
}

/**
 * Auth Switcher - Optimized for No Flicker
 */
onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
    if (user) {
        // user is logged in, hide login button and show profile container (initially with gradient)
        navLoginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        
        const tempName = user.displayName || user.email.split('@')[0];
        userNameDisplay.textContent = "Syncing...";
        if (displayNameInput) displayNameInput.value = "Loading...";
        document.getElementById('userEmail').textContent = user.email;
        // Step 1: Immediately show the gradient as fallback
        updatePfpUI(null, tempName);
        updateCreditsUI();

        // Sync with MongoDB to get the uploaded PFP
        try {
            console.log("Syncing with MongoDB for UID:", user.uid);
            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, displayName: user.displayName, photoURL: user.photoURL })
            });
            const data = await res.json();
            console.log("MongoDB sync response:", data);
            
            const finalName = data.user?.displayName || user.displayName || tempName;
            const finalPfp = data.user?.photoURL || user.photoURL; // This would be the base64 from MongoDB
            
            console.log(`[AuthSync] Applying PFP. Source: ${data.user?.photoURL ? 'MongoDB' : 'Firebase'}. Type: ${finalPfp?.startsWith('data:image') ? 'Custom/Base64' : 'External/URL'}`);
            
            userNameDisplay.textContent = finalName;
            if (displayNameInput) displayNameInput.value = finalName;
            pendingBase64Pfp = finalPfp;
            
            // Step 2: Update with the actual PFP once fetched
            updatePfpUI(finalPfp, finalName);

            // Credits Handling
            userCredits = data.user?.credits ?? 5;
            
            // Username & Admin Status
            currentUsername = data.user?.username || null;
            currentUserType = data.user?.userType || 'user';
            isBlocked = data.user?.isBlocked || false;
            console.log("User details applied:", { currentUsername, currentUserType, isBlocked });
            
            // Sync UI states
            updateCreditsUI();
            updateUsernameUI();
            
            // Show/hide admin button
            console.log("Updating admin button visibility. Admin buttons found:", { navAdminBtn: !!navAdminBtn, mobileAdminBtn: !!mobileAdminBtn });
            if (navAdminBtn) {
                if (currentUserType === 'admin') {
                    console.log("Showing navAdminBtn");
                    navAdminBtn.classList.remove('hidden');
                    navAdminBtn.style.display = 'flex'; // Ensure it's not hidden by display property
                } else {
                    navAdminBtn.classList.add('hidden');
                    navAdminBtn.style.display = 'none';
                }
            }
            // Mirror admin visibility to mobile nav
            if (mobileAdminBtn) {
                if (currentUserType === 'admin') {
                    console.log("Showing mobileAdminBtn");
                    mobileAdminBtn.classList.remove('hidden');
                    mobileAdminBtn.style.display = 'block'; // Sidebars usually use block or flex
                } else {
                    mobileAdminBtn.classList.add('hidden');
                    mobileAdminBtn.style.display = 'none';
                }
            }
            
            // Check if user needs to set username (for Google sign-in users)
            if (!currentUsername && usernameSetupOverlay) {
                usernameSetupOverlay.classList.remove('hidden');
            }
            
            // Check if user is blocked
            if (isBlocked) {
                showToast('Your account has been suspended. Please contact support.', 'error', 10000);
                signOut(auth);
                return;
            }
            
            isSyncing = false;
            syncOverlay.classList.add('hidden');
            
            // Auto-continue to generator if user was waiting
            if (pendingGenerator) {
                pendingGenerator = false;
                showSection('generator');
            }
        } catch (e) {
            console.error("Auth sync error:", e);
            userCredits = 5;
            updateCreditsUI();
            isSyncing = false;
            showSyncScreen("Sync Error", "We couldn't reach the cloud engine. Please check your connection.", false);
        }

        if (!authSection.classList.contains('hidden')) showSection('generator');
    } else {
        // User not logged in
        console.log("Handling logout UI");
        navLoginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        navCreditsWrapper.classList.add('hidden');
        pricingSection.classList.add('hidden');
        if (navAdminBtn) navAdminBtn.classList.add('hidden');
        if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
        currentUserType = 'user';
        currentUsername = null;
        pendingBase64Pfp = null;
        isSyncing = false;
        syncOverlay.classList.add('hidden');
        showSection('landing');
    }
});

/**
 * 🔄 Universal Sync Screen Handler
 */
function showSyncScreen(status, detail, isLoading) {
    syncOverlay.classList.remove('hidden');
    syncStatusText.textContent = status;
    syncDetailText.textContent = detail;
    const loader = syncOverlay.querySelector('.premium-loader');
    
    if (isLoading) {
        loader.classList.remove('hidden');
        redirectCounter.classList.add('hidden');
        syncBackHome.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        redirectCounter.classList.remove('hidden');
        syncBackHome.classList.remove('hidden');
        startAutoRedirect();
    }
}

function startAutoRedirect() {
    let count = 3;
    countDownSpan.textContent = count;
    const interval = setInterval(() => {
        count--;
        countDownSpan.textContent = count;
        if (count <= 0) {
            clearInterval(interval);
            showSection('landing');
            syncOverlay.classList.add('hidden');
        }
    }, 1000);
}

syncBackHome.onclick = () => {
    showSection('landing');
    syncOverlay.classList.add('hidden');
};

function updateCreditsUI() {
    // Show loading state if credits haven't been fetched yet
    if (userCredits === null) {
        if (userCreditsDisplay) userCreditsDisplay.textContent = "...";
        if (navUserCredits) navUserCredits.textContent = "...";
    } else {
        const displayCredits = Math.max(0, userCredits);
        if (userCreditsDisplay) userCreditsDisplay.textContent = displayCredits;
        if (navUserCredits) navUserCredits.textContent = displayCredits;
    }
    
    if (auth.currentUser) {
        navCreditsWrapper.classList.remove('hidden');
    } else {
        navCreditsWrapper.classList.add('hidden');
    }

    // Toggle eye-catching warning banner on generator page
    if (creditWarningBanner) {
        if (userCredits !== null && userCredits <= 0 && auth.currentUser) {
            creditWarningBanner.classList.remove('hidden');
        } else {
            creditWarningBanner.classList.add('hidden');
        }
    }

    // Toggle username warning banner
    if (usernameWarningBanner) {
        if (userCredits !== null && !currentUsername && auth.currentUser) {
            usernameWarningBanner.classList.remove('hidden');
        } else {
            usernameWarningBanner.classList.add('hidden');
        }
    }
}

/**
 * Event Listeners
 */
logoToHome.onclick = () => showSection('landing');
navLoginBtn.onclick = () => showSection('auth');
navGenerateLink.onclick = (e) => {
    e.preventDefault();
    if (auth.currentUser) showSection('generator');
    else showSection('auth');
};
navPricingLink.onclick = (e) => {
    e.preventDefault();
    if (auth.currentUser) {
        showSection('pricing');
    } else {
        showSection('auth');
    }
};
customizeProfileLink.onclick = (e) => { e.preventDefault(); showSection('customize'); };
viewHistoryLink.onclick = (e) => { e.preventDefault(); showSection('history'); };
logoutBtn.onclick = (e) => { e.preventDefault(); signOut(auth); };

// Main CTA buttons - Chat with AI (primary) and Generate Image (secondary)
getStartedBtn.onclick = () => auth.currentUser ? showSection('chat') : showSection('auth');

if (generateImageBtn) {
    generateImageBtn.onclick = () => auth.currentUser ? showSection('generator') : showSection('auth');
}

// Chat Navigation
if (navChatLink) {
    navChatLink.onclick = (e) => {
        e.preventDefault();
        if (auth.currentUser) showSection('chat');
        else showSection('auth');
    };
}

// Profile Dropdown Toggle
if (profileTrigger && userProfile) {
    profileTrigger.onclick = (e) => {
        e.stopPropagation();
        userProfile.classList.toggle('open');
    };
}

// Global click to close dropdowns
document.addEventListener('click', (e) => {
    // Close profile dropdown if clicking outside
    if (userProfile && !userProfile.contains(e.target)) {
        userProfile.classList.remove('open');
    }
    
    // Close other dropdowns
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
});

// Chat Header Action Buttons
if (newChatBtn) {
    newChatBtn.onclick = () => {
        startNewChat();
        // Update URL to reflect new chat session ID
        updateBrowserUrlForSection('chat');
    };
}

// Mobile nav toggle logic
const _hamburgerSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
const _closeSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
if (mobileNavToggle) {
    if (!mobileNavToggle.innerHTML.trim()) mobileNavToggle.innerHTML = _hamburgerSvg;
    mobileNavToggle.style.cursor = 'pointer';
    
    // Helper to close menu
    window.closeMobileMenu = () => {
        mobileNavSidebar?.classList.remove('visible');
        mobileNavSidebar?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-nav-open');
        mobileNavToggle.classList.remove('open');
        mobileNavToggle.innerHTML = _hamburgerSvg; // Always stay hamburger
        
        if (mobileNavBackdrop) {
            mobileNavBackdrop.classList.remove('visible');
        }
        
        setTimeout(() => {
            if (mobileNavSidebar && !mobileNavSidebar.classList.contains('visible')) {
                mobileNavSidebar.classList.add('hidden');
                mobileNavBackdrop?.classList.add('hidden');
            }
        }, 300);
    };

    mobileNavToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!mobileNavSidebar) return;

        const isOpening = !mobileNavSidebar.classList.contains('visible');
        
        if (isOpening) {
            mobileNavSidebar.classList.remove('hidden');
            void mobileNavSidebar.offsetWidth; 
            mobileNavSidebar.classList.add('visible');
            mobileNavSidebar.setAttribute('aria-hidden', 'false');
            document.body.classList.add('mobile-nav-open');
            mobileNavToggle.classList.add('open');
            // Removed: mobileNavToggle.innerHTML = _closeSvg; // Keep hamburger icon as requested
            
            if (mobileNavBackdrop) {
                mobileNavBackdrop.classList.remove('hidden');
                void mobileNavBackdrop.offsetWidth;
                mobileNavBackdrop.classList.add('visible');
            }
        } else {
            closeMobileMenu();
        }
    });
}
if (mobileNavClose) {
    mobileNavClose.onclick = () => closeMobileMenu();
}

// Close mobile nav when clicking links
if (mobileGenerateLink) mobileGenerateLink.onclick = (e) => { e.preventDefault(); closeMobileMenu(); showSection('generator'); };
if (mobileChatLink) mobileChatLink.onclick = (e) => { e.preventDefault(); closeMobileMenu(); showSection('chat'); };
if (mobilePricingLink) mobilePricingLink.onclick = (e) => { e.preventDefault(); closeMobileMenu(); showSection('pricing'); };
if (mobileAdminBtn) mobileAdminBtn.onclick = (e) => { e.preventDefault(); closeMobileMenu(); showSection('admin'); };

// Backdrop handling: get element if present
const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

// Close on outside click, including backdrop
document.addEventListener('click', (e) => {
    if (!mobileNavSidebar) return;
    if (document.body.classList.contains('mobile-nav-open')) {
        if (mobileNavBackdrop && e.target === mobileNavBackdrop) {
            console.log('Backdrop clicked - closing mobile nav');
            mobileNavClose?.click();
            return;
        }
        if (!e.target.closest('#mobileNavSidebar') && !e.target.closest('#mobileNavToggle')) {
            console.log('Click outside mobile nav - closing');
            mobileNavSidebar.classList.add('hidden');
            mobileNavSidebar.classList.remove('visible');
            mobileNavSidebar.setAttribute('aria-hidden', 'true');
            mobileNavBackdrop?.classList.remove('visible');
            mobileNavBackdrop?.classList.add('hidden');
            document.body.classList.remove('mobile-nav-open');
            // restore hamburger icon
            if (mobileNavToggle) {
                mobileNavToggle.classList.remove('open');
                mobileNavToggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
                mobileNavToggle.setAttribute('aria-label', 'Open menu');
            }
        }
    }
});

document.addEventListener('keyup', (e) => { if (e.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) { mobileNavClose?.click(); } });

// Mobile navigation initialized above - removing redundant wrapper to fix sluggishness.

if (chatHistoryBtn) {
    chatHistoryBtn.onclick = () => {
        toggleChatHistorySidebar();
    };
}

if (goToGeneratorBtn) {
    goToGeneratorBtn.onclick = () => {
        showSection('generator');
    };
}

if (closeSidebarBtn) {
    closeSidebarBtn.onclick = () => {
        chatHistorySidebar.classList.add('hidden');
        chatHistorySidebar.classList.remove('visible');
        document.body.classList.remove('chat-sidebar-open');
    };
}

// Collapse button (small chevron) - closes sidebar when clicked
const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
if (collapseSidebarBtn) {
    collapseSidebarBtn.onclick = (e) => {
        e.stopPropagation();
        chatHistorySidebar.classList.add('hidden');
        chatHistorySidebar.classList.remove('visible');
        document.body.classList.remove('chat-sidebar-open');
    };
}

// Make header clickable: click the bar (not the buttons) to close the sidebar
const chatSidebarHeader = document.getElementById('chatSidebarHeader');
if (chatSidebarHeader) {
    chatSidebarHeader.addEventListener('click', (e) => {
        // ignore clicks on buttons inside the header
        if (e.target.closest('button')) return;
        // close/toggle
        if (!chatHistorySidebar.classList.contains('hidden')) {
            chatHistorySidebar.classList.add('hidden');
            chatHistorySidebar.classList.remove('visible');
            document.body.classList.remove('chat-sidebar-open');
        }
    });
}


/**
 * Custom Dropdown Logic
 */
function initCustomDropdown(dropdown) {
    const selected = dropdown.querySelector('.dropdown-selected');
    const options = dropdown.querySelector('.dropdown-options');
    const optionItems = dropdown.querySelectorAll('.dropdown-option');

    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
    });

    optionItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            const text = item.textContent;

            // Update UI
            selected.textContent = text;
            selected.setAttribute('data-value', value);
            
            optionItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');

            dropdown.classList.remove('open');
        });
    });
}

// Initialize ratio dropdown only
initCustomDropdown(ratioDropdown);

if (editDisplayNameBtn) {
    editDisplayNameBtn.onclick = () => {
        const isCurrentlyDisabled = displayNameInput.disabled;
        if (isCurrentlyDisabled) {
            displayNameInput.disabled = false;
            displayNameInput.focus();
            editDisplayNameBtn.classList.add('active');
            editDisplayNameBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Editing...
            `;
        } else {
            displayNameInput.disabled = true;
            editDisplayNameBtn.classList.remove('active');
            editDisplayNameBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Change
            `;
        }
    };
}

saveProfileBtn.onclick = handleSaveProfile;

const samplePrompts = [
    "A cyberpunk street in Tokyo, neon signs, rainy night, cinematic lighting, 8k resolution",
    "A majestic dragon made of emerald scales, flying over a crystal lake, epic fantasy art",
    "Portrait of an ancient wizard with a beard made of stars, glowing eyes, mystical atmosphere",
    "A futuristic solarpunk city with lush greenery, white sleek architecture, flying transit pods",
    "Abstract oil painting of a cosmic nebula, vibrant colors, thick brush strokes, gallery quality",
    "A tiny mouse wearing a knight's armor and holding a needle sword, guarding a piece of cheese",
    "Hyper-realistic photograph of a mountain range reflected in a still lake at golden hour",
    "Retro-futuristic 1950s flying car cruising through a desert landscape, synthwave colors",
    "An intricate steampunk watch mechanism, brass gears, steam venting, macro photography",
    "A serene zen garden on a floating island in the clouds, cherry blossoms falling",
    "Post-apocalyptic library reclaimed by nature, sunlight through broken roof, trees growing between shelves",
    "A giant whale swimming through a sea of clouds, bioluminescent skin, starry night sky",
    "An explorer standing at the edge of a massive crystalline cave, vibrant refractions, cinematic scale",
    "Van Gogh style painting of a futuristic Martian colony, swirling red clouds, expressive strokes"
];

randomPromptBtn.onclick = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    const newPrompt = samplePrompts[randomIndex];
    
    // Animate the text injection
    promptInput.value = "";
    let i = 0;
    const typeWriter = () => {
        if (i < newPrompt.length) {
            promptInput.value += newPrompt.charAt(i);
            i++;
            setTimeout(typeWriter, 15);
        }
    };
    typeWriter();

    // Subtle feedback
    randomPromptBtn.style.transform = "scale(0.9)";
    setTimeout(() => randomPromptBtn.style.transform = "scale(1)", 100);
};

const googleLoginBtnElem = document.getElementById('googleLoginBtn');
if (googleLoginBtnElem) {
    googleLoginBtnElem.onclick = async () => {
        try { await signInWithPopup(auth, googleProvider); } catch (e) { alert("Login failed"); }
    };
}

// Settings Update
[aiTrainingToggle, notificationsToggle].forEach(toggle => {
    if (toggle) {
        toggle.onchange = async () => {
            if (auth.currentUser) {
                await fetch('/api/user/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: auth.currentUser.uid,
                        settings: {
                            aiTraining: aiTrainingToggle.checked,
                            notifications: notificationsToggle.checked
                        }
                    })
                });
            }
        };
    }
});

/**
 * Generator
 */
async function generate() {
    if (userCredits <= 0) {
        showSection('pricing', true); // True = Show redirect message
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) return promptInput.focus();

    // Default high-quality model as model selection is removed
    const selectedModel = "black-forest-labs/flux.2-max";
    const selectedRatio = ratioDropdown.querySelector('.dropdown-selected').getAttribute('data-value');

    placeholder.classList.add('hidden');
    imageDisplay.classList.add('hidden');
    downloadContainer.classList.add('hidden');
    loadingState.classList.remove('hidden');
    generateBtn.disabled = true;
    startProgress();

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt, 
                userId: auth.currentUser?.uid,
                model: selectedModel,
                ratio: selectedRatio
            })
        });
        const data = await res.json();
        
        if (data.success) {
            // Success: update local credit from server response
            if (data.credits !== undefined) {
                userCredits = data.credits;
                updateCreditsUI();
            }

            currentImgUrl = data.imageUrl;
            imageDisplay.innerHTML = `<img src="${data.imageUrl}" alt="Gen">`;
            loadingState.classList.add('hidden');
            imageDisplay.classList.remove('hidden');
            downloadContainer.classList.remove('hidden');
            
            // Auto-refresh history if current section is History
            if (!historySection.classList.contains('hidden')) fetchHistory();
        } else {
            if (data.error === 'Insufficient credits') {
                userCredits = 0;
                updateCreditsUI();
                showSection('pricing');
                return;
            }
            throw new Error(data.error);
        }
    } catch (e) {
        if (e.message !== 'Insufficient credits') {
            showToast("Error: " + e.message, 'error');
        }
        loadingState.classList.add('hidden');
        placeholder.classList.remove('hidden');
    } finally {
        generateBtn.disabled = false;
        finishProgress();
    }
}

if (generateBtn) generateBtn.onclick = generate;
if (promptInput) promptInput.onkeypress = (e) => { if (e.key === 'Enter') generate(); };
if (downloadBtn) {
    downloadBtn.onclick = () => {
        if (!currentImgUrl) return;
        const a = document.createElement('a');
        a.href = currentImgUrl;
        a.download = `tech-image-${Date.now()}.png`;
        a.target = '_blank';
        a.click();
    };
}

// Pricing Demo Logic
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = () => {
        const plan = btn.getAttribute('data-plan');
        showToast(`Enterprise Notice: You selected the ${plan} Plan! Sorry, we haven't included an actual payment method yet. This website is a professional demo project.`, 'warning', 6000);
    };
});

// ==================== ADMIN PANEL ====================

/**
 * Admin Panel Button Click
 */
if (navAdminBtn) {
    navAdminBtn.onclick = () => showSection('admin');
}

/**
 * Load Admin Dashboard Data
 */
async function loadAdminData() {
    if (!auth.currentUser || currentUserType !== 'admin') return;
    
    try {
        // SECURITY FIX: Use ID Token for authentication
        const idToken = await auth.currentUser.getIdToken();
        const statsRes = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        console.log('Admin stats response status:', statsRes.status);
        let statsData = {};
        try { statsData = await statsRes.json(); } catch(e){ console.error('Failed to parse admin stats JSON', e); }
        console.log('Admin stats payload:', statsData);
        
        if (!statsRes.ok) {
            // Provide a clear UI hint when unauthorized or server returned an error
            const err = statsData?.error || statsRes.statusText || 'Unknown error';
            console.error('Admin stats error:', err);
            // Try a dev-only debug endpoint as a fallback to get counts directly from DB
            try {
                const dbg = await fetch('/api/debug/users');
                if (dbg.ok) {
                    const dbgData = await dbg.json();
                    if (dbgData.success) {
                        console.log('Using debug users fallback for stats', dbgData);
                        document.getElementById('statTotalUsers').textContent = dbgData.totalUsers;
                        const adminsCount = dbgData.users.filter(u => u.userType === 'admin').length;
                        document.getElementById('statTotalAdmins').textContent = adminsCount;
                        document.getElementById('statBlockedUsers').textContent = 'N/A';
                        document.getElementById('statTotalCredits').textContent = 'N/A';
                        // populate users list UI as well (basic)
                        const usersListEl = document.getElementById('adminUsersList');
                        if (usersListEl) {
                            usersListEl.innerHTML = dbgData.users.map(user => `
                                <div class="user-row ${user.isBlocked ? 'blocked' : ''}" data-uid="${user.firebaseUid}">
                                    <div class="user-row-info">
                                        <div class="user-row-avatar">${user.displayName?.[0]?.toUpperCase() || '?'}</div>
                                        <div class="user-row-details">
                                            <div class="user-row-name">${user.displayName || 'Unknown'}</div>
                                            <div class="user-row-username">${user.username || 'No username'}</div>
                                            <div class="user-row-meta">
                                                <span>Type: ${user.userType || 'user'}</span>
                                                <span>UID: ${user.firebaseUid}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                        }
                        // We used the fallback so return early
                        await loadAdminUsers();
                        finishProgress();
                        return;
                    }
                }
            } catch (e) {
                console.error('Debug fallback failed', e);
            }

            // Try public localhost-only endpoint as a final fallback
            try {
                const pub = await fetch('/api/public/users/count');
                if (pub.ok) {
                    const pubData = await pub.json();
                    if (pubData.success) {
                        console.log('Using public users count fallback', pubData);
                        document.getElementById('statTotalUsers').textContent = pubData.totalUsers;
                        document.getElementById('statTotalAdmins').textContent = 'N/A';
                        document.getElementById('statBlockedUsers').textContent = 'N/A';
                        document.getElementById('statTotalCredits').textContent = 'N/A';
                        await loadAdminUsers();
                        finishProgress();
                        return;
                    }
                }
            } catch (e) {
                console.error('Public count fallback failed', e);
            }

            document.getElementById('statTotalUsers').textContent = 'N/A';
            document.getElementById('statTotalAdmins').textContent = 'N/A';
            document.getElementById('statBlockedUsers').textContent = 'N/A';
            document.getElementById('statTotalCredits').textContent = 'N/A';
            // If authorization issue, suggest re-login
            if (statsRes.status === 401 || statsRes.status === 403) {
                showToast('Admin authentication failed. Please sign out and sign in again.', 'error', 6000);
            }
        } else if (statsData.success) {
            document.getElementById('statTotalUsers').textContent = statsData.stats.totalUsers;
            document.getElementById('statTotalAdmins').textContent = statsData.stats.totalAdmins;
            document.getElementById('statBlockedUsers').textContent = statsData.stats.blockedUsers;
            document.getElementById('statTotalCredits').textContent = statsData.stats.totalCreditsInSystem;
        }
        
        // Load Users
        await loadAdminUsers();
        
        finishProgress();
    } catch (e) {
        console.error('Admin data load error:', e);
        document.getElementById('statTotalUsers').textContent = 'N/A';
        document.getElementById('statTotalAdmins').textContent = 'N/A';
        document.getElementById('statBlockedUsers').textContent = 'N/A';
        document.getElementById('statTotalCredits').textContent = 'N/A';
        finishProgress();
    }
}

/**
 * Load Admin Users List
 */
async function loadAdminUsers() {
    const usersListEl = document.getElementById('adminUsersList');
    if (!usersListEl) return;
    
    usersListEl.innerHTML = '<div class="loading-users">Loading users...</div>';
    
    try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        console.log('Admin users response status:', res.status);
        const data = await res.json();
        
        if (data.success && data.users.length > 0) {
            adminUsersCache = data.users; // Update local cache
            usersListEl.innerHTML = data.users.map(user => `
                <div class="user-row ${user.isBlocked ? 'blocked' : ''}" data-uid="${user.firebaseUid}">
                    <div class="user-row-info">
                        <div class="user-row-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                            ${!user.photoURL ? (user.displayName?.[0]?.toUpperCase() || '?') : ''}
                        </div>
                        <div class="user-row-details">
                            <div class="user-row-name">${user.displayName || 'Unknown'}</div>
                            <div class="user-row-username">${user.username || 'No username'}</div>
                            <div class="user-row-meta">
                                <span>Credits: ${user.credits ?? 5}</span>
                                <span>Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                        </div>
                        <div class="user-row-badges">
                            ${user.isBlocked ? '<span class="badge blocked">Blocked</span>' : ''}
                        </div>
                    </div>
                    <div class="user-row-actions">
                        <button class="action-btn make-admin ${user.userType === 'admin' ? 'is-admin' : ''}" 
                            onclick="adminMakeAdmin('${user.firebaseUid}', '${user.userType === 'admin'}')">
                            ${user.userType === 'admin' ? 'ADMIN' : 'Make Admin'}
                        </button>
                        <button class="action-btn ${user.isBlocked ? 'unblock' : 'block'}" onclick="adminToggleBlock('${user.firebaseUid}', ${!user.isBlocked})">
                            ${user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button class="action-btn delete" onclick="adminDeleteUser('${user.firebaseUid}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            // If the admin users endpoint failed or returned empty, try the debug endpoint (dev only)
            if (res.status === 404 || (data && !data.success)) {
                try {
                    const dbg = await fetch('/api/debug/users');
                    if (dbg.ok) {
                        const dbgData = await dbg.json();
                        if (dbgData.success && dbgData.users.length > 0) {
                            adminUsersCache = dbgData.users;
                            usersListEl.innerHTML = dbgData.users.map(user => `
                                <div class="user-row" data-uid="${user.firebaseUid}">
                                    <div class="user-row-info">
                                        <div class="user-row-avatar">${user.displayName?.[0]?.toUpperCase() || '?'}</div>
                                        <div class="user-row-details">
                                            <div class="user-row-name">${user.displayName || 'Unknown'}</div>
                                            <div class="user-row-username">${user.username || 'No username'}</div>
                                            <div class="user-row-meta">
                                                <span>Type: ${user.userType || 'user'}</span>
                                                <span>UID: ${user.firebaseUid}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Debug users fetch failed', e);
                }
            }
            usersListEl.innerHTML = '<div class="loading-users">No users found.</div>';
        }
    } catch (e) {
        usersListEl.innerHTML = '<div class="loading-users">Error loading users.</div>';
    }
}

/**
 * Admin: Toggle Block User
 */
window.adminToggleBlock = async function(targetUid, block) {
    if (!confirm(`Are you sure you want to ${block ? 'block' : 'unblock'} this user?`)) return;
    
    const btn = document.querySelector(`.user-row[data-uid="${targetUid}"] .action-btn.block, .user-row[data-uid="${targetUid}"] .action-btn.unblock`);
    const originalText = btn ? btn.textContent : (block ? 'Block' : 'Unblock');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="loading-spinner-tiny"></span> ${block ? 'Blocking...' : 'Unblocking...'}`;
    }

    try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/user/block', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({ targetUid, block })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`User ${block ? 'blocked' : 'unblocked'} successfully.`);
            loadAdminUsers();
            loadAdminData();
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
};

/**
 * Admin: Delete User
 */
window.adminDeleteUser = async function(targetUid) {
    if (!confirm('Are you sure you want to DELETE this user? This action cannot be undone!')) return;
    if (!confirm('FINAL WARNING: This will permanently delete the user and all their data. Continue?')) return;
    
    const btn = document.querySelector(`.user-row[data-uid="${targetUid}"] .action-btn.delete`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner-tiny"></span> Deleting...';
    }

    try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/user/delete', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({ targetUid })
        });
        const data = await res.json();
        if (data.success) {
            showToast('User deleted successfully.');
            loadAdminUsers();
            loadAdminData();
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete';
        }
    }
};

// Quick Actions Event Handlers
document.getElementById('refreshUsersBtn')?.addEventListener('click', loadAdminUsers);

    document.getElementById('quickAddCreditsBtn')?.addEventListener('click', async (e) => {
    const userInput = document.getElementById('quickActionUserInput')?.value.trim();
    const amount = parseInt(document.getElementById('quickActionCreditsAmount')?.value) || 0;
    if (!userInput || amount <= 0) return showToast('Please enter a valid user and amount.', 'warning');
    
    await adminModifyCredits(userInput, 'add', amount, e.currentTarget);
});

document.getElementById('quickSetCreditsBtn')?.addEventListener('click', async (e) => {
    const userInput = document.getElementById('quickActionUserInput')?.value.trim();
    const amount = parseInt(document.getElementById('quickActionCreditsAmount')?.value) || 0;
    if (!userInput) return showToast('Please enter a valid user.', 'warning');
    
    await adminModifyCredits(userInput, 'set', amount, e.currentTarget);
});

document.getElementById('quickResetCreditsBtn')?.addEventListener('click', async (e) => {
    const userInput = document.getElementById('quickActionUserInput')?.value.trim();
    if (!userInput) return showToast('Please enter a valid user.', 'warning');
    
    await adminModifyCredits(userInput, 'reset', 0, e.currentTarget);
});

async function adminModifyCredits(userInput, action, amount, btnEl = null) {
    let targetUid = userInput;
    const cleanInput = userInput.startsWith('@') ? userInput.substring(1).toLowerCase() : userInput.toLowerCase();
    
    // Check if it's a username or UID in our cached list
    const foundUser = adminUsersCache.find(u => 
        u.firebaseUid === userInput || 
        u.username?.toLowerCase() === cleanInput
    );

    if (foundUser) {
        targetUid = foundUser.firebaseUid;
    } else {
        // If not in cache, and it's not a UID-like string, it's probably a missing username
        if (userInput.length < 25) { // Firebase UIDs are usually around 28 chars
            return showToast(`Error: User "${userInput}" not found. If this is a username, make sure the user has set it up first.`, 'error');
        }
    }
    
    if (!targetUid) return showToast('Invalid User ID or Username', 'error');

    // Loading state for button
    const originalBtnHtml = btnEl ? btnEl.innerHTML : null;
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<span class="loading-spinner-tiny"></span> Processing...';
    }
    
    try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/user/credits', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({ targetUid, action, amount })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Credits updated! New balance: ${data.credits}`);
            loadAdminUsers();
            loadAdminData();
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        if (btnEl && originalBtnHtml) {
            btnEl.disabled = false;
            btnEl.innerHTML = originalBtnHtml;
        }
    }
}

/**
 * Admin: Promote to Admin
 */
window.adminMakeAdmin = async function(targetUid, alreadyAdmin) {
    if (alreadyAdmin === 'true') {
        return showToast('This person is already an admin!', 'warning');
    }
    
    if (!confirm('Are you sure you want to make this user an Admin? This grants full access to the Dashboard!')) return;

    // Find the button that was clicked
    const btn = document.querySelector(`.user-row[data-uid="${targetUid}"] .action-btn.make-admin`);
    const originalText = btn ? btn.textContent : 'Make Admin';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner-tiny"></span> Promoting...';
    }
    
    try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/admin/user/promote', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({ targetUid })
        });
        const data = await res.json();
        if (data.success) {
            showToast('User promoted to Admin successfully.');
            loadAdminUsers();
            loadAdminData();
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
};

// ==================== USERNAME MANAGEMENT ====================

let usernameCheckTimeout = null;

/**
 * Username Setup Overlay - Check Availability as User Types
 */
if (usernameSetupInput) {
    usernameSetupInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        e.target.value = value;
        
        clearTimeout(usernameCheckTimeout);
        
        if (value.length < 3) {
            usernameSetupStatus.textContent = 'Username must be at least 3 characters';
            usernameSetupStatus.className = 'username-status taken';
            confirmUsernameBtn.disabled = true;
            return;
        }
        
        usernameSetupStatus.textContent = 'Checking availability...';
        usernameSetupStatus.className = 'username-status checking';
        
        usernameCheckTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/user/check-username/${value}`);
                const data = await res.json();
                
                if (data.available) {
                    usernameSetupStatus.textContent = '✓ Username is available!';
                    usernameSetupStatus.className = 'username-status available';
                    confirmUsernameBtn.disabled = false;
                } else {
                    usernameSetupStatus.textContent = '✗ Username is already taken';
                    usernameSetupStatus.className = 'username-status taken';
                    confirmUsernameBtn.disabled = true;
                }
            } catch (e) {
                usernameSetupStatus.textContent = 'Error checking availability';
                usernameSetupStatus.className = 'username-status taken';
            }
        }, 500);
    });
}

/**
 * Confirm Username Button
 */
if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener('click', async () => {
        const username = usernameSetupInput.value.trim();
        if (!username || username.length < 3) return;
        
        confirmUsernameBtn.disabled = true;
        confirmUsernameBtn.textContent = 'Setting...';
        
        try {
            const res = await fetch('/api/user/set-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid, username })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUsername = data.username;
                usernameSetupOverlay.classList.add('hidden');
                alert('Username set successfully! Welcome, ' + data.username);
            } else {
                alert('Error: ' + data.error);
                confirmUsernameBtn.disabled = false;
                confirmUsernameBtn.textContent = 'Confirm Username';
            }
        } catch (e) {
            alert('Error: ' + e.message);
            confirmUsernameBtn.disabled = false;
            confirmUsernameBtn.textContent = 'Confirm Username';
        }
    });
}

/**
 * Profile Page Username Input
 */
if (usernameInput) {
    usernameInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        e.target.value = value;
        
        clearTimeout(usernameCheckTimeout);
        
        if (value.length < 3) {
            usernameStatus.textContent = 'Username must be at least 3 characters';
            usernameStatus.className = 'username-status taken';
            setUsernameBtn.disabled = true;
            return;
        }
        
        usernameStatus.textContent = 'Checking...';
        usernameStatus.className = 'username-status checking';
        
        usernameCheckTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/user/check-username/${value}`);
                const data = await res.json();
                
                if (data.available) {
                    usernameStatus.textContent = '✓ Available';
                    usernameStatus.className = 'username-status available';
                    setUsernameBtn.disabled = false;
                } else {
                    usernameStatus.textContent = '✗ Taken';
                    usernameStatus.className = 'username-status taken';
                    setUsernameBtn.disabled = true;
                }
            } catch (e) {
                usernameStatus.textContent = 'Error';
                usernameStatus.className = 'username-status taken';
            }
        }, 500);
    });
}

if (setUsernameBtn) {
    setUsernameBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (!username || username.length < 3) return;
        
        if (!confirm('Are you sure? Your username is PERMANENT and cannot be changed!')) return;
        
        setUsernameBtn.disabled = true;
        setUsernameBtn.textContent = 'Setting...';
        
        try {
            const res = await fetch('/api/user/set-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid, username })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUsername = data.username;
                // Update UI to show locked username
                usernameSetWrapper.classList.add('hidden');
                usernameDisplayWrapper.classList.remove('hidden');
                currentUsernameDisplay.textContent = data.username;
                showToast('Username set successfully!');
            } else {
                showToast('Error: ' + data.error, 'error');
            }
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
        }
        
        setUsernameBtn.disabled = false;
        setUsernameBtn.textContent = 'Set Username';
    });
}

/**
 * Update Profile Page Username Display
 */
function updateUsernameUI() {
    if (currentUsername) {
        // Show locked username with actual username value
        if (usernameDisplayWrapper) usernameDisplayWrapper.classList.remove('hidden');
        if (usernameSetWrapper) usernameSetWrapper.classList.add('hidden');
        if (currentUsernameDisplay) currentUsernameDisplay.textContent = currentUsername;
    } else {
        // Show username input
        if (usernameDisplayWrapper) usernameDisplayWrapper.classList.add('hidden');
        if (usernameSetWrapper) usernameSetWrapper.classList.remove('hidden');
    }
}

// Copy Username Button
const copyUsernameBtn = document.getElementById('copyUsernameBtn');
if (copyUsernameBtn) {
    copyUsernameBtn.addEventListener('click', async () => {
        if (!currentUsername) return;
        
        try {
            await navigator.clipboard.writeText(currentUsername);
            
            // Visual feedback
            const originalText = copyUsernameBtn.innerHTML;
            copyUsernameBtn.classList.add('copied');
            copyUsernameBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
            `;
            
            setTimeout(() => {
                copyUsernameBtn.classList.remove('copied');
                copyUsernameBtn.innerHTML = originalText;
            }, 2000);
        } catch (e) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = currentUsername;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Username copied: ' + currentUsername);
        }
    });
}



// ==================== AI CHAT FUNCTIONALITY ====================

/**
 * Send a message to the AI chatbot
 */
async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || isChatSending) return;
    
    // Clear input and disable button
    chatInput.value = '';
    updateSendButtonState();
    isChatSending = true;
    
    // Remove welcome message if present
    const welcomeEl = chatMessages.querySelector('.chat-welcome');
    if (welcomeEl) welcomeEl.remove();
    
    // Add user message to UI
    addMessageToChat('user', message);
    
    // Show typing indicator
    chatTyping.classList.remove('hidden');
    scrollChatToBottom();
    
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                userId: auth.currentUser?.uid
            })
        });
        
        const data = await res.json();
        
        // Hide typing indicator
        chatTyping.classList.add('hidden');
        
        if (data.success) {
            // Add AI response to UI
            addMessageToChat('ai', data.response);
            
            // Update conversation history
            chatHistory.push({ role: 'user', content: message });
            chatHistory.push({ role: 'assistant', content: data.response });
            
            // Keep history manageable (last 20 messages)
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }
            
            // Auto-save current session to cloud
            await saveChatSession();
        } else {
            addMessageToChat('error', data.error || 'Failed to get a response. Please try again.');
        }
    } catch (error) {
        chatTyping.classList.add('hidden');
        addMessageToChat('error', 'Connection error. Please check your internet and try again.');
        console.error('Chat error:', error);
    } finally {
        isChatSending = false;
        chatInput.focus();
    }
}

/**
 * Add a message to the chat UI
 */
function addMessageToChat(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    // Get user initial for avatar
    const userInitial = auth.currentUser?.displayName?.[0]?.toUpperCase() || 
                       auth.currentUser?.email?.[0]?.toUpperCase() || 'U';
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">${userInitial}</div>
            <div class="message-bubble">${escapeHtml(content)}</div>
        `;
    } else if (type === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <div class="message-bubble">${formatAIResponse(content)}</div>
        `;
    } else if (type === 'error') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <div class="message-bubble">${escapeHtml(content)}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    scrollChatToBottom();
}

/**
 * Format AI response with basic markdown support
 * and cleaner, user-friendly text.
 */
function formatAIResponse(content) {
    // 1. Normalise lines & remove noisy artefacts (` / bullets, headings, extra blank lines)
    const rawLines = String(content || '').split('\n').map(line => line.trimEnd());
    const cleanedLines = [];
    for (let line of rawLines) {
        let trimmed = line.trim();

        // Skip standalone markdown/code/bullet artefacts
        if (trimmed === '' || trimmed === '`' || trimmed === '```' || trimmed === '-' || trimmed === '*' || trimmed === '•') {
            cleanedLines.push('');
            continue;
        }

        // Convert markdown headings like "### Title" -> "**Title**"
        if (/^#{1,6}\s+/.test(trimmed)) {
            const headingText = trimmed.replace(/^#{1,6}\s+/, '').trim();
            // Wrap as bold so it looks like a nice section title
            line = `**${headingText}**`;
            cleanedLines.push(line);
            continue;
        }

        // Drop leading "/" on command-style lines like "/imagine prompt: ..."
        line = line.replace(/^(\s*)\/([A-Za-z])/, '$1$2');

        // Soften markdown table / divider pipes: turn "A | B" into "A — B"
        line = line.replace(/\s*\|\s*/g, ' — ');

        cleanedLines.push(line);
    }

    // Collapse multiple blank lines into a single one
    const collapsedLines = [];
    let lastBlank = false;
    for (const line of cleanedLines) {
        const isBlank = line.trim() === '';
        if (isBlank) {
            if (lastBlank) continue;
            lastBlank = true;
        } else {
            lastBlank = false;
        }
        collapsedLines.push(line);
    }

    const normalisedText = collapsedLines.join('\n').trim();

    // 2. Escape HTML
    let formatted = escapeHtml(normalisedText);

    // 3. Remove any remaining triple backticks
    formatted = formatted.replace(/```/g, '');
    
    // 4. Basic markdown formatting
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Inline code: `code`  (backticks hidden, code styled)
    formatted = formatted.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
    
    // 5. Convert newlines to <br> for display
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Scroll chat to bottom – always snap to latest message
 * similar to common AI chat UIs.
 */
function scrollChatToBottom() {
    // Only scroll if we are in chat section
    if (chatSection.classList.contains('hidden')) return;
    
    setTimeout(() => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

/**
 * Update send button state based on input
 */
function updateSendButtonState() {
    if (sendChatBtn) {
        sendChatBtn.disabled = !chatInput.value.trim() || isChatSending;
    }
}

/**
 * Clear chat history
 */
function clearChat() {
    chatHistory = [];
    chatMessages.innerHTML = `
        <div class="chat-welcome">
            <div class="welcome-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <h3>Hello! I'm your AI Assistant</h3>
            <p>I can help you with creative image prompts, answer questions about AI art, or just chat. What would you like to talk about?</p>
            <div class="quick-prompts">
                <button class="quick-prompt-btn" data-prompt="Suggest a creative image prompt">✨ Creative prompt ideas</button>
                <button class="quick-prompt-btn" data-prompt="What art styles work best with AI?">🎨 Best art styles</button>
                <button class="quick-prompt-btn" data-prompt="Tips for better AI image generation">💡 Generation tips</button>
            </div>
        </div>
    `;
    // Re-attach quick prompt listeners
    attachQuickPromptListeners();
}

/**
 * Attach listeners to quick prompt buttons
 */
function attachQuickPromptListeners() {
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
        btn.onclick = () => {
            const prompt = btn.getAttribute('data-prompt');
            if (prompt) {
                chatInput.value = prompt;
                updateSendButtonState();
                sendChatMessage();
            }
        };
    });
}

/**
 * Auto-grow textarea
 */
function autoGrowTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

// Chat Event Listeners
if (chatInput) {
    chatInput.addEventListener('input', () => {
        updateSendButtonState();
        autoGrowTextarea();
    });
    
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

if (sendChatBtn) {
    sendChatBtn.onclick = sendChatMessage;
}

// Initialize quick prompt listeners
attachQuickPromptListeners();

// Load saved chat sessions on init
loadChatSessions();

/**
 * Start a new chat session
 */
function startNewChat() {
    // Save current chat if it has messages
    if (chatHistory.length > 0) {
        saveChatSession();
    }
    
    // Reset current chat
    currentChatId = Date.now().toString();
    chatHistory = [];
    
    // Reset UI
    chatMessages.innerHTML = `
        <div class="chat-welcome">
            <div class="welcome-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <h3>Hello! I'm your AI Assistant</h3>
            <p>I can help you with creative image prompts, answer questions about AI art, or just chat. What would you like to talk about?</p>
            <div class="quick-prompts">
                <button class="quick-prompt-btn" data-prompt="Suggest a creative image prompt">✨ Creative prompt ideas</button>
                <button class="quick-prompt-btn" data-prompt="What art styles work best with AI?">🎨 Best art styles</button>
                <button class="quick-prompt-btn" data-prompt="Tips for better AI image generation">💡 Generation tips</button>
            </div>
        </div>
    `;
    
    attachQuickPromptListeners();
    chatInput?.focus();
    
    // Close sidebar if open
    if (chatHistorySidebar) {
        chatHistorySidebar.classList.add('hidden');
        chatHistorySidebar.classList.remove('visible');
    }
}

/**
 * Toggle chat history sidebar
 */
async function toggleChatHistorySidebar() {
    if (!chatHistorySidebar) return;
    
    if (chatHistorySidebar.classList.contains('hidden')) {
        chatHistorySidebar.classList.remove('hidden');
        chatHistorySidebar.classList.add('visible');
        document.body.classList.add('chat-sidebar-open');
        showChatHistoryLoading();
        
        // Load from cloud then render
        await loadChatSessions();
        renderChatHistoryList();
        hideChatHistoryLoading();
    } else {
        chatHistorySidebar.classList.remove('visible');
        chatHistorySidebar.classList.add('hidden');
        document.body.classList.remove('chat-sidebar-open');
    }
}

/**
 * Save current chat session to MongoDB
 */
async function saveChatSession() {
    if (chatHistory.length === 0 || !auth.currentUser) return;
    
    const uid = auth.currentUser.uid;
    
    // Get first user message as title
    const firstUserMsg = chatHistory.find(msg => msg.role === 'user');
    const title = firstUserMsg?.content?.substring(0, 50) || 'New Chat';
    
    const session = {
        id: currentChatId || Date.now().toString(),
        title: title + (title.length >= 50 ? '...' : ''),
        messages: chatHistory,
        timestamp: new Date()
    };
    
    try {
        const res = await fetch('/api/user/chats/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, session })
        });
        const data = await res.json();
        if (data.success) {
            allChatSessions = data.chats;
        }
    } catch (e) {
        console.error("Failed to save chat to cloud:", e);
    }
}

/**
 * Load chat sessions from MongoDB
 */
async function loadChatSessions() {
    if (!auth.currentUser) return;
    
    try {
        const res = await fetch(`/api/user/chats/${auth.currentUser.uid}`);
        const data = await res.json();
        if (data.success) {
            allChatSessions = data.chats;
        }
    } catch (e) {
        console.error("Failed to load chats from cloud:", e);
    }
}

/**
 * Show loading skeleton in chat history
 */
function showChatHistoryLoading() {
    const loadingEl = document.getElementById('chatHistoryLoading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
        chatHistoryList.style.display = 'none';
    }
}

/**
 * Hide loading skeleton in chat history
 */
function hideChatHistoryLoading() {
    const loadingEl = document.getElementById('chatHistoryLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
        chatHistoryList.style.display = 'block';
    }
}

/**
 * Toggle chat history menu dropdown
 */
window.toggleChatMenu = function(event, sessionId) {
    event.stopPropagation();
    const dropdown = document.querySelector(`.chat-menu-dropdown[data-session-id="${sessionId}"]`);
    if (!dropdown) return;
    
    // Close all other dropdowns
    document.querySelectorAll('.chat-menu-dropdown.show').forEach(el => {
        if (el !== dropdown) el.classList.remove('show');
    });
    
    dropdown.classList.toggle('show');
};

/**
 * Delete a chat session
 */
window.deleteChatSession = async function(sessionId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    if (!auth.currentUser) return;
    
    try {
        const res = await fetch('/api/user/chats/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: auth.currentUser.uid, sessionId })
        });
        const data = await res.json();
        
        if (data.success) {
            allChatSessions = data.chats;
            
            // If deleted chat was active, start a new chat
            if (currentChatId === sessionId) {
                startNewChat();
            }
            
            renderChatHistoryList();
        }
    } catch (e) {
        alert('Error deleting chat: ' + e.message);
    }
};

// Close dropdowns when clicking elsewhere
document.addEventListener('click', () => {
    document.querySelectorAll('.chat-menu-dropdown.show').forEach(el => {
        el.classList.remove('show');
    });
});

/**
 * Render chat history list in sidebar
 */
function renderChatHistoryList() {
    if (!chatHistoryList) return;
    
    if (allChatSessions.length === 0) {
        chatHistoryList.innerHTML = '<p class="empty-history-msg">No saved chats yet. Start a conversation!</p>';
        chatHistoryList.style.display = 'block';
        return;
    }
    
    chatHistoryList.innerHTML = allChatSessions.map(session => `
        <div class="chat-history-item ${session.id === currentChatId ? 'active' : ''}" data-session-id="${session.id}">
            <div class="chat-history-content" onclick="loadChatSession('${session.id}')">
                <h4>${escapeHtml(session.title)}</h4>
                <span>${new Date(session.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="chat-history-menu">
                <button class="chat-menu-btn" onclick="toggleChatMenu(event, '${session.id}')">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                    </svg>
                </button>
                <div class="chat-menu-dropdown" data-session-id="${session.id}">
                    <button class="delete-btn" onclick="deleteChatSession('${session.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
    
    chatHistoryList.style.display = 'block';
}

/**
 * Load a specific chat session
 */
function loadChatSession(sessionId) {
    const session = allChatSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Save current chat first if has messages
    if (chatHistory.length > 0 && currentChatId !== sessionId) {
        saveChatSession();
    }
    
    // Load selected session
    currentChatId = session.id;
    chatHistory = session.messages || [];
    // Sync URL with selected chat
    updateBrowserUrlForSection('chat');
    
    // Rebuild chat UI
    chatMessages.innerHTML = '';
    chatHistory.forEach(msg => {
        if (msg.role === 'user') {
            addMessageToChat('user', msg.content);
        } else if (msg.role === 'assistant') {
            addMessageToChat('ai', msg.content);
        }
    });
    
    // Close sidebar
    if (chatHistorySidebar) {
        chatHistorySidebar.classList.add('hidden');
        chatHistorySidebar.classList.remove('visible');
    }
    
    scrollChatToBottom();
}

// Auto-save chat when sending messages (update the sendChatMessage to save)
const originalSendChatMessage = sendChatMessage;

/**
 * Simple client-side routing so each section has a clean URL.
 * Supports:
 * - /home                -> landing
 * - /image-generations   -> generator
 * - /chat?chat=<id>      -> chat with specific session
 * - /pricing, /settings, /history, /admin, /auth
 */
function handleRouteChange() {
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search || '');

    // Special handling for chat so we can load the right session
    if (pathname === '/chat') {
        showSection('chat', false, true); // fromRouter = true (no extra pushState)
        
        const chatId = params.get('chat');
        if (chatId) {
            loadChatSessions();
            loadChatSession(chatId);
        }
        return;
    }

    let targetSection = 'landing';

    switch (pathname) {
        case '/':
        case '/home':
            targetSection = 'landing';
            break;
        case '/auth':
            targetSection = 'auth';
            break;
        case '/image-generations':
        case '/generate':
            targetSection = 'generator';
            break;
        case '/pricing':
            targetSection = 'pricing';
            break;
        case '/settings':
            targetSection = 'customize';
            break;
        case '/history':
            targetSection = 'history';
            break;
        case '/admin':
            targetSection = 'admin';
            break;
        default:
            targetSection = 'landing';
    }

    showSection(targetSection, false, true); // fromRouter = true
}

// Back/forward buttons
window.addEventListener('popstate', handleRouteChange);

// Initial load
handleRouteChange();

/**
 * Scroll effect for Chat "Generate Image" button on mobile
 * Hides the floating button when user scrolls down to keep UI clean
 */
window.addEventListener('scroll', () => {
    // Only apply on mobile where the button is fixed/floating
    if (window.innerWidth > 768) return;
    
    const btn = document.getElementById('goToGeneratorBtn');
    const chat = document.getElementById('chatSection');
    
    if (!btn || !chat || chat.classList.contains('hidden')) return;

    // Detect scroll distance
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 30) {
        btn.classList.add('scrolled');
    } else {
        btn.classList.remove('scrolled');
    }
}, { passive: true });

// ==================== IMAGE MODAL ====================
window.openImageModal = (url) => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modalImg.src = url;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.closeImageModal = () => {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageModal();
});

