# Third-Party Notices — Socio-hub NGO Community Solution

This file documents third-party software and AI models used by the Socio-hub project.
The Socio-hub source code itself is a separate work and is **not** covered by the licenses
listed here, unless otherwise stated.

---

## 1. Gemma 4 — AI Language Model

| Field | Value |
|---|---|
| **Model family** | Gemma 4 |
| **Model identifier used** | `gemma-4-26b-a4b-it` |
| **Creator / Licensor** | Google DeepMind |
| **License** | Apache License 2.0 |
| **Official model page** | https://ai.google.dev/gemma |
| **Official license text** | https://ai.google.dev/gemma/apache_2 |

### How this project accesses the model

Socio-hub does **not** download or redistribute Gemma 4 model weights.
The model is accessed exclusively as a **hosted remote service** through the
[Google Gemini API](https://ai.google.dev/) using the
[`google-genai` Python SDK](https://pypi.org/project/google-genai/).

The relevant module is [`backend/app/ai/gemma_service.py`](backend/app/ai/gemma_service.py).

### Apache 2.0 Attribution Requirements (as applied to this project)

Because model weights are not redistributed by this project, the principal obligations under
Apache 2.0 that apply here are:

1. **Retain this attribution notice** — this file satisfies that requirement.
2. **Credit the model creator** — Google DeepMind is credited above and in the AI module
   README at [`backend/app/ai/README.md`](backend/app/ai/README.md).
3. **State modifications** — no model weights have been modified or fine-tuned. API prompts
   are project-specific but do not alter the underlying model.
4. **No NOTICE file is required** for pure API consumption (no weights distributed).

> **Important distinction:** The `google-genai` SDK (Apache 2.0, Google LLC) and the
> Gemma 4 model weights (Apache 2.0, Google DeepMind) are separately licensed works.
> Both use Apache 2.0, but copyright and attribution notices for each must be preserved
> independently. This file covers the **model** attribution; the SDK's own license is
> included in the installed package distribution.

---

## 2. Google GenAI Python SDK

| Field | Value |
|---|---|
| **Package** | `google-genai` |
| **Publisher** | Google LLC |
| **License** | Apache License 2.0 |
| **PyPI** | https://pypi.org/project/google-genai/ |

The SDK is a dependency listed in `backend/requirements.txt` and is used solely to call
the Gemini API. Its Apache 2.0 license notice is retained within the installed package.

---

*Last updated: October 2026 — maintained by Member 3 (Database, Auth & Assignment).*
