const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const fs = require('fs');
const app = express();

// ★★ SETT INN DINE VERDIER UNDER ★★
const CLIENT_ID = '386846f7a7dc4ecbb543459b87e6da69';
const CLIENT_SECRET = 'a4e7821378994c5c9dc8771b16a18023';
const REDIRECT_URI = 'https://e670b19f-1c36-4e47-911a-7b13a9a613a3-00-ohhhz36pctbh.riker.replit.dev/callback';
// ★★ --------------------------- ★★

let tokens = {}; // { access_token, refresh_token, expires_at }

app.use(cors());
app.use(express.static('.'));

// Spotify login
app.get('/login', (req, res) => {
  const scope = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'playlist-read-private'
  ].join(' ');

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI
    }));
});

// Callback fra Spotify (brukes av redirect_uri)
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
      tokens.access_token = body.access_token;
      tokens.refresh_token = body.refresh_token;
      tokens.expires_at = Date.now() + (body.expires_in * 1000); // expires_in er i sekunder (typisk 3600)

      // Lagre til fil så du slipper logge inn på nytt hver gang
      fs.writeFileSync('tokens.json', JSON.stringify(tokens));

      res.redirect('/index.html#' +
        querystring.stringify({
          access_token: body.access_token,
          refresh_token: body.refresh_token
        })
      );
    } else {
      res.send('Login failed: ' + (body && body.error_description ? body.error_description : ''));
    }
  });
});

// Endpoint for alltid gyldig access_token
app.get('/token', (req, res) => {
  // Hvis access_token har gått ut (eller utløper om <1 min): refresh
  if (!tokens.access_token) return res.status(401).json({ error: "Not logged in" });
  if (tokens.expires_at && Date.now() > tokens.expires_at - 60*1000) {
    const refreshOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      },
      json: true
    };
    request.post(refreshOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        tokens.access_token = body.access_token;
        tokens.expires_at = Date.now() + (body.expires_in * 1000);
        fs.writeFileSync('tokens.json', JSON.stringify(tokens));
        res.json({ access_token: tokens.access_token });
      } else {
        res.status(500).json({ error: 'Could not refresh token' });
      }
    });
  } else {
    res.json({ access_token: tokens.access_token });
  }
});

// Ved serverstart: forsøk å les tokens fra fil (hvis de finnes)
try {
  tokens = JSON.parse(fs.readFileSync('tokens.json'));
  console.log("Tokens lastet fra fil.");
} catch (e) {
  console.log("Ingen tokens funnet. Du må logge inn via /login.");
}

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

