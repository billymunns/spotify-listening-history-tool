import spotipy
from spotipy.oauth2 import SpotifyOAuth

#credentials
CLIENT_ID = "a6c767ba702741c7990e27b4ed77445c"
CLIENT_SECRET = "8c26fc475aa14ae3a26aaed3f1d55881"
REDIRECT_URI = "http://127.0.0.1:8888/callback"  

scope = "user-top-read"

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=scope
))

#top 10 tracks
results = sp.current_user_top_tracks(limit=10, time_range="short_term")

print("Your Top 10 Tracks (last 4 weeks):")
for i, item in enumerate(results['items']):
    track = item['name']
    artist = item['artists'][0]['name']
    print(f"{i+1}. {track} by {artist}")
