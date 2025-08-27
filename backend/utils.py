import re
from urllib.parse import urlparse, parse_qs

def convert_storage_path(input_path, output_format='gs_uri'):
    """
    Convert between different Google Cloud Storage path formats.
    
    Args:
        input_path (str): The input path (public URL, authenticated URL, signed URL, or gs:// URI)
        output_format (str): Desired output format: 
            - 'gs_uri': gs://bucket/path format
            - 'public_url': https://storage.googleapis.com/bucket/path format
            - 'clean_url': URL without query parameters
    
    Returns:
        str: The converted path in the requested format
    """
    # Extract bucket and object path
    
    bucket_name = None
    object_path = None
    
    # Remove query parameters first (for any URL format)
    clean_path = input_path.split('?')[0] if '?' in input_path else input_path
    
    # URL decode the path to handle encoded characters
    from urllib.parse import unquote
    clean_path = unquote(clean_path)
    
    # Case 1: gs:// URI
    if clean_path.startswith('gs://'):
        parts = clean_path[5:].split('/', 1)
        bucket_name = parts[0]
        object_path = parts[1] if len(parts) > 1 else ''
    
    # Case 2: Public URL (storage.googleapis.com)
    elif 'storage.googleapis.com' in clean_path:
        parsed_url = urlparse(clean_path)
        path_parts = parsed_url.path.lstrip('/').split('/', 1)
        bucket_name = path_parts[0]
        object_path = path_parts[1] if len(path_parts) > 1 else ''
    
    # Case 3: Authenticated URL (storage.cloud.google.com)
    elif 'storage.cloud.google.com' in clean_path:
        parsed_url = urlparse(clean_path)
        path_parts = parsed_url.path.lstrip('/').split('/', 1)
        bucket_name = path_parts[0]
        object_path = path_parts[1] if len(path_parts) > 1 else ''
    
    # Case 4: Other Google Storage URLs
    elif '.googleapis.com' in clean_path and '/download/storage' in clean_path:
        # Handle download service URLs
        match = re.search(r'/b/([^/]+)/o/(.+?)(?:/|\?|$)', clean_path)
        if match:
            bucket_name = match.group(1)
            object_path = match.group(2)
    
    # If we couldn't extract the bucket and path, return the original path
    if not bucket_name:
        return input_path
    
    # Generate output in requested format
    if output_format == 'gs_uri':
        result = f"gs://{bucket_name}/{object_path}"
    elif output_format == 'public_url':
        result = f"https://storage.googleapis.com/{bucket_name}/{object_path}"
    elif output_format == 'clean_url':
        result = clean_path
    else:
        result = input_path  # Return original if format not recognized
    
    return result
