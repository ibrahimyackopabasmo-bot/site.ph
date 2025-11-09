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
            // Add pulse animation effect
            if (uploadWorkBtn) {
                uploadWorkBtn.classList.add('pulse');
            }
        } else {
            uploadWorkSection.style.display = 'none';
        }
    }
    
    if (uploadWorkBtn) {
        uploadWorkBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            const uploadModal = document.getElementById('uploadWorkModal');
            if (uploadModal) {
                uploadModal.style.display = 'flex';
                // Add entrance animation
                uploadModal.style.animation = 'fadeIn 0.3s ease';
                
                // Clear any previous errors/success messages
                const uploadError = document.getElementById('uploadError');
                const uploadSuccess = document.getElementById('uploadSuccess');
                if (uploadError) {
                    uploadError.style.display = 'none';
                    uploadError.classList.remove('shake');
                }
                if (uploadSuccess) {
                    uploadSuccess.style.display = 'none';
                    uploadSuccess.classList.remove('show');
                }
                
                // Clear preview if exists
                const previewContainer = document.getElementById('imagePreviewContainer');
                if (previewContainer) {
                    previewContainer.classList.remove('show');
                    previewContainer.style.display = 'none';
                    const previewImg = document.getElementById('imagePreview');
                    if (previewImg) previewImg.src = '';
                }
                
                // Initialize upload form after modal opens
                setTimeout(() => {
                    initializeUploadForms();
                }, 100);
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
    
    // Upload work form submission - initialize for all forms on page
    initializeUploadForms();
});

