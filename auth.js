// Authentication System
const AUTH_STORAGE_KEY = 'phonix_auth';
const USERS_STORAGE_KEY = 'phonix_users';
const ADMINS_STORAGE_KEY = 'phonix_admins';

// Initialize default admin account (can be changed later)
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123'
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

// Get all admins
function getAdmins() {
    try {
        const stored = localStorage.getItem(ADMINS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        // Initialize with default admin
        const defaultAdmins = [DEFAULT_ADMIN.username];
        localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(defaultAdmins));
        return defaultAdmins;
    }
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

// Register a new user
function registerUser(username, password, userType) {
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
    
    // Get existing users
    const users = getUsers();
    const admins = getAdmins();
    
    // Check if username already exists
    if (users.some(u => u.username === username) || admins.includes(username)) {
        return { success: false, message: 'اسم المستخدم موجود بالفعل' };
    }
    
    // Add user to storage
    users.push({
        username: username,
        password: password // In production, this should be hashed
    });
    saveUsers(users);
    
    // If admin registration, add to admins list
    if (userType === 'admin') {
        admins.push(username);
        saveAdmins(admins);
    }
    
    return { success: true, message: 'تم إنشاء الحساب بنجاح' };
}

// Login user
function loginUser(username, password) {
    // Validate input
    if (!username || !password) {
        return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }
    
    // Check default admin
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
        const admins = getAdmins();
        if (!admins.includes(username)) {
            admins.push(username);
            saveAdmins(admins);
        }
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            username: username,
            loggedIn: true,
            isAdmin: true
        }));
        return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    }
    
    // Check registered users
    const users = getUsers();
    const admins = getAdmins();
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
    
    // Check if admin
    const isAdminUser = admins.includes(username);
    
    // Save auth data
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        username: username,
        loggedIn: true,
        isAdmin: isAdminUser
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

