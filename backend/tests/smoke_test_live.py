"""
Live API Smoke Test for Member 4 Gemma AI Service.
Runs an actual call to the Gemini API using the GEMINI_API_KEY configured in backend/.env.
Never prints or logs the API key or secret values.
"""
import json
import os
import sys
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ai.config import get_ai_config
from app.ai.exceptions import AIServiceError
from app.ai.gemma_service import _sanitize_log_text, analyze_community_problem


def run_smoke_test():
    print("=" * 60)
    print("LIVE SMOKE TEST: Gemma 4 AI Analysis via Gemini API")
    print("=" * 60)

    cfg = get_ai_config()

    # Check key presence safely without echoing it
    if not cfg.api_key or cfg.api_key == "your_gemini_api_key_here":
        print("[!] GEMINI_API_KEY is not configured in backend/.env")
        print("    Please open backend/.env and add your key: GEMINI_API_KEY=your_actual_key")
        print("=" * 60)
        return False

    print(f"[*] API Key status: Present ({len(cfg.api_key)} characters)")
    print(f"[*] Configured Model: {cfg.model_id}")
    print(f"[*] Timeout: {cfg.timeout_seconds} seconds")

    sample_report = (
        "The community library in Sector 4 needs 10 sturdy folding tables "
        "and 30 study chairs for after-school tutoring. Volunteers are needed to "
        "help set up and transport furniture this weekend."
    )
    print(f"[*] Sending sample report:\n    \"{sample_report}\"\n")

    try:
        result = analyze_community_problem(description=sample_report)
        print("[+] SUCCESS! Received valid structured response from Gemini API:")
        result_dict = result.model_dump()
        print(json.dumps(result_dict, indent=2))
        print("\n[+] Verification checks:")
        print(f"    - Category is valid contract enum: {result.category.value}")
        print(f"    - Suggested priority is valid contract enum: {result.suggested_priority.value}")
        print(f"    - Skills extracted: {len(result.skills_required)} items")
        print(f"    - Resources extracted: {len(result.resources_required)} items")
        print(f"    - Missing information: {len(result.missing_information)} items")
        print("=" * 60)
        return True

    except AIServiceError as exc:
        print("[-] AIServiceError encountered during live smoke test:")
        print(f"    Code: {exc.code}")
        print(f"    Message: {exc.message}")
        for detail in exc.details:
            print(f"    Detail: {detail}")
        if exc.original_error:
            # Mask potential key if reflected in raw provider message
            err_str = _sanitize_log_text(str(exc.original_error), api_key=cfg.api_key)
            print(f"    Underlying cause: {err_str[:300]}")
        print("=" * 60)
        return False
    except Exception as exc:
        safe_exc = _sanitize_log_text(str(exc), api_key=cfg.api_key)
        print(f"[-] Unexpected error: {safe_exc}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = run_smoke_test()
    sys.exit(0 if success else 1)
