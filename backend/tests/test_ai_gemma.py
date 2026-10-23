"""
Unit and integration tests for Member 4 Gemma 4 AI Analysis module.
Tests all 10 required specifications from 04_MEMBER_4_GEMMA4_AI.md using mocked Gemini API responses.
"""
import base64
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure backend directory is in sys.path for direct test runs
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ai.config import AIConfig
from app.ai.exceptions import AIServiceError
from app.ai.gemma_service import analyze_community_problem
from app.schemas.ai import AIAnalysisResult, ProblemCategory, SuggestedPriority


class TestGemmaService(unittest.TestCase):
    def setUp(self):
        self.config = AIConfig(
            api_key="test_api_key_dummy_12345",
            model_id="gemma-4-26b-a4b-it",
            timeout_seconds=5.0,
            max_description_length=5000,
            min_description_length=3,
        )

    def _create_mock_client(self, parsed_obj=None, text_content=None, side_effect=None):
        """Helper to create a mocked google-genai client."""
        mock_client = MagicMock()
        if side_effect:
            mock_client.models.generate_content.side_effect = side_effect
        else:
            mock_response = MagicMock()
            mock_response.parsed = parsed_obj
            mock_response.text = text_content
            mock_client.models.generate_content.return_value = mock_response
        return mock_client

    # Test 1: Normal community report returns a valid structured result
    def test_01_normal_community_report(self):
        expected_result = AIAnalysisResult(
            summary="A school needs books and notebooks.",
            category=ProblemCategory.EDUCATION,
            suggested_priority=SuggestedPriority.MEDIUM,
            skills_required=["community coordination"],
            resources_required=["books", "notebooks"],
            missing_information=[],
        )
        mock_client = self._create_mock_client(parsed_obj=expected_result)

        result = analyze_community_problem(
            description="Our village primary school is in urgent need of textbooks and notebooks for grade 4 students.",
            client=mock_client,
            config=self.config,
        )

        self.assertIsInstance(result, AIAnalysisResult)
        self.assertEqual(result.summary, "A school needs books and notebooks.")
        self.assertEqual(result.category, ProblemCategory.EDUCATION)
        self.assertEqual(result.suggested_priority, SuggestedPriority.MEDIUM)
        self.assertEqual(result.skills_required, ["community coordination"])
        self.assertEqual(result.resources_required, ["books", "notebooks"])
        self.assertEqual(result.missing_information, [])

    # Test 2: Each allowed category and priority is handled correctly
    def test_02_all_categories_and_priorities(self):
        for category in ProblemCategory:
            for priority in SuggestedPriority:
                json_text = json.dumps({
                    "summary": f"Report for category {category.value}",
                    "category": category.value,
                    "suggested_priority": priority.value,
                    "skills_required": ["general volunteering"],
                    "resources_required": ["basic supplies"],
                    "missing_information": [],
                })
                mock_client = self._create_mock_client(text_content=json_text)

                result = analyze_community_problem(
                    description=f"Testing problem report for category {category.value}",
                    client=mock_client,
                    config=self.config,
                )

                self.assertEqual(result.category, category)
                self.assertEqual(result.suggested_priority, priority)

    # Test 3: Missing information is represented correctly
    def test_03_missing_information_representation(self):
        expected_missing = [
            "Exact street address or landmark",
            "Estimated count of affected elderly residents",
            "Urgency timeline",
        ]
        json_text = json.dumps({
            "summary": "Elderly residents need ration kits.",
            "category": "food",
            "suggested_priority": "high",
            "skills_required": ["food distribution"],
            "resources_required": ["dry ration packets"],
            "missing_information": expected_missing,
        })
        mock_client = self._create_mock_client(text_content=json_text)

        result = analyze_community_problem(
            description="Elderly people in the area need food packets urgently.",
            client=mock_client,
            config=self.config,
        )

        self.assertEqual(result.missing_information, expected_missing)

    # Test 4: Malformed JSON or unexpected model output is rejected safely
    def test_04_malformed_json_rejected(self):
        malformed_outputs = [
            "This is plain text with no json at all.",
            "{'invalid_json': true,",  # unclosed syntax
            "",  # empty response
            "```json\n[1, 2, 3]\n```",  # array instead of object
        ]
        for malformed in malformed_outputs:
            mock_client = self._create_mock_client(text_content=malformed)
            with self.assertRaises(AIServiceError) as ctx:
                analyze_community_problem(
                    description="Water pipeline burst on Main Road.",
                    client=mock_client,
                    config=self.config,
                )
            self.assertEqual(ctx.exception.code, "AI_SERVICE_ERROR")

    # Test 5: Invalid category or priority values are handled safely
    def test_05_invalid_category_or_priority(self):
        invalid_json_payloads = [
            # Invalid category
            {
                "summary": "Test",
                "category": "sports_and_gaming",
                "suggested_priority": "medium",
                "skills_required": [],
                "resources_required": [],
                "missing_information": [],
            },
            # Invalid priority
            {
                "summary": "Test",
                "category": "medical",
                "suggested_priority": "critical_emergency",
                "skills_required": [],
                "resources_required": [],
                "missing_information": [],
            },
        ]
        for invalid_payload in invalid_json_payloads:
            mock_client = self._create_mock_client(text_content=json.dumps(invalid_payload))
            with self.assertRaises(AIServiceError) as ctx:
                analyze_community_problem(
                    description="Medical clinic needs thermometers.",
                    client=mock_client,
                    config=self.config,
                )
            self.assertEqual(ctx.exception.code, "AI_SERVICE_ERROR")

    # Test 6: Empty and excessively long descriptions are handled
    def test_06_empty_and_excessive_descriptions(self):
        mock_client = self._create_mock_client()

        # Empty string
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem("", client=mock_client, config=self.config)
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

        # Whitespace only
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem("     ", client=mock_client, config=self.config)
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

        # Excessively short
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem("Hi", client=mock_client, config=self.config)
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

        # Excessively long (> 5000 chars)
        long_desc = "x" * (self.config.max_description_length + 10)
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(long_desc, client=mock_client, config=self.config)
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

    # Test 7: Gemini API failures and timeouts produce controlled errors
    def test_07_api_failures_and_timeouts(self):
        # Timeout
        mock_timeout_client = self._create_mock_client(side_effect=TimeoutError("Request timed out"))
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Bridge collapsed near River South.",
                client=mock_timeout_client,
                config=self.config,
            )
        self.assertEqual(ctx.exception.code, "AI_SERVICE_ERROR")
        self.assertIn("timed out", ctx.exception.message)

        # Network/Connection failure
        mock_network_client = self._create_mock_client(side_effect=RuntimeError("Connection refused by peer"))
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Power outage in sector 7.",
                client=mock_network_client,
                config=self.config,
            )
        self.assertEqual(ctx.exception.code, "AI_SERVICE_ERROR")
        self.assertIn("temporarily unavailable", ctx.exception.message)

    # Test 8: API credentials are not included in error messages or logs
    def test_08_no_credentials_in_error_messages(self):
        fake_api_key = "AIzaSyB9876543210zyxwvutsrqponmlkjihgfe"
        leak_error = RuntimeError(f"Failed to authenticate against Gemini endpoint with key {fake_api_key}")
        mock_client = self._create_mock_client(side_effect=leak_error)

        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Need ambulance assistance.",
                client=mock_client,
                config=self.config,
            )

        err_dict = ctx.exception.to_dict()
        self.assertNotIn(fake_api_key, ctx.exception.message)
        for detail in ctx.exception.details:
            self.assertNotIn(fake_api_key, detail)
        self.assertNotIn(fake_api_key, json.dumps(err_dict))

    # Test 9: Image input is tested safely (valid base64, invalid base64, mime type, size)
    def test_09_image_input_validation(self):
        # 1. Valid image input passes to client
        raw_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"  # PNG magic header bytes
        b64_image = base64.b64encode(raw_image).decode("utf-8")

        expected_result = AIAnalysisResult(
            summary="Flooded street blocking school entrance.",
            category=ProblemCategory.INFRASTRUCTURE,
            suggested_priority=SuggestedPriority.HIGH,
            skills_required=["civil maintenance", "water pumping"],
            resources_required=["water pump", "sandbags"],
            missing_information=[],
        )
        mock_client = self._create_mock_client(parsed_obj=expected_result)

        result = analyze_community_problem(
            description="Flooded street blocking school entrance as shown in photo.",
            image_base64=b64_image,
            image_mime_type="image/png",
            client=mock_client,
            config=self.config,
        )
        self.assertEqual(result.category, ProblemCategory.INFRASTRUCTURE)
        self.assertTrue(mock_client.models.generate_content.called)

        # 2. Invalid base64
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Flooded street",
                image_base64="not-valid-base64!@@#",
                image_mime_type="image/png",
                client=mock_client,
                config=self.config,
            )
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

        # 3. Unsupported MIME type
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Flooded street",
                image_base64=b64_image,
                image_mime_type="application/pdf",
                client=mock_client,
                config=self.config,
            )
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

        # 4. Image exceeding maximum allowed size
        small_limit_config = AIConfig(
            api_key="test_key",
            max_image_bytes=10,  # 10 bytes limit for test
        )
        with self.assertRaises(AIServiceError) as ctx:
            analyze_community_problem(
                description="Flooded street",
                image_base64=b64_image,
                image_mime_type="image/png",
                client=mock_client,
                config=small_limit_config,
            )
        self.assertEqual(ctx.exception.code, "VALIDATION_ERROR")

    # Test 10: Result can be consumed by shared backend schema without mismatches
    def test_10_shared_schema_consumption(self):
        sample_data = {
            "summary": "A school needs books and notebooks.",
            "category": "education",
            "suggested_priority": "medium",
            "skills_required": ["community coordination"],
            "resources_required": ["books", "notebooks"],
            "missing_information": [],
        }
        mock_client = self._create_mock_client(text_content=json.dumps(sample_data))

        result = analyze_community_problem(
            description="Our school needs books.",
            client=mock_client,
            config=self.config,
        )

        # Check dictionary dump matches contract keys exactly
        result_dict = result.model_dump()
        expected_keys = {
            "summary",
            "category",
            "suggested_priority",
            "skills_required",
            "resources_required",
            "missing_information",
        }
        self.assertEqual(set(result_dict.keys()), expected_keys)
        self.assertEqual(result_dict["summary"], "A school needs books and notebooks.")
        self.assertEqual(result_dict["category"], "education")
        self.assertEqual(result_dict["suggested_priority"], "medium")
        self.assertEqual(result_dict["skills_required"], ["community coordination"])
        self.assertEqual(result_dict["resources_required"], ["books", "notebooks"])
        self.assertEqual(result_dict["missing_information"], [])


if __name__ == "__main__":
    unittest.main()
