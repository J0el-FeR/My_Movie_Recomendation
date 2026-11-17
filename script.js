import {
    movieList,
    recommendations,
    fetchGridMovies,
    fetchRecommendations,
} from "./API.js"

const popup = document.querySelector("#popup")
const movieGrid = document.querySelector("#movie-grid")
const movieSearch = document.querySelector("#movie-search")
const noResults = document.querySelector("#no-results")
const carousel = document.querySelector("#carousel")
const carouselTrack = document.querySelector("#carousel-track")
const carouselStage = carousel.querySelector(".carousel-stage")
const carouselWindow = carousel.querySelector(".carousel-window")

let position = 0
let halfWidth = 0
let mouseOver = false
let pressed = false
let dragging = false
let dragMoved = false
let startX = 0
let startPosition = 0
let resumeAt = 0
let pendingShift = 0
let lastTime = 0
let movies = []
let recommended = []
let lastRandom = null


function openMovie(movie) {
    const year = movie.releaseInfo ? ` (${movie.releaseInfo})` : ""
    const popupImg = popup.querySelector(".popup-img")
    const ratingValue = popup.querySelector(".rating-value")

    popupImg.src = movie.poster
    popupImg.alt = `Poster of ${movie.name}`
    popup.querySelector(".popup-media").style.setProperty(
        "--poster",
        `url(${JSON.stringify(movie.poster)})`,
    )
    popup.querySelector(".popup-title").textContent = movie.name + year
    popup.querySelector(".popup-text").textContent = movie.description ?? ""
    const imdbId = movie.imdb_id ?? movie.id
    const hasRating =
        Boolean(movie.imdbRating) && String(imdbId).startsWith("tt")
    popup.querySelector(".popup-rating").hidden = !hasRating
    if (hasRating) {
        ratingValue.textContent = movie.imdbRating
        popup.querySelector(".popup-rating").href = `https://www.imdb.com/title/${imdbId}/`
    }

    popup.showModal()
}