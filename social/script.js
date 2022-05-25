var currentOffset = 0;
var allowed = true;

var hiddenImages = [
    "https://api.compensationvr.tk/img/16",
    "https://api.compensationvr.tk/img/133",
    "https://api.compensationvr.tk/img/132",
    "https://api.compensationvr.tk/img/123",
    "https://api.compensationvr.tk/img/122",
    "https://api.compensationvr.tk/img/121",
    "https://api.compensationvr.tk/img/120"
];

// duplicate protection
var alreadyLoaded = []

window.onscroll = function(ev) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        if(!allowed) return;

        loadMore();

        allowed = false;
        setTimeout(() => allowed = true, 1000);
    }
};

loadMore();

function loadMore() {
    window.fetch(`https://api.compensationvr.tk/api/social/imgfeed?count=20&offset=${currentOffset}&reverse=true`).then((response) => {
        if(response.status !== 200) return;

        currentOffset += 10;
        response.json().then((data) => {
            data.forEach((image) => {
                var src = `https://api.compensationvr.tk${image.filePath}`;
                if(hiddenImages.includes(src) || alreadyLoaded.includes(src)) return;
                alreadyLoaded.push(src);

                // container
                const imgContainer = document.createElement("div");
                imgContainer.classList.add("img-container");

                // link around image
                const a = document.createElement("a");
                a.href = src;
                a.target = "_blank";

                // image itself
                const img = document.createElement('img');
                img.src = src;
                img.loading = "lazy";

                // caption
                const h3 = document.createElement('h3');
                h3.innerText = `Taken by "${image.takenBy.nickname}" (@${image.takenBy.username}) on ${image.takenOn.humanReadable}`;

                // tags
                const h4 = document.createElement('h4');
                h4.innerText = `Tags: ${image.social.tags.join(", ")}`;

                // final assembly
                a.appendChild(img);
                imgContainer.appendChild(a);
                imgContainer.appendChild(h3);
                imgContainer.appendChild(h4);
                document.getElementById('image-parent').appendChild(imgContainer);
            });
        })
    });
}

var id = null;
document.getElementById("room-search-input").oninput = () => {
    if(id != null) {
        clearTimeout(id);
        id = null;
    }
    id = setTimeout(search, 1000);
}

document.getElementById("room-search-close").onclick = () => {
    closeRoomSearch();
}

document.getElementById("room-search-button").onclick = () => {
    openRoomSearch();
};

function openRoomSearch() {
    document.querySelector("body").classList.add("frozen");
    document.getElementById("room-search-dimmer").classList.remove("hidden");
    var input = document.getElementById("room-search-input");
    input.value = "";
    input.focus();
}

function closeRoomSearch() {
    document.querySelector("body").classList.remove("frozen");
    document.getElementById("room-search-dimmer").classList.add("hidden");
}

function clearRoomSearch() {
    var parent = document.getElementById("room-search-parent");
    while(parent.firstChild)
        parent.removeChild(parent.firstChild);
}

function search() {
    var input = document.getElementById("room-search-input").value;
    window.fetch(`https://api.compensationvr.tk/api/rooms/search?query=${input}&mode=search`).then((response) => {
        if(response.status != 200) {
            response.text().then(text => {
                console.error(text);
                console.error(response.status);
            });
            closeRoomSearch();
            alert("Failed to search rooms. Please try again later.");
            return;
        }

        response.json().then(data => {
            // clear old results
            var parent = document.getElementById("room-search-parent");
            while(parent.firstChild)
                parent.removeChild(parent.firstChild);

            data.forEach(room => {
                // parent
                const div = document.createElement("div");
                div.classList.add("room-search-item");

                // name
                const h4 = document.createElement("h4");
                h4.innerText = room.name;

                // description
                const p = document.createElement("p");
                p.innerText = room.description;

                // final assembly
                div.appendChild(h4);
                div.appendChild(p);

                // insert
                parent.appendChild(div);
            });
        });
    });
}