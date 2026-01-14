/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration.unregister();
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        }
    });

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        const request = (coepCredentialless && r.mode === "no-cors" && r.url.indexOf("cross-origin-isolation=false") === -1) ?
            new Request(r, {
                credentials: "omit",
            }) : r;
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    if (!newHeaders.get("Cross-Origin-Opener-Policy")) {
                        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                    }

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });

} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coepDegrading = (reloadedBySelf == "coep");

        if (window.navigator.serviceWorker && window.location.hostname !== 'localhost') {
            const n = window.navigator.serviceWorker;
            n.register(window.document.currentScript.src).then(
                (registration) => {
                    registration.addEventListener("updatefound", () => {
                        window.location.reload();
                    });

                    if (registration.active && !n.controller) {
                        window.location.reload();
                    }
                },
                (err) => {
                    console.error("COI Service Worker failed to register:", err);
                }
            );
        }

        // Code to reload the page if we're not in a cross-origin isolated environment
        if (!window.crossOriginIsolated && !coepDegrading) {
            const n = window.navigator.serviceWorker;
            if (n) {
                n.ready.then((registration) => {
                    if (n.controller) {
                        window.sessionStorage.setItem("coiReloadedBySelf", "coep");
                        window.location.reload();
                    }
                });
            }
        }

    })();
}
