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