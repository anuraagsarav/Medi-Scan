const bcrypt = require("bcrypt");

exports.hash = async (password) => await bcrypt.hash(password, 10);
exports.compare = async (input, hashed) => await bcrypt.compare(input, hashed);
