import logging
from typing import Any, Dict, List, Optional
from neo4j import GraphDatabase, Driver, Session, exceptions
from app.config import settings

logger = logging.getLogger("chainpulse.db")

class DatabaseManager:
    """
    Manages the official Neo4j/CognoDB driver connection, session pooling,
    and parameterized Cypher query execution with graceful error handling.
    """
    def __init__(self):
        self._driver: Optional[Driver] = None
        self._is_connected: bool = False
        self._last_error: Optional[str] = None

    def connect(self) -> bool:
        """Initialize the Neo4j driver and verify server connectivity."""
        if not settings.has_db_credentials:
            self._is_connected = False
            self._last_error = "Database credentials not configured in .env"
            logger.warning("No CognoDB credentials found. Operating in fallback mock mode.")
            return False

        try:
            logger.info(f"Connecting to CognoDB/Neo4j at {settings.cogndb_uri}...")
            self._driver = GraphDatabase.driver(
                settings.cogndb_uri,
                auth=(settings.cogndb_user, settings.cogndb_password),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=10.0
            )
            self._driver.verify_connectivity()
            self._is_connected = True
            self._last_error = None
            logger.info("Successfully connected to CognoDB/Neo4j database instance.")
            return True
        except exceptions.AuthError as e:
            self._is_connected = False
            self._last_error = f"Authentication failed: {str(e)}"
            logger.error(f"CognoDB Authentication Error: {e}")
            return False
        except exceptions.ServiceUnavailable as e:
            self._is_connected = False
            self._last_error = f"Service unavailable: {str(e)}"
            logger.error(f"CognoDB Service Unavailable: {e}")
            return False
        except Exception as e:
            self._is_connected = False
            self._last_error = f"Connection error: {str(e)}"
            logger.error(f"Unexpected connection error: {e}")
            return False

    def close(self):
        """Close the database driver connection pool."""
        if self._driver:
            self._driver.close()
            self._is_connected = False
            logger.info("Database driver connection closed.")

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def get_driver(self) -> Optional[Driver]:
        return self._driver

    def check_health(self) -> Dict[str, Any]:
        """Check live database health and ping instance."""
        if not self._is_connected or not self._driver:
            return {
                "status": "offline",
                "mode": "fallback_mock",
                "connected": False,
                "uri": settings.cogndb_uri or "None",
                "error": self._last_error or "Driver not initialized"
            }

        try:
            with self._driver.session(database=settings.cogndb_database) as session:
                result = session.run("RETURN 1 AS alive").single()
                if result and result["alive"] == 1:
                    return {
                        "status": "healthy",
                        "mode": "live_cogndb",
                        "connected": True,
                        "uri": settings.cogndb_uri,
                        "database": settings.cogndb_database
                    }
        except Exception as e:
            self._is_connected = False
            self._last_error = str(e)
            return {
                "status": "degraded",
                "mode": "fallback_mock",
                "connected": False,
                "error": str(e)
            }

        return {"status": "unknown", "connected": False}

    def execute_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None,
        read_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Execute a 100% parameterized openCypher query using official Neo4j driver.
        No string concatenation is used.
        """
        if not self._is_connected or not self._driver:
            raise ConnectionError(f"Database is not connected: {self._last_error or 'Missing credentials'}")

        params = parameters or {}
        with self._driver.session(database=settings.cogndb_database) as session:
            if read_only:
                result = session.execute_read(lambda tx: tx.run(query, params).data())
            else:
                result = session.execute_write(lambda tx: tx.run(query, params).data())
            return result

db_manager = DatabaseManager()
