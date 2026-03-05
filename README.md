<div align="center">

# 📖 Lingo

**Aprende inglés leyendo historias.**

Lingo es una aplicación móvil para aprender inglés como segundo idioma a través de la lectura activa y el repaso inteligente de vocabulario. Diseñada para hispanohablantes que quieren ir más allá de las apps tradicionales de flashcards, Lingo combina narrativa, audio, gamificación y spaced repetition en una experiencia fluida e inmersiva.

[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.io/)
[![Ionic](https://img.shields.io/badge/Ionic-8-blue?logo=ionic)](https://ionicframework.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20%7C%20iOS-black?logo=capacitor)](https://capacitorjs.com/)

</div>


## 🚀 Estado actual — MVP


| Módulo | Estado |
|---|---|
| Autenticación | ✅ Funcional |
| Onboarding personalizado (nivel, intereses, meta diaria) | ✅ Funcional |
| Lector de historias con vocabulario interactivo | ✅ Funcional |
| Audio TTS (texto a voz) por escena con resaltado de palabras | ✅ Funcional |
| Tarjeta de vocabulario con definición en español | ✅ Funcional |
| Motor de repaso espaciado SM-2 (Vocab page) | ✅ Funcional |
| Quiz por historia (4 preguntas por historia) | ✅ Funcional |
| Registro de sesión diaria (minutos, XP, palabras) | ✅ Funcional |
| Progreso por historia (porcentaje de lectura) | ✅ Funcional |
| Dashboard con meta diaria y racha (streak) | ✅ Funcional |
| Perfil con estadísticas semanales (gráfico de barras) | ✅ Funcional |
| Base de datos segura con RLS (Row Level Security) | ✅ Funcional |
| App nativa Android/iOS vía Capacitor | ✅ Funcional |

---

## 📲 Descarga y Pruebas

Para probar la aplicación en un dispositivo Android real, puedes descargar el instalador APK directamente:

> [!IMPORTANT]
> **[Descargar Lingo APK (v0.0.1)](https://github.com/Juliodvp29/lingo/releases/download/v0.0.1/Lingo-v0.0.1.apk)**
> *(Nota: Es posible que Android te pida habilitar "Instalar apps de fuentes desconocidas" ya que no está en la Play Store aún).*

---

## 🏗️ Arquitectura técnica

### Stack

| Capa | Tecnología |
|---|---|
| Framework móvil | **Ionic 8 + Capacitor** |
| Framework SPA | **Angular 21 (Standalone Components)** |
| Backend / BaaS | **Supabase (PostgreSQL + Auth + REST API)** |
| Estado global | **Angular Signals + AppStore (custom)** |
| Estilos | **SCSS + CSS Custom Properties (Design Tokens)** |
| TTS nativo | **`@capacitor-community/text-to-speech`** |
| TTS web | **Web Speech API (fallback)** |

### Estructura de carpetas

```
src/
  app/
    core/
      guards/         → authGuard (protección de rutas)
      models/         → Interfaces TypeScript (User, Story, Scene, Vocabulary, etc.)
      services/       → auth, story, progress, vocabulary, audio, supabase
      store/          → AppStore (estado global reactivo con Signals)
    pages/
      auth/           → Login y Register
      onboarding/     → Wizard de configuración inicial (nivel, intereses, meta)
      home/           → Dashboard principal (feed de historias + progreso del día)
      reader/         → Lector inmersivo + audio + tarjeta de vocabulario + quiz
      vocab/          → Mis palabras + modo de repaso Flashcard (SM-2)
      profile/        → Estadísticas personales + configuración de cuenta
      tabs/           → Shell de navegación (Tab Bar)
```

---

## 🗄️ Base de datos (Supabase / PostgreSQL)

El esquema está diseñado para escalar. Todas las tablas tienen Row Level Security habilitado, garantizando que cada usuario solo puede acceder a sus propios datos.

### Tablas principales

| Tabla | Propósito |
|---|---|
| `users` | Perfil del usuario (nivel CEFR, intereses, meta diaria, XP total, racha) |
| `stories` | Catálogo de historias con scenes y quiz en formato JSONB |
| `vocabulary` | Diccionario global de palabras (IPA, definición en español, ejemplo) |
| `user_vocabulary` | Estado del vocabulario por usuario (new / learning / known) + datos SRS |
| `user_story_progress` | Progreso de lectura por historia y usuario (porcentaje + completado) |
| `daily_progress` | Minutos leídos, XP ganada y palabras aprendidas por día |
| `quiz_attempts` | Historial de quizzes completados por historia |

### Funciones RPC (lógica en el servidor)

#### `update_daily_progress(p_user_id, p_minutes, p_xp, p_words_learned)`
Registra o acumula el progreso diario del usuario. Además:
- Actualiza el `xp_total` acumulado en el perfil del usuario.
- Comprueba si el usuario jugó ayer para **mantener o reiniciar la racha (`streak_days`)**.

#### `process_srs_review(p_user_id, p_vocab_id, p_quality)`
Implementa el algoritmo **SM-2** de memoria espaciada:
- Si la respuesta fue correcta (`quality ≥ 3`): calcula el nuevo intervalo de repaso (1 día → 6 días → exponencial), ajusta el `ease_factor` y programa la siguiente revisión.
- Si fue incorrecta: resetea el contador de repasos y programa la revisión para mañana.
- Una palabra pasa automáticamente a `known` cuando el intervalo supera los **21 días consecutivos sin fallar**.

### Vistas

| Vista | Propósito |
|---|---|
| `v_words_due_today` | Palabras en estado `learning` cuya fecha de repaso ya llegó |
| `v_user_stats` | Resumen completo del usuario (palabras conocidas, en aprendizaje, historias completadas) |

---

## 📱 Pantallas y flujo de usuario

### 1. Autenticación (`/auth`)
- **Login** con email/contraseña
- **Registro** con nombre, email y contraseña.
- Al registrarse, un trigger de Supabase crea automáticamente el perfil en la tabla `users`.

### 2. Onboarding (`/onboarding`)
Wizard de 3 pasos que aparece la primera vez (o cuando el perfil no tiene datos):
1. **Nivel CEFR**: A1 Principiante → B2 Avanzado.
2. **Intereses**: Viajes, Negocios, Ciencia, Cultura, Gastronomía, Tecnología, Deportes, Naturaleza.
3. **Meta diaria**: 5 / 10 / 15 / 20 minutos por día.

Estos datos configuran el feed personalizado de historias y el objetivo del anillo de progreso en el Dashboard.

### 3. Dashboard / Home (`/tabs/home`)
- Anillo circular con los **minutos leídos hoy** vs la meta diaria.
- Botón de racha con número de días consecutivos activos.
- Feed de **historias recomendadas**, filtrable por nivel (A1, A2, B1, B2).
- Las historias completadas muestran un check verde sobre la portada.
- Deslizando hacia abajo se recargan los datos desde Supabase.

### 4. Lector de historias (`/reader/:id`)
El núcleo de la experiencia. Cada historia está compuesta por escenas `narration` o `dialogue`.

- **Texto tokenizado**: las palabras clave están marcadas con `{word}` en el JSONB y se renderizan como spans interactivos. Un toque abre la tarjeta de vocabulario.
- **Tarjeta de vocabulario**: muestra definición en español, IPA, ejemplo en inglés y el estado actual de la palabra (`New / Learning / Known`). El usuario puede cambiar el estado con un toque.
- **Barra de progreso**: registra qué tan abajo ha leído el usuario. Se guarda cada 10% de avance en Supabase.
- **Audio por escena**: cada escena tiene un botón de reproducción. En Android/iOS usa TTS nativo; en el navegador usa la Web Speech API. Mientras la narración avanza, las palabras se resaltan en tiempo real con el `currentCharIndex`.
- **Quiz final**: cuando el progreso supera el 80%, aparece el botón de Quiz (4 preguntas de opción múltiple). Al completarlo, aparece la pantalla de resultados con minutos leídos, palabras aprendidas y XP ganada.
- **Guardado automático**: al salir de la pantalla (por el botón de volver, el tab bar, o el cierre de la app), el tiempo de lectura y el progreso se guardan en la base de datos y se actualizan en el store reactivo.

### 5. Vocabulario (`/tabs/vocab`)
- Lista de **Mis Palabras** organizadas por estado: Todas / Nuevas / Aprendiendo / Conocidas.
- **Modo de repaso (Flashcard)**: muestra las palabras cuyo turno de repaso llegó según el algoritmo SM-2. El flujo:
  1. Ver la palabra en inglés.
  2. Flipear la tarjeta para ver la definición en español (y escuchar la pronunciación TTS).
  3. Calificarse a sí mismo: `Lo sabía`, `Casi`, o `No la sabía`.
  4. El algoritmo SM-2 calcula automáticamente cuándo volver a verla.
- Al terminar el repaso, muestra el resumen de la sesión (palabras correctas/incorrectas, nueva XP).

### 6. Perfil (`/tabs/profile`)
- Nombre, avatar (placeholder), nivel CEFR y estado premium.
- Estadísticas globales: palabras conocidas, en aprendizaje, historias completadas.
- **Gráfico de barras semanal**: minutos de lectura de los últimos 7 días. El día de hoy se resalta.
- Totales de la semana: minutos de lectura + XP ganada.
- Anillo de meta diaria.
- Botón de **Cerrar sesión**.

---

## 🔧 Servicios principales

### `AuthService`
Gestiona el ciclo de vida de la sesión con Supabase Auth. Expone un signal reactivo `user()` que se actualiza en tiempo real ante cambios de estado (login, logout). El guard `authGuard` protege todas las rutas privadas.

### `StoryService`
Obtiene el feed de historias con su progreso (`user_story_progress` en JOIN), y llama a `upsertReadingProgress` para actualizar el porcentaje de lectura en Supabase.

### `ProgressService`
- `getUserStats()`: consulta la vista `v_user_stats` para las estadísticas del perfil.
- `getTodayProgress()`: obtiene los minutos leídos hoy de `daily_progress`.
- `recordSession()`: llama a la función RPC `update_daily_progress` para registrar la sesión de lectura en el lado del servidor.

### `VocabularyService`
- `lookupWord(word)`: busca una palabra en el diccionario global `vocabulary`.
- `setWordStatus(vocabId, status)`: marca una palabra como `new`, `learning` o `known`.
- `getWordsDueToday()`: consulta la vista `v_words_due_today` para el modo de repaso.
- `processReview(userVocabId, quality)`: llama al RPC `process_srs_review` para que el servidor calcule el siguiente intervalo de repaso basado en SM-2.

### `AudioService`
- Detecta si la plataforma es nativa (Android/iOS) o web.
- **Nativo**: usa `@capacitor-community/text-to-speech` y simula el resaltado de palabras con un timer basado en el ritmo del habla.
- **Web**: usa la Web Speech API, que provee eventos de límite de palabra (`onboundary`) para resaltado preciso y sincronizado.

### `AppStore`
Store global reactivo basado en Angular Signals. Mantiene en memoria:
- `stats`: estadísticas del usuario (XP, racha, palabras).
- `todayProgress`: minutos leídos hoy (anillo del dashboard).
- `wordsDue`: palabras pendientes de repaso (badge en la tab de vocabulario).

El método `addSessionProgress(minutes, xp, words)` actualiza el store **inmediatamente** al terminar de leer, sin necesidad de recargar el dashboard desde la red.

---

## 🎮 Gamificación

| Mecánica | Implementación |
|---|---|
| **XP (Puntos de experiencia)** | Se gana al completar el quiz (+10 XP por respuesta correcta) y al marcar palabras. Se acumula en `users.xp_total`. |
| **Streak (Racha)** | Se incrementa automáticamente si el usuario tuvo actividad el día anterior. Si no, se reinicia a 1. Visible en el Dashboard y el Perfil. |
| **Meta diaria** | El usuario define entre 5 y 20 minutos/día en el onboarding. El anillo circular del Dashboard refleja el progreso en tiempo real. |
| **Badges de historia** | Las historias completadas muestran un checkmark verde en el feed, incentivando la exploración. |
| **Progreso de vocabulario** | Tres estados visuales de las palabras (new → learning → known) dan sensación de avance y maestría. |



## 📐 Diseño y estética

Lingo usa un sistema de diseño personalizado basado en **CSS Custom Properties (tokens)**:

| Token | Valor | Uso |
|---|---|---|
| `--lingo-bg` | `#F7F4EF` | Fondo principal cálido |
| `--lingo-accent` | `#E8623A` | Color de acción principal (naranja) |
| `--lingo-ink` | `#1A1714` | Texto principal oscuro |
| `--lingo-green` | `#3DAA72` | Respuesta correcta / palabra conocida |
| `--lingo-surface` | `#FFFFFF` | Superficies de tarjetas |

La tipografía usa **Inter** (Google Fonts) para lograr una estética limpia y moderna, complementada con animaciones suaves en transiciones y elementos interactivos.

---

