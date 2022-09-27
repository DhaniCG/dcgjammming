
let accessToken;

const client_id = '';
const client_secret = '';
const redirect_uri = 'http://localhost:3000/';

let Spotify = {
    getAccessToken() {
        if (accessToken) return accessToken;

        // if the accessToken is not yet setup, then code below will run to check if it's already set in the url
        const accessTokenParam = window.location.href.match(/access_token=([^&]*)/); // checks and returns (if available) the value from the url since "access_token=" all the way to before the next "&" symbol and also returns the value only taken from the RegExp (in this one, excludes the "access_token=" part)
        const expiration = window.location.href.match(/expires_in=([^&]*)/);

        // This will clears the parameters from url
        if (accessTokenParam && expiration) {
            accessToken = accessTokenParam[1]

            setTimeout(() => accessToken = '', Number(expiration[1]) * 1000); // Converts "expiration" into number because it returns string of number from the url
            window.history.pushState('Access Token', null, '/'); // pushState(state, unused, url) is used to create a new history into the browser, and the "url" will be pushed into the browser's url

            
            return accessToken;
        } else {
            window.location = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirect_uri}`;
        }
    },

    search(term) {
        const userAccessToken = this.getAccessToken;
        let url = 'https://api.spotify.com/v1/search?'; // get this url from the API Reference
        let endpoint = `type=track&q=${term}`; // get these endponts from the API Reference in "Query" section
        
        // GET Request
        return fetch((url + endpoint), {headers: {Authorization: `Bearer ${userAccessToken}`}})
            .then(response => {
                return response.json();
            })
            .then(jsonResponse => {
                if (!jsonResponse.tracks) return [];
                return jsonResponse.tracks.items.map(track => {
                    return {
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        uri: track.uri
                    };
                });
            });
    },

    savePlaylist(playlistName, trackURIs) {
        if (!playlistName || !trackURIs.length) return;

        const currentAccessToken = this.getAccessToken();
        const headers = {headers: {Authorization: `Bearer ${currentAccessToken}`}};
        let userID;

        return fetch('https://api.spotify.com/v1/me', {headers: headers}) // getting user's ID
            .then(response => {
                if (response.ok) return response.json();
            })
            .then(jsonResponse => {
                userID = jsonResponse.id;

                // POST Request
                return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, { // getting playlist's ID
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({name: playlistName})
                })
                    .then(response => {
                        if (response.ok) return response.json();
                    })
                    .then(jsonResponse => {
                        const playlistID = jsonResponse.id;
                        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
                            headers: headers,
                            method: 'POST',
                            body: JSON.stringify({uris: trackURIs})
                        })
                        // .then(response => {
                        //     return response.json();
                        // })
                    });
            });
    }
}

export default Spotify;
