/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({url: "/index.html"});
});


function findDead(error, progress) {
    var ignoredScheme = /^(place|about|javascript|data)\:/i;

    browser.bookmarks.search({}).then(bookmarks => {
        let found = 0;

        for (const bookmark of bookmarks) {
            const url = bookmark.url;
            if (!url || ignoredScheme.test(url)) {
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
