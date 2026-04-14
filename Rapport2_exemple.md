# Rapport – TME 2 : Conception et mise en place d’une application Web

## Introduction

Ce TME a pour objectif de nous initier à une démarche réaliste de conception et de développement d’une application web complète. L’enjeu principal n’est pas uniquement de produire du code fonctionnel, mais de comprendre et justifier les choix techniques effectués, comme cela est attendu dans un contexte professionnel.

L’application réalisée repose sur une architecture simple **front-end / back-end**, où le back-end expose une API HTTP permettant de fournir des données, et le front-end consomme ces données afin de les afficher dynamiquement.

---

## 1. Architecture et conception

### 1.1 Étude des architectures existantes

#### Architecture monolithique

Dans une architecture monolithique, toutes les composantes de l’application (interface, logique métier, accès aux données) sont regroupées dans un seul bloc.

* **Avantages** : simplicité de mise en place, facilité de déploiement.
* **Limites** : faible évolutivité, maintenance difficile lorsque l’application grandit.
* **Cas d’usage** : petites applications, prototypes.

#### Architecture client–serveur

Cette architecture sépare clairement le client (front-end) et le serveur (back-end), qui communiquent via un réseau.

* **Avantages** : séparation des responsabilités, meilleure maintenabilité.
* **Limites** : dépendance au réseau, gestion des communications.
* **Cas d’usage** : applications web, mobiles, APIs.

#### Architecture en couches (layered architecture)

L’application est organisée en plusieurs couches (présentation, logique métier, accès aux données).

* **Avantages** : clarté, facilité de test et d’évolution.
* **Limites** : parfois plus verbeuse pour de petits projets.
* **Cas d’usage** : applications d’entreprise, APIs structurées.

#### Architecture microservices

L’application est découpée en plusieurs services indépendants.

* **Avantages** : forte scalabilité, indépendance des services.
* **Limites** : complexité élevée, surdimensionnée pour de petits projets.
* **Cas d’usage** : grandes plateformes, systèmes distribués.

---

### 1.2 Étude des design patterns

#### MVC (Model – View – Controller)

Ce pattern sépare les données (Model), l’affichage (View) et la logique de contrôle (Controller).

* **Problème résolu** : mélange des responsabilités.
* **Avantages** : code plus clair, maintenance facilitée.
* **Limites** : peut être excessif pour de très petits projets.

#### Repository Pattern

Il isole l’accès aux données du reste de l’application.

* **Problème résolu** : dépendance forte à la source de données.
* **Avantages** : facilité de changement de source (JSON, base de données).
* **Limites** : ajout d’une couche supplémentaire.

#### Singleton

Garantit une instance unique d’un objet.

* **Avantages** : contrôle global.
* **Limites** : couplage fort, tests plus complexes.

---

### 1.3 Choix retenus et justification

Pour ce projet, nous avons retenu :

* une **architecture client–serveur**, adaptée aux applications web modernes ;
* une **architecture en couches légère** côté back-end ;
* le pattern **MVC** de manière simplifiée.

Ces choix sont cohérents avec la taille du projet, tout en restant proches des pratiques professionnelles. Les microservices n’ont pas été retenus car ils introduisent une complexité inutile pour une application simple.

---

### 1.4 Conception finale de l’application

L’application est composée de :

* un **front-end** : interface utilisateur en HTML/CSS/JavaScript ;
* un **back-end** : API HTTP développée avec FastAPI ;
* des **données** : stockées dans un fichier JSON simulant une base de données.

Le front-end agit comme un client qui consomme l’API exposée par le back-end.

---

## 2. Back-end et API

### 2.1 Étude comparative des langages back-end

| Langage              | Points forts                                         | Limites                                     | Cas d’usage                   |
| -------------------- | ---------------------------------------------------- | ------------------------------------------- | ----------------------------- |
| Python               | Facile à apprendre, très productif, grand écosystème | Moins performant que les langages compilés  | APIs, data, prototypage       |
| Java                 | Très robuste, largement utilisé en entreprise        | Verbeux, courbe d’apprentissage plus élevée | Applications d’entreprise     |
| JavaScript (Node.js) | Un seul langage front/back, rapide                   | Gestion asynchrone parfois complexe         | APIs, applications temps réel |

**KPI utilisés** : facilité d’apprentissage, productivité, écosystème, marché de l’emploi.

### 2.2 Choix du langage et framework

Python a été retenu pour sa simplicité et sa productivité. Le framework **FastAPI** permet de créer rapidement des APIs performantes et bien documentées.

---

### 2.3 Notion d’API

Une API (Application Programming Interface) permet à des applications de communiquer entre elles. Dans ce projet, l’API utilise le protocole HTTP et expose des endpoints (`/hello`, `/movies`) qui retournent des réponses au format JSON.

---

### 2.4 Environnement virtuel

Un environnement virtuel Python permet d’isoler les dépendances d’un projet.

* Il évite les conflits entre versions de bibliothèques.
* Il garantit la reproductibilité du projet.
* En entreprise, il permet de travailler sur plusieurs projets sans interférences.

---

### 2.5 Format JSON

JSON (JavaScript Object Notation) est un format léger d’échange de données.

* Lisible par l’humain et la machine.
* Indépendant du langage.
* Très utilisé dans les APIs web.

Autres formats :

* **CSV** : échanges simples de données tabulaires.
* **XML** : formats complexes et structurés.
* **YAML** : fichiers de configuration.

---

## 3. Front-end

### 3.1 Étude des technologies front-end

| Technologie | Avantages                              | Limites                                 |
| ----------- | -------------------------------------- | --------------------------------------- |
| HTML/CSS/JS | Simple, léger, aucune dépendance       | Moins structuré pour les grands projets |
| React       | Très utilisé, composants réutilisables | Courbe d’apprentissage plus élevée      |

**Choix retenu** : HTML/CSS/JavaScript, suffisant pour un projet simple et pédagogique.

---

### 3.2 Interface réalisée

L’interface affiche une liste de films sous forme de cartes avec image, titre, réalisateur et description. Elle est conçue pour être facilement connectée à une API.

---

## 4. Communication front-end / back-end

### 4.1 CORS

CORS (Cross-Origin Resource Sharing) est un mécanisme de sécurité des navigateurs empêchant des requêtes entre origines différentes.

Le problème a été résolu en configurant le serveur FastAPI pour autoriser explicitement l’origine du front-end.

---

### 4.2 Chargement dynamique des données

Le front-end utilise des requêtes HTTP pour récupérer les films depuis l’API. Les données JSON reçues sont ensuite utilisées pour générer dynamiquement l’affichage.

Les images sont servies par le back-end via des fichiers statiques, et le front utilise les URLs fournies par l’API.

---

### 4.3 Répartition des traitements

* **Serveur** : filtrage, limitation, sécurité, validation.
* **Client** : affichage, interactions utilisateur.

Cette séparation permet d’assurer la cohérence et la sécurité des données.

---

### 4.4 Bonnes pratiques API

Une bonne API se caractérise par :

* des routes claires et cohérentes ;
* l’utilisation correcte des codes HTTP ;
* des formats de réponse homogènes ;
* une gestion propre des erreurs.

Ces principes ont été appliqués dans notre API (routes REST, limitation des données, réponses JSON claires).

---

## Conclusion

Ce TME nous a permis de comprendre les différentes étapes nécessaires à la conception d’une application web moderne. Au-delà de l’implémentation technique, l’accent a été mis sur la réflexion, la justification des choix et la documentation, des compétences essentielles en contexte professionnel.

Ce projet constitue une base solide pour les TME suivants, où l’application pourra être enrichie et améliorée.
