function handleDead({bookmark, error}) {
    const ul = document.querySelector("ul");

    if (document.getElementById("bookmark-" + bookmark.id))
        return;

    const li = document.createElement("li")
    li.id = "bookmark-" + bookmark.id;

    const a = document.createElement("a");
    a.href = bookmark.url;
    a.textContent = bookmark.title || bookmark.url;
    a.target = "_blank";
    li.append(a);

    li.append(` (${error}) `);

    const remove = document.createElement("a");
    remove.onclick = (event) => {
        browser.runtime.sendMessage({type: "remove", id: bookmark.id});
        ul.removeChild(li);
        event.preventDefault();
    }
    remove.href = "#";
    remove.class = "remove"
    remove.textContent = "[Remove]";
    li.append(remove)

    ul.append(li);
}

function handleAlive({id, found}) {
    const li = document.getElementById("bookmark-" + id);
    if (li) {
        const ul = document.querySelector("ul");
        ul.removeChild(li);
    }

    document.querySelector("#live").textContent = found;
}

function onMessage(message) {
    if (message.type === "dead") {
        handleDead(message);
    } else if (message.type === "alive") {
        handleAlive(message);
    }
}

browser.runtime.onMessage.addListener(onMessage);
browser.runtime.sendMessage({type: "find_dead"});
