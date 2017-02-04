function main() {
    const ul = document.querySelector("ul");
    ul.innerHTML = "";

    function error(bookmark, msg) {
        const li = document.createElement("li")

        const a = document.createElement("a");
        a.href = bookmark.url;
        a.textContent = bookmark.title || bookmark.url;
        a.target = "_blank";
        li.append(a);
        li.append(` (${msg}) `);

        const remove = document.createElement("a");
        remove.onclick = (event) => {
            browser.bookmarks.remove(bookmark.id);
            ul.removeChild(li);
            event.preventDefault();
        }
        remove.href = "#";
        remove.class = "remove"
        remove.textContent = "[Remove]";
        li.append(remove)

        ul.append(li);
    }

    browser.bookmarks.search({}).then(bookmarks => {
        for (const bookmark of bookmarks) {
            const url = bookmark.url;
            if (!url || url.startsWith("place:") || url.startsWith("about:")) {
                continue;
            }

            fetch(url).then(response => {
                if (!response.ok) {
                    error(bookmark, response.status);
                }
            }).catch(_ => error(bookmark, _.type))
        }
    });
}

main();
