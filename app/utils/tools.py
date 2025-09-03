from datetime import datetime
from typing import Optional

def parse_iso_datetime(dt_str: str) -> Optional[datetime]:
    """Parse ISO-8601 datetime string into datetime object.
    Return None if parsing fails."""
    try:
        return datetime.fromisoformat(dt_str)
    except (ValueError, TypeError):
        return None

def format_duration(start: Optional[datetime], base: Optional[datetime]) -> Optional[str]:
    """
    Return the time difference between two datetimes as 'MM:SS'.
    Returns None if either datetime is missing.
    """
    if start is None or base is None:
        return None
    delta = (start - base).total_seconds()
    minutes = int(delta // 60)
    seconds = int(delta % 60)
    return f"{minutes}:{seconds:02d}"

def format_datetime(
    date: Optional[datetime],
    with_time: bool = True
) -> Optional[str]:
    """
    Return a datetime object formatted as 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'.
    Returns None if the datetime is missing.
    """
    if date is None:
        return None
    if with_time:
        return date.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return date.strftime("%Y-%m-%d")
