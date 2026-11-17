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
const mystery = document.querySelector("#mystery")
const mysteryReveal = document.querySelector("#mystery-reveal")
const mysteryAnother = document.querySelector("#mystery-another")
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
const closePopup = () => closeDialog(popup)
const carouselMinItens = recommendations.length
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

new ResizeObserver(() => {
    const listPoster = movieGrid.querySelector(".thumb")
    if (listPoster) {
        carousel.style.setProperty(
            "--poster-width",
            `${listPoster.getBoundingClientRect().width}px`,
        )
    }
}).observe(movieGrid)

new ResizeObserver(([entry]) => {
    halfWidth = entry.contentRect.width / 2
}).observe(carouselTrack)

function wrap(value) {
    const remainder = value % halfWidth
    return remainder > 0 ? remainder - halfWidth : remainder
}

function moveCarousel(time) {
    const seconds = Math.min((time - lastTime) / 1000, 0.1)
    lastTime = time

    const autoMoving =
        !pressed &&
        !mouseOver &&
        !popup.open &&
        !reducedMotion.matches &&
        time >= resumeAt
    if (autoMoving) position += 55 * seconds
    if (Math.abs(pendingShift) > 0.5) {
        const part = pendingShift * Math.min(1, seconds * 8)
        position += part
        pendingShift -= part
    } else {
        position += pendingShift
        pendingShift = 0
    }

    if (halfWidth > 0) {
        position = wrap(position)
        carouselTrack.style.translate = `${position}px 0`
    }
    requestAnimationFrame(moveCarousel)
}

requestAnimationFrame(moveCarousel)
carouselStage.addEventListener("pointerenter", (event) => {if (event.pointerType === "mouse") mouseOver = true})
carouselStage.addEventListener("pointerleave", (event) => {if (event.pointerType === "mouse" && !dragging) mouseOver = false})

carouselWindow.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return
    pressed = true
    dragMoved = false
    pendingShift = 0
    startX = event.clientX
    startPosition = position
})

carouselWindow.addEventListener("pointermove", (event) => {
    if (!pressed) return

    const distance = event.clientX - startX
    if (!dragging && Math.abs(distance) < 5) return

    if (!dragging) {
        dragging = true
        dragMoved = true
        carouselWindow.setPointerCapture(event.pointerId)
        carouselWindow.classList.add("is-dragging")
    }
    position = startPosition + distance
})

function endDrag(event) {
    const dragDelay = 2000
    if (!pressed) return
    pressed = false

    if (dragging) {
        dragging = false
        carouselWindow.classList.remove("is-dragging")

        if (event.pointerType === "mouse") {
            mouseOver = carouselStage.matches(":hover")
        } else {
            resumeAt = performance.now() + dragDelay
        }
    }

    setTimeout(() => {
        dragMoved = false
    })
}

carouselWindow.addEventListener("pointerup", endDrag)
carouselWindow.addEventListener("pointercancel", endDrag)

function nudgeCarousel(direction) {
    const dragDelay = 2000
    const shift = direction * carouselWindow.clientWidth * 0.8

    if (reducedMotion.matches) position += shift
    else pendingShift += shift

    resumeAt = performance.now() + dragDelay
}

carousel
    .querySelector(".carousel-btn-prev")
    .addEventListener("click", () => nudgeCarousel(1))
carousel
    .querySelector(".carousel-btn-next")
    .addEventListener("click", () => nudgeCarousel(-1))
carouselTrack.addEventListener("dragstart", (event) => event.preventDefault())

function showCollection(term = "") {
    const search = term.trim().toLowerCase()
    const list = search
        ? movies.filter((movie) => movie.name.toLowerCase().includes(search))
        : movies

    movieGrid.replaceChildren(
        ...list.map((movie) => createThumb(movie, movies.indexOf(movie))),
    )
    document.querySelector("#no-results").hidden = list.length > 0
}

async function loadMovies() {
    setMysteryButtons(true)
    document.querySelector("#no-results").hidden = true
    movieGrid.replaceChildren(statusMessage("Loading moviesâ€¦"))

    movies = await fetchGridMovies()

    if (movies.length === 0) {
        console.error("Cinemeta request failed: no grid movies were loaded")
        movieGrid.replaceChildren(statusMessage("Couldnâ€™t load the movies.", true))
        return
    }

    showCollection(movieSearch.value)
    setMysteryButtons(false)
}

async function loadRecommendations() {
    carousel.hidden = true

    recommended = await fetchRecommendations()

    if (recommended.length > 0) renderCarousel()
}

function openOnClick(container, getMovies) {
    container.addEventListener("click", (event) => {
        if (dragMoved) return

        const thumb = event.target.closest(".thumb")
        if (thumb) openMovie(getMovies()[thumb.dataset.index])
    })
}

openOnClick(movieGrid, () => movies)
openOnClick(carouselTrack, () => recommended)
openOnClick(document.querySelector("#mystery-result"), () => movies)

movieSearch.addEventListener("input", () => showCollection(movieSearch.value))

function setMysteryButtons(disabled) {
    mysteryReveal.disabled = disabled
    mysteryAnother.disabled = disabled
}

function pickRandomMovie() {
    let mysteryMovies = movieList.length
    const watched = movies.slice(0, mysteryMovies)

    let movie
    do {
        movie = watched[Math.floor(Math.random() * watched.length)]
    } while (watched.length > 1 && movie === lastRandom)

    lastRandom = movie
    return movie
}

function showMysteryMovie(movie) {
    const year = movie.releaseInfo ? ` (${movie.releaseInfo})` : ""

    const title = document.createElement("p")
    title.className = "mystery-title"
    title.textContent = movie.name + year

    document.querySelector("#mystery-result").replaceChildren(
        createThumb(movie, movies.indexOf(movie)),
        title,
    )
}

async function revealMystery() {
    const CURTAIN_TIME = 800
    if (movies.length === 0) return
    setMysteryButtons(true)

    if (mystery.classList.contains("is-open")) {
        mystery.classList.remove("is-open")
        await wait(CURTAIN_TIME)
    }

    showMysteryMovie(pickRandomMovie())
    mystery.classList.add("has-revealed", "is-open")
    setMysteryButtons(false)
}