# Gemma 4 AI Analysis Module (Member 4)

## Overview
This module integrates Google's **Gemma 4** model via the **Gemini API** (`google-genai` SDK) for the NGO Community Solution. It transforms untrusted community reports and optional photos into structured suggestions for admin review.

## Import Path & Canonical Types
```python
from app.ai.gemma_service import analyze_community_problem
from app.schemas.ai import AIAnalysisResult, ProblemCategory, SuggestedPriority
from app.ai.exceptions import AIServiceError
```

## Function Signature
```python
def analyze_community_problem(
    description: str,
    image_base64: str | None = None,
    image_mime_type: str | None = None,
) -> AIAnalysisResult
```

### Parameters
* `description` (`str`): Mandatory untrusted text of the community problem report (min 3 chars, max 5,000 chars).
* `image_base64` (`str | None`, optional): Base64-encoded image string.
* `image_mime_type` (`str | None`, optional): MIME type (`image/jpeg`, `image/png`, `image/webp`). Max payload 10MB.

### Return Type (`AIAnalysisResult`)
```json
{
  "summary": "A concise summary of the reported problem.",
  "category": "education",
  "suggested_priority": "medium",
  "skills_required": ["community coordination"],
  "resources_required": ["books", "notebooks"],
  "missing_information": []
}
```

* `category` values: `"medical"`, `"food"`, `"education"`, `"infrastructure"`, `"emergency"`, `"other"`.
* `suggested_priority` values: `"high"`, `"medium"`, `"low"`.

## Fast-API Router Integration Example (for Member 2)
```python
from fastapi import APIRouter, HTTPException, Depends
from app.ai.gemma_service import analyze_community_problem
from app.ai.exceptions import AIServiceError
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResult

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])

@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_problem(payload: AIAnalysisRequest):
    try:
        return analyze_community_problem(
            description=payload.description,
            image_base64=payload.image_base64,
            image_mime_type=payload.image_mime_type,
        )
    except AIServiceError as exc:
        status_code = 400 if exc.code == "VALIDATION_ERROR" else 502
        raise HTTPException(
            status_code=status_code,
            detail=exc.to_dict()["error"]
        )
```

## Environment Configuration
Set in `backend/.env`:
* `GEMINI_API_KEY`: Google AI Studio API key.
* `GEMINI_MODEL_ID`: Default `gemma-4-26b-a4b-it` (alternative: `gemma-4-31b-it`).
* `GEMINI_TIMEOUT_SECONDS`: Default `30.0`.

## Testing
Run the automated test suite:
```bash
python -m unittest discover -s backend/tests -p "test_*.py" -v
```
All unit tests run offline against mocked API responses without requiring an active API key.

## Third-Party Notices

This module integrates the **Gemma 4** language model via the Gemini API.

| Field | Detail |
|---|---|
| **Model identifier** | `gemma-4-26b-a4b-it` (default; configurable via `GEMINI_MODEL_ID`) |
| **Creator** | Google DeepMind |
| **License** | Apache License 2.0 |
| **Official license** | https://ai.google.dev/gemma/apache_2 |
| **Model page** | https://ai.google.dev/gemma |

**Access method:** Model weights are accessed exclusively as a remote service through the
Gemini API — no model weights are downloaded, bundled, or redistributed by this project.

**Attribution:** Google DeepMind is credited as the model creator. Full attribution and
Apache 2.0 compliance details are documented in
[`THIRD_PARTY_NOTICES.md`](../../../../THIRD_PARTY_NOTICES.md) at the repository root.

**Distinction from Socio-hub code:** The Apache 2.0 licence on the Gemma 4 model weights
applies to the model itself. Socio-hub's own source code in this module is a separate work.
