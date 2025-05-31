"""
Test script for the unified Excel generation architecture.
This script validates that both import and export processes are properly using the unified code.
"""

import os
import sys
import time
import pandas as pd
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_unified")

# Add the parent directory to the path to import our modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Import required modules for testing
from app.api.core.config import settings
from app.api.imports.import_service import generate_excel as generate_excel_import
from app.api.exports.export_service import generate_excel as generate_excel_export
from app.api.core.data_processing_unified import force_garbage_collection


class TestParams:
    """
    Mock class to simulate request parameters for testing.
    """
    def __init__(self, is_import=True):
        # Common parameters
        self.server = settings.DB_SERVER
        self.database = settings.DB_NAME
        self.username = settings.DB_USERNAME
        self.password = settings.DB_PASSWORD
        self.force_continue_despite_limit = True
        
        # Import specific parameters
        if is_import:
            self.hs = "8517"
            self.fromMonth = 202301
            self.toMonth = 202312
            self.country = "ALL"
        # Export specific parameters
        else:
            self.hs = "8517"
            self.fromMonth = 202301
            self.toMonth = 202312
            self.country = "ALL"
            self.exportType = "ALL"


def test_import_excel_generation():
    """Test the import Excel generation using the unified architecture"""
    logger.info("Testing import Excel generation...")
    start_time = time.time()
    
    # Create test parameters for import
    params = TestParams(is_import=True)
    
    try:
        # Generate Excel file
        file_path, operation_id = generate_excel_import(params)
        
        # Verify the file was created
        if file_path and os.path.exists(file_path):
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # Size in MB
            logger.info(f"Import Excel file generated successfully at: {file_path}")
            logger.info(f"File size: {file_size:.2f} MB")
            logger.info(f"Operation ID: {operation_id}")
            logger.info(f"Time taken: {time.time() - start_time:.2f} seconds")
            return True
        else:
            logger.error("Import Excel file generation failed - file not found")
            return False
    except Exception as e:
        logger.error(f"Import Excel generation failed with error: {str(e)}")
        return False


def test_export_excel_generation():
    """Test the export Excel generation using the unified architecture"""
    logger.info("Testing export Excel generation...")
    start_time = time.time()
    
    # Create test parameters for export
    params = TestParams(is_import=False)
    
    try:
        # Generate Excel file
        result = generate_excel_export(params)
        
        # Check if result is a tuple with file_path and operation_id
        if isinstance(result, tuple) and len(result) == 2:
            file_path, operation_id = result
            
            # Verify the file was created
            if file_path and os.path.exists(file_path):
                file_size = os.path.getsize(file_path) / (1024 * 1024)  # Size in MB
                logger.info(f"Export Excel file generated successfully at: {file_path}")
                logger.info(f"File size: {file_size:.2f} MB")
                logger.info(f"Operation ID: {operation_id}")
                logger.info(f"Time taken: {time.time() - start_time:.2f} seconds")
                return True
            else:
                logger.error("Export Excel file generation failed - file not found")
                return False
        # Check if it's a limit exceeded response
        elif isinstance(result, tuple) and isinstance(result[0], dict) and result[0].get('status') == 'limit_exceeded':
            logger.warning("Export Excel generation was paused due to exceeding row limit")
            logger.info(f"Operation ID: {result[1]}")
            logger.info(f"Time taken: {time.time() - start_time:.2f} seconds")
            return True
        else:
            logger.error("Export Excel generation failed - unexpected result format")
            return False
    except Exception as e:
        logger.error(f"Export Excel generation failed with error: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("==== Starting Unified Excel Architecture Tests ====")
    logger.info(f"Using memory limit: {settings.MEMORY_LIMIT_GB} GB")
    logger.info(f"Using thread pool size: {settings.THREAD_POOL_SIZE}")
    logger.info(f"Using chunk size: {settings.CHUNK_SIZE}")
    
    # Run the tests
    import_result = test_import_excel_generation()
    
    # Force garbage collection between tests
    force_garbage_collection()
    time.sleep(2)  # Brief pause between tests
    
    export_result = test_export_excel_generation()
    
    # Print summary
    logger.info("\n==== Test Results Summary ====")
    logger.info(f"Import Excel Generation: {'SUCCESS' if import_result else 'FAILED'}")
    logger.info(f"Export Excel Generation: {'SUCCESS' if export_result else 'FAILED'}")
    
    if import_result and export_result:
        logger.info("✅ All tests passed! The unified architecture is working correctly.")
    else:
        logger.info("❌ Some tests failed. Please check the logs for details.")
