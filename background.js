browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({url: "/index.html"});
});


function findDead(error, progress) {
    browser.bookmarks.search({}).then(bookmarks => {
        let found = 0;

        for (const bookmark of bookmarks) {
            const url = bookmark.url;
            if (!url || url.startsWith("place:") || url.startsWith("about:") || url.startsWith("javascript:")) {
                continue;
            }

            // Can't use HEAD request, because a ton of websites return a 405 error.
            // For example amazon.com or medium.com.
            fetch(url).then(response => {
                if (!response.ok) {
                    error(bookmark, response.status);
                    return;
                }

                found++;
                progress(bookmark.id, found);
            }).catch(exception => error(bookmark, exception.toString()))
        }
    });
}

function onMessage(message, sender, sendResponse) {
    if (message.type == "find_dead") {
        findDead((bookmark, error) => {
            browser.tabs.sendMessage(sender.tab.id, {type: "dead", bookmark, error});
        }, (id, found) => {
            browser.tabs.sendMessage(sender.tab.id, {type: "alive", id, found});
        });
    } else if (message.type == "remove") {
        browser.bookmarks.remove(message.id);
    }

    return true;
}

browser.runtime.onMessage.addListener(onMessage);
