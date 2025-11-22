import { createClient } from "@supabase/supabase-js"
import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'


const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const supabase_access = createClient(

    process.env.URL_SUPABASE,
    process.env.SERVICE_ROLE

)

app.post('/cadastroUsuario', async (req,res) => {

    const nome = req.body.nomeUser;
    const email = req.body.emailUser;
    const senha = req.body.senhaUser;

    console.log('Informações recebidas!!!')
    console.log(nome);
    console.log(senha);
    console.log(email);

    criarUsuario(nome, email, senha);

    res.send('Tudo certo por aqui!!')

})


export async function criarUsuario(nome, email, senha) {

    const {data, error} = await supabase_access.auth.admin.createUser({

        emailUser : email,
        passwordUser : senha,
        nameUser: nome

    })

    if (error) throw error
    return data

}


app.listen(5000);




