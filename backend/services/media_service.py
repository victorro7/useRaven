import os
import re
from typing import List, Optional, Set, Tuple

from google.genai import types

from ..pymodels import FormattedChatMessage, ChatMessagePart


class MediaInclusionConfig:
    def __init__(self) -> None:
        self.include_only_current_turn: bool = os.getenv("MEDIA_INCLUDE_ONLY_CURRENT", "true").lower() == "true"
        self.allow_history_if_referenced: bool = os.getenv("MEDIA_ALLOW_HISTORY_IF_REFERENCED", "true").lower() == "true"
        self.max_media_parts: int = int(os.getenv("MEDIA_MAX_PARTS", "3"))
        self.max_images: int = int(os.getenv("MEDIA_MAX_IMAGES", "2"))
        self.max_videos: int = int(os.getenv("MEDIA_MAX_VIDEOS", "1"))


class MediaInclusionService:
    """Selects which media to include for the current model call.

    Heuristics (deterministic, fast):
    - Always include media attached to the latest user message.
    - Include history media only when the latest user text references earlier media
      (e.g., "that image", "previous video", file extensions, "last image").
    - Cap the number of included media parts to avoid token waste.
    """

    IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic")
    VIDEO_EXTENSIONS = (".mp4", ".mov", ".webm", ".avi", ".mkv")

    IMAGE_CUES = re.compile(r"\b(image|photo|picture|pic|gif|meme)\b", re.IGNORECASE)
    VIDEO_CUES = re.compile(r"\b(video|clip|footage|gif)\b", re.IGNORECASE)
    HISTORY_CUES = re.compile(r"\b(previous|earlier|above|before|last|first|second|third|that)\b", re.IGNORECASE)
    EXT_CUES = re.compile(r"\.(png|jpg|jpeg|gif|webp|heic|mp4|mov|webm|avi|mkv)\b", re.IGNORECASE)

    def __init__(self, config: Optional[MediaInclusionConfig] = None) -> None:
        self.config = config or MediaInclusionConfig()

    def _extract_media(self, messages: List[FormattedChatMessage]) -> List[Tuple[str, str]]:
        """Return list of (url, mimeType) from message parts in chronological order."""
        collected: List[Tuple[str, str]] = []
        for message in messages:
            for part in message.parts:
                if part.type != "text" and getattr(part, "text", None):
                    url = part.text
                    mime = getattr(part, "mimeType", None)
                    collected.append((url, mime))
        return collected

    def _is_image(self, url_or_mime: str) -> bool:
        u = url_or_mime.lower()
        return any(u.endswith(ext) for ext in self.IMAGE_EXTENSIONS) or u.startswith("image/")

    def _is_video(self, url_or_mime: str) -> bool:
        u = url_or_mime.lower()
        return any(u.endswith(ext) for ext in self.VIDEO_EXTENSIONS) or u.startswith("video/")

    def _latest_user_text(self, latest_user_message: Optional[FormattedChatMessage]) -> str:
        if not latest_user_message:
            return ""
        texts = [p.text for p in latest_user_message.parts if p.type == "text" and p.text]
        return "\n".join(texts)

    def get_allowed_media_urls(
        self,
        latest_user_message: Optional[FormattedChatMessage],
        history_messages: List[FormattedChatMessage],
    ) -> Set[str]:
        allowed: List[Tuple[str, str]] = []  # (url, mime)

        # 1) Always include media attached to the latest user message
        latest_media = self._extract_media([m for m in [latest_user_message] if m is not None])
        allowed.extend(latest_media)

        # 2) Consider history media if referenced and config allows
        if self.config.allow_history_if_referenced and latest_user_message is not None:
            user_text = self._latest_user_text(latest_user_message)
            references_media = bool(
                self.HISTORY_CUES.search(user_text)
                or self.IMAGE_CUES.search(user_text)
                or self.VIDEO_CUES.search(user_text)
                or self.EXT_CUES.search(user_text)
            )

            if references_media and not self.config.include_only_current_turn:
                # Gather history media in reverse chronological (assume as given)
                hist_media = self._extract_media(history_messages)

                # Select by cue types
                want_images = bool(self.IMAGE_CUES.search(user_text))
                want_videos = bool(self.VIDEO_CUES.search(user_text))

                # Fallback: if generic reference without type, allow most recent item
                if not want_images and not want_videos:
                    want_images = want_videos = True

                # Apply caps and add newest first from the end
                images_added = 0
                videos_added = 0
                for url, mime in reversed(hist_media):
                    if any(url == u for u, _ in allowed):
                        continue  # already included from latest turn

                    if want_images and images_added < self.config.max_images and (
                        (mime and self._is_image(mime)) or self._is_image(url)
                    ):
                        allowed.append((url, mime or ""))
                        images_added += 1
                    elif want_videos and videos_added < self.config.max_videos and (
                        (mime and self._is_video(mime)) or self._is_video(url)
                    ):
                        allowed.append((url, mime or ""))
                        videos_added += 1

                    # Stop if we hit overall cap
                    if len(allowed) >= self.config.max_media_parts:
                        break

        # Enforce global cap and return urls
        allowed = allowed[: self.config.max_media_parts]
        return {url for url, _ in allowed}


