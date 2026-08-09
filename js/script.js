document.addEventListener('DOMContentLoaded', () => {
    const leftBar = document.querySelector('.black-bar.left');
    const rightBar = document.querySelector('.black-bar.right');
    const bg = document.querySelector('.spatial-bg');
    const content = document.querySelector('.main-content');
    const introContainer = document.getElementById('intro-container');

    // Wait for the welcome text animation to almost finish
    setTimeout(() => {
        // Split the black bar
        leftBar.classList.add('split-left');
        rightBar.classList.add('split-right');
        
        // Fade in background and content
        bg.classList.add('show-bg');
        content.classList.add('show-content');
        
        // Allow scrolling on body once intro is done
        document.body.style.overflow = 'auto';

        // Remove intro container from DOM after animation completes to avoid blocking clicks
        setTimeout(() => {
            introContainer.style.display = 'none';
        }, 1500);

    }, 2600); // Trigger just as the text fades out (text animation is 2.8s)
});
