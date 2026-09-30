// =====================================================================
// DTS OFFICE — dados do elenco, missões, diálogos e piadas
// Tudo aqui é conteúdo: dá para editar falas sem mexer no motor.
// Placeholders: {p} = primeiro nome do jogador, {n} = NPC, {c} = culpado
// =====================================================================

const ITEMS = {
  cafe:        { icon: '☕', name: 'Café' },
  caneta:      { icon: '🖊️', name: 'Caneta genérica' },
  caneta_azul: { icon: '🔵', name: 'Caneta azul da sorte' },
  grampeador:  { icon: '📎', name: 'Grampeador' },
  postit:      { icon: '🗒️', name: 'Post-its' },
  gelatina:    { icon: '🍮', name: 'Gelatina suspeita' },
  iogurte:     { icon: '🥛', name: 'Iogurte de 2019' },
  bolo:        { icon: '🎂', name: 'Bolo de aniversário' },
  snack:       { icon: '🍫', name: 'Chocolate da máquina' },
  discurso:    { icon: '📜', name: 'Discurso do Fabio' },
  proposta:    { icon: '📄', name: 'Proposta do Rodrigo' },
};

const MOOD_EMOJI = { laugh: '😂', happy: '😄', surprised: '😲', angry: '😤', sad: '😢', love: '😍', look: '😐', neutral: '🙂' };

// Mesas do open space (x, y = canto superior esquerdo do tampo)
const DESKS = [
  { owner: 'ana',       x: 620, y: 540 },
  { owner: 'guilherme', x: 800, y: 540 },
  { owner: 'thiago',    x: 980, y: 540 },
  { owner: 'luis',      x: 620, y: 740 },
  { owner: 'rodrigo',   x: 800, y: 740 },
  { owner: 'victor',    x: 980, y: 740 },
];

