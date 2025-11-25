// Funções auxiliares para notificações e loading

// Função para analisar e formatar erros do backend
function parseBackendError(error) {
    // Erro de conexão (servidor fora do ar)
    if (!error.response && error.request) {
        return {
            title: 'Servidor Indisponível',
            message: 'Não foi possível conectar ao servidor. Verifique se o servidor está em execução e sua conexão com a internet.'
        };
    }

    // Erro de timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
            title: 'Tempo Esgotado',
            message: 'A requisição demorou muito para responder. Tente novamente.'
        };
    }

    // Erro com resposta do servidor
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data || {};
        // Priorizar message do backend, depois error, depois error.message
        const errorMessage = data.message || data.error || (data.error?.message) || error.message || '';

        // Erro 500+ (servidor interno)
        if (status >= 500) {
            // Se o backend retornou uma mensagem específica, usar ela
            if (errorMessage) {
                return {
                    title: data.error || 'Erro no Servidor Interno',
                    message: errorMessage
                };
            }
            return {
                title: 'Erro no Servidor Interno',
                message: 'O servidor está com problemas. Tente novamente mais tarde ou entre em contato com o suporte.'
            };
        }

        // Erro 400 (Bad Request)
        if (status === 400) {
            // Se o backend retornou uma mensagem específica, usar ela
            if (errorMessage) {
                return {
                    title: data.error || 'Requisição Inválida',
                    message: errorMessage
                };
            }
            return {
                title: 'Requisição Inválida',
                message: 'A requisição contém informações inválidas.'
            };
        }

        // Erro 401 (Unauthorized)
        if (status === 401) {
            // Se o backend retornou uma mensagem específica, usar ela
            if (errorMessage) {
                return {
                    title: data.error || 'Credenciais Incorretas',
                    message: errorMessage
                };
            }
            return {
                title: 'Credenciais Incorretas',
                message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
            };
        }

        // Erro 403 (Forbidden)
        if (status === 403) {
            if (errorMessage) {
                return {
                    title: data.error || 'Acesso Negado',
                    message: errorMessage
                };
            }
            return {
                title: 'Acesso Negado',
                message: 'Você não tem permissão para acessar este recurso.'
            };
        }

        // Erro 404 (Not Found)
        if (status === 404) {
            if (errorMessage) {
                return {
                    title: data.error || 'Recurso Não Encontrado',
                    message: errorMessage
                };
            }
            return {
                title: 'Recurso Não Encontrado',
                message: 'O recurso solicitado não foi encontrado no servidor.'
            };
        }

        // Erro 409 (Conflict) - geralmente email já existe
        if (status === 409) {
            if (errorMessage) {
                return {
                    title: data.error || 'Email Já Cadastrado',
                    message: errorMessage
                };
            }
            return {
                title: 'Email Já Cadastrado',
                message: 'Este email já está cadastrado no sistema. Tente fazer login ou use outro email.'
            };
        }

        // Erro 422 (Unprocessable Entity)
        if (status === 422) {
            if (errorMessage) {
                return {
                    title: data.error || 'Dados Inválidos',
                    message: errorMessage
                };
            }
            return {
                title: 'Dados Inválidos',
                message: 'Os dados fornecidos não podem ser processados.'
            };
        }

        // Verificar erros do Supabase em diferentes formatos
        const supabaseError = data.error || data.errors || data.error_description;
        let finalErrorMessage = errorMessage;
        
        if (supabaseError) {
            const supabaseMsg = typeof supabaseError === 'string' 
                ? supabaseError 
                : (supabaseError.message || supabaseError.toString() || '');
            finalErrorMessage = supabaseMsg || errorMessage;
        }

        // Outros erros com mensagem do backend
        if (finalErrorMessage) {
            const lowerMsg = finalErrorMessage.toLowerCase();
            
            // Verificar erros específicos do Supabase - Email já existe
            if (lowerMsg.includes('user already registered') || 
                lowerMsg.includes('email already exists') ||
                lowerMsg.includes('duplicate key') ||
                lowerMsg.includes('duplicate') ||
                lowerMsg.includes('já existe') ||
                lowerMsg.includes('already registered') ||
                lowerMsg.includes('user with this email already exists') ||
                lowerMsg.includes('email address already registered')) {
                return {
                    title: 'Email Já Cadastrado',
                    message: 'Este email já está cadastrado no sistema. Tente fazer login ou use outro email.'
                };
            }

            // Verificar erros de credenciais inválidas
            if (lowerMsg.includes('invalid login') ||
                lowerMsg.includes('invalid credentials') ||
                lowerMsg.includes('wrong password') ||
                lowerMsg.includes('senha incorreta') ||
                lowerMsg.includes('email não encontrado') ||
                lowerMsg.includes('invalid email or password') ||
                lowerMsg.includes('incorrect email or password') ||
                lowerMsg.includes('user not found')) {
                return {
                    title: 'Credenciais Incorretas',
                    message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
                };
            }

            // Verificar erros de senha
            if (lowerMsg.includes('password') && (lowerMsg.includes('weak') || lowerMsg.includes('invalid') || lowerMsg.includes('short'))) {
                return {
                    title: 'Senha Inválida',
                    message: 'A senha não atende aos requisitos mínimos. Use uma senha mais forte.'
                };
            }

            // Verificar erros de email inválido
            if (lowerMsg.includes('invalid email') || lowerMsg.includes('email format')) {
                return {
                    title: 'Email Inválido',
                    message: 'O formato do email é inválido. Verifique e tente novamente.'
                };
            }

            return {
                title: 'Erro no Processamento',
                message: finalErrorMessage
            };
        }
    }

    // Erro genérico
    return {
        title: 'Erro Desconhecido',
        message: error.message || 'Ocorreu um erro inesperado. Tente novamente.'
    };
}

