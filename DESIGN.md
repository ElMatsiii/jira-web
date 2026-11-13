# Design System: Project Aurora — Crema & Navy (Stitch MCP)

Este documento especifica el sistema de diseño extraído directamente desde el proyecto **Project Aurora** en Stitch MCP, adaptado a la aplicación Jira AI.

---

## 1. Filosofía de Color y Superficies

La interfaz adopta una estética editorial cálida y serena basada en **lienzo color crema** contrastado con **azul navy profundo y toques de arena/ocre**:

* **Color Predominante (Lienzo Base)**: `#F5F1E8` / `#F5F1E9` (Crema cálido pergamino, sustituye al blanco puro en todo el fondo).
* **Superficies Secundarias (Paneles / Columnas / Barras)**: `#FBF8F2` (Crema claro luminoso) y `#EDE8DF` (Contenedores crema).
* **Tarjetas Elevadas**: `#FFFFFF` con sutil contorno crema `#E6E0D5` y sombra ultra suave `rgba(13, 23, 42, 0.04)`.
* **Superficies de Entrada / Formularios**: `#FBF8F2` o `#FFFFFF` con borde `#E6E0D5`. Focus en `#0D172A`.
* **Bordes y Divisores**:
  * Sutiles: `#E6E0D5` (1px)
  * Prominentes / Hover: `#D1C9BC` (1px)
* **Texto**:
  * Títulos y Texto Principal: `#0D172A` (Azul Navy profundo)
  * Texto Secundario: `#334155`
  * Texto Muted / Metadatos: `#5F6B7E`
  * Texto Sutil: `#8A96A6`

---

## 2. Paleta de Acento y Botones

* **Primario (Azul Navy)**: `#0D172A`
  * Botones principales y pestañas activas de navegación.
  * Texto en contraste: `#FBF8F2` (Crema).
  * Hover: `#1E293B`.
* **Secundario / Acento Arena**: `#8C6A48` / `#8B6535`
  * Puntos indicadores, badges de épicas, acentos visuales y destacados.
* **Terciario / Acento Sabia (Forest Sage)**: `#2F5D50`
  * Estados asistidos por IA, indicadores de sincronización operativa.
* **Estados Semánticos**:
  * *Por Hacer (To Do)*: Fondo `#EDE8DF`, Texto `#5F6B7E`, Borde `#D1C9BC`
  * *En Progreso (In Progress)*: Fondo `#EDE8DF`, Texto `#0D172A`, Borde `#0D172A`
  * *En Revisión (In Review)*: Fondo `#FAF3EA`, Texto `#8C6A48`, Borde `#E5DFD5`
  * *Completado (Done)*: Fondo `#E8F5E9`, Texto `#2E7D32`, Borde `#C8E6C9`
  * *Bloqueado / Error*: Fondo `#FFEBEE`, Texto `#D32F2F`, Borde `#FFCDD2`

---

## 3. Tipografía

* **Encabezados Editoriales (`--font-headline`)**: `Newsreader`, Georgia, serif (Pesos 500, 600, 700). Proporciona autoridad visual y elegancia.
* **Cuerpo e Interfaz (`--font-body`)**: `Plus Jakarta Sans`, `Inter`, sans-serif (Pesos 400, 500, 600). Alta legibilidad en paneles densos.
* **Códigos e Identificadores (`--font-mono`)**: `JetBrains Mono`, monospace (Pesos 500, 600) con `font-variant-numeric: tabular-nums`.

---

## 4. Contenedores y Estructura Shell

* **Cabecera (`.navbar`)**: Altura 56px, fondo `#FBF8F2`, borde inferior `#E6E0D5`.
* **Barra Lateral (`.app-sidebar`)**: Ancho 240px, fondo `#FBF8F2`, borde derecho `#E6E0D5`.
* **Pestaña Activa (`.sidebar-nav-item.active`)**: Fondo `#0D172A`, texto `#FBF8F2`, punto de estado `#8C6A48`.
* **Lienzo Principal (`.app-main-viewport`)**: Fondo `#F5F1E8` (Crema base predominante).
* **Columnas Kanban (`.kanban-col`)**: Fondo `#FBF8F2`, borde `#E6E0D5`, esquinas redondeadas 12px.
* **Tarjetas Kanban (`.kanban-card`)**: Fondo `#FFFFFF`, borde `#E6E0D5`, esquinas 8px.
