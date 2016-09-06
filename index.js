const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');
const extraPokemons = [1, 2, 3, 4, 5, 6, 8, 9, 25, 26, 31, 34, 38, 45, 51, 59, 62, 65, 67, 68, 75, 76, 83, 85, 88, 89, 94, 102, 103, 105, 110, 112, 115, 128, 130, 131, 132, 137, 139, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151];
const alreadyNotified = [];

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

const urls = [
  'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.11540986978804&swLng=-21.975008623144504&neLat=64.1723811007844&neLng=-21.682154314062473&_=1472025782428',
  'http://10.0.1.10:5000/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=true&spawnpoints=false&swLat=64.10600945397103&swLng=-21.929121122680726&neLat=64.16299995176239&neLng=-21.636266813598695&_=1472320267611',
  'http://pogomap.1337.is/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.10665154548843&swLng=-21.89936854992675&neLat=64.13516075128683&neLng=-21.752941395385733&_=1471977111499',
  'http://hunda.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.10693212962734&swLng=-21.888996799255438&neLat=64.13544104778424&neLng=-21.742569644714422&_=1472488024011'
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
    response.data.pokemons.map((pokemon) => {
      if (checkPokemonArray(pokemon.pokemon_id)) { // pokemon.pokemon_rarity === 'Very Rare' || pokemon.pokemon_rarity === 'Ultra Rare' ||
        console.log('alreadyNotified.indexOf(pokemon.encounter_id)', alreadyNotified.indexOf(pokemon.encounter_id));
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
