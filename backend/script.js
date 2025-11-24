import { createClient } from "@supabase/supabase-js"
import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'


const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());


const supabase_access = createClient(
    process.env.URL_SUPABASE,
    process.env.SERVICE_ROLE
)


app.post('/cadastroUsuario', async (req, res) => {

    const nome = req.body.nomeUser;
    const senha = req.body.senhaUser;
    const email = req.body.emailUser;


    const { data: authData, error: authError } = await supabase_access.auth.admin.createUser({

        email: email,
        password: senha,
        user_metadata: {
            nome: nome
        }


    });

    if (authError) {
        console.log('Erro gerado na criação! Confira: ', authError)
    }


    const userID = authData.user.id;


    const {error: updateError} = await supabase_access.auth.admin.updateUserById(
        userID, {
            email_confirm: true
        }
    );

    const { data: insertData, error: insertError } = await supabase_access.from('usuarioscadastro').insert({


        id: userID,
        nome: nome,
        email: email,
        senha: senha

    })


    if (insertError) {
        console.log('Error ao inseriro no banco de dados: ', insertError)
    };

    return res.json({

        message: 'Usuário cadastrado com sucesso!'


    });



});




app.post('/verificarUsuario', async (req, res) => {

    const emailVerificar = req.body.email_verificacao.trim().toLowerCase();
    const senhaVerificar = req.body.senha_verificacao.trim();

    const { data: userData, error: authError } = await supabase_access.auth.signInWithPassword({

        email:emailVerificar,
        password:senhaVerificar



    });

    if (authError){

        console.log('Erro ao encontrar email ou senha! Verifique se as informações estão corretas.', authError)

    } else {
        res.json({
            message: 'Login bem-sucedido!'
        })
    }


});


app.listen(5000);