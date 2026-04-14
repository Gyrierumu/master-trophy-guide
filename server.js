const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Dados em memória
let games = [
  {
    id: 1,
    name: 'Elden Ring',
    difficulty: 8,
    time: '20-30 horas',
    missable: 'Alguns troféus podem ser perdidos se não completados na ordem certa.',
    roadmap: ['Complete o tutorial', 'Explore as áreas iniciais', 'Derrote chefes principais'],
    trophies: [
      { id: 'platinum', name: 'Elden Lord', type: 'Platina', description: 'Derrote o final do jogo', tip: 'Siga o roadmap principal', is_spoiler: false },
      { id: 'gold1', name: 'Age of the Stars', type: 'Ouro', description: 'Complete o ending alternativo', tip: 'Encontre a Ranni', is_spoiler: true }
    ]
  },
  {
    id: 2,
    name: 'Ghost of Tsushima',
    difficulty: 7,
    time: '15-20 horas',
    missable: 'Troféus relacionados a exploração e missões secundárias podem ser perdidos se não completados antes do final.',
    roadmap: [
      'Complete o prólogo e chegue à vila de Jogaku',
      'Libere o mapa explorando regiões',
      'Complete missões principais e derrote inimigos lendários',
      'Explore ilhas e complete atividades secundárias',
      'Complete o modo New Game+ para troféus restantes'
    ],
    trophies: [
      { id: 'platinum', name: 'Living Legend', type: 'Platina', description: 'Obtenha todos os troféus', tip: 'Complete todos os 35 troféus listados no jogo. Foque nos troféus de exploração e contos secundários para garantir que nenhum seja perdido.', is_spoiler: false },
      { id: 'gathering_storm', name: 'Gathering Storm', type: 'Bronze', description: 'Recupere a katana do clã Sakai.', tip: 'Este troféu é desbloqueado automaticamente durante o prólogo do jogo. Simplesmente siga a história inicial.', is_spoiler: false },
      { id: 'point_no_return', name: 'Point of No Return', type: 'Bronze', description: 'Quebre seu código para ajudar um novo amigo.', tip: 'Durante a história principal, você encontrará um amigo em necessidade. Quebre o código de honra do samurai para ajudá-lo, o que desbloqueia este troféu.', is_spoiler: false },
      { id: 'company_wolves', name: 'Company of Wolves', type: 'Bronze', description: 'Recrute os Ronin Chapéus de Palha.', tip: 'No início do jogo, após escapar da vila, siga o caminho até encontrar o lobo. Complete a missão para recrutá-lo como companheiro.', is_spoiler: false },
      { id: 'kindling_flare', name: 'Kindling the Flare', type: 'Bronze', description: 'Recupere Taka do cativeiro mongol.', tip: 'Durante a progressão da história, você chegará a uma vila onde Taka está capturado. Liberte-o completando a missão de resgate.', is_spoiler: false },
      { id: 'family_reunion', name: 'Family Reunion', type: 'Bronze', description: 'Libere o Lorde Shimura das garras do Khan.', tip: 'Este é um marco importante na história. Continue a narrativa principal até o confronto com o Khan para resgatar Shimura.', is_spoiler: true },
      { id: 'leader_people', name: 'Leader of the People', type: 'Bronze', description: 'Mobilize os camponeses de Yarikawa.', tip: 'Em Yarikawa, ajude os camponeses a se rebelar contra os mongóis. Complete missões de libertação na área.', is_spoiler: false },
      { id: 'birthright', name: 'Birthright', type: 'Bronze', description: 'Recupere a armadura do seu pai.', tip: 'Explore o mapa para encontrar a armadura ancestral do clã Sakai. Geralmente localizada em uma área específica da ilha.', is_spoiler: false },
      { id: 'dying_embers', name: 'Dying Embers', type: 'Bronze', description: 'Despeça-se de seus aliados.', tip: 'Perto do final do jogo, você terá cenas de despedida com aliados importantes. Complete essas interações para desbloquear.', is_spoiler: true },
      { id: 'the_ghost', name: 'The Ghost', type: 'Bronze', description: 'Aceite sua nova identidade.', tip: 'Durante a história, você assumirá o manto do Fantasma. Este troféu é desbloqueado ao aceitar essa identidade.', is_spoiler: false },
      { id: 'exiled_alliance', name: 'The Exiled Alliance', type: 'Ouro', description: 'Reúna-se com seus aliados no gélido norte.', tip: 'Viaje para o norte gelado de Tsushima para reunir aliados exilados. Complete missões nessa região.', is_spoiler: false },
      { id: 'sovereign_end', name: 'Sovereign End', type: 'Ouro', description: 'Enfrente o Khan.', tip: 'Este é o clímax da história. Prepare-se para o confronto final com o Khan e seus guardas.', is_spoiler: true },
      { id: 'mono_aware', name: 'Mono No Aware', type: 'Ouro', description: 'Deixe o passado para trás e aceite o peso do seu novo fardo.', tip: 'Complete o jogo até o final verdadeiro, aceitando as consequências das suas ações.', is_spoiler: true },
      { id: 'flash_steel', name: 'Flash of Steel', type: 'Prata', description: 'Derrote 20 inimigos com um contra-ataque após um Aparo Perfeito.', tip: 'Pratique o timing dos parries perfeitos (botão de bloqueio no momento exato). Use contra-ataques em combates contra inimigos comuns.', is_spoiler: false },
      { id: 'witness_protection', name: 'Witness Protection', type: 'Bronze', description: 'Atire uma flecha em um inimigo aterrorizado enquanto ele foge.', tip: 'Durante combates, quando um inimigo tentar fugir aterrorizado, mire e atire uma flecha nele antes que escape.', is_spoiler: false },
      { id: 'open_business', name: 'Open for Business', type: 'Bronze', description: 'Atordoe inimigos 50 vezes.', tip: 'Use ataques furtivos ou rajadas de vento para atordoar inimigos. Conte 50 atordoamentos em combates variados.', is_spoiler: false },
      { id: 'only_one', name: 'There Can Be Only One', type: 'Prata', description: 'Complete todos os duelos com sucesso.', tip: 'Procure duelos marcados no mapa (ícones de espada). Há vários espalhados por Tsushima; vença todos sem perder.', is_spoiler: false },
      { id: 'nice_fall', name: 'Have a Nice Fall', type: 'Bronze', description: 'Mate um inimigo com dano de queda empurrando-o de uma borda.', tip: 'Em áreas com penhascos, use a Postura do Vento ou um chute para empurrar inimigos de bordas altas.', is_spoiler: false },
      { id: 'haunting_precision', name: 'Haunting Precision', type: 'Prata', description: 'Mate 20 inimigos com golpes da Postura do Fantasma.', tip: 'Desbloqueie e use a Postura do Fantasma em combates. Golpes carregados matam inimigos rapidamente; use contra 20 oponentes.', is_spoiler: false },
      { id: 'favor_kami', name: 'Favor of the Kami', type: 'Bronze', description: 'Encontre e honre todos os Santuários Shinto.', tip: 'Explore o mapa para encontrar santuários (ícones de templo). Interaja com eles para honrá-los; há vários em cada região.', is_spoiler: false },
      { id: 'slay_prayers', name: 'Slay the Prayers', type: 'Bronze', description: 'Visite e honre todos os Pilares da Honra.', tip: 'Pilares da Honra são monumentos antigos. Encontre-os no mapa e interaja para honrá-los; complete todos para o troféu.', is_spoiler: false },
      { id: 'body_mind_spirit', name: 'Body, Mind, and Spirit', type: 'Bronze', description: 'Complete todas as Fontes Termais, Haikus, Santuários Inari e Bambus de Treino.', tip: 'Colecione e complete: mergulhe em fontes termais, leia haikus, visite santuários Inari (tocas de raposa) e treine em bambus. Explore todo o mapa.', is_spoiler: false },
      { id: 'gift_idols', name: 'A Gift from the Idols', type: 'Bronze', description: 'Colete 10 presentes dos altares de oferendas.', tip: 'Encontre altares de oferendas (estátuas) no mapa e interaja para receber presentes. Colete de 10 diferentes.', is_spoiler: false },
      { id: 'monochrome_masters', name: 'Monochrome Masters', type: 'Bronze', description: 'Compre um item dos mercadores de tinta preta e branca.', tip: 'Visite mercadores especializados em tintas (geralmente em vilas maiores) e compre qualquer item de tinta preta ou branca.', is_spoiler: false },
      { id: 'avenging_spring', name: 'Avenging Spring', type: 'Bronze', description: 'Encontre todas as áreas de Faróis e acenda-os.', tip: 'Faróis são torres altas no mapa. Suba neles e acenda as luzes; há vários em Tsushima.', is_spoiler: false },
      { id: 'grand_liberator', name: 'A Grand Liberator', type: 'Bronze', description: 'Libere todas as áreas ocupadas em Izuhara, Toyotama e Kamiagata.', tip: 'Complete missões de libertação em todas as regiões ocupadas pelos mongóis. Foque em vilas e fortes.', is_spoiler: false },
      { id: 'unbending_archer', name: 'The Unbending Archer', type: 'Prata', description: 'Complete todos os contos de Ishikawa.', tip: 'Encontre Ishikawa (o arqueiro) e complete todas as suas missões secundárias. Geralmente envolvem combates e exploração.', is_spoiler: false },
      { id: 'vengeful_warrior', name: 'The Vengeful Warrior', type: 'Prata', description: 'Complete todos os contos de Masako.', tip: 'Ajude Masako (a guerreira vingativa) em suas missões. Complete toda a série de contos dela.', is_spoiler: false },
      { id: 'unyielding_monk', name: 'The Unyielding Monk', type: 'Prata', description: 'Complete todos os contos de Norio.', tip: 'Siga Norio (o monge) e complete suas missões espirituais e de combate.', is_spoiler: false },
      { id: 'headstrong_thief', name: 'The Headstrong Thief', type: 'Prata', description: 'Complete todos os contos de Yuna.', tip: 'Acompanhe Yuna (a ladra) em suas aventuras. Complete todas as missões dela para desbloquear.', is_spoiler: false },
      { id: 'teller_tales', name: 'Teller of Tales', type: 'Prata', description: 'Complete todos os Contos Míticos.', tip: 'Contos Míticos são missões especiais marcadas no mapa. Complete todas as histórias lendárias.', is_spoiler: false },
      { id: 'cooper_clan', name: 'Cooper Clan Cosplayer', type: 'Bronze', description: 'Vista-se como um lendário ladrão.', tip: 'Equipe a Armadura de Gosaku, tinta "Guardião do Oceano", bandana de Kama torto e skin de espada "Sly Tanuki".', is_spoiler: false },
      { id: 'dirge_fallen', name: 'Dirge of the Fallen Forge', type: 'Bronze', description: 'Toque a "Lamentação da Tempestade" no túmulo de um amigo.', tip: 'Colete 5 Grilos Cantores espalhados pelo mapa, desbloqueie a música na flauta e toque no túmulo de um amigo.', is_spoiler: false },
      { id: 'lost_found', name: 'Lost and Found', type: 'Bronze', description: 'Encontre um Pilar da Honra e colete seu Kit de Espada.', tip: 'Localize um Pilar da Honra no mapa, interaja para honrar e receba o kit de espada automaticamente.', is_spoiler: false },
      { id: 'know_enemy', name: 'Know Your Enemy', type: 'Bronze', description: 'Colete 20 registros mongóis.', tip: 'Encontre e leia 20 registros mongóis espalhados pelo mapa (ícones de pergaminho). Explore acampamentos e fortes.', is_spoiler: false },
      { id: 'light_way', name: 'Light the Way', type: 'Bronze', description: 'Reacenda todos os faróis de Tsushima.', tip: 'Suba em todos os faróis do mapa e acenda suas luzes. Há cerca de 10-15 faróis em Tsushima.', is_spoiler: false }
    ]
  }
];

