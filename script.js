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