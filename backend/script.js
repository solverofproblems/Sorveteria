import { createClient } from "@supabase/supabase-js";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {PolynomialRegression} from "ml-regression";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());


const supabase_access = createClient(
    process.env.URL_SUPABASE,
    process.env.SERVICE_ROLE
)


app.post('/cadastroUsuario', async (req, res) => {

    try {
        const nome = req.body.nomeUser;
        const senha = req.body.senhaUser;
        const email = req.body.emailUser;

        // Validação básica
        if (!nome || !senha || !email) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Por favor, preencha todos os campos (nome, email e senha).'
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido',
                message: 'O formato do email é inválido. Verifique e tente novamente.'
            });
        }

        // Validação de senha
        if (senha.length < 6) {
            return res.status(400).json({
                error: 'Senha muito curta',
                message: 'A senha deve ter no mínimo 6 caracteres.'
            });
        }

        const { data: authData, error: authError } = await supabase_access.auth.admin.createUser({
            email: email,
            password: senha,
            user_metadata: {
                nome: nome
            }
        });

        // Tratamento de erros do Supabase Auth
        if (authError) {
            console.log('Erro gerado na criação! Confira: ', authError);
            
            const errorMessage = authError.message || '';
            const lowerErrorMsg = errorMessage.toLowerCase();

            // Verificar se é erro de email já existente
            if (lowerErrorMsg.includes('user already registered') || 
                lowerErrorMsg.includes('email already exists') ||
                lowerErrorMsg.includes('already registered') ||
                authError.status === 422 && lowerErrorMsg.includes('email')) {
                return res.status(409).json({
                    error: 'Email já cadastrado',
                    message: 'Este email já está cadastrado no sistema. Tente fazer login ou use outro email.'
                });
            }

            // Erro de senha fraca
            if (lowerErrorMsg.includes('password') && (lowerErrorMsg.includes('weak') || lowerErrorMsg.includes('short'))) {
                return res.status(400).json({
                    error: 'Senha inválida',
                    message: 'A senha não atende aos requisitos mínimos. Use uma senha mais forte.'
                });
            }

            // Erro genérico do Supabase
            return res.status(400).json({
                error: 'Erro ao criar usuário',
                message: errorMessage || 'Não foi possível criar o usuário. Tente novamente.'
            });
        }

        if (!authData || !authData.user) {
            return res.status(500).json({
                error: 'Erro no servidor',
                message: 'Não foi possível criar o usuário. Tente novamente mais tarde.'
            });
        }

        const userID = authData.user.id;

        // Confirmar email do usuário
        const {error: updateError} = await supabase_access.auth.admin.updateUserById(
            userID, {
                email_confirm: true
            }
        );

        if (updateError) {
            console.log('Erro ao confirmar email: ', updateError);
            // Não retornar erro aqui, apenas log, pois o usuário já foi criado
        }

        // Inserir no banco de dados
        const { data: insertData, error: insertError } = await supabase_access.from('usuarioscadastro').insert({
            id: userID,
            nome: nome,
            email: email,
            senha: senha
        });

        if (insertError) {
            console.log('Erro ao inserir no banco de dados: ', insertError);
            
            // Se o erro for de duplicata, significa que o usuário já existe na tabela
            const insertErrorMsg = insertError.message || '';
            if (insertErrorMsg.toLowerCase().includes('duplicate') || 
                insertErrorMsg.toLowerCase().includes('unique') ||
                insertError.code === '23505') {
                return res.status(409).json({
                    error: 'Email já cadastrado',
                    message: 'Este email já está cadastrado no sistema. Tente fazer login ou use outro email.'
                });
            }

            // Outros erros de inserção
            return res.status(500).json({
                error: 'Erro ao salvar dados',
                message: 'Usuário criado, mas houve erro ao salvar informações adicionais. Entre em contato com o suporte.'
            });
        }

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!'
        });

    } catch (error) {
        console.error('Erro inesperado no cadastro: ', error);
        return res.status(500).json({
            error: 'Erro no servidor interno',
            message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
        });
    }
});