// Initialize upload forms (called on page load and when modal opens)
function initializeUploadForms() {
    const uploadWorkForm = document.getElementById('uploadWorkForm');
    if (uploadWorkForm) {
        // Remove existing listeners to prevent duplicates
        const newForm = uploadWorkForm.cloneNode(true);
        uploadWorkForm.parentNode.replaceChild(newForm, uploadWorkForm);
        
        const form = document.getElementById('uploadWorkForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleWorkUpload();
            });
            
            // Add image preview functionality
            const workImageInput = document.getElementById('workImage');
            if (workImageInput) {
                workImageInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        // Check file size
                        if (file.size > 5 * 1024 * 1024) {
                            alert('حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت');
                            this.value = '';
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            showImagePreview(e.target.result);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        alert('يرجى اختيار ملف صورة صالح');
                        this.value = '';
                    }
                });
                
                // Drag and drop functionality
                form.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (workImageInput) {
                        workImageInput.classList.add('drag-over');
                    }
                });
                
                form.addEventListener('dragleave', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (workImageInput && !form.contains(e.relatedTarget)) {
                        workImageInput.classList.remove('drag-over');
                    }
                });
                
                form.addEventListener('drop', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (workImageInput) {
                        workImageInput.classList.remove('drag-over');
                    }
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0 && files[0].type.startsWith('image/')) {
                        if (files[0].size > 5 * 1024 * 1024) {
                            alert('حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت');
                            return;
                        }
                        
                        // Create a new FileList-like object
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(files[0]);
                        workImageInput.files = dataTransfer.files;
                        
                        // Trigger change event
                        const event = new Event('change', { bubbles: true });
                        workImageInput.dispatchEvent(event);
                    } else {
                        alert('يرجى سحب ملف صورة صالح');
                    }
                });
            }
        }
    }
}


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
    const workTitle = document.getElementById('workTitle');
    const workDescription = document.getElementById('workDescription');
    const workImage = document.getElementById('workImage');
    const uploadError = document.getElementById('uploadError');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const uploadWorkForm = document.getElementById('uploadWorkForm');
    const uploadSubmitBtn = uploadWorkForm ? uploadWorkForm.querySelector('button[type="submit"]') : null;
    
    // Get values
    const workTitleValue = workTitle ? workTitle.value.trim() : '';
    const workDescriptionValue = workDescription ? workDescription.value.trim() : '';
    const workImageFile = workImage && workImage.files.length > 0 ? workImage.files[0] : null;
    
    // Hide previous messages
    if (uploadError) {
        uploadError.style.display = 'none';
        uploadError.textContent = '';
        uploadError.classList.remove('shake');
    }
    if (uploadSuccess) {
        uploadSuccess.style.display = 'none';
        uploadSuccess.textContent = '';
    }
    
    // Validate
    if (!workTitleValue) {
        if (uploadError) {
            uploadError.textContent = 'يرجى إدخال عنوان العمل';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        if (workTitle) workTitle.focus();
        return;
    }
    
    if (!workImageFile) {
        if (uploadError) {
            uploadError.textContent = 'يرجى اختيار صورة للعمل';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        if (workImage) workImage.focus();
        return;
    }
    
    // Check file type
    if (!workImageFile.type.startsWith('image/')) {
        if (uploadError) {
            uploadError.textContent = 'يرجى اختيار ملف صورة صالح (JPG, PNG, etc.)';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        return;
    }
    
    // Check file size (max 5MB)
    if (workImageFile.size > 5 * 1024 * 1024) {
        if (uploadError) {
            uploadError.textContent = 'حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        return;
    }
    
    // Check if user is admin (only admins can upload)
    if (typeof isAdmin === 'function' && !isAdmin()) {
        if (uploadError) {
            uploadError.textContent = 'ليس لديك صلاحية لرفع الأعمال. يجب أن تكون مسؤولاً.';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        return;
    }
    
    // Show loading state
    if (uploadSubmitBtn) {
        uploadSubmitBtn.disabled = true;
        const originalText = uploadSubmitBtn.textContent;
        uploadSubmitBtn.textContent = 'جاري الرفع...';
        uploadSubmitBtn.style.opacity = '0.7';
        uploadSubmitBtn.style.cursor = 'not-allowed';
    }
    
    // Read image as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Save work to localStorage (in production, this would be sent to a server)
        const works = getSavedWorks();
        const newWork = {
            id: Date.now(),
            title: workTitleValue,
            description: workDescriptionValue,
            image: imageData,
            date: new Date().toLocaleDateString('ar-SA'),
            timestamp: Date.now()
        };
        
        works.push(newWork);
        saveWorks(works);
        
        // Show success message with animation
        if (uploadSuccess) {
            uploadSuccess.textContent = '✅ تم رفع العمل بنجاح! سيظهر في معرض الأعمال الآن.';
            uploadSuccess.style.display = 'block';
            uploadSuccess.classList.add('show');
        }
        
        // Reset form and clear preview
        if (uploadWorkForm) uploadWorkForm.reset();
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer) {
            previewContainer.classList.remove('show');
            setTimeout(() => {
                const previewImg = document.getElementById('imagePreview');
                if (previewImg) previewImg.src = '';
                previewContainer.style.display = 'none';
            }, 300);
        }
        
        // Reset button
        if (uploadSubmitBtn) {
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.textContent = 'رفع العمل';
            uploadSubmitBtn.style.opacity = '1';
            uploadSubmitBtn.style.cursor = 'pointer';
        }
        
        // Close modal after 2.5 seconds and refresh
        setTimeout(() => {
            const uploadWorkModal = document.getElementById('uploadWorkModal');
            if (uploadWorkModal) {
                uploadWorkModal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    uploadWorkModal.style.display = 'none';
                    uploadWorkModal.style.animation = '';
                }, 300);
            }
            if (uploadSuccess) {
                uploadSuccess.style.display = 'none';
                uploadSuccess.classList.remove('show');
            }
            
            // Refresh page to show new work in portfolio
            window.location.reload();
        }, 2500);
    };
    
    reader.onerror = function() {
        if (uploadError) {
            uploadError.textContent = 'حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى.';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        if (uploadSubmitBtn) {
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.textContent = 'رفع العمل';
            uploadSubmitBtn.style.opacity = '1';
            uploadSubmitBtn.style.cursor = 'pointer';
        }
    };
    
    reader.readAsDataURL(workImageFile);
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

// Show image preview
function showImagePreview(imageSrc) {
    // Remove existing preview if any
    let previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'imagePreviewContainer';
        previewContainer.className = 'image-preview-container';
        
        const previewLabel = document.createElement('p');
        previewLabel.style.marginBottom = '0.5rem';
        previewLabel.style.fontWeight = 'bold';
        previewLabel.style.color = 'var(--text-color)';
        previewLabel.textContent = 'معاينة الصورة:';
        
        const previewImg = document.createElement('img');
        previewImg.id = 'imagePreview';
        previewImg.className = 'image-preview';
        previewImg.alt = 'معاينة الصورة';
        
        previewContainer.appendChild(previewLabel);
        previewContainer.appendChild(previewImg);
        
        const workImageInput = document.getElementById('workImage');
        if (workImageInput && workImageInput.parentNode) {
            workImageInput.parentNode.appendChild(previewContainer);
        }
    }
    
    const previewImg = document.getElementById('imagePreview');
    if (previewImg) {
        previewImg.src = imageSrc;
        previewContainer.classList.add('show');
    }
}

// Make functions available globally
window.getSavedWorks = getSavedWorks;
window.saveWorks = saveWorks;
window.showImagePreview = showImagePreview;

