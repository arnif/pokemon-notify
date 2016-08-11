const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');

const PUSHOVER_USERS = process.env['PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['PUSHOVER_TOKEN'];

const url = 'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&swLat=64.08783448918172&swLng=-22.10130761988205&neLat=64.1597555893088&neLng=-21.60692285425705&_=1470823652310'

const alreadyNotified = [];

function main() {
    console.log('looking');
    axios.get(url).then((response) => {
        // console.log('response');
        // console.log(response.data.pokemons);
        response.data.pokemons.map((pokemon) => {
            if (pokemon.pokemon_rarity === 'Very Rare') {
                console.log('alreadyNotified.indexOf(pokemon.encounter_id)', alreadyNotified.indexOf(pokemon.encounter_id));
                if (alreadyNotified.indexOf(pokemon.encounter_id) < 0) {

                    geocoder.reverseGeocode(pokemon.latitude, pokemon.longitude, function ( err, data ) {
                        // do something with data
                        // console.log('location', data.results[0].geometry);
                        const location = data.results[0].formatted_address;
                        // console.log('LLL', location);

                        const disapears = moment(pokemon.disappear_time).format('HH:mm:ss');
                        // console.log('RARE', pokemon);
                        // console.log(disapears);
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
    url: `comgooglemaps://?saddr=&daddr=${latitude},${longitude}&directionsmode=driving`
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
