const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');
const extraPokemons = [1, 2, 3, 4, 5, 6, 7, 25, 26, 31, 34, 38, 45, 58, 61, 62, 63, 64, 65, 68, 66, 74, 78, 83, 84, 85, 89, 93, 102, 104, 109, 110, 111, 122, 123, 128, 130, 141, 142, 143, 144, 145, 146, 147];
const alreadyNotified = [];

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

const urls = [
  'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&swLat=64.08783448918172&swLng=-22.10130761988205&neLat=64.1597555893088&neLng=-21.60692285425705&_=1470823652310',
  'http://10.0.1.10:5000/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=true&swLat=64.13556628031716&swLng=-21.863283640319878&neLat=64.16658924141537&neLng=-21.716856485778862&_=1471625735635'
  ];

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // eslint-disable-line
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
      if (pokemon.pokemon_rarity === 'Very Rare' || pokemon.pokemon_rarity === 'Ultra Rare' || checkPokemonArray(pokemon.pokemon_id)) {
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
