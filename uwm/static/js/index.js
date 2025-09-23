// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bulma components
    initializeBulmaComponents();
    
    // Initialize only the videos in the viewport
    initializeVisibleVideos();
    
    // Handle experiment tabs
    setupExperimentTabs();
    
    // Setup lazy loading for videos
    setupLazyLoading();
  });
  
  // Initialize Bulma components
  function initializeBulmaComponents() {
    // Handle navbar burger menu toggle
    const navbarBurgers = document.querySelectorAll('.navbar-burger');
    navbarBurgers.forEach(burger => {
      burger.addEventListener('click', () => {
        const target = document.getElementById(burger.dataset.target);
        burger.classList.toggle('is-active');
        target.classList.toggle('is-active');
      });
    });
  
    // Initialize carousels if they exist
    if (typeof bulmaCarousel !== 'undefined') {
      const options = {
        slidesToScroll: 1,
        slidesToShow: 3,
        loop: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 3000,
      };
      
      // Initialize all div with carousel class
      const carousels = bulmaCarousel.attach('.carousel', options);
      
      // Loop on each carousel initialized
      for (let i = 0; i < carousels.length; i++) {
        // Add listener to event
        carousels[i].on('before:show', state => {
          console.log(state);
        });
      }
      
      // Access to bulmaCarousel instance of a specific element if needed
      const myElement = document.querySelector('#my-element');
      if (myElement && myElement.bulmaCarousel) {
        myElement.bulmaCarousel.on('before-show', function(state) {
          console.log(state);
        });
      }
    }
    
    // Initialize sliders if they exist
    if (typeof bulmaSlider !== 'undefined') {
      bulmaSlider.attach();
    }
  }
  
  // Function to initialize only videos that are currently visible
  function initializeVisibleVideos() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
      // Initially pause all videos
      video.pause();
      
      // Only start the videos in the initial viewport and visible containers
      if (isElementInViewport(video) && isInVisibleContainer(video)) {
        video.play();
      }
    });
  }
  
  // Check if element is in the viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Check if element is in a visible container
  function isInVisibleContainer(el) {
    // Check parent elements until a hidden one is found or until body is reached
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.display === 'none') {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }
  
  // Setup experiment tabs
  function setupExperimentTabs() {
    // Show default experiment (bowl)
    showExperiment('bowl');
    showOOD('bowl');
  }
  
  // Show experiment function
  function showExperiment(name) {
    const experiments = ['bowl', 'block', 'paper', 'towel', 'rice'];
    
    experiments.forEach(exp => {
      const container = document.getElementById(exp);
      if (container) {
        if (exp === name) {
          container.style.display = 'block';
          // Play videos in this container only if they're in viewport
          const videos = container.querySelectorAll('video');
          videos.forEach(video => {
            if (isElementInViewport(video)) {
              video.play().catch(e => {
                // Handle autoplay errors silently (common on mobile)
                console.log("Autoplay prevented:", e);
              });
            }
          });
        } else {
          container.style.display = 'none';
          // Pause all videos in hidden containers
          const videos = container.querySelectorAll('video');
          videos.forEach(video => video.pause());
        }
      }
    });
  }
  
  // Show OOD function
  function showOOD(task) {
    const containers = ['ood-bowl', 'ood-block'];
    
    containers.forEach(container => {
      const element = document.getElementById(container);
      if (element) {
        if (container === 'ood-' + task) {
          element.style.display = 'flex';
          // Play videos in this container only if they're in viewport
          const videos = element.querySelectorAll('video');
          videos.forEach(video => {
            if (isElementInViewport(video)) {
              video.play().catch(e => {
                console.log("Autoplay prevented:", e);
              });
            }
          });
        } else {
          element.style.display = 'none';
          // Pause all videos in hidden containers
          const videos = element.querySelectorAll('video');
          videos.forEach(video => video.pause());
        }
      }
    });
  }
  
  // Setup lazy loading for videos
  function setupLazyLoading() {
    // Use Intersection Observer for better performance if supported
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting && isInVisibleContainer(video)) {
            video.play().catch(e => {
              console.log("Autoplay prevented:", e);
            });
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.1 });
      
      // Observe all videos
      document.querySelectorAll('video').forEach(video => {
        videoObserver.observe(video);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      // Use scroll event with throttling to handle video playback
      window.addEventListener('scroll', throttle(handleVideoPlayback, 200));
      
      // Initial check
      handleVideoPlayback();
    }
  }
  
  // Handle video playback based on visibility
  function handleVideoPlayback() {
    document.querySelectorAll('video').forEach(video => {
      if (isElementInViewport(video) && isInVisibleContainer(video)) {
        if (video.paused) {
          video.play().catch(e => {
            console.log("Autoplay prevented:", e);
          });
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }
  
  // Throttle function to limit how often a function runs
  function throttle(func, limit) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func(...args);
      }
    };
  }
  
  // Add global functions for use in HTML onclick
  window.showExperiment = showExperiment;
  window.showOOD = showOOD;