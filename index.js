const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

const url = 'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&swLat=64.08783448918172&swLng=-22.10130761988205&neLat=64.1597555893088&neLng=-21.60692285425705&_=1470823652310'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // eslint-disable-line
};

const config = {
  headers,
  method: 'GET',
  url,
};

const alreadyNotified = [];

function main() {
  console.log('looking');
  axios(config).then((response) => {
    response.data.pokemons.map((pokemon) => {
      if (pokemon.pokemon_rarity === 'Very Rare' || pokemon.pokemon_rarity === 'Ultra Rare') {
        console.log('alreadyNotified.indexOf(pokemon.encounter_id)', alreadyNotified.indexOf(pokemon.encounter_id));
        if (alreadyNotified.indexOf(pokemon.encounter_id) < 0) {

          geocoder.reverseGeocode(pokemon.latitude, pokemon.longitude, function ( err, data ) {
            const location = data.results[0].formatted_address;

            const disapears = moment(pokemon.disappear_time).utcOffset(0).format('HH:mm:ss');

            const message = `${pokemon.pokemon_name} is somewhere! Disappears at: ${disapears} @ ${location}`;
            PUSHOVER_USERS.forEach((user) => {
              sendNotification(user, message, pokemon.latitude, pokemon.longitude);
            });

            alreadyNotified.push(pokemon.encounter_id);
          });


        }
      }
    })
  });

}

main();

setInterval(() => {
  main();
}, 30000);

// setInterval(() => {
//     alreadyNotified = [];
// }, 18000000);


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
