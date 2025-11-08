// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });
    }

    // Telegram button handling
    const telegramBtn = document.getElementById('telegramBtn');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', async function() {
            const btnText = document.getElementById('btnText');
            const formMessage = document.getElementById('formMessage');
            
            // Get bot username from token
            const botToken = '7706159005:AAE1HzeUEcbVlKb0kiK_rm4LiuhS-4zIG6k';
            
            // Show loading state
            telegramBtn.disabled = true;
            btnText.style.display = 'none';
            const btnLoader = document.getElementById('btnLoader');
            if (btnLoader) {
                btnLoader.style.display = 'inline-block';
            }
            formMessage.style.display = 'none';

            try {
                // Get bot info to get username
                const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
                const botInfo = await botInfoResponse.json();
                
                let telegramUrl;
                if (botInfo.ok && botInfo.result.username) {
                    // Open bot directly
                    telegramUrl = `https://t.me/${botInfo.result.username}`;
                } else {
                    // Fallback: use generic Telegram link
                    telegramUrl = 'https://t.me';
                }

                // Open Telegram immediately
                window.open(telegramUrl, '_blank');
                
                // Show success message
                formMessage.className = 'form-message success';
                formMessage.innerHTML = `
                    <strong>✅ تم فتح بوت تيليجرام!</strong><br><br>
                    تم فتح تيليجرام. يمكنك الآن إرسال رسالتك إلى البوت.
                `;
                formMessage.style.display = 'block';
                
                // Hide message after delay
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
                
            } catch (error) {
                console.error('Error getting bot info:', error);
                
                // Fallback: open Telegram
                window.open('https://t.me', '_blank');
                
                formMessage.className = 'form-message success';
                formMessage.innerHTML = `
                    <strong>✅ تم فتح تيليجرام!</strong><br><br>
                    تم فتح تيليجرام. يمكنك البحث عن البوت وإرسال رسالتك.
                `;
                formMessage.style.display = 'block';
                
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            } finally {
                // Reset button state
                telegramBtn.disabled = false;
                btnText.style.display = 'inline';
                if (btnLoader) {
                    btnLoader.style.display = 'none';
                }
            }
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Create mailto link with subject and body
            const subject = encodeURIComponent(`رسالة من موقع Phonix Printer - ${name}`);
            const body = encodeURIComponent(
                `الاسم: ${name}\n` +
                `البريد الإلكتروني: ${email}\n` +
                `رقم الهاتف: ${phone}\n\n` +
                `الرسالة:\n${message}`
            );
            
            // Create mailto link
            const mailtoLink = `mailto:designerphonex@gmail.com?subject=${subject}&body=${body}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            const formMessage = document.createElement('div');
            formMessage.className = 'form-message success';
            formMessage.style.marginTop = '1rem';
            formMessage.innerHTML = '<strong>✅ تم فتح بريدك الإلكتروني!</strong><br>يرجى إرسال الرسالة من بريدك الإلكتروني.';
            contactForm.appendChild(formMessage);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                formMessage.remove();
            }, 5000);
            
            // Reset form after a delay
            setTimeout(() => {
                contactForm.reset();
            }, 1000);
        });
    }

    // Hero intro video - ensure continuous playback
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.setAttribute('autoplay', '');
        heroVideo.setAttribute('loop', '');
        heroVideo.setAttribute('muted', '');
        heroVideo.setAttribute('playsinline', '');
        
        // Play video when it loads
        heroVideo.addEventListener('loadeddata', function() {
            heroVideo.play().catch(function(error) {
                console.log('Hero video autoplay prevented:', error);
            });
        });
        
        // Restart video if it ends (backup for loop)
        heroVideo.addEventListener('ended', function() {
            heroVideo.currentTime = 0;
            heroVideo.play();
        });
    }

    // Ensure work showcase videos play continuously
    const liveVideos = document.querySelectorAll('.work-video-live');
    liveVideos.forEach(video => {
        // Ensure all necessary attributes are set
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'auto');
        video.muted = true; // Explicitly mute via JavaScript
        video.loop = true; // Explicitly set loop via JavaScript
        
        // Function to play video with retries
        function playVideoWithRetry(videoElement, retries = 3) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Video is playing
                        videoElement.currentTime = 0;
                    })
                    .catch(error => {
                        console.log('Video play failed, retrying...', error);
                        if (retries > 0) {
                            setTimeout(() => {
                                playVideoWithRetry(videoElement, retries - 1);
                            }, 500);
                        }
                    });
            }
        }
        
        // Play immediately when script runs
        playVideoWithRetry(video);
        
        // Play video when it can start playing
        video.addEventListener('canplay', function() {
            playVideoWithRetry(video);
        });
        
        // Play video when it loads data
        video.addEventListener('loadeddata', function() {
            playVideoWithRetry(video);
        });
        
        // Play video when metadata is loaded
        video.addEventListener('loadedmetadata', function() {
            playVideoWithRetry(video);
        });
        
        // Play video when it can play through
        video.addEventListener('canplaythrough', function() {
            playVideoWithRetry(video);
        });
        
        // Restart video if it ends (backup for loop)
        video.addEventListener('ended', function() {
            video.currentTime = 0;
            playVideoWithRetry(video);
        });
        
        // Handle visibility change - resume playing when page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && video.paused && !video.ended) {
                playVideoWithRetry(video);
            }
        });
        
        // Ensure video plays when it comes into view
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Video is in view, ensure it's playing
                    playVideoWithRetry(video);
                }
            });
        }, { 
            threshold: 0.1, // Lower threshold to trigger earlier
            rootMargin: '50px' // Start playing before fully in view
        });
        
        observer.observe(video);
        
        // Periodic check to ensure video is playing (backup)
        // Only check if video is visible and should be playing
        let videoCheckInterval = setInterval(function() {
            // Only restart if video is in viewport and paused (not user interaction)
            if (!video.paused || video.ended) {
                return;
            }
            
            // Check if video is in viewport
            const rect = video.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isInViewport) {
                playVideoWithRetry(video);
            }
        }, 3000);
    });

    // Lightbox functionality for work showcase
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const lightboxImage = document.getElementById('lightboxImage');
    
    // Function to open video in lightbox
    function openVideoInLightbox(video) {
        if (!lightboxModal || !lightboxVideo) return;
        
        const sources = video.querySelectorAll('source');
        
        // Clear existing sources in lightbox video
        lightboxVideo.innerHTML = '';
        
        // Add all sources from original video
        sources.forEach(source => {
            const newSource = document.createElement('source');
            newSource.src = source.src;
            newSource.type = source.type;
            lightboxVideo.appendChild(newSource);
        });
        
        // Add fallback text
        const fallbackText = document.createTextNode('متصفحك لا يدعم تشغيل الفيديو.');
        lightboxVideo.appendChild(fallbackText);
        
        // Ensure video has controls and continues playing automatically
        lightboxVideo.setAttribute('controls', '');
        lightboxVideo.setAttribute('autoplay', '');
        lightboxVideo.setAttribute('loop', '');
        lightboxVideo.setAttribute('muted', '');
        lightboxVideo.muted = true;
        lightboxVideo.loop = true;
        
        // Load and show video
        lightboxVideo.load();
        lightboxVideo.style.display = 'block';
        lightboxImage.style.display = 'none';
        lightboxModal.classList.add('active');
        
        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';
        
        // Play video automatically and ensure it continues
        function playLightboxVideo() {
            lightboxVideo.play().then(() => {
                // Video is playing, ensure it loops
                lightboxVideo.loop = true;
                lightboxVideo.muted = true;
            }).catch(e => {
                console.log('Lightbox video play error:', e);
                // Retry playing multiple times
                setTimeout(() => {
                    lightboxVideo.play().catch(() => {});
                }, 300);
                setTimeout(() => {
                    lightboxVideo.play().catch(() => {});
                }, 800);
            });
        }
        
        // Try playing immediately and on multiple events
        setTimeout(() => {
            playLightboxVideo();
        }, 100);
        
        lightboxVideo.addEventListener('canplay', function() {
            playLightboxVideo();
        });
        
        lightboxVideo.addEventListener('loadeddata', function() {
            playLightboxVideo();
        });
        
        // Ensure lightbox video loops when it ends
        const handleLightboxVideoEnd = function() {
            lightboxVideo.currentTime = 0;
            lightboxVideo.play().catch(() => {});
        };
        
        // Remove old listener if exists and add new one
        lightboxVideo.removeEventListener('ended', handleLightboxVideoEnd);
        lightboxVideo.addEventListener('ended', handleLightboxVideoEnd);
    }
    
    // Only proceed if lightbox elements exist
    if (lightboxModal && lightboxVideo && lightboxImage) {
        // Handle hero video (video 15 in hero section)
        const heroVideo = document.getElementById('heroVideo15');
        const heroVideoContainer = document.querySelector('.hero .work-image');
        
        if (heroVideo && heroVideoContainer) {
            // Ensure video attributes are set for continuous playback
            heroVideo.setAttribute('autoplay', '');
            heroVideo.setAttribute('loop', '');
            heroVideo.setAttribute('muted', '');
            heroVideo.setAttribute('playsinline', '');
            heroVideo.muted = true;
            heroVideo.loop = true;
            
            // Video 15 is a background hero video - plays automatically, not interactive
            // Remove click functionality - it's a background/intro video
            heroVideoContainer.style.cursor = 'default';
            heroVideo.style.pointerEvents = 'none';
            // Don't add click listener - it's a background video
            
            // Function to ensure video plays automatically
            function ensureHeroVideoPlays() {
                if (heroVideo.paused && !heroVideo.ended) {
                    heroVideo.play().catch(e => {
                        console.log('Hero video autoplay attempt:', e);
                        // Retry after a short delay
                        setTimeout(() => {
                            heroVideo.play().catch(() => {});
                        }, 500);
                    });
                }
            }
            
            // Force play immediately when video loads - multiple event listeners
            var playOnEvent = function() {
                heroVideo.muted = true;
                heroVideo.loop = true;
                heroVideo.play().catch(() => {});
                ensureHeroVideoPlays();
            };
            
            heroVideo.addEventListener('loadstart', playOnEvent);
            heroVideo.addEventListener('loadedmetadata', playOnEvent);
            heroVideo.addEventListener('loadeddata', playOnEvent);
            heroVideo.addEventListener('canplay', playOnEvent);
            heroVideo.addEventListener('canplaythrough', playOnEvent);
            heroVideo.addEventListener('playing', function() {
                heroVideo.loop = true;
                heroVideo.muted = true;
            });
            
            // Immediate play attempt
            setTimeout(function() {
                heroVideo.muted = true;
                heroVideo.loop = true;
                heroVideo.play().catch(() => {});
            }, 0);
            
            // Ensure it keeps playing - restart if paused
            heroVideo.addEventListener('pause', function() {
                if (!document.hidden && !heroVideo.ended) {
                    setTimeout(() => {
                        ensureHeroVideoPlays();
                    }, 200);
                }
            });
            
            // Restart if it ends (backup for loop)
            heroVideo.addEventListener('ended', function() {
                heroVideo.currentTime = 0;
                heroVideo.play().catch(() => {});
            });
            
            // Handle visibility change - resume when page becomes visible
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                    setTimeout(() => {
                        ensureHeroVideoPlays();
                    }, 100);
                }
            });
            
            // Multiple initial play attempts - ensures video starts immediately
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 0);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 50);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 100);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 200);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 500);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 1000);
            
            setTimeout(() => {
                ensureHeroVideoPlays();
            }, 2000);
            
            // Aggressive periodic check to ensure it's playing - every 1 second
            setInterval(function() {
                if (!document.hidden) {
                    if (heroVideo.paused && !heroVideo.ended) {
                        ensureHeroVideoPlays();
                    }
                    // Always enforce loop and mute
                    heroVideo.loop = true;
                    heroVideo.muted = true;
                }
            }, 1000);
        }
        
        // Get all work items
        const workItems = document.querySelectorAll('.work-item');
        
        workItems.forEach(item => {
            const workImage = item.querySelector('.work-image');
            if (workImage) {
                // Make sure it's clickable
                workImage.style.cursor = 'pointer';
                
                workImage.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if it's a video or image
                    const video = workImage.querySelector('video');
                    const image = workImage.querySelector('img');
                    
                    if (video) {
                        openVideoInLightbox(video);
                    } else if (image) {
                        // It's an image
                        lightboxImage.src = image.src;
                        lightboxImage.alt = image.alt || '';
                        lightboxImage.style.display = 'block';
                        lightboxVideo.style.display = 'none';
                        lightboxModal.classList.add('active');
                        
                        // Prevent body scroll when lightbox is open
                        document.body.style.overflow = 'hidden';
                    }
                });
                
                // Also allow clicking directly on images
                const image = workImage.querySelector('img');
                if (image) {
                    image.style.cursor = 'pointer';
                }
            }
        });
        
        // Close lightbox function
        function closeLightbox() {
            if (lightboxModal) {
                lightboxModal.classList.remove('active');
            }
            if (lightboxVideo) {
                lightboxVideo.pause();
                lightboxVideo.currentTime = 0;
            }
            // Restore body scroll
            document.body.style.overflow = '';
        }
        
        // Close on close button click
        if (lightboxClose) {
            lightboxClose.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeLightbox();
            });
        }
        
        // Close on background click
        if (lightboxModal) {
            lightboxModal.addEventListener('click', function(e) {
                // Close if clicking directly on the modal background (not on content, media, or close button)
                if (e.target === lightboxModal) {
                    closeLightbox();
                }
            });
            
            // Prevent closing when clicking on the content container or media
            const lightboxContent = document.querySelector('.lightbox-content');
            if (lightboxContent) {
                lightboxContent.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        }
        
        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
                closeLightbox();
            }
        });
    }
});

