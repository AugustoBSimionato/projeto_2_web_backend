const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  descricao: { type: String, default: "" },
  dataCriacao: { type: Date, default: Date.now },
  seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  seguindo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
});

module.exports = mongoose.model('User', userSchema);