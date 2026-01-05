from flask import Flask, render_template, request, jsonify
import random
app = Flask(__name__)

SYMBOLS = ["🍒", "🔔", "💎", "🍋", "🍀", "🎰"]
PAYOUTS = {
    "🍒" : 2, 
    "🔔" : 4,
    "💎" : 5,
    "🍋" : 6,
    "🍀" : 7,
    "🎰" : 10 }

@app.route("/")
def index():
    html = render_template("index.html")
    return html

@app.route("/spin", methods = ["POST"])
def spin():
    reels = [ random.sample(SYMBOLS, 3),
             random.sample(SYMBOLS, 3),
             random.sample(SYMBOLS, 3),]
    
    #Win Logic

    middle = [reels[0][1], reels[1][1], reels[2][1]]
    win = len(set(middle)) == 1


    payout = PAYOUTS[middle[0]] * 50 if win else 0

    return jsonify({
        "reels" : reels,
        "win" : win,
        "payout": payout
    })
    


if __name__ == "__main__":
    app.run(debug = True)