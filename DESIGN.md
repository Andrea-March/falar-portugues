# Architecture & Design Document: Portuguese (PT-PT) Learning App

## 1. Obiettivo dell'App
Un'applicazione web / APK focalizzata sulla grammatica, sui verbi e sulla conversazione nel portoghese del Portogallo (PT-PT), basata su tre pilastri:
- Palestra di Coniugazione e Grammatica (Regole rigorose + SRS)
- Vocabolario Video (Micro-clip contestualizzate)
- Conversazione Situazionale (Roleplay AI + Voice-to-Text)

---

## 2. Stack Tecnologico ($0/mese Tier)
- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database & Auth:** Supabase (PostgreSQL)
- **Media CDN:** Cloudinary (Micro-video 9:16)
- **Audio & Speech:** Web Speech API (Nativa PT-PT)
- **AI Roleplay:** Google Gemini API (Modello Flash)
- **Hosting & APK:** Vercel + PWABuilder

---

## 3. Schema Dati (Bozza iniziale)

### A. Verb (Coniugazioni)
- `id`: string
- `infinitive`: string (es. "ter")
- `translation`: string (es. "avere")
- `is_regular`: boolean
- `conjugations`: JSON {
    "presente": { "eu": "tenho", "tu": "tens", ... },
    "preterito_perfeito": { ... }
  }

### B. VideoVocab (Vocabolario)
- `id`: string
- `video_url`: string (Cloudinary)
- `target_word`: string (es. "uma bicha")
- `translation`: string (es. "una fila")
- `sentence_context`: string (es. "Está uma ___ enorme.")

### C. UserProgress (SRS / Ripetizione Dilazionata)
- `user_id`: string
- `item_type`: "verb" | "vocab"
- `item_id`: string
- `next_review_date`: timestamp
- `streak`: number
- `ease_factor`: number

---

## 4. Prossimi Passi
1. [ ] Popolare il DB locale con i primi 10 verbi fondamentali
2. [ ] Creare il componente base per l'esercizio di coniugazione
3. [ ] Configurare Supabase Client