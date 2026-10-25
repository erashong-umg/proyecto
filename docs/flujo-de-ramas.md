# Flujo de ramas y publicación

Cómo se trabaja y cómo llega un cambio a producción. Es un proyecto universitario con **un solo servidor** (un solo ambiente controlado), pero se trabaja con tres ramas permanentes para tener orden y visibilidad de qué está en cada etapa.

## Resumen

```
rama de trabajo ──PR──▶ develop ──PR──▶ release ──PR──▶ main ──▶ despliegue automático ──▶ tag vX.Y
(feature/… fix/…)     (integración)   (candidata)    (producción)
```

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

## 4. Qué rama manda

Regla: **manda la rama con el código más reciente, y las demás se alinean a ella en el orden `develop` → `release` → `main`.**

- Lo normal es que el código nuevo nazca en una rama de trabajo, entre a `develop` y suba. En ese caso la fuente es `develop`.
- Si alguna vez una rama inferior tuviera cambios que las otras no tienen (por ejemplo, un arreglo urgente), esa rama pasa a ser la fuente y se baja a las demás: se abre PR de ella a `develop` y de `develop` a `release`.
- Para saber si hay código distinto entre ramas, compara archivos, no commits:
  ```bash
  git fetch --all && git diff --name-only origin/develop origin/release origin/main
  ```
  Sin salida = el contenido es idéntico.

### Sincronizar después de publicar

Cada PR deja un commit de merge en su rama destino, así que tras publicar, `main` y `release` tienen commits de merge que `develop` no tiene (no es código). Para dejar el historial alineado, abre dos PR:

```bash
gh pr create --base develop --head main    --title "chore: sincroniza main en develop"
gh pr create --base release --head develop --title "chore: lleva a release el historial de main"
```

Siempre queda un commit de merge de diferencia (el del propio PR de sincronización): es inevitable con este flujo y no afecta al código.

## 5. Arreglo urgente

`main` está protegida, así que un arreglo urgente también pasa por una rama y un PR. Opciones:

- **Normal (recomendada):** rama `fix/…` desde `develop` → `develop` → `release` → `main`.
- **Muy urgente:** rama `fix/…` desde `main`, PR directo a `main` (quitando la protección un momento en *Settings → Branches* solo si no hubiera forma de abrir el PR) y después bajarlo a `develop` y `release` como indica la sección 4.

## 6. Buenas prácticas

- Un PR = una idea. Si crece, divídelo.
- No edites `release` ni `main` a mano; el único camino es el PR.
- No subas archivos de credenciales ni `.env` (están en `.gitignore`).
- Si algo se despliega mal, el job de *Deploy* falla (verifica la salud del backend y del frontend); no lo des por bueno sin ver el mensaje *Despliegue verificado*.
