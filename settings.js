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
    
    // Upload work button (visible to all users)
    const uploadWorkBtn = document.getElementById('uploadWorkBtn');
    const uploadWorkSection = document.getElementById('uploadWorkSection');
    if (uploadWorkSection) {
        // Show upload section to all authenticated users
        uploadWorkSection.style.display = 'block';
        // Add pulse animation effect to draw attention
        if (uploadWorkBtn) {
            uploadWorkBtn.classList.add('pulse');
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
            
            // Add file preview functionality (images and videos)
            const workImageInput = document.getElementById('workImage');
            if (workImageInput) {
                workImageInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        // Check file size (max 1000MB)
                        if (file.size > 1000 * 1024 * 1024) {
                            alert('حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 1000 ميجابايت (1 جيجابايت)');
                            this.value = '';
                            return;
                        }
                        
                        // Show preview for images and videos
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            showFilePreview(e.target.result, file.type);
                        };
                        reader.readAsDataURL(file);
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
                    if (files.length > 0) {
                        if (files[0].size > 1000 * 1024 * 1024) {
                            alert('حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 1000 ميجابايت (1 جيجابايت)');
                            return;
                        }
                        
                        // Create a new FileList-like object
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(files[0]);
                        workImageInput.files = dataTransfer.files;
                        
                        // Trigger change event
                        const event = new Event('change', { bubbles: true });
                        workImageInput.dispatchEvent(event);
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
            uploadError.textContent = 'يرجى اختيار ملف للعمل';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        if (workImage) workImage.focus();
        return;
    }
    
    // Check file size (max 1000MB = 1GB)
    if (workImageFile.size > 1000 * 1024 * 1024) {
        if (uploadError) {
            uploadError.textContent = 'حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 1000 ميجابايت (1 جيجابايت)';
            uploadError.style.display = 'block';
            uploadError.classList.add('shake');
        }
        return;
    }
    
    // All authenticated users can upload work (no admin check needed)
    // Removed admin-only restriction per user request
    
    // Show loading state
    if (uploadSubmitBtn) {
        uploadSubmitBtn.disabled = true;
        const originalText = uploadSubmitBtn.textContent;
        uploadSubmitBtn.textContent = 'جاري الرفع...';
        uploadSubmitBtn.style.opacity = '0.7';
        uploadSubmitBtn.style.cursor = 'not-allowed';
    }
    
    // Read file as base64 (supports images, videos, and all file types)
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = e.target.result;
        const fileType = workImageFile.type;
        const fileName = workImageFile.name;
        
        // Save work to localStorage (in production, this would be sent to a server)
        const works = getSavedWorks();
        const newWork = {
            id: Date.now(),
            title: workTitleValue,
            description: workDescriptionValue,
            image: fileData, // Store file data (can be image, video, or any file)
            fileType: fileType, // Store file type for proper rendering
            fileName: fileName, // Store file name
            date: new Date().toLocaleDateString('ar-SA'),
            timestamp: Date.now()
        };
        
        works.push(newWork);
        saveWorks(works);
        
        // Log for debugging
        console.log('Work saved:', newWork);
        console.log('Total works:', works.length);
        console.log('Works in storage:', getSavedWorks().length);
        
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
                const previewMedia = document.getElementById('previewMedia');
                if (previewMedia) {
                    if (previewMedia.tagName === 'VIDEO') {
                        previewMedia.pause();
                        previewMedia.src = '';
                    } else if (previewMedia.tagName === 'IMG') {
                        previewMedia.src = '';
                    }
                }
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
        
        // Close modal after 2.5 seconds and refresh display
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
            
            // Try to refresh display without page reload
            // Check if we're on a page with work grid (homepage or mywork page)
            const homeWorkGrid = document.getElementById('homeWorkGrid');
            const workGrid = document.getElementById('workGrid');
            
            if (homeWorkGrid || workGrid) {
                // Try to call the refresh function if available
                if (typeof window.loadUploadedWorks === 'function') {
                    console.log('Refreshing work display using loadUploadedWorks');
                    // Remove existing uploaded works first to avoid duplicates
                    const existingWorks = (homeWorkGrid || workGrid).querySelectorAll('.work-item');
                    // Only remove works that were added dynamically (those with data-uploaded attribute)
                    existingWorks.forEach(item => {
                        if (item.hasAttribute('data-uploaded')) {
                            item.remove();
                        }
                    });
                    // Mark new items as uploaded
                    setTimeout(() => {
                        window.loadUploadedWorks();
                        // Mark newly added items
                        const allWorks = (homeWorkGrid || workGrid).querySelectorAll('.work-item');
                        allWorks.forEach((item, idx) => {
                            // Mark items that come after the original static items
                            const staticItems = homeWorkGrid ? 4 : 5; // Number of static items
                            if (idx >= staticItems) {
                                item.setAttribute('data-uploaded', 'true');
                            }
                        });
                    }, 100);
                } else {
                    // Fallback to page reload
                    console.log('loadUploadedWorks not available, reloading page');
                    window.location.reload();
                }
            } else {
                // Not on a portfolio page, just reload
                window.location.reload();
            }
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
        const works = stored ? JSON.parse(stored) : [];
        console.log('Loaded works from localStorage:', works.length);
        return works;
    } catch (e) {
        console.error('Error loading works:', e);
        return [];
    }
}

