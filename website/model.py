from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func


class User(db.Model,UserMixin):
      id = db.Column(db.Integer, primary_key=True)
      email = db.Column(db.String(150), unique=True)
      user_name = db.Column(db.string(150))
      password= db.Column(db.String(100))
      
      def __repr__(self):
            return f'<user {self.email}>'