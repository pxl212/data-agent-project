import unittest

from app.clients.embedding_client_manager import EmbeddingClientManager
from app.conf.app_config import EmbeddingConfig


class TestEmbeddingClientManager(unittest.TestCase):
    def test_init_uses_local_tei_adapter(self):
        manager = EmbeddingClientManager(
            EmbeddingConfig(host="localhost", port=8081, model="BAAI/bge-large-zh-v1.5")
        )

        manager.init()

        self.assertIsNotNone(manager.client)
        self.assertEqual(manager.client.__class__.__name__, "LocalTEIEmbeddings")
        self.assertEqual(manager.client.base_url, "http://localhost:8081")


if __name__ == "__main__":
    unittest.main()
