const express = require('express')
const app = express()
const port = require('./disco.json').services.web.port
// Add new required modules
const axios = require('axios');
const archiver = require('archiver');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Create zips directory if it doesn't exist
const zipDir = path.join(__dirname, 'public', 'zips');
if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir, { recursive: true });
}

// Add JSON body parser middleware
app.use(express.json());

// Add static file serving for the zips directory
app.use('/public', express.static(path.join(__dirname, 'public')));

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
      const randomString = Math.random().toString(36).substring(2, 8);
      const zipName = `images-${timestamp}-${randomString}.zip`;
      const zipPath = path.join(__dirname, 'public', 'zips', zipName);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(zipPath), { recursive: true });

      const output = fs.createWriteStream(zipPath);
      zip.pipe(output);

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

      await zip.finalize();
      
      // Wait for file to be fully written
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      const zipUrl = `${req.protocol}://${req.get('host')}/public/zips/${zipName}`;
      res.json({ 
        url: zipUrl,
        expires: new Date(Date.now() + 3600000).toISOString() // 1 hour expiration
      });

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

// Add helper function for formatting age
function formatAge(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h${minutes.toString().padStart(2, '0')}m ago`;
}

// Add directory listing endpoint
app.get('/ls', (req, res) => {
  const dirPath = path.join(__dirname, 'public', 'zips');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    const files = fs.readdirSync(dirPath);
    const fileDetails = files.map(file => {
      const stats = fs.statSync(path.join(dirPath, file));
      const ageMs = Date.now() - stats.mtimeMs;
      return {
        name: file,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        age: formatAge(ageMs)
      };
    });

    const fileList = fileDetails.length > 0 
      ? fileDetails.map(f => `${f.name}\n  Age: ${f.age}\n  Size: ${f.size}`).join('\n\n')
      : 'No ZIP files found';

    res.send(`<pre>ZIP Files:\n\n${fileList}</pre>`);
  } catch (err) {
    res.status(500).send(`<pre>Error: ${err.message}</pre>`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  
  // Schedule cleanup job
  cron.schedule('0 * * * *', () => {
    console.log('Running ZIP cleanup');
    const cleanupPath = path.join(__dirname, 'public', 'zips');
    
    fs.readdir(cleanupPath, (err, files) => {
      if (err) return console.error('Cleanup error:', err);
      
      files.forEach(file => {
        const filePath = path.join(cleanupPath, file);
        const stat = fs.statSync(filePath);
        
        if (Date.now() - stat.mtimeMs > 3600000) { // 1 hour
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${file}`);
        }
      });
    });
  });
})
