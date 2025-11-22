function enviarInfo(){

    const nomeUsuario = document.getElementById('name_user')
    const senhaUsuario = document.getElementById('password_user')
    const emailUsuario = document.getElementById('email_user')

    console.log(nomeUsuario.value)
    console.log(senhaUsuario.value)
    console.log(emailUsuario.value)

    axios.post('http://localhost:5000/cadastroUsuario', {
        nomeUser : nomeUsuario.value,
        senhaUser : senhaUsuario.value,
        emailUser : emailUsuario.value
    }).then(function(response) {
        console.log('Tudo certo!')
    }).catch(function(error){
        console.log('Erro gerado: ', error)
    })
}


