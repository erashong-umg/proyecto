# Flujo de ramas y publicación

Cómo se trabaja y cómo llega un cambio a producción. Es un proyecto universitario con **un solo servidor** (un solo ambiente controlado), pero se trabaja con tres ramas permanentes para tener orden y visibilidad de qué está en cada etapa.

## Resumen

**De hoy en adelante, todo cambio sigue siempre este camino, en un solo sentido y sin excepciones:**

```
local ──▶ feature/* ──PR──▶ develop ──PR──▶ release ──PR──▶ main ──▶ despliegue automático ──▶ tag vX.Y
(tu máquina) (rama de trabajo)  (integración)   (candidata)    (producción)
```

El código nunca baja: no se trae nada de `main` ni de `release` hacia `develop`. Todo nace en una rama de trabajo y sube por las tres ramas, en ese orden.

| Rama | Para qué sirve | Quién escribe en ella |
|---|---|---|
| `develop` | Integración: aquí entra todo primero. | Solo PR desde una rama de trabajo. |
| `release` | Candidata a publicar; se puede probar en el servidor sin tocar `main`. | Solo PR desde `develop`. **Protegida.** |
| `main` | Lo que está en producción (rama por defecto). | Solo PR desde `release`. **Protegida.** |

`main` y `release` tienen protección de rama: **pull request obligatorio**, sin push directo (tampoco para administradores), sin force-push y sin poder borrarse. No exigen aprobaciones, así que quien abre el PR puede integrarlo.

## 1. Trabajar un cambio

1. Parte siempre de `develop` actualizado y crea una rama con un prefijo que diga qué es:
   `feature/…` (funcionalidad), `fix/…` (arreglo), `docs/…`, `chore/…` (mantenimiento), `ci/…` (workflows).
   ```bash
   git switch develop && git pull
   git switch -c fix/modal-foco
   ```
2. Haz commits pequeños con mensaje convencional en español: `tipo(ámbito): qué cambia`
   (por ejemplo `fix(ui): el Modal ya no roba el foco a cada tecla`), y en el cuerpo **por qué**.
3. Antes del PR, verifica en local (los tres deben pasar):
   ```bash
   cd backend-express && npx tsc --noEmit && npm test
   cd ../frontend-react && npx tsc -b --noEmit && npx vite build
   ```
4. Sube la rama y abre el PR **hacia `develop`** (la base por defecto del repositorio es `main`, así que hay que indicarla):
   ```bash
   git push -u origin fix/modal-foco
   gh pr create --base develop --head fix/modal-foco --title "…" --body "…"
   ```
5. Integra el PR con **merge commit** (no squash ni rebase, para conservar el historial) y borra la rama de trabajo.

## 2. Publicar una versión

Cada tramo es un PR; ninguno se salta:

1. `develop` → `release`: `gh pr create --base release --head develop …`
2. `release` → `main`: `gh pr create --base main --head release …`
3. Al integrar en `main` **se despliega solo** (workflow *Deploy*). El job debe terminar con *Despliegue verificado*.
4. Comprueba producción: `https://<DOMAIN>/api/version` debe mostrar la rama `main` y el commit nuevo.
5. Etiqueta la versión sobre `main` (el badge de versión y `/api/version` la usan):
   ```bash
   git fetch --tags && git tag -a v1.4 origin/main -m "Release 1.4: …"
   git push origin v1.4
   ```
   Convención: `vMAYOR.MENOR` para una versión con funcionalidad nueva y `vMAYOR.MENOR.PARCHE` para un arreglo.

Mientras no haya tag nuevo, la versión se muestra como el último tag más el commit (`v1.3.1+abc1234`).

## 3. Probar una rama en el servidor antes de publicar

**Actions → Deploy → Run workflow**, y en la lista *Rama a desplegar* elige `develop`, `release` o `main`. Es útil para probar `release` antes de integrarla en `main`.

- El servidor corre siempre **lo último que se haya desplegado**, sea cual sea la rama. Para dejar producción estable, vuelve a lanzar el workflow con `main`.
- El badge de versión (abajo a la izquierda) y `/api/version` indican qué rama y commit están corriendo, y avisan si frontend y backend no coinciden.
- Solo corre un despliegue a la vez.

## 4. Un solo sentido, siempre

- Todo cambio, **también un arreglo urgente**, nace en una rama de trabajo (`feature/…`, `fix/…`, …) y recorre `develop` → `release` → `main`. No hay atajos ni caminos de vuelta.
- **No se hacen PR "hacia atrás"** (`main` → `develop`, `release` → `develop`). Tras publicar, las ramas quedan con commits de merge distintos: es lo normal con este flujo y **no se corrige**, porque no hay código distinto.
- Para saber si dos ramas difieren de verdad, compara **archivos**, no commits:
  ```bash
  git fetch --all && git diff --name-only origin/develop origin/release origin/main
  ```
  Sin salida = el contenido es idéntico.

> **Nota histórica.** El 25-oct-2026 se hizo **una única vez** una sincronización (`main` → `develop` → `release`) para aplanar incongruencias de historial que venían de los primeros días del proyecto. Fue una corrección puntual, no forma parte del flujo y no se repite.

## 5. Arreglos urgentes

Siguen el mismo camino que cualquier cambio: rama `fix/…` desde `develop` y un PR por tramo hasta `main`. Si hay prisa, los tres PR se pueden abrir e integrar seguidos; lo que no se hace es escribir directo en `release` o `main` (están protegidas) ni saltarse un tramo.

## 6. Buenas prácticas

- Un PR = una idea. Si crece, divídelo.
- No edites `release` ni `main` a mano; el único camino es el PR.
- No subas archivos de credenciales ni `.env` (están en `.gitignore`).
- Si algo se despliega mal, el job de *Deploy* falla (verifica la salud del backend y del frontend); no lo des por bueno sin ver el mensaje *Despliegue verificado*.
