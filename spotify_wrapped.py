import spotipy
from spotipy.oauth2 import SpotifyOAuth
import customtkinter as ctk
import threading

# Configuration
CLIENT_ID = "a6c767ba702741c7990e27b4ed77445c"
CLIENT_SECRET = "8c26fc475aa14ae3a26aaed3f1d55881"
REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPE = "user-top-read"

class SpotifyWrappedApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Spotify Listening History")
        self.geometry("600x500")
        
        # Configure grid layout
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        self.header_label = ctk.CTkLabel(self, text="Your Spotify Wrapped", font=("Roboto", 24))
        self.header_label.grid(row=0, column=0, padx=20, pady=20)

        # Results Area
        self.textbox = ctk.CTkTextbox(self, width=500, height=300)
        self.textbox.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        self.textbox.insert("0.0", "Click 'Fetch Top Tracks' to see your listening history.\n\n(A browser window may open for you to log in to Spotify)")
        self.textbox.configure(state="disabled")

        # Button
        self.fetch_button = ctk.CTkButton(self, text="Fetch Top Tracks", command=self.start_fetch_thread)
        self.fetch_button.grid(row=2, column=0, padx=20, pady=20)

    def start_fetch_thread(self):
        self.fetch_button.configure(state="disabled", text="Fetching...")
        thread = threading.Thread(target=self.fetch_top_tracks)
        thread.start()

    def fetch_top_tracks(self):
        try:
            sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET,
                redirect_uri=REDIRECT_URI,
                scope=SCOPE
            ))

            results = sp.current_user_top_tracks(limit=10, time_range="short_term")
            
            display_text = "Your Top 10 Tracks (last 4 weeks):\n\n"
            for i, item in enumerate(results['items']):
                track = item['name']
                artist = item['artists'][0]['name']
                display_text += f"{i+1}. {track} by {artist}\n"

            self.update_textbox(display_text)

        except Exception as e:
            self.update_textbox(f"Error: {str(e)}")
        
        finally:
            self.fetch_button.configure(state="normal", text="Fetch Top Tracks")

    def update_textbox(self, text):
        self.textbox.configure(state="normal")
        self.textbox.delete("0.0", "end")
        self.textbox.insert("0.0", text)
        self.textbox.configure(state="disabled")

if __name__ == "__main__":
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")
    
    app = SpotifyWrappedApp()
    app.mainloop()
