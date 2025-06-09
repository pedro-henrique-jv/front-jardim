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
    await loadSpeciesData();

    const origem = getURLParameter("src");
    const especieId = getURLParameter("id");

    // Se veio da origem "qr", mostra o botão de coleta
    if (origem === "qr") {
        const coletarDiv = document.getElementById("coletar-container");
        coletarDiv.style.display = "block";

        const botao = document.getElementById("btn-coletar");
        botao.addEventListener("click", async () => {
            const msgEl = document.getElementById("msg-coleta");

            // Pega os dados mais atualizados do usuário no localStorage
            const usuarioData = JSON.parse(localStorage.getItem("usuario"));
            const token = usuarioData?.token;
            const usuario_id = usuarioData?.usuario_id || usuarioData?.id;

            if (!token || !usuario_id) {
                msgEl.textContent = "Você precisa estar logado!.";
                return;
            }

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

                if (!res.ok) {
                    const erroTexto = await res.text();
                    msgEl.textContent = "Erro ao tentar coletar checkpoint.";
                    console.error("Erro do servidor:", res.status, erroTexto);
                    return;
                }

                const dados = await res.json();
                msgEl.textContent = dados.mensagem ?? "Checkpoint coletado!";
            } catch (erro) {
                msgEl.textContent = "Erro ao tentar coletar checkpoint.";
                console.error("Erro de rede:", erro);
            }
        });
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





