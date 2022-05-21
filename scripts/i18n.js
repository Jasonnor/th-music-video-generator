let cached = {};
let langSelect = document.getElementById('langSelect');

function getLangfile(lang) {
    return new Promise(function (resolve, reject) {
        if (cached[lang]) resolve(cached[lang]);
        firebase
            .database()
            .ref('i18n')
            .once('value')
            .then(function (i18n) {
                let json = i18n.val()[lang];
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
        let songF = tokens[2].replace('.', '') + '_' + tokens[3].slice(0, 2);
        getLangfile(lang)
            .then((json) => {
                resolve(json[songF]);
            })
            .catch((e) => reject(e));
    });
}