const CAST = [
  // ------------------------------------------------------------- FABIO
  {
    id: 'fabio', name: 'Fabio Quintão', first: 'Fabio', role: 'Managing Director',
    archetype: 'O Chefe Visionário', color: '#f59e0b',
    bio: 'Acredita que todo problema se resolve com um discurso inspirador e uma caneca motivacional.',
    catch: 'Great people, greater impact!',
    look: { skin: '#e7b18c', hair: 'messy', hairColor: '#4a2f1f', glasses: true, beard: 'full', outfit: 'vest', outfitColor: '#3b4763', tie: '#1b1b1f', pants: '#2a2e3a' },
    voice: { pitch: 0.95, rate: 1.08 },
    home: { x: 1525, y: 214 },
    greet: [
      '{p}! Meu talento favorito! Não conta pros outros.',
      'Entra, entra! A porta do MD está sempre aberta. Literalmente: a maçaneta quebrou.',
      'Viu minha caneca nova? "Melhor MD do Mundo". Comprei eu mesmo, mas conta.',
    ],
    pairGreet: { ana: 'Ana Paula! Preciso de um RACI pro karaokê de sexta. Urgente.', rodrigo: 'Rodrigo! Me vende uma ideia. Qualquer uma. Tô inspirado.' },
    topics: [
      { title: 'A Piada do Trimestre', q: 'Tenho uma piada pra abertura do trimestre: por que o consultor atravessou a rua?', a: [
        { t: 'Pra fazer o benchmark do outro lado.', r: 'HAHAHA! Benchmark! Vou usar e dizer que é minha.', mood: 'laugh', aff: 2, fx: 'confetti', cw: 'fabio', conf: 'Humor é uma ferramenta de gestão. Li isso num post do LinkedIn. Um post meu.' },
        { t: 'Porque estava no escopo.', r: '...Isso é engraçado ou é só verdade? Enfim, amei.', mood: 'surprised', aff: 1, cw: 'player', conf: 'Ele riu quatro minutos depois. Eu cronometrei.' },
        { t: 'Não sei, Fabio.', r: 'Nem eu! Por isso te chamei. Vamos marcar um workshop.', mood: 'happy', aff: 0, cw: 'fabio', conf: 'Quando ninguém sabe a resposta, eu marco um workshop. Isso se chama liderança.' },
      ]},
      { title: 'O Offsite dos Sonhos', q: 'Estou planejando o offsite do DTS. Pra onde a gente vai?', a: [
        { t: 'Uma praia com Wi-Fi ruim.', r: 'Genial! Ninguém consegue abrir o Outlook. Produtividade emocional!', mood: 'laugh', aff: 2, fx: 'confetti', cw: 'fabio', conf: 'Offsite sem Wi-Fi. É assim que se constrói cultura. E bronzeado.' },
        { t: 'Uma escape room... de planilhas.', r: 'Sair de uma planilha de 40 abas em 60 minutos? É o nosso dia a dia! Aprovado.', mood: 'happy', aff: 1, cw: 'player', conf: 'Eu estava brincando. Agora tem orçamento.' },
        { t: 'Na sala de reunião mesmo.', r: 'Econômico E intimista. Você pensa como um sócio. Assustador.', mood: 'surprised', aff: 1, cw: 'fabio', conf: 'Economizar também é inovação. Mas vai ter karaokê.' },
      ]},
      { title: 'Feedback 360', q: 'Seja sincero: que nota você dá pro meu estilo de liderança?', a: [
        { t: '10, com louvor.', r: 'Eu sabia! Vou imprimir e colar na porta.', mood: 'happy', aff: 2, fx: 'sparkle', cw: 'player', conf: 'Não existe feedback sincero na frente de uma caneca "Melhor MD do Mundo".' },
        { t: '8. Falta karaokê.', r: 'Anotado. Plano de ação: karaokê mensal. Com KPI.', mood: 'laugh', aff: 2, fx: 'confetti', cw: 'fabio', conf: 'Ouvir o time é tudo. Principalmente quando o time pede karaokê.' },
        { t: 'Posso responder por e-mail?', r: 'Claro! Com cópia pra mim, pra Ana e pro RH. Brincadeira. Ou não.', mood: 'surprised', aff: 0, cw: 'player', conf: 'Mandei o e-mail. Estou esperando resposta até hoje.' },
      ]},
    ],
    ambient: ['Alguém quer ouvir uma ideia? Vou contar mesmo assim.', 'Great people, greater impact!', 'Reunião às 16h! Tema: reuniões.', 'Talento é o nosso maior diferencial!', 'Quem quer bolo? Não tem bolo. Mas quem quer?'],
    prankReact: ['Isso é... GENIAL! Vou fingir que fui eu que planejei!', 'Pregou uma peça no MD? Coragem! Isso é liderança!', 'Tô rindo por fora e fazendo uma anotação mental por dentro.'],
    fav: { bolo: 'BOLO?! Quem fez aniversário? Não importa! Discurso!', cafe: 'Café! Combustível de visionário. Obrigado, talento.' },
    conf: [
      'Tem gente que nasce líder. Eu nasci... e depois virei líder. Faz sentido na minha cabeça.',
      'Minha porta está sempre aberta. Porque a maçaneta quebrou. Abri chamado com o Thiago em 2023.',
      'Eu não tenho um time. Eu tenho uma família. Uma família com timesheet.',
    ],
    guilty: 'Marmita? Eu? Eu sou o MD. Eu não como... lasanha... alheia. (Tem molho na caneca dele.)',
    confess: 'Tá bom, fui eu! Mas eu ia fazer um discurso agradecendo a lasanha!',
    mission: {
      id: 'fabio', title: 'O Discurso Épico', icon: '🎤',
      offer: 'Tenho o all-hands em dez minutos e preciso de duas coisas: um café forte e meu discurso impresso. Sem isso eu improviso. E ninguém quer isso.',
      progress: 'O relógio está correndo! Café ☕ + discurso impresso 📜. Força, talento!',
      done: 'Café E discurso? Você é o talento que a gente cita nos slides!',
      steps: [{ id: 'cafe', label: 'Pegar um café na copa ☕' }, { id: 'discurso', label: 'Imprimir o discurso 📜' }, { id: 'entrega', label: 'Entregar tudo ao Fabio' }],
    },
  },
  // ------------------------------------------------------------- ANA PAULA
  {
    id: 'ana', name: 'Ana Paula Costa', first: 'Ana Paula', role: 'Senior Director',
    archetype: 'A Guardiã da Governança', color: '#e11d48',
    bio: 'Tem um RACI para tudo — inclusive para o próprio RACI. Post-its em 14 cores, cada uma com um processo.',
    catch: 'Isso tem dono? Então tem RACI.',
    look: { skin: '#f0c6a4', hair: 'long', hairColor: '#3a2418', glasses: false, beard: 'none', outfit: 'blazer', outfitColor: '#b8324a', pants: '#2b2b35', earrings: true },
    voice: { pitch: 1.25, rate: 1.05 },
    home: { x: 680, y: 524 },
    greet: [
      'Oi, {p}! Você veio como Responsável, Aprovador, Consultado ou Informado?',
      'Chegou na hora. Registrei em ata.',
      'Bom dia! Já atualizei o status report. O do mês que vem.',
    ],
    pairGreet: { guilherme: 'Guilherme! Meu RACI e seu dashboard: dupla imbatível.', fabio: 'Fabio, seu karaokê já tem RACI. Você é o Informado.' },
    topics: [
      { title: 'A Cor do Post-it', q: 'Estou reorganizando os post-its por cor. Qual cor para "urgente, mas não importante"?', a: [
        { t: 'Amarelo, como o pânico.', r: 'Pânico amarelo. Adorei. Vou criar a legenda.', mood: 'laugh', aff: 2, cw: 'ana', conf: 'Tenho 14 cores de post-it. Cada uma com um processo. A roxa é confidencial.' },
        { t: 'Tanto faz, tudo é urgente.', r: 'Se tudo é urgente, nada é urgente. Isso vai pra matriz de priorização.', mood: 'surprised', aff: 1, cw: 'player', conf: 'Eu virei um quadrante da matriz dela.' },
        { t: 'Transparente.', r: 'Um post-it transparente... pra tarefas invisíveis. Você é um gênio perigoso.', mood: 'happy', aff: 2, fx: 'sparkle', cw: 'ana', conf: 'Estou considerando seriamente.' },
      ]},
      { title: 'Quem Escreve a Ata?', q: 'Quem deve escrever a ata da reunião de hoje?', a: [
        { t: 'O Guilherme, ele ama dados.', r: 'Ótima delegação. Ele será o "Informado". Por último.', mood: 'laugh', aff: 1, cw: 'player', conf: 'Delegar é uma arte. Fugir também.' },
        { t: 'Eu escrevo!', r: 'Voluntário?! Isso merece minha eterna gratidão. E mais três atas.', mood: 'love', aff: 3, fx: 'hearts', cw: 'ana', conf: 'Ninguém nunca se voluntaria. Estou emocionada. E desconfiada.' },
        { t: 'A IA escreve.', r: 'E quem revisa a IA? ...Você. Parabéns.', mood: 'surprised', aff: 0, cw: 'player', conf: 'Voltei com mais trabalho do que fui.' },
      ]},
      { title: 'O Fim de Semana', q: 'E aí, o que você fez no fim de semana?', a: [
        { t: 'Organizei minha gaveta por categoria.', r: 'FINALMENTE alguém que me entende! Fotos, por favor.', mood: 'love', aff: 3, fx: 'hearts', cw: 'ana', conf: 'Encontrei minha alma gêmea organizacional.' },
        { t: 'Nada. Descansei.', r: 'Descanso é importante. Já coloquei "descanso" no seu cronograma. Às 14h.', mood: 'laugh', aff: 1, cw: 'player', conf: 'Meu descanso agora tem dono, prazo e aprovador.' },
        { t: 'Fui a um show.', r: 'Show? Qual era o processo de entrada? Fila única ou múltipla?', mood: 'surprised', aff: 1, cw: 'player', conf: 'Ela pediu o mapa do estádio. Pra "entender o fluxo".' },
      ]},
    ],
    ambient: ['Isso precisa de um dono.', 'Atualizei o RACI do RACI.', 'Quem mexeu nos post-its roxos?', 'Ata aprovada ✅', 'Processo é amor com etiqueta.'],
    prankReact: ['Isso NÃO estava no cronograma!', 'Vou registrar esse incidente. Com carimbo.', '...Tá, foi engraçado. Mas vai pra ata.'],
    fav: { postit: 'Post-its! Qual cor? Não importa, já sei qual processo eles vão ter.', caneta: 'Uma caneta! Não é A caneta... mas tem potencial.', caneta_azul: 'MINHA CANETA AZUL!' },
    conf: [
      'Organização não é mania. É amor com etiqueta.',
      'Tenho um RACI para o meu RACI. E ele está atualizado.',
      'Quando alguém diz "depois a gente vê", um processo morre em algum lugar.',
    ],
    guilty: 'Eu jamais violaria o processo da geladeira. Mas o pote estava... sem etiqueta de validade. Tecnicamente.',
    confess: 'Fui eu. A marmita estava fora do padrão de armazenamento. Eu... apliquei a governança. Com um garfo.',
    mission: {
      id: 'ana', title: 'A Caneta da Governança', icon: '🖊️',
      offer: 'Minha caneta azul da sorte sumiu. Sem ela eu não assino o Termo de Governança. A última vez que vi estava perto de... algo verde que escuta tudo.',
      progress: 'Algo verde. Que escuta tudo. E nunca reclama. Pensa nisso.',
      done: 'MINHA CANETA! Vou registrar este momento na ata histórica.',
      steps: [{ id: 'caneta_azul', label: 'Achar a caneta azul (algo verde que escuta tudo 🌿)' }, { id: 'entrega', label: 'Devolver à Ana Paula' }],
    },
  },
  // ------------------------------------------------------------- GUILHERME
  {
    id: 'guilherme', name: 'Guilherme Antonialli', first: 'Guilherme', role: 'Senior Director',
    archetype: 'O Mestre dos Dados', color: '#2563eb',
    bio: 'Tudo vira KPI. Já fez um dashboard das próprias reuniões — com gráfico de pizza. De pizza.',
    catch: 'Isso vira um KPI.',
    look: { skin: '#efbf98', hair: 'sidepart', hairColor: '#6b4a2b', glasses: true, beard: 'stubble', outfit: 'shirt', outfitColor: '#3d7ab8', pants: '#2f3440' },
    voice: { pitch: 1.0, rate: 1.12 },
    home: { x: 860, y: 524 },
    greet: [
      '{p}! Segundo meus dados, você me visita 23% mais às sextas.',
      'Oi! Acabei de fazer um dashboard das minhas reuniões. Tem gráfico de pizza. De pizza.',
      'Chegou bem na hora de eu mostrar meu gráfico novo. Sempre é hora.',
    ],
    pairGreet: { thiago: 'Thiago! Seu servidor tem KPI? Eu posso criar um. Por favor.', victor: 'Victor! Bora transformar meu dashboard numa skill do Flows?' },
    topics: [
      { title: 'O Melhor Gráfico', q: 'Pergunta séria: qual é o melhor tipo de gráfico?', a: [
        { t: 'Pizza, claro.', r: 'Pizza?! Pizza é pra comer. ...Mas eu respeito. Vou pedir uma.', mood: 'surprised', aff: 1, cw: 'guilherme', conf: 'Pizza só é aceitável em dois contextos: almoço e diretoria.' },
        { t: 'Barras. Sempre barras.', r: 'BARRAS! Você é dos meus. Toca aqui... com proporção correta.', mood: 'love', aff: 3, fx: 'confetti', cw: 'guilherme', conf: 'Barras. A resposta certa. Estou mais feliz do que deveria.' },
        { t: 'Uma tabela de 400 linhas.', r: 'Isso não é um gráfico. É um pedido de socorro.', mood: 'laugh', aff: 1, cw: 'player', conf: 'Mandei a tabela mesmo assim. Ele fez um dashboard da minha tabela.' },
      ]},
      { title: 'O KPI do Café', q: 'Estou medindo cafés por pessoa por dia. Quantos você toma?', a: [
        { t: 'Uns dois.', r: 'Abaixo da média do DTS. Preocupante. Você está bem?', mood: 'surprised', aff: 1, cw: 'player', conf: 'Fui classificado como outlier. Estou lidando com isso.' },
        { t: 'Perdi a conta.', r: 'Perdeu a CONTA?! Isso é um problema de governança de dados!', mood: 'angry', aff: 0, cw: 'guilherme', conf: 'Perder a conta é o maior crime que existe. Depois de gráfico 3D.' },
        { t: 'Eu sou o café.', r: 'Isso não cabe em nenhum eixo. Amei. Vou criar um outlier só pra você.', mood: 'laugh', aff: 2, fx: 'sparkle', cw: 'guilherme', conf: 'Tem dado que não se explica. Só se sente.' },
      ]},
      { title: 'A Previsão do Bolo', q: 'Meu modelo prevê que hoje vai ter bolo na copa. Você acredita em modelos?', a: [
        { t: 'Só com intervalo de confiança.', r: 'Com 95% de confiança, vai ter bolo. Os outros 5% são o Luis.', mood: 'laugh', aff: 2, cw: 'guilherme', conf: 'O Luis é minha maior fonte de variância.' },
        { t: 'Eu acredito no bolo.', r: 'Fé no bolo. Não é científico, mas é bonito.', mood: 'happy', aff: 1, cw: 'player', conf: 'Não teve bolo. Mas eu continuo acreditando.' },
        { t: 'Modelo bom é de passarela.', r: '...Vou fingir que não ouvi. Mas registrei no log.', mood: 'look', aff: 0, cw: 'guilherme', conf: 'Tem piada que não passa no teste de significância.' },
      ]},
    ],
    ambient: ['Isso vira um KPI.', 'Gráfico 3D é crime.', 'A média subiu 0,2%!', 'Correlação não é causalidade. Mas é quase.', 'Quem quer ver um gráfico?'],
    prankReact: ['Isso vai virar um KPI: "Pegadinhas por Semana". Você está no topo.', 'Os dados indicavam que isso ia acontecer. Eu ignorei os dados. Erro meu.', 'Estatisticamente, eu vou me vingar.'],
    fav: { cafe: 'Café! Vou registrar no KPI. Você acaba de subir a média do time.' },
    conf: [
      'Eu não tenho opiniões. Tenho dados que discordam de você.',
      'Gráfico 3D é o motivo dos meus cabelos brancos. Os que eu vou ter.',
      'Meu sonho? Um dashboard da minha vida. Já tenho o protótipo.',
    ],
    guilty: 'Os dados sobre a marmita são inconclusivos. (Ele esconde um garfo atrás das costas.)',
    confess: 'Fui eu. Mas em minha defesa, os dados mostravam 97% de chance de estar deliciosa.',
    mission: {
      id: 'guilherme', title: 'Auditoria da Geladeira', icon: '📊',
      offer: 'Preciso de dados da geladeira da copa. Audite três itens pro meu dashboard. Cuidado com o iogurte de 2019. Ele está vivo.',
      progress: 'Itens auditados: {n}/3. A geladeira não vai se auditar sozinha.',
      done: 'Três itens! Os dados estão lindos. Assustadores, mas lindos.',
      steps: [{ id: 'audit', label: 'Auditar 3 itens da geladeira 🧊' }, { id: 'entrega', label: 'Levar os dados ao Guilherme' }],
    },
  },
  // ------------------------------------------------------------- THIAGO
  {
    id: 'thiago', name: 'Thiago Vieira', first: 'Thiago', role: 'Senior Director',
    archetype: 'O Arquiteto de Soluções', color: '#10b981',
    bio: 'Fala em diagramas, sonha em nuvem e ainda resolve 90% dos problemas mandando desligar e ligar.',
    catch: 'Já tentou desligar e ligar?',
    look: { skin: '#c68b60', hair: 'short', hairColor: '#1f1a17', glasses: false, beard: 'full', outfit: 'blazer', outfitColor: '#39434e', shirt: '#e8e8e8', pants: '#262a31' },
    voice: { pitch: 0.85, rate: 1.0 },
    home: { x: 1040, y: 524 },
    greet: [
      'Fala, {p}! Estou desenhando uma arquitetura... do meu almoço.',
      'Oi! Se for problema de TI: já tentou desligar e ligar?',
      'E aí! Meu código compilou de primeira hoje. Estou desconfiado.',
    ],
    pairGreet: { victor: 'Victor! Me conta a verdade: você fez deploy na sexta?', guilherme: 'Guilherme, meu servidor tem um KPI só: estar de pé.' },
    topics: [
      { title: 'Se Você Fosse uma Nuvem', q: 'Se você fosse uma nuvem, seria AWS, Azure ou GCP?', a: [
        { t: 'Cúmulo-nimbo. Tempestade de ideias.', r: 'Resposta arquitetural nível sênior. Vou usar em slide.', mood: 'laugh', aff: 2, fx: 'confetti', cw: 'thiago', conf: 'Todo mundo pensa em provedor. Ele pensou em meteorologia. Respeito.' },
        { t: 'Azure, pela cor.', r: 'Critério estético... válido. Leva isso pra governança da Ana.', mood: 'happy', aff: 1, cw: 'player', conf: 'Agora existe um comitê de cores. A culpa é minha.' },
        { t: 'On-premise. Debaixo da minha mesa.', r: 'Um servidor debaixo da mesa? Isso é vintage. E um risco de incêndio.', mood: 'surprised', aff: 1, cw: 'player', conf: 'Ele fez um diagrama de risco da minha mesa. Tinha 14 caixinhas.' },
      ]},
      { title: 'Bug ou Feature?', q: 'O sistema está mostrando a data de amanhã. Bug ou feature?', a: [
        { t: 'Feature: previsão do futuro.', r: 'Vendido! Vamos cobrar como módulo premium.', mood: 'laugh', aff: 2, fx: 'sparkle', cw: 'thiago', conf: 'Nenhum bug resiste a um bom pitch comercial. O Rodrigo que me ensinou.' },
        { t: 'Bug. Vou abrir um chamado.', r: 'Profissional. Chato, mas profissional.', mood: 'happy', aff: 1, cw: 'player', conf: 'O chamado foi aberto amanhã. Pelo sistema.' },
        { t: 'Depende de quem pergunta.', r: 'Essa é a resposta mais consultoria que eu já ouvi.', mood: 'laugh', aff: 2, cw: 'player', conf: 'Aprendi com os melhores.' },
      ]},
      { title: 'A Senha Perfeita', q: 'Qual é a senha mais segura que você conhece?', a: [
        { t: '"Senha123!" — com exclamação.', r: 'A exclamação faz toda a diferença. Só que não.', mood: 'look', aff: 1, cw: 'thiago', conf: 'Vou mandar o treinamento de Cyber de novo. Pra todo mundo. Obrigado, {p}.' },
        { t: 'Uma frase longa e aleatória.', r: 'Correto! Você passou no treinamento de Cyber. Pra onde mando o certificado?', mood: 'happy', aff: 2, fx: 'sparkle', cw: 'player', conf: 'Primeira vez que eu passo numa prova sem estudar.' },
        { t: 'Nunca vou te contar.', r: 'Perfeito. Paranoia saudável. Contratado pra Cyber & Risk.', mood: 'surprised', aff: 2, cw: 'thiago', conf: 'Desconfiança é a maior virtude de um profissional de segurança. Desconfio até de mim.' },
      ]},
    ],
    ambient: ['Já tentou desligar e ligar?', 'Isso é uma questão de arquitetura.', 'Funciona na minha máquina.', 'Deploy na sexta? Nunca.', 'Precisamos de um diagrama.'],
    prankReact: ['Isso é engenharia social! Vai pro treinamento de Cyber.', 'Bem arquitetado. Mas tem um ponto único de falha: eu sei onde você senta.', 'Já tentou desligar e ligar essa sua criatividade?'],
    fav: { snack: 'Chocolate! Energia pra mais um diagrama. Valeu!' },
    conf: [
      'Arquitetura é como lasanha: camadas. Não contem pro Luis que eu disse isso.',
      'Eu não conserto computadores. Eu olho pra eles até eles funcionarem.',
      'Todo sistema tem um ponto único de falha. Aqui é a máquina de café.',
    ],
    guilty: 'Não fui eu. Deve ter sido um bug. Na geladeira. (Tem queijo gratinado no teclado dele.)',
    confess: 'Confesso. Achei que era ambiente de teste. Não era. Era produção. Era lasanha.',
    mission: {
      id: 'thiago', title: 'O Servidor Maestro Caiu', icon: '🖥️',
      offer: 'O servidor do projeto Maestro caiu e eu estou preso numa call. Vai em qualquer computador, abre o Terminal e resolve. Dica: a solução é a mais antiga do mundo.',
      progress: 'O Maestro continua fora do ar. Computador → Terminal. Solução clássica. Vai!',
      done: 'O Maestro voltou! Você reiniciou, né? Sempre é reiniciar.',
      steps: [{ id: 'maestro', label: 'Consertar o Maestro no Terminal 💻' }, { id: 'entrega', label: 'Avisar o Thiago' }],
    },
  },
  // ------------------------------------------------------------- LUIS
  {
    id: 'luis', name: 'Luis Ricupero', first: 'Luis', role: 'Senior Director',
    archetype: 'O Rei do Networking', color: '#8b5cf6',
    bio: 'Zen, conhece todo mundo (e o cachorro de todo mundo). Resolve crises com um bom almoço.',
    catch: 'Relaxa, tudo se resolve com um bom almoço.',
    look: { skin: '#e0a67c', hair: 'curly', hairColor: '#2b2b2b', glasses: false, beard: 'mustache', outfit: 'polo', outfitColor: '#4f8a4b', pants: '#3a3f4a' },
    voice: { pitch: 0.9, rate: 0.95 },
    home: { x: 680, y: 724 },
    greet: [
      '{p}, meu querido! Já almoçou? Não importa, vamos de novo.',
      'Opa! Tudo em paz? Aqui é zen. Quase sempre.',
      'Fala! Precisa conhecer alguém? Eu conheço.',
    ],
    pairGreet: { rodrigo: 'Rodrigo! Almoço com cliente hoje? Eu conheço o dono do restaurante.', ana: 'Ana! Minha marmita tem etiqueta. Até validade eu coloquei. Pra você.' },
    topics: [
      { title: 'O Churrasco do DTS', q: 'Churrasco do time: quem fica na churrasqueira?', a: [
        { t: 'Você, obviamente.', r: 'Resposta correta. A picanha agradece.', mood: 'happy', aff: 2, cw: 'luis', conf: 'A churrasqueira escolhe o churrasqueiro. Foi assim comigo.' },
        { t: 'O Fabio, ele adora um palco.', r: 'Fabio na churrasqueira vai fazer um discurso pra cada linguiça.', mood: 'laugh', aff: 2, fx: 'confetti', cw: 'player', conf: 'Agora eu PRECISO ver isso.' },
        { t: 'Delivery.', r: '...Vou fingir que você não disse isso. Pelo bem da amizade.', mood: 'look', aff: -1, cw: 'luis', conf: 'Tem coisa que a gente perdoa. Delivery em churrasco não é uma delas.' },
      ]},
      { title: 'O Segredo do Networking', q: 'Qual é o segredo de um bom networking?', a: [
        { t: 'Lembrar o nome do cachorro das pessoas.', r: 'Nível mestre! O do Thiago se chama... Deploy. Mentira. Ou não.', mood: 'laugh', aff: 2, cw: 'luis', conf: 'Sei o nome de 47 cachorros deste prédio. E de dois gatos.' },
        { t: 'Café com todo mundo.', r: 'Café, almoço e um áudio de três minutos depois. Esse é o método.', mood: 'happy', aff: 1, cw: 'luis', conf: 'Networking é igual churrasco: fogo baixo e paciência.' },
        { t: 'LinkedIn.', r: 'LinkedIn é o cardápio. O almoço é que é a refeição.', mood: 'happy', aff: 1, cw: 'player', conf: 'Nunca mais vou olhar o LinkedIn do mesmo jeito.' },
      ]},
      { title: 'Caixa de Entrada Zen', q: 'Você tem 47 e-mails não lidos. O que você faz?', a: [
        { t: 'Respiro fundo e arquivo todos.', r: 'Iluminação alcançada. Namastê, {p}.', mood: 'love', aff: 2, fx: 'sparkle', cw: 'luis', conf: 'Inbox zero não é um número. É um estado de espírito.' },
        { t: 'Leio um por um.', r: 'Corajoso. Te vejo em 2027.', mood: 'laugh', aff: 1, cw: 'player', conf: 'Estou no e-mail 12. Mandem comida.' },
        { t: 'Respondo "Conforme alinhado" em todos.', r: 'Isso é perigosamente eficiente.', mood: 'laugh', aff: 2, cw: 'luis', conf: '"Conforme alinhado" resolve 80% da vida corporativa. Os outros 20% é almoço.' },
      ]},
    ],
    ambient: ['Bora almoçar?', 'Relaxa, tudo se resolve.', 'Conheço um cara...', 'Essa lasanha tem dono!', 'Paz e picanha.'],
    prankReact: ['Hahaha! Tá bom, tá bom. Mas o almoço hoje é por sua conta.', 'Relaxa... eu sou zen. Zen e vingativo.', 'Essa foi boa. Vou contar pra todo mundo que eu conheço. E eu conheço todo mundo.'],
    fav: { bolo: 'Bolo! Você sabe o caminho do meu coração. É pelo estômago.', gelatina: 'Gelatina! Nostalgia de festa de criança. Obrigado!' },
    conf: [
      'Networking é simples: todo mundo gosta de quem lembra seu nome. E de quem traz pão de queijo.',
      'Eu não fico estressado. Eu marino as preocupações até virarem churrasco.',
      'Aquela marmita tinha etiqueta. Com meu nome. Em negrito. Tem gente sem limites neste mundo.',
    ],
    guilty: 'Eu? Jamais. A lasanha era minha!',
    confess: 'Fui eu.',
    mission: {
      id: 'luis', title: 'O Mistério da Marmita', icon: '🕵️',
      offer: 'Alguém comeu minha marmita. A de lasanha. Com etiqueta. Com meu nome. Em negrito. Investiga pra mim? Conversa com o pessoal e junta pistas.',
      progress: 'Pistas: {n}/2. Quando tiver certeza, volta aqui e aponta o culpado.',
      done: 'Caso encerrado!',
      steps: [{ id: 'pistas', label: 'Interrogar colegas (2 pistas) 🔎' }, { id: 'entrega', label: 'Apontar o culpado ao Luis' }],
    },
  },
  // ------------------------------------------------------------- RODRIGO
  {
    id: 'rodrigo', name: 'Rodrigo Brea', first: 'Rodrigo', role: 'Senior Director',
    archetype: 'O Fechador de Negócios', color: '#0ea5e9',
    bio: 'Vê oportunidade em tudo, inclusive em pedido de almoço. Toca o sino da recepção a cada contrato fechado.',
    catch: 'FECHADO!',
    look: { skin: '#d9a078', hair: 'slick', hairColor: '#1a1410', glasses: false, beard: 'none', outfit: 'suit', outfitColor: '#1f2d4d', tie: '#c0392b', pants: '#1f2d4d' },
    voice: { pitch: 1.05, rate: 1.2 },
    home: { x: 860, y: 724 },
    greet: [
      '{p}! Isso aqui é uma oportunidade. Não sei de quê ainda, mas é.',
      'Tô numa call, mas pra você eu dou mute. Fala!',
      'Opa! Acabei de fechar um negócio. Tá, era o pedido do almoço. Mas fechei.',
    ],
    pairGreet: { fabio: 'Chefe! Tenho três oportunidades e um sino. Qual você quer primeiro?', luis: 'Luis! Me apresenta aquele seu amigo do restaurante? Pode virar cliente.' },
    topics: [
      { title: 'Me Vende Essa Caneta', q: 'Me vende essa caneta. Vai, trinta segundos.', a: [
        { t: 'Ela assina contratos. Os seus.', r: 'FECHADO! Você é perigoso. Vem pro comercial.', mood: 'laugh', aff: 3, fx: 'confetti', cw: 'rodrigo', conf: 'Eu ensinei isso pra essa pessoa. Não ensinei, mas vou dizer que sim.' },
        { t: 'É uma caneta. Ela escreve.', r: 'Honesto... honesto demais. Cliente não gosta de tanta honestidade de cara.', mood: 'surprised', aff: 0, cw: 'player', conf: 'Primeira vez que fui reprovado por dizer a verdade.' },
        { t: 'Não vendo. Alugo. Assinatura mensal.', r: 'Receita recorrente! Você acabou de inventar o SaaS de caneta!', mood: 'love', aff: 2, fx: 'sparkle', cw: 'rodrigo', conf: 'Já registrei o domínio canetaasaservice.com.br.' },
      ]},
      { title: 'O Sino', q: 'Quando eu fecho um negócio, toco o sino. E você, faz o quê?', a: [
        { t: 'Grito "FECHADO!" no Teams.', r: 'No chat geral? Com gif? É ASSIM que se faz!', mood: 'laugh', aff: 2, cw: 'rodrigo', conf: 'Comemorar é metade da venda. A outra metade é vender.' },
        { t: 'Nada. Sou discreto.', r: 'Discreto?! Sucesso tem que fazer barulho, meu amigo.', mood: 'surprised', aff: 1, cw: 'rodrigo', conf: 'Discrição é pra agente secreto. Eu sou agente comercial.' },
        { t: 'Pago um café pra todo mundo.', r: 'Você me entende. E o café da máquina é de graça. Econômico!', mood: 'happy', aff: 1, cw: 'player', conf: 'Generosidade com orçamento zero. Isso é gestão.' },
      ]},
      { title: 'O Cliente Difícil', q: 'O cliente pediu "algo inovador, mas que já tenha sido feito". O que eu respondo?', a: [
        { t: '"Temos um case exatamente assim."', r: 'Resposta de livro! Nem sei se temos, mas vamos ter!', mood: 'laugh', aff: 2, cw: 'player', conf: 'Criamos o case na mesma tarde.' },
        { t: 'Chama o Thiago.', r: 'Boa! O Thiago desenha uma arquitetura e o cliente fica hipnotizado.', mood: 'happy', aff: 1, cw: 'rodrigo', conf: 'O Thiago é meu arco-íris técnico. No fim dele tem um contrato.' },
        { t: 'Mostra um slide escrito "IA".', r: 'Funciona 100% das vezes. Tem até dado do Guilherme provando.', mood: 'laugh', aff: 2, fx: 'sparkle', cw: 'rodrigo', conf: 'Duas letras. Milhões em pipeline.' },
      ]},
    ],
    ambient: ['Isso aqui é uma oportunidade!', 'FECHADO!', 'Liga pro cliente!', 'Alguém viu meu carregador?', 'Pipeline tá bonito hoje.'],
    prankReact: ['Você me vendeu essa mentira direitinho! Quer vir pro comercial?', 'Quase toquei o sino de desespero!', 'Fechado: você me deve um café.'],
    fav: { caneta: 'Uma caneta! Pra assinar contratos. Você entende de negócios.', cafe: 'Café! Cliente bom é cliente com cafeína.' },
    conf: [
      'Eu não vendo projetos. Eu vendo sonhos. Com escopo bem definido.',
      'Aquele sino é a coisa mais importante deste escritório. Depois de mim. Brincadeira. Depois do sino, eu.',
      'Já fechei negócio no elevador, no avião e uma vez no casamento de um primo.',
    ],
    guilty: 'Eu? Tava fechando negócio! Com... a lasanha. Digo, com o cliente!',
    confess: 'Fui eu! Mas eu tava negociando com ela e... ela fechou comigo!',
    mission: {
      id: 'rodrigo', title: 'Fechando o Negócio', icon: '🔔',
      offer: 'O cliente vai assinar! Preciso da proposta impressa AGORA. E quando fechar, alguém toca o sino da recepção. Vai ser histórico!',
      progress: 'Proposta 📄 impressa e entregue, depois o sino 🔔. Vamos, o cliente está esperando!',
      done: 'Proposta na mão! O cliente... ASSINOU! Corre e toca o sino!',
      steps: [{ id: 'proposta', label: 'Imprimir a proposta 📄' }, { id: 'entrega', label: 'Entregar ao Rodrigo' }, { id: 'sino', label: 'Tocar o sino da recepção 🔔' }],
    },
  },
  // ------------------------------------------------------------- VICTOR
  {
    id: 'victor', name: 'Victor Vitorino', first: 'Victor', role: 'Analyst',
    archetype: 'O Criador do Flows', color: '#f97316',
    bio: 'Automatiza tudo que se repete duas vezes. Criou o Flows e o Catálogo de Skills DTS. Suspeita que os colegas são agentes de IA.',
    catch: 'Isso dá pra automatizar.',
    look: { skin: '#e4ae88', hair: 'short', hairColor: '#2a1c14', glasses: false, beard: 'stubble', outfit: 'shirt', outfitColor: '#eef2f7', pants: '#2d3a52' },
    voice: { pitch: 1.05, rate: 1.1 },
    home: { x: 1040, y: 724 },
    greet: [
      '{p}! Sabia que dá pra automatizar essa conversa? Mas vamos no manual.',
      'Opa! Subi três skills no Flows hoje. Antes do café.',
      'E aí! Cuidado, esse papo pode virar uma skill.',
    ],
    pairGreet: { fabio: 'Fabio! Fiz um agente que escreve seus discursos. Ele já pediu aumento.', thiago: 'Thiago, eu NÃO fiz deploy na sexta. Foi no sábado.' },
    topics: [
      { title: 'Automatizar Tudo', q: 'O que você automatizaria primeiro neste escritório?', a: [
        { t: 'A fila do micro-ondas.', r: 'Algoritmo de fila por prioridade de fome. Já tô codando.', mood: 'laugh', aff: 2, cw: 'victor', conf: 'Já existe uma skill pra isso. Eu fiz ontem. Ninguém pediu.' },
        { t: 'Reunião que podia ser e-mail.', r: 'Uma skill que transforma reuniões em e-mails? Isso salva vidas.', mood: 'love', aff: 2, fx: 'sparkle', cw: 'player', conf: 'Se isso existir, eu ganho duas horas por dia. Vou gastar no café.' },
        { t: 'O Fabio.', r: 'Um agente que faz discursos motivacionais 24/7? ...Ele ia AMAR.', mood: 'laugh', aff: 1, cw: 'player', conf: 'Não contem pro Fabio. Ou contem. Ele ia adorar.' },
      ]},
      { title: 'O Catálogo DTS', q: 'Você já visitou o Catálogo de Métodos DTS no Flows?', a: [
        { t: 'Todo dia. É meu Netflix.', r: 'ESSE é o espírito! Tem até filtro por Service Line.', mood: 'love', aff: 3, fx: 'confetti', cw: 'victor', conf: 'Um usuário engajado. Vou emoldurar esse momento.' },
        { t: 'Qual catálogo?', r: 'Dói, mas eu te perdoo. Vou te mandar o link. Sete vezes.', mood: 'sad', aff: 0, cw: 'victor', conf: 'Missão de vida: todo mundo usando o Flows. Até a planta.' },
        { t: 'Só quando preciso de um método.', r: 'Justo! É pra isso mesmo. Métodos. Skills. Pessoas. Resultados.', mood: 'happy', aff: 1, cw: 'player', conf: 'Eu uso sempre. Tá, às vezes. Tá, agora vou usar sempre.' },
      ]},
      { title: 'A IA no Escritório', q: 'Se a IA virasse colega de trabalho, onde ela sentaria?', a: [
        { t: 'Do lado da máquina de café.', r: 'Estratégico: ela fica sabendo de toda fofoca antes.', mood: 'laugh', aff: 2, cw: 'player', conf: 'Ela ia fazer um dashboard das fofocas. Com o Guilherme.' },
        { t: 'Na sala do Fabio.', r: 'Promovida no primeiro dia. Clássico.', mood: 'laugh', aff: 2, cw: 'player', conf: 'A IA ia pedir aumento em cinco minutos. E ia conseguir.' },
        { t: 'Ela já está aqui. Somos nós.', r: '...Isso ficou profundo demais pra uma terça.', mood: 'surprised', aff: 2, fx: 'flash', cw: 'victor', conf: 'Estou olhando pros meus colegas de outro jeito agora. Eles piscam em intervalos muito regulares.' },
      ]},
    ],
    ambient: ['Isso dá pra automatizar.', 'Nova skill no ar!', 'Já conhece o Flows?', 'Commit feito ✅', 'Métodos. Skills. Pessoas. Resultados.'],
    prankReact: ['Vou criar uma skill pra detectar pegadinhas. Nome: "Anti-{p}".', 'Isso foi um bug na minha rotina. Registrando no log.', 'Automatizei minha vingança. Roda amanhã às 9h.'],
    fav: { cafe: 'Café! Agora eu consigo subir mais cinco skills.', postit: 'Post-its! Vou mapear um fluxo novo aqui mesmo.' },
    conf: [
      'Tudo que você faz duas vezes vira uma skill. Tudo que você faz três vezes vira um agente.',
      'Criei o Flows pra ninguém mais perguntar "onde está aquele template?". Ainda perguntam. Mas agora eu mando o link.',
      'Às vezes acho que meus colegas são agentes de IA. Aí o Fabio conta uma piada e eu tenho certeza que são humanos.',
    ],
    guilty: 'Eu estava automatizando... o almoço. Quer dizer, NÃO! Não sei de marmita nenhuma.',
    confess: 'Fui eu... eu ia criar uma skill "Detector de Lasanha" e precisava de dados de treino.',
    mission: {
      id: 'victor', title: 'Suba uma Skill no Flows', icon: '🚀',
      offer: 'Meta do trimestre: todo mundo sobe pelo menos uma skill no Flows. Vai num computador, abre o Flows e cadastra a sua!',
      progress: 'Computador → Flows → "Subir uma skill". Eu acredito em você!',
      done: 'Skill publicada! Já tem três curtidas. Duas são minhas.',
      steps: [{ id: 'skill', label: 'Publicar uma skill no Flows 🚀' }, { id: 'entrega', label: 'Contar pro Victor' }],
    },
  },
];

