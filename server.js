const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/config');

connectDB();

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});