app.post('/verificarUsuario', async (req, res) => {

    try {
        const emailVerificar = req.body.email_verificacao?.trim().toLowerCase();
        const senhaVerificar = req.body.senha_verificacao?.trim();

        // Validação básica
        if (!emailVerificar || !senhaVerificar) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Por favor, preencha todos os campos (email e senha).'
            });
        }

        const { data: userData, error: authError } = await supabase_access.auth.signInWithPassword({
            email: emailVerificar,
            password: senhaVerificar
        });

        if (authError) {
            console.log('Erro ao encontrar email ou senha! Verifique se as informações estão corretas.', authError);
            
            const errorMessage = authError.message || '';
            const lowerErrorMsg = errorMessage.toLowerCase();

            // Verificar tipo específico de erro
            if (lowerErrorMsg.includes('invalid login') ||
                lowerErrorMsg.includes('invalid credentials') ||
                lowerErrorMsg.includes('wrong password') ||
                lowerErrorMsg.includes('invalid email or password') ||
                lowerErrorMsg.includes('incorrect email or password') ||
                authError.status === 400) {
                return res.status(401).json({
                    error: 'Credenciais inválidas',
                    message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
                });
            }

            if (lowerErrorMsg.includes('email not confirmed') ||
                lowerErrorMsg.includes('email not verified')) {
                return res.status(403).json({
                    error: 'Email não confirmado',
                    message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.'
                });
            }

            if (lowerErrorMsg.includes('user not found') ||
                lowerErrorMsg.includes('email not found')) {
                return res.status(404).json({
                    error: 'Usuário não encontrado',
                    message: 'Nenhum usuário encontrado com este email. Verifique o email ou cadastre-se.'
                });
            }

            // Erro genérico
            return res.status(401).json({
                error: 'Erro ao fazer login',
                message: errorMessage || 'Não foi possível fazer login. Tente novamente.'
            });
        }

        if (!userData || !userData.user) {
            return res.status(500).json({
                error: 'Erro no servidor',
                message: 'Não foi possível processar o login. Tente novamente mais tarde.'
            });
        }

        return res.json({
            message: 'Login bem-sucedido!'
        });

    } catch (error) {
        console.error('Erro inesperado no login: ', error);
        return res.status(500).json({
            error: 'Erro no servidor interno',
            message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
        });
    }
});

app.post('/calculoFuturo', async(req,res) => {

    try {
        const vendas = req.body.listaVendas;

        // Validação básica
        if (!vendas || !Array.isArray(vendas)) {
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'A lista de vendas é obrigatória e deve ser um array.'
            });
        }

        if (vendas.length < 2) {
            return res.status(400).json({
                error: 'Dados insuficientes',
                message: 'É necessário pelo menos 2 valores de vendas para realizar o cálculo.'
            });
        }

        // Verificar se todos os valores são números válidos
        const valoresValidos = vendas.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
        if (valoresValidos.length !== vendas.length) {
            return res.status(400).json({
                error: 'Valores inválidos',
                message: 'Todos os valores devem ser números válidos e maiores que zero.'
            });
        }

        let qntdAnos = [];
        for (let x = 1; x <= vendas.length; x++) {
            qntdAnos.push(x);
        }

        const degree = 3;

        try {
            const regression = new PolynomialRegression(qntdAnos, vendas, degree);
            const previsaoVendas2026 = regression.predict(7);

            // Verificar se o resultado é válido
            if (isNaN(previsaoVendas2026) || !isFinite(previsaoVendas2026)) {
                return res.status(400).json({
                    error: 'Erro no cálculo',
                    message: 'Não foi possível calcular a previsão com os valores fornecidos. Verifique os dados.'
                });
            }

            return res.json({
                message: "Previsão feita com sucesso!",
                predict2026: previsaoVendas2026.toFixed(2),
                Polinomio: `Previsão feita utilizando uma função polinomial de grau ${degree}`
            });

        } catch (calcError) {
            console.error('Erro no cálculo de regressão: ', calcError);
            return res.status(400).json({
                error: 'Erro no cálculo',
                message: 'Não foi possível realizar o cálculo de previsão. Verifique os valores fornecidos.'
            });
        }

    } catch (error) {
        console.error('Erro inesperado no cálculo: ', error);
        return res.status(500).json({
            error: 'Erro no servidor interno',
            message: 'Ocorreu um erro inesperado ao processar o cálculo. Tente novamente mais tarde.'
        });
    }
})



app.listen(5000);