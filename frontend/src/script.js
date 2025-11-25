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
        console.log(response.data.message)
    }).catch(function(error){
        console.log('Erro gerado: ', error)
    })
}


function loginUser() {

    const verificarEmail = document.getElementById('verify_email')
    const verificarSenha = document.getElementById('verify_password')

    axios.post('http://localhost:5000/verificarUsuario', {
        email_verificacao:verificarEmail.value,
        senha_verificacao:verificarSenha.value
    }).then(function(response) {
        console.log(response.data.message);
        window.location.href = "/src/main.html"

    }).catch(function(error){
        console.log('Erro gerado: ', error)
    })

}



function previsao2026(){

    const listaVendas = [...document.querySelectorAll('.anosVendidos')].map(input => Number(input.value));

    axios.post('http://localhost:5000/calculoFuturo', {

        listaVendas : listaVendas


    }).then(function(response){

        console.log(response);


    }).catch(function(error){
        console.log('Erro gerado: ', error)
    })


}

