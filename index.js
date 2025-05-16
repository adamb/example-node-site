const express = require('express')
const app = express()
const port = require('./disco.json').services.web.port
// Add new required modules
const axios = require('axios');
const archiver = require('archiver');
const { body, validationResult } = require('express-validator');

// Add JSON body parser middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Disco!')
})

// Add ZIP creation endpoint
app.post(
  '/api/create-zip',
  [
    body('urls').isArray({ min: 1 }).withMessage('Must provide array of URLs'),
    body('urls.*').isURL().withMessage('Invalid URL format')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const zip = archiver('zip');
      const timestamp = Date.now();
      const zipName = `images-${timestamp}.zip`;

      res.attachment(zipName);
      zip.pipe(res);

      const fetchPromises = req.body.urls.map(async (url, index) => {
        try {
          const response = await axios({
            method: 'get',
            url,
            responseType: 'stream'
          });
          
          zip.append(response.data, { name: `image-${timestamp}-${index}.${getExtension(url)}` });
        } catch (error) {
          console.error(`Error fetching ${url}:`, error.message);
        }
      });

      await Promise.all(fetchPromises);
      if (zip.pointer() === 0) {
        return res.status(400).json({ error: 'Could not fetch any images' });
      }

      zip.finalize();
    } catch (error) {
      console.error('ZIP creation error:', error);
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  }
);

// Add file extension helper function
function getExtension(url) {
  const format = url.split('.').pop().split(/[#?]/)[0];
  return format.toLowerCase() === 'jpg' ? 'jpeg' : format;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
