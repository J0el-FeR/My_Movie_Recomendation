const api_url = "https://v3-cinemeta.strem.io/meta/movie"

export const recommendations = [
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
]

export const movieList = [
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
]

async function fetchMovie(id) {
    const response = await fetch(`${api_url}/${id}.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()).meta
}

async function fetchMovies(ids, label) {
    const results = await Promise.allSettled(ids.map(fetchMovie))
    const movies = []

    results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value?.poster)
            movies.push(result.value)
        else
            console.warn(
                `${label} ${ids[i]} was skipped (not found, or no poster)`,
            )
    })

    return movies
}

export function fetchGridMovies() {
    return fetchMovies(movieList, "Grid movie")
}

export function fetchRecommendations() {
    return fetchMovies(recommendations, "Recommendation")
}

