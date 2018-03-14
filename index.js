const push = require('pushover-notifications');
const moment = require('moment');
const axios = require('axios');
const geocoder = require('geocoder');
const Twitter = require('twitter');
const gen1 = [3, 6, 9, 26, 31, 34, 59, 62, 65, 68, 71, 76, 78, 89, 94, 103, 112, 113, 115, 128, 130, 131, 132, 134, 135, 136, 137, 139, 142,  143, 144, 145, 146, 149, 150, 151];
const gen2 = [154, 157, 160, 180, 181, 182, 186, 196, 197, 201, 205, 208, 212, 214, 229, 230, 232, 233, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251];
const gen3 = [254, 257, 260, 272, 275, 282, 289, 295, 306, 330, 359, 365, 372, 373, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386];
const alreadyNotified = [];

const extraPokemons = [...gen1, ...gen2, ...gen3];

const PUSHOVER_USERS = process.env['POKEMON_PUSHOVER_USERS'].split(',');
const PUSHOVER_TOKEN = process.env['POKEMON_PUSHOVER_TOKEN'];

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const urls = [
  // 'https://pokemap.haukur.io/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=false&swLat=64.07643930614307&swLng=-22.145296709082004&neLat=64.19042456941561&neLng=-21.55958809091794&_=1473462800117',
  // 'http://pogomap.1337.is/raw_data?pokemon=true&pokestops=false&gyms=false&scanned=false&spawnpoints=false&swLat=63.98590428554631&swLng=-22.784883762939444&neLat=64.44052476295313&neLng=-20.442049290283194&_=1474217065177',
  // 'http://pokekort.hunda.io/raw_data?pokemon=true&pokestops=true&gyms=false&scanned=false&spawnpoints=false&swLat=64.09109777360946&swLng=-21.993753154541082&neLat=64.14811883077199&neLng=-21.70089884545905&_=1473462863293'
  // 'http://instinct.hunda.io/data',
      'http://pokekort.hunda.io/data',
  ];

// const headers = {
//   Accept: 'application/json',
//   'Content-Type': 'application/json',
//   'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // eslint-disable-line
//   'Accept-Encoding': 'gzip, deflate, sdch, br'
// };

const getConfig = (url) => {
  return {
    // headers,
    method: 'GET',
    url,
  };
};

function main(config) {
  // console.log('config', config);
  axios(config).then((response) => {
	//console.log(response);
    //const pokes = response.data.filter((d) => d.type === 'pokemon');
    const pokes = response.data;
    // console.log('pokse', pokes);
    console.log(`${config.url.split('/')[2]} nr of pokes: ${pokes.length}`);
    pokes.map((pokemon) => {
      const date = moment(pokemon.disappear_time).utcOffset(0).format('MM-DD-YYYY')
      const pokemonPushNotifyId = `${pokemon.id}_${pokemon.pokemon_id}_${date}`;
      if (checkPokemonArray(pokemon.pokemon_id)) { // pokemon.pokemon_rarity === 'Very Rare' || pokemon.pokemon_rarity === 'Ultra Rare' ||
        console.log(`Found ${pokemon.name} (${pokemon.pokemon_id}) ${alreadyNotified.indexOf(pokemonPushNotifyId)} pokemonPushNotifyId: ${pokemonPushNotifyId} `);
        if (alreadyNotified.indexOf(pokemonPushNotifyId) < 0) {
          geocoder.reverseGeocode(pokemon.lat, pokemon.lon, function ( err, data ) {
            const location = data.results.length > 0 ? data.results[0].formatted_address : 'Unknown location (swipe to see)';
            const disapears = moment(moment.unix(pokemon.expires_at).format()).utcOffset(0).format('HH:mm:ss');

            const message = `${pokemon.name} is somewhere! Disappears at: ${disapears} @ ${location}`;
            // PUSHOVER_USERS.forEach((user) => {
            //   sendNotification(user, message, pokemon.latitude, pokemon.longitude);
            // });
            // console.log(message);
            tweetPokemon(message, pokemon.lat, pokemon.lon);

            alreadyNotified.push(pokemonPushNotifyId); // TODO change to disappear_time
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

const tweetPokemon = (text, latitude, longitude) => {
  const url = `http://maps.google.com/maps?saddr=&daddr=${latitude},${longitude}&directionsmode=driving`;
  client.post('statuses/update', {status: `${text} ${url}`, lat: parseFloat(latitude), long: parseFloat(longitude), display_coordinates: true},  function(error, tweet, response) {
    if(error) {
      console.log('error', error);
      return;
    }
    console.log('tweet', tweet);  // Tweet body.
  });
};
