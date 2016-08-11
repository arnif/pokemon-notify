const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');

const PUSHOVER_USER = process.env['PUSHOVER_USER'];
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
                    const disapears = moment(pokemon.disappear_time).format('HH:mm:ss');
                    console.log('RARE', pokemon);
                    console.log(disapears);
                    const message = `${pokemon.pokemon_name} is somewhere! Disappears at: ${disapears}`;
                    sendNotification(message);
                    alreadyNotified.push(pokemon.encounter_id);
                }
            }
        })
    });

}

main();

setInterval(() => {
    main();
}, 30000);


const sendNotification = (text) => {
  const p = new push( {
    user: PUSHOVER_USER,
    token: PUSHOVER_TOKEN,
  });

  const msg = {
    message: text,   // required
    title: 'Pokemon',
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