const CAST_BY_ID = Object.fromEntries(CAST.map(c => [c.id, c]));

// Duplas com piadas internas quando dois agentes se encontram pelo escritório
const DUO_LINES = {
  'ana|fabio':        [['fabio', 'Ana, preciso de um RACI pro karaokê.'], ['ana', 'Já existe. Você é o Informado.']],
  'guilherme|thiago': [['guilherme', 'Thiago, seu servidor tem KPI?'], ['thiago', 'Tem sim: estar de pé.']],
  'luis|rodrigo':     [['rodrigo', 'Luis, almoço com cliente hoje?'], ['luis', 'Conheço o dono do restaurante.'], ['rodrigo', 'FECHADO!']],
  'guilherme|victor': [['victor', 'Guilherme, vira skill esse dashboard?'], ['guilherme', 'Só se tiver gráfico de barras.']],
  'ana|luis':         [['ana', 'Luis, sua marmita está sem data de validade.'], ['luis', 'Ela é eterna, Ana.']],
  'fabio|rodrigo':    [['fabio', 'Rodrigo, me vende uma ideia!'], ['rodrigo', 'Vendida! Pagamento em aplausos.']],
  'thiago|victor':    [['thiago', 'Victor, você fez deploy na sexta?'], ['victor', '...Talvez.'], ['thiago', 'VICTOR.']],
  'fabio|victor':     [['victor', 'Fabio, criei um agente que faz discursos.'], ['fabio', 'Ele é melhor que eu?'], ['victor', '...Vamos mudar de assunto.']],
  'ana|guilherme':    [['ana', 'Guilherme, seu dashboard tem dono?'], ['guilherme', 'Tem. E tem KPI do dono.']],
  'luis|thiago':      [['luis', 'Thiago, bora almoçar?'], ['thiago', 'Só depois de reiniciar.'], ['luis', 'O servidor?'], ['thiago', 'Eu.']],
};

