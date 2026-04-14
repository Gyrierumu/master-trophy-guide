const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rota para servir index.html na raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./guides.db', (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    db.serialize(() => {
      createTables();
    });
  }
});

// Criar tabelas
function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    difficulty INTEGER,
    time TEXT,
    missable TEXT,
    roadmap TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS trophies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    trophy_id TEXT,
    name TEXT,
    type TEXT,
    description TEXT,
    tip TEXT,
    is_spoiler BOOLEAN,
    FOREIGN KEY (game_id) REFERENCES games (id)
  )`, () => {
    insertSampleData();
  });
}

// Inserir dados de exemplo
function insertSampleData() {
  const sampleGames = [
    {
      name: 'Elden Ring',
      difficulty: 8,
      time: '20-30 horas',
      missable: 'Alguns troféus podem ser perdidos se não completados na ordem certa.',
      roadmap: JSON.stringify(['Complete o tutorial', 'Explore as áreas iniciais', 'Derrote chefes principais']),
      trophies: [
        { id: 'platinum', name: 'Elden Lord', type: 'Platina', desc: 'Derrote o final do jogo', tip: 'Siga o roadmap principal', isSpoiler: false },
        { id: 'gold1', name: 'Age of the Stars', type: 'Ouro', desc: 'Complete o ending alternativo', tip: 'Encontre a Ranni', isSpoiler: true }
      ]
    },
    {
      name: 'Ghost of Tsushima',
      difficulty: 7,
      time: '15-20 horas',
      missable: 'Troféus relacionados a exploração e missões secundárias podem ser perdidos se não completados antes do final.',
      roadmap: JSON.stringify([
        'Complete o prólogo e chegue à vila de Jogaku',
        'Libere o mapa explorando regiões',
        'Complete missões principais e derrote inimigos lendários',
        'Explore ilhas e complete atividades secundárias',
        'Complete o modo New Game+ para troféus restantes'
      ]),
      trophies: [
        { id: 'platinum', name: 'Living Legend', type: 'Platina', desc: 'Obtenha todos os troféus', tip: 'Complete todos os 35 troféus listados no jogo. Foque nos troféus de exploração e contos secundários para garantir que nenhum seja perdido.', isSpoiler: false },
        { id: 'gathering_storm', name: 'Gathering Storm', type: 'Bronze', desc: 'Recupere a katana do clã Sakai.', tip: 'Este troféu é desbloqueado automaticamente durante o prólogo do jogo. Simplesmente siga a história inicial.', isSpoiler: false },
        { id: 'point_no_return', name: 'Point of No Return', type: 'Bronze', desc: 'Quebre seu código para ajudar um novo amigo.', tip: 'Durante a história principal, você encontrará um amigo em necessidade. Quebre o código de honra do samurai para ajudá-lo, o que desbloqueia este troféu.', isSpoiler: false },
        { id: 'company_wolves', name: 'Company of Wolves', type: 'Bronze', desc: 'Recrute os Ronin Chapéus de Palha.', tip: 'No início do jogo, após escapar da vila, siga o caminho até encontrar o lobo. Complete a missão para recrutá-lo como companheiro.', isSpoiler: false },
        { id: 'kindling_flare', name: 'Kindling the Flare', type: 'Bronze', desc: 'Recupere Taka do cativeiro mongol.', tip: 'Durante a progressão da história, você chegará a uma vila onde Taka está capturado. Liberte-o completando a missão de resgate.', isSpoiler: false },
        { id: 'family_reunion', name: 'Family Reunion', type: 'Bronze', desc: 'Libere o Lorde Shimura das garras do Khan.', tip: 'Este é um marco importante na história. Continue a narrativa principal até o confronto com o Khan para resgatar Shimura.', isSpoiler: true },
        { id: 'leader_people', name: 'Leader of the People', type: 'Bronze', desc: 'Mobilize os camponeses de Yarikawa.', tip: 'Em Yarikawa, ajude os camponeses a se rebelar contra os mongóis. Complete missões de libertação na área.', isSpoiler: false },
        { id: 'birthright', name: 'Birthright', type: 'Bronze', desc: 'Recupere a armadura do seu pai.', tip: 'Explore o mapa para encontrar a armadura ancestral do clã Sakai. Geralmente localizada em uma área específica da ilha.', isSpoiler: false },
        { id: 'dying_embers', name: 'Dying Embers', type: 'Bronze', desc: 'Despeça-se de seus aliados.', tip: 'Perto do final do jogo, você terá cenas de despedida com aliados importantes. Complete essas interações para desbloquear.', isSpoiler: true },
        { id: 'the_ghost', name: 'The Ghost', type: 'Bronze', desc: 'Aceite sua nova identidade.', tip: 'Durante a história, você assumirá o manto do Fantasma. Este troféu é desbloqueado ao aceitar essa identidade.', isSpoiler: false },
        { id: 'exiled_alliance', name: 'The Exiled Alliance', type: 'Ouro', desc: 'Reúna-se com seus aliados no gélido norte.', tip: 'Viaje para o norte gelado de Tsushima para reunir aliados exilados. Complete missões nessa região.', isSpoiler: false },
        { id: 'sovereign_end', name: 'Sovereign End', type: 'Ouro', desc: 'Enfrente o Khan.', tip: 'Este é o clímax da história. Prepare-se para o confronto final com o Khan e seus guardas.', isSpoiler: true },
        { id: 'mono_aware', name: 'Mono No Aware', type: 'Ouro', desc: 'Deixe o passado para trás e aceite o peso do seu novo fardo.', tip: 'Complete o jogo até o final verdadeiro, aceitando as consequências das suas ações.', isSpoiler: true },
        { id: 'flash_steel', name: 'Flash of Steel', type: 'Prata', desc: 'Derrote 20 inimigos com um contra-ataque após um Aparo Perfeito.', tip: 'Pratique o timing dos parries perfeitos (botão de bloqueio no momento exato). Use contra-ataques em combates contra inimigos comuns.', isSpoiler: false },
        { id: 'witness_protection', name: 'Witness Protection', type: 'Bronze', desc: 'Atire uma flecha em um inimigo aterrorizado enquanto ele foge.', tip: 'Durante combates, quando um inimigo tentar fugir aterrorizado, mire e atire uma flecha nele antes que escape.', isSpoiler: false },
        { id: 'open_business', name: 'Open for Business', type: 'Bronze', desc: 'Atordoe inimigos 50 vezes.', tip: 'Use ataques furtivos ou rajadas de vento para atordoar inimigos. Conte 50 atordoamentos em combates variados.', isSpoiler: false },
        { id: 'only_one', name: 'There Can Be Only One', type: 'Prata', desc: 'Complete todos os duelos com sucesso.', tip: 'Procure duelos marcados no mapa (ícones de espada). Há vários espalhados por Tsushima; vença todos sem perder.', isSpoiler: false },
        { id: 'nice_fall', name: 'Have a Nice Fall', type: 'Bronze', desc: 'Mate um inimigo com dano de queda empurrando-o de uma borda.', tip: 'Em áreas com penhascos, use a Postura do Vento ou um chute para empurrar inimigos de bordas altas.', isSpoiler: false },
        { id: 'haunting_precision', name: 'Haunting Precision', type: 'Prata', desc: 'Mate 20 inimigos com golpes da Postura do Fantasma.', tip: 'Desbloqueie e use a Postura do Fantasma em combates. Golpes carregados matam inimigos rapidamente; use contra 20 oponentes.', isSpoiler: false },
        { id: 'favor_kami', name: 'Favor of the Kami', type: 'Bronze', desc: 'Encontre e honre todos os Santuários Shinto.', tip: 'Explore o mapa para encontrar santuários (ícones de templo). Interaja com eles para honrá-los; há vários em cada região.', isSpoiler: false },
        { id: 'slay_prayers', name: 'Slay the Prayers', type: 'Bronze', desc: 'Visite e honre todos os Pilares da Honra.', tip: 'Pilares da Honra são monumentos antigos. Encontre-os no mapa e interaja para honrá-los; complete todos para o troféu.', isSpoiler: false },
        { id: 'body_mind_spirit', name: 'Body, Mind, and Spirit', type: 'Bronze', desc: 'Complete todas as Fontes Termais, Haikus, Santuários Inari e Bambus de Treino.', tip: 'Colecione e complete: mergulhe em fontes termais, leia haikus, visite santuários Inari (tocas de raposa) e treine em bambus. Explore todo o mapa.', isSpoiler: false },
        { id: 'gift_idols', name: 'A Gift from the Idols', type: 'Bronze', desc: 'Colete 10 presentes dos altares de oferendas.', tip: 'Encontre altares de oferendas (estátuas) no mapa e interaja para receber presentes. Colete de 10 diferentes.', isSpoiler: false },
        { id: 'monochrome_masters', name: 'Monochrome Masters', type: 'Bronze', desc: 'Compre um item dos mercadores de tinta preta e branca.', tip: 'Visite mercadores especializados em tintas (geralmente em vilas maiores) e compre qualquer item de tinta preta ou branca.', isSpoiler: false },
        { id: 'avenging_spring', name: 'Avenging Spring', type: 'Bronze', desc: 'Encontre todas as áreas de Faróis e acenda-os.', tip: 'Faróis são torres altas no mapa. Suba neles e acenda as luzes; há vários em Tsushima.', isSpoiler: false },
        { id: 'grand_liberator', name: 'A Grand Liberator', type: 'Bronze', desc: 'Libere todas as áreas ocupadas em Izuhara, Toyotama e Kamiagata.', tip: 'Complete missões de libertação em todas as regiões ocupadas pelos mongóis. Foque em vilas e fortes.', isSpoiler: false },
        { id: 'unbending_archer', name: 'The Unbending Archer', type: 'Prata', desc: 'Complete todos os contos de Ishikawa.', tip: 'Encontre Ishikawa (o arqueiro) e complete todas as suas missões secundárias. Geralmente envolvem combates e exploração.', isSpoiler: false },
        { id: 'vengeful_warrior', name: 'The Vengeful Warrior', type: 'Prata', desc: 'Complete todos os contos de Masako.', tip: 'Ajude Masako (a guerreira vingativa) em suas missões. Complete toda a série de contos dela.', isSpoiler: false },
        { id: 'unyielding_monk', name: 'The Unyielding Monk', type: 'Prata', desc: 'Complete todos os contos de Norio.', tip: 'Siga Norio (o monge) e complete suas missões espirituais e de combate.', isSpoiler: false },
        { id: 'headstrong_thief', name: 'The Headstrong Thief', type: 'Prata', desc: 'Complete todos os contos de Yuna.', tip: 'Acompanhe Yuna (a ladra) em suas aventuras. Complete todas as missões dela para desbloquear.', isSpoiler: false },
        { id: 'teller_tales', name: 'Teller of Tales', type: 'Prata', desc: 'Complete todos os Contos Míticos.', tip: 'Contos Míticos são missões especiais marcadas no mapa. Complete todas as histórias lendárias.', isSpoiler: false },
        { id: 'cooper_clan', name: 'Cooper Clan Cosplayer', type: 'Bronze', desc: 'Vista-se como um lendário ladrão.', tip: 'Equipe a Armadura de Gosaku, tinta "Guardião do Oceano", bandana de Kama torto e skin de espada "Sly Tanuki".', isSpoiler: false },
        { id: 'dirge_fallen', name: 'Dirge of the Fallen Forge', type: 'Bronze', desc: 'Toque a "Lamentação da Tempestade" no túmulo de um amigo.', tip: 'Colete 5 Grilos Cantores espalhados pelo mapa, desbloqueie a música na flauta e toque no túmulo de um amigo.', isSpoiler: false },
        { id: 'lost_found', name: 'Lost and Found', type: 'Bronze', desc: 'Encontre um Pilar da Honra e colete seu Kit de Espada.', tip: 'Localize um Pilar da Honra no mapa, interaja para honrar e receba o kit de espada automaticamente.', isSpoiler: false },
        { id: 'know_enemy', name: 'Know Your Enemy', type: 'Bronze', desc: 'Colete 20 registros mongóis.', tip: 'Encontre e leia 20 registros mongóis espalhados pelo mapa (ícones de pergaminho). Explore acampamentos e fortes.', isSpoiler: false },
        { id: 'light_way', name: 'Light the Way', type: 'Bronze', desc: 'Reacenda todos os faróis de Tsushima.', tip: 'Suba em todos os faróis do mapa e acenda suas luzes. Há cerca de 10-15 faróis em Tsushima.', isSpoiler: false }
      ]
    }
  ];

  sampleGames.forEach(game => {
    db.run(`INSERT OR IGNORE INTO games (name, difficulty, time, missable, roadmap) VALUES (?, ?, ?, ?, ?)`,
      [game.name, game.difficulty, game.time, game.missable, game.roadmap], function(err) {
        if (err) {
          console.error('Erro ao inserir jogo:', err);
        } else {
          const gameId = this.lastID;
          game.trophies.forEach(trophy => {
            db.run(`INSERT OR IGNORE INTO trophies (game_id, trophy_id, name, type, description, tip, is_spoiler) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [gameId, trophy.id, trophy.name, trophy.type, trophy.desc, trophy.tip, trophy.isSpoiler]);
          });
        }
      });
  });
}


