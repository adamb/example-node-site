# Example disco Node Site

## ZIP Creation API

### Create ZIP from Image URLs
`POST /api/create-zip`

Accepts image URLs and returns a download link for a ZIP file containing the images.

**Request:**
```json
{
  "urls": ["https://example.com/image1.jpg", "https://example.com/image2.png"]
}
```

**Example using curl:**
```bash
# Create the ZIP and get download URL
curl -X POST http://localhost:3000/api/create-zip \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://httpbin.org/image/jpeg", "https://httpbin.org/image/png"]}'

# Then download the ZIP using the returned URL:
curl -L http://localhost:3000/public/zips/images-1708432200456-abc123.zip --output images.zip
```

**Successful Response:**
```json
{
  "url": "http://localhost:3000/public/zips/images-1708432200456-abc123.zip",
  "expires": "2024-02-20T15:30:00.000Z"  // 1 hour from creation
}
```

**Key Features:**
- Files automatically deleted after 1 hour
- Built-in cleanup runs hourly
- Unique filenames prevent collisions
- Direct download URL for easy integration

**Notes:**
- ZIP files are stored in `public/zips/`
- First request may take longer depending on image sizes
- Monitor `expires` timestamp for URL validity
- Server disk space should be monitored for production use

**Error Responses:**
- `400 Bad Request` for invalid input format
- `400 Bad Request` if no images could be downloaded
- `500 Internal Server Error` for processing failures

**Notes:**
- Supported formats: Any image format detectable from URL extension
- JPG files will be saved with .jpeg extension
- Service acts as proxy - ensure URLs are accessible from your server

### List Generated ZIP Files
`GET /ls`

Returns a directory listing of generated ZIP files.

**Example:**
```bash
curl http://localhost:3000/ls
```

**Response:**
HTML-formatted directory listing showing:
- File sizes
- Modification times
- Filenames

**Sample Output:**
```
ZIP Files:

images-1708432200456-abc123.zip
  Age: 0h45m ago
  Size: 8103.32 KB

images-1708433100789-def456.zip
  Age: 0h30m ago
  Size: 9001.45 KB
```

This provides:
- Direct visibility into the generated files
- Verification of automatic cleanup
- Simple debugging without server access

[See the documentation](https://docs.letsdisco.dev/deployment-guides/node)