// Pistas neutras dos inocentes (apontam para o culpado {c})
const CLUE_LINES = [
  'Eu estava numa call. Mas vi {c} saindo da copa limpando a boca com um guardanapo.',
  'Marmita? Eu trouxe a minha. Mas {c} passou aqui cheirando a lasanha gratinada...',
  'Não sei de nada. Só sei que {c} recusou almoçar com a gente hoje. Suspeito, né?',
  'Olha... {c} estava estranhamente feliz depois das 12h30. Ninguém fica feliz assim numa terça.',
  'Vi um garfo na mesa de {c}. Um garfo com molho. Tire suas conclusões.',
];

const PRANKS = [
  { id: 'gelatina',  title: 'Grampeador na Gelatina', setup: '{n}, abre a geladeira... tem uma surpresa com seu nome.', fx: 'jelly',   mood: 'surprised' },
  { id: 'postit',    title: 'A Mesa de Post-its',    setup: '{n}, reparou que sua mesa ficou mais... amarela?',          fx: 'postits', mood: 'surprised' },
  { id: 'sabado',    title: 'Reunião Sábado às 7h',  setup: '{n}, viu o convite? "Alinhamento do Alinhamento". Sábado, 7h da manhã.', fx: 'shake', mood: 'angry' },
  { id: 'segunda',   title: 'A Segunda-feira Eterna', setup: '{n}, que semana longa, né? Ainda bem que hoje é segunda!', fx: 'rain',    mood: 'sad' },
  { id: 'wallpaper', title: 'O Papel de Parede',     setup: '{n}, troquei o papel de parede do seu PC por uma foto minha de 2009.', fx: 'flash', mood: 'surprised' },
  { id: 'cafe',      title: 'O Café Acabou',         setup: '{n}... sinto muito. O café acabou. Pra sempre.',            fx: 'shake',   mood: 'sad' },
  { id: 'cliente',   title: 'O Cliente Adiantou',    setup: '{n}, o cliente adiantou a entrega. Pra hoje. Às 17h.',      fx: 'papers',  mood: 'surprised' },
  { id: 'mouse',     title: 'O Mouse Rebelde',       setup: '{n}, seu mouse parou? Estranho... tem um post-it no sensor escrito "NÃO".', fx: 'sparkle', mood: 'angry' },
];
const PRANK_CONF = [
  'Eu não me orgulho disso. Mentira. Me orgulho muito.',
  'Valeu a pena? Olha a cara de {n}.',
  'Isso vai pro meu portfólio. Seção "Grandes Obras".',
  '{n} vai descobrir que fui eu em três... dois... um...',
];

