# 🏥 AI Hospital – Medical Query Processing System

AI Hospital is an intelligent medical assistant system designed to safely process user medical queries, apply clinical guardrails, and generate reliable, professional responses using AI.

This document explains the **end-to-end architecture** of the medical query pipeline.

---

## 📌 System Overview

The system takes a user’s medical question, classifies it, enriches it with relevant medical context, applies safety checks, and produces a medically responsible response.

---

## 🧠 Medical Query Processing Flow

```text
┌─────────────────────────────────────────────────────────┐
│                    User Query                           │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │     Medical Query Classifier          │
        │   (Intent: Symptom / Drug / General)  │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │  Context Retrieval & Enrichment       │
        │  • User Medical History               │
        │  • Current Conditions                 │
        │  • Allergies & Drug History           │
        │  • Location-based Drug Info           │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │    Safety Guardrails                  │
        │  • Emergency Detection                │
        │  • Drug Interaction Check             │
        │  • Red Flag Symptoms                  │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │   Prompt Engineering Layer            │
        │  • Medical Knowledge Base             │
        │  • Country-specific Guidelines        │
        │  • Professional Tone Setting          │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │        Gemini API Call                │
        │    With Structured Context            │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │   Response Processing                 │
        │  • Fact Verification                  │
        │  • Medical Disclaimers                │
        │  • Logging for Medical Review         │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │   Post-Processing                     │
        │  • Update User Profile                │
        │  • Save Conversation                  │
        │  • Flag for Follow-up                 │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │         Final Response                │
        │  • Medical Guidance                   │
        │  • Safety Warnings                    │
        │  • Professional Referral              │
        └───────────────────────────────────────┘
```

---

## 🛡️ Safety & Compliance

AI Hospital is built with **medical safety as a priority**:

- Emergency symptom detection
- Drug–drug interaction checks
- Red-flag symptom escalation
- Mandatory medical disclaimers
- Encourages professional consultation when needed

⚠️ **Disclaimer:**  
AI Hospital does not replace a licensed medical professional. It provides informational support only.

---

## 🧩 Key Components

| Component | Purpose |
|---------|--------|
| Query Classifier | Determines user intent |
| Context Engine | Enriches query with medical data |
| Safety Guardrails | Prevents unsafe advice |
| Prompt Layer | Structures AI input |
| Gemini API | Generates medical response |
| Post-Processing | Stores, verifies, and flags |

---

## 📂 Recommended Project Structure

```
/docs
  └── architecture.md
/src
  ├── classifier/
  ├── safety/
  ├── prompts/
  ├── services/
  └── api/
README.md
```

---

## 🚀 Future Improvements

- Clinical guideline updates per country
- Human doctor review workflow
- Multilingual medical support
- Offline emergency detection

---

## 🤝 Contributors

Built with care to improve access to safe medical information.
