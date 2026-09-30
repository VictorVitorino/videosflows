# 🎬 DTS Office — um mockumentary interativo

Um jogo de escritório em terceira pessoa, na pegada de *The Office*, estrelado pelos diretores do **DTS — Digital & Technology Services**. Você escolhe quem é, anda pelo escritório, conversa com colegas que são **agentes com personalidade**, cumpre missões absurdas e prega peças. Toda conversa termina virando uma **cena gravada em vídeo**, com letterbox, câmera na mão, o famoso olhar para a câmera e um depoimento no confessionário.

## ▶️ Como jogar

Abra `index.html` no navegador (Chrome, Edge ou Firefox). Não precisa de servidor nem de instalação.

| Ação | Teclado | Mouse / toque |
|---|---|---|
| Andar | `WASD` / setas | tocar no chão |
| Interagir | `E` / `Espaço` | tocar na pessoa ou no objeto |
| Escolher resposta | `1`–`5` | tocar na opção |
| Fechar | `Esc` | ✕ |

## 🧩 O que tem no jogo

- **7 personagens jogáveis**, cada um com cargo, arquétipo, bordão e uma missão que pede aos outros:

| Personagem | Arquétipo | Missão |
|---|---|---|
| Fabio Quintão | O Chefe Visionário | 🎤 O Discurso Épico: café + discurso impresso |
| Ana Paula Costa | A Guardiã da Governança | 🖊️ A Caneta da Governança: achar a caneta azul da sorte |
| Guilherme Antonialli | O Mestre dos Dados | 📊 Auditoria da Geladeira: auditar 3 itens |
| Thiago Vieira | O Arquiteto de Soluções | 🖥️ O Servidor Maestro Caiu: resolver no Terminal |
| Luis Ricupero | O Rei do Networking | 🕵️ O Mistério da Marmita: investigar e apontar o culpado |
| Rodrigo Brea | O Fechador de Negócios | 🔔 Fechando o Negócio: proposta impressa + tocar o sino |
| Victor Vitorino | O Criador do Flows | 🚀 Suba uma Skill no Flows |

- **Agentes vivos:** os colegas andam sozinhos, tomam café, auditam a geladeira, batem na impressora, fofocam em duplas (com piadas internas próprias de cada dupla) e às vezes vêm puxar papo com você. No diálogo, eles "pensam" 🤖 antes de responder e lembram da afinidade com você (❤️).
- **Conversas ramificadas:** bater papo (3 temas por pessoa × 3 respostas), missões, pegadinhas (8 tipos), presentes (cada um tem um favorito) e o interrogatório da marmita. O culpado é sorteado a cada partida.
- **14 objetos interativos:** máquina de café, geladeira, micro-ondas, máquina de snacks (que trava), bebedouro das fofocas, almoxarifado, impressora (atolamento na bandeja 7), sino, sofá, a Samambaia Sênior, quadro branco ("dias sem incidente de Excel"), TV, a caneca "Melhor MD do Mundo" e a **câmera do documentário** para gravar depoimentos.
- **Computador DTS OS:** Flows (subir skill no Catálogo DTS), Terminal, Outlook, Teams, Power BI (KPI do café com dados reais da partida) e Paciência.
- **Cenas em vídeo:** cada cena é gravada direto do canvas (com o áudio do jogo) e pode ser **baixada em .webm**. O 🎞️ *Rolo de Cenas* guarda todas as da sessão.
- **Final:** ao concluir as 6 missões, acontece o **DTSies Awards 🏆**, com prêmio para cada um e o "Talento do Ano" para você.
- **Extras:** vozes em pt-BR (🗣️ usa o sintetizador do navegador), efeitos sonoros sintetizados, Modo Bobblehead (🧸 fotos no lugar da cabeça), progresso salvo automaticamente e layout que funciona no celular.

## 📷 Fotos e caricaturas

Nos arquivos do repositório, só o **Fabio** tem uma caricatura 3D pronta (`Frames Escolha Principal.png`). O rosto dele foi recortado e embutido em `js/avatars.js`. Os outros personagens usam caricaturas desenhadas por código, com traços configuráveis.

Para deixar cada pessoa parecida com o original:

1. Na seleção de personagem, clique em **🎨 Caricatura / 📷 Foto**.
2. Ajuste pele, cabelo, barba, óculos e roupa, **ou** envie a foto da pessoa.
3. A foto aparece nos diálogos e, com o 🧸 **Modo Bobblehead**, na cabeça do boneco.

As fotos ficam só no navegador de quem enviou (`localStorage`). Para embutir uma foto de forma permanente, adicione o rosto em `EMBEDDED_PHOTOS` (em `js/avatars.js`) como *data URI*. Uma imagem externa "suja" o canvas e impede a gravação em vídeo, por isso a foto precisa ser embutida.

> Observação: todas as imagens e vídeos importados para a raiz do repositório foram truncados em ~786 KB no upload. Só a parte de cima de cada imagem está íntegra.

## 🏗️ Arquitetura

```
index.html        Estrutura da interface + design system (CSS)
js/data.js        CONTEÚDO: elenco, falas, missões, pegadinhas, fofocas, prêmios
js/art.js         Caricaturas procedurais (4 direções, humores, piscadas) + mobília 3/4
js/world.js       Planta do escritório, colisões, pathfinding A* com suavização
js/scene.js       Motor de cenas: letterbox, câmera, confessional, FX, gravação
js/ui.js          Diálogos, painéis, computador (Flows/Terminal/...), estúdio de caricatura
js/audio.js       Efeitos sintetizados (WebAudio) + vozes (Web Speech API)
js/main.js        Estado do jogo, IA dos agentes, interações, missões e roteiros das cenas
```

- **Para mudar falas e piadas:** edite só `js/data.js`. Os placeholders `{p}`, `{n}` e `{c}` viram, respectivamente, o nome do jogador, o do colega e o do culpado da marmita.
- **Para criar uma cena:** um roteiro é uma lista de *beats* (`title`, `stage`, `cut`, `say`, `fx`, `look`, `conf`, `award`, `end`). Veja `sceneTalk` e `sceneMission` em `js/main.js`.
- **Para testar rápido:** abra com `index.html?turbo` e o tempo passa 4× mais rápido.

## 🚀 Próximos passos sugeridos

- **Agentes com IA generativa de verdade:** trocar as falas roteirizadas por um modelo de linguagem, usando a personalidade de cada personagem (`data.js`) como *system prompt*. As opções de resposta seriam geradas em tempo real. Isso exige um backend que guarde a chave de API, porque a chave não pode ficar exposta no navegador.
- Fotos oficiais de todo o elenco embutidas em `avatars.js`.
- Modo multiplayer (cada diretor controla o próprio personagem).