function showNotification(type, title, message, duration = 4000) {
    // Remove notificação anterior se existir
    const existing = document.querySelector('.notification-popup');
    if (existing) {
        existing.remove();
    }

    const popup = document.createElement('div');
    popup.className = `notification-popup ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    popup.innerHTML = `
        <div class="icon">${icons[type] || 'ℹ'}</div>
        <div class="content">
            <div class="title">${title}</div>
            <div class="message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('hiding');
        setTimeout(() => popup.remove(), 300);
    }, duration);
}

function showLoading(message = 'Carregando...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Função de cadastro
function enviarInfo(){
    const nomeUsuario = document.getElementById('name_user');
    const senhaUsuario = document.getElementById('password_user');
    const emailUsuario = document.getElementById('email_user');

    // Validação básica
    if (!nomeUsuario.value || !senhaUsuario.value || !emailUsuario.value) {
        showNotification('error', 'Erro de Validação', 'Por favor, preencha todos os campos!', 3000);
        return;
    }

    // Mostrar loading
    const loading = showLoading('Cadastrando usuário...');

    axios.post('https://sorveteria-backend-di63.onrender.com/cadastroUsuario', {
        nomeUser: nomeUsuario.value,
        senhaUser: senhaUsuario.value,
        emailUser: emailUsuario.value
    }).then(function(response) {
        hideLoading();
        showNotification('success', 'Cadastro Realizado!', response.data.message || 'Usuário cadastrado com sucesso!', 2000);
        nomeUsuario.value = '';
        senhaUsuario.value = '';
        emailUsuario.value = '';
        
        // Redirecionar para a tela de previsão após o cadastro
        setTimeout(() => {
            const redirectLoading = showLoading('Redirecionando...');
            setTimeout(() => {
                // Caminho relativo que funciona tanto em dev quanto em build
                window.location.href = './src/main.html';
            }, 500);
        }, 2000);
    }).catch(function(error){
        hideLoading();
        
        // Analisar erro do backend e obter mensagem específica
        // O backend agora retorna mensagens específicas, então usamos diretamente
        const errorInfo = parseBackendError(error);
        
        showNotification('error', errorInfo.title, errorInfo.message, 6000);
        console.log('Erro gerado: ', error);
        console.log('Detalhes do erro: ', error.response?.data);
    });
}

// Função de login
function loginUser() {
    const verificarEmail = document.getElementById('verify_email');
    const verificarSenha = document.getElementById('verify_password');

    // Validação básica
    if (!verificarEmail.value || !verificarSenha.value) {
        showNotification('error', 'Erro de Validação', 'Por favor, preencha todos os campos!', 3000);
        return;
    }

    // Mostrar loading
    const loading = showLoading('Verificando credenciais...');

    axios.post('https://sorveteria-backend-di63.onrender.com/verificarUsuario', {
        email_verificacao: verificarEmail.value,
        senha_verificacao: verificarSenha.value
    }).then(function(response) {
        hideLoading();
        showNotification('success', 'Login Realizado!', response.data.message || 'Login bem-sucedido!', 2000);
        
        // Mostrar loading de redirecionamento
        setTimeout(() => {
            const redirectLoading = showLoading('Redirecionando...');
            setTimeout(() => {
                // Caminho relativo que funciona tanto em dev quanto em build
                window.location.href = './src/main.html';
            }, 500);
        }, 2000);
    }).catch(function(error){
        hideLoading();
        
        // Analisar erro do backend e obter mensagem específica
        // O backend agora retorna mensagens específicas, então usamos diretamente
        const errorInfo = parseBackendError(error);
        
        showNotification('error', errorInfo.title, errorInfo.message, 6000);
        console.log('Erro gerado: ', error);
        console.log('Detalhes do erro: ', error.response?.data);
    });
}

// Função de previsão
function previsao2026(){
    const inputs = document.querySelectorAll('.anosVendidos');
    const listaVendas = [];
    
    // Validar e converter para inteiros
    for (let input of inputs) {
        const value = input.value.trim();
        
        // Verificar se está vazio
        if (!value) {
            showNotification('error', 'Campos Inválidos', 'Por favor, preencha todos os campos com valores válidos!', 3000);
            return;
        }
        
        // Converter para número inteiro
        const numero = parseInt(value, 10);
        
        // Verificar se é um número válido e inteiro
        if (isNaN(numero) || numero < 0 || numero !== parseFloat(value)) {
            showNotification('error', 'Valor Inválido', 'Por favor, insira apenas números inteiros não negativos (ex: 100, 250, 500).', 4000);
            input.focus();
            return;
        }
        
        listaVendas.push(numero);
    }
    
    // Verificar se todos os valores são maiores que zero
    if (listaVendas.some(venda => venda === 0)) {
        showNotification('error', 'Campos Inválidos', 'Por favor, preencha todos os campos com valores maiores que zero!', 3000);
        return;
    }

    const resultadoElement = document.getElementById('numero_previsto');
    
    // Mostrar loading de cálculo
    const loading = showLoading('Calculando previsão...');
    resultadoElement.textContent = 'Calculando...';

    // Delay mínimo para garantir que o loading seja visível (2 segundos)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));

    // Fazer a requisição e aguardar o delay mínimo
    Promise.all([
        axios.post('https://sorveteria-backend-di63.onrender.com/calculoFuturo', {
            listaVendas: listaVendas
        }),
        minLoadingTime
    ]).then(function(results){
        const response = results[0];
        hideLoading();
        const previsao = response.data.predict2026;
        resultadoElement.textContent = `Previsão 2026: R$ ${parseFloat(previsao).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        showNotification('success', 'Cálculo Concluído!', 'Previsão calculada com sucesso!', 3000);
        console.log(response);
    }).catch(function(error){
        // Aguardar o delay mínimo mesmo em caso de erro
        minLoadingTime.then(() => {
            hideLoading();
            resultadoElement.textContent = 'Erro ao calcular previsão';
            
            // Analisar erro do backend e obter mensagem específica
            const errorInfo = parseBackendError(error);
            
            // Verificar erros específicos de cálculo
            if (error.response?.data?.error) {
                const errorMsg = error.response.data.error.message || error.response.data.error.toString();
                if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('invalid data')) {
                    errorInfo.title = 'Dados Inválidos para Cálculo';
                    errorInfo.message = 'Os valores fornecidos não são válidos para realizar o cálculo. Verifique os números inseridos.';
                }
            }
            
            showNotification('error', errorInfo.title, errorInfo.message, 6000);
            console.log('Erro gerado: ', error);
            console.log('Detalhes do erro: ', error.response?.data);
        });
    });
}

// Expor funções globalmente para funcionar com módulos ES6
// Isso permite que as funções sejam acessadas via onclick e onsubmit nos HTMLs
window.enviarInfo = enviarInfo;
window.loginUser = loginUser;
window.previsao2026 = previsao2026;
