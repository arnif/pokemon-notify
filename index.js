const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');
const extraPokemons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 26, 31, 34, 38, 45, 50, 51, 58, 59, 63, 64, 65, 66, 67, 68, 74, 75, 76, 83, 84, 85, 88, 89, 93, 94, 102, 103, 104, 105, 109, 110, 111, 112, 115, 123, 128, 130, 131, 132, 137, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151];
const alreadyNotified = [];

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

const urls = [
  'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.11540986978804&swLng=-21.975008623144504&neLat=64.1723811007844&neLng=-21.682154314062473&_=1472025782428',
  'http://10.0.1.10:5000/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=true&swLat=64.13556628031716&swLng=-21.863283640319878&neLat=64.16658924141537&neLng=-21.716856485778862&_=1471625735635',
  'http://pogomap.1337.is/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.11034913665296&swLng=-21.963827396972647&neLat=64.16733074015794&neLng=-21.670973087890616&_=1471851987416'
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
