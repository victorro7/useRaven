import os
import logging
import aiohttp
import asyncio
from google.cloud import storage
from ..utils import convert_storage_path

logger = logging.getLogger(__name__)

class SystemInstructionService:
    """Service for managing system instructions and user personalization."""
    
    def __init__(self):
        self._system_instruction = None
        self._last_fetch_time = 0
        self._cache_ttl = 3600  # 1 hour in seconds
        self._instruction_url = os.getenv(
            "SYSTEM_INSTRUCTION_URL", 
            "https://storage.googleapis.com/raven-uploads-beta/sys_instruct/raven_system_instruction.txt"
        )
        
        # Local fallback in case remote fetch fails
        self._local_fallback_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "prompts", 
            "raven_system_instruction.txt"
        )
    
    async def get_system_instruction(self, refresh=False):
        """Get the system instruction, fetching from remote if needed or requested.
        
        Args:
            refresh: Force refresh the instruction from remote source
            
        Returns:
            str: The system instruction text
        """
        current_time = asyncio.get_event_loop().time()
        
        # Use cached version if available and not expired
        if (not refresh and 
            self._system_instruction and 
            current_time - self._last_fetch_time < self._cache_ttl):
            logger.debug("Using cached system instruction")
            return self._system_instruction
            
        # Try to fetch from remote
        try:
            instruction = await self._fetch_remote_instruction()
            if instruction:
                self._system_instruction = instruction
                self._last_fetch_time = current_time
                logger.info("Successfully fetched system instruction from remote")
                return self._system_instruction
        except Exception as e:
            logger.error(f"Failed to fetch system instruction from remote: {e}")
        
        # If we get here, remote fetch failed - try local fallback
        if not self._system_instruction:
            try:
                with open(self._local_fallback_path, 'r') as f:
                    self._system_instruction = f.read().strip()
                    logger.info("Using local fallback system instruction")
            except Exception as e:
                logger.error(f"Failed to read local system instruction: {e}")
                # Last resort hardcoded fallback
                self._system_instruction = (
                    "Your name is Raven. You are a helpful AI assistant. "
                    "You're built by Victor Osunji. You have a sense of humor and can relate very well with people."
                )
                logger.warning("Using hardcoded fallback system instruction")
        
        return self._system_instruction
    
    async def _fetch_remote_instruction(self):
        """Fetch the system instruction from remote URL."""
        if self._instruction_url.startswith("gs://"):
            return await self._fetch_from_gcs(self._instruction_url)
        
        # Treat Google Cloud Storage HTTPS endpoints as GCS and fetch via SDK
        if (
            self._instruction_url.startswith("https://storage.googleapis.com/")
            or self._instruction_url.startswith("https://storage.cloud.google.com/")
        ):
            gs_uri = convert_storage_path(self._instruction_url, 'gs_uri')
            return await self._fetch_from_gcs(gs_uri)
        
        # Fallback: plain HTTP fetch
        return await self._fetch_from_http(self._instruction_url)
    
    async def _fetch_from_http(self, url):
        """Fetch instruction from HTTP URL."""
        clean_url = convert_storage_path(url, 'public_url')
        logger.debug(f"Fetching system instruction from HTTP: {clean_url}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(clean_url) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    logger.error(f"HTTP error {response.status} fetching system instruction")
                    return None
    
    async def _fetch_from_gcs(self, gs_uri):
        """Fetch instruction from GCS URI."""
        logger.debug(f"Fetching system instruction from GCS: {gs_uri}")
        try:
            # Parse bucket and blob from gs:// URI
            if not gs_uri.startswith("gs://"):
                gs_uri = convert_storage_path(gs_uri, 'gs_uri')
                
            parts = gs_uri.replace("gs://", "").split("/", 1)
            if len(parts) != 2:
                logger.error(f"Invalid GCS URI format: {gs_uri}")
                return None
                
            bucket_name, blob_name = parts
            
            # Use GCS client to download
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            
            # Download as string
            content = blob.download_as_text()
            return content
            
        except Exception as e:
            logger.error(f"Error fetching from GCS: {e}")
            return None
    
    def personalize_for_user(self, system_instruction, user_info):
        """Personalize the system instruction for a specific user.
        
        Args:
            system_instruction: Base system instruction
            user_info: User information dict with keys like first_name, last_name, email
            
        Returns:
            str: Personalized system instruction
        """
        if not user_info:
            return system_instruction
            
        # Extract user name with fallbacks
        if user_info.get('first_name') and user_info.get('last_name'):
            user_name = f"{user_info['first_name']} {user_info['last_name']}"
        elif user_info.get('first_name'):
            user_name = user_info['first_name']
        elif user_info.get('email'):
            user_name = user_info['email'].split('@')[0]
        else:
            return system_instruction
            
        # Add user name to system instruction
        personalized = f"The user's name is {user_name}. {system_instruction}"
        logger.debug(f"Personalized system instruction for user: {user_name}")
        return personalized

# Singleton instance
system_service = SystemInstructionService()
