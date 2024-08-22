// Initialisation des variables
let audioPlayer = new Audio();
let isPlaying = false;
let songs = [];
let currentIndex = 0;
let isShuffle = false;
let isRepeat = false;
let shuffledIndices = [];
let filteredIndices = [];
const volumeSlider = document.getElementById('volumeSlider');
const suggestionsContainer = document.getElementById('suggestions-container');
const suggestionsListElement = document.getElementById('suggestions-list');
const progressBar = document.getElementById('progressBar');
const titleElement = document.getElementById('title');
const artistElement = document.getElementById('artist');
const albumCoverElement = document.getElementById('album-cover');
const backgroundElement = document.getElementById('background');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsContent = document.getElementById('lyrics-content');
const volumeIcon = document.getElementById('volumeIcon');
const searchInput = document.getElementById('searchInput');
const playPauseButton = document.getElementById('playPauseButton');
const shuffleButton = document.getElementById('shuffleButton');
const repeatButton = document.getElementById('repeatButton');
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');
const lyricsClose = document.getElementById('lyrics-close');
const suggestionsClose = document.getElementById('suggestions-close');

// Fonction pour sauvegarder le volume
function saveVolumeState(volume) {
    localStorage.setItem('volume', volume);
}

// Fonction pour charger le volume sauvegardé
function loadVolumeState() {
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        audioPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = savedVolume * 100;
        updateVolumeIcon(audioPlayer.volume);
    }
}

// Met à jour l'icône du volume en fonction du niveau
function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.textContent = 'volume_off';
    } else if (volume < 0.5) {
        volumeIcon.textContent = 'volume_down';
    } else {
        volumeIcon.textContent = 'volume_up';
    }
}

// Fonction pour mettre à jour l'interface utilisateur
function updateUI(songDetails) {
    if (songDetails) {
        const { musicUrl, title, artist, thumbnailUrl, duration } = songDetails;
        titleElement.textContent = title;
        artistElement.textContent = artist;
        albumCoverElement.src = thumbnailUrl;
        backgroundElement.style.backgroundImage = `url('${thumbnailUrl}')`;
        audioPlayer.src = musicUrl;

        audioPlayer.ontimeupdate = () => {
            if (!isNaN(audioPlayer.duration)) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.value = progress;
                document.getElementById('time').textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
            }
        };

        audioPlayer.preload = 'auto';
        if (window.api) window.api.setActivity({ ...songDetails, duration });
    } else {
        titleElement.textContent = "Musique non disponible";
        artistElement.textContent = "";
        albumCoverElement.src = "";
        backgroundElement.style.backgroundImage = "";
        document.getElementById('time').textContent = "0:00 / 0:00";
        if (window.api) window.api.setActivity();
    }
}

// Fonction pour formater le temps
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fonction pour sauvegarder l'état
function saveState() {
    localStorage.setItem('currentIndex', currentIndex);
    localStorage.setItem('isPlaying', isPlaying);
    localStorage.setItem('currentTime', audioPlayer.currentTime);
    saveVolumeState(audioPlayer.volume);
}

// Fonction pour charger l'état
function loadState() {
    const savedIndex = localStorage.getItem('currentIndex');
    const savedIsPlaying = localStorage.getItem('isPlaying');
    const savedCurrentTime = localStorage.getItem('currentTime');

    if (savedIndex !== null) {
        currentIndex = parseInt(savedIndex, 10);
    }
    if (savedIsPlaying !== null) {
        isPlaying = savedIsPlaying === 'true';
    }
    if (savedCurrentTime !== null) {
        audioPlayer.currentTime = parseFloat(savedCurrentTime);
    }

    loadVolumeState();
}

// Fonction pour obtenir l'index suivant
function getNextIndex() {
    if (isShuffle) {
        if (shuffledIndices.length === 0) {
            shuffledIndices = Array.from({ length: songs.length }, (_, i) => i);
            shuffledIndices.sort(() => Math.random() - 0.5);
        }
        return shuffledIndices.pop();
    } else {
        return (currentIndex + 1) % songs.length;
    }
}

