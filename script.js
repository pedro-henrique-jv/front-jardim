function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

const origem = getURLParameter("src");
const especieId = getURLParameter("id");
const usuarioData = JSON.parse(localStorage.getItem("usuario"));
const logado = usuarioData && usuarioData.token;

if (origem === "qr" && !logado) {
    alert('Você precisa estar logado para capturar espécies por QR Code.');
    window.location.href = '../pages/login.html';
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
    if (!especieId) return;
    const speciesData = await getSpeciesData(especieId);

    if (speciesData) {
        setElementText("nome-popular", speciesData.nome);
        setElementText("nome-cientifico", speciesData.nome_cientifico);
        setImageSrc("imagem", speciesData.imagem);
        setElementText("descricao", speciesData.descricao);
        const fonteEl = document.getElementById("fonte");
        if (speciesData.fonte) {
            fonteEl.innerHTML = `Fonte: <a href="${speciesData.fonte}" target="_blank" style="color:blue;">${speciesData.fonte}</a>`;
        } else {
            fonteEl.innerHTML = "";
        }
    } else {
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
    } catch {
        return null;
    }
}

async function verificarSeJaCapturou(especieId) {
    const usuario_id = usuarioData?.usuario_id || usuarioData?.id;
    const token = usuarioData?.token;
    if (!usuario_id || !token) return false;

    try {
        const res = await fetch(`https://back-jveg.onrender.com/plantas/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const dados = await res.json();
        const lista = Array.isArray(dados) ? dados : dados.plantas || [];

        return lista.some(planta => 
            planta.especie_id?.toLowerCase() === especieId.toLowerCase()
        );
    } catch {
        return false;
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
    const mensagemJaCapturado = document.getElementById("mensagem-ja-capturado");
    const mensagemParabens = document.getElementById("mensagem-parabens");

    async function carregarPergunta() {
        quizContainer.style.display = "block";
        especieContainer.style.display = "none";
        msgQuiz.textContent = "";
        acoesErro.style.display = "none";
        alternativasDiv.innerHTML = "";
        if (mensagemParabens) mensagemParabens.style.display = "none";
        if (mensagemJaCapturado) mensagemJaCapturado.style.display = "none";
        document.getElementById("pergunta").textContent = "Carregando pergunta...";

        try {
            const token = usuarioData.token;
            const res = await fetch("https://back-jveg.onrender.com/quiz/pergunta/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const quizData = await res.json();

            document.getElementById("pergunta").textContent = quizData.pergunta;
            alternativasDiv.innerHTML = `
                ${["a", "b", "c", "d"].map(letter => `
                    <div class="form-check p-3 mb-2 rounded border border-success bg-light">
                        <input class="form-check-input" type="radio" name="resposta" id="resposta${letter}" value="${letter.toUpperCase()}" hidden>
                        <label class="form-check-label fw-semibold w-100 p-2 rounded" for="resposta${letter}" style="cursor: pointer;">
                            ${letter.toUpperCase()}) ${quizData["alternativa_" + letter]}
                        </label>
                    </div>
                `).join("")}
            `;

            btnVerificar.onclick = async () => {
                const respostaSelecionada = document.querySelector('input[name="resposta"]:checked');
                if (!respostaSelecionada) {
                    msgQuiz.textContent = "Selecione uma alternativa.";
                    return;
                }

                if (respostaSelecionada.value === quizData.resposta_correta) {
                    msgQuiz.textContent = "";
                    quizContainer.style.display = "none";
                    especieContainer.style.display = "block";

                    await coletarCheckpoint();

                    if (mensagemParabens) mensagemParabens.style.display = "block";
                    if (mensagemJaCapturado) mensagemJaCapturado.style.display = "none";

                    await loadSpeciesData();
                } else {
                    msgQuiz.textContent = "Resposta incorreta!";
                    acoesErro.style.display = "block";
                    acoesErro.scrollIntoView({ behavior: 'smooth' });
                    btnVerificar.disabled = true;
                }
            };

        } catch {
            document.getElementById("pergunta").textContent = "Erro ao carregar pergunta.";
        }
    }

    async function coletarCheckpoint() {
        const usuario_id = usuarioData?.usuario_id || usuarioData?.id;
        const token = usuarioData?.token;
        if (!token || !usuario_id) return;

        try {
            await fetch("https://back-jveg.onrender.com/plantas/", {
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
        } catch {}
    }

    if (btnNovaPergunta) {
        btnNovaPergunta.addEventListener("click", () => {
            carregarPergunta();
            btnVerificar.disabled = false;
            if (mensagemParabens) mensagemParabens.style.display = "none";
            if (mensagemJaCapturado) mensagemJaCapturado.style.display = "none";
        });
    }

    if (origem === "qr" && logado) {
        const jaCapturou = await verificarSeJaCapturou(especieId);

        if (jaCapturou) {
            especieContainer.style.display = "block";
            quizContainer.style.display = "none";
            if (mensagemJaCapturado) mensagemJaCapturado.style.display = "block";
            if (mensagemParabens) mensagemParabens.style.display = "none";
            await loadSpeciesData();
        } else {
            await carregarPergunta();
        }
    } else {
        especieContainer.style.display = "block";
        quizContainer.style.display = "none";
        await loadSpeciesData();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const userNameSpan = document.getElementById("userNameSpan");
    const userDropdownMenu = document.getElementById("userDropdownMenu");

    const path = window.location.pathname;
    const estaNaRaiz = path.endsWith("index.html") || path === "/" || /^\/[^/]+\/?$/.test(path);

    const caminhoLogin = estaNaRaiz ? "pages/login.html" : "../pages/login.html";
    const caminhoCadastro = estaNaRaiz ? "pages/cadastro.html" : "../pages/cadastro.html";

    if (usuario && usuario.nome) {
        userNameSpan.textContent = usuario.nome;
        userDropdownMenu.innerHTML = `<li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>`;

        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn?.addEventListener("click", () => {
            localStorage.removeItem("usuario");
            const partes = window.location.pathname.split("/");
            const repo = partes.length > 1 ? partes[1] : "";
            window.location.href = `${window.location.origin}/${repo ? repo + "/" : ""}index.html`;
        });
    } else {
        userNameSpan.innerHTML = `<i class="bi bi-person" style="font-size: 2.5rem; color:white;"></i>`;
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="${caminhoLogin}">Login</a></li>
            <li><a class="dropdown-item" href="${caminhoCadastro}">Cadastre-se</a></li>
        `;
    }
});
