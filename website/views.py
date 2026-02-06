"""
views.py - Main Application Routes with Slot Machine Logic
===========================================================
This file contains routes for the main application and the game logic.
"""

from flask import render_template, Blueprint, jsonify, request
from flask_login import login_required, current_user
import random

# Create views blueprint
views = Blueprint('views', __name__)


# Available symbols for the slot machine
# These match the emojis in your JavaScript
SYMBOLS = ["🍒", "🔔", "💎", "🍋", "🍀", "🎰"]

# Payout multipliers based on matching symbols
PAYOUTS = {
    3: 10,  # All 3 symbols match = 10x bet
    2: 3,   # 2 symbols match = 3x bet
    1: 0,   # 1 symbol match = no win
    0: 0    # No match = no win
}


@views.route('/')
@login_required
def home():
    """
    Home Page Route - The slot machine game
    
    This renders the main game page with the slot machine.
    User must be logged in to access this page.
    """
    return render_template('base.html', user=current_user)


@views.route('/spin', methods=['POST'])
@login_required
def spin():
    """
    Spin API Endpoint
    
    This handles the slot machine spin logic:
    1. Receives bet amount from frontend
    2. Generates random reel results
    3. Calculates win/loss
    4. Returns results to frontend
    
    Expected JSON input:
        { "bet": 50 }
    
    Returns JSON:
        {
            "reels": [["🍒", "🔔", "💎"], ["🍋", "🍀", "🎰"], ["💎", "🍒", "🔔"]],
            "win": true/false,
            "payout": 150,
            "balance": 1150
        }
    """
    
    try:
        # Get bet amount from request
        data = request.get_json()
        bet_amount = data.get('bet', 0)
        
        # Validate bet amount
        if bet_amount <= 0:
            return jsonify({
                'error': 'Invalid bet amount',
                'message': 'Bet must be greater than 0'
            }), 400
        
        # Generate random results for each reel
        # Each reel shows 3 symbols (top, middle, bottom)
        # The middle row is the active payline
        reels = []
        for i in range(3):  # 3 reels
            reel_symbols = []
            for j in range(3):  # 3 symbols per reel (top, middle, bottom)
                symbol = random.choice(SYMBOLS)
                reel_symbols.append(symbol)
            reels.append(reel_symbols)
        
        # Extract the middle row (payline) for win calculation
        # Index 1 is the middle symbol of each reel
        payline = [reels[0][1], reels[1][1], reels[2][1]]
        
        # Calculate matches
        matches = calculate_matches(payline)
        
        # Calculate payout
        payout = 0
        is_win = False
        
        if matches >= 2:  # At least 2 symbols match
            is_win = True
            payout = bet_amount * PAYOUTS[matches]
        
        # In a real app, you would update the database here
        # Example:
        # user_balance = current_user.balance
        # if user_balance >= bet_amount:
        #     current_user.balance -= bet_amount  # Deduct bet
        #     if is_win:
        #         current_user.balance += payout  # Add winnings
        #     db.session.commit()
        
        # For now, we'll just return a mock balance
        # You can integrate with your User model later
        
        # Return results
        return jsonify({
            'reels': reels,
            'win': is_win,
            'payout': payout,
            'balance': 1000  # Mock balance - replace with actual user balance
        })
    
    except Exception as e:
        print(f"Error in spin: {e}")
        return jsonify({
            'error': 'Server error',
            'message': 'An error occurred while spinning'
        }), 500


def calculate_matches(payline):
    """
    Calculate how many symbols match in the payline
    
    Args:
        payline: List of 3 symbols [symbol1, symbol2, symbol3]
    
    Returns:
        int: Number of matching symbols (0, 1, 2, or 3)
    
    Examples:
        ['🍒', '🍒', '🍒'] -> 3 (all match)
        ['🍒', '🍒', '🔔'] -> 2 (first two match)
        ['🍒', '🔔', '🍒'] -> 2 (first and last match)
        ['🍒', '🔔', '💎'] -> 0 (none match)
    """
    
    # Check if all 3 match
    if payline[0] == payline[1] == payline[2]:
        return 3
    
    # Check if any 2 match
    elif payline[0] == payline[1] or payline[1] == payline[2] or payline[0] == payline[2]:
        return 2
    
    # No matches
    else:
        return 0


# Future enhancement: Add balance management
@views.route('/balance', methods=['GET'])
@login_required
def get_balance():
    """
    Get current user balance
    
    Returns user's current balance.
    In the future, this will fetch from the database.
    """
    # TODO: Integrate with User model
    # balance = current_user.balance
    
    return jsonify({
        'balance': 1000  # Mock balance
    })


# Future enhancement: Add game history
@views.route('/history', methods=['GET'])
@login_required
def get_history():
    """
    Get user's game history
    
    Returns list of recent games.
    This would require a Game model in the database.
    """
    # TODO: Query database for user's games
    # games = Game.query.filter_by(user_id=current_user.id).limit(10).all()
    
    return jsonify({
        'history': []  # Mock empty history
    })



