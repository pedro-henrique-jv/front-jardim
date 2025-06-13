function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setImageSrc(id, src) {
    const img = document.getElementById(id);
    if (img) img.src = src;
}

async function loadSpeciesData() {
    const speciesId = getURLParameter("id");  
    if (!speciesId) {
        return;
    }

    const speciesData = await getSpeciesData(speciesId);

    if (speciesData) {
        setElementText("nome-popular", speciesData.nome);
        setElementText("nome-cientifico", speciesData.nome_cientifico);
        setImageSrc("imagem", speciesData.imagem);
        setElementText("descricao", speciesData.descricao);
        setElementText("fonte", speciesData.fonte ? `Fonte: ${speciesData.fonte}` : "");
    } else {
        console.warn("Espécie não encontrada:", speciesId);
        setElementText("nome-popular", "Espécie não encontrada");
        setElementText("nome-cientifico", "");
        setImageSrc("imagem", "");
        setElementText("descricao", "Não há informações disponíveis para esta espécie.");
        setElementText("fonte", "");
    }
}

async function getSpeciesData(id) {
    try {
        const response = await fetch('../especies.json');
        const speciesList = await response.json();
        return speciesList.find(species => species.id.toLowerCase() === id.toLowerCase()); 
    } catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error);
        return null;
    }
}

window.onload = async () => {
    const especieContainer = document.getElementById("especie-container");
    const quizContainer = document.getElementById("quiz-container");
    const alternativasDiv = document.getElementById("alternativas");
    const msgQuiz = document.getElementById("msg-quiz");
    const acoesErro = document.getElementById("acoes-pos-erro");
    const btnVerificar = document.getElementById("btn-verificar");
    const btnNovaPergunta = document.getElementById("btn-nova-pergunta");

    const origem = getURLParameter("src");
    const especieId = getURLParameter("id");
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    const logado = usuarioData && usuarioData.token;

    async function carregarPergunta() {
        if (!quizContainer || !alternativasDiv || !msgQuiz) {
            console.warn("Quiz container não encontrado no HTML.");
            return;
        }

        quizContainer.style.display = "block";
        especieContainer.style.display = "none";
        msgQuiz.textContent = "";
        acoesErro.style.display = "none";
        alternativasDiv.innerHTML = "";
        document.getElementById("pergunta").textContent = "Carregando pergunta...";

        try {
            const token = usuarioData?.token; 
            const res = await fetch("https://back-yr5z.onrender.com/quiz/pergunta/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const quizData = await res.json();
            
            document.getElementById("pergunta").textContent = quizData.pergunta;
            alternativasDiv.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="resposta" id="respostaA" value="A">
                    <label class="form-check-label" for="respostaA">${quizData.resposta_a}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="resposta" id="respostaB" value="B">
                    <label class="form-check-label" for="respostaB">${quizData.resposta_b}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="resposta" id="respostaC" value="C">
                    <label class="form-check-label" for="respostaC">${quizData.resposta_c}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="resposta" id="respostaD" value="D">
                    <label class="form-check-label" for="respostaD">${quizData.resposta_d}</label>
                </div>
            `;

            btnVerificar.onclick = async () => {
                const respostaSelecionada = document.querySelector('input[name="resposta"]:checked');
                if (!respostaSelecionada) {
                    msgQuiz.textContent = "Selecione uma alternativa.";
                    return;
                }

                if (respostaSelecionada.value === quizData.resposta_correta) {
                    msgQuiz.textContent = "Correto! Você coletou esta espécie.";
                    quizContainer.style.display = "none";
                    especieContainer.style.display = "block";
                    await coletarCheckpoint();
                    await loadSpeciesData();
                } else {
                    msgQuiz.textContent = "Resposta incorreta!";
                    acoesErro.style.display = "block";
                    btnVerificar.disabled = true;
                }
            };
        } catch (error) {
            document.getElementById("pergunta").textContent = "Erro ao carregar pergunta.";
            console.error(error);
        }
    }

    async function coletarCheckpoint() {
        const usuario_id = usuarioData?.usuario_id || usuarioData?.id;
        const token = usuarioData?.token;

        if (!token || !usuario_id) return;

        try {
            const res = await fetch("https://back-yr5z.onrender.com/plantas/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    usuario_id: usuario_id,
                    especie_id: especieId
                })
            });

            const dados = await res.json();
            console.log(dados.mensagem ?? "Checkpoint coletado!");
        } catch (erro) {
            console.error("Erro ao coletar checkpoint:", erro);
        }
    }

    if (btnNovaPergunta) {
        btnNovaPergunta.addEventListener("click", () => {
            carregarPergunta();
            btnVerificar.disabled = false;
        });
    }

    if (origem === "qr" && logado) {
        await carregarPergunta();
    } else {
        await loadSpeciesData();
    }
};


// Função auxiliar para ler parâmetros da URL
function getURLParameter(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}


// Função auxiliar para ler parâmetros da URL (src, id, etc.)
function getURLParameter(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}

document.addEventListener("DOMContentLoaded", function () {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const userNameSpan = document.getElementById("userNameSpan");
    const userDropdownMenu = document.getElementById("userDropdownMenu");

    // Detecta se estamos na raiz ou em uma subpasta
    const path = window.location.pathname;
    const estaNaRaiz = path.endsWith("index.html") || path === "/" || /^\/[^/]+\/?$/.test(path);

    // Caminhos corretos
    const caminhoLogin = estaNaRaiz ? "pages/login.html" : "../pages/login.html";
    const caminhoCadastro = estaNaRaiz ? "pages/cadastro.html" : "../pages/cadastro.html";

    if (usuario && usuario.nome) {
        // Usuário logado
        userNameSpan.textContent = usuario.nome;

        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
        `;

        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn?.addEventListener("click", () => {
            localStorage.removeItem("usuario");

            // Redireciona para index.html do repositório
            const partes = window.location.pathname.split("/");
            const repo = partes.length > 1 ? partes[1] : "";
            window.location.href = `${window.location.origin}/${repo ? repo + "/" : ""}index.html`;
        });
    } else {
        // Usuário não logado
        userNameSpan.innerHTML = `<i class="bi bi-person" style="font-size: 2.5rem; color:rgb(255, 255, 255);"></i>`;

        // Sempre exibe login e cadastro
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="${caminhoLogin}">Login</a></li>
            <li><a class="dropdown-item" href="${caminhoCadastro}">Cadastre-se</a></li>
        `;
    }
});





