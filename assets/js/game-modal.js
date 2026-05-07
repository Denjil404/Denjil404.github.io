        let slideIndex = 1;
        let modalIndex = 0;
        let images = [];

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
                        document.getElementById('game-description').innerHTML = game.description
                            .replace(/\n/g, '<br>')
                            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

                        const slideshowContainer = document.getElementById('slideshow-container');
                        images = game.images;
                        game.images.forEach((image, index) => {
                            const slideDiv = document.createElement('div');
                            slideDiv.className = 'slides';
                            if (index === 0) slideDiv.style.display = 'block';

                            const img = document.createElement('img');
                            img.src = image;
                            img.alt = `Screenshot ${index + 1}`;
                            img.addEventListener('click', function() {
                                openModal(index);
                            });

                            slideDiv.appendChild(img);
                            slideshowContainer.insertBefore(slideDiv, slideshowContainer.firstChild);
                        });

                        showSlides(slideIndex);
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
        });

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
        }

        function closeModal() {
            document.getElementById('myModal').style.display = "none";
        }

        function changeModalImage(n) {
            modalIndex += n;
            if (modalIndex >= images.length) { modalIndex = 0; }
            if (modalIndex < 0) { modalIndex = images.length - 1; }
            const modalImg = document.getElementById('modal-img');
            modalImg.src = images[modalIndex];
        }

        function changeModalImage(n) {
            modalIndex += n;
            if (modalIndex >= images.length) {
                modalIndex = 0;
            } else if (modalIndex < 0) {
                modalIndex = images.length - 1;
            }
            const modalImg = document.getElementById('modal-img');
            modalImg.src = images[modalIndex];
        }