let nextGameId = 3;

// Rota para servir index.html na raiz - DEVE VIR PRIMEIRO
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

// Rotas de API
app.get('/api/games', (req, res) => {
  res.json(games.map(g => ({ id: g.id, name: g.name, difficulty: g.difficulty, time: g.time, missable: g.missable, roadmap: g.roadmap })));
});

app.get('/api/games/:name', (req, res) => {
  const gameName = req.params.name.toLowerCase();
  const game = games.find(g => g.name.toLowerCase() === gameName);
  
  if (!game) {
    res.status(404).json({ error: 'Jogo não encontrado' });
    return;
  }
  
  res.json({
    ...game,
    game: game.name
  });
});

app.post('/api/games', (req, res) => {
  const { name, difficulty, time, missable, roadmap, trophies } = req.body;
  if (!name || !difficulty || !time || !missable || !roadmap || !trophies) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const newGame = {
    id: nextGameId++,
    name,
    difficulty,
    time,
    missable,
    roadmap,
    trophies: trophies.map(t => ({ ...t, is_spoiler: t.isSpoiler || false }))
  };

  games.push(newGame);
  res.json({ message: 'Jogo adicionado com sucesso', game: newGame });
});

// Servir arquivos estáticos por último (para não sobrescrever rotas explícitas)
app.use(express.static('.'));

// Rota 404 fallback - serve index.html para SPA
app.get('*', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
