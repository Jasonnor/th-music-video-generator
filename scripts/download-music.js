// Visit https://thwiki.cc/${Series}/Music

function forceDownload(blob, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = blob;
    // For Firefox https://stackoverflow.com/a/32226068
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function downloadResource(url, filename) {
    if (!filename) filename = url.split('\\').pop().split('/').pop();
    fetch(url, {
        headers: new Headers({
            'Origin': location.origin
        }),
        mode: 'cors'
    })
        .then(response => response.blob())
        .then(blob => {
            let blobUrl = window.URL.createObjectURL(blob);
            forceDownload(blobUrl, filename);
        })
        .catch(e => console.error(e));
}

document.querySelectorAll('audio').forEach(
    (audioElement, index) => {
        let songName = document.querySelectorAll('.tt-header')[index].querySelector('td.tt-titleja>div.poem').innerHTML;
        let songFileName = `${('0' + (index + 1)).slice(-2)}. ${songName}.mp3`
        console.log(`Download ${audioElement.src} to ${songFileName}`)
        downloadResource(audioElement.src, songFileName);
    }
)
