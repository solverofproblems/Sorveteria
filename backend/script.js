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

app.post('/calculoFuturo', async(req,res) => {

    const vendas = req.body.listaVendas;
    let qntdAnos = [];

    for (let x = 1; x <= vendas.length; x ++) {
        qntdAnos.push(x);
    }

    const degree = 3;

    const regression = new PolynomialRegression(qntdAnos, vendas, degree);

    const previsaoVendas2026 = regression.predict(7);

    res.json({

        message: "Previsão feita com sucesso!",
        predict2026 : previsaoVendas2026.toFixed(2),
        Polinomio : `Previsão feita utilizando uma função polinomial de grau ${degree}`
        
    });
   


})



app.listen(5000);