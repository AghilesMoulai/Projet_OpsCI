/**
 * Donn&eacute;es "cod&eacute;es en dur" (locales) pour tester l'affichage.
 * IMPORTANT :
 * - Remplacez les champs "image" par les vrais noms de fichiers plac&eacute;s dans /images
 * - Exemple : images/inception.jpg
 */
/*const movies = [
  {
    title: "Inception",
    director: "Christopher Nolan",
    description: "Un thriller de science-fiction sur les r&ecirc;ves et la manipulation de l'esprit.",
    image: "images/inception.jpeg"
  },
  {
    title: "Interstellar",
    director: "Christopher Nolan",
    description: "Un voyage spatial pour sauver l'humanit&eacute; face &agrave; une Terre en crise.",
    image: "images/interstellar.jpeg"
  },
  {
    title: "The Matrix",
    director: "Lana Wachowski, Lilly Wachowski",
    description: "Un hacker d&eacute;couvre la v&eacute;rit&eacute; sur la r&eacute;alit&eacute; et rejoint une r&eacute;bellion.",
    image: "images/the_matrix.jpeg"
  },
  {
    title: "Parasite",
    director: "Bong Joon-ho",
    description: "Une satire sociale o&ugrave; une famille s'infiltre progressivement chez une autre.",
    image: "images/parasite.jpeg"
  },
  {
    title: "Spirited Away",
    director: "Hayao Miyazaki",
    description: "Une aventure fantastique dans un monde d'esprits o&ugrave; une jeune fille cherche &agrave; sauver ses parents.",
    image: "images/spirited_away.jpeg"
  }
];*/

const container = document.getElementById("movies");

async function loadMovies(limit = 5) {
  const res = await fetch(`http://127.0.0.1:8000/movies?limit=${limit}`);
  const movies = await res.json();
  
  /**
   * Génère les cartes de films dans la page.
   */
  movies.forEach(movie => {
    const card = document.createElement("article");
    card.className = "card";

    const imageUrl = `http://127.0.0.1:8000${movie.image_url}`;

    card.innerHTML = `
      <img src="${imageUrl}" alt="${movie.title}">
      <div class="card-content">
        <h2>${movie.title}</h2>
        <p class="meta"><strong>R&eacute;alisateur :</strong> ${movie.director}</p>
        <p class="desc">${movie.description}</p>
      </div>
    `;
    container.appendChild(card);

  });


}


loadMovies(10)