# Example disco Node Site

## ZIP Creation API

### Create ZIP from Image URLs
`POST /api/create-zip`

Accepts image URLs and returns a ZIP file containing the images.

**Request:**
```json
{
  "urls": ["https://example.com/image1.jpg", "https://example.com/image2.png"]
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/create-zip \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://httpbin.org/image/jpeg", "https://httpbin.org/image/png"]}' \
  --output images.zip
```

**Response:**
```json
{
  "url": "http://localhost:3000/public/zips/images-1708432200456-abc123.zip",
  "expires": "2024-02-20T15:30:00.000Z"
}
```
- Success: JSON response with download URL and expiration time
- Filename format: `images-<timestamp>-<random>.zip`
- Individual files: `image-<timestamp>-<index>.<ext>`

**Error Responses:**
- `400 Bad Request` for invalid input format
- `400 Bad Request` if no images could be downloaded
- `500 Internal Server Error` for processing failures

**Notes:**
- Supported formats: Any image format detectable from URL extension
- JPG files will be saved with .jpeg extension
- Service acts as proxy - ensure URLs are accessible from your server

[See the documentation](https://docs.letsdisco.dev/deployment-guides/node)