const GIFT_CONF = [
  'Presente no escritório é networking com embrulho.',
  'Pequenos gestos. Grandes impactos. Great people, greater impact... o Fabio me contaminou.',
  'Não tinha papel de presente. Usei um relatório antigo.',
];

const GOSSIP = [
  'Dizem que o Fabio ensaia discursos no espelho do banheiro. Com pausa dramática.',
  'Parece que a Ana Paula tem um RACI pra própria festa de aniversário.',
  'O Guilherme já fez um dashboard das fofocas deste bebedouro. Eu sou o maior outlier.',
  'O Thiago nunca reiniciou o próprio notebook. Nunca. Ele tem 1.400 dias de uptime.',
  'O Luis conhece o porteiro, o síndico e o cachorro do síndico. Pelo nome.',
  'O Rodrigo tocou o sino quando o filho aprendeu a andar de bicicleta.',
  'O Victor criou uma skill que responde fofocas. Ela é melhor que eu nisso.',
  'Dizem que a planta da recepção tem mais tempo de casa que todo mundo.',
];

const FRIDGE_POOL = [
  { id: 'gelatina', label: '🍮 Gelatina verde suspeita', item: 'gelatina', text: 'Ela tremeu quando você chegou perto. Você pega mesmo assim.' },
  { id: 'iogurte',  label: '🥛 Iogurte de 2019 (está se mexendo)', item: 'iogurte', text: 'O iogurte te olha de volta. Vocês agora têm um vínculo.' },
  { id: 'marmita',  label: '🍱 Marmita "NÃO É SUA"', item: null, text: 'A etiqueta diz "NÃO É SUA". Em três idiomas. Você respeita.' },
  { id: 'bolo',     label: '🎂 Bolo de aniversário de alguém', item: 'bolo', text: 'Ninguém sabe de quem é o aniversário. Isso nunca impediu ninguém.' },
  { id: 'refri',    label: '🥤 Refri sem gás desde a última reestruturação', item: null, text: 'Você abre. Nenhum som. Só um silêncio triste.' },
  { id: 'queijo',   label: '🧀 Queijo de origem desconhecida', item: null, text: 'Ele não tem etiqueta. Ele não tem data. Ele tem opinião própria.' },
  { id: 'ketchup',  label: '🥫 17 sachês de ketchup', item: null, text: 'Uma coleção. Alguém está construindo algo aqui.' },
];

