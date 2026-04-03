const CACHE_NAME = 'chrono-ferme-v1';
// Liste des fichiers à sauvegarder pour le mode hors-ligne
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// 1. Installation : l'appli télécharge les fichiers dans la "boîte de secours"
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 2. Interception : si on demande un fichier, on regarde si on l'a en secours
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});