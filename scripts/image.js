function changeImage(charaName) {
    console.log("Change image to character " + charaName);
    var imageList = []
    firebase.database().ref('images').once('value').then(function (charas) {
        charas.val().forEach(chara => {
            if (chara.name == charaName) {
                chara.images.forEach(image => {
                    imageList.push(image.path);
                });
            }
        });
        if (imageList.length > 0) {
            var imageURL = imageList[Math.floor(Math.random() * imageList.length)];
            var body = document.getElementsByTagName('body')[0];
            body.style.backgroundImage = 'url(\'.' + imageURL + '\')';
        }
    });
}
