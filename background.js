/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({url: "/index.html"});
});

const IGNORED_SCHEME = /^(place|about|javascript|data)\:/i;
const NOT_FOUND_404 = /\b404\b|(page not found)|(file not found)|(site not found)/i;

async function findDead(error, progress) {
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
        const bookmark = queue.shift();
        // Can't use HEAD request, because a ton of websites return a 405 error.
        // For example amazon.com or medium.com.
        fetch(bookmark.url).then(response => {
            running--;

            if (response.status == 404) {
                // Verify 404 response text
                return response.text().then(text => {
                    // Apparently it's quite common to find server returning
                    // 404 errors for _existing_ pages.

                    if (NOT_FOUND_404.test(text)) {
                        // Response text contains 404 or "not found".
                        error(bookmark, response.status)
                    } else {
                        error(bookmark, -404);
                    }
                });
            }

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
            if (!url || IGNORED_SCHEME.test(url)) {
                continue;
            }

            queue.push(bookmark);
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
