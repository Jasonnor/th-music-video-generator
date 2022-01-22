let cached = {};
let langSelect = document.getElementById('langSelect');
function getLangfile(lang) {
    return new Promise(function (resolve, reject) {
        if (cached[lang]) resolve(cached[lang]);
        axios
            .get(
                'https://www.thpatch.net/w/index.php?title=Special:Translate&taction=export&group=themedb&language=' +
                    lang +
                    '&task=export-to-file'
            )
            .then(function (response) {
                let json = response.data;

                if (typeof json === 'string') {
                    let newjson = '';
                    json.split(/\t/).forEach((str) => (newjson += str));
                    json = newjson;
                    json = JSON.parse(json);
                }
                let res = {};
                for (let property in json) {
                    let item = json[property];
                    if (item.startsWith('#REDIRECT [[tdb:')) {
                        item = item.slice(16);
                        item = item.slice(0, item.length - 2);
                        item.replaceAll(/\s/g, '_');
                        item = json[item];
                    }
                    res[property] = item;
                }
                console.log(lang);
                if (!cached) cached = {};
                cached[lang] = res;
                resolve(res);
            })
            .catch(function (error) {
                // handle error
                reject(error);
            });
    });
}

function getTranslatedSong(songFile, lang) {
    return new Promise((resolve, reject) => {
        let tokens = songFile.split('/');
        console.log(tokens);
        let songF = tokens[2].replace('.', '') + '_' + tokens[3].slice(0, 2) + '/' + lang;
        console.log(songF);
        getLangfile(lang)
            .then((json) => {
                console.log(json);
                console.log(json[songF]);
                resolve(json[songF]);
            })
            .catch((e) => reject(e));
    });
}
