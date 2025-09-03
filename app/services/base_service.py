# -*- coding: utf-8 -*-
"""
Base service class for common service functionality.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)


class BaseService:
    """Base service class with common functionality."""
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize base service with database session."""
        self.db = db
        
    def get_db_session(self) -> Session:
        """Get database session."""
        if self.db:
            return self.db
        return next(get_db())
        
    def log_operation(self, operation: str, details: Dict[str, Any]) -> None:
        """Log service operations for debugging and monitoring."""
        logger.info(f"Service operation: {operation}", extra={
            "operation": operation,
            "details": details
        })
        
    def handle_error(self, error: Exception, operation: str) -> None:
        """Handle service errors with proper logging."""
        logger.error(f"Service error in {operation}: {str(error)}", extra={
            "operation": operation,
            "error_type": type(error).__name__,
            "error_message": str(error)
        })
        
    def validate_input(self, data: Dict[str, Any], required_fields: list) -> bool:
        """Validate input data has required fields."""
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        return True
        
    def paginate_results(self, query, page: int = 1, page_size: int = 10):
        """Apply pagination to query results."""
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
        
    def format_response(self, data: Any, message: str = "Success") -> Dict[str, Any]:
        """Format standard service response."""
        return {
            "status": "success",
            "message": message,
            "data": data
        }
        
    def format_error_response(self, error: str) -> Dict[str, Any]:
        """Format standard error response."""
        return {
            "status": "error",
            "message": error,
            "data": None
        }
