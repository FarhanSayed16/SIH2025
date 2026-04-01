# AI "Wrapper" Clarification & Own AI Options

This document explains what "don't use a wrapper version" may mean, whether using a single Gemini API key is a drawback, and options for building or owning your AI stack.

---

## 1. What Does "Not Use a Wrapper Version" Mean?

Interpretations vary by judge/organizer. Common ones:

| Interpretation | Meaning | What You Might Need to Change |
|----------------|--------|-------------------------------|
| **No "API wrapper" / use raw API** | Don't use the official SDK (e.g. `@google/generative-ai`). Call Gemini via **plain HTTP/REST** (fetch/axios) with your API key in headers. | Replace the Gemini SDK in the backend with direct `POST https://generativelanguage.googleapis.com/...` calls. Logic stays the same; only the way you call the API changes. |
| **No "pass-through wrapper"** | Your backend should not be a thin proxy that only forwards user input to Gemini and returns the answer. They want **your logic** in between: prompts you design, parsing, validation, integration with your DB, safety rules, etc. | You're already doing this (your prompts, response parsing, error handling, 503 for quota). You can document that "we use Gemini only as the model; all orchestration, safety, and product logic is ours." |
| **No third-party cloud AI / use "your own" AI** | Don't rely on a commercial API (e.g. Gemini, OpenAI). Use something you "own" or run: **self-hosted / open-source models** (e.g. Ollama, LLaMA, Mistral) or **your own trained/smaller models**. | You'd move away from Gemini and either run models on your own server/VM (e.g. Ollama + REST API) or build a smaller custom system (rules + small ML models). |

**Recommendation:** Ask the organisers/judges to clarify in one sentence: *"Do you mean (a) we must call the AI API via raw HTTP instead of the official SDK, or (b) we must not use any external AI API (e.g. Gemini) and should use self-hosted / our own models?"*

---

## 2. Is Using Only One Gemini API Key a Drawback?

| Aspect | One Gemini Key |
|--------|----------------|
| **Quota / rate limits** | Yes. All features (Ask Kavach, scenario, tips, evacuation check, etc.) share one key → one quota. You already hit 429/503. More users = more chance of hitting limits. |
| **Scaling** | For a demo or small deployment, one key is fine. For many schools/users, you'd want multiple keys or a different solution. |
| **Single point of failure** | If the key is revoked or the service is down, all AI features stop. |
| **Security** | Using one key only on the backend (never in the app) is the right approach. Not a drawback by itself. |

**Summary:** The main drawback is **quota and dependency on one external service**, not "one key" in the abstract. Fixing that can mean: more keys (same vendor), or moving to a solution that doesn't depend on that API.

---

## 3. Should You Build "Your Own" AI / System Without an API Key?

Depends what "don't use a wrapper" actually means and how much time you have.

### Option A: Keep Gemini but "No Wrapper" = Use Raw HTTP

- **Idea:** Remove the Gemini SDK; call the same Gemini API with **HTTP only** (e.g. Node `fetch` or `axios`).
- **Pros:** Same quality, same key, no quota change; you satisfy "we don't use the official wrapper/SDK."
- **Cons:** You still depend on one Gemini key and its quota.

### Option B: Self-Hosted Open-Source Model (e.g. Ollama)

- **Idea:** Run a model (e.g. Llama, Mistral) on your own machine or a server via **Ollama** (or similar). Your backend calls `http://your-server:11434/api/generate` (or similar). **No Google/OpenAI API key.**
- **Pros:** No external API key; you "own" the stack; no per-request cost; judges may count it as "your" AI.
- **Cons:** You need a machine with enough RAM/GPU; you still depend on that server being up; model quality may be lower than Gemini for some tasks.

### Option C: Hybrid / "Your Own" Logic with Minimal External AI

- **Idea:** Use AI only where it really adds value. Elsewhere use **your own logic**: rule-based answers, templates, keyword matching, small local classifiers, etc. If you must use an API, use it only for a few, high-value features and document that "most of the intelligence is our rules and our system."
- **Pros:** Less dependency on one key; more "built by us"; often more predictable and easier to demo.
- **Cons:** Some features may feel less "smart" than a full LLM.

### Option D: Build and Train Your Own Small Model

- **Idea:** Train a small model (e.g. for safety tips, FAQ, or classification) on your data and run it yourself (e.g. TensorFlow Lite, ONNX, or a small Flask/FastAPI service).
- **Pros:** Fully "your" AI; no API key at all.
- **Cons:** Time-consuming; needs data and ML effort; may be overkill for a hackathon.

---

## 4. Practical Recommendation

1. **Clarify "wrapper"** with organisers (SDK vs no external API at all).
2. **If "wrapper" = SDK only:**  
   - Replace the Gemini **SDK** with **direct HTTP** calls to the same Gemini API.  
   - Keep your current design and single key; document that all product logic is yours and only the "model" is Gemini via raw API.
3. **If "wrapper" = no external AI API:**  
   - **Short term:** Add **Ollama** (or similar) on a laptop/server, point one or two features to it (e.g. "Ask Kavach" or scenario text), and keep the rest as rules/templates. No Gemini key for those features.  
   - **Medium term:** You can move more features to Ollama or to your own rules + small models.
4. **Either way:**  
   - Using **one** Gemini key is a drawback mainly for **quota and scaling**, not for "wrapper" in the sense of architecture.  
   - "Building your own AI" can mean: your prompts + your orchestration + your safety (still calling an API), or it can mean no external API and self-hosted/own models; the right choice depends on the exact rule and your timeline.

---

## 5. Quick Reference

| Goal | Action |
|------|--------|
| Satisfy "no wrapper" as "no SDK" | Call Gemini via raw HTTP (fetch/axios), remove `@google/generative-ai`. |
| Satisfy "no external API" | Use Ollama or similar self-hosted model; no Gemini key for those features. |
| Reduce single-key drawback | Add more keys (different projects) or move some features to Ollama/own logic. |
| Document "our AI" | Emphasise: prompts, parsing, safety, DB integration, and product logic are all yours; only the base model is external (if applicable). |

---

*Last updated: 2026.*
