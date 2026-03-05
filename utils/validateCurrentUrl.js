export function validateCurrentUrl(url) {

    if (!url.startsWith("/")) {
        url = "/";
    };

    return url;

};