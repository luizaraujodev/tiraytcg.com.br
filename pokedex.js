(function(){
var WHATS='5537999356759';
var NAMES=["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh"];
var KEY='tiray-pokedex-v1';
var have={};
try{have=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
function $(i){return document.getElementById(i)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(have))}catch(e){}}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
var grid=$('grid'),cards=[];
NAMES.forEach(function(name,i){
  var n=i+1,b=document.createElement('button');
  b.type='button';b.className='pk-card';b.dataset.n=n;
  b.innerHTML='<img loading="lazy" alt="" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+n+'.png" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+n+'.png\'">'+
   '<span class="n">#'+String(n).padStart(3,'0')+'</span><span class="nm"></span><span class="ck">✓</span>';
  b.querySelector('.nm').textContent=name;
  b.onclick=function(){if(have[n])delete have[n];else have[n]=1;save();update()};
  grid.appendChild(b);cards.push(b);
});
function missing(){return NAMES.map(function(x,i){return[i+1,x]}).filter(function(p){return !have[p[0]]})}
function update(){
  var q=norm($('q').value.trim()),v=$('view').value,h=0;
  cards.forEach(function(c,i){
    var n=i+1,on=!!have[n];if(on)h++;
    c.setAttribute('aria-pressed',on);
    var ok=(!q||norm(NAMES[i]).indexOf(q)>-1||String(n)===q.replace('#','')||String(n).padStart(3,'0')===q.replace('#',''))&&
      (v==='all'||(v==='have'&&on)||(v==='missing'&&!on));
    c.hidden=!ok;c.style.display=ok?'':'none';
  });
  $('fill').style.width=(h/250*100)+'%';
  $('progress').textContent='Você tem '+h+' de 250 · faltam '+(250-h);
  $('bar-text').textContent='Faltam '+(250-h);
}
function build(){
  var m=missing();
  if(!m.length)return 'Oi! Completei a Pokédex dos 250! 🎉';
  return 'Oi! Na Pokédex dos 250, me faltam '+m.length+':\n\n'+m.map(function(p){return String(p[0]).padStart(3,'0')+' '+p[1]}).join('\n');
}
$('q').oninput=update;$('view').onchange=update;
$('clear-all').onclick=function(){if(Object.keys(have).length&&confirm('Desmarcar todos os Pokémon?')){have={};save();update()}};
$('open').onclick=function(){
  var msg=build();$('msg').value=msg;
  $('send').href='https://wa.me/'+WHATS+'?text='+encodeURIComponent(msg);
  $('sheet').hidden=false;
};
$('copy').onclick=function(){
  var t=$('msg');t.select();
  (navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(function(){$('copy').textContent='Copiado!'},function(){document.execCommand('copy');$('copy').textContent='Copiado!'});
};
document.querySelectorAll('[data-close]').forEach(function(e){e.onclick=function(){$('sheet').hidden=true;$('copy').textContent='Copiar lista (se o WhatsApp não abrir)'}});
update();
})();
