const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conteudo: { type: String, required: true, maxlength: 280 },
  curtidas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);