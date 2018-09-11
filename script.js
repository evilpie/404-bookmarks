/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// about:config "extensions.webextensions.restrictedDomains"
const RESTRICTED_DOMAINS = [
    "accounts-static.cdn.mozilla.net",
    "accounts.firefox.com",
    "addons.cdn.mozilla.net",
    "addons.mozilla.org",
    "api.accounts.firefox.com",
    "content.cdn.mozilla.net",
    "content.cdn.mozilla.net",
    "discovery.addons.mozilla.org",
    "input.mozilla.org",
    "install.mozilla.org",
    "oauth.accounts.firefox.com",
    "profile.accounts.firefox.com",
    "support.mozilla.org",
    "sync.services.mozilla.com",
    "testpilot.firefox.com",

    // I see these failures as well
    "marketplace.firefox.com",
    "www.mozilla.org",
];

function handleDead({bookmark, error}) {
    if (document.getElementById("bookmark-" + bookmark.id))
        return;

    const li = document.createElement("li")
    li.id = "bookmark-" + bookmark.id;

    const input = document.createElement("input");
    input.type = "checkbox";
    li.append(input)

    li.append(" ")

    const a = document.createElement("a");
    a.href = bookmark.url;
    a.textContent = bookmark.title || bookmark.url;
    a.target = "_blank";
    li.append(a);

    if (error == "TypeError: NetworkError when attempting to fetch resource.") {
        error = "NetworkError";

        // Ignore NetworkErrors for domains on the restricted list that
        // WebExtensions can't access.
        try {
            const url = new URL(bookmark.url);
            if (RESTRICTED_DOMAINS.includes(url.hostname))
                return;
        } catch (e) {}
    }

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

function update(name) {
    const ctr = document.getElementById(name);

    const selected = ctr.querySelectorAll("input:checked").length;
    const removal = ctr.querySelector("a.remove");
    if (selected === 0) {
        removal.classList.add("disabled");
        removal.textContent = "Select bookmarks to remove";
    } else if (selected === 1) {
        removal.classList.remove("disabled");
        removal.textContent = "Remove 1 bookmark";
    } else {
        removal.classList.remove("disabled");
        removal.textContent = `Remove ${selected} bookmarks`;
    }
}

document.body.addEventListener("click", function(event) {
    const t = event.target;
    if (t.classList.contains("select-all")) {
        for (let input of t.parentNode.querySelectorAll("input")) {
            input.checked = true;
        }
        event.preventDefault();
    } else if (t.classList.contains("remove")) {
        const toRemove = t.parentNode.querySelectorAll("li > input:checked");
        if (toRemove.length >= 5) {
            if (!confirm(`Are you sure you want to remove ${toRemove.length} bookmarks? This operation cannot be undone.`))
                return;
        }

        for (let node of toRemove) {
            node = node.parentNode; // Selected input, but want li.
            browser.runtime.sendMessage({type: "remove", id: node.id.replace("bookmark-", "")});
            node.remove();
        }
        event.preventDefault();
    }

    update("404-errors-ctr");
    update("other-errors-ctr");
});

