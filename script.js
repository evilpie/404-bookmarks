/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleDead({bookmark, error}) {
    if (document.getElementById("bookmark-" + bookmark.id))
        return;

    const li = document.createElement("li")
    li.id = "bookmark-" + bookmark.id;

    const remove = document.createElement("a");
    remove.onclick = (event) => {
        browser.runtime.sendMessage({type: "remove", id: bookmark.id});
        li.remove();
        event.preventDefault();
    }
    remove.href = "#";
    remove.classList.add("remove");
    remove.textContent = "remove";
    li.append(remove)

    li.append(" ")

    const a = document.createElement("a");
    a.href = bookmark.url;
    a.textContent = bookmark.title || bookmark.url;
    a.target = "_blank";
    li.append(a);

    li.append(` (${error})`);

    const ul = document.getElementById((error === 404) ? "404-errors" : "other-errors");
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
