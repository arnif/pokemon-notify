const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');
const extraPokemons = [1, 2, 3, 4, 5, 6, 8, 9, 25, 26, 31, 34, 38, 45, 51, 59, 62, 65, 67, 68, 75, 76, 83, 85, 88, 89, 94, 102, 103, 105, 110, 112, 115, 128, 130, 131, 132, 137, 139, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151];
const alreadyNotified = [];

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

const urls = [
  'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=false&swLat=64.07643930614307&swLng=-22.145296709082004&neLat=64.19042456941561&neLng=-21.55958809091794&_=1473462800117',
  'http://10.0.1.10:5000/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=false&swLat=64.12237880547288&swLng=-21.87109957727057&neLat=64.1508718873807&neLng=-21.724672422729554&_=1473462885549',
  'http://pogomap.1337.is/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=false&swLat=64.1176070257449&swLng=-22.090685154541006&neLat=64.17457375329944&neLng=-21.797830845458975&_=1473462833737',
  'http://pokekort.hunda.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.09109777360946&swLng=-21.993753154541082&neLat=64.14811883077199&neLng=-21.70089884545905&_=1473462863293'
  ];

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // eslint-disable-line
  'Accept-Encoding': 'gzip, deflate, sdch, br'
};

const getConfig = (url) => {
  return {
    headers,
    method: 'GET',
    url,
  };
};

function main(config) {
  axios(config).then((response) => {
    console.log(`${config.url.split('/')[2]} nr of pokes: ${response.data.pokemons.length}`);
    response.data.pokemons.map((pokemon) => {
      if (checkPokemonArray(pokemon.pokemon_id)) { // pokemon.pokemon_rarity === 'Very Rare' || pokemon.pokemon_rarity === 'Ultra Rare' ||
        console.log(`Found ${pokemon.pokemon_name} (${pokemon.pokemon_id}) ${alreadyNotified.indexOf(pokemon.encounter_id)} encounter_id: ${pokemon.encounter_id} `);
        if (alreadyNotified.indexOf(pokemon.encounter_id) < 0) {
          geocoder.reverseGeocode(pokemon.latitude, pokemon.longitude, function ( err, data ) {
            const location = data.results.length > 0 ? data.results[0].formatted_address : 'Unknown location (swipe to see)';

            const disapears = moment(pokemon.disappear_time).utcOffset(0).format('HH:mm:ss');

            const message = `${pokemon.pokemon_name} is somewhere! Disappears at: ${disapears} @ ${location}`;
            PUSHOVER_USERS.forEach((user) => {
              sendNotification(user, message, pokemon.latitude, pokemon.longitude);
            });
            // console.log(message);

            alreadyNotified.push(pokemon.encounter_id); // TODO change to disappear_time
          });


        }
      }
    })
  });

}

urls.forEach((url) => {
  main(getConfig(url));
});

setInterval(() => {
  urls.forEach((url) => {
    main(getConfig(url));
  });
}, 30000);

// setInterval(() => {
//     alreadyNotified = [];
// }, 18000000);

const checkPokemonArray = (pokemonId) => {
  return extraPokemons.some((id) => {
    if(pokemonId === id) {
      return true;
    }
  });
  return false;
};

const sendNotification = (user, text, latitude, longitude) => {
  const p = new push( {
    user: user,
    token: PUSHOVER_TOKEN,
  });

  const msg = {
    message: text,   // required
    title: 'Pokemon',
    url: `http://maps.google.com/maps?saddr=&daddr=${latitude},${longitude}&directionsmode=driving`,
  };
  return new Promise((resolve, reject) => {
    p.send(msg, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
};
