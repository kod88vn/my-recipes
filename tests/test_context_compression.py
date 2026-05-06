import tempfile
import unittest
from pathlib import Path
import sys


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "skills" / "workflow" / "context-compression" / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from compress import compress_file  # noqa: E402


class ContextCompressionTests(unittest.TestCase):
    def test_compress_preserves_code_and_headings(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "notes.md"
            original = (
                "# Design Notes\n\n"
                "You should make sure to really run the tests in order to prevent regressions.\n\n"
                "```bash\n"
                "npm run smoke\n"
                "```\n\n"
                "Visit https://example.com/docs for details and use `npm install`.\n"
            )
            path.write_text(original)

            ok = compress_file(path)

            self.assertTrue(ok)
            compressed = path.read_text()
            self.assertIn("# Design Notes", compressed)
            self.assertIn("```bash\nnpm run smoke\n```", compressed)
            self.assertIn("https://example.com/docs", compressed)
            self.assertIn("`npm install`", compressed)
            self.assertTrue((Path(tmp) / "notes.original.md").exists())


if __name__ == "__main__":
    unittest.main()