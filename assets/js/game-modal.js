        let slideIndex = 1;
        let modalIndex = 0;
        let images = [];
        let currentGameData = null;
        const mobileGameQuery = window.matchMedia('(max-width: 768px)');
        let modalTouchStartX = 0;
        let modalTouchStartY = 0;
        let modalTouchActive = false;
        let modalTouchLocked = false;
        let modalIndicatorButtons = [];

        document.addEventListener("DOMContentLoaded", function() {
            // Ensure the modal is hidden when the page is loaded
            document.getElementById('myModal').style.display = "none";

            const urlParams = new URLSearchParams(window.location.search);
            const gameId = urlParams.get('id');

            fetch('../../assets/data/games.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    const game = data.games.find(g => g.id === gameId);
                    if (game) {
                        document.getElementById('game-name').textContent = game.name;
                        currentGameData = game;
                        renderGameDescription(currentGameData);

                        const slideshowContainer = document.getElementById('slideshow-container');
                        images = game.images;
                        game.images.forEach((image, index) => {
                            const slideDiv = document.createElement('div');
                            slideDiv.className = 'slides';

                            const img = document.createElement('img');
                            img.src = image;
                            img.alt = `Screenshot ${index + 1}`;
                            img.addEventListener('click', function() {
                                openModal(index);
                            });

                            slideDiv.appendChild(img);
                            slideshowContainer.insertBefore(slideDiv, slideshowContainer.querySelector('.prev'));
                        });

                        applyGameLayout();
                        buildModalIndicator();
                        updateModalIndicator();
                    } else {
                        document.getElementById('game-name').textContent = 'Game not found';
                        document.getElementById('game-description').textContent = '';
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    document.getElementById('game-name').textContent = 'Error loading game data';
                    document.getElementById('game-description').textContent = '';
                });

        if (typeof mobileGameQuery.addEventListener === 'function') {
            mobileGameQuery.addEventListener('change', () => {
                applyGameLayout();
                renderGameDescription(currentGameData);
            });
        } else if (typeof mobileGameQuery.addListener === 'function') {
            mobileGameQuery.addListener(() => {
                applyGameLayout();
                renderGameDescription(currentGameData);
            });
        }

        const modalContent = document.querySelector('.game-modal-content');
        const modalImage = document.getElementById('modal-img');

        if (modalContent && modalImage) {
            modalContent.addEventListener('touchstart', handleModalTouchStart, { passive: true });
            modalContent.addEventListener('touchmove', handleModalTouchMove, { passive: false });
            modalContent.addEventListener('touchend', handleModalTouchEnd, { passive: true });
        }
        });

    function applyGameLayout() {
        const slideshowContainer = document.getElementById('slideshow-container');
        const slides = document.getElementsByClassName('slides');

        if (!slideshowContainer || !slides.length) {
            return;
        }

        const isMobile = mobileGameQuery.matches;

        slideshowContainer.classList.toggle('mobile-carousel', isMobile);

        if (isMobile) {
            slideshowContainer.scrollLeft = 0;
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.display = 'block';
            }
            return;
        }

        showSlides(slideIndex);
    }

    function renderGameDescription(game) {
        const descriptionElement = document.getElementById('game-description');

        if (!descriptionElement || !game) {
            return;
        }

        descriptionElement.innerHTML = '';

        if (!game.meta && !game.sections && game.description) {
            renderLegacyDescription(descriptionElement, game.description);
            return;
        }

        const shell = document.createElement('div');
        shell.className = 'description-shell';

        const metaGrid = document.createElement('div');
        metaGrid.className = 'description-meta-grid';

        const metaEntries = game.meta ? Object.entries(game.meta) : [];
        metaEntries.forEach(([label, value]) => {
            const metaCard = document.createElement('div');
            metaCard.className = 'description-meta-card';

            const labelElement = document.createElement('div');
            labelElement.className = 'description-meta-label';
            labelElement.textContent = label;

            const valueElement = document.createElement('div');
            valueElement.className = 'description-meta-value';
            valueElement.textContent = value;

            metaCard.appendChild(labelElement);
            metaCard.appendChild(valueElement);
            metaGrid.appendChild(metaCard);
        });

        const sections = Array.isArray(game.sections) ? game.sections : [];
        
        if (metaEntries.length) {
            shell.appendChild(metaGrid);
        }

        sections.forEach(section => {
            const sectionsPanel = document.createElement('div');
            sectionsPanel.className = 'description-sections';

            const sectionCard = document.createElement('section');
            sectionCard.className = 'description-section-card';

            if (section.title) {
                const title = document.createElement('div');
                title.className = 'description-section-title';
                title.textContent = section.title;
                sectionCard.appendChild(title);
            }

            const paragraphs = Array.isArray(section.paragraphs) ? section.paragraphs : [];
            paragraphs.forEach(paragraph => {
                if (typeof paragraph !== 'string') {
                    return;
                }

                if (paragraph.trim().startsWith('- ')) {
                    const bulletList = document.createElement('ul');
                    bulletList.className = 'description-bullet-list';
                    const bulletItem = document.createElement('li');
                    bulletItem.textContent = paragraph.trim().slice(2);
                    bulletList.appendChild(bulletItem);
                    sectionCard.appendChild(bulletList);
                    return;
                }

                const para = document.createElement('p');
                para.textContent = paragraph;
                sectionCard.appendChild(para);
            });

            sectionsPanel.appendChild(sectionCard);
            shell.appendChild(sectionsPanel);
        });

        if (!shell.childElementCount) {
            const fallback = document.createElement('p');
            fallback.textContent = game.description || '';
            shell.appendChild(fallback);
        }

        descriptionElement.appendChild(shell);
        setupDescriptionCarouselHint(descriptionElement, shell);
    }

    function renderLegacyDescription(descriptionElement, rawDescription) {
        const blocks = rawDescription
            .split(/\n\s*\n/)
            .map(block => block.trim())
            .filter(Boolean);

        const metaItems = [];
        const sections = [];

        blocks.forEach(block => {
            const lines = block
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            let sectionTitle = null;
            const sectionParagraphs = [];

            lines.forEach(line => {
                const metaMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
                if (metaMatch) {
                    metaItems.push({
                        label: metaMatch[1].trim(),
                        value: metaMatch[2].trim()
                    });
                    return;
                }

                const titleOnlyMatch = line.match(/^\*\*(.+?):\*\*$/);
                if (titleOnlyMatch) {
                    sectionTitle = titleOnlyMatch[1].trim();
                    return;
                }

                const bulletMatch = line.match(/^[-•]\s*(.+)$/);
                if (bulletMatch) {
                    sectionParagraphs.push({ type: 'bullet', text: bulletMatch[1].trim() });
                    return;
                }

                sectionParagraphs.push({ type: 'text', text: line });
            });

            if (sectionTitle || sectionParagraphs.length) {
                sections.push({ title: sectionTitle, paragraphs: sectionParagraphs });
            }
        });

        const shell = document.createElement('div');
        shell.className = 'description-shell';

        if (metaItems.length) {
            const metaGrid = document.createElement('div');
            metaGrid.className = 'description-meta-grid';

            metaItems.forEach(item => {
                const metaCard = document.createElement('div');
                metaCard.className = 'description-meta-card';

                const label = document.createElement('div');
                label.className = 'description-meta-label';
                label.textContent = item.label;

                const value = document.createElement('div');
                value.className = 'description-meta-value';
                value.textContent = item.value;

                metaCard.appendChild(label);
                metaCard.appendChild(value);
                metaGrid.appendChild(metaCard);
            });

            shell.appendChild(metaGrid);
        }

        const sectionsGrid = document.createElement('div');
        sectionsGrid.className = 'description-sections';

        sections.forEach(section => {
            const sectionCard = document.createElement('section');
            sectionCard.className = 'description-section-card';

            if (section.title) {
                const title = document.createElement('div');
                title.className = 'description-section-title';
                title.textContent = section.title;
                sectionCard.appendChild(title);
            }

            section.paragraphs.forEach(paragraph => {
                if (paragraph.type === 'bullet') {
                    const bulletList = document.createElement('ul');
                    bulletList.className = 'description-bullet-list';
                    const bulletItem = document.createElement('li');
                    bulletItem.textContent = paragraph.text;
                    bulletList.appendChild(bulletItem);
                    sectionCard.appendChild(bulletList);
                    return;
                }

                const para = document.createElement('p');
                para.textContent = paragraph.text;
                sectionCard.appendChild(para);
            });

            sectionsGrid.appendChild(sectionCard);
        });

        shell.appendChild(sectionsGrid);
        descriptionElement.appendChild(shell);
        setupDescriptionCarouselHint(descriptionElement, shell);
    }

    function setupDescriptionCarouselHint(descriptionElement, shell) {
        const existingHint = descriptionElement.querySelector('.description-swipe-hint');

        if (existingHint) {
            existingHint.remove();
        }

        if (!mobileGameQuery.matches || !shell || shell.childElementCount < 2) {
            return;
        }

        const hint = document.createElement('div');
        hint.className = 'description-swipe-hint';
        hint.textContent = '\u2190 Swipe cards \u2192';
        descriptionElement.appendChild(hint);

        const hideHint = () => {
            hint.classList.add('is-hidden');
        };

        shell.addEventListener('touchstart', hideHint, { passive: true, once: true });
        shell.addEventListener('pointerdown', hideHint, { passive: true, once: true });

        // Fades naturally after a few seconds if the user does not interact.
        setTimeout(hideHint, 4500);

        // Micro nudge makes swipe affordance obvious without a persistent UI element.
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion && shell.scrollLeft === 0) {
            setTimeout(() => {
                shell.scrollTo({ left: 34, behavior: 'smooth' });
                setTimeout(() => {
                    shell.scrollTo({ left: 0, behavior: 'smooth' });
                }, 260);
            }, 320);
        }
    }

        function plusSlides(n) {
            showSlides(slideIndex += n);
        }

        function showSlides(n) {
            let i;
            let slides = document.getElementsByClassName("slides");
            if (n > slides.length) {slideIndex = 1}
            if (n < 1) {slideIndex = slides.length}
            for (i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
            }
            slides[slideIndex-1].style.display = "block";
        }

        function openModal(index) {
            modalIndex = index;
            const modal = document.getElementById('myModal');
            const modalImg = document.getElementById('modal-img');
            modal.style.display = "flex";
            modalImg.src = images[modalIndex];
            resetModalSwipeState();
            updateModalIndicator();
        }

        function closeModal() {
            document.getElementById('myModal').style.display = "none";
            resetModalSwipeState();
        }

        function changeModalImage(n) {
            modalIndex += n;
            if (modalIndex >= images.length) { modalIndex = 0; }
            if (modalIndex < 0) { modalIndex = images.length - 1; }
            const modalImg = document.getElementById('modal-img');
            modalImg.src = images[modalIndex];
            updateModalIndicator();
        }

        function buildModalIndicator() {
            const indicator = document.getElementById('game-modal-indicator');

            if (!indicator || !images.length) {
                return;
            }

            indicator.innerHTML = '';
            modalIndicatorButtons = [];

            images.forEach((_, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.setAttribute('aria-label', `Show image ${index + 1} of ${images.length}`);
                button.addEventListener('click', () => {
                    modalIndex = index;
                    const modalImg = document.getElementById('modal-img');
                    modalImg.src = images[modalIndex];
                    updateModalIndicator();
                });
                indicator.appendChild(button);
                modalIndicatorButtons.push(button);
            });
        }

        function updateModalIndicator() {
            if (!modalIndicatorButtons.length) {
                return;
            }

            modalIndicatorButtons.forEach((button, index) => {
                button.classList.toggle('is-active', index === modalIndex);
            });
        }

        function resetModalSwipeState() {
            modalTouchStartX = 0;
            modalTouchStartY = 0;
            modalTouchActive = false;
            modalTouchLocked = false;
        }

        function handleModalTouchStart(event) {
            if (!mobileGameQuery.matches || !images.length) {
                return;
            }

            const touch = event.touches[0];
            modalTouchStartX = touch.clientX;
            modalTouchStartY = touch.clientY;
            modalTouchActive = true;
            modalTouchLocked = false;
        }

        function handleModalTouchMove(event) {
            if (!modalTouchActive || !mobileGameQuery.matches) {
                return;
            }

            const touch = event.touches[0];
            const deltaX = touch.clientX - modalTouchStartX;
            const deltaY = touch.clientY - modalTouchStartY;

            if (!modalTouchLocked && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                modalTouchLocked = true;
            }

            if (modalTouchLocked) {
                event.preventDefault();
            }
        }

        function handleModalTouchEnd(event) {
            if (!modalTouchActive || !mobileGameQuery.matches) {
                return;
            }

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - modalTouchStartX;
            const deltaY = touch.clientY - modalTouchStartY;
            const swipeThreshold = 50;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                changeModalImage(deltaX < 0 ? 1 : -1);
            }

            modalTouchActive = false;
            modalTouchLocked = false;
        }
