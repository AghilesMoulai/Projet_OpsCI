CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT,
  role TEXT
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title TEXT,
  director TEXT,
  genre TEXT,
  year INT,
  image_url TEXT,
  description TEXT

);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT,
  movie_id INT,
  rating INT,
  comment TEXT
);