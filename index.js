app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });