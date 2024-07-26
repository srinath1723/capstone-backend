const mongoose = require('mongoose');
const { MONGODB_URI, PORT } = require('./utils/config');
const app = require('./app'); // Your Express app setup

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
})
.catch(err => console.error('Could not connect to MongoDB...', err));