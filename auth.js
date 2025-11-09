// Authentication System
const AUTH_STORAGE_KEY = 'phonix_auth';
const USERS_STORAGE_KEY = 'phonix_users';
const ADMINS_STORAGE_KEY = 'phonix_admins';

// Hardcoded admin account - cannot be changed or created
const ADMIN_ACCOUNT = {
    username: 'ibrahim',
    password: '2002@2003@77'
};

// Check if user is authenticated
function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!auth) return false;
    
    try {
        const authData = JSON.parse(auth);
        return authData && authData.username && authData.loggedIn === true;
    } catch (e) {
        return false;
    }
}

// Get current user info
function getCurrentUser() {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!auth) return null;
    
    try {
        return JSON.parse(auth);
    } catch (e) {
        return null;
    }
}

// Check if current user is admin
function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Check if user is in admins list
    const admins = getAdmins();
    return admins.includes(user.username);
}

// Get all registered users
function getUsers() {
    try {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Get all admins (only the hardcoded admin)
function getAdmins() {
    // Only return the hardcoded admin - no one can create admin accounts
    return [ADMIN_ACCOUNT.username];
}

// Save users
function saveUsers(users) {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('Error saving users:', e);
    }
}

// Save admins
function saveAdmins(admins) {
    try {
        localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
    } catch (e) {
        console.error('Error saving admins:', e);
    }
}

// Register a new user (regular users only - no admin registration allowed)
function registerUser(username, password) {
    // Validate input
    if (!username || !password) {
        return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }
    
    if (username.length < 3) {
        return { success: false, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
    }
    
    // Prevent registering with admin username
    if (username === ADMIN_ACCOUNT.username) {
        return { success: false, message: 'لا يمكن استخدام هذا الاسم. يرجى اختيار اسم آخر.' };
    }
    
    // Get existing users
    const users = getUsers();
    const admins = getAdmins();
    
    // Check if username already exists (in users or admin)
    if (users.some(u => u.username === username) || admins.includes(username)) {
        return { success: false, message: 'اسم المستخدم موجود بالفعل' };
    }
    
    // Add user to storage (regular user only - no admin registration)
    users.push({
        username: username,
        password: password // In production, this should be hashed
    });
    saveUsers(users);
    
    return { success: true, message: 'تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول كمستخدم عادي.' };
}

// Login user
function loginUser(username, password) {
    // Validate input
    if (!username || !password) {
        return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }
    
    // Check hardcoded admin account first
    if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            username: username,
            loggedIn: true,
            isAdmin: true
        }));
        return { success: true, message: 'تم تسجيل الدخول كمسؤول بنجاح' };
    }
    
    // Check registered users (regular users only)
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
    
    // Regular user login (not admin)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        username: username,
        loggedIn: true,
        isAdmin: false
    }));
    
    return { success: true, message: 'تم تسجيل الدخول بنجاح' };
}

// Logout user
function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'login.html';
}

// Protect page - redirect to login if not authenticated
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            
            const result = loginUser(username, password);
            
            if (result.success) {
                // Redirect to homepage
                window.location.href = 'index.html';
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const userType = document.querySelector('input[name="userType"]:checked').value;
            const errorDiv = document.getElementById('registerError');
            const successDiv = document.getElementById('registerSuccess');
            
            // Hide previous messages
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            // Validate passwords match
            if (password !== confirmPassword) {
                errorDiv.textContent = 'كلمات المرور غير متطابقة';
                errorDiv.style.display = 'block';
                return;
            }
            
            const result = registerUser(username, password, userType);
            
            if (result.success) {
                successDiv.textContent = result.message + '. يمكنك الآن تسجيل الدخول.';
                successDiv.style.display = 'block';
                
                // Clear form
                registerForm.reset();
                
                // Switch to login after 2 seconds
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                    document.getElementById('loginUsername').value = username;
                }, 2000);
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // If on login page and already authenticated, redirect
    if (window.location.pathname.includes('login.html') && isAuthenticated()) {
        window.location.href = 'index.html';
    }
});

