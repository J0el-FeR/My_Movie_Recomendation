const popup = document.querySelector('#popup');
const popupMedia = popup.querySelector('#popup-media');
const popupImg = popup.querySelector('#popup-img');
const popupTitle = popup.querySelector(`.popup-title`);
const popupText = document.querySelector('#popup-text');
const popupRating = document.querySelector('#popup-rating');
const ratingValue = popup.querySelector(`.rating-value`);

const RECOMMENDATIONS = [
    "tt12042730",
    "tt6966692",
    "tt9362722",
    "tt2084970",
    "tt33764258",
    "tt35538033",
    "tt22084616",
    "tt0816692",
    "tt0145660",
    "tt0118655",
    "tt0295178",
    "tt0230011",
    "tt0133240",
    "tt0121766",
    "tt0165982",
];

const MOVIE_GRID = [
    "tt12042730",
    "tt6966692",
    "tt9362722",
    "tt2084970",
    "tt33764258",
    "tt35538033",
    "tt22084616",
    "tt0816692",
    "tt0145660",
    "tt0118655",
    "tt0295178",
    "tt0230011",
    "tt37287335",
];

const RATING_ICON = "images/imdb.svg";
ratingIcon.addEventListener("error", () =>
    popupRating.classList.add("icon-missing"),
);
ratingIcon.src = RATING_ICON;
function openMovie(movie) {
    const year = movie.releaseInfo ? ` (${movie.releaseInfo})` : "";

    popupImg.src = movie.poster;
    popupImg.alt = `Poster of ${movie.name}`;
    popupMedia.style.setProperty(
        "--poster",
        `url(${JSON.stringify(movie.poster)})`,
    );
    popupTitle.textContent = movie.name + year;
    popupText.textContent = movie.description ?? "";
    const imdbId = movie.imdb_id ?? movie.id;
    const hasRating =
        Boolean(movie.imdbRating) && String(imdbId).startsWith("tt");
    popupRating.hidden = !hasRating;
    if (hasRating) {
        ratingValue.textContent = movie.imdbRating;
        popupRating.href = `https://www.imdb.com/title/${imdbId}/`;
    }

    popup.showModal();
}