const PRINT_RANDOM = [
  'Uma foto do Guilherme de 2014 em alta resolução. Em A3.',
  '47 páginas em branco e uma escrita "teste".',
  'O RACI do churrasco (v12_final_FINAL_agora_vai).',
  'Um meme que alguém mandou imprimir às 3h da manhã.',
  'O discurso do Fabio de 2019. Ele ainda está atual, segundo ele.',
];

const EMAILS = [
  { from: 'Fabio Quintão', subj: 'TODOS NA SALA 3 AGORA (é bolo)', body: 'Não é reunião. É bolo. Mas vai ter um discurso rápido. De 40 minutos.' },
  { from: 'Ana Paula Costa', subj: 'RACI do churrasco (v12_final_FINAL)', body: 'Segue a nova versão. Luis continua Responsável pela picanha. Fabio foi realocado para "Informado".' },
  { from: 'Guilherme Antonialli', subj: 'Dashboard: cafés por hora', body: 'Pico às 10h07. Vale uma investigação. Anexo: 14 gráficos (nenhum 3D).' },
  { from: 'Thiago Vieira', subj: 'Manutenção programada', body: 'O servidor Maestro vai ser reiniciado. Por favor, não entrem em pânico. De novo.' },
  { from: 'Luis Ricupero', subj: 'Minha marmita', body: 'Se alguém souber de uma lasanha com etiqueta em negrito, me procure. Sem julgamentos. Com julgamentos.' },
  { from: 'Rodrigo Brea', subj: 'FECHADO!!!', body: 'Não posso contar qual foi. Mas foi. Sino às 16h.' },
  { from: 'Victor Vitorino', subj: 'Nova skill no Catálogo DTS', body: 'Vocês já conhecem o Flows? Link aqui. E aqui. E aqui também.' },
  { from: 'RH', subj: 'Lembrete: timesheet', body: 'O Replicon sente sua falta. Preencha antes que ele preencha você.' },
];

const SKILL_NAMES = ['Gerador de Atas Automáticas', 'Detector de Reunião Que Podia Ser E-mail', 'Previsor de Bolo na Copa', 'Tradutor de Corporativês', 'Agente de Discursos Motivacionais'];

// Prêmios da cerimônia final (paródia dos "Dundies")
const AWARDS = {
  fabio:     'Melhor MD do Mundo (agora com certificado)',
  ana:       'RACI de Ouro',
  guilherme: 'Gráfico de Barras Mais Bonito do Ano',
  thiago:    'Prêmio "Já Tentou Reiniciar?"',
  luis:      'Rei do Networking & da Lasanha',
  rodrigo:   'Sino de Platina',
  victor:    'Automatizador Supremo do Flows',
};
