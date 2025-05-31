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
        console.error("Parâmetro 'id' não encontrado na URL.");
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

    // Tenta recuperar os dados do usuário do localStorage
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    const usuario_id = usuarioData?.id;

    // Se veio da origem "qr", mostra o botão de coleta
    if (origem === "qr") {
        const coletarDiv = document.getElementById("coletar-container");
        coletarDiv.style.display = "block";

        const botao = document.getElementById("btn-coletar");
        botao.addEventListener("click", async () => {
            const msgEl = document.getElementById("msg-coleta");

            if (!usuario_id) {
                msgEl.textContent = "Você precisa estar logado para pegar esta planta.";
                return;
            }

            try {
                const res = await fetch("https://back-yr5z.onrender.com/plantas/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario_id: usuario_id,
                        especie_id: especieId
                    })
                });

                if (!res.ok) {
                    const erroTexto = await res.text();
                    msgEl.textContent = "Erro ao tentar coletar a planta.";
                    console.error("Erro do servidor:", res.status, erroTexto);
                    return;
                }

                const dados = await res.json();
                msgEl.textContent = dados.mensagem ?? "Planta coletada com sucesso!";
            } catch (erro) {
                msgEl.textContent = "Erro ao tentar coletar a planta.";
                console.error("Erro de rede:", erro);
            }
        });
    }
};

// Função auxiliar para ler parâmetros da URL (src, id, etc.)
function getURLParameter(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}


document.addEventListener("DOMContentLoaded", function () {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const userNameSpan = document.getElementById("userNameSpan");
    const userDropdownMenu = document.getElementById("userDropdownMenu");

    if (usuario && usuario.nome) {
        // Se estiver logado, mostra o nome do usuário no lugar do ícone
        userNameSpan.textContent = usuario.nome;

        // Substitui o conteúdo do menu com o botão de logout
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
        `;

        // Após inserir o botão logout no DOM, adiciona o evento de clique
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("usuario");

                // Detecta o nome do repositório na URL para montar o caminho correto
                const repo = window.location.pathname.split("/")[1];

                // Redireciona para a página principal do site
                window.location.href = `${window.location.origin}/${repo}/index.html`;
            });
        }

    } else {
        // Se não estiver logado, mostra o ícone de pessoa
        userNameSpan.innerHTML = `<i class="bi bi-person fs-1"></i>`;

        // Coloca as opções de login e cadastro no menu
        userDropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="pages/login.html">Login</a></li>
            <li><a class="dropdown-item" href="pages/cadastro.html">Cadastre-se</a></li>
        `;
    }
});