// Save works
function saveWorks(works) {
    try {
        localStorage.setItem('phonix_works', JSON.stringify(works));
        console.log('Works saved to localStorage:', works.length);
        // Verify it was saved
        const verify = localStorage.getItem('phonix_works');
        if (!verify) {
            console.error('Failed to save works to localStorage');
        }
    } catch (e) {
        console.error('Error saving works:', e);
        // Check if it's a quota exceeded error
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert('لا يمكن حفظ الملف. حجم البيانات كبير جداً. يرجى محاولة رفع ملف أصغر.');
        }
    }
}

// Show file preview (supports images, videos, and other files)
function showFilePreview(fileSrc, fileType) {
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
        previewLabel.id = 'previewLabel';
        
        const workImageInput = document.getElementById('workImage');
        if (workImageInput && workImageInput.parentNode) {
            workImageInput.parentNode.appendChild(previewContainer);
        }
    }
    
    // Clear previous preview content
    const existingPreview = previewContainer.querySelector('#previewMedia');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const previewLabel = document.getElementById('previewLabel');
    let previewMedia;
    
    if (fileType.startsWith('image/')) {
        // Image preview
        if (previewLabel) previewLabel.textContent = 'معاينة الصورة:';
        previewMedia = document.createElement('img');
        previewMedia.id = 'previewMedia';
        previewMedia.className = 'image-preview';
        previewMedia.alt = 'معاينة الصورة';
        previewMedia.src = fileSrc;
    } else if (fileType.startsWith('video/')) {
        // Video preview
        if (previewLabel) previewLabel.textContent = 'معاينة الفيديو:';
        previewMedia = document.createElement('video');
        previewMedia.id = 'previewMedia';
        previewMedia.className = 'image-preview';
        previewMedia.controls = true;
        previewMedia.src = fileSrc;
        previewMedia.style.maxHeight = '300px';
    } else {
        // Other file types - show file info
        if (previewLabel) previewLabel.textContent = 'معاينة الملف:';
        previewMedia = document.createElement('div');
        previewMedia.id = 'previewMedia';
        previewMedia.className = 'file-preview';
        previewMedia.style.padding = '1rem';
        previewMedia.style.background = 'var(--light-bg)';
        previewMedia.style.borderRadius = '8px';
        previewMedia.style.textAlign = 'center';
        previewMedia.innerHTML = `
            <p style="font-size: 3rem; margin: 0.5rem 0;">📄</p>
            <p style="margin: 0.5rem 0; font-weight: bold;">نوع الملف: ${fileType || 'غير محدد'}</p>
            <p style="margin: 0.5rem 0; color: #666;">سيتم رفع الملف بنجاح</p>
        `;
    }
    
    if (previewLabel && !previewContainer.contains(previewLabel)) {
        previewContainer.appendChild(previewLabel);
    }
    previewContainer.appendChild(previewMedia);
    previewContainer.classList.add('show');
}

// Keep backward compatibility
function showImagePreview(imageSrc) {
    showFilePreview(imageSrc, 'image/*');
}

// Make functions available globally
window.getSavedWorks = getSavedWorks;
window.saveWorks = saveWorks;
window.showImagePreview = showImagePreview;
window.showFilePreview = showFilePreview;