// Fonction pour lire une chanson
function playSong(index) {
    currentIndex = index;
    const songDetails = songs[index];
    updateUI(songDetails);

    Array.from(suggestionsListElement.children).forEach((element, i) => {
        element.classList.toggle('current-song', i === index);
    });

    audioPlayer.src = songDetails.musicUrl;
    audioPlayer.play().catch(error => {
        console.error('Erreur lors de la lecture automatique:', error);
    });

    saveState();
}

// Fonction pour afficher les paroles
function displayLyrics(lyrics) {
    lyricsContent.textContent = lyrics;
    lyricsContainer.classList.add('visible');
}

// Fonction pour masquer les paroles
function hideLyrics() {
    lyricsContainer.classList.remove('visible');
}

// Fonction pour filtrer les chansons
function filterSongs(query) {
    const searchResultsContainer = document.getElementById('searchResults');
    searchResultsContainer.innerHTML = '';

    filteredIndices = songs.map((song, index) => ({ song, index }))
        .filter(({ song }) => 
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );

    filteredIndices.forEach(({ song, index }) => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-item';

        const coverElement = document.createElement('img');
        coverElement.className = 'suggestion-cover';
        coverElement.src = song.thumbnailUrl;
        suggestionElement.appendChild(coverElement);

        const infoElement = document.createElement('div');
        infoElement.className = 'suggestion-info';

        const titleElement = document.createElement('div');
        titleElement.className = 'suggestion-title';
        titleElement.textContent = song.title;
        infoElement.appendChild(titleElement);

        const artistElement = document.createElement('div');
        artistElement.className = 'suggestion-artist';
        artistElement.textContent = song.artist;
        infoElement.appendChild(artistElement);

        suggestionElement.appendChild(infoElement);
        suggestionElement.addEventListener('click', () => playSong(index));
        searchResultsContainer.appendChild(suggestionElement);
    });

    searchResultsContainer.style.display = query ? 'block' : 'none';
}

// Fonction pour obtenir la chanson en cours de lecture
function getCurrentSong() {
    return songs[currentIndex]; // Retourne la chanson actuelle à partir de l'index courant
}
// Fonction pour récupérer les paroles d'une chanson à partir de l'URL fournie
async function fetchLyrics(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch lyrics');
        }
        const lyrics = await response.text();
        return lyrics;
    } catch (error) {
        console.error('Error fetching lyrics:', error.message);
        return 'Lyrics not available.';
    }
}

// Fonction pour afficher les paroles dans le conteneur
function displayLyrics(lyrics) {
    const lyricsContainer = document.getElementById('lyrics-container');
    const lyricsContent = document.getElementById('lyrics-content');
    lyricsContent.textContent = lyrics;
    lyricsContainer.classList.add('visible');
}

// Fonction pour masquer les paroles
function hideLyrics() {
    const lyricsContainer = document.getElementById('lyrics-container');
    lyricsContainer.classList.remove('visible');
}

// Fonction pour récupérer les chansons de la playlist
async function fetchPlaylistSongs() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Spoutnik-musique/test/main/Music.json');
        if (!response.ok) {
            throw new Error('Failed to fetch playlist songs');
        }
        const data = await response.json();
        return data.songs;
    } catch (error) {
        console.error('Error fetching playlist songs:', error.message);
        return [];
    }
}

