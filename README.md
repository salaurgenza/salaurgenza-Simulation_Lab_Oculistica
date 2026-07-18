# SIMULATION LAB LIGHT · GitHub Ready

Questa è la versione corretta per GitHub Pages.

## File principali

- `index.html` = simulatore principale
- `tavolo-servitore.html` = gioco/tavolo strumenti
- `css/style.css` = grafica
- `js/app.js` = logica
- `assets/images/` = immagini esterne
- `assets/models/` = modello 3D esterno

## Importante

Su GitHub Pages deve esserci `index.html` nella root del repository.

Quindi carica il CONTENUTO di questa cartella, non la cartella chiusa dentro un'altra cartella.

Struttura corretta nel repository:

```text
index.html
tavolo-servitore.html
css/style.css
js/app.js
assets/images/...
assets/models/...
```

## Collegamenti

- Aprendo il sito, parte `index.html`, cioè il simulatore principale.
- Il pulsante `TAVOLO SERVITORE · 3D` apre `tavolo-servitore.html`.
- Da `tavolo-servitore.html` puoi tornare a `index.html`.

## Test locale

Apri il terminale nella cartella e usa:

```bash
python3 -m http.server 8765
```

Poi apri:

```text
http://localhost:8765
```
