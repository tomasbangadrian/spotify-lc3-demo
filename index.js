const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const app = express();

const CLIENT_ID = '386846f7a7dc4ecbb543459b87e6da69'; // ← Lim inn fra Spotify Dashboard
const CLIENT_SECRET = 'a4e7821378994c5c9dc8771b16a18023'; // ← Lim inn fra Spotify Dashboard
const REDIRECT_URI = 'https://e670b19f-1c36-4e47-911a-7b13a9a613a3-00-ohhhz36pctbh.riker.replit.dev/callback'; // ← F.eks. https://din-replit-url/index.html

app.use(cors());
app.use(express.static('.'));

app.get('/login', (req, res) => {
  const scope = 'streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    json: true
  };
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      // Send token to frontend
      res.redirect('/index.html#' +
        querystring.stringify({
          access_token: body.access_token,
          refresh_token: body.refresh_token
        })
      );
    } else {
      res.send('Login failed');
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