// Gestionnaire d'événements lors du chargement du document
document.addEventListener('DOMContentLoaded', async () => {
    loadState();

    songs = await fetchPlaylistSongs();

    if (songs.length > 0) {
        playSong(currentIndex);
    }

    searchInput.addEventListener('input', () => filterSongs(searchInput.value));

    volumeSlider.addEventListener('input', (event) => {
        const volume = event.target.value / 100;
        audioPlayer.volume = volume;
        updateVolumeIcon(volume);
        saveVolumeState(volume);
    });

    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseButton.querySelector('.material-icons-outlined').textContent = 'play_arrow';
        } else {
            audioPlayer.play().catch(error => {
                console.error('Erreur lors de la lecture automatique:', error);
            });
            playPauseButton.querySelector('.material-icons-outlined').textContent = 'pause';
        }
        isPlaying = !isPlaying;
        saveState();
    });

    shuffleButton.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleButton.querySelector('.material-icons-outlined').textContent = isShuffle ? 'shuffle_on' : 'shuffle';
        if (isShuffle) shuffledIndices = [];
        saveState();
    });

    repeatButton.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatButton.querySelector('.material-icons-outlined').textContent = isRepeat ? 'repeat_on' : 'repeat';
        saveState();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = getNextIndex();
        playSong(currentIndex);
    });

    prevButton.addEventListener('click', () => {
        if (isShuffle) {
            currentIndex = shuffledIndices.length > 0 ? shuffledIndices.pop() : Math.floor(Math.random() * songs.length);
        } else {
            currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        }
        playSong(currentIndex);
    });

    progressBar.addEventListener('input', (event) => {
        const progress = event.target.value;
        if (!isNaN(audioPlayer.duration)) {
            audioPlayer.currentTime = (progress / 100) * audioPlayer.duration;
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;
        updateProgress();
    });

    audioPlayer.addEventListener('ended', () => {
        if (isRepeat) {
            playSong(currentIndex);
        } else {
            currentIndex = getNextIndex();
            playSong(currentIndex);
        }
        saveState();
    });

    document.addEventListener('swipedown', async () => {
        const currentSong = getCurrentSong();
        if (currentSong && currentSong.Parole) {
            const lyrics = await fetchLyrics(currentSong.Parole);
            displayLyrics(lyrics);
        } else {
            displayLyrics('Lyrics not available.');
        }
    });

    document.addEventListener('swipeup', hideLyrics);
    lyricsContainer.addEventListener('click', hideLyrics);

    const lyricsButton = document.getElementById('LyricsButton');

    lyricsButton.addEventListener('click', async () => {
        const currentSong = getCurrentSong();
        if (currentSong && currentSong.Parole) {
            const lyrics = await fetchLyrics(currentSong.Parole);
            displayLyrics(lyrics);
        } else {
            displayLyrics('Lyrics not available.');
        }
    });
    

    lyricsClose.addEventListener('click', hideLyrics);

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            startY = e.clientY;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentY = e.clientY;
            if (startY - currentY > 50) {
                suggestionsContainer.classList.add('visible');
            }
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.body.addEventListener('touchstart', (event) => {
        touchstartY = event.changedTouches[0].screenY;
    });

    document.body.addEventListener('touchend', (event) => {
        touchendY = event.changedTouches[0].screenY;
        if (touchendY < touchstartY - 50) {
            suggestionsContainer.classList.add('visible');
        }
    });

    suggestionsClose.addEventListener('click', () => {
        suggestionsContainer.classList.remove('visible');
    });

    function updateProgress() {
        const progress = progressBar.value;
        progressBar.style.background = `linear-gradient(to right, #ffffff77 ${progress}%, #33333352 ${progress}%)`;
    }

    updateProgress();
});
document.addEventListener('DOMContentLoaded', function() {
    const createPlaylistButton = document.getElementById('createPlaylistButton');
    const modal = document.getElementById('playlistModal');
    const closeButton = document.querySelector('.close');
    const saveButton = document.getElementById('savePlaylistButton');
    const playlistNameInput = document.getElementById('playlistName');

    // Ouvrir le modal
    createPlaylistButton.addEventListener('click', function() {
        modal.style.display = 'block';
    });

    // Fermer le modal
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fermer le modal en cliquant en dehors de la zone de contenu
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Enregistrer la playlist (juste un exemple de traitement)
    saveButton.addEventListener('click', function() {
        const playlistName = playlistNameInput.value.trim();
        if (playlistName) {
            alert(`Playlist "${playlistName}" créée !`);
            modal.style.display = 'none';
            // Vous pouvez ajouter ici la logique pour enregistrer la playlist
        } else {
            alert('Veuillez entrer un nom pour la playlist.');
        }
    });
});
