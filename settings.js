// Settings System
const THEME_STORAGE_KEY = 'phonix_theme';
const THEMES = {
    light: 'light',
    dark: 'dark'
};

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || THEMES.light;
    setTheme(savedTheme);
}

// Set theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Update theme toggle button text
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = theme === THEMES.dark ? '☀️ الوضع النهاري' : '🌙 الوضع الليلي';
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || THEMES.light;
    const newTheme = currentTheme === THEMES.dark ? THEMES.light : THEMES.dark;
    setTheme(newTheme);
}

// Get current theme
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || THEMES.light;
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    
    // Settings menu toggle
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const settingsClose = document.getElementById('settingsClose');
    
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            settingsMenu.style.display = 'flex';
            // Update user info in settings
            updateSettingsUserInfo();
        });
    }
    
    if (settingsClose && settingsMenu) {
        settingsClose.addEventListener('click', function() {
            settingsMenu.style.display = 'none';
        });
    }
    
    // Close settings when clicking outside
    if (settingsMenu) {
        settingsMenu.addEventListener('click', function(e) {
            if (e.target === settingsMenu) {
                settingsMenu.style.display = 'none';
            }
        });
    }
    
    // Theme toggle button
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Logout button in settings
    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
    if (settingsLogoutBtn) {
        settingsLogoutBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                if (typeof logout === 'function') {
                    logout();
                }
            }
        });
    }
    
    // Upload work button (show only for admins)
    const uploadWorkBtn = document.getElementById('uploadWorkBtn');
    const uploadWorkSection = document.getElementById('uploadWorkSection');
    if (uploadWorkSection) {
        if (typeof isAdmin === 'function' && isAdmin()) {
            uploadWorkSection.style.display = 'block';
        } else {
            uploadWorkSection.style.display = 'none';
        }
    }
    
    if (uploadWorkBtn) {
        uploadWorkBtn.addEventListener('click', function() {
            const uploadModal = document.getElementById('uploadWorkModal');
            if (uploadModal) {
                uploadModal.style.display = 'flex';
            }
        });
    }
    
    // Close upload modal
    const uploadModalClose = document.getElementById('uploadModalClose');
    const uploadModalCancel = document.getElementById('uploadModalCancel');
    const uploadWorkModal = document.getElementById('uploadWorkModal');
    
    if (uploadModalClose && uploadWorkModal) {
        uploadModalClose.addEventListener('click', function() {
            uploadWorkModal.style.display = 'none';
        });
    }
    
    if (uploadModalCancel && uploadWorkModal) {
        uploadModalCancel.addEventListener('click', function() {
            uploadWorkModal.style.display = 'none';
        });
    }
    
    // Close upload modal when clicking outside
    if (uploadWorkModal) {
        uploadWorkModal.addEventListener('click', function(e) {
            if (e.target === uploadWorkModal) {
                uploadWorkModal.style.display = 'none';
            }
        });
    }
    
    // Upload work form submission
    const uploadWorkForm = document.getElementById('uploadWorkForm');
    if (uploadWorkForm) {
        uploadWorkForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleWorkUpload();
        });
    }
});

// Update user info in settings menu
function updateSettingsUserInfo() {
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        const usernameDisplay = document.getElementById('settingsUsername');
        const userRoleDisplay = document.getElementById('settingsUserRole');
        
        if (usernameDisplay && user) {
            usernameDisplay.textContent = user.username || 'غير محدد';
        }
        
        if (userRoleDisplay && user) {
            userRoleDisplay.textContent = user.isAdmin ? 'مسؤول' : 'مستخدم';
            userRoleDisplay.style.color = user.isAdmin ? '#e74c3c' : '#3498db';
        }
    }
}

// Handle work upload
function handleWorkUpload() {
    const workTitle = document.getElementById('workTitle').value.trim();
    const workDescription = document.getElementById('workDescription').value.trim();
    const workImage = document.getElementById('workImage').files[0];
    const uploadError = document.getElementById('uploadError');
    const uploadSuccess = document.getElementById('uploadSuccess');
    
    // Hide previous messages
    if (uploadError) uploadError.style.display = 'none';
    if (uploadSuccess) uploadSuccess.style.display = 'none';
    
    // Validate
    if (!workTitle) {
        if (uploadError) {
            uploadError.textContent = 'يرجى إدخال عنوان العمل';
            uploadError.style.display = 'block';
        }
        return;
    }
    
    if (!workImage) {
        if (uploadError) {
            uploadError.textContent = 'يرجى اختيار صورة للعمل';
            uploadError.style.display = 'block';
        }
        return;
    }
    
    // Check if user is admin (only admins can upload)
    if (typeof isAdmin === 'function' && !isAdmin()) {
        if (uploadError) {
            uploadError.textContent = 'ليس لديك صلاحية لرفع الأعمال. يجب أن تكون مسؤولاً.';
            uploadError.style.display = 'block';
        }
        return;
    }
    
    // Read image as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Save work to localStorage (in production, this would be sent to a server)
        const works = getSavedWorks();
        const newWork = {
            id: Date.now(),
            title: workTitle,
            description: workDescription,
            image: imageData,
            date: new Date().toLocaleDateString('ar-SA')
        };
        
        works.push(newWork);
        saveWorks(works);
        
        // Show success message
        if (uploadSuccess) {
            uploadSuccess.textContent = 'تم رفع العمل بنجاح! سيظهر في معرض الأعمال.';
            uploadSuccess.style.display = 'block';
        }
        
        // Reset form
        document.getElementById('uploadWorkForm').reset();
        
        // Close modal after 2 seconds
        setTimeout(() => {
            const uploadWorkModal = document.getElementById('uploadWorkModal');
            if (uploadWorkModal) {
                uploadWorkModal.style.display = 'none';
            }
            if (uploadSuccess) uploadSuccess.style.display = 'none';
            
            // Refresh page to show new work
            window.location.reload();
        }, 2000);
    };
    
    reader.readAsDataURL(workImage);
}

// Get saved works
function getSavedWorks() {
    try {
        const stored = localStorage.getItem('phonix_works');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Save works
function saveWorks(works) {
    try {
        localStorage.setItem('phonix_works', JSON.stringify(works));
    } catch (e) {
        console.error('Error saving works:', e);
    }
}

// Make functions available globally
window.getSavedWorks = getSavedWorks;
window.saveWorks = saveWorks;