// Rotas
app.get('/api/games', (req, res) => {
  db.all(`SELECT * FROM games`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/games/:name', (req, res) => {
  const gameName = req.params.name.toLowerCase();
  db.get(`SELECT * FROM games WHERE LOWER(name) = ?`, [gameName], (err, game) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!game) {
      res.status(404).json({ error: 'Jogo não encontrado' });
      return;
    }

    db.all(`SELECT * FROM trophies WHERE game_id = ?`, [game.id], (err, trophies) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      game.game = game.name; // Para compatibilidade
      game.trophies = trophies.map(t => ({ ...t, id: t.trophy_id })); // Mapear id
      game.roadmap = JSON.parse(game.roadmap);
      res.json(game);
    });
  });
});

app.post('/api/games', express.json(), (req, res) => {
  const { name, difficulty, time, missable, roadmap, trophies } = req.body;
  if (!name || !difficulty || !time || !missable || !roadmap || !trophies) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  db.run(`INSERT INTO games (name, difficulty, time, missable, roadmap) VALUES (?, ?, ?, ?, ?)`,
    [name, difficulty, time, missable, JSON.stringify(roadmap)], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const gameId = this.lastID;
      const stmt = db.prepare(`INSERT INTO trophies (game_id, trophy_id, name, type, description, tip, is_spoiler) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      trophies.forEach(trophy => {
        stmt.run([gameId, trophy.id, trophy.name, trophy.type, trophy.description, trophy.tip, trophy.isSpoiler]);
      });
      stmt.finalize();
      res.json({ message: 'Jogo adicionado com sucesso' });
    });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});