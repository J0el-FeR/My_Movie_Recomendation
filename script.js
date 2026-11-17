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

function createThumb(movie, index) {
    const img = document.createElement("img")
    img.src = movie.poster
    img.alt = `Poster of ${movie.name}`
    img.loading = "lazy"

    const thumb = document.createElement("button")
    thumb.className = "thumb"
    thumb.type = "button"
    thumb.dataset.index = index
    thumb.append(img)
    return thumb
}

function statusMessage(text, withRetry = false) {
    const message = document.createElement("p")
    message.className = "status"
    message.textContent = text

    if (withRetry) {
        const retry = document.createElement("button")
        retry.type = "button"
        retry.textContent = "Try again"
        retry.addEventListener("click", loadMovies)
        message.append(retry)
    }
    return message
}

function closeDialog(dialog) {
    if (!dialog.open || dialog.classList.contains("is-closing")) return

    const finish = () => {
        dialog.classList.remove("is-closing")
        dialog.close()
    }

    dialog.classList.add("is-closing")

    if (getComputedStyle(dialog).animationName === "none") {
        finish()
    } else {
        dialog.addEventListener("animationend", finish, {once: true})
    }
}

function renderCarousel() {
    const indexes = recommended.map((_, i) => i)

    while (indexes.length < carouselMinItens) {
        indexes.push(...indexes.slice(0, carouselMinItens - indexes.length))
    }

    const items = indexes.map((i) => createThumb(recommended[i], i))
    const copy = indexes.map((i) => {
        const thumb = createThumb(recommended[i], i)
        thumb.tabIndex = -1
        thumb.setAttribute("aria-hidden", "true")
        return thumb
    })

    carouselTrack.replaceChildren(...items, ...copy)
    carousel.hidden = false
}