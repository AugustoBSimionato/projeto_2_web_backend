const { logError } = require('../utils/logger');

function testeErro() {
    const error = new Error('Teste de erro do logger');
    logError(error);
    console.log('Erro logado no arquivo error.log');
}

testeErro();