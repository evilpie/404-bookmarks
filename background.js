/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({url: "/index.html"});
});


async function findDead(error, progress) {
    const ignoredScheme = /^(place|about|javascript|data)\:/i;

    let found = 0;
    let running = 0;
    function work(queue, error, progress) {
        if (running > 30) {
            setTimeout(work, 500, queue, error, progress);
            return;
        }
        if (queue.length == 0) {
            return;
        }

        running++;
        const [url, bookmark] = queue.shift();
        // Can't use HEAD request, because a ton of websites return a 405 error.
        // For example amazon.com or medium.com.
        fetch(url).then(response => {
            running--;

            if (!response.ok) {
                error(bookmark, response.status);
                return;
            }

            found++;
            progress(bookmark.id, found);
        }).catch(exception => {
            running--;
            error(bookmark, exception.toString())
        });

        work(queue, error, progress);
    }

    browser.bookmarks.search({}).then(bookmarks => {
        let queue = [];
        for (const bookmark of bookmarks) {
            const url = bookmark.url;
            if (!url || ignoredScheme.test(url)) {
                continue;
            }

            queue.push([url, bookmark]);
        }

        work(queue, error, progress);
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
