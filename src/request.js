const API_KEY = "3727ce6bad74233e00d0e60d30b4a5cb";

const request = {
  fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=en-US`,
  fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_network=213`,
  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchActionMovies: `/discover/movie?api_key=${API_KEY}&genres=28`,
  fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&genres=5475`,
  fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&genres=75405`,
  fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&genres=35800`,
  fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&genres=3652`,
};

export default request